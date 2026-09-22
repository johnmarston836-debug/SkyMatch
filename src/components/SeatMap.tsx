import React, { useCallback, useRef } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { t } from '../i18n';
import { useThemedStyles } from '../theme/ThemeContext';
import { MAX_ROW } from '../utils/seat';
import type { Seat, SeatLetter } from '../types';

const ROWS = Array.from({ length: MAX_ROW }, (_, i) => i + 1);
const CABIN_LETTERS: SeatLetter[] = ['A', 'B', 'C', 'D', 'E', 'F'];

interface Props {
  seat: Seat;
  onChange: (seat: Seat) => void;
}

export function SeatMap({ seat, onChange }: Props) {
  const rowListRef = useRef<FlatList<number>>(null);
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    fuselage: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing(3),
      paddingHorizontal: spacing(1.5),
    },
    // Six seats and an aisle at a fixed 44 points came to about 370 points,
    // wider than a typical Android phone's content area: A and F spilled out
    // of the cabin. They now share whatever width there is, and stop growing
    // at 44 on a phone wide enough for that.
    seat: {
      flex: 1,
      maxWidth: 44,
      aspectRatio: 1,
      borderRadius: radii.sm,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginHorizontal: 3,
      borderWidth: 1,
      borderColor: colors.border,
    },
    seatSelected: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    seatText: { color: colors.textMuted, fontWeight: '700' as const },
    seatTextSelected: { color: colors.background },
    aisle: { width: spacing(2) },
    helperText: {
      ...typography.subtitle,
      textAlign: 'center' as const,
      marginTop: spacing(1.5),
      marginBottom: spacing(3),
    },
    rowLabel: { ...typography.label, textAlign: 'center' as const, marginBottom: spacing(1) },
    rowList: { paddingHorizontal: spacing(2) },
    rowChip: {
      width: 48,
      height: 48,
      marginHorizontal: 4,
      borderRadius: radii.pill,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rowChipSelected: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    rowChipText: { color: colors.textMuted, fontWeight: '700' as const, fontSize: 16 },
    rowChipTextSelected: { color: colors.background },
  }));

  const renderRow = useCallback(
    ({ item }: { item: number }) => {
      const selected = item === seat.row;
      return (
        <Pressable
          onPress={() => onChange({ ...seat, row: item })}
          style={[styles.rowChip, selected && styles.rowChipSelected]}
        >
          <Text style={[styles.rowChipText, selected && styles.rowChipTextSelected]}>{item}</Text>
        </Pressable>
      );
    },
    [seat, onChange, styles],
  );

  return (
    <View>
      <View style={styles.fuselage}>
        {CABIN_LETTERS.map((letter, index) => {
          const isAisleBoundary = index === 2;
          const selected = letter === seat.letter;
          return (
            <React.Fragment key={letter}>
              <Pressable
                onPress={() => onChange({ ...seat, letter })}
                style={[styles.seat, selected && styles.seatSelected]}
              >
                <Text style={[styles.seatText, selected && styles.seatTextSelected]}>{letter}</Text>
              </Pressable>
              {isAisleBoundary && <View style={styles.aisle} />}
            </React.Fragment>
          );
        })}
      </View>
      <Text style={styles.helperText}>{t.picker.seatLetterHint}</Text>

      <Text style={styles.rowLabel}>{t.picker.rowLabel}</Text>
      <FlatList
        ref={rowListRef}
        data={ROWS}
        horizontal
        keyExtractor={(item) => String(item)}
        renderItem={renderRow}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: 56, offset: 56 * index, index })}
        initialScrollIndex={Math.max(0, seat.row - 3)}
        contentContainerStyle={styles.rowList}
      />
    </View>
  );
}
