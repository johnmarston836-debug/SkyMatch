import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/RootNavigator';
import { SeatMap } from '../../components/SeatMap';
import { useAppTheme, useThemedStyles } from '../../theme/ThemeContext';
import { formatSeat } from '../../utils/seat';
import type { Seat } from '../../types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'SeatPicker'>;

export function SeatPickerScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { spacing: themeSpacing } = useAppTheme();
  const [seat, setSeat] = useState<Seat>({ row: 14, letter: 'A' });
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing(3) },
    label: typography.label,
    title: { ...typography.title, marginTop: spacing(1) },
    subtitle: { ...typography.subtitle, marginTop: spacing(1), marginBottom: spacing(3) },
    seatReadout: { alignItems: 'center' as const, marginBottom: spacing(3) },
    seatReadoutText: { color: colors.text, fontSize: 48, fontWeight: '800' as const, letterSpacing: 1 },
    cta: {
      marginTop: 'auto' as const,
      backgroundColor: colors.accent,
      borderRadius: radii.pill,
      paddingVertical: spacing(2),
      alignItems: 'center' as const,
    },
    ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' as const },
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top + themeSpacing(4), paddingBottom: insets.bottom + themeSpacing(3) }]}>
      <Text style={styles.label}>PASO 1 DE 2</Text>
      <Text style={styles.title}>¿En qué asiento vas?</Text>
      <Text style={styles.subtitle}>Así te identificarán en el chat de la cabina.</Text>

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
