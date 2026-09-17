import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Native BLE modules have no JS-only mock; the mesh layer is exercised via
// MockBleTransport in the app, so tests never need the real native module.
jest.mock('react-native-ble-plx', () => ({ BleManager: jest.fn().mockImplementation(() => ({})) }));
jest.mock('react-native-ble-advertiser', () => ({}));
