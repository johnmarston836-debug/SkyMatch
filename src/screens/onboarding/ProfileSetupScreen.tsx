import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/RootNavigator';
import { useProfileStore } from '../../state/profileStore';
import { useAppTheme, useThemedStyles } from '../../theme/ThemeContext';
import { formatLocation } from '../../utils/location';
import { venueOf } from '../../venues';
import { t } from '../../i18n';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'ProfileSetup'>;

export function ProfileSetupScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const save = useProfileStore((state) => state.save);
  const [nickname, setNickname] = useState('');
  const [contact, setContact] = useState('');
  const { location } = route.params;
  const venue = venueOf(location.kind);
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing(3) },
    label: typography.label,
    title: { ...typography.title, marginTop: spacing(1) },
    subtitle: { ...typography.subtitle, marginTop: spacing(1), marginBottom: spacing(4), lineHeight: 22 },
    previewLabel: { color: colors.text, fontWeight: '700' as const },
    fieldLabel: { ...typography.label, marginTop: spacing(3), marginBottom: spacing(1) },
    hint: { ...typography.subtitle, fontSize: 12, marginTop: spacing(1) },
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
      marginTop: 'auto' as const,
      backgroundColor: colors.accent,
      borderRadius: radii.pill,
      paddingVertical: spacing(2),
      alignItems: 'center' as const,
    },
    ctaDisabled: { opacity: 0.4 },
    ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' as const },
  }));

  const canContinue = nickname.trim().length > 0;

  const handleContinue = async () => {
    if (!canContinue) return;
    await save({ nickname: nickname.trim(), location, contact: contact.trim() || undefined });
    navigation.getParent()?.navigate('Main');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + theme.spacing(4), paddingBottom: insets.bottom + theme.spacing(4) }]}>
      <Text style={styles.label}>{t.profileSetup.step}</Text>
      <Text style={styles.title}>{t.profileSetup.title}</Text>
      <Text style={styles.subtitle}>
        {venue.identityNote} <Text style={styles.previewLabel}>{formatLocation(location)}</Text>{' '}
        {t.profileSetup.identitySuffix}
      </Text>

      <TextInput
        style={styles.input}
        value={nickname}
        onChangeText={setNickname}
        placeholder={t.profileSetup.namePlaceholder}
        placeholderTextColor={theme.colors.textMuted}
        maxLength={24}
        autoFocus
      />

      <Text style={styles.fieldLabel}>{t.profileSetup.contactLabel}</Text>
      <TextInput
        style={styles.input}
        value={contact}
        onChangeText={setContact}
        placeholder={t.profileSetup.contactPlaceholder}
        placeholderTextColor={theme.colors.textMuted}
        maxLength={40}
      />
      <Text style={styles.hint}>{t.profileSetup.contactHint}</Text>

      <Pressable style={[styles.cta, !canContinue && styles.ctaDisabled]} disabled={!canContinue} onPress={handleContinue}>
        <Text style={styles.ctaText}>{venue.enterCta}</Text>
      </Pressable>
    </View>
  );
}
