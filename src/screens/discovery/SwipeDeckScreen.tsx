import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/RootNavigator';
import { SwipeCard } from '../../components/SwipeCard';
import { MatchOverlay } from './MatchModal';
import { useDiscoveryStore } from '../../state/discoveryStore';
import { useProfileStore } from '../../state/profileStore';
import { useMatchStore } from '../../state/matchStore';
import { startMesh, swipeOn } from '../../mesh/meshController';
import { colors, radii, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'SwipeDeck'>;

export function SwipeDeckScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const myProfile = useProfileStore((state) => state.profile);
  const peers = useDiscoveryStore((state) => state.peers);
  const likedByMe = useDiscoveryStore((state) => state.likedByMe);
  const latestMatchId = useMatchStore((state) => state.latestMatchId);
  const matches = useMatchStore((state) => state.matches);
  const clearLatest = useMatchStore((state) => state.clearLatest);

  useEffect(() => {
    if (myProfile) void startMesh(myProfile);
  }, [myProfile]);

  const deck = useMemo(
    () =>
      Object.values(peers)
        .filter((peer) => peer.profile && !likedByMe.has(peer.peerId))
        .sort((a, b) => b.lastSeenAt - a.lastSeenAt),
    [peers, likedByMe],
  );

  if (!myProfile) return null;

  const handleSwipe = (peerId: string, direction: 'like' | 'pass') => {
    void swipeOn(myProfile, peerId, direction);
  };

  const latestMatch = latestMatchId ? matches[latestMatchId] : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing(2) }]}>
      <View style={styles.header}>
        <Text style={typography.title}>SkyMatch</Text>
        <Pressable onPress={() => navigation.navigate('Matches')}>
          <Text style={styles.matchesLink}>Matches ({Object.keys(matches).length})</Text>
        </Pressable>
      </View>

      <View style={styles.deckArea}>
        {deck.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📡</Text>
            <Text style={[typography.body, styles.emptyTitle]}>Buscando pasajeros cerca…</Text>
            <Text style={typography.subtitle}>Mantén el Bluetooth activado. Aparecerán en cuanto estén en rango.</Text>
          </View>
        )}
        {deck
          .slice(0, 3)
          .reverse()
          .map((peer, index, arr) => (
            <SwipeCard
              key={peer.peerId}
              peer={peer}
              isTop={index === arr.length - 1}
              onSwiped={(direction) => handleSwipe(peer.peerId, direction)}
            />
          ))}
      </View>

      {deck.length > 0 && (
        <View style={styles.actions}>
          <Pressable style={[styles.actionButton, styles.passButton]} onPress={() => handleSwipe(deck[0].peerId, 'pass')}>
            <Text style={styles.passButtonText}>✕</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, styles.likeButton]} onPress={() => handleSwipe(deck[0].peerId, 'like')}>
            <Text style={styles.likeButtonText}>♥</Text>
          </Pressable>
        </View>
      )}

      {latestMatch && (
        <MatchOverlay
          match={latestMatch}
          onDismiss={clearLatest}
          onMessage={() => {
            clearLatest();
            navigation.navigate('Chat', { matchId: latestMatch.id });
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing(3) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(2) },
  matchesLink: { color: colors.secondary, fontWeight: '700' },
  deckArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', gap: spacing(1), paddingHorizontal: spacing(3) },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontWeight: '700', textAlign: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: spacing(4), marginBottom: spacing(3) },
  actionButton: { width: 64, height: 64, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  passButton: { backgroundColor: colors.surface, borderColor: colors.danger },
  passButtonText: { color: colors.danger, fontSize: 28 },
  likeButton: { backgroundColor: colors.surface, borderColor: colors.success },
  likeButtonText: { color: colors.success, fontSize: 28 },
});
