import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/RootNavigator';
import { t } from '../../i18n';
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
    badgeRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing(1), marginBottom: spacing(2) },
    badgeIcon: { width: 14, height: 14, tintColor: colors.textMuted },
    badge: {
      color: colors.textMuted,
      fontWeight: '700' as const,
      letterSpacing: 1,
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
        <View style={styles.badgeRow}>
          <Image source={require('../../assets/icons/plane.png')} style={styles.badgeIcon} resizeMode="contain" />
          <Image source={require('../../assets/icons/train.png')} style={styles.badgeIcon} resizeMode="contain" />
          <Image source={require('../../assets/icons/dumbbell.png')} style={styles.badgeIcon} resizeMode="contain" />
          <Image source={require('../../assets/icons/people.png')} style={styles.badgeIcon} resizeMode="contain" />
          <Text style={styles.badge}>{t.welcome.badge}</Text>
        </View>
        <Text style={styles.title}>{t.welcome.title}</Text>
        <Text style={styles.subtitle}>{t.welcome.body}</Text>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.cta} onPress={() => navigation.navigate('Tutorial')}>
          <Text style={styles.ctaText}>{t.welcome.cta}</Text>
        </Pressable>
        <Text style={styles.disclaimer}>{t.welcome.disclaimer}</Text>
      </View>
    </View>
  );
}
