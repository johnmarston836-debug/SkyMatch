import AsyncStorage from '@react-native-async-storage/async-storage';
import { bestImage, useAvatarStore } from '../src/state/avatarStore';
import { THUMB_GENERATION } from '../src/utils/avatarSizes';
import { shortHash } from '../src/utils/hash';

const PORTRAIT = 'the-256px-portrait-in-base64';
const THUMB = 'the-64px-face';
const HASH = shortHash(`${THUMB_GENERATION}:${PORTRAIT}`);

function reset() {
  useAvatarStore.setState({ myAvatar: null, myThumb: null, peerAvatars: {}, hydrated: false });
}

/** The writes callers deliberately don't await need a turn before the disk is read again. */
const settle = () => new Promise<void>((resolve) => setImmediate(resolve));

beforeEach(async () => {
  await AsyncStorage.clear();
  reset();
});

describe('what we announce about our own photo', () => {
  it('says nothing at all until the photo is off disk', () => {
    // The bug this pins: announcing "I have no photo" during those first
    // moments made every other phone throw away the copy of us it held.
    expect(useAvatarStore.getState().myAvatarHash()).toBeUndefined();
  });

  it('says "none" only once it actually knows there is none', async () => {
    await useAvatarStore.getState().hydrate();
    expect(useAvatarStore.getState().myAvatarHash()).toBe('');
  });

  it('fingerprints the portrait, which is what both sizes are known by', async () => {
    await useAvatarStore.getState().setMyAvatar(PORTRAIT, THUMB);
    reset();
    await useAvatarStore.getState().hydrate();

    const state = useAvatarStore.getState();
    expect(state.myAvatarHash()).toBe(HASH);
    expect(state.myThumb).toBe(THUMB);
    // Hashing the thumbnail instead would give an answer nobody could match:
    // the people holding our face never see the portrait it came from.
    expect(state.myAvatarHash()).not.toBe(shortHash(THUMB));
  });

  it('falls back to the portrait when there is no rescaler to make a face', async () => {
    // Android, or an iOS build without the native module. Wasteful on the
    // radio, never a blank circle.
    await useAvatarStore.getState().setMyAvatar(PORTRAIT, null);
    expect(useAvatarStore.getState().myThumb).toBe(PORTRAIT);
  });

  it('takes both sizes down together', async () => {
    await useAvatarStore.getState().setMyAvatar(PORTRAIT, THUMB);
    await useAvatarStore.getState().setMyAvatar(null, null);
    reset();
    await useAvatarStore.getState().hydrate();

    expect(useAvatarStore.getState().myAvatar).toBeNull();
    expect(useAvatarStore.getState().myThumb).toBeNull();
    expect(useAvatarStore.getState().myAvatarHash()).toBe('');
  });
});

describe('other people’s photos', () => {
  it('shows the face at once and the portrait when it arrives', async () => {
    await useAvatarStore.getState().hydrate();
    const store = useAvatarStore.getState();

    store.setPeerAvatar('peer-a', HASH, THUMB, false);
    expect(bestImage(useAvatarStore.getState().peerAvatars['peer-a'])).toBe(THUMB);

    store.setPeerAvatar('peer-a', HASH, PORTRAIT, true);
    const entry = useAvatarStore.getState().peerAvatars['peer-a'];
    expect(bestImage(entry)).toBe(PORTRAIT);
    // The face is kept, not overwritten: it is what the lists go on showing.
    expect(entry.thumb).toBe(THUMB);
  });

  it('survives a restart instead of crossing the radio again', async () => {
    await useAvatarStore.getState().hydrate();
    useAvatarStore.getState().setPeerAvatar('peer-a', HASH, THUMB, false);
    await settle();

    reset();
    await useAvatarStore.getState().hydrate();

    const entry = useAvatarStore.getState().peerAvatars['peer-a'];
    expect(entry.thumb).toBe(THUMB);
    // And the fingerprint comes back with it, so their next announcement
    // matches and no photo is requested at all.
    expect(entry.hash).toBe(HASH);
  });

  it('does not pair an old photo with a new face', async () => {
    await useAvatarStore.getState().hydrate();
    const store = useAvatarStore.getState();
    store.setPeerAvatar('peer-a', HASH, PORTRAIT, true);
    // They changed their photo; the face of the new one arrives first.
    store.setPeerAvatar('peer-a', 'newhash', THUMB, false);

    const entry = useAvatarStore.getState().peerAvatars['peer-a'];
    expect(entry.hash).toBe('newhash');
    // Keeping the old portrait would show last week's face on their card.
    expect(entry.full).toBeUndefined();
  });

  it('forgets one that was taken down', async () => {
    await useAvatarStore.getState().hydrate();
    useAvatarStore.getState().setPeerAvatar('peer-a', HASH, THUMB, false);
    useAvatarStore.getState().clearPeerAvatar('peer-a');
    await settle();

    reset();
    await useAvatarStore.getState().hydrate();
    expect(useAvatarStore.getState().peerAvatars['peer-a']).toBeUndefined();
  });

  it('keeps many faces but only a few portraits', async () => {
    await useAvatarStore.getState().hydrate();
    for (let i = 0; i < 20; i++) {
      useAvatarStore.getState().setPeerAvatar(`peer-${i}`, `h${i}`, `thumb-${i}`, false);
      useAvatarStore.getState().setPeerAvatar(`peer-${i}`, `h${i}`, `portrait-${i}`, true);
    }
    await settle();

    reset();
    await useAvatarStore.getState().hydrate();
    const kept = Object.values(useAvatarStore.getState().peerAvatars);

    // A face is a kilobyte and worth keeping; a portrait is five times that
    // and can be asked for again the moment someone opens that card.
    expect(kept.filter((entry) => entry.thumb !== undefined)).toHaveLength(20);
    expect(kept.filter((entry) => entry.full !== undefined)).toHaveLength(8);
  });

  it('keeps the photos saved by the build that knew one size', async () => {
    // That build wrote {image, hash, seenAt}. Dropping it would blank every
    // face in the app on the update and make them all cross the radio again.
    await AsyncStorage.setItem(
      '@skymatch/peer-avatars',
      JSON.stringify({ 'peer-a': { image: PORTRAIT, hash: HASH, seenAt: Date.now() } }),
    );
    await useAvatarStore.getState().hydrate();

    const entry = useAvatarStore.getState().peerAvatars['peer-a'];
    expect(entry.hash).toBe(HASH);
    expect(bestImage(entry)).toBe(PORTRAIT);
  });

  it('remakes a thumbnail made at an older size, once, before announcing anything', async () => {
    await AsyncStorage.setItem('@skymatch/avatar', PORTRAIT);
    await AsyncStorage.setItem('@skymatch/avatar-thumb', THUMB);
    await AsyncStorage.removeItem('@skymatch/avatar-thumb-gen');
    reset();
    const remake = jest.fn(async () => 'bigger-thumb');
    await useAvatarStore.getState().hydrate(remake);
    expect(useAvatarStore.getState().myThumb).toBe('bigger-thumb');

    reset();
    await useAvatarStore.getState().hydrate(remake);
    expect(remake).toHaveBeenCalledTimes(1);
    expect(useAvatarStore.getState().myThumb).toBe('bigger-thumb');
  });
});
