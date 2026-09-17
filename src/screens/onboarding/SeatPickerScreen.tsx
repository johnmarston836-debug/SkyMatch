import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/RootNavigator';
import { SeatMap } from '../../components/SeatMap';
import { colors, radii, spacing, typography } from '../../theme';
import { formatSeat } from '../../utils/seat';
import type { Seat } from '../../types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'SeatPicker'>;

export function SeatPickerScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [seat, setSeat] = useState<Seat>({ row: 14, letter: 'A' });

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing(4), paddingBottom: insets.bottom + spacing(3) }]}>
      <Text style={[typography.label]}>PASO 1 DE 2</Text>
      <Text style={[typography.title, styles.title]}>¿En qué asiento vas?</Text>
      <Text style={[typography.subtitle, styles.subtitle]}>
        Así tus matches sabrán dónde encontrarte en la cabina.
      </Text>

      <View style={styles.seatReadout}>
        <Text style={styles.seatReadoutText}>{formatSeat(seat)}</Text>
      </View>

      <SeatMap seat={seat} onChange={setSeat} />

      <Pressable style={styles.cta} onPress={() => navigation.navigate('ProfileSetup', { seat })}>
        <Text style={styles.ctaText}>Confirmar asiento {formatSeat(seat)}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing(3) },
  title: { marginTop: spacing(1) },
  subtitle: { marginTop: spacing(1), marginBottom: spacing(3) },
  seatReadout: { alignItems: 'center', marginBottom: spacing(3) },
  seatReadoutText: { color: colors.primary, fontSize: 48, fontWeight: '800', letterSpacing: 1 },
  cta: {
    marginTop: 'auto',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing(2),
    alignItems: 'center',
  },
  ctaText: { color: colors.background, fontSize: 17, fontWeight: '700' },
});
