import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View, type EasingFunction } from 'react-native';
import { t } from '../i18n';
import { useAppTheme, useThemedStyles } from '../theme/ThemeContext';

/** The phone glyph, and the room its radio rings get around it. */
const PHONE_W = 38;
const PHONE_H = 62;
const RING = 66;
/** One full journey of a message across the diagram, with a pause at the end for the tick; every moving part shares this loop so they stay in phase. */
const CYCLE = 3600;
const TRAVEL = 850;
/** When the message leaves you, when it sets off again from the middle, and when it lands in each phone. */
const FIRST_HOP_AT = 200;
const SECOND_HOP_AT = FIRST_HOP_AT + TRAVEL + 150;
const MIDDLE_ARRIVAL = FIRST_HOP_AT + TRAVEL;
const LAST_ARRIVAL = SECOND_HOP_AT + TRAVEL;
const PACKET = 10;
const LOCK = 14;

/** Made once: a new easing on every render would restart every loop that depends on it. */
const MOVE = Easing.inOut(Easing.quad);
const FADE = Easing.out(Easing.quad);
const STEADY = Easing.linear;

/**
 * A value that runs 0 -> 1 once per CYCLE, starting `at` ms into it and
 * taking `duration`. Every moving part of the diagram is one of these, so
 * the packet, the screen that lights up when it lands and the tick that
 * follows can never drift apart.
 */
function useCycle(at: number, duration: number, easing: EasingFunction) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(at),
        Animated.timing(value, { toValue: 1, duration, easing, useNativeDriver: true }),
        Animated.delay(Math.max(0, CYCLE - at - duration)),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [at, duration, easing, value]);
  return value;
}

/** One Bluetooth ring: grows out of the phone and fades, like a radio wave leaving it. */
function Ripple({ delay, faint }: { delay: number; faint?: boolean }) {
  const progress = useRef(new Animated.Value(0)).current;
  const styles = useThemedStyles(({ colors, radii }) => ({
    ring: {
      position: 'absolute' as const,
      width: RING,
      height: RING,
      borderRadius: radii.pill,
      borderWidth: 2,
      borderColor: colors.accent,
    },
  }));

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(delay),
      Animated.loop(Animated.timing(progress, { toValue: 1, duration: 1800, easing: FADE, useNativeDriver: true })),
    ]);
    animation.start();
    return () => animation.stop();
  }, [delay, progress]);

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [faint ? 0.25 : 0.45, 0] }),
          transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.7] }) }],
        },
      ]}
    />
  );
}

/**
 * A padlock drawn in two pieces, so it takes the theme's colours like
 * everything else. `open` (0 -> 1) lifts the shackle out of the body.
 */
function Padlock({ color, size, open }: { color: string; size: number; open?: Animated.AnimatedInterpolation<number> }) {
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

type Screen =
  /** You: filled in, so it reads at a glance. */
  | 'you'
  /** Screen off, in a pocket - and still passing messages on. */
  | 'locked'
  /** Holds the message only as it travels - encrypted - and can't open it. */
  | 'blind'
  | 'plain';

interface PhoneProps {
  screen: Screen;
  /** 0 -> 1 as the message lands here: the screen lights up for a moment. */
  flash?: Animated.Value;
  /** The tick on the last phone once the message is in. */
  tick?: Animated.Value;
  /**
   * For a sealed message, on the phone it is for: the padlock arrives,
   * opens, and gives way to the message itself - decrypted at the end, and
   * only there.
   */
  unlock?: Animated.Value;
  ripplePhase: number;
}

function Phone({ screen, flash, tick, unlock, ripplePhase }: PhoneProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(({ colors: c, radii }) => ({
    wrapper: { width: RING, height: RING * 1.3, alignItems: 'center' as const, justifyContent: 'center' as const },
    body: {
      width: PHONE_W,
      height: PHONE_H,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center' as const,
      paddingTop: 5,
    },
    bodyYou: { borderColor: c.accent, backgroundColor: c.accent },
    bodyLocked: { backgroundColor: c.background },
    speaker: { width: 10, height: 3, borderRadius: radii.pill, backgroundColor: c.border },
    speakerYou: { backgroundColor: 'rgba(255,255,255,0.6)' },
    screen: {
      flex: 1,
      alignSelf: 'stretch' as const,
      margin: 4,
      borderRadius: 5,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      overflow: 'hidden' as const,
    },
    glow: { position: 'absolute' as const, left: 0, right: 0, top: 0, bottom: 0, backgroundColor: c.accent },
    you: { color: '#FFFFFF', fontWeight: '800' as const, fontSize: 11 },
    tick: { position: 'absolute' as const, color: c.accent, fontWeight: '800' as const, fontSize: 18 },
    overlay: { position: 'absolute' as const, alignItems: 'center' as const, justifyContent: 'center' as const },
    bubble: {
      width: 24,
      paddingVertical: 4,
      paddingHorizontal: 4,
      gap: 3,
      borderRadius: 6,
      borderBottomLeftRadius: 2,
      backgroundColor: c.accent,
    },
    bubbleLine: { height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.9)' },
    bubbleLineShort: { width: '60%' as const },
  }));

  return (
    <View style={styles.wrapper}>
      {[0, 1, 2].map((index) => (
        <Ripple key={index} delay={ripplePhase + index * 600} faint={screen === 'locked'} />
      ))}
      <View style={[styles.body, screen === 'you' && styles.bodyYou, screen === 'locked' && styles.bodyLocked]}>
        <View style={[styles.speaker, screen === 'you' && styles.speakerYou]} />
        <View style={styles.screen}>
          {flash && (
            <Animated.View
              style={[styles.glow, { opacity: flash.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.35, 0] }) }]}
            />
          )}
          {screen === 'you' && <Text style={styles.you}>{t.tutorial.diagramYou}</Text>}
          {screen === 'locked' && <Padlock color={colors.textMuted} size={12} />}
          {screen === 'blind' && (
            // All it ever holds is the padlock: it gives a small nudge as the
            // message goes through, and stays shut.
            <Animated.View
              style={
                flash
                  ? { transform: [{ scale: flash.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 1.2, 1] }) }] }
                  : undefined
              }
            >
              <Padlock color={colors.accent} size={LOCK} />
            </Animated.View>
          )}
          {unlock && (
            <>
              <Animated.View
                style={[
                  styles.overlay,
                  { opacity: unlock.interpolate({ inputRange: [0, 0.05, 0.4, 0.5], outputRange: [0, 1, 1, 0] }) },
                ]}
              >
                <Padlock
                  color={colors.accent}
                  size={LOCK}
                  open={unlock.interpolate({ inputRange: [0.15, 0.32], outputRange: [0, 1], extrapolate: 'clamp' })}
                />
              </Animated.View>
              <Animated.View
                style={[
                  styles.overlay,
                  {
                    opacity: unlock.interpolate({ inputRange: [0, 0.45, 0.55, 0.92, 1], outputRange: [0, 0, 1, 1, 0] }),
                    transform: [
                      { scale: unlock.interpolate({ inputRange: [0.45, 0.6], outputRange: [0.5, 1], extrapolate: 'clamp' }) },
                    ],
                  },
                ]}
              >
                <View style={styles.bubble}>
                  <View style={styles.bubbleLine} />
                  <View style={[styles.bubbleLine, styles.bubbleLineShort]} />
                </View>
              </Animated.View>
            </>
          )}
          {tick && (
            <Animated.Text
              style={[
                styles.tick,
                {
                  opacity: tick.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] }),
                  transform: [{ scale: tick.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.4, 1, 1] }) }],
                },
              ]}
            >
              ✓
            </Animated.Text>
          )}
        </View>
      </View>
    </View>
  );
}

/** The gap between two phones, with the message crossing it: a dot, or a padlock when it is sealed. */
function Hop({ at, sealed }: { at: number; sealed?: boolean }) {
  const { colors } = useAppTheme();
  const [width, setWidth] = useState(0);
  const progress = useCycle(at, TRAVEL, MOVE);
  const styles = useThemedStyles(({ colors: c, radii }) => ({
    hop: { flex: 1, height: 20, justifyContent: 'center' as const },
    line: { position: 'absolute' as const, left: 0, right: 0, height: 2, borderRadius: 1, backgroundColor: c.border },
    packet: { position: 'absolute' as const, left: 0 },
    dot: { width: PACKET, height: PACKET, borderRadius: radii.pill, backgroundColor: c.accent },
  }));
  const size = sealed ? LOCK : PACKET;

  return (
    <View style={styles.hop} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <View style={styles.line} />
      {width > 0 && (
        <Animated.View
          style={[
            styles.packet,
            {
              // Invisible at both ends, so it seems to leave one phone and land in the next.
              opacity: progress.interpolate({ inputRange: [0, 0.08, 0.92, 1], outputRange: [0, 1, 1, 0] }),
              transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, width - size] }) }],
            },
          ]}
        >
          {sealed ? <Padlock color={colors.accent} size={size} /> : <View style={styles.dot} />}
        </Animated.View>
      )}
    </View>
  );
}

interface Props {
  /**
   * `relay`: the message hops across a phone to one out of your reach.
   * `pocket`: the phone in the middle is locked, and still passes it on.
   * `sealed`: end to end - the middle phone only ever holds it encrypted,
   *   and the last one opens it.
   */
  variant: 'relay' | 'pocket' | 'sealed';
}

/** You, a phone in between and one out of your reach, with a message making its way across. */
export function MeshDiagram({ variant }: Props) {
  const middleFlash = useCycle(MIDDLE_ARRIVAL, 500, FADE);
  const lastFlash = useCycle(LAST_ARRIVAL, 500, FADE);
  const lastTick = useCycle(LAST_ARRIVAL + 100, CYCLE - LAST_ARRIVAL - 200, STEADY);
  const lastUnlock = useCycle(LAST_ARRIVAL, CYCLE - LAST_ARRIVAL - 100, STEADY);
  const styles = useThemedStyles(({ spacing }) => ({
    row: { flexDirection: 'row' as const, alignItems: 'center' as const, marginVertical: spacing(1) },
  }));
  const sealed = variant === 'sealed';
  const middle: Screen = variant === 'pocket' ? 'locked' : sealed ? 'blind' : 'plain';

  return (
    <View style={styles.row}>
      <Phone screen="you" ripplePhase={0} />
      <Hop at={FIRST_HOP_AT} sealed={sealed} />
      <Phone screen={middle} ripplePhase={400} flash={middleFlash} />
      <Hop at={SECOND_HOP_AT} sealed={sealed} />
      {sealed ? (
        <Phone screen="plain" ripplePhase={800} unlock={lastUnlock} />
      ) : (
        <Phone screen="plain" ripplePhase={800} flash={lastFlash} tick={lastTick} />
      )}
    </View>
  );
}
