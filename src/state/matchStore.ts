import { create } from 'zustand';
import type { Match, Profile } from '../types';
import { matchId as computeMatchId } from '../utils/id';

interface MatchState {
  matches: Record<string, Match>;
  latestMatchId: string | null;
  addMatch: (myId: string, peerId: string, peerProfile: Profile) => Match;
  clearLatest: () => void;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: {},
  latestMatchId: null,

  addMatch: (myId, peerId, peerProfile) => {
    const id = computeMatchId(myId, peerId);
    const existing = get().matches[id];
    if (existing) return existing;

    const match: Match = { id, peerId, peerProfile, matchedAt: Date.now() };
    set((state) => ({ matches: { ...state.matches, [id]: match }, latestMatchId: id }));
    return match;
  },

  clearLatest: () => set({ latestMatchId: null }),
}));
