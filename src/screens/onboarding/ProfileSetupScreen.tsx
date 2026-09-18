import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/RootNavigator';
import { useProfileStore } from '../../state/profileStore';
import { colors, radii, spacing, typography } from '../../theme';
import { formatSeat } from '../../utils/seat';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'ProfileSetup'>;

export function ProfileSetupScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const save = useProfileStore((state) => state.save);
  const [nickname, setNickname] = useState('');

  const canContinue = nickname.trim().length > 0;

  const handleContinue = async () => {
    if (!canContinue) return;
    await save({ nickname: nickname.trim(), seat: route.params.seat });
    navigation.getParent()?.navigate('Main');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing(4), paddingBottom: insets.bottom + spacing(4) }]}>
      <Text style={typography.label}>PASO 2 DE 2</Text>
      <Text style={[typography.title, styles.title]}>¿Cómo te llamamos?</Text>
      <Text style={[typography.subtitle, styles.subtitle]}>
        En el chat de la cabina te verán como{' '}
        <Text style={styles.previewSeat}>{formatSeat(route.params.seat)}</Text> — el nombre es solo para
        acompañarlo.
      </Text>

      <TextInput
        style={styles.input}
        value={nickname}
        onChangeText={setNickname}
        placeholder="Tu nombre o apodo"
        placeholderTextColor={colors.textMuted}
        maxLength={24}
        autoFocus
      />

      <Pressable style={[styles.cta, !canContinue && styles.ctaDisabled]} disabled={!canContinue} onPress={handleContinue}>
        <Text style={styles.ctaText}>Entrar a la cabina 🛫</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing(3) },
  title: { marginTop: spacing(1) },
  subtitle: { marginTop: spacing(1), marginBottom: spacing(4), lineHeight: 22 },
  previewSeat: { color: colors.primary, fontWeight: '700' },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    color: colors.text,
    fontSize: 15,
  },
  cta: {
    marginTop: 'auto',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing(2),
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { color: colors.background, fontSize: 17, fontWeight: '700' },
});
