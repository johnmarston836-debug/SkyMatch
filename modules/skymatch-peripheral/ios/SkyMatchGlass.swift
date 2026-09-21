import SwiftUI
import UIKit

/**
 Liquid Glass, straight from SwiftUI.

 Everything here is written twice: once against the iOS 26 APIs and once
 against what came before. `#if compiler(>=6.2)` is what decides whether the
 first version is even compiled - `glassEffect(_:in:)` and `.buttonStyle(.glass)`
 do not exist in earlier SDKs, and `if #available` alone does not save you
 from that, because the compiler still has to understand the call. The
 runtime check inside then decides which one actually runs.
 */

// MARK: - Surface

/// A pane of glass to sit behind arbitrary React Native content.
private struct GlassSurface: View {
  let cornerRadius: CGFloat
  let clear: Bool

  var body: some View {
    #if compiler(>=6.2)
      if #available(iOS 26.0, *) {
        // `.clear` lets far more through than `.regular`; both refract what
        // is behind them, which is the whole point of the material.
        Color.clear.glassEffect(
          clear ? Glass.clear : Glass.regular,
          in: .rect(cornerRadius: cornerRadius)
        )
      } else {
        fallback
      }
    #else
      fallback
    #endif
  }

  /// Before iOS 26 the nearest thing is a blur material. It does not refract,
  /// but it is translucent and it is the system's own.
  private var fallback: some View {
    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
      .fill(.ultraThinMaterial)
  }
}

/// UIKit wrapper so Objective-C++ (and through it, Fabric) can hold one.
@objc(SkyMatchGlassSurfaceHost)
public final class SkyMatchGlassSurfaceHost: UIView {
  @objc public var cornerRadius: CGFloat = 0 { didSet { refresh() } }
  @objc public var clear: Bool = false { didSet { refresh() } }

  private var host: UIHostingController<AnyView>?

  public override init(frame: CGRect) {
    super.init(frame: frame)
    // Decoration only: it must never take a touch from the control in front.
    isUserInteractionEnabled = false
    backgroundColor = .clear
    refresh()
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) { fatalError("not used") }

  private func refresh() {
    let root = AnyView(GlassSurface(cornerRadius: cornerRadius, clear: clear))

    if let host {
      host.rootView = root
      return
    }

    let controller = UIHostingController(rootView: root)
    controller.view.backgroundColor = .clear
    controller.view.isUserInteractionEnabled = false
    controller.view.frame = bounds
    controller.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    addSubview(controller.view)
    host = controller
  }
}

// MARK: - Button

/// A real system glass button: Apple draws it, Apple animates it.
private struct GlassButton: View {
  let title: String
  let badge: String?
  let prominent: Bool
  let tint: Color?
  let action: () -> Void

  var body: some View {
    #if compiler(>=6.2)
      if #available(iOS 26.0, *) {
        // Apple's guidance is explicit: a glass *button* comes from the
        // button style, not from putting a glass effect on a button.
        if prominent {
          styled.buttonStyle(.glassProminent)
        } else {
          styled.buttonStyle(.glass)
        }
      } else {
        fallback
      }
    #else
      fallback
    #endif
  }

  private var styled: some View {
    Button(action: action) { label }.tint(tint)
  }

  private var fallback: some View {
    Button(action: action) { label }
      .buttonStyle(.borderedProminent)
      .tint(tint ?? .accentColor)
      .buttonBorderShape(.capsule)
  }

  private var label: some View {
    HStack(spacing: 6) {
      Text(title).font(.system(size: 15, weight: .semibold))
      if let badge, !badge.isEmpty {
        Text(badge)
          .font(.system(size: 11, weight: .heavy))
          .padding(.horizontal, 5)
          .padding(.vertical, 1)
          .background(Capsule().fill(.background))
          .foregroundStyle(tint ?? .accentColor)
      }
    }
  }
}

@objc(SkyMatchGlassButtonHost)
public final class SkyMatchGlassButtonHost: UIView {
  @objc public var title: String = "" { didSet { refresh() } }
  @objc public var badge: String? { didSet { refresh() } }
  @objc public var prominent: Bool = false { didSet { refresh() } }
  @objc public var tint: UIColor? { didSet { refresh() } }
  @objc public var enabled: Bool = true { didSet { refresh() } }

  /// Called on tap.
  @objc public var onPress: (() -> Void)?
  /**
   Called with the size SwiftUI wants to be.

   React Native lays out with Yoga, in JavaScript, and JavaScript has no way
   to know how wide a string is once SwiftUI has set it. So the view measures
   itself and tells the JavaScript side, which applies it back as a style -
   one extra pass, and the alternative is a C++ shadow node.
   */
  @objc public var onMeasured: ((CGFloat, CGFloat) -> Void)?

  private var host: UIHostingController<AnyView>?
  private var lastReported: CGSize = .zero

  public override init(frame: CGRect) {
    super.init(frame: frame)
    backgroundColor = .clear
    refresh()
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) { fatalError("not used") }

  private func refresh() {
    let root = AnyView(
      GlassButton(
        title: title,
        badge: badge,
        prominent: prominent,
        tint: tint.map(Color.init(uiColor:)),
        action: { [weak self] in self?.onPress?() }
      )
      .disabled(!enabled)
    )

    if let host {
      host.rootView = root
    } else {
      let controller = UIHostingController(rootView: root)
      controller.view.backgroundColor = .clear
      controller.view.frame = bounds
      controller.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      addSubview(controller.view)
      host = controller
    }

    report()
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    report()
  }

  private func report() {
    guard let host else { return }
    let fitted = host.sizeThatFits(in: UIView.layoutFittingCompressedSize)
    guard fitted.width > 0, fitted.height > 0 else { return }
    // Only when it actually changed: this runs from layout, and feeding the
    // same size back into layout on every pass is a loop.
    guard abs(fitted.width - lastReported.width) > 0.5 || abs(fitted.height - lastReported.height) > 0.5 else {
      return
    }
    lastReported = fitted
    onMeasured?(fitted.width, fitted.height)
  }
}
