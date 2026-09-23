import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type ScrollViewInstance,
} from 'react-native';
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
 * Three pages, one idea each, each with its own animated scene:
 * 1. Messages hop from phone to phone - no internet, and it works in
 *    flight mode.
 * 2. What happens with the phone in your pocket, which is where it spends
 *    most of the trip. Different on each platform: Android keeps going in
 *    the background on its own; an iPhone keeps the links it already has,
 *    but iOS limits finding new people while it is locked.
 * 3. If strangers' phones carry my messages, can they read them? No.
 */
const PAGES = 3;

/** Android stays on the mesh with the app in the background (SkyMatchBackgroundService); page 2 says so. */
const ANDROID = Platform.OS === 'android';

/** How far apart the pieces of a page come in, top to bottom. */
const REVEAL_STAGGER = 90;

/**
 * Fades and lifts its content into place each time its page comes on
 * screen, one piece after the other, so a page reads in the order it is
 * meant to.
 */
function Reveal({ active, order, children }: { active: boolean; order: number; children: React.ReactNode }) {
  const progress = useRef(new Animated.Value(active ? 0 : 1)).current;
  useEffect(() => {
    if (!active) return;
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      delay: order * REVEAL_STAGGER,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [active, order, progress]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

interface PageContent {
  label: string;
  title: string;
  body: string;
  diagram: 'relay' | 'pocket' | 'sealed';
  caption: string;
  body2: string;
  calloutTitle: string;
  calloutBody: string;
}

function pages(): PageContent[] {
  const tt = t.tutorial;
  return [
    {
      label: tt.page1Label,
      title: tt.page1Title,
      body: tt.page1Body,
      diagram: 'relay',
      caption: tt.page1Caption,
      body2: tt.page1Body2,
      calloutTitle: tt.page1CalloutTitle,
      calloutBody: tt.page1CalloutBody,
    },
    {
      label: tt.page2Label,
      title: ANDROID ? tt.page2TitleAndroid : tt.page2Title,
      body: ANDROID ? tt.page2BodyAndroid : tt.page2Body,
      diagram: 'pocket',
      caption: tt.page2Caption,
      body2: tt.page2Body2,
      calloutTitle: ANDROID ? tt.page2CalloutTitleAndroid : tt.page2CalloutTitle,
      calloutBody: ANDROID ? tt.page2CalloutBodyAndroid : tt.page2CalloutBody,
    },
    {
      label: tt.page3Label,
      title: tt.page3Title,
      body: tt.page3Body,
      diagram: 'sealed',
      caption: tt.page3Caption,
      body2: tt.page3Body2,
      calloutTitle: tt.securityCalloutTitle,
      calloutBody: tt.securityCalloutBody,
    },
  ];
}

function TutorialCarousel({ onFinish, finishLabel, onBack }: CarouselProps) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [page, setPage] = useState(0);
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    container: { flex: 1, backgroundColor: colors.background },
    backLink: { color: colors.text, fontWeight: '600' as const, paddingHorizontal: spacing(3) },
    page: { flexGrow: 1, paddingHorizontal: spacing(3), paddingVertical: spacing(2), justifyContent: 'center' as const },
    label: typography.label,
    title: { ...typography.title, marginTop: spacing(1), marginBottom: spacing(2) },
    body: { ...typography.subtitle, lineHeight: 24 },
    bodySpaced: { ...typography.subtitle, lineHeight: 24, marginTop: spacing(2) },

    diagramCaption: { ...typography.subtitle, fontSize: 13, lineHeight: 18, textAlign: 'center' as const },

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

    footer: { paddingHorizontal: spacing(3), paddingTop: spacing(1), gap: spacing(2) },
    dots: { flexDirection: 'row' as const, justifyContent: 'center' as const, gap: spacing(1) },
    dot: { width: 8, height: 8, borderRadius: radii.pill, backgroundColor: colors.border },
    dotActive: { width: 22, backgroundColor: colors.text },
    cta: {
      backgroundColor: colors.accent,
      borderRadius: radii.pill,
      paddingVertical: spacing(2),
      alignItems: 'center' as const,
    },
    ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' as const },
  }));

  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({ x: width * index, animated: true });
    // Set here too: a scroll started from code doesn't end in a momentum
    // event on iOS, so the dots and the button would stay a page behind.
    setPage(index);
  };

  const goNext = () => {
    if (page < PAGES - 1) goTo(page + 1);
    else onFinish();
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
        {pages().map((content, index) => {
          const active = page === index;
          return (
            // Each page scrolls on its own, for small phones and large text.
            <ScrollView key={index} style={{ width }} contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
              <Reveal active={active} order={0}>
                <Text style={styles.label}>{content.label}</Text>
                <Text style={styles.title}>{content.title}</Text>
              </Reveal>
              <Reveal active={active} order={1}>
                <Text style={styles.body}>{content.body}</Text>
              </Reveal>
              <Reveal active={active} order={2}>
                <MeshDiagram variant={content.diagram} />
                <Text style={styles.diagramCaption}>{content.caption}</Text>
              </Reveal>
              <Reveal active={active} order={3}>
                <Text style={styles.bodySpaced}>{content.body2}</Text>
              </Reveal>
              <Reveal active={active} order={4}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{content.calloutTitle}</Text>
                  <Text style={styles.calloutText}>{content.calloutBody}</Text>
                </View>
              </Reveal>
            </ScrollView>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + theme.spacing(3) }]}>
        <View style={styles.dots}>
          {Array.from({ length: PAGES }, (_, index) => (
            <Pressable key={index} onPress={() => goTo(index)} hitSlop={8}>
              <View style={[styles.dot, page === index && styles.dotActive]} />
            </Pressable>
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
