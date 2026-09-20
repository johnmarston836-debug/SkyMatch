import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Profile, Seat } from '../types';
import { newId } from '../utils/id';
import { defaultLocation, normalizeLocation } from '../utils/location';

const STORAGE_KEY = '@skymatch/profile';

/** What profiles looked like before the app knew about anywhere but an aeroplane. */
interface LegacyProfile {
  id: string;
  seat: Seat;
  nickname: string;
  contact?: string;
}

/**
 * Turns a stored profile into the current shape. Someone who set up the app
 * when it only did flights has a bare seat on disk; they are, by definition,
 * on a plane.
 *
 * A location it can't read at all falls back to a default rather than being
 * passed through: this value is read on every screen, so a corrupt one would
 * crash the app on launch, every launch, with reinstalling as the only way
 * out. The launch screen asks where you are anyway.
 */
function migrate(stored: Profile | LegacyProfile): Profile {
  const raw = 'location' in stored ? stored.location : stored.seat;
  return { ...stored, location: normalizeLocation(raw) ?? defaultLocation('plane') };
}

interface ProfileState {
  profile: Profile | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  save: (profile: Omit<Profile, 'id'>) => Promise<void>;
  clear: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  hydrated: false,

  hydrate: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      set({ profile: null, hydrated: true });
      return;
    }
    const profile = migrate(JSON.parse(raw) as Profile | LegacyProfile);
    // Write the migrated shape back, so this only ever happens once.
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    set({ profile, hydrated: true });
  },

  save: async (partial) => {
    const existing = get().profile;
    const profile: Profile = { id: existing?.id ?? newId(), ...partial };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    set({ profile });
  },

  clear: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ profile: null });
  },
}));
