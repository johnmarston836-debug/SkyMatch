import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme';
import { formatSeat } from '../../utils/seat';
import type { Match } from '../../types';

interface Props {
  match: Match;
  onDismiss: () => void;
  onMessage: () => void;
}

export function MatchOverlay({ match, onDismiss, onMessage }: Props) {
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <Text style={styles.title}>¡Es un match! 🎉</Text>
        <Text style={styles.subtitle}>
          Tú y {match.peerProfile.name} os habéis dado like — está en el asiento{' '}
          <Text style={styles.seat}>{formatSeat(match.peerProfile.seat)}</Text>
        </Text>

        <Pressable style={styles.primaryButton} onPress={onMessage}>
          <Text style={styles.primaryButtonText}>Enviar un mensaje</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onDismiss}>
          <Text style={styles.secondaryButtonText}>Seguir mirando</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,18,32,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(4),
  },
  title: { ...typography.title, fontSize: 32, marginBottom: spacing(2), textAlign: 'center' },
  subtitle: { ...typography.subtitle, textAlign: 'center', marginBottom: spacing(4), lineHeight: 22 },
  seat: { color: colors.primary, fontWeight: '700' },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(5),
    marginBottom: spacing(1.5),
  },
  primaryButtonText: { color: colors.background, fontWeight: '700', fontSize: 16 },
  secondaryButton: { paddingVertical: spacing(1) },
  secondaryButtonText: { color: colors.textMuted, fontWeight: '600' },
});
