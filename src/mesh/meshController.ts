import { MeshService } from './MeshService';
import { MockBleTransport } from './MockBleTransport';
import { RealBleTransport } from './RealBleTransport';
import { useDiscoveryStore } from '../state/discoveryStore';
import { useChatStore } from '../state/chatStore';
import { usePresenceStore } from '../state/presenceStore';
import { useProfileStore } from '../state/profileStore';
import { useAvatarStore } from '../state/avatarStore';
import { useBlockStore } from '../state/blockStore';
import { useIdentityStore } from '../state/identityStore';
import { notifyPrivateMessage } from '../notifications/notifier';
import { requestBlePermissions } from '../utils/permissions';
import { newId } from '../utils/id';
import { shortHash } from '../utils/hash';
import { formatLocation, normalizeLocation } from '../utils/location';
import { venueOf } from '../venues';
import type {
  ChatMessage,
  PresenceAlert,
  PresenceReaction,
  Profile,
  ProfilePacket,
  ReactionKind,
  ReplyQuote,
} from '../types';

/**
 * Real BLE. Set back to true to get the simulated cabin (fake passengers,
 * no radio), which is the only way to see the UI work in a simulator - real
 * Bluetooth needs two physical phones.
 */
export const USE_MOCK_MESH = false;

/** How often we re-announce who we are, so latecomers and stale lists heal themselves. */
const PROFILE_ANNOUNCE_MS = 10_000;

/**
 * Don't ask the same person for their photo more often than this. A photo
 * takes a while to cross the cabin, and their profile beat arrives every ten
 * seconds: without this, we would ask again while the first answer was still
 * being sent, and the two copies would fight over the same radio.
 */
const AVATAR_REQUEST_COOLDOWN_MS = 45_000;

/** Same idea in the other direction: one photo per asker per window, however often they ask. */
const AVATAR_SEND_COOLDOWN_MS = 20_000;

/**
 * How many photos may be on their way to us at once.
 *
 * Walking into a full carriage means seeing twenty profiles in the same
 * second, and asking all twenty for their face at once puts a few hundred
 * frames into the radio before anybody has typed a word. Two at a time
 * costs nothing in perceived speed - the faces still fill in within
 * seconds - and leaves the link free for what people actually came for.
 */
const MAX_AVATARS_IN_FLIGHT = 2;

/**
 * How long a request counts as still in flight. Long enough for a slow
 * answer to arrive over several hops, short enough that a phone that walked
 * away doesn't hold a slot until the app is closed.
 */
const AVATAR_IN_FLIGHT_MS = 30_000;

let service: MeshService | null = null;
let announceTimer: ReturnType<typeof setInterval> | null = null;
/**
 * Reads a profile announcement defensively, upgrading one from an older
 * build (bare seat, no venue) and rejecting anything we can't render.
 */
function normalizeProfile(packet: ProfilePacket): Profile | null {
  if (typeof packet?.id !== 'string' || packet.id.length === 0) return null;
  if (typeof packet.nickname !== 'string' || packet.nickname.length === 0) return null;

  // An older peer put its seat at the top level of the profile; a current
  // one sends a location. Either shape is readable.
  const location = normalizeLocation(packet.location ?? (packet as { seat?: unknown }).seat);
  if (!location) return null;

  return {
    id: packet.id,
    nickname: packet.nickname.slice(0, 24),
    location,
    contact: typeof packet.contact === 'string' ? packet.contact.slice(0, 40) : undefined,
  };
}

/**
 * The label to show for something that came off the radio. Current peers
 * send it ready to draw; older ones send the seat it was made from.
 */
function labelOf(packet: { fromLabel?: string; label?: string; fromSeat?: unknown; seat?: unknown }): string {
  const sent = packet.fromLabel ?? packet.label;
  if (typeof sent === 'string' && sent.length > 0) return sent;
  const location = normalizeLocation(packet.fromSeat ?? packet.seat);
  return location ? formatLocation(location) : '·';
}

/** Bluetooth device ids already greeted, so the duplicate scan hits don't re-announce endlessly. */
const greeted = new Set<string>();
/** profile id -> when we last asked them for their photo / last sent them ours. */
const avatarRequestedAt = new Map<string, number>();
const avatarSentAt = new Map<string, number>();
/** profile id -> when a thumbnail request went out and hasn't been answered yet. */
const avatarsInFlight = new Map<string, number>();

/** Forgets the requests that were never answered, so their slots come back. */
function inFlightCount(): number {
  const cutoff = Date.now() - AVATAR_IN_FLIGHT_MS;
  for (const [peerId, at] of avatarsInFlight) {
    if (at < cutoff) avatarsInFlight.delete(peerId);
  }
  return avatarsInFlight.size;
}
/** The last moment we told each person we had read up to, so we don't repeat ourselves. */
const lastReceiptSent = new Map<string, number>();

/** Wires mesh events into the zustand stores. Call once, after the local profile is ready. */
export async function startMesh(myProfile: Profile): Promise<MeshService> {
  if (service) return service;

  if (!USE_MOCK_MESH) await requestBlePermissions();

  const transport = USE_MOCK_MESH ? new MockBleTransport() : new RealBleTransport();
  // Keys come from App.tsx, loaded before anything could get here; the
  // service only uses them if they match the profile id.
  service = new MeshService(transport, myProfile.id, useIdentityStore.getState().identity ?? undefined);

  service.on('peerSeen', (peerId) => {
    // Greet each newly spotted phone once. This is only a fast path: the
    // advert arrives before the GATT link is up, so this first attempt
    // usually reaches nobody and the periodic announcement below is what
    // actually gets our profile across.
    if (greeted.has(peerId)) return;
    greeted.add(peerId);
    void service?.broadcastProfile(myProfile, useAvatarStore.getState().myAvatarHash());
  });

  service.on('peerLost', (peerId) => {
    greeted.delete(peerId);
  });

  // Keyed by the profile's own id, not the Bluetooth device id: the latter
  // is assigned per scanning phone, so the two never matched and profiles
  // landed under an id nothing else in the app ever looked up.
  service.on('profile', (_peerId, packet) => {
    if (useBlockStore.getState().isMuted(packet.id)) return;
    // Everything past this line is untyped input from another phone, which
    // may be running an older build (a profile was a bare seat then) or a
    // newer one. A profile we can't read is dropped rather than stored:
    // downstream it would be a badge calling `.kind` on undefined, and that
    // took down the whole passenger list.
    const profile = normalizeProfile(packet);
    if (!profile) return;

    // The fingerprint rides along with the profile but isn't part of it:
    // the passenger list stores who someone is, not what their photo looks
    // like.
    const { avatarHash } = packet;
    useDiscoveryStore.getState().setProfile(profile, service?.isSecureWith(profile.id) ?? false);
    // Their announcement carries the fingerprint of the photo they are
    // showing. If it isn't the one we hold, ask for it - now, and again on
    // every beat until it arrives. Photos used to be pushed once, the first
    // time someone appeared: hundreds of frames with no acknowledgement and
    // no second chance, so whichever direction happened to lose a frame
    // never showed a photo at all. Asking until satisfied is what makes both
    // phones end up with both photos.
    // No fingerprint at all: that phone hasn't said, so leave the photo we
    // have alone. Only an explicit empty one means they took it down.
    if (avatarHash === undefined) return;
    if (avatarHash === '') {
      useAvatarStore.getState().clearPeerAvatar(profile.id);
      return;
    }
    // Only ever the thumbnail here: twenty frames, and it is what the
    // lists and the bubbles show. The big portrait is asked for by the one
    // screen that can actually show it - see requestFullAvatar.
    // Any size of the right photo is enough to leave them alone: a portrait
    // read off disk from the build that knew one size counts, and asking for
    // a face we would never show is 22 frames each, for everyone at once.
    const held = useAvatarStore.getState().peerAvatars[profile.id];
    if (held?.hash === avatarHash && (held.thumb !== undefined || held.full !== undefined)) return;

    const askedAt = avatarRequestedAt.get(profile.id) ?? 0;
    if (Date.now() - askedAt < AVATAR_REQUEST_COOLDOWN_MS) return;
    // Nobody is waiting on any one face, so a queue would only add a way to
    // get stuck: the profile beat comes round every ten seconds and asks
    // again for whoever didn't fit this time.
    if (inFlightCount() >= MAX_AVATARS_IN_FLIGHT) return;

    avatarRequestedAt.set(profile.id, Date.now());
    avatarsInFlight.set(profile.id, Date.now());
    void service?.requestAvatar(profile.id);
  });

  service.on('avatarRequest', (fromId, full) => {
    // One cooldown per size: someone who just took our face and then opened
    // our card is asking for something they genuinely don't have, and making
    // them wait twenty seconds for it would look like the card was broken.
    const key = full ? `${fromId}:full` : fromId;
    const sentAt = avatarSentAt.get(key) ?? 0;
    if (Date.now() - sentAt < AVATAR_SEND_COOLDOWN_MS) return;
    avatarSentAt.set(key, Date.now());
    void sendMyAvatarTo(fromId, full);
  });

  service.on('avatar', (avatar) => {
    if (useBlockStore.getState().isMuted(avatar.fromId)) return;
    if (typeof avatar.imageBase64 !== 'string' || avatar.imageBase64.length === 0) return;
    avatarsInFlight.delete(avatar.fromId);
    // A photo from a phone running the build before thumbnails existed
    // carries no fingerprint. Hashing what arrived is right there and only
    // there: that build sent the one photo its own hash was made from.
    const hash = typeof avatar.hash === 'string' && avatar.hash.length > 0 ? avatar.hash : shortHash(avatar.imageBase64);
    useAvatarStore.getState().setPeerAvatar(avatar.fromId, hash, avatar.imageBase64, avatar.full === true);
  });

  service.on('message', (packet) => {
    if (useBlockStore.getState().isMuted(packet.fromId)) return;
    // Same boundary as the profile above: an older peer labels its messages
    // with the seat they were sent from rather than a label ready to draw,
    // which would otherwise show as an empty badge.
    const message: ChatMessage = { ...packet, fromLabel: labelOf(packet), viaMesh: true };

    if (message.scope === 'group') {
      useChatStore.getState().addGroupMessage(message);
      return;
    }

    const incoming = message.fromId !== myProfile.id;
    const peerId = incoming ? message.fromId : message.toId!;
    useChatStore.getState().addPrivateMessage(peerId, message, incoming);
    // Nothing on screen is going to show it if the phone is in a pocket.
    if (incoming) void notifyPrivateMessage(message);
  });

  service.on('presence', (alert) => {
    if (useBlockStore.getState().isMuted(alert.fromId)) return;
    usePresenceStore.getState().applyAlert({ ...alert, label: labelOf(alert) });
  });

  service.on('read', (receipt) => {
    if (useBlockStore.getState().isMuted(receipt.fromId)) return;
    useChatStore.getState().noteReadUpTo(receipt.fromId, receipt.upTo);
  });

  service.on('reaction', (reaction) => {
    if (useBlockStore.getState().isMuted(reaction.fromId)) return;
    usePresenceStore.getState().applyReaction({ ...reaction, fromLabel: labelOf(reaction) });
  });

  await service.start(myProfile.location);
  await service.broadcastProfile(myProfile, useAvatarStore.getState().myAvatarHash());

  // The announcements above and on `peerSeen` both fire before any GATT
  // link exists, so they reach nobody and nothing ever retried them: that
  // is why the group chat worked (its messages carry the sender's name and
  // seat inside) while the passenger list stayed empty. Re-announcing on a
  // timer fixes that, and keeps the list fresh for people who join later
  // or who edit their profile.
  if (announceTimer) clearInterval(announceTimer);
  announceTimer = setInterval(() => {
    void service?.broadcastProfile(
      useProfileStore.getState().profile ?? myProfile,
      useAvatarStore.getState().myAvatarHash(),
    );
    useDiscoveryStore.getState().pruneStale();
  }, PROFILE_ANNOUNCE_MS);

  return service;
}

export async function sendGroupChatMessage(myProfile: Profile, body: string, replyTo?: ReplyQuote) {
  if (!service) return;
  const message: ChatMessage = {
    id: newId(),
    scope: 'group',
    fromId: myProfile.id,
    fromLabel: formatLocation(myProfile.location),
    fromNickname: myProfile.nickname,
    body,
    replyTo,
    sentAt: Date.now(),
  };
  useChatStore.getState().addGroupMessage(message);
  await service.sendGroupMessage(message);
}

export async function sendPrivateChatMessage(
  myProfile: Profile,
  toId: string,
  body: string,
  imageBase64?: string,
  replyTo?: ReplyQuote,
) {
  if (!service) return;
  const message: ChatMessage = {
    id: newId(),
    scope: 'private',
    fromId: myProfile.id,
    fromLabel: formatLocation(myProfile.location),
    fromNickname: myProfile.nickname,
    toId,
    body,
    imageBase64,
    replyTo,
    sentAt: Date.now(),
  };
  useChatStore.getState().addPrivateMessage(toId, message);
  await service.sendPrivateMessage(message);
}

/**
 * Toggles the one-tap announcement: the first press broadcasts it (an active
 * alert, shown to everyone); pressing it again broadcasts the cancellation
 * with the *same* alert id, which clears it everywhere - not just on this
 * phone. If that never arrives (app closed, out of range), the alert's own
 * `expiresAt` clears it after a while regardless.
 *
 * What it announces depends on the venue: being out of your seat on a plane,
 * or a machine about to be free in a gym. The status travels with the alert,
 * so it keeps that meaning on a phone whose owner chose a different venue.
 */
export async function togglePresence(myProfile: Profile) {
  if (!service) return;
  const currentId = usePresenceStore.getState().myActiveAlertId;
  const status = venueOf(myProfile.location.kind).alertStatus;

  if (currentId) {
    const alert: PresenceAlert = {
      id: currentId,
      fromId: myProfile.id,
      label: formatLocation(myProfile.location),
      status,
      active: false,
      startedAt: Date.now(),
      expiresAt: Date.now(),
    };
    usePresenceStore.getState().applyAlert(alert);
    await service.sendPresenceAlert(alert);
    return;
  }

  const alert: PresenceAlert = {
    id: newId(),
    fromId: myProfile.id,
    label: formatLocation(myProfile.location),
    status,
    active: true,
    startedAt: Date.now(),
    expiresAt: Date.now() + 5 * 60_000,
  };
  // Broadcasts never loop back to the sender (see MeshRouter.send), so - same
  // as the group/private send helpers above - add it locally before sending.
  usePresenceStore.getState().applyAlert(alert);
  usePresenceStore.getState().setMyActiveAlertId(alert.id);
  await service.sendPresenceAlert(alert);
}

/** Answers one person's request for our photo. Nothing else ever puts a photo on the radio. */
async function sendMyAvatarTo(toId: string, full: boolean) {
  const { myAvatar, myThumb, myAvatarHash } = useAvatarStore.getState();
  const myProfile = useProfileStore.getState().profile;
  const image = full ? myAvatar : myThumb;
  const hash = myAvatarHash();
  if (!service || !image || !myProfile || !hash) return;
  await service.sendAvatar({ fromId: myProfile.id, imageBase64: image, hash, full, sentAt: Date.now() }, toId);
}

/**
 * Asks someone for the big version of their photo, which only the screens
 * that show it large ever do.
 *
 * Everyone nearby gets the 64px face automatically; the 256px portrait is
 * five times the frames and would be wasted on the twenty people whose card
 * nobody opens. Doing nothing when the portrait is already here is what
 * keeps reopening a card free.
 */
export async function requestFullAvatar(peerId: string) {
  const held = useAvatarStore.getState().peerAvatars[peerId];
  // No hash yet means their profile hasn't arrived; the beat will bring it
  // and the thumbnail request that follows.
  if (!held || held.full !== undefined) return;
  const key = `${peerId}:full`;
  const askedAt = avatarRequestedAt.get(key) ?? 0;
  if (Date.now() - askedAt < AVATAR_REQUEST_COOLDOWN_MS) return;
  avatarRequestedAt.set(key, Date.now());
  // Deliberately outside the in-flight budget: this one was asked for by
  // someone looking at the screen right now, unlike the faces that fill
  // themselves in.
  await service?.requestAvatar(peerId, true);
}

/**
 * Called when the user picks or removes a photo. It doesn't send the photo:
 * it re-announces the profile, whose new fingerprint tells everyone that
 * what they hold for us is out of date, and they ask for the new one. That
 * way the photo only crosses the cabin towards people who actually want it.
 */
export async function announceAvatarChange() {
  const myProfile = useProfileStore.getState().profile;
  if (!service || !myProfile) return;
  // Let them ask again straight away rather than sitting out the cooldown
  // from the previous photo.
  avatarSentAt.clear();
  avatarsInFlight.clear();
  await service.broadcastProfile(myProfile, useAvatarStore.getState().myAvatarHash());
}

/**
 * Tells someone we have read what they sent us, up to their newest message.
 *
 * One mark for the whole conversation rather than one per message, and
 * sending it again is harmless - which is what makes it survive a radio
 * that loses things. Nothing is sent when there is nothing new to
 * acknowledge, so an open chat doesn't chatter.
 */
export async function sendReadReceipt(myProfile: Profile, toId: string) {
  if (!service) return;
  const upTo = useChatStore.getState().newestIncoming(toId, myProfile.id);
  if (upTo === 0) return;
  if (lastReceiptSent.get(toId) === upTo) return;
  lastReceiptSent.set(toId, upTo);
  await service.sendReadReceipt({ fromId: myProfile.id, toId, upTo });
}

/** Reacts to someone else's stand-up alert. Broadcasts don't loop back, so it lands locally first. */
export async function sendPresenceReaction(myProfile: Profile, alertId: string, kind: ReactionKind) {
  if (!service) return;
  const reaction: PresenceReaction = {
    id: newId(),
    alertId,
    fromId: myProfile.id,
    fromLabel: formatLocation(myProfile.location),
    kind,
    sentAt: Date.now(),
  };
  usePresenceStore.getState().applyReaction(reaction);
  await service.sendPresenceReaction(reaction);
}

/**
 * Re-floods our profile after the user edits their seat, name or contact.
 * Without this, everyone else keeps labelling our messages with the old
 * details until they happen to rediscover us.
 */
export async function announceProfileUpdate(myProfile: Profile) {
  if (!service) return;
  await service.broadcastProfile(myProfile, useAvatarStore.getState().myAvatarHash());
}

export function getMeshService(): MeshService | null {
  return service;
}
