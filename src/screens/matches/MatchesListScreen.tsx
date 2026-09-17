import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/RootNavigator';
import { useMatchStore } from '../../state/matchStore';
import { colors, radii, spacing, typography } from '../../theme';
import { formatSeat } from '../../utils/seat';
import type { Match } from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'Matches'>;

export function MatchesListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const matches = useMatchStore((state) => state.matches);
  const list = useMemo(() => Object.values(matches).sort((a, b) => b.matchedAt - a.matchedAt), [matches]);

  const renderItem = ({ item }: { item: Match }) => (
    <Pressable style={styles.row} onPress={() => navigation.navigate('Chat', { matchId: item.id })}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.peerProfile.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{item.peerProfile.name}</Text>
        <Text style={styles.rowSeat}>Asiento {formatSeat(item.peerProfile.seat)}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing(2) }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← Volver</Text>
        </Pressable>
        <Text style={typography.title}>Matches</Text>
        <View style={styles.headerSpacer} />
      </View>

      {list.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💌</Text>
          <Text style={typography.subtitle}>Todavía no tienes matches en este vuelo.</Text>
        </View>
      ) : (
        <FlatList data={list} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={styles.list} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing(3) },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing(2) },
  backLink: { color: colors.secondary, fontWeight: '600' },
  headerSpacer: { width: 60 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing(1) },
  emptyEmoji: { fontSize: 48 },
  list: { gap: spacing(1) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(2),
    marginBottom: spacing(1),
  },
  avatar: { width: 48, height: 48, borderRadius: radii.pill, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.text, fontWeight: '700', fontSize: 18 },
  rowInfo: { flex: 1 },
  rowName: { ...typography.body, fontWeight: '700' },
  rowSeat: { ...typography.subtitle, fontSize: 13 },
});
