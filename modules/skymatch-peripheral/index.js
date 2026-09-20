const { NativeEventEmitter, NativeModules, Platform } = require('react-native');

const native = NativeModules.SkyMatchPeripheral;

const WRITE_EVENT = 'SkyMatchPeripheralWrite';
const STATE_EVENT = 'SkyMatchPeripheralState';

let emitter = null;

function getEmitter() {
  if (emitter === null && native != null) {
    emitter = new NativeEventEmitter(native);
  }
  return emitter;
}

/** True only where the native peripheral role actually exists (iOS). */
const isSupported = Platform.OS === 'ios' && native != null;

/**
 * Starts advertising `serviceUUID` and publishes the writable/notifiable
 * characteristic peers exchange frames through. `localName` is the only
 * free-form field iOS lets an app put in an advertisement, and the
 * advertisement budget is tiny once a 128-bit service UUID is in it, so keep
 * it to a handful of characters.
 */
function start(serviceUUID, charUUID, localName) {
  if (!isSupported) return Promise.resolve();
  return native.start(serviceUUID, charUUID, localName);
}

function stop() {
  if (!isSupported) return Promise.resolve();
  return native.stop();
}

/** Pushes one base64 frame to every subscribed central. */
function notify(base64Value) {
  if (!isSupported) return Promise.resolve(false);
  return native.notify(base64Value);
}

/** Fires for every frame a peer writes into our characteristic. Returns an unsubscribe function. */
function addWriteListener(listener) {
  const e = getEmitter();
  if (e === null) return () => {};
  const subscription = e.addListener(WRITE_EVENT, listener);
  return () => subscription.remove();
}

/**
 * Fires with CoreBluetooth's CBManagerState whenever the radio's state
 * changes. Receiving anything at all also proves the native module loaded,
 * which is otherwise invisible: every call here no-ops when it didn't.
 */
function addStateListener(listener) {
  const e = getEmitter();
  if (e === null) return () => {};
  const subscription = e.addListener(STATE_EVENT, listener);
  return () => subscription.remove();
}

module.exports = { isSupported, start, stop, notify, addWriteListener, addStateListener };
