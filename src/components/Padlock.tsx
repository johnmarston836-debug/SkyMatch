import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

/**
 * A padlock drawn in two pieces, so it takes the theme's colours like
 * everything else. `open` (0 -> 1) lifts the shackle out of the body.
 */
export function Padlock({ color, size, open }: { color: string; size: number; open?: Animated.AnimatedInterpolation<number> }) {
  return (
    <View style={padlock.lock}>
      <Animated.View
        style={[
          padlock.shackle,
          {
            width: size * 0.62,
            height: size * 0.5,
            borderWidth: Math.max(1.5, size * 0.13),
            borderColor: color,
            borderTopLeftRadius: size,
            borderTopRightRadius: size,
          },
          open ? { transform: [{ translateY: Animated.multiply(open, -size * 0.3) }] } : null,
        ]}
      />
      <View style={{ width: size, height: size * 0.66, borderRadius: size * 0.16, backgroundColor: color }} />
    </View>
  );
}

const padlock = StyleSheet.create({
  lock: { alignItems: 'center' },
  shackle: { borderBottomWidth: 0 },
});
