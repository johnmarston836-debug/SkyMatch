import type { HostComponent, ViewProps } from 'react-native';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type { Float, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';

/**
 * A pane of SwiftUI's `glassEffect(_:in:)`, to sit behind content.
 *
 * It hosts no React children on purpose: a leaf view has none of the
 * mounting rules a container has, and the caller puts it behind whatever it
 * likes with an absolute fill.
 */
export interface NativeProps extends ViewProps {
  /** `Glass.clear` instead of `Glass.regular`: lets far more through. */
  clear?: WithDefault<boolean, false>;
  /** Rounded to match the shape it sits behind; capped natively at a pill. */
  cornerRadius?: WithDefault<Float, 0>;
}

export default codegenNativeComponent<NativeProps>('SkyMatchGlassView') as HostComponent<NativeProps>;
