import { create } from 'zustand';
import type { PresenceAlert } from '../types';

interface PresenceState {
  alerts: Record<string, PresenceAlert>; // keyed by alert id
  addAlert: (alert: PresenceAlert) => void;
  pruneExpired: () => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  alerts: {},

  addAlert: (alert) => {
    if (get().alerts[alert.id]) return;
    set((state) => ({ alerts: { ...state.alerts, [alert.id]: alert } }));
  },

  pruneExpired: () => {
    const now = Date.now();
    const alive = Object.fromEntries(Object.entries(get().alerts).filter(([, alert]) => alert.expiresAt > now));
    if (Object.keys(alive).length !== Object.keys(get().alerts).length) {
      set({ alerts: alive });
    }
  },
}));
