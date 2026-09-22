import { create } from 'zustand';
import type { DiscoveredPeer, Profile } from '../types';

/**
 * No profile beat for this long - three missed in a row - and someone is
 * shown as away: they left the app, locked their phone, or walked out of
 * range. Away rather than gone, because that is what it usually is, and a
 * passenger who vanished from the list the moment they checked another app
 * looked like the app had lost them.
 */
export const AWAY_AFTER_MS = 35_000;

/** Someone away this long is forgotten; they reappear the moment their next beat arrives. */
const FORGET_AFTER_MS = 10 * 60_000;

/** Whether the radio has stopped hearing from them (see AWAY_AFTER_MS). */
export function isAway(peer: Pick<DiscoveredPeer, 'lastSeenAt'>, now = Date.now()): boolean {
  return now - peer.lastSeenAt > AWAY_AFTER_MS;
}

/** Whole minutes since they were last heard, for "away · 3 min ago". */
export function minutesAway(peer: Pick<DiscoveredPeer, 'lastSeenAt'>, now = Date.now()): number {
  return Math.max(0, Math.floor((now - peer.lastSeenAt) / 60_000));
}

interface DiscoveryState {
  /** Keyed by profile id, which is also the address private messages are sent to. */
  peers: Record<string, DiscoveredPeer>;

  /** `secure`: they announced keys we checked, so what we send them privately is sealed. */
  setProfile: (profile: Profile, secure?: boolean) => void;
  pruneStale: () => void;
}

export const useDiscoveryStore = create<DiscoveryState>((set, get) => ({
  peers: {},

  setProfile: (profile, secure = false) =>
    set((state) => ({
      peers: {
        ...state.peers,
        [profile.id]: { peerId: profile.id, profile, lastSeenAt: Date.now(), secure },
      },
    })),

  pruneStale: () => {
    const cutoff = Date.now() - FORGET_AFTER_MS;
    const alive = Object.fromEntries(Object.entries(get().peers).filter(([, peer]) => peer.lastSeenAt > cutoff));
    if (Object.keys(alive).length !== Object.keys(get().peers).length) set({ peers: alive });
  },
}));
