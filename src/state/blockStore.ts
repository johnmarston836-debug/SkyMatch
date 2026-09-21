import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@skymatch/muted';

interface BlockState {
  /** Profile ids whose messages this phone ignores. */
  muted: Record<string, true>;
  hydrate: () => Promise<void>;
  toggle: (peerId: string) => Promise<void>;
  isMuted: (peerId: string) => boolean;
}

/**
 * People this phone has chosen to stop hearing.
 *
 * Local and only local. Their packets are still relayed onward, because
 * this phone is part of how everyone else's messages get across the room
 * and dropping them would punish bystanders for someone else's behaviour.
 * What changes is only what this phone shows its owner.
 */
export const useBlockStore = create<BlockState>((set, get) => ({
  muted: {},

  hydrate: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      set({ muted: JSON.parse(raw) as Record<string, true> });
    } catch {
      // Unreadable list: better to hear everyone than to refuse to start.
    }
  },

  toggle: async (peerId) => {
    const muted = { ...get().muted };
    if (muted[peerId]) delete muted[peerId];
    else muted[peerId] = true;
    set({ muted });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(muted));
  },

  isMuted: (peerId) => get().muted[peerId] === true,
}));
