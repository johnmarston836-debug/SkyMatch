import { MeshService } from './MeshService';
import { MockBleTransport } from './MockBleTransport';
import { RealBleTransport } from './RealBleTransport';
import { useDiscoveryStore } from '../state/discoveryStore';
import { useChatStore } from '../state/chatStore';
import { usePresenceStore } from '../state/presenceStore';
import { useProfileStore } from '../state/profileStore';
import { useAvatarStore } from '../state/avatarStore';
import { notifyPrivateMessage } from '../notifications/notifier';
import { requestBlePermissions } from '../utils/permissions';
import { newId } from '../utils/id';
import { formatLocation } from '../utils/location';
import { VENUES } from '../venues';
import type { ChatMessage, PresenceAlert, PresenceReaction, Profile, ReactionKind } from '../types';

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

let service: MeshService | null = null;
let announceTimer: ReturnType<typeof setInterval> | null = null;
/** Bluetooth device ids already greeted, so the duplicate scan hits don't re-announce endlessly. */
const greeted = new Set<string>();
/** profile id -> when we last asked them for their photo / last sent them ours. */
const avatarRequestedAt = new Map<string, number>();
const avatarSentAt = new Map<string, number>();

/** Wires mesh events into the zustand stores. Call once, after the local profile is ready. */
export async function startMesh(myProfile: Profile): Promise<MeshService> {
  if (service) return service;

  if (!USE_MOCK_MESH) await requestBlePermissions();

  const transport = USE_MOCK_MESH ? new MockBleTransport() : new RealBleTransport();
  service = new MeshService(transport, myProfile.id);

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
    // The fingerprint rides along with the profile but isn't part of it:
    // the passenger list stores who someone is, not what their photo looks
    // like.
    const { avatarHash, ...profile } = packet;
    useDiscoveryStore.getState().setProfile(profile);
    // Their announcement carries the fingerprint of the photo they are
    // showing. If it isn't the one we hold, ask for it - now, and again on
    // every beat until it arrives. Photos used to be pushed once, the first
    // time someone appeared: hundreds of frames with no acknowledgement and
    // no second chance, so whichever direction happened to lose a frame
    // never showed a photo at all. Asking until satisfied is what makes both
    // phones end up with both photos.
    if (avatarHash === undefined) {
      useAvatarStore.getState().clearPeerAvatar(profile.id);
      return;
    }
    if (useAvatarStore.getState().peerAvatarHashes[profile.id] === avatarHash) return;

    const askedAt = avatarRequestedAt.get(profile.id) ?? 0;
    if (Date.now() - askedAt < AVATAR_REQUEST_COOLDOWN_MS) return;
    avatarRequestedAt.set(profile.id, Date.now());
    void service?.requestAvatar(profile.id);
  });

  service.on('avatarRequest', (fromId) => {
    const sentAt = avatarSentAt.get(fromId) ?? 0;
    if (Date.now() - sentAt < AVATAR_SEND_COOLDOWN_MS) return;
    avatarSentAt.set(fromId, Date.now());
    void sendMyAvatarTo(fromId);
  });

  service.on('avatar', (avatar) => {
    useAvatarStore.getState().setPeerAvatar(avatar.fromId, avatar.imageBase64);
  });

  service.on('message', (message) => {
    if (message.scope === 'group') {
      useChatStore.getState().addGroupMessage({ ...message, viaMesh: true });
    } else {
      const incoming = message.fromId !== myProfile.id;
      const peerId = incoming ? message.fromId : message.toId!;
      useChatStore.getState().addPrivateMessage(peerId, { ...message, viaMesh: true }, incoming);
      // Nothing on screen is going to show it if the phone is in a pocket.
      if (incoming) void notifyPrivateMessage(message);
    }
  });

  service.on('presence', (alert) => {
    usePresenceStore.getState().applyAlert(alert);
  });

  service.on('reaction', (reaction) => {
    usePresenceStore.getState().applyReaction(reaction);
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

export async function sendGroupChatMessage(myProfile: Profile, body: string) {
  if (!service) return;
  const message: ChatMessage = {
    id: newId(),
    scope: 'group',
    fromId: myProfile.id,
    fromLabel: formatLocation(myProfile.location),
    fromNickname: myProfile.nickname,
    body,
    sentAt: Date.now(),
  };
  useChatStore.getState().addGroupMessage(message);
  await service.sendGroupMessage(message);
}

export async function sendPrivateChatMessage(myProfile: Profile, toId: string, body: string, imageBase64?: string) {
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
  const status = VENUES[myProfile.location.kind].alertStatus;

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
async function sendMyAvatarTo(toId: string) {
  const myAvatar = useAvatarStore.getState().myAvatar;
  const myProfile = useProfileStore.getState().profile;
  if (!service || !myAvatar || !myProfile) return;
  await service.sendAvatar({ fromId: myProfile.id, imageBase64: myAvatar, sentAt: Date.now() }, toId);
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
  await service.broadcastProfile(myProfile, useAvatarStore.getState().myAvatarHash());
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
