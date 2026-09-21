import type { ColorValue, HostComponent, NativeSyntheticEvent, ViewProps } from 'react-native';

/**
 * Declared here rather than imported from the codegen specs: those are
 * written for React Native's code generator, in the deep-import dialect it
 * understands, and pulling them into the app's typecheck drags that dialect
 * along with them.
 */
export interface GlassProps extends ViewProps {
  cornerRadius?: number;
}

export interface GlassButtonProps extends ViewProps {
  title: string;
  badge?: string;
  prominent?: boolean;
  enabled?: boolean;
  tint?: ColorValue;
  onPress?: (event: NativeSyntheticEvent<null>) => void;
  onSizeChange?: (event: NativeSyntheticEvent<Readonly<{ width: number; height: number }>>) => void;
}

/** Null where the native pieces aren't available, so callers can draw their own. */
export declare const GlassView: HostComponent<GlassProps> | null;
export declare const GlassButtonView: HostComponent<GlassButtonProps> | null;
export declare const isSupported: boolean;
