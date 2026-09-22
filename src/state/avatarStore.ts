import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { shortHash } from '../utils/hash';

const STORAGE_KEY = '@skymatch/avatar';
const THUMB_KEY = '@skymatch/avatar-thumb';
const PEERS_KEY = '@skymatch/peer-avatars';

/**
 * How many people's faces are kept on disk. A thumbnail is about a kilobyte
 * and crossing one still costs twenty-odd Bluetooth frames, so keeping them
 * is worth far more than the space; the cap only stops a frequent traveller
 * accumulating hundreds of strangers.
 */
const MAX_CACHED_PEERS = 24;

/**
 * How many of those also keep the big portrait. It is five times the size
 * of a thumbnail and can always be asked for again the moment someone opens
 * that person's card, so only the people most recently around keep theirs.
 */
const MAX_CACHED_PORTRAITS = 8;

/**
 * What one person's photo looks like on this phone.
 *
 * Both sizes carry the *owner's* fingerprint, never their own: the hash is
 * what the owner announces for their photo, and it has to mean "this is
 * which photo of theirs I hold", not "this is which file I happen to have".
 * Hashing the thumbnail would give a different answer from hashing the
 * portrait and nothing would ever match.
 */
export interface PeerAvatar {
  hash: string;
  /** 64px, sent to everyone who asks; what the lists and bubbles show. */
  thumb?: string;
  /** 256px, only ever sent to someone who opened this person's card. */
  full?: string;
  seenAt: number;
}

/**
 * Photos live apart from the profile on purpose. The profile is re-announced
 * every few seconds to keep the passenger list fresh, and it has to stay
 * small enough to cross a Bluetooth link in a couple of frames; even a
 * thumbnail is twenty of them and would swamp the cabin if it rode along.
 */
interface AvatarState {
  /** The 256px portrait: what you see of yourself, and what others ask for. */
  myAvatar: string | null;
  /** The 64px thumbnail of the same photo - what everyone nearby receives. */
  myThumb: string | null;
  peerAvatars: Record<string, PeerAvatar>;
  /** False until the photos are off disk; see `myAvatarHash`. */
  hydrated: boolean;

  hydrate: () => Promise<void>;
  /** Stores both sizes of your own photo, or clears it when given null. */
  setMyAvatar: (full: string | null, thumb: string | null) => Promise<void>;
  /** Files an arrived photo under the hash its owner announced for it. */
  setPeerAvatar: (peerId: string, hash: string, image: string, full: boolean) => void;
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

/** The best picture we hold of someone: their portrait if it has arrived, else their face. */
export function bestImage(entry: PeerAvatar | undefined): string | undefined {
  return entry?.full ?? entry?.thumb;
}

/**
 * Keeps the most recently seen faces, and the portraits of the few most
 * recent of those.
 */
function trim(cache: Record<string, PeerAvatar>): Record<string, PeerAvatar> {
  const entries = Object.entries(cache).sort(([, a], [, b]) => b.seenAt - a.seenAt);
  const kept: Record<string, PeerAvatar> = {};
  entries.slice(0, MAX_CACHED_PEERS).forEach(([peerId, entry], index) => {
    kept[peerId] = index < MAX_CACHED_PORTRAITS ? entry : { ...entry, full: undefined };
  });
  return kept;
}

async function persistPeers(peerAvatars: Record<string, PeerAvatar>) {
  try {
    await AsyncStorage.setItem(PEERS_KEY, JSON.stringify(trim(peerAvatars)));
  } catch {
    // A full disk is no reason to lose the photo we are already showing.
  }
}

/**
 * Reads the cache off disk, including the one written by the build that
 * knew a single size. Its `image` was that build's whole photo, so it
 * becomes the portrait: dropping it would make every face in the app
 * disappear on the update and cross the radio all over again.
 */
function readCache(raw: string | null): Record<string, PeerAvatar> {
  if (!raw) return {};
  const peerAvatars: Record<string, PeerAvatar> = {};
  try {
    const stored = JSON.parse(raw) as Record<string, Partial<PeerAvatar> & { image?: string }>;
    for (const [peerId, entry] of Object.entries(stored)) {
      if (typeof entry?.hash !== 'string') continue;
      const full = typeof entry.full === 'string' ? entry.full : entry.image;
      const thumb = typeof entry.thumb === 'string' ? entry.thumb : undefined;
      if (typeof full !== 'string' && thumb === undefined) continue;
      peerAvatars[peerId] = {
        hash: entry.hash,
        thumb,
        full: typeof full === 'string' ? full : undefined,
        seenAt: typeof entry.seenAt === 'number' ? entry.seenAt : Date.now(),
      };
    }
  } catch {
    // Unreadable cache: start over rather than refuse to launch.
  }
  return peerAvatars;
}

export const useAvatarStore = create<AvatarState>((set, get) => ({
  myAvatar: null,
  myThumb: null,
  peerAvatars: {},
  hydrated: false,

  hydrate: async () => {
    const [mine, myThumb, peers] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(THUMB_KEY),
      AsyncStorage.getItem(PEERS_KEY),
    ]);

    // Faces from the last time the app was open. Without this every photo
    // has to cross the radio again on every launch, which is why they
    // seemed to come and go.
    set({
      myAvatar: mine ?? null,
      // A photo saved by the build before thumbnails existed has none; the
      // portrait stands in until the next time it is picked, which is
      // wasteful on the radio but never wrong on screen.
      myThumb: myThumb ?? mine ?? null,
      peerAvatars: readCache(peers),
      hydrated: true,
    });
  },

  setMyAvatar: async (full, thumb) => {
    if (full === null) {
      await Promise.all([AsyncStorage.removeItem(STORAGE_KEY), AsyncStorage.removeItem(THUMB_KEY)]);
      set({ myAvatar: null, myThumb: null });
      return;
    }
    // The thumbnail can be missing when the rescaler isn't there (Android,
    // or a build without the native module). The portrait then does both
    // jobs: bigger on the radio than it should be, but never a blank face.
    const face = thumb ?? full;
    await Promise.all([AsyncStorage.setItem(STORAGE_KEY, full), AsyncStorage.setItem(THUMB_KEY, face)]);
    set({ myAvatar: full, myThumb: face });
  },

  setPeerAvatar: (peerId, hash, image, full) => {
    set((state) => {
      const previous = state.peerAvatars[peerId];
      // A photo for a hash we no longer expect is the old one arriving late;
      // starting from scratch stops it being paired with the new face.
      const base = previous?.hash === hash ? previous : { hash, seenAt: 0 };
      return {
        peerAvatars: {
          ...state.peerAvatars,
          [peerId]: { ...base, hash, [full ? 'full' : 'thumb']: image, seenAt: Date.now() },
        },
      };
    });
    void persistPeers(get().peerAvatars);
  },

  clearPeerAvatar: (peerId) => {
    if (get().peerAvatars[peerId] === undefined) return;
    set((state) => {
      const peerAvatars = { ...state.peerAvatars };
      delete peerAvatars[peerId];
      return { peerAvatars };
    });
    void persistPeers(get().peerAvatars);
  },

  myAvatarHash: () => {
    const { myAvatar, hydrated } = get();
    if (!hydrated) return undefined;
    return myAvatar === null ? '' : shortHash(myAvatar);
  },
}));
