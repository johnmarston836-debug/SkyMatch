import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/RootNavigator';
import { useProfileStore } from '../../state/profileStore';
import { useAvatarStore } from '../../state/avatarStore';
import { Avatar } from '../../components/Avatar';
import { pickProfilePhoto } from '../../utils/pickProfilePhoto';
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
  const myAvatar = useAvatarStore((state) => state.myAvatar);
  const { location } = route.params;
  const venue = venueOf(location.kind);
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing(3) },
    label: typography.label,
    title: { ...typography.title, marginTop: spacing(1) },
    subtitle: { ...typography.subtitle, marginTop: spacing(1), marginBottom: spacing(3), lineHeight: 22 },
    scrollView: { flex: 1 },
    scroll: { flexGrow: 1, paddingBottom: spacing(2) },
    photoBlock: { alignItems: 'center' as const, gap: spacing(1), marginBottom: spacing(3) },
    photoAction: { color: colors.accent, fontWeight: '700' as const },
    photoHint: { ...typography.subtitle, fontSize: 12, textAlign: 'center' as const },
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
    // Replaces the whole setup rather than going on top of it: a swipe back
    // from the cabin used to land in the middle of onboarding again.
    navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + theme.spacing(4), paddingBottom: insets.bottom + theme.spacing(4) }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>{t.profileSetup.step}</Text>
        <Text style={styles.title}>{t.profileSetup.title}</Text>
        <Text style={styles.subtitle}>
          {venue.identityNote} <Text style={styles.previewLabel}>{formatLocation(location)}</Text>{' '}
          {t.profileSetup.identitySuffix}
        </Text>

        <View style={styles.photoBlock}>
          <Pressable onPress={() => void pickProfilePhoto()} accessibilityRole="button">
            <Avatar nickname={nickname || '?'} size={88} />
          </Pressable>
          <Pressable onPress={() => void pickProfilePhoto()} hitSlop={8}>
            <Text style={styles.photoAction}>{myAvatar ? t.myProfile.changePhoto : t.myProfile.addPhoto}</Text>
          </Pressable>
          <Text style={styles.photoHint}>{t.profileSetup.photoHint}</Text>
        </View>

        <TextInput
          selectionColor={theme.colors.accent}
          cursorColor={theme.colors.accent}
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder={t.profileSetup.namePlaceholder}
          placeholderTextColor={theme.colors.textMuted}
          maxLength={24}
        />

        <Text style={styles.fieldLabel}>{t.profileSetup.contactLabel}</Text>
        <TextInput
          selectionColor={theme.colors.accent}
          cursorColor={theme.colors.accent}
          style={styles.input}
          value={contact}
          onChangeText={setContact}
          placeholder={t.profileSetup.contactPlaceholder}
          placeholderTextColor={theme.colors.textMuted}
          maxLength={40}
        />
        <Text style={styles.hint}>{t.profileSetup.contactHint}</Text>
      </ScrollView>

      <Pressable style={[styles.cta, !canContinue && styles.ctaDisabled]} disabled={!canContinue} onPress={handleContinue}>
        <Text style={styles.ctaText}>{venue.enterCta}</Text>
      </Pressable>
    </View>
  );
}
