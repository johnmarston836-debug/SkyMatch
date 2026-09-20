import { MeshService } from './MeshService';
import { MockBleTransport } from './MockBleTransport';
import { RealBleTransport } from './RealBleTransport';
import { useDiscoveryStore } from '../state/discoveryStore';
import { useChatStore } from '../state/chatStore';
import { usePresenceStore } from '../state/presenceStore';
import { useProfileStore } from '../state/profileStore';
import { useAvatarStore } from '../state/avatarStore';
import { requestBlePermissions } from '../utils/permissions';
import { newId } from '../utils/id';
import type { ChatMessage, PresenceAlert, PresenceReaction, Profile, ReactionKind } from '../types';

/**
 * Real BLE. Set back to true to get the simulated cabin (fake passengers,
 * no radio), which is the only way to see the UI work in a simulator - real
 * Bluetooth needs two physical phones.
 */
export const USE_MOCK_MESH = false;

/** How often we re-announce who we are, so latecomers and stale lists heal themselves. */
const PROFILE_ANNOUNCE_MS = 10_000;

let service: MeshService | null = null;
let announceTimer: ReturnType<typeof setInterval> | null = null;
/** Bluetooth device ids already greeted, so the duplicate scan hits don't re-announce endlessly. */
const greeted = new Set<string>();

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
    void service?.broadcastProfile(myProfile);
  });

  service.on('peerLost', (peerId) => {
    greeted.delete(peerId);
  });

  // Keyed by the profile's own id, not the Bluetooth device id: the latter
  // is assigned per scanning phone, so the two never matched and profiles
  // landed under an id nothing else in the app ever looked up.
  service.on('profile', (_peerId, profile) => {
    const isNew = !useDiscoveryStore.getState().peers[profile.id];
    useDiscoveryStore.getState().setProfile(profile);
    // Their profile just arrived, so the link is definitely up - the one
    // moment worth spending a photo on. Never on the profile timer: at
    // hundreds of frames each, re-sending photos every few seconds would
    // leave no bandwidth for anything else.
    if (isNew) void sendMyAvatar();
  });

  service.on('avatar', (avatar) => {
    useAvatarStore.getState().setPeerAvatar(avatar.fromId, avatar.imageBase64);
  });

  service.on('message', (message) => {
    if (message.scope === 'group') {
      useChatStore.getState().addGroupMessage({ ...message, viaMesh: true });
    } else {
      const peerId = message.fromId === myProfile.id ? message.toId! : message.fromId;
      useChatStore.getState().addPrivateMessage(peerId, { ...message, viaMesh: true });
    }
  });

  service.on('presence', (alert) => {
    usePresenceStore.getState().applyAlert(alert);
  });

  service.on('reaction', (reaction) => {
    usePresenceStore.getState().applyReaction(reaction);
  });

  await service.start(myProfile.seat);
  await service.broadcastProfile(myProfile);

  // The announcements above and on `peerSeen` both fire before any GATT
  // link exists, so they reach nobody and nothing ever retried them: that
  // is why the group chat worked (its messages carry the sender's name and
  // seat inside) while the passenger list stayed empty. Re-announcing on a
  // timer fixes that, and keeps the list fresh for people who join later
  // or who edit their profile.
  if (announceTimer) clearInterval(announceTimer);
  announceTimer = setInterval(() => {
    void service?.broadcastProfile(useProfileStore.getState().profile ?? myProfile);
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
    fromSeat: myProfile.seat,
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
    fromSeat: myProfile.seat,
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
 * Toggles the stand-up button: first press announces "I'm standing up"
 * (active alert, shown to everyone); pressing it again broadcasts "I'm back
 * in my seat" with the *same* alert id, which clears it everywhere - not
 * just on this phone. If that never arrives (app closed, out of range), the
 * alert's own `expiresAt` clears it after a while regardless.
 */
export async function toggleStandUp(myProfile: Profile) {
  if (!service) return;
  const currentId = usePresenceStore.getState().myActiveAlertId;

  if (currentId) {
    const alert: PresenceAlert = {
      id: currentId,
      fromId: myProfile.id,
      seat: myProfile.seat,
      status: 'standing',
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
    seat: myProfile.seat,
    status: 'standing',
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

/**
 * Sends our profile photo, if we have one. A photo is orders of magnitude
 * bigger than anything else on the mesh, so this is called sparingly: when a
 * new passenger appears, and when the photo itself changes.
 */
export async function sendMyAvatar() {
  const myAvatar = useAvatarStore.getState().myAvatar;
  const myProfile = useProfileStore.getState().profile;
  if (!service || !myAvatar || !myProfile) return;
  await service.sendAvatar({ fromId: myProfile.id, imageBase64: myAvatar, sentAt: Date.now() });
}

/** Reacts to someone else's stand-up alert. Broadcasts don't loop back, so it lands locally first. */
export async function sendPresenceReaction(myProfile: Profile, alertId: string, kind: ReactionKind) {
  if (!service) return;
  const reaction: PresenceReaction = {
    id: newId(),
    alertId,
    fromId: myProfile.id,
    fromSeat: myProfile.seat,
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
  await service.broadcastProfile(myProfile);
}

export function getMeshService(): MeshService | null {
  return service;
}
