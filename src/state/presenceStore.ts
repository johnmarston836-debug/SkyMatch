import { create } from 'zustand';
import type { PresenceAlert, PresenceReaction } from '../types';

interface PresenceState {
  alerts: Record<string, PresenceAlert>; // keyed by alert id, active ones only
  /** The alert id *I* currently have active, if any - drives the stand-up button's on/off look. */
  myActiveAlertId: string | null;
  /** Reactions keyed by the alert they belong to. At most one per person per alert. */
  reactionsByAlert: Record<string, PresenceReaction[]>;

  /** Adds an active alert, or removes it (by id) when it arrives as "I'm back". */
  applyAlert: (alert: PresenceAlert) => void;
  setMyActiveAlertId: (id: string | null) => void;
  applyReaction: (reaction: PresenceReaction) => void;
  pruneExpired: () => void;
}

/** Reactions to an alert die with it, so a cleared banner doesn't leave orphans behind. */
function dropAlerts(state: PresenceState, ids: Set<string>) {
  return {
    alerts: Object.fromEntries(Object.entries(state.alerts).filter(([id]) => !ids.has(id))),
    reactionsByAlert: Object.fromEntries(
      Object.entries(state.reactionsByAlert).filter(([id]) => !ids.has(id)),
    ),
  };
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  alerts: {},
  myActiveAlertId: null,
  reactionsByAlert: {},

  applyAlert: (alert) => {
    if (!alert.active) {
      if (!get().alerts[alert.id]) return;
      set((state) => ({
        ...dropAlerts(state, new Set([alert.id])),
        myActiveAlertId: state.myActiveAlertId === alert.id ? null : state.myActiveAlertId,
      }));
      return;
    }
    if (get().alerts[alert.id]) return;
    set((state) => ({ alerts: { ...state.alerts, [alert.id]: alert } }));
  },

  setMyActiveAlertId: (id) => set({ myActiveAlertId: id }),

  applyReaction: (reaction) => {
    set((state) => {
      const current = state.reactionsByAlert[reaction.alertId] ?? [];
      if (current.some((existing) => existing.id === reaction.id)) return state;
      // One reaction per person: a second one replaces the first rather than stacking.
      const others = current.filter((existing) => existing.fromId !== reaction.fromId);
      return {
        reactionsByAlert: { ...state.reactionsByAlert, [reaction.alertId]: [...others, reaction] },
      };
    });
  },

  pruneExpired: () => {
    const now = Date.now();
    const expired = new Set(
      Object.values(get().alerts)
        .filter((alert) => alert.expiresAt <= now)
        .map((alert) => alert.id),
    );
    if (expired.size === 0) return;
    set((state) => ({
      ...dropAlerts(state, expired),
      myActiveAlertId:
        state.myActiveAlertId && expired.has(state.myActiveAlertId) ? null : state.myActiveAlertId,
    }));
  },
}));
