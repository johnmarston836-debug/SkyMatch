import { create } from 'zustand';
import type { PresenceAlert } from '../types';

interface PresenceState {
  alerts: Record<string, PresenceAlert>; // keyed by alert id, active ones only
  /** The alert id *I* currently have active, if any - drives the stand-up button's on/off look. */
  myActiveAlertId: string | null;

  /** Adds an active alert, or removes it (by id) when it arrives as "I'm back". */
  applyAlert: (alert: PresenceAlert) => void;
  setMyActiveAlertId: (id: string | null) => void;
  pruneExpired: () => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  alerts: {},
  myActiveAlertId: null,

  applyAlert: (alert) => {
    if (!alert.active) {
      if (!get().alerts[alert.id]) return;
      set((state) => ({
        alerts: Object.fromEntries(Object.entries(state.alerts).filter(([id]) => id !== alert.id)),
        myActiveAlertId: state.myActiveAlertId === alert.id ? null : state.myActiveAlertId,
      }));
      return;
    }
    if (get().alerts[alert.id]) return;
    set((state) => ({ alerts: { ...state.alerts, [alert.id]: alert } }));
  },

  setMyActiveAlertId: (id) => set({ myActiveAlertId: id }),

  pruneExpired: () => {
    const now = Date.now();
    const expiredMine = Object.values(get().alerts).some(
      (alert) => alert.id === get().myActiveAlertId && alert.expiresAt <= now,
    );
    const alive = Object.fromEntries(Object.entries(get().alerts).filter(([, alert]) => alert.expiresAt > now));
    if (Object.keys(alive).length !== Object.keys(get().alerts).length) {
      set({ alerts: alive, myActiveAlertId: expiredMine ? null : get().myActiveAlertId });
    }
  },
}));
