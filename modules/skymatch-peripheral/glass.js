const { Platform } = require('react-native');

/**
 * The native glass pieces, or null where there aren't any.
 *
 * Resolved inside a try on purpose: if the native half didn't build, or the
 * component never registered, callers fall back to drawing their own surface
 * and the app looks like it did before instead of losing every button.
 */
let GlassView = null;
let GlassButtonView = null;

if (Platform.OS === 'ios') {
  try {
    GlassView = require('./js/SkyMatchGlassViewNativeComponent').default ?? null;
  } catch {
    GlassView = null;
  }
  try {
    GlassButtonView = require('./js/SkyMatchGlassButtonNativeComponent').default ?? null;
  } catch {
    GlassButtonView = null;
  }
}

module.exports = { GlassView, GlassButtonView, isSupported: GlassView !== null };
