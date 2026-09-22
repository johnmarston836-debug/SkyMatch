import React, { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList, OnboardingStackParamList } from '../../navigation/RootNavigator';
import { MeshDiagram } from '../../components/MeshDiagram';
import { t } from '../../i18n';
import { useAppTheme, useThemedStyles } from '../../theme/ThemeContext';

interface CarouselProps {
  onFinish: () => void;
  finishLabel: string;
  onBack?: () => void;
}

/**
 * Three pages. The first two explain the one thing users cannot guess and
 * that breaks the app for everyone when they get it wrong: messages travel
 * phone to phone, so leaving the app stops both receiving and relaying for
 * others. The third answers what that raises straight away - if strangers'
 * phones carry my messages, can they read them?
 */
const PAGES = 3;

/** Android stays on the mesh with the app in the background; iOS does not, so page 2 says different things. */
const ANDROID = Platform.OS === 'android';

function TutorialCarousel({ onFinish, finishLabel, onBack }: CarouselProps) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [page, setPage] = useState(0);
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    container: { flex: 1, backgroundColor: colors.background },
    backLink: { color: colors.text, fontWeight: '600' as const, paddingHorizontal: spacing(3) },
    page: { paddingHorizontal: spacing(3), justifyContent: 'center' as const },
    label: typography.label,
    title: { ...typography.title, marginTop: spacing(1), marginBottom: spacing(2) },
    body: { ...typography.subtitle, lineHeight: 24 },
    bodySpaced: { ...typography.subtitle, lineHeight: 24, marginTop: spacing(2) },

    diagramCaption: { ...typography.subtitle, fontSize: 13, textAlign: 'center' as const },

    callout: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.accent,
      padding: spacing(2),
      marginTop: spacing(3),
    },
    calloutTitle: { color: colors.accent, fontWeight: '700' as const, marginBottom: spacing(0.5) },
    calloutText: { ...typography.body, fontSize: 14, lineHeight: 20 },

    footer: { paddingHorizontal: spacing(3), gap: spacing(2) },
    dots: { flexDirection: 'row' as const, justifyContent: 'center' as const, gap: spacing(1) },
    dot: { width: 8, height: 8, borderRadius: radii.pill, backgroundColor: colors.border },
    dotActive: { backgroundColor: colors.text },
    cta: {
      backgroundColor: colors.accent,
      borderRadius: radii.pill,
      paddingVertical: spacing(2),
      alignItems: 'center' as const,
    },
    ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' as const },
  }));

  const goNext = () => {
    if (page < PAGES - 1) {
      scrollRef.current?.scrollTo({ x: width * (page + 1), animated: true });
      return;
    }
    onFinish();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + theme.spacing(2) }]}>
      {onBack && (
        <Pressable onPress={onBack}>
          <Text style={styles.backLink}>← {t.common.back}</Text>
        </Pressable>
      )}

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => setPage(Math.round(event.nativeEvent.contentOffset.x / width))}
      >
        <View style={[styles.page, { width }]}>
          <Text style={styles.label}>{t.tutorial.page1Label}</Text>
          <Text style={styles.title}>{t.tutorial.page1Title}</Text>
          <Text style={styles.body}>{t.tutorial.page1Body}</Text>

          <MeshDiagram variant="relay" />
          <Text style={styles.diagramCaption}>{t.tutorial.page1Caption}</Text>

          <Text style={styles.bodySpaced}>{t.tutorial.page1Body2}</Text>
        </View>

        <View style={[styles.page, { width }]}>
          <Text style={styles.label}>{t.tutorial.page2Label}</Text>
          <Text style={styles.title}>{ANDROID ? t.tutorial.page2TitleAndroid : t.tutorial.page2Title}</Text>
          <Text style={styles.body}>{ANDROID ? t.tutorial.page2BodyAndroid : t.tutorial.page2Body}</Text>

          <MeshDiagram variant="broken" />
          <Text style={styles.diagramCaption}>{t.tutorial.page2Caption}</Text>

          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>{ANDROID ? t.tutorial.calloutTitleAndroid : t.tutorial.calloutTitle}</Text>
            <Text style={styles.calloutText}>{t.tutorial.calloutBody}</Text>
          </View>

          <Text style={styles.bodySpaced}>{t.tutorial.page2Body2}</Text>
        </View>

        <View style={[styles.page, { width }]}>
          <Text style={styles.label}>{t.tutorial.page3Label}</Text>
          <Text style={styles.title}>{t.tutorial.page3Title}</Text>
          <Text style={styles.body}>{t.tutorial.page3Body}</Text>
          <Text style={styles.bodySpaced}>{t.tutorial.page3Body2}</Text>

          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>{t.tutorial.securityCalloutTitle}</Text>
            <Text style={styles.calloutText}>{t.tutorial.securityCalloutBody}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + theme.spacing(3) }]}>
        <View style={styles.dots}>
          {Array.from({ length: PAGES }, (_, index) => (
            <View key={index} style={[styles.dot, page === index && styles.dotActive]} />
          ))}
        </View>
        <Pressable style={styles.cta} onPress={goNext}>
          <Text style={styles.ctaText}>{page < PAGES - 1 ? t.common.next : finishLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

type OnboardingProps = NativeStackScreenProps<OnboardingStackParamList, 'Tutorial'>;

export function TutorialScreen({ navigation }: OnboardingProps) {
  return <TutorialCarousel finishLabel={t.tutorial.understood} onFinish={() => navigation.navigate('VenuePicker')} />;
}

type MainProps = NativeStackScreenProps<MainStackParamList, 'HowItWorks'>;

/** Same pages, reachable again from the profile once onboarding is long past. */
export function HowItWorksScreen({ navigation }: MainProps) {
  return (
    <TutorialCarousel
      finishLabel={t.common.close}
      onFinish={() => navigation.goBack()}
      onBack={() => navigation.goBack()}
    />
  );
}
