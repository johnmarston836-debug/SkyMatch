import { create } from 'zustand';
import type { DiscoveredPeer, Profile } from '../types';

/** A passenger who hasn't re-announced in this long has left, or their phone locked. */
const PEER_STALE_MS = 45_000;

interface DiscoveryState {
  /** Keyed by profile id, which is also the address private messages are sent to. */
  peers: Record<string, DiscoveredPeer>;

  setProfile: (profile: Profile) => void;
  pruneStale: () => void;
}

export const useDiscoveryStore = create<DiscoveryState>((set, get) => ({
  peers: {},

  setProfile: (profile) =>
    set((state) => ({
      peers: {
        ...state.peers,
        [profile.id]: { peerId: profile.id, profile, lastSeenAt: Date.now() },
      },
    })),

  pruneStale: () => {
    const cutoff = Date.now() - PEER_STALE_MS;
    const alive = Object.fromEntries(Object.entries(get().peers).filter(([, peer]) => peer.lastSeenAt > cutoff));
    if (Object.keys(alive).length !== Object.keys(get().peers).length) set({ peers: alive });
  },
}));
