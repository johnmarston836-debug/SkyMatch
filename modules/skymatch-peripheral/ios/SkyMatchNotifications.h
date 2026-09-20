#import <React/RCTBridgeModule.h>

/**
 * Local notifications for messages that arrive while SkyMatch is in the
 * background. There is no server and no push certificate anywhere in this
 * app: the phone is still running the Bluetooth stack behind the scenes, so
 * when a message reaches us there we post the notification ourselves.
 */
@interface SkyMatchNotifications : NSObject <RCTBridgeModule>
@end
