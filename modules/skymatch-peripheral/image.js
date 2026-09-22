const { NativeModules, Platform } = require('react-native');

const native = NativeModules.SkyMatchImage;

/** Rescaling exists only where the native module does (iOS). */
const isSupported = Platform.OS === 'ios' && native != null;

/**
 * Scales a base64 JPEG so its longest side is at most `maxSide` and
 * re-encodes it at `quality` (0..1).
 *
 * Resolves to null when it can't be done - no native module, or an image
 * the system can't read. Callers fall back to the photo they already have,
 * so a phone without this still works; its photos are just bigger on the
 * radio than they need to be.
 */
function resize(base64, maxSide, quality) {
  if (!isSupported || typeof base64 !== 'string' || base64.length === 0) return Promise.resolve(null);
  return native.resize(base64, maxSide, quality).catch(() => null);
}

module.exports = { isSupported, resize };
