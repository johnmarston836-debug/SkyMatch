import 'react-native-gesture-handler/jestSetup';

// react-native-reanimated v4's own test mock pulls in the real worklets
// runtime, which throws ("createShareable is not supported on web") outside
// an actual native/web bundler context. Tests here never assert on animation
// values, so a minimal manual mock covering the APIs this app calls is enough.
jest.mock('react-native-reanimated', () => {
  const { View, Text, ScrollView, Image } = require('react-native');
  return {
    __esModule: true,
    default: { View, Text, ScrollView, Image, createAnimatedComponent: (Component) => Component },
    useSharedValue: (initial) => ({ value: initial }),
    useAnimatedKeyboard: () => ({ height: { value: 0 }, state: { value: 0 } }),
    useAnimatedStyle: (factory) => factory(),
    withSpring: (toValue) => toValue,
    withTiming: (toValue, _config, callback) => {
      callback?.(true);
      return toValue;
    },
    runOnJS:
      (fn) =>
      (...args) =>
        fn(...args),
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Native BLE modules have no JS-only mock; the mesh layer is exercised via
// MockBleTransport in the app, so tests never need the real native module.
jest.mock('react-native-ble-plx', () => ({ BleManager: jest.fn().mockImplementation(() => ({})) }));
jest.mock('react-native-ble-advertiser', () => ({}));
