import type { ColorValue, HostComponent, ViewProps } from 'react-native';

/**
 * Declared here rather than imported from the codegen spec: that file is
 * written for React Native's code generator, in the deep-import dialect the
 * generator understands, and pulling it into the app's typecheck drags that
 * dialect along with it.
 */
export interface GlassProps extends ViewProps {
  /** The clear variant, which tints far less and lets more through. */
  clear?: boolean;
  /** Lets the glass react to touches the way the system's own controls do. */
  interactive?: boolean;
  /** Rounded to match the shape it is sitting behind. */
  cornerRadius?: number;
  /** Optional colour cast over the glass. */
  tint?: ColorValue;
}

/** Null where the native pane isn't available, so callers can draw their own. */
export declare const GlassView: HostComponent<GlassProps> | null;
export declare const isSupported: boolean;
