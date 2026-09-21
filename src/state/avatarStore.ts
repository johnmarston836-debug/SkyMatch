import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { shortHash } from '../utils/hash';

const STORAGE_KEY = '@skymatch/avatar';
const PEERS_KEY = '@skymatch/peer-avatars';

/**
 * How many people's photos are kept on disk. A photo is a few kilobytes and
 * crossing one costs hundreds of Bluetooth frames, so keeping them is worth
 * far more than the space; the cap is only there to stop a frequent traveller
 * accumulating hundreds of strangers.
 */
const MAX_CACHED_PEERS = 24;

interface CachedAvatar {
  image: string;
  hash: string;
  seenAt: number;
}

/**
 * Photos live apart from the profile on purpose. The profile is re-announced
 * every few seconds to keep the passenger list fresh, and it has to stay
 * small enough to cross a Bluetooth link in a couple of frames; a photo is
 * hundreds of frames and would swamp the cabin if it rode along.
 */
interface AvatarState {
  myAvatar: string | null; // base64 JPEG, persisted across launches
  peerAvatars: Record<string, string>; // by profile id
  /**
   * Fingerprint of each photo we hold, so a profile announcement tells us
   * straight away whether ours is the photo that person is showing.
   */
  peerAvatarHashes: Record<string, string>;
  /** False until the photos are off disk; see `myAvatarHash`. */
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setMyAvatar: (base64: string | null) => Promise<void>;
  setPeerAvatar: (peerId: string, base64: string) => void;
  /** They took their photo down: stop showing the copy we kept. */
  clearPeerAvatar: (peerId: string) => void;
  /**
   * What to announce as our photo's fingerprint.
   *
   * Three answers, and the difference matters: the hash when we have a
   * photo, an empty string when we certainly have none, and `undefined`
   * while the answer is still coming off disk. Announcing "no photo" during
   * those first moments is what made everyone else throw away the copy of us
   * they already had.
   */
  myAvatarHash: () => string | undefined;
}

/** Keeps the most recently seen faces and drops the rest. */
function trim(cache: Record<string, CachedAvatar>): Record<string, CachedAvatar> {
  const entries = Object.entries(cache);
  if (entries.length <= MAX_CACHED_PEERS) return cache;
  return Object.fromEntries(
    entries.sort(([, a], [, b]) => b.seenAt - a.seenAt).slice(0, MAX_CACHED_PEERS),
  );
}

async function persistPeers(peerAvatars: Record<string, string>, peerAvatarHashes: Record<string, string>) {
  const now = Date.now();
  const cache: Record<string, CachedAvatar> = {};
  for (const [peerId, image] of Object.entries(peerAvatars)) {
    cache[peerId] = { image, hash: peerAvatarHashes[peerId] ?? shortHash(image), seenAt: now };
  }
  try {
    await AsyncStorage.setItem(PEERS_KEY, JSON.stringify(trim(cache)));
  } catch {
    // A full disk is no reason to lose the photo we are already showing.
  }
}

export const useAvatarStore = create<AvatarState>((set, get) => ({
  myAvatar: null,
  peerAvatars: {},
  peerAvatarHashes: {},
  hydrated: false,

  hydrate: async () => {
    const [mine, peers] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(PEERS_KEY),
    ]);

    // Faces from the last time the app was open. Without this every photo
    // has to cross hundreds of Bluetooth frames again on every launch, which
    // is why they seemed to come and go.
    const peerAvatars: Record<string, string> = {};
    const peerAvatarHashes: Record<string, string> = {};
    if (peers) {
      try {
        const cache = JSON.parse(peers) as Record<string, CachedAvatar>;
        for (const [peerId, entry] of Object.entries(cache)) {
          if (typeof entry?.image !== 'string' || typeof entry?.hash !== 'string') continue;
          peerAvatars[peerId] = entry.image;
          peerAvatarHashes[peerId] = entry.hash;
        }
      } catch {
        // Unreadable cache: start over rather than refuse to launch.
      }
    }

    set({ myAvatar: mine ?? null, peerAvatars, peerAvatarHashes, hydrated: true });
  },

  setMyAvatar: async (base64) => {
    if (base64 === null) await AsyncStorage.removeItem(STORAGE_KEY);
    else await AsyncStorage.setItem(STORAGE_KEY, base64);
    set({ myAvatar: base64 });
  },

  setPeerAvatar: (peerId, base64) => {
    set((state) => ({
      peerAvatars: { ...state.peerAvatars, [peerId]: base64 },
      peerAvatarHashes: { ...state.peerAvatarHashes, [peerId]: shortHash(base64) },
    }));
    const { peerAvatars, peerAvatarHashes } = get();
    void persistPeers(peerAvatars, peerAvatarHashes);
  },

  clearPeerAvatar: (peerId) => {
    if (get().peerAvatars[peerId] === undefined) return;
    set((state) => {
      const peerAvatars = { ...state.peerAvatars };
      const peerAvatarHashes = { ...state.peerAvatarHashes };
      delete peerAvatars[peerId];
      delete peerAvatarHashes[peerId];
      return { peerAvatars, peerAvatarHashes };
    });
    const { peerAvatars, peerAvatarHashes } = get();
    void persistPeers(peerAvatars, peerAvatarHashes);
  },

  myAvatarHash: () => {
    const { myAvatar, hydrated } = get();
    if (!hydrated) return undefined;
    return myAvatar === null ? '' : shortHash(myAvatar);
  },
}));
