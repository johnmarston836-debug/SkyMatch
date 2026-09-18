import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/RootNavigator';
import { useAppTheme, useThemedStyles } from '../../theme/ThemeContext';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { spacing: themeSpacing } = useAppTheme();
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing(3),
      justifyContent: 'space-between' as const,
    },
    badge: {
      color: colors.textMuted,
      fontWeight: '700' as const,
      letterSpacing: 1,
      marginBottom: spacing(2),
    },
    title: { ...typography.title, marginBottom: spacing(2) },
    subtitle: { ...typography.subtitle, lineHeight: 22 },
    footer: { gap: spacing(2) },
    cta: {
      backgroundColor: colors.accent,
      borderRadius: radii.pill,
      paddingVertical: spacing(2),
      alignItems: 'center' as const,
    },
    ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' as const },
    disclaimer: { ...typography.subtitle, fontSize: 12, textAlign: 'center' as const },
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top + themeSpacing(6), paddingBottom: insets.bottom + themeSpacing(3) }]}>
      <View>
        <Text style={styles.badge}>✈️ MODO AVIÓN</Text>
        <Text style={styles.title}>El chat de todo tu vuelo</Text>
        <Text style={styles.subtitle}>
          SkyMatch funciona sin wifi ni datos: un chat común con todos los pasajeros cerca de ti,
          identificados por su asiento, usando la red Bluetooth del propio avión.
        </Text>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.cta} onPress={() => navigation.navigate('SeatPicker')}>
          <Text style={styles.ctaText}>Empezar</Text>
        </Pressable>
        <Text style={styles.disclaimer}>Nada sale del avión: todo viaja de móvil a móvil por Bluetooth.</Text>
      </View>
    </View>
  );
}
