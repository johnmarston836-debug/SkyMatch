import React, { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/RootNavigator';
import { LocationPicker } from '../../components/LocationPicker';
import { venueOf } from '../../venues';
import { t } from '../../i18n';
import { defaultLocation, formatLocation } from '../../utils/location';
import { useAppTheme, useThemedStyles } from '../../theme/ThemeContext';
import type { UserLocation } from '../../types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'LocationPicker'>;

export function LocationPickerScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const venue = venueOf(route.params.venue);
  const [location, setLocation] = useState<UserLocation>(defaultLocation(route.params.venue));
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing(3), flexGrow: 1 },
    backLink: { color: colors.text, fontWeight: '600' as const, marginBottom: spacing(2) },
    label: typography.label,
    title: { ...typography.title, marginTop: spacing(1) },
    subtitle: { ...typography.subtitle, marginTop: spacing(1), marginBottom: spacing(2), lineHeight: 22 },
    helpCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      padding: spacing(2),
      marginBottom: spacing(3),
    },
    helpText: { ...typography.subtitle, fontSize: 13, lineHeight: 19 },
    readout: { alignItems: 'center' as const, marginBottom: spacing(3) },
    readoutText: { color: colors.text, fontSize: 40, fontWeight: '800' as const, letterSpacing: 1, textAlign: 'center' as const },
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
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + theme.spacing(3), paddingBottom: insets.bottom + theme.spacing(3) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← {venue.name}</Text>
        </Pressable>

        <Text style={styles.label}>{t.locationStep.step}</Text>
        <Text style={styles.title}>{venue.locationTitle}</Text>
        <Text style={styles.subtitle}>{venue.locationSubtitle}</Text>

        <View style={styles.helpCard}>
          <Text style={styles.helpText}>{venue.locationHelp}</Text>
        </View>

        <View style={styles.readout}>
          <Text style={styles.readoutText}>{formatLocation(location)}</Text>
        </View>

        <LocationPicker location={location} onChange={setLocation} />

        <Pressable style={styles.cta} onPress={() => navigation.navigate('ProfileSetup', { location })}>
          <Text style={styles.ctaText}>{t.common.continue}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
