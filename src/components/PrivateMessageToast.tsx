import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Avatar } from './Avatar';
import { useChatStore } from '../state/chatStore';
import { useThemedStyles } from '../theme/ThemeContext';

/** How long a private message stays on screen before it goes quiet again. */
const VISIBLE_MS = 5_000;

interface Props {
  onOpen: (peerId: string) => void;
}

/**
 * Announces a private message while you are reading the cabin chat, where
 * you would otherwise never notice it: the conversation lives behind the
 * Pasajeros button, two taps away.
 */
export function PrivateMessageToast({ onOpen }: Props) {
  const notice = useChatStore((state) => state.notice);
  const dismissNotice = useChatStore((state) => state.dismissNotice);
  const slide = useRef(new Animated.Value(0)).current;
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    wrapper: { paddingHorizontal: spacing(3), marginBottom: spacing(1) },
    card: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing(1.5),
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.accent,
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1.5),
    },
    text: { flex: 1 },
    name: { ...typography.body, fontWeight: '700' as const },
    body: { ...typography.subtitle, fontSize: 13 },
    tag: { color: colors.accent, fontSize: 12, fontWeight: '700' as const },
  }));

  useEffect(() => {
    if (!notice) return;
    slide.setValue(0);
    Animated.timing(slide, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    const timer = setTimeout(dismissNotice, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [notice, slide, dismissNotice]);

  if (!notice) return null;

  const animation = {
    opacity: slide,
    transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
  };

  return (
    <Animated.View style={[styles.wrapper, animation]}>
      <Pressable
        style={styles.card}
        onPress={() => {
          dismissNotice();
          onOpen(notice.peerId);
        }}
      >
        <Avatar peerId={notice.peerId} nickname={notice.nickname} size={36} />
        <View style={styles.text}>
          <Text style={styles.name} numberOfLines={1}>
            {notice.nickname}
          </Text>
          <Text style={styles.body} numberOfLines={1}>
            {notice.body}
          </Text>
        </View>
        <Text style={styles.tag}>Privado</Text>
      </Pressable>
    </Animated.View>
  );
}
