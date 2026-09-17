import { MeshService } from './MeshService';
import { MockBleTransport } from './MockBleTransport';
import { RealBleTransport } from './RealBleTransport';
import { useDiscoveryStore } from '../state/discoveryStore';
import { useMatchStore } from '../state/matchStore';
import { useChatStore } from '../state/chatStore';
import { requestBlePermissions } from '../utils/permissions';
import type { Profile } from '../types';

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
    useDiscoveryStore.getState().upsertPeer(peerId, seat);
    void service?.sendProfile(peerId, myProfile);
  });

  service.on('peerLost', (peerId) => {
    useDiscoveryStore.getState().removePeer(peerId);
  });

  service.on('profile', (peerId, profile) => {
    useDiscoveryStore.getState().setProfile(peerId, profile);
  });

  service.on('swipe', (action) => {
    if (action.direction !== 'like') return;
    const discovery = useDiscoveryStore.getState();
    discovery.recordIncomingLike(action.fromId);
    if (discovery.hasMutualLike(action.fromId)) {
      const peer = discovery.peers[action.fromId];
      if (peer?.profile) useMatchStore.getState().addMatch(myProfile.id, action.fromId, peer.profile);
    }
  });

  service.on('chat', (message) => {
    useChatStore.getState().addMessage({ ...message, viaMesh: true });
  });

  await service.start(myProfile.seat);
  return service;
}

/** Sends a like/pass and creates the match locally the moment it becomes mutual. */
export async function swipeOn(myProfile: Profile, peerId: string, direction: 'like' | 'pass') {
  if (!service) return;
  const discovery = useDiscoveryStore.getState();
  if (direction === 'like') {
    discovery.recordOutgoingLike(peerId);
    if (discovery.hasMutualLike(peerId)) {
      const peer = discovery.peers[peerId];
      if (peer?.profile) useMatchStore.getState().addMatch(myProfile.id, peerId, peer.profile);
    }
  }
  await service.sendSwipe(peerId, direction);
}

export function getMeshService(): MeshService | null {
  return service;
}
