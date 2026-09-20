import React from 'react';
import { Text, View } from 'react-native';
import { useThemedStyles } from '../theme/ThemeContext';
import type { ReplyQuote } from '../types';

interface Props {
  quote: ReplyQuote;
  /** Own bubbles are filled with the text colour, so the quote has to invert with them. */
  inverted?: boolean;
}

/** The block of what you are answering, shown above the reply's own text. */
export function QuotedMessage({ quote, inverted = false }: Props) {
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    block: {
      borderLeftWidth: 3,
      borderLeftColor: inverted ? colors.background : colors.accent,
      backgroundColor: inverted ? 'rgba(255,255,255,0.14)' : colors.surfaceAlt,
      borderRadius: radii.sm,
      paddingHorizontal: spacing(1),
      paddingVertical: spacing(0.75),
      marginBottom: spacing(0.75),
      gap: 2,
    },
    name: {
      fontSize: 12,
      fontWeight: '700' as const,
      color: inverted ? colors.background : colors.accent,
    },
    excerpt: { ...typography.subtitle, fontSize: 13, color: inverted ? colors.background : colors.textMuted },
  }));

  return (
    <View style={styles.block}>
      <Text style={styles.name} numberOfLines={1}>
        {quote.nickname}
      </Text>
      <Text style={styles.excerpt} numberOfLines={2}>
        {quote.excerpt}
      </Text>
    </View>
  );
}
