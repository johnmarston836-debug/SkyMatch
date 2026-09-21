import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { VenueLocationChooser } from '../../components/VenueLocationChooser';
import { useProfileStore } from '../../state/profileStore';
import { announceProfileUpdate } from '../../mesh/meshController';
import { venueOf } from '../../venues';
import { t } from '../../i18n';
import { defaultLocation } from '../../utils/location';
import { useAppTheme, useThemedStyles } from '../../theme/ThemeContext';
import type { UserLocation } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionStart'>;

/**
 * Asked on every launch, because it is the half of your profile that is
 * true for one afternoon: the seat changes with the flight, the muscle
 * group with the day, the colour with the shirt. The half that doesn't -
 * your name, your contact, your photo - stays saved and is never asked
 * again.
 *
 * Confirming what it already shows is one tap.
 */
export function SessionStartScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const profile = useProfileStore((state) => state.profile);
  const save = useProfileStore((state) => state.save);
  const [location, setLocation] = useState<UserLocation>(profile?.location ?? defaultLocation('plane'));
  const venue = venueOf(location.kind);
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing(3), flexGrow: 1 },
    greeting: typography.label,
    title: { ...typography.title, marginTop: spacing(1) },
    subtitle: { ...typography.subtitle, marginTop: spacing(1), lineHeight: 22 },
    cta: {
      marginTop: spacing(3),
      backgroundColor: colors.accent,
      borderRadius: radii.pill,
      paddingVertical: spacing(2),
      alignItems: 'center' as const,
    },
    ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' as const },
  }));

  if (!profile) return null;

  const handleEnter = async () => {
    // Only touch storage when something actually changed, so confirming the
    // same place doesn't rewrite the profile on every launch.
    if (JSON.stringify(location) !== JSON.stringify(profile.location)) {
      await save({ nickname: profile.nickname, location, contact: profile.contact });
      const saved = useProfileStore.getState().profile;
      // Harmless before the mesh is up - it is a no-op until then - and the
      // one thing that matters when it is already running.
      if (saved) void announceProfileUpdate(saved);
    }
    navigation.replace('Main');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + theme.spacing(4), paddingBottom: insets.bottom + theme.spacing(3) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.greeting}>{t.sessionStart.greeting(profile.nickname)}</Text>
        <Text style={styles.title}>{t.sessionStart.title}</Text>
        <Text style={styles.subtitle}>{t.sessionStart.subtitle}</Text>

        <VenueLocationChooser location={location} onChange={setLocation} />

        <Pressable style={styles.cta} onPress={handleEnter}>
          <Text style={styles.ctaText}>{venue.enterCta}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
