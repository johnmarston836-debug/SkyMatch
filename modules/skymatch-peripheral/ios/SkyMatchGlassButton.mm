#import "SkyMatchGlassButton.h"

#import <react/renderer/components/SkyMatchGlassSpec/ComponentDescriptors.h>
#import <react/renderer/components/SkyMatchGlassSpec/EventEmitters.h>
#import <react/renderer/components/SkyMatchGlassSpec/Props.h>
#import <react/renderer/components/SkyMatchGlassSpec/RCTComponentViewHelpers.h>

#import <React/RCTConversions.h>

#import <skymatch_peripheral/skymatch_peripheral-Swift.h>

using namespace facebook::react;

@interface SkyMatchGlassButton () <RCTSkyMatchGlassButtonViewProtocol>
@end

@implementation SkyMatchGlassButton {
  SkyMatchGlassButtonHost *_button;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<SkyMatchGlassButtonComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const SkyMatchGlassButtonProps>();
    _props = defaultProps;

    _button = [[SkyMatchGlassButtonHost alloc] initWithFrame:self.bounds];
    _button.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;

    __weak __typeof(self) weakSelf = self;
    _button.onPress = ^{
      __strong __typeof(weakSelf) self = weakSelf;
      if (self == nil || self->_eventEmitter == nullptr) {
        return;
      }
      std::static_pointer_cast<SkyMatchGlassButtonEventEmitter const>(self->_eventEmitter)
          ->onPress(SkyMatchGlassButtonEventEmitter::OnPress{});
    };
    _button.onMeasured = ^(CGFloat width, CGFloat height) {
      __strong __typeof(weakSelf) self = weakSelf;
      if (self == nil || self->_eventEmitter == nullptr) {
        return;
      }
      std::static_pointer_cast<SkyMatchGlassButtonEventEmitter const>(self->_eventEmitter)
          ->onSizeChange(SkyMatchGlassButtonEventEmitter::OnSizeChange{
              .width = (double)width,
              .height = (double)height,
          });
    };

    [self addSubview:_button];
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &next = *std::static_pointer_cast<SkyMatchGlassButtonProps const>(props);

  NSString *title = [NSString stringWithUTF8String:next.title.c_str()];
  if (![_button.title isEqualToString:title]) {
    _button.title = title;
  }

  NSString *badge = next.badge.empty() ? nil : [NSString stringWithUTF8String:next.badge.c_str()];
  if (_button.badge != badge && ![_button.badge isEqualToString:badge]) {
    _button.badge = badge;
  }

  if (_button.prominent != next.prominent) {
    _button.prominent = next.prominent;
  }
  if (_button.enabled != next.enabled) {
    _button.enabled = next.enabled;
  }

  UIColor *tint = RCTUIColorFromSharedColor(next.tint);
  if (![_button.tint isEqual:tint]) {
    _button.tint = tint;
  }

  [super updateProps:props oldProps:oldProps];
}

@end

Class<RCTComponentViewProtocol> SkyMatchGlassButtonCls(void)
{
  return SkyMatchGlassButton.class;
}
