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
  /**
   * Named apart from `onPress` on purpose. Every React Native view already
   * registers `topPress` as a bubbling event, and a component that declares
   * the same name as a direct one fails to register at all - "Event cannot
   * be both direct and bubbling".
   */
  onGlassPress?: DirectEventHandler<null>;
  /** The size SwiftUI wants; Yoga cannot measure SwiftUI text. */
  onGlassSize?: DirectEventHandler<Readonly<{ width: Double; height: Double }>>;
}

export default codegenNativeComponent<NativeProps>('SkyMatchGlassButton') as HostComponent<NativeProps>;
