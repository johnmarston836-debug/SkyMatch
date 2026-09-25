#import "SkyMatchNotifications.h"

#import <UIKit/UIKit.h>
#import <UserNotifications/UserNotifications.h>

@implementation SkyMatchNotifications

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

/** Asks iOS for permission. Resolves with YES only the first time the user accepts. */
RCT_EXPORT_METHOD(requestPermission:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  UNAuthorizationOptions options = UNAuthorizationOptionAlert | UNAuthorizationOptionSound | UNAuthorizationOptionBadge;
  [[UNUserNotificationCenter currentNotificationCenter]
      requestAuthorizationWithOptions:options
                    completionHandler:^(BOOL granted, NSError *_Nullable error) {
                      if (error != nil) {
                        reject(@"permission", error.localizedDescription, error);
                        return;
                      }
                      resolve(@(granted));
                    }];
}

/** "granted", "denied" or "undetermined" - so the UI can offer Settings instead of a dead button. */
RCT_EXPORT_METHOD(getPermission:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter]
      getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *_Nonnull settings) {
        switch (settings.authorizationStatus) {
          case UNAuthorizationStatusNotDetermined:
            resolve(@"undetermined");
            break;
          case UNAuthorizationStatusDenied:
            resolve(@"denied");
            break;
          default:
            resolve(@"granted");
            break;
        }
      }];
}

/**
 * Posts a notification right now. `threadId` groups a conversation's
 * notifications into one stack in Notification Centre, the way a messaging
 * app does, so ten messages from one seat don't become ten separate cards.
 */
RCT_EXPORT_METHOD(present:(NSString *)title
                  body:(NSString *)body
                  threadId:(NSString *)threadId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  UNMutableNotificationContent *content = [UNMutableNotificationContent new];
  content.title = title ?: @"";
  content.body = body ?: @"";
  content.sound = [UNNotificationSound defaultSound];
  if (threadId != nil) {
    content.threadIdentifier = threadId;
  }

  // No trigger means "deliver immediately".
  UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:[[NSUUID UUID] UUIDString]
                                                                       content:content
                                                                       trigger:nil];
  [[UNUserNotificationCenter currentNotificationCenter] addNotificationRequest:request
                                                        withCompletionHandler:^(NSError *_Nullable error) {
                                                          if (error != nil) {
                                                            reject(@"present", error.localizedDescription, error);
                                                            return;
                                                          }
                                                          resolve(@YES);
                                                        }];
}

/**
 * Shows a notification under a fixed identifier, so a later one with the same
 * identifier replaces it in place instead of stacking. `quiet` makes that
 * replacement silent - no sound, no banner, just the card in the list with
 * its new text - which is how the common chat's summary keeps counting.
 */
RCT_EXPORT_METHOD(presentReplacing:(NSString *)title
                  body:(NSString *)body
                  threadId:(NSString *)threadId
                  identifier:(NSString *)identifier
                  quiet:(BOOL)quiet
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  UNMutableNotificationContent *content = [UNMutableNotificationContent new];
  content.title = title ?: @"";
  content.body = body ?: @"";
  if (threadId != nil) {
    content.threadIdentifier = threadId;
  }
  if (quiet) {
    if (@available(iOS 15.0, *)) {
      content.interruptionLevel = UNNotificationInterruptionLevelPassive;
    }
  } else {
    content.sound = [UNNotificationSound defaultSound];
  }

  UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:identifier
                                                                       content:content
                                                                       trigger:nil];
  [[UNUserNotificationCenter currentNotificationCenter] addNotificationRequest:request
                                                        withCompletionHandler:^(NSError *_Nullable error) {
                                                          if (error != nil) {
                                                            reject(@"present", error.localizedDescription, error);
                                                            return;
                                                          }
                                                          resolve(@YES);
                                                        }];
}

/** Unread count on the home-screen icon. Passing 0 clears it. */
RCT_EXPORT_METHOD(setBadge:(double)count
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSInteger value = (NSInteger)count;
  if (@available(iOS 16.0, *)) {
    [[UNUserNotificationCenter currentNotificationCenter] setBadgeCount:value withCompletionHandler:nil];
  } else {
    dispatch_async(dispatch_get_main_queue(), ^{
      [UIApplication sharedApplication].applicationIconBadgeNumber = value;
    });
  }
  resolve(@YES);
}

/** Wipes the delivered notifications once the user is back inside the app. */
RCT_EXPORT_METHOD(clearDelivered:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter] removeAllDeliveredNotifications];
  resolve(@YES);
}

@end
