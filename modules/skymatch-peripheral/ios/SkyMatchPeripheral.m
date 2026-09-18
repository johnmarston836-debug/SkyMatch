#import "SkyMatchPeripheral.h"

static NSString *const kWriteEvent = @"SkyMatchPeripheralWrite";
static NSString *const kStateEvent = @"SkyMatchPeripheralState";

@implementation SkyMatchPeripheral {
  CBPeripheralManager *_manager;
  CBMutableCharacteristic *_characteristic;
  CBUUID *_serviceUUID;
  CBUUID *_charUUID;
  NSString *_localName;
  BOOL _hasListeners;
  BOOL _serviceAdded;
  BOOL _shouldRun;
  /**
   * updateValue: refuses new data once CoreBluetooth's transmit queue is
   * full and only tells us it drained via
   * peripheralManagerIsReadyToUpdateSubscribers:. A message split into many
   * frames overruns that queue immediately, so frames wait here instead of
   * being silently dropped.
   */
  NSMutableArray<NSData *> *_outbox;
}

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ kWriteEvent, kStateEvent ];
}

- (void)startObserving
{
  _hasListeners = YES;
}

- (void)stopObserving
{
  _hasListeners = NO;
}

RCT_EXPORT_METHOD(start:(NSString *)serviceUUID
                  charUUID:(NSString *)charUUID
                  localName:(NSString *)localName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  _serviceUUID = [CBUUID UUIDWithString:serviceUUID];
  _charUUID = [CBUUID UUIDWithString:charUUID];
  _localName = localName ?: @"";
  _shouldRun = YES;
  if (_outbox == nil) {
    _outbox = [NSMutableArray new];
  }

  if (_manager == nil) {
    // Publishing and advertising wait for peripheralManagerDidUpdateState:,
    // which fires with the real radio state right after this returns.
    _manager = [[CBPeripheralManager alloc] initWithDelegate:self queue:nil options:nil];
  } else {
    [self publishIfReady];
  }
  resolve(nil);
}

RCT_EXPORT_METHOD(stop:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  _shouldRun = NO;
  if (_manager != nil && _manager.state == CBManagerStatePoweredOn) {
    if (_manager.isAdvertising) {
      [_manager stopAdvertising];
    }
    [_manager removeAllServices];
  }
  _serviceAdded = NO;
  _characteristic = nil;
  [_outbox removeAllObjects];
  resolve(nil);
}

/** Queues one frame for every subscribed central; returns NO if the radio isn't up yet. */
RCT_EXPORT_METHOD(notify:(NSString *)base64Value
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSData *data = [[NSData alloc] initWithBase64EncodedString:base64Value options:0];
  if (data == nil || _characteristic == nil || _manager == nil) {
    resolve(@NO);
    return;
  }
  [_outbox addObject:data];
  [self drainOutbox];
  resolve(@YES);
}

- (void)drainOutbox
{
  if (_manager == nil || _characteristic == nil) {
    return;
  }
  while (_outbox.count > 0) {
    NSData *next = _outbox.firstObject;
    BOOL sent = [_manager updateValue:next
                    forCharacteristic:_characteristic
                 onSubscribedCentrals:nil];
    if (!sent) {
      return; // queue full; resumes in peripheralManagerIsReadyToUpdateSubscribers:
    }
    [_outbox removeObjectAtIndex:0];
  }
}

- (void)publishIfReady
{
  if (!_shouldRun || _manager == nil || _manager.state != CBManagerStatePoweredOn) {
    return;
  }
  if (_serviceAdded) {
    [self startAdvertising];
    return;
  }

  _characteristic = [[CBMutableCharacteristic alloc]
      initWithType:_charUUID
        properties:CBCharacteristicPropertyWrite |
                   CBCharacteristicPropertyWriteWithoutResponse |
                   CBCharacteristicPropertyNotify
             value:nil // must be nil for a characteristic whose value changes
       permissions:CBAttributePermissionsWriteable];

  CBMutableService *service = [[CBMutableService alloc] initWithType:_serviceUUID primary:YES];
  service.characteristics = @[ _characteristic ];

  [_manager removeAllServices];
  [_manager addService:service];
  _serviceAdded = YES;
}

- (void)startAdvertising
{
  if (!_shouldRun || _manager == nil || _manager.isAdvertising) {
    return;
  }
  // Only the service UUID and local name are honoured when an iOS app
  // advertises - CoreBluetooth silently drops manufacturer data - which is
  // why the seat travels in the local name.
  [_manager startAdvertising:@{
    CBAdvertisementDataServiceUUIDsKey : @[ _serviceUUID ],
    CBAdvertisementDataLocalNameKey : _localName,
  }];
}

#pragma mark - CBPeripheralManagerDelegate

- (void)peripheralManagerDidUpdateState:(CBPeripheralManager *)peripheral
{
  if (_hasListeners) {
    [self sendEventWithName:kStateEvent body:@{ @"state" : @(peripheral.state) }];
  }
  if (peripheral.state == CBManagerStatePoweredOn) {
    [self publishIfReady];
  } else {
    // Bluetooth went away; the service has to be re-added when it returns.
    _serviceAdded = NO;
  }
}

- (void)peripheralManager:(CBPeripheralManager *)peripheral
            didAddService:(CBService *)service
                    error:(NSError *)error
{
  if (error != nil) {
    _serviceAdded = NO;
    return;
  }
  [self startAdvertising];
}

- (void)peripheralManager:(CBPeripheralManager *)peripheral
  didReceiveWriteRequests:(NSArray<CBATTRequest *> *)requests
{
  for (CBATTRequest *request in requests) {
    if (request.value.length == 0) {
      continue;
    }
    if (_hasListeners) {
      [self sendEventWithName:kWriteEvent
                         body:@{
                           @"value" : [request.value base64EncodedStringWithOptions:0],
                           @"centralId" : request.central.identifier.UUIDString ?: @"",
                         }];
    }
  }
  // CoreBluetooth wants exactly one response, for the first request only.
  if (requests.count > 0) {
    [peripheral respondToRequest:requests.firstObject withResult:CBATTErrorSuccess];
  }
}

- (void)peripheralManagerIsReadyToUpdateSubscribers:(CBPeripheralManager *)peripheral
{
  [self drainOutbox];
}

@end
