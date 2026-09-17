// react-native-get-random-values polyfills a minimal global `crypto` object;
// this project doesn't pull in the DOM lib, so declare just what we use.
declare const crypto: {
  getRandomValues<T extends ArrayBufferView>(array: T): T;
};
