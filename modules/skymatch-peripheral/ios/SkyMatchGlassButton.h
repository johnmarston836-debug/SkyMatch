#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * A system glass button - `.buttonStyle(.glass)` / `.glassProminent` - drawn
 * by SwiftUI and laid out by React Native.
 *
 * Its label is a prop rather than React children: SwiftUI draws the label
 * itself, and that is the part of the control Apple tunes. The size it wants
 * comes back to JavaScript through `onSizeChange`, because Yoga cannot
 * measure SwiftUI text.
 */
@interface SkyMatchGlassButton : RCTViewComponentView
@end

NS_ASSUME_NONNULL_END
