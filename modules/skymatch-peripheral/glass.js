const { Platform } = require('react-native');

/**
 * The native glass pane, or null where there isn't one.
 *
 * Resolved in a try/catch on purpose: if the native side didn't build, or
 * the component never registered, the caller draws its own surface and the
 * app looks like it did before instead of losing every button.
 */
let GlassView = null;

if (Platform.OS === 'ios') {
  try {
    GlassView = require('./js/SkyMatchGlassViewNativeComponent').default ?? null;
  } catch {
    GlassView = null;
  }
}

module.exports = { GlassView, isSupported: GlassView !== null };
