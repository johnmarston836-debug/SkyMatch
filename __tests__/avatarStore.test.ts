import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAvatarStore } from '../src/state/avatarStore';
import { shortHash } from '../src/utils/hash';

const PHOTO = 'photo-bytes-in-base64';

function reset() {
  useAvatarStore.setState({ myAvatar: null, peerAvatars: {}, peerAvatarHashes: {}, hydrated: false });
}

describe('what we announce about our own photo', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    reset();
  });

  it('says nothing at all until the photo is off disk', () => {
    // The bug this pins: announcing "I have no photo" during those first
    // moments made every other phone throw away the copy of us it held.
    expect(useAvatarStore.getState().myAvatarHash()).toBeUndefined();
  });

  it('says "none" only once it actually knows there is none', async () => {
    await useAvatarStore.getState().hydrate();
    expect(useAvatarStore.getState().myAvatarHash()).toBe('');
  });

  it('says the fingerprint once the photo is loaded', async () => {
    await useAvatarStore.getState().setMyAvatar(PHOTO);
    reset();
    await useAvatarStore.getState().hydrate();
    expect(useAvatarStore.getState().myAvatarHash()).toBe(shortHash(PHOTO));
  });
});

describe('other people’s photos', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    reset();
  });

  it('survives a restart instead of crossing the radio again', async () => {
    await useAvatarStore.getState().hydrate();
    useAvatarStore.getState().setPeerAvatar('peer-a', PHOTO);
    // Give the write, which is deliberately not awaited by callers, a turn.
    await new Promise<void>((resolve) => setImmediate(resolve));

    reset();
    await useAvatarStore.getState().hydrate();

    expect(useAvatarStore.getState().peerAvatars['peer-a']).toBe(PHOTO);
    // And the fingerprint comes back with it, so their next announcement
    // matches and no photo is requested at all.
    expect(useAvatarStore.getState().peerAvatarHashes['peer-a']).toBe(shortHash(PHOTO));
  });

  it('forgets one that was taken down', async () => {
    await useAvatarStore.getState().hydrate();
    useAvatarStore.getState().setPeerAvatar('peer-a', PHOTO);
    useAvatarStore.getState().clearPeerAvatar('peer-a');
    await new Promise<void>((resolve) => setImmediate(resolve));

    reset();
    await useAvatarStore.getState().hydrate();
    expect(useAvatarStore.getState().peerAvatars['peer-a']).toBeUndefined();
  });
});
