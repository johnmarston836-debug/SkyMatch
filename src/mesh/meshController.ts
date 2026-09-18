import { MeshService } from './MeshService';
import { MockBleTransport } from './MockBleTransport';
import { RealBleTransport } from './RealBleTransport';
import { useDiscoveryStore } from '../state/discoveryStore';
import { useChatStore } from '../state/chatStore';
import { usePresenceStore } from '../state/presenceStore';
import { requestBlePermissions } from '../utils/permissions';
import { newId } from '../utils/id';
import type { ChatMessage, Profile } from '../types';

/** Flip to false for real-device builds once you're testing on hardware. */
export const USE_MOCK_MESH = true;

let service: MeshService | null = null;

/** Wires mesh events into the zustand stores. Call once, after the local profile is ready. */
export async function startMesh(myProfile: Profile): Promise<MeshService> {
  if (service) return service;

  if (!USE_MOCK_MESH) await requestBlePermissions();

  const transport = USE_MOCK_MESH ? new MockBleTransport() : new RealBleTransport();
  service = new MeshService(transport, myProfile.id);

  service.on('peerSeen', (peerId, seat) => {
    const isNewPeer = !useDiscoveryStore.getState().peers[peerId];
    useDiscoveryStore.getState().upsertPeer(peerId, seat);
    // Broadcast (not targeted) so every newcomer picks it up too, not just this one peer.
    if (isNewPeer) void service?.broadcastProfile(myProfile);
  });

  service.on('peerLost', (peerId) => {
    useDiscoveryStore.getState().removePeer(peerId);
  });

  service.on('profile', (peerId, profile) => {
    useDiscoveryStore.getState().setProfile(peerId, profile);
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
    usePresenceStore.getState().addAlert(alert);
  });

  await service.start(myProfile.seat);
  await service.broadcastProfile(myProfile);
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

export async function announceBathroomBreak(myProfile: Profile) {
  if (!service) return;
  await service.sendPresenceAlert(myProfile.seat, 'bathroom');
}

export function getMeshService(): MeshService | null {
  return service;
}
