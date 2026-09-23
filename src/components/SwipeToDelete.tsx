import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useThemedStyles } from '../theme/ThemeContext';

/** How wide the red button behind the row is, and where an opened row rests. */
const ACTION_WIDTH = 96;
/** Pulled past this, letting go leaves the row open on its button. */
const OPEN_AT = ACTION_WIDTH / 2;
/** A little give past the button, so the pull never feels like hitting a wall. */
const MAX_PULL = ACTION_WIDTH + 24;

interface Props {
  /** Shown on the button behind the row. */
  label: string;
  /** Tapped the button; the caller decides whether to ask first. */
  onDelete: () => void;
  /** Rows with nothing to delete don't slide at all. */
  enabled?: boolean;
  children: React.ReactNode;
}

/**
 * Slide a row to the left to reveal a delete button behind it, as in the
 * mail and messaging apps people already know.
 *
 * Same rules as SwipeToReply, mirrored: the gesture claims the finger only
 * once it has clearly gone left (`activeOffsetX`) and gives up the moment it
 * goes up or down (`failOffsetY`), so scrolling the list still wins. Letting
 * go past half the button leaves the row open on it; anywhere else, or a
 * slide back to the right, closes it.
 */
export function SwipeToDelete({ label, onDelete, enabled = true, children }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  /** Where the row rests: 0, or -ACTION_WIDTH while open. */
  const restingAt = useRef(0);
  const styles = useThemedStyles(({ colors, radii }) => ({
    action: {
      position: 'absolute' as const,
      top: 0,
      bottom: 0,
      right: 0,
      width: ACTION_WIDTH + radii.md,
      borderRadius: radii.md,
      backgroundColor: colors.danger,
      alignItems: 'flex-end' as const,
      justifyContent: 'center' as const,
    },
    actionButton: {
      width: ACTION_WIDTH,
      height: '100%' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    actionText: { color: '#FFFFFF', fontWeight: '700' as const, fontSize: 15 },
  }));

  const settle = (open: boolean) => {
    restingAt.current = open ? -ACTION_WIDTH : 0;
    Animated.spring(translateX, {
      toValue: restingAt.current,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start();
  };

  const pan = Gesture.Pan()
    .enabled(enabled)
    // Leftwards to open; once open, rightwards has to be allowed too, to
    // slide it shut again.
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      const at = restingAt.current + event.translationX;
      translateX.setValue(Math.max(-MAX_PULL, Math.min(0, at)));
    })
    .onEnd((event) => settle(restingAt.current + event.translationX < -OPEN_AT))
    .onFinalize((_event, success) => {
      if (!success) settle(restingAt.current !== 0);
    })
    .runOnJS(true);

  const handleDelete = () => {
    settle(false);
    onDelete();
  };

  return (
    <View>
      <View style={styles.action}>
        <Pressable style={styles.actionButton} onPress={handleDelete} accessibilityRole="button">
          <Text style={styles.actionText}>{label}</Text>
        </Pressable>
      </View>

      <Animated.View style={[sheet.front, { transform: [{ translateX }] }]}>
        <GestureDetector gesture={pan}>{children as React.ReactElement}</GestureDetector>
      </Animated.View>
    </View>
  );
}

const sheet = StyleSheet.create({
  // Above the red button, so it only shows where the row has slid away.
  front: { zIndex: 1 },
});
