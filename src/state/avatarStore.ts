import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { shortHash } from '../utils/hash';

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
  /**
   * Fingerprint of each photo we hold, so a profile announcement tells us
   * straight away whether ours is the photo that person is showing.
   */
  peerAvatarHashes: Record<string, string>;

  hydrate: () => Promise<void>;
  setMyAvatar: (base64: string | null) => Promise<void>;
  setPeerAvatar: (peerId: string, base64: string) => void;
  /** They took their photo down: stop showing the copy we kept. */
  clearPeerAvatar: (peerId: string) => void;
  /** Fingerprint of our own photo, or undefined when we have none to offer. */
  myAvatarHash: () => string | undefined;
}

export const useAvatarStore = create<AvatarState>((set, get) => ({
  myAvatar: null,
  peerAvatars: {},
  peerAvatarHashes: {},

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
    set((state) => ({
      peerAvatars: { ...state.peerAvatars, [peerId]: base64 },
      peerAvatarHashes: { ...state.peerAvatarHashes, [peerId]: shortHash(base64) },
    })),

  clearPeerAvatar: (peerId) =>
    set((state) => {
      if (state.peerAvatars[peerId] === undefined) return state;
      const peerAvatars = { ...state.peerAvatars };
      const peerAvatarHashes = { ...state.peerAvatarHashes };
      delete peerAvatars[peerId];
      delete peerAvatarHashes[peerId];
      return { peerAvatars, peerAvatarHashes };
    }),

  myAvatarHash: () => {
    const myAvatar = get().myAvatar;
    return myAvatar === null ? undefined : shortHash(myAvatar);
  },
}));
