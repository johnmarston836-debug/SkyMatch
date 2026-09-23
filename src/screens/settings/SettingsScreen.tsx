import React from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/RootNavigator';
import { ACCENTS, useSettingsStore, type AccentName, type Appearance } from '../../state/settingsStore';
import { DEVELOPER_EMAIL } from '../../config';
import { t } from '../../i18n';
import { useAppTheme, useThemedStyles } from '../../theme/ThemeContext';

type Props = NativeStackScreenProps<MainStackParamList, 'Settings'>;

const APPEARANCES: Appearance[] = ['system', 'light', 'dark'];
const ACCENT_NAMES = Object.keys(ACCENTS) as AccentName[];

/** Reached from the gear on your profile: how the app looks, and how to reach whoever makes it. */
export function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const appearance = useSettingsStore((state) => state.appearance);
  const accent = useSettingsStore((state) => state.accent);
  const setAppearance = useSettingsStore((state) => state.setAppearance);
  const setAccent = useSettingsStore((state) => state.setAccent);
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingHorizontal: spacing(3) },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: spacing(3),
    },
    backLink: { color: colors.text, fontWeight: '600' as const },
    headerSpacer: { width: 60 },
    title: typography.title,
    sectionLabel: { ...typography.label, marginTop: spacing(3), marginBottom: spacing(1) },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing(1.5),
    },
    hint: { ...typography.subtitle, fontSize: 13, lineHeight: 18, marginTop: spacing(1) },

    segments: { flexDirection: 'row' as const, gap: spacing(0.5) },
    segment: {
      flex: 1,
      paddingVertical: spacing(1.25),
      borderRadius: radii.sm,
      alignItems: 'center' as const,
    },
    segmentActive: { backgroundColor: colors.accent },
    segmentText: { ...typography.body, fontSize: 14, fontWeight: '600' as const },
    segmentTextActive: { color: '#FFFFFF' },

    swatches: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing(1.5), justifyContent: 'center' as const },
    swatchRing: {
      width: 44,
      height: 44,
      borderRadius: radii.pill,
      borderWidth: 2,
      borderColor: 'transparent',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    swatch: { width: 32, height: 32, borderRadius: radii.pill },
    preview: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing(1.5), marginTop: spacing(2) },
    previewInput: {
      flex: 1,
      borderBottomWidth: 2,
      borderBottomColor: colors.accent,
      paddingVertical: spacing(0.75),
    },
    previewPlaceholder: { ...typography.subtitle, fontSize: 14 },
    previewButton: {
      backgroundColor: colors.accent,
      borderRadius: radii.pill,
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1),
    },
    previewButtonText: { color: '#FFFFFF', fontWeight: '700' as const },

    row: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    rowTitle: { ...typography.body, fontWeight: '600' as const },
    rowValue: { ...typography.subtitle, fontSize: 13, marginTop: 2 },
    rowArrow: { ...typography.subtitle, fontSize: 18 },
    disabled: { opacity: 0.55 },
  }));

  const appearanceLabel: Record<Appearance, string> = {
    system: t.settings.appearanceSystem,
    light: t.settings.appearanceLight,
    dark: t.settings.appearanceDark,
  };

  const writeToDeveloper = () => {
    if (!DEVELOPER_EMAIL) return;
    Linking.openURL(`mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent('SkyMatch')}`).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + theme.spacing(2), paddingBottom: insets.bottom + theme.spacing(4) },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>← {t.common.back}</Text>
          </Pressable>
          <Text style={styles.title}>{t.settings.title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.sectionLabel}>{t.settings.appearance}</Text>
        <View style={styles.card}>
          <View style={styles.segments} accessibilityRole="radiogroup">
            {APPEARANCES.map((option) => {
              const active = appearance === option;
              return (
                <Pressable
                  key={option}
                  style={[styles.segment, active && styles.segmentActive]}
                  onPress={() => setAppearance(option)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{appearanceLabel[option]}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Text style={styles.hint}>{t.settings.appearanceHint}</Text>

        <Text style={styles.sectionLabel}>{t.settings.accent}</Text>
        <View style={styles.card}>
          <View style={styles.swatches} accessibilityRole="radiogroup">
            {ACCENT_NAMES.map((name) => {
              const active = accent === name;
              return (
                <Pressable
                  key={name}
                  onPress={() => setAccent(name)}
                  hitSlop={4}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={t.settings.accentNames[name]}
                  style={[styles.swatchRing, active && { borderColor: ACCENTS[name] }]}
                >
                  <View style={[styles.swatch, { backgroundColor: ACCENTS[name] }]} />
                </Pressable>
              );
            })}
          </View>
          {/* The things it colours, so the choice can be judged before leaving. */}
          <View style={styles.preview}>
            <View style={styles.previewInput}>
              <Text style={styles.previewPlaceholder}>{t.chat.placeholder}</Text>
            </View>
            <View style={styles.previewButton}>
              <Text style={styles.previewButtonText}>{t.common.send}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.hint}>{t.settings.accentHint}</Text>

        <Text style={styles.sectionLabel}>{t.settings.contact}</Text>
        <Pressable
          style={[styles.card, !DEVELOPER_EMAIL && styles.disabled]}
          onPress={writeToDeveloper}
          disabled={!DEVELOPER_EMAIL}
          accessibilityRole="button"
        >
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>{t.settings.contactDeveloper}</Text>
              <Text style={styles.rowValue}>{DEVELOPER_EMAIL || t.settings.contactSoon}</Text>
            </View>
            {!!DEVELOPER_EMAIL && <Text style={styles.rowArrow}>›</Text>}
          </View>
        </Pressable>
        <Text style={styles.hint}>{t.settings.contactHint}</Text>
      </ScrollView>
    </View>
  );
}
