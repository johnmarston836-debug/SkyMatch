import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useThemedStyles } from '../theme/ThemeContext';
import type { ReplyQuote } from '../types';

interface Props {
  quote: ReplyQuote | null;
  onCancel: () => void;
}

/** Sits above the text box while a reply is being written, so it is never a surprise what you are answering. */
export function ReplyComposerBar({ quote, onCancel }: Props) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    bar: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing(1.5),
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1),
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    accent: { width: 3, alignSelf: 'stretch' as const, backgroundColor: colors.accent, borderRadius: 2 },
    body: { flex: 1, gap: 2 },
    title: { color: colors.accent, fontSize: 12, fontWeight: '700' as const },
    excerpt: { ...typography.subtitle, fontSize: 13 },
    close: { color: colors.textMuted, fontSize: 20, fontWeight: '600' as const, paddingHorizontal: spacing(0.5) },
  }));

  if (!quote) return null;

  return (
    <View style={styles.bar}>
      <View style={styles.accent} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          Respondiendo a {quote.nickname}
        </Text>
        <Text style={styles.excerpt} numberOfLines={1}>
          {quote.excerpt}
        </Text>
      </View>
      <Pressable onPress={onCancel} hitSlop={12}>
        <Text style={styles.close}>✕</Text>
      </Pressable>
    </View>
  );
}
