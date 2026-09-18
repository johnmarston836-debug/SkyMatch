import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/RootNavigator';
import { SeatBadge } from '../../components/SeatBadge';
import { useDiscoveryStore } from '../../state/discoveryStore';
import { colors, radii, spacing, typography } from '../../theme';
import type { DiscoveredPeer } from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'Passengers'>;

export function PassengersScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const peers = useDiscoveryStore((state) => state.peers);

  const list = useMemo(
    () =>
      Object.values(peers)
        .filter((peer) => peer.profile)
        .sort((a, b) => b.lastSeenAt - a.lastSeenAt),
    [peers],
  );

  const renderItem = ({ item }: { item: DiscoveredPeer }) => (
    <Pressable style={styles.row} onPress={() => navigation.navigate('Profile', { peerId: item.peerId })}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{(item.profile?.nickname ?? '?').charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{item.profile?.nickname}</Text>
        {item.profile && <SeatBadge seat={item.profile.seat} muted />}
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing(2) }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← Volver</Text>
        </Pressable>
        <Text style={typography.title}>Pasajeros</Text>
        <View style={styles.headerSpacer} />
      </View>

      {list.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📡</Text>
          <Text style={typography.subtitle}>Buscando pasajeros cerca…</Text>
        </View>
      ) : (
        <FlatList data={list} keyExtractor={(item) => item.peerId} renderItem={renderItem} contentContainerStyle={styles.list} />
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
  rowInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowName: { ...typography.body, fontWeight: '700' },
});
