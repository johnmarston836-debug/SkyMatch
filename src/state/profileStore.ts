import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Profile } from '../types';
import { newId } from '../utils/id';

const STORAGE_KEY = '@skymatch/profile';

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
    set({ profile: raw ? (JSON.parse(raw) as Profile) : null, hydrated: true });
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
