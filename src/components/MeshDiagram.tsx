import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { t } from '../i18n';
import { useThemedStyles } from '../theme/ThemeContext';

const NODE = 58;
/** One full journey of a message across the diagram; both hops share it so they stay in phase. */
const CYCLE = 2600;
const TRAVEL = 850;
const PACKET = 9;

/** One Bluetooth ring: grows out of the node and fades, like a radio wave leaving the phone. */
function Ripple({ delay, paused }: { delay: number; paused: boolean }) {
  const progress = useRef(new Animated.Value(0)).current;
  const styles = useThemedStyles(({ colors, radii }) => ({
    ring: {
      position: 'absolute' as const,
      width: NODE,
      height: NODE,
      borderRadius: radii.pill,
      borderWidth: 2,
      borderColor: colors.accent,
    },
  }));

  useEffect(() => {
    if (paused) {
      progress.setValue(0);
      return;
    }
    const animation = Animated.sequence([
      Animated.delay(delay),
      Animated.loop(
        Animated.timing(progress, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ),
    ]);
    animation.start();
    return () => animation.stop();
  }, [delay, paused, progress]);

  if (paused) return null;

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
          transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.75, 2] }) }],
        },
      ]}
    />
  );
}

interface NodeProps {
  label: string;
  /** The passenger holding the phone - filled in, so "you" reads at a glance. */
  mine?: boolean;
  /** Left the app: greyed out and no longer emitting. */
  offline?: boolean;
  phase?: number;
}

function MeshNode({ label, mine, offline, phase = 0 }: NodeProps) {
  const styles = useThemedStyles(({ colors, radii }) => ({
    wrapper: { width: NODE, height: NODE, alignItems: 'center' as const, justifyContent: 'center' as const },
    circle: {
      width: NODE,
      height: NODE,
      borderRadius: radii.pill,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    circleMine: { borderColor: colors.accent, backgroundColor: colors.accent },
    circleOffline: { borderColor: colors.border, backgroundColor: colors.background, borderStyle: 'dashed' as const },
    text: { color: colors.text, fontWeight: '700' as const, fontSize: 13 },
    textMine: { color: '#FFFFFF' },
    textOffline: { color: colors.textMuted },
  }));

  return (
    <View style={styles.wrapper}>
      {[0, 1, 2].map((index) => (
        <Ripple key={index} delay={phase + index * 600} paused={!!offline} />
      ))}
      <View style={[styles.circle, mine && styles.circleMine, offline && styles.circleOffline]}>
        <Text style={[styles.text, mine && styles.textMine, offline && styles.textOffline]}>{label}</Text>
      </View>
    </View>
  );
}

/** The gap between two phones, with the message itself crossing it. `silent` = nothing gets through. */
function Hop({ delay, silent }: { delay: number; silent?: boolean }) {
  const [width, setWidth] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const styles = useThemedStyles(({ colors, radii }) => ({
    hop: { flex: 1, height: PACKET, justifyContent: 'center' as const },
    line: { position: 'absolute' as const, left: 0, right: 0, height: 2, backgroundColor: colors.border },
    lineSilent: { opacity: 0.4 },
    packet: {
      position: 'absolute' as const,
      left: 0,
      width: PACKET,
      height: PACKET,
      borderRadius: radii.pill,
      backgroundColor: colors.accent,
    },
  }));

  useEffect(() => {
    if (silent || width === 0) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: TRAVEL,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(Math.max(0, CYCLE - delay - TRAVEL)),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [delay, silent, width, progress]);

  return (
    <View style={styles.hop} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <View style={[styles.line, silent && styles.lineSilent]} />
      {!silent && width > 0 && (
        <Animated.View
          style={[
            styles.packet,
            {
              // Invisible at both ends so it appears to leave one phone and land in the next.
              opacity: progress.interpolate({ inputRange: [0, 0.08, 0.92, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, width - PACKET] }) },
              ],
            },
          ]}
        />
      )}
    </View>
  );
}

interface Props {
  /**
   * `relay`: the message hops all the way across.
   * `broken`: the middle passenger left the app, so it never arrives.
   */
  variant: 'relay' | 'broken';
}

export function MeshDiagram({ variant }: Props) {
  const broken = variant === 'broken';
  const styles = useThemedStyles(({ spacing }) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      // Twice the node height so the rings have room to expand without clipping.
      height: NODE * 2,
      marginVertical: spacing(1),
    },
  }));

  return (
    <View style={styles.row}>
      <MeshNode label={t.tutorial.diagramYou} mine phase={0} />
      <Hop delay={150} />
      <MeshNode label="14C" offline={broken} phase={400} />
      <Hop delay={1000} silent={broken} />
      <MeshNode label="21F" phase={800} />
    </View>
  );
}
