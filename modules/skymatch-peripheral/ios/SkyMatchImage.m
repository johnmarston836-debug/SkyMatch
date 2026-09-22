#import "SkyMatchImage.h"
#import <UIKit/UIKit.h>

@implementation SkyMatchImage

RCT_EXPORT_MODULE();

/** Nothing here touches the view hierarchy, so it needn't hold up the launch. */
+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

/**
 * Off the main queue: a photo out of the library can be several megapixels,
 * and decoding plus redrawing it is long enough to drop frames if it runs
 * where the interface does.
 */
- (dispatch_queue_t)methodQueue
{
  return dispatch_queue_create("com.efs.skymatch.image", DISPATCH_QUEUE_SERIAL);
}

/**
 * Scales a base64 JPEG so its longest side is at most `maxSide`, re-encodes
 * it at `quality` (0..1) and hands back base64 again.
 *
 * Resolves to null rather than rejecting when the input isn't an image the
 * system can read: the caller's fallback is to use the photo it already
 * has, and a rejection there would turn a slightly larger photo into no
 * photo at all.
 */
RCT_EXPORT_METHOD(resize:(NSString *)base64
                  maxSide:(nonnull NSNumber *)maxSide
                  quality:(nonnull NSNumber *)quality
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(__unused RCTPromiseRejectBlock)reject)
{
  NSData *data = [[NSData alloc] initWithBase64EncodedString:base64
                                                     options:NSDataBase64DecodingIgnoreUnknownCharacters];
  UIImage *image = data.length > 0 ? [UIImage imageWithData:data] : nil;
  if (image == nil) {
    resolve([NSNull null]);
    return;
  }

  CGFloat longest = MAX(image.size.width, image.size.height);
  CGFloat side = maxSide.doubleValue;
  // Never upscale: enlarging a small photo costs bytes and adds nothing.
  CGFloat ratio = (longest > side && longest > 0) ? side / longest : 1.0;
  CGSize target = CGSizeMake(round(image.size.width * ratio), round(image.size.height * ratio));
  if (target.width < 1 || target.height < 1) {
    resolve([NSNull null]);
    return;
  }

  UIGraphicsImageRendererFormat *format = [UIGraphicsImageRendererFormat defaultFormat];
  // scale 1 because `target` is already in pixels, not points; opaque
  // because a JPEG has no alpha and the extra channel would only cost time.
  format.scale = 1.0;
  format.opaque = YES;

  UIGraphicsImageRenderer *renderer = [[UIGraphicsImageRenderer alloc] initWithSize:target format:format];
  UIImage *scaled = [renderer imageWithActions:^(__unused UIGraphicsImageRendererContext *context) {
    [image drawInRect:CGRectMake(0, 0, target.width, target.height)];
  }];

  NSData *jpeg = UIImageJPEGRepresentation(scaled, quality.doubleValue);
  if (jpeg.length == 0) {
    resolve([NSNull null]);
    return;
  }

  resolve([jpeg base64EncodedStringWithOptions:0]);
}

@end
