import { create } from 'zustand';
import type { DiscoveredPeer, Profile, Seat } from '../types';

interface DiscoveryState {
  peers: Record<string, DiscoveredPeer>;
  likedByMe: Set<string>;
  likedMe: Set<string>;

  upsertPeer: (peerId: string, seat: Seat | null) => void;
  removePeer: (peerId: string) => void;
  setProfile: (peerId: string, profile: Profile) => void;
  recordOutgoingLike: (peerId: string) => void;
  recordIncomingLike: (peerId: string) => void;
  hasMutualLike: (peerId: string) => boolean;
}

export const useDiscoveryStore = create<DiscoveryState>((set, get) => ({
  peers: {},
  likedByMe: new Set(),
  likedMe: new Set(),

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
          directlyConnectable: true,
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
          directlyConnectable: true,
        },
      },
    })),

  recordOutgoingLike: (peerId) => set((state) => ({ likedByMe: new Set(state.likedByMe).add(peerId) })),
  recordIncomingLike: (peerId) => set((state) => ({ likedMe: new Set(state.likedMe).add(peerId) })),
  hasMutualLike: (peerId) => get().likedByMe.has(peerId) && get().likedMe.has(peerId),
}));
