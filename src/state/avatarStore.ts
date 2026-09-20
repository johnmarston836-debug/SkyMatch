import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@skymatch/avatar';

/**
 * Photos live apart from the profile on purpose. The profile is re-announced
 * every few seconds to keep the passenger list fresh, and it has to stay
 * small enough to cross a Bluetooth link in a couple of frames; a photo is
 * hundreds of frames and would swamp the cabin if it rode along.
 */
interface AvatarState {
  myAvatar: string | null; // base64 JPEG, persisted across launches
  peerAvatars: Record<string, string>; // by profile id, in memory only

  hydrate: () => Promise<void>;
  setMyAvatar: (base64: string | null) => Promise<void>;
  setPeerAvatar: (peerId: string, base64: string) => void;
}

export const useAvatarStore = create<AvatarState>((set) => ({
  myAvatar: null,
  peerAvatars: {},

  hydrate: async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) set({ myAvatar: stored });
  },

  setMyAvatar: async (base64) => {
    if (base64 === null) await AsyncStorage.removeItem(STORAGE_KEY);
    else await AsyncStorage.setItem(STORAGE_KEY, base64);
    set({ myAvatar: base64 });
  },

  setPeerAvatar: (peerId, base64) =>
    set((state) => ({ peerAvatars: { ...state.peerAvatars, [peerId]: base64 } })),
}));
