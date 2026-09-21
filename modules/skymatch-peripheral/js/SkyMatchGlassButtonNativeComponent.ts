import type { HostComponent, ViewProps } from 'react-native';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type { ColorValue, DirectEventHandler, Double, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';

/**
 * SwiftUI's own glass button. The label is a prop rather than React
 * children because SwiftUI draws it, and that is the part Apple tunes.
 */
export interface NativeProps extends ViewProps {
  title: string;
  /** Small count beside the label, as on the people button. */
  badge?: string;
  /** `.glassProminent` rather than `.glass`. */
  prominent?: WithDefault<boolean, false>;
  enabled?: WithDefault<boolean, true>;
  tint?: ColorValue;
  onPress?: DirectEventHandler<Readonly<{}>>;
  /** The size SwiftUI wants; Yoga cannot measure SwiftUI text. */
  onSizeChange?: DirectEventHandler<Readonly<{ width: Double; height: Double }>>;
}

export default codegenNativeComponent<NativeProps>('SkyMatchGlassButton') as HostComponent<NativeProps>;
