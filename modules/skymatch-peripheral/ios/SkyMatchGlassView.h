#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * A pane of the system's glass, to sit behind content.
 *
 * Hosts no React children by design: a leaf view has none of the mounting
 * rules a container has, and the caller lays it out behind whatever it wants
 * with an absolute fill.
 */
@interface SkyMatchGlassView : RCTViewComponentView
@end

NS_ASSUME_NONNULL_END
