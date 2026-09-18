import React, { useMemo } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/RootNavigator';
import { SeatBadge } from '../../components/SeatBadge';
import { useDiscoveryStore } from '../../state/discoveryStore';
import { useAppTheme, useThemedStyles } from '../../theme/ThemeContext';
import type { DiscoveredPeer } from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'Passengers'>;

export function PassengersScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { spacing: themeSpacing } = useAppTheme();
  const peers = useDiscoveryStore((state) => state.peers);
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing(3) },
    header: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginBottom: spacing(2) },
    title: typography.title,
    backLink: { color: colors.text, fontWeight: '600' as const },
    headerSpacer: { width: 60 },
    emptyState: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, gap: spacing(1) },
    emptyEmoji: { fontSize: 48 },
    emptySubtitle: typography.subtitle,
    list: { gap: spacing(1) },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing(2),
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing(2),
      marginBottom: spacing(1),
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: radii.pill,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    avatarText: { color: colors.text, fontWeight: '700' as const, fontSize: 18 },
    rowInfo: { flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    rowName: { ...typography.body, fontWeight: '700' as const },
  }));

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
        {item.profile && <SeatBadge seat={item.profile.seat} />}
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + themeSpacing(2) }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← Volver</Text>
        </Pressable>
        <Text style={styles.title}>Pasajeros</Text>
        <View style={styles.headerSpacer} />
      </View>

      {list.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📡</Text>
          <Text style={styles.emptySubtitle}>Buscando pasajeros cerca…</Text>
        </View>
      ) : (
        <FlatList data={list} keyExtractor={(item) => item.peerId} renderItem={renderItem} contentContainerStyle={styles.list} />
      )}
    </View>
  );
}
