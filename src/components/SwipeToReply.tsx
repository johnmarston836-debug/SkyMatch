import React, { useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useThemedStyles } from '../theme/ThemeContext';

/** How far the bubble has to travel before letting go counts as "reply to this". */
const TRIGGER = 56;
/** The bubble stops here however hard you pull, so the gesture always feels bounded. */
const MAX_PULL = 80;

interface Props {
  onReply: () => void;
  children: React.ReactNode;
}

/**
 * Drag a message to the right to answer it, as in WhatsApp. The arrow
 * appears behind the bubble and fills in as you pull; past the trigger
 * point, letting go opens the reply and the bubble springs back.
 *
 * The gesture only claims the finger once it has clearly gone sideways
 * (`activeOffsetX`) and gives up as soon as it goes up or down
 * (`failOffsetY`), so scrolling the conversation still wins by default.
 */
export function SwipeToReply({ onReply, children }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const styles = useThemedStyles(({ colors }) => ({
    arrow: { width: 22, height: 22, tintColor: colors.textMuted },
  }));

  const release = (shouldReply: boolean) => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 20 }).start();
    if (shouldReply) onReply();
  };

  const pan = Gesture.Pan()
    // A positive-only threshold: the gesture claims the finger once it has
    // gone 12px to the right, and never for a leftward drag.
    .activeOffsetX(12)
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      // Rightwards only: pulling the other way would fight the list.
      translateX.setValue(Math.max(0, Math.min(event.translationX, MAX_PULL)));
    })
    .onEnd((event) => release(event.translationX >= TRIGGER))
    .onFinalize((_event, success) => {
      if (!success) release(false);
    })
    .runOnJS(true);

  return (
    <View>
      <View style={sheet.arrowSlot} pointerEvents="none">
        <Animated.View
          style={{
            opacity: translateX.interpolate({ inputRange: [0, TRIGGER], outputRange: [0, 1], extrapolate: 'clamp' }),
            transform: [
              { scale: translateX.interpolate({ inputRange: [0, TRIGGER], outputRange: [0.6, 1], extrapolate: 'clamp' }) },
            ],
          }}
        >
          <Image source={require('../assets/icons/reply.png')} style={styles.arrow} resizeMode="contain" />
        </Animated.View>
      </View>

      <Animated.View style={{ transform: [{ translateX }] }}>
        <GestureDetector gesture={pan}>{children as React.ReactElement}</GestureDetector>
      </Animated.View>
    </View>
  );
}

const sheet = StyleSheet.create({
  arrowSlot: {
    position: 'absolute',
    left: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});
