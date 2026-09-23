/**
 * The two sizes of the same profile photo, and why each number is what it is.
 *
 * The portrait is 256 because the profile card draws it at 88 points, which
 * on a current iPhone is 264 pixels: anything smaller is visibly stretched.
 *
 * The thumbnail is what the lists, the chat header and the bubbles draw, at
 * 36 to 48 points - up to 144 pixels on a current iPhone. It used to be 64,
 * which is why faces looked pixelated everywhere but the card; 64 was the
 * price of 80-character Bluetooth frames. Frames now fill the link's MTU and
 * go out without waiting for each answer, so a face that is sharp at 48
 * points costs about what the blurry one did.
 */
export const PORTRAIT_SIDE = 256;
export const PORTRAIT_QUALITY = 0.6;
export const THUMB_SIDE = 144;
export const THUMB_QUALITY = 0.6;

/**
 * Bumped whenever the thumbnail changes size. It goes into the fingerprint
 * everyone else compares (see myAvatarHash), so a photo picked under the old
 * size is announced as new: people nearby ask for it again and replace the
 * blurry copy they hold, instead of keeping it because the photo is "the
 * same".
 */
export const THUMB_GENERATION = 2;

/**
 * Receivers refuse a face longer than this many base64 characters
 * (MAX_AVATAR_IMAGE_CHARS in validate.ts, also in earlier builds), so a
 * thumbnail that comes out heavier - a very busy photo - is squeezed once
 * more rather than sent to be thrown away.
 */
export const MAX_THUMB_CHARS = 18_000;

/** The thumbnail of a portrait, or null when this phone has no rescaler. */
export async function makeThumb(
  portrait: string,
  resize: (base64: string, maxSide: number, quality: number) => Promise<string | null>,
): Promise<string | null> {
  const thumb = await resize(portrait, THUMB_SIDE, THUMB_QUALITY);
  if (thumb === null || thumb.length <= MAX_THUMB_CHARS) return thumb;
  const squeezed = await resize(portrait, THUMB_SIDE, 0.35);
  return squeezed !== null && squeezed.length <= MAX_THUMB_CHARS ? squeezed : null;
}
