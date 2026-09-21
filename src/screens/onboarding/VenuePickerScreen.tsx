import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/RootNavigator';
import { venueOf, VENUE_ORDER } from '../../venues';
import { t } from '../../i18n';
import { useAppTheme, useThemedStyles } from '../../theme/ThemeContext';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'VenuePicker'>;

/** Step one everywhere: which kind of place you are in, which decides how people point at each other. */
export function VenuePickerScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing(3) },
    label: typography.label,
    title: { ...typography.title, marginTop: spacing(1) },
    subtitle: { ...typography.subtitle, marginTop: spacing(1), marginBottom: spacing(3), lineHeight: 22 },
    card: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing(2),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      padding: spacing(2.5),
      marginBottom: spacing(1.5),
    },
    icon: { width: 34, height: 34, tintColor: colors.text },
    cardBody: { flex: 1, gap: spacing(0.5) },
    cardTitle: { ...typography.body, fontWeight: '700' as const, fontSize: 17 },
    cardTagline: { ...typography.subtitle, fontSize: 13 },
    chevron: { color: colors.textMuted, fontSize: 22, fontWeight: '700' as const },
  }));

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + theme.spacing(4), paddingBottom: insets.bottom + theme.spacing(3) },
        ]}
      >
        <Text style={styles.label}>{t.venuePicker.step}</Text>
        <Text style={styles.title}>{t.venuePicker.title}</Text>
        <Text style={styles.subtitle}>{t.venuePicker.subtitle}</Text>

        {VENUE_ORDER.map((kind) => {
          const venue = venueOf(kind);
          return (
            <Pressable key={kind} style={styles.card} onPress={() => navigation.navigate('LocationPicker', { venue: kind })}>
              <Image source={venue.icon} style={styles.icon} resizeMode="contain" />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{venue.name}</Text>
                <Text style={styles.cardTagline}>{venue.tagline}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
