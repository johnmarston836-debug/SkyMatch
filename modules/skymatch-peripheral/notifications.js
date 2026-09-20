const { NativeModules, Platform } = require('react-native');

const native = NativeModules.SkyMatchNotifications;

/** Local notifications exist only where the native module does (iOS). */
const isSupported = Platform.OS === 'ios' && native != null;

/** Prompts for permission the first time; afterwards iOS answers from its own record. */
function requestPermission() {
  if (!isSupported) return Promise.resolve(false);
  return native.requestPermission();
}

/** 'granted' | 'denied' | 'undetermined' | 'unsupported' */
function getPermission() {
  if (!isSupported) return Promise.resolve('unsupported');
  return native.getPermission();
}

function present(title, body, threadId) {
  if (!isSupported) return Promise.resolve(false);
  return native.present(title, body, threadId ?? null);
}

function setBadge(count) {
  if (!isSupported) return Promise.resolve(false);
  return native.setBadge(count);
}

function clearDelivered() {
  if (!isSupported) return Promise.resolve(false);
  return native.clearDelivered();
}

module.exports = { isSupported, requestPermission, getPermission, present, setBadge, clearDelivered };
