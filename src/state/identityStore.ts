import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createIdentity, deserializeIdentity, serializeIdentity, type Identity } from '../crypto/identity';

const STORAGE_KEY = '@skymatch/identity';

interface IdentityState {
  /** Null only until hydrate() has run; from then on there always is one. */
  identity: Identity | null;
  hydrate: () => Promise<Identity>;
}

/**
 * This phone's keys: made once, on first launch, and kept for as long as
 * the app is installed - the profile id is derived from them, so losing
 * them is becoming somebody else.
 *
 * They live in the app's own storage, which no other app can read. A
 * reinstall starts over with new keys and a new id, which is what a
 * reinstall already did to the id before keys existed.
 */
export const useIdentityStore = create<IdentityState>((set, get) => ({
  identity: null,

  hydrate: async () => {
    const existing = get().identity;
    if (existing) return existing;

    const raw = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
    const stored = raw ? deserializeIdentity(raw) : null;
    if (stored) {
      set({ identity: stored });
      return stored;
    }

    const identity = createIdentity();
    await AsyncStorage.setItem(STORAGE_KEY, serializeIdentity(identity));
    set({ identity });
    return identity;
  },
}));
