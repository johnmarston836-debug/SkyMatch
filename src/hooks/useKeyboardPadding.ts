import { Platform } from 'react-native';
import { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';

/**
 * Bottom padding that tracks the keyboard frame by frame, on the UI thread.
 *
 * The first attempt at this ran an `Animated.timing` on the JS thread with
 * the duration iOS reports. On paper that matches the keyboard; in practice
 * the JS thread is the busiest thread in the app at exactly that moment -
 * focusing the input, the list re-measuring - so the animation starts late
 * and drops frames, and the box visibly crawls up behind the keyboard.
 *
 * Reanimated's keyboard value is updated by the platform on the UI thread,
 * and the style derived from it is applied there too, so JS is never in the
 * loop and the box cannot fall behind.
 */
function useIosKeyboardPadding(resting: number) {
  const keyboard = useAnimatedKeyboard();

  return useAnimatedStyle(() => {
    // The keyboard's own height already covers the home indicator, so the
    // safe-area inset only applies while it is down.
    return { paddingBottom: Math.max(resting, keyboard.height.value) };
  }, [resting]);
}

/** Android resizes the window itself (`adjustResize`); padding on top of that would double up. */
function useStaticPadding(resting: number) {
  return { paddingBottom: resting };
}

/**
 * Picked once at module load rather than per render: `Platform.OS` never
 * changes while the app is running, so the hook's identity stays stable and
 * the rules of hooks hold.
 */
export const useKeyboardPadding = Platform.OS === 'ios' ? useIosKeyboardPadding : useStaticPadding;
