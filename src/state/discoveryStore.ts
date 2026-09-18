import { create } from 'zustand';
import type { DiscoveredPeer, Profile, Seat } from '../types';

interface DiscoveryState {
  peers: Record<string, DiscoveredPeer>;

  upsertPeer: (peerId: string, seat: Seat | null) => void;
  removePeer: (peerId: string) => void;
  setProfile: (peerId: string, profile: Profile) => void;
}

export const useDiscoveryStore = create<DiscoveryState>((set) => ({
  peers: {},

  upsertPeer: (peerId, seat) =>
    set((state) => ({
      peers: {
        ...state.peers,
        [peerId]: {
          ...state.peers[peerId],
          peerId,
          seat: seat ?? state.peers[peerId]?.seat,
          rssi: state.peers[peerId]?.rssi ?? -100,
          lastSeenAt: Date.now(),
        },
      },
    })),

  removePeer: (peerId) =>
    set((state) => ({
      peers: Object.fromEntries(Object.entries(state.peers).filter(([id]) => id !== peerId)),
    })),

  setProfile: (peerId, profile) =>
    set((state) => ({
      peers: {
        ...state.peers,
        [peerId]: {
          ...state.peers[peerId],
          peerId,
          profile,
          seat: profile.seat ?? state.peers[peerId]?.seat,
          rssi: state.peers[peerId]?.rssi ?? -100,
          lastSeenAt: Date.now(),
        },
      },
    })),
}));
