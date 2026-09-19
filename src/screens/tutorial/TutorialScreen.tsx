import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList, OnboardingStackParamList } from '../../navigation/RootNavigator';
import { useAppTheme, useThemedStyles } from '../../theme/ThemeContext';

interface CarouselProps {
  onFinish: () => void;
  finishLabel: string;
  onBack?: () => void;
}

/**
 * Two pages explaining the one thing users cannot guess and that breaks the
 * app for everyone when they get it wrong: messages travel phone to phone,
 * so leaving the app stops both receiving and relaying for others.
 */
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

    diagram: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginVertical: spacing(4),
    },
    node: {
      width: 58,
      height: 58,
      borderRadius: radii.pill,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    nodeMine: { borderColor: colors.accent, backgroundColor: colors.accent },
    nodeText: { color: colors.text, fontWeight: '700' as const, fontSize: 13 },
    nodeTextMine: { color: '#FFFFFF', fontWeight: '700' as const, fontSize: 13 },
    hop: { flex: 1, height: 2, backgroundColor: colors.border },
    diagramCaption: { ...typography.subtitle, fontSize: 13, textAlign: 'center' as const, marginTop: spacing(-2) },

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
    if (page === 0) {
      scrollRef.current?.scrollTo({ x: width, animated: true });
      return;
    }
    onFinish();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + theme.spacing(2) }]}>
      {onBack && (
        <Pressable onPress={onBack}>
          <Text style={styles.backLink}>← Volver</Text>
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
          <Text style={styles.label}>CÓMO FUNCIONA · 1 DE 2</Text>
          <Text style={styles.title}>Los mensajes van saltando de móvil en móvil</Text>
          <Text style={styles.body}>
            SkyMatch no usa internet ni la wifi del avión. Tu teléfono habla por Bluetooth
            directamente con los teléfonos de los pasajeros que tienes cerca.
          </Text>

          <View style={styles.diagram}>
            <View style={[styles.node, styles.nodeMine]}>
              <Text style={styles.nodeTextMine}>TÚ</Text>
            </View>
            <View style={styles.hop} />
            <View style={styles.node}>
              <Text style={styles.nodeText}>14C</Text>
            </View>
            <View style={styles.hop} />
            <View style={styles.node}>
              <Text style={styles.nodeText}>21F</Text>
            </View>
          </View>
          <Text style={styles.diagramCaption}>
            El pasajero de 21F está demasiado lejos para oírte, pero el de 14C repite tu mensaje.
          </Text>

          <Text style={styles.bodySpaced}>
            El Bluetooth llega a pocos metros, así que los móviles que hay en medio van pasando
            los mensajes hasta que llegan a su destino. Cuanta más gente lleve la app abierta,
            más lejos llega todo.
          </Text>
        </View>

        <View style={[styles.page, { width }]}>
          <Text style={styles.label}>CÓMO FUNCIONA · 2 DE 2</Text>
          <Text style={styles.title}>Deja la app abierta</Text>
          <Text style={styles.body}>
            Tu móvil solo envía y recibe mientras la app está en pantalla. Si la cierras o te
            vas a otra aplicación, dejas de recibir mensajes y también dejas de servir de
            puente para los demás.
          </Text>

          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>Si sales de la app, te pierdes la conversación</Text>
            <Text style={styles.calloutText}>
              Los mensajes no se guardan en ningún servidor: solo existen en los móviles que
              están en el avión. Lo que se diga mientras no estés no lo podrás recuperar
              después.
            </Text>
          </View>

          <Text style={styles.bodySpaced}>
            El modo avión no es problema: puedes dejarlo activado y encender el Bluetooth por
            separado. No hace falta wifi, ni datos, ni cobertura.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + theme.spacing(3) }]}>
        <View style={styles.dots}>
          <View style={[styles.dot, page === 0 && styles.dotActive]} />
          <View style={[styles.dot, page === 1 && styles.dotActive]} />
        </View>
        <Pressable style={styles.cta} onPress={goNext}>
          <Text style={styles.ctaText}>{page === 0 ? 'Siguiente' : finishLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

type OnboardingProps = NativeStackScreenProps<OnboardingStackParamList, 'Tutorial'>;

export function TutorialScreen({ navigation }: OnboardingProps) {
  return <TutorialCarousel finishLabel="Entendido" onFinish={() => navigation.navigate('SeatPicker')} />;
}

type MainProps = NativeStackScreenProps<MainStackParamList, 'HowItWorks'>;

/** Same two pages, reachable again from the profile once onboarding is long past. */
export function HowItWorksScreen({ navigation }: MainProps) {
  return (
    <TutorialCarousel
      finishLabel="Cerrar"
      onFinish={() => navigation.goBack()}
      onBack={() => navigation.goBack()}
    />
  );
}
