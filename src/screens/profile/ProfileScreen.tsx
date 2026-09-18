import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/RootNavigator';
import { SeatBadge } from '../../components/SeatBadge';
import { useDiscoveryStore } from '../../state/discoveryStore';
import { colors, radii, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'Profile'>;

/** Reached by tapping someone's name anywhere in the app. Shows only what they chose to share. */
export function ProfileScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { peerId } = route.params;
  const peer = useDiscoveryStore((state) => state.peers[peerId]);
  const profile = peer?.profile;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing(2), paddingBottom: insets.bottom + spacing(3) }]}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.backLink}>← Volver</Text>
      </Pressable>

      {!profile ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>👤</Text>
          <Text style={typography.subtitle}>Todavía no ha llegado su perfil.</Text>
        </View>
      ) : (
        <>
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.nickname.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={[typography.title, styles.name]}>{profile.nickname}</Text>
            <SeatBadge seat={profile.seat} />
          </View>

          <View style={styles.contactCard}>
            <Text style={typography.label}>CONTACTO</Text>
            {profile.contact ? (
              <Text style={styles.contactValue}>{profile.contact}</Text>
            ) : (
              <Text style={styles.contactEmpty}>No ha compartido ningún contacto.</Text>
            )}
          </View>

          <Pressable style={styles.cta} onPress={() => navigation.navigate('Chat', { peerId })}>
            <Text style={styles.ctaText}>Enviar mensaje privado</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing(3) },
  backLink: { color: colors.secondary, fontWeight: '600', marginBottom: spacing(3) },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing(1) },
  emptyEmoji: { fontSize: 48 },
  identity: { alignItems: 'center', gap: spacing(1), marginBottom: spacing(4) },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(1),
  },
  avatarText: { color: colors.text, fontWeight: '700', fontSize: 32 },
  name: { fontSize: 22 },
  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(2.5),
    marginBottom: spacing(3),
  },
  contactValue: { ...typography.body, color: colors.secondary, fontWeight: '700', marginTop: spacing(1), fontSize: 17 },
  contactEmpty: { ...typography.subtitle, marginTop: spacing(1) },
  cta: {
    marginTop: 'auto',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing(2),
    alignItems: 'center',
  },
  ctaText: { color: colors.background, fontSize: 17, fontWeight: '700' },
});
