import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, Keyboard, Platform, type KeyboardEvent } from 'react-native';

/**
 * iOS' own keyboard curve. Animating with anything else (or with a default
 * spring) is what makes the input box look like it is chasing the keyboard
 * instead of riding it.
 */
const KEYBOARD_CURVE = Easing.bezier(0.17, 0.59, 0.4, 0.77);

/**
 * Bottom padding that tracks the keyboard frame by frame.
 *
 * `KeyboardAvoidingView` only learns the keyboard's final height and then
 * runs its own animation, so it lags, and it stacks its padding on top of the
 * home-indicator inset the layout already had - the extra gap under the text
 * box. Here there is a single value: the safe-area inset while the keyboard
 * is down, the keyboard's own height while it is up, moved with the duration
 * and curve iOS reports for that very transition.
 *
 * Android is left alone: `adjustResize` already does this at window level,
 * and padding on top of it would double up.
 */
export function useKeyboardPadding(resting: number): Animated.Value {
  const padding = useRef(new Animated.Value(resting)).current;
  const restingRef = useRef(resting);
  restingRef.current = resting;

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      padding.setValue(restingRef.current);
      return;
    }

    // `willChangeFrame` covers every case in one event: opening, closing,
    // switching to the emoji keyboard, and the predictive bar appearing.
    const subscription = Keyboard.addListener('keyboardWillChangeFrame', (event: KeyboardEvent) => {
      const screenHeight = Dimensions.get('screen').height;
      const covered = Math.max(0, screenHeight - event.endCoordinates.screenY);
      Animated.timing(padding, {
        toValue: covered > 0 ? covered : restingRef.current,
        duration: event.duration > 0 ? event.duration : 250,
        easing: KEYBOARD_CURVE,
        // Padding is a layout prop, so this one can't run on the UI thread;
        // it is a single value per frame and stays smooth anyway.
        useNativeDriver: false,
      }).start();
    });

    return () => subscription.remove();
  }, [padding]);

  return padding;
}
