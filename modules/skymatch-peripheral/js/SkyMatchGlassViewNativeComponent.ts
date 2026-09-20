import type { HostComponent, ViewProps } from 'react-native';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type { ColorValue, Float, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';

/**
 * A pane of the system's own glass, to sit behind content.
 *
 * It hosts no React children on purpose: a leaf view is far simpler and far
 * harder to get wrong than one that has to adopt the renderer's children,
 * and the caller can lay it out behind whatever it likes with
 * `StyleSheet.absoluteFill`.
 */
export interface NativeProps extends ViewProps {
  /** The clear variant, which tints far less and lets more through. */
  clear?: WithDefault<boolean, false>;
  /** Lets the glass react to touches the way the system's own controls do. */
  interactive?: WithDefault<boolean, false>;
  /** Rounded to match the shape it is sitting behind. */
  cornerRadius?: WithDefault<Float, 0>;
  /** Optional colour cast over the glass. */
  tint?: ColorValue;
}

export default codegenNativeComponent<NativeProps>('SkyMatchGlassView') as HostComponent<NativeProps>;
