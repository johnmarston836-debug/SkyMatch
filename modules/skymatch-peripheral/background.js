const { AppRegistry, NativeEventEmitter, NativeModules, Platform } = require('react-native');

const native = NativeModules.SkyMatchBackground;

/** Staying on the mesh in the background exists only on Android (see SkyMatchBackgroundService). */
const isSupported = Platform.OS === 'android' && native != null;

const TASK_KEY = 'SkyMatchKeepAlive';
const STOPPED_EVENT = 'SkyMatchBackgroundStopped';

let finishTask = null;
let running = false;
const stoppedListeners = new Set();

/**
 * Registers the keep-alive task the background service runs. It does
 * nothing but stay unfinished: while it is, React Native keeps JavaScript
 * timers running in the background, and with them the profile beat.
 *
 * Has to run when the bundle loads (index.js), before the service can
 * start it.
 */
function registerKeepAliveTask() {
  AppRegistry.registerHeadlessTask(TASK_KEY, () => () =>
    new Promise((resolve) => {
      finishTask = resolve;
    }),
  );
  if (!isSupported) return;
  new NativeEventEmitter(native).addListener(STOPPED_EVENT, () => {
    running = false;
    finishTask?.();
    finishTask = null;
    stoppedListeners.forEach((listener) => listener());
  });
}

/** Starts the service, or just updates its notification's words if it is already running. */
async function start({ title, body, stopLabel, channelName }) {
  if (!isSupported) return false;
  running = await native.start(title, body, stopLabel, channelName);
  return running;
}

async function stop() {
  if (!isSupported) return;
  running = false;
  finishTask?.();
  finishTask = null;
  await native.stop();
}

function isRunning() {
  return running;
}

/** Fires when the service stops by itself: "Disconnect" on the notification, or the app swiped away. */
function addStoppedListener(listener) {
  stoppedListeners.add(listener);
  return () => stoppedListeners.delete(listener);
}

module.exports = { isSupported, registerKeepAliveTask, start, stop, isRunning, addStoppedListener };
