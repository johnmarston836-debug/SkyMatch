#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <CoreBluetooth/CoreBluetooth.h>

/**
 * The BLE peripheral half of the mesh, which react-native-ble-plx cannot
 * provide: it only implements the central (scanning) role, so without this
 * an iPhone can see other phones but is itself invisible, and there is no
 * GATT characteristic for anyone to write into.
 *
 * This advertises the mesh service UUID and hosts one characteristic that
 * is writable (peers push frames into it) and notifiable (we push frames
 * back out to whoever subscribed). Together with the central side in
 * RealBleTransport, every phone ends up symmetric: it both connects out and
 * accepts connections in.
 */
@interface SkyMatchPeripheral : RCTEventEmitter <RCTBridgeModule, CBPeripheralManagerDelegate>
@end
