import { Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { resize } from 'skymatch-peripheral/image';
import { makeThumb, MAX_PORTRAIT_CHARS, PORTRAIT_QUALITY, PORTRAIT_SIDE } from './avatarSizes';
import { useAvatarStore } from '../state/avatarStore';
import { t } from '../i18n';

/**
 * Lets someone pick their profile photo and stores both sizes of it. Shared
 * by the profile screen and the first-run setup, so a photo picked on day
 * one is exactly the one a later change would give. True when a photo was
 * stored; announcing it to the room is the caller's job, since during
 * setup there is no room yet.
 */
export async function pickProfilePhoto(): Promise<boolean> {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    includeBase64: true,
    // Only as big as a phone screen needs: the portrait crosses the radio
    // to everyone who opens this card.
    maxWidth: PORTRAIT_SIDE,
    maxHeight: PORTRAIT_SIDE,
    quality: PORTRAIT_QUALITY,
  });
  const asset = result.assets?.[0];
  if (!asset?.base64) return false;

  // A busy photo can come back heavier than the same size of a plain one,
  // so squeeze before refusing: telling someone their face is too big is a
  // worse answer than a slightly softer picture.
  let portrait = asset.base64;
  if (portrait.length > MAX_PORTRAIT_CHARS) {
    portrait = (await resize(portrait, PORTRAIT_SIDE, 0.4)) ?? portrait;
  }
  if (portrait.length > MAX_PORTRAIT_CHARS) {
    Alert.alert(t.myProfile.photoTooBigTitle, t.myProfile.photoTooBigBody);
    return false;
  }

  // The face everyone nearby receives. Null when the rescaler isn't there -
  // the store then uses the portrait for both, which costs radio but never
  // leaves anyone looking at a blank circle.
  const thumb = await makeThumb(portrait, resize);
  await useAvatarStore.getState().setMyAvatar(portrait, thumb);
  return true;
}
