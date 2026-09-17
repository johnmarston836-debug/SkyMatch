import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, radii, spacing, typography } from '../theme';
import { formatSeat } from '../utils/seat';
import type { DiscoveredPeer } from '../types';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.28;

interface Props {
  peer: DiscoveredPeer;
  onSwiped: (direction: 'like' | 'pass') => void;
  isTop: boolean;
}

export function SwipeCard({ peer, onSwiped, isTop }: Props) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pan = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const direction = event.translationX > 0 ? 'like' : 'pass';
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        translateX.value = withTiming(direction === 'like' ? width * 1.5 : -width * 1.5, { duration: 250 }, () => {
          runOnJS(onSwiped)(direction);
        });
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${translateX.value / 20}deg` },
    ],
  }));

  const likeOpacity = useAnimatedStyle(() => ({ opacity: translateX.value > 0 ? Math.min(translateX.value / SWIPE_THRESHOLD, 1) : 0 }));
  const passOpacity = useAnimatedStyle(() => ({ opacity: translateX.value < 0 ? Math.min(-translateX.value / SWIPE_THRESHOLD, 1) : 0 }));

  const profile = peer.profile;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, cardStyle]}>
        <Animated.View style={[styles.stamp, styles.likeStamp, likeOpacity]}>
          <Text style={styles.likeStampText}>LIKE</Text>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.passStamp, passOpacity]}>
          <Text style={styles.passStampText}>PASS</Text>
        </Animated.View>

        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoInitial}>{(profile?.name ?? '?').charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {profile?.name ?? 'Cargando…'}
              {profile ? `, ${profile.age}` : ''}
            </Text>
            {peer.seat && (
              <View style={styles.seatBadge}>
                <Text style={styles.seatBadgeText}>{formatSeat(peer.seat)}</Text>
              </View>
            )}
          </View>
          {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
          {profile?.interests?.length ? (
            <View style={styles.interestsRow}>
              {profile.interests.slice(0, 4).map((interest) => (
                <View key={interest} style={styles.interestChip}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const CARD_WIDTH = width - spacing(6);

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    height: 320,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitial: { fontSize: 96, fontWeight: '800', color: colors.border },
  info: { padding: spacing(2.5), gap: spacing(1) },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { ...typography.title, fontSize: 22 },
  bio: { ...typography.body, color: colors.textMuted },
  seatBadge: { backgroundColor: colors.primaryMuted, borderRadius: radii.pill, paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5) },
  seatBadgeText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  interestsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1) },
  interestChip: { backgroundColor: colors.surfaceAlt, borderRadius: radii.pill, paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5) },
  interestText: { color: colors.secondary, fontSize: 12, fontWeight: '600' },
  stamp: {
    position: 'absolute',
    top: spacing(3),
    zIndex: 10,
    borderWidth: 3,
    borderRadius: radii.sm,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.5),
  },
  likeStamp: { left: spacing(2), borderColor: colors.success, transform: [{ rotate: '-15deg' }] },
  likeStampText: { color: colors.success, fontWeight: '800', fontSize: 24 },
  passStamp: { right: spacing(2), borderColor: colors.danger, transform: [{ rotate: '15deg' }] },
  passStampText: { color: colors.danger, fontWeight: '800', fontSize: 24 },
});
