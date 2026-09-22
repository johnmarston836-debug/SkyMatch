const { NativeModules, PermissionsAndroid, Platform } = require('react-native');

const native = NativeModules.SkyMatchNotifications;

/** Local notifications exist wherever the native module does (iOS and Android). */
const isSupported = (Platform.OS === 'ios' || Platform.OS === 'android') && native != null;

/**
 * Prompts for permission the first time; afterwards the system answers from
 * its own record. Android before 13 has no prompt at all - notifications are
 * on unless switched off in Settings.
 */
async function requestPermission() {
  if (!isSupported) return false;
  if (Platform.OS !== 'android') return native.requestPermission();
  if (Platform.Version < 33) return (await native.getPermission()) === 'granted';
  const result = await PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS');
  await native.markAsked();
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

/** 'granted' | 'denied' | 'undetermined' | 'unsupported' */
function getPermission() {
  if (!isSupported) return Promise.resolve('unsupported');
  return native.getPermission();
}

/**
 * `channelName` is what Android lists these notifications under in
 * Settings; iOS has no such thing and its method doesn't take it.
 */
function present(title, body, threadId, channelName) {
  if (!isSupported) return Promise.resolve(false);
  if (Platform.OS === 'android') return native.present(title, body, threadId ?? null, channelName ?? 'Messages');
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
