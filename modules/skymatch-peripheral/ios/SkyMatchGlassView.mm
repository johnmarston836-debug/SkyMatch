#import "SkyMatchGlassView.h"

#import <react/renderer/components/SkyMatchGlassViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/SkyMatchGlassViewSpec/Props.h>
#import <react/renderer/components/SkyMatchGlassViewSpec/RCTComponentViewHelpers.h>

#import <React/RCTConversions.h>
#import <React/RCTViewComponentView.h>

using namespace facebook::react;

@interface SkyMatchGlassView () <RCTSkyMatchGlassViewViewProtocol>
@end

@implementation SkyMatchGlassView {
  UIVisualEffectView *_effectView;
  BOOL _clear;
  BOOL _interactive;
  CGFloat _requestedRadius;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<SkyMatchGlassViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const SkyMatchGlassViewProps>();
    _props = defaultProps;
    _clear = NO;
    _interactive = NO;
    _requestedRadius = 0;

    _effectView = [[UIVisualEffectView alloc] initWithEffect:[self effectForClear:NO interactive:NO]];
    _effectView.frame = self.bounds;
    _effectView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _effectView.clipsToBounds = YES;
    // Purely decorative: it must never take a touch away from the button in
    // front of it.
    _effectView.userInteractionEnabled = NO;
    self.userInteractionEnabled = NO;
    [self addSubview:_effectView];
  }
  return self;
}

/**
 * Liquid Glass when the system has it, the older frosted material when it
 * doesn't.
 *
 * `UIGlassEffect` is resolved by name rather than referenced directly, so
 * this file compiles against any SDK - including ones released before the
 * class existed - and simply uses whatever the device it ends up on knows
 * how to do.
 */
- (UIVisualEffect *)effectForClear:(BOOL)clear interactive:(BOOL)interactive
{
  Class glassClass = NSClassFromString(@"UIGlassEffect");
  if (glassClass != nil) {
    id effect = [[glassClass alloc] init];

    if (clear && [glassClass respondsToSelector:@selector(clearEffect)]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
      id clearEffect = [glassClass performSelector:@selector(clearEffect)];
#pragma clang diagnostic pop
      if (clearEffect != nil) {
        effect = clearEffect;
      }
    }
    if ([effect respondsToSelector:@selector(setInteractive:)]) {
      [effect setInteractive:interactive];
    }
    if ([effect isKindOfClass:[UIVisualEffect class]]) {
      return (UIVisualEffect *)effect;
    }
  }

  return [UIBlurEffect effectWithStyle:clear ? UIBlurEffectStyleSystemUltraThinMaterial
                                             : UIBlurEffectStyleSystemThinMaterial];
}

/**
 * A pill is asked for with an absurd radius (999) because that is how a pill
 * is written in a stylesheet. A layer takes it literally and draws garbage,
 * so it is capped at half the shorter side - which is exactly a pill.
 */
- (void)layoutSubviews
{
  [super layoutSubviews];

  CGFloat limit = MIN(CGRectGetWidth(self.bounds), CGRectGetHeight(self.bounds)) / 2.0;
  CGFloat radius = _requestedRadius <= 0 ? 0 : MIN(_requestedRadius, limit);
  if (_effectView.layer.cornerRadius != radius) {
    _effectView.layer.cornerRadius = radius;
    _effectView.layer.masksToBounds = YES;
    if (@available(iOS 13.0, *)) {
      _effectView.layer.cornerCurve = kCACornerCurveContinuous;
    }
  }
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &next = *std::static_pointer_cast<SkyMatchGlassViewProps const>(props);

  if (next.clear != _clear || next.interactive != _interactive) {
    _clear = next.clear;
    _interactive = next.interactive;
    _effectView.effect = [self effectForClear:_clear interactive:_interactive];
  }

  // Rounded here as well as on the React parent: a parent that clips is
  // enough in most cases, but the effect view has its own layer and square
  // corners on it show through at the edges. The value is applied in
  // layoutSubviews, where the size it has to be clamped against is known.
  if (_requestedRadius != (CGFloat)next.cornerRadius) {
    _requestedRadius = (CGFloat)next.cornerRadius;
    [self setNeedsLayout];
  }

  UIColor *tint = RCTUIColorFromSharedColor(next.tint);
  if (![_effectView.contentView.backgroundColor isEqual:tint]) {
    _effectView.contentView.backgroundColor = tint;
  }

  [super updateProps:props oldProps:oldProps];
}

@end

Class<RCTComponentViewProtocol> SkyMatchGlassViewCls(void)
{
  return SkyMatchGlassView.class;
}
