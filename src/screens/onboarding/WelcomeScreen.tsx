import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/RootNavigator';
import { colors, radii, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing(6), paddingBottom: insets.bottom + spacing(3) }]}>
      <View>
        <Text style={styles.badge}>✈️ MODO AVIÓN</Text>
        <Text style={[typography.title, styles.title]}>El chat de todo tu vuelo</Text>
        <Text style={[typography.subtitle, styles.subtitle]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing(3),
    justifyContent: 'space-between',
  },
  badge: {
    color: colors.secondary,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing(2),
  },
  title: { marginBottom: spacing(2) },
  subtitle: { lineHeight: 22 },
  footer: { gap: spacing(2) },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing(2),
    alignItems: 'center',
  },
  ctaText: { color: colors.background, fontSize: 17, fontWeight: '700' },
  disclaimer: { ...typography.subtitle, fontSize: 12, textAlign: 'center' },
});
