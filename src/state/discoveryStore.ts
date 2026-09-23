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

/**
 * How many forgotten profiles are still kept, newest first, for as long as
 * the app runs: enough that tapping the name of someone who left an hour
 * ago still opens their card, not so many that a day in a busy station
 * piles up without end.
 */
const MAX_FORGOTTEN = 200;

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
  /**
   * Profiles of people the radio forgot (see FORGET_AFTER_MS), oldest
   * first. The passenger list doesn't show them - they are not here - but
   * their card still opens from a name in the group chat.
   */
  forgotten: Record<string, Profile>;

  /** `secure`: they announced keys we checked, so what we send them privately is sealed. */
  setProfile: (profile: Profile, secure?: boolean) => void;
  pruneStale: () => void;
}

export const useDiscoveryStore = create<DiscoveryState>((set, get) => ({
  peers: {},
  forgotten: {},

  setProfile: (profile, secure = false) =>
    set((state) => {
      const forgotten = state.forgotten[profile.id] ? { ...state.forgotten } : state.forgotten;
      if (forgotten !== state.forgotten) delete forgotten[profile.id];
      return {
        peers: {
          ...state.peers,
          [profile.id]: { peerId: profile.id, profile, lastSeenAt: Date.now(), secure },
        },
        forgotten,
      };
    }),

  pruneStale: () => {
    const cutoff = Date.now() - FORGET_AFTER_MS;
    const entries = Object.entries(get().peers);
    const alive = Object.fromEntries(entries.filter(([, peer]) => peer.lastSeenAt > cutoff));
    if (Object.keys(alive).length === entries.length) return;

    const forgotten = { ...get().forgotten };
    for (const [peerId, peer] of entries) {
      if (peer.lastSeenAt > cutoff || !peer.profile) continue;
      delete forgotten[peerId]; // re-added last: the newest stay
      forgotten[peerId] = peer.profile;
    }
    const ids = Object.keys(forgotten);
    ids.slice(0, Math.max(0, ids.length - MAX_FORGOTTEN)).forEach((peerId) => delete forgotten[peerId]);
    set({ peers: alive, forgotten });
  },
}));
