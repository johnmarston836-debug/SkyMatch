import React, { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { t } from '../i18n';
import { useThemedStyles } from '../theme/ThemeContext';
import { MAX_ROW } from '../utils/seat';
import type { Seat, SeatLetter } from '../types';

const ROWS = Array.from({ length: MAX_ROW }, (_, i) => i + 1);
/**
 * The two cabins people meet: one aisle with three seats either side, and
 * the long-haul twin aisle, 3-4-3, where airlines skip the I and the
 * letters run to K. Each block is a run of seats between aisles.
 */
type Cabin = 'narrow' | 'wide';
const CABINS: Record<Cabin, SeatLetter[][]> = {
  narrow: [
    ['A', 'B', 'C'],
    ['D', 'E', 'F'],
  ],
  wide: [
    ['A', 'B', 'C'],
    ['D', 'E', 'F', 'G'],
    ['H', 'J', 'K'],
  ],
};
const NARROW_LETTERS = CABINS.narrow.flat();

interface Props {
  seat: Seat;
  onChange: (seat: Seat) => void;
  /** Offers the long-haul 3-4-3 cabin too; planes only - a train is never that wide. */
  allowWide?: boolean;
}

export function SeatMap({ seat, onChange, allowWide = false }: Props) {
  // Opens on the cabin the seat belongs to: a G, H, J or K is long-haul.
  const [cabin, setCabin] = useState<Cabin>(
    allowWide && !NARROW_LETTERS.includes(seat.letter) ? 'wide' : 'narrow',
  );
  const wide = cabin === 'wide';
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
    // Ten seats and two aisles have to fit where six and one did.
    seatWide: { maxWidth: 34, marginHorizontal: 1.5, borderRadius: 7 },
    seatTextWide: { fontSize: 12 },
    aisleWide: { width: spacing(1.25) },
    fuselageWide: { paddingHorizontal: spacing(1) },
    cabins: { flexDirection: 'row' as const, gap: spacing(1), marginBottom: spacing(1.5) },
    cabinOption: {
      flex: 1,
      paddingVertical: spacing(1),
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center' as const,
    },
    cabinOptionSelected: { backgroundColor: colors.text, borderColor: colors.text },
    cabinText: { color: colors.textMuted, fontWeight: '700' as const, fontSize: 13 },
    cabinTextSelected: { color: colors.background },
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
      {allowWide && (
        <View style={styles.cabins} accessibilityRole="radiogroup">
          {(['narrow', 'wide'] as Cabin[]).map((option) => {
            const selected = cabin === option;
            return (
              <Pressable
                key={option}
                style={[styles.cabinOption, selected && styles.cabinOptionSelected]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => {
                  setCabin(option);
                  // A long-haul letter has no place in a narrow cabin.
                  if (option === 'narrow' && !NARROW_LETTERS.includes(seat.letter)) onChange({ ...seat, letter: 'A' });
                }}
              >
                <Text style={[styles.cabinText, selected && styles.cabinTextSelected]}>
                  {option === 'narrow' ? t.picker.cabinNarrow : t.picker.cabinWide}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
      <View style={[styles.fuselage, wide && styles.fuselageWide]}>
        {CABINS[cabin].map((block, blockIndex) => (
          <React.Fragment key={blockIndex}>
            {blockIndex > 0 && <View style={[styles.aisle, wide && styles.aisleWide]} />}
            {block.map((letter) => {
              const selected = letter === seat.letter;
              return (
                <Pressable
                  key={letter}
                  onPress={() => onChange({ ...seat, letter })}
                  style={[styles.seat, wide && styles.seatWide, selected && styles.seatSelected]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.seatText, wide && styles.seatTextWide, selected && styles.seatTextSelected]}>
                    {letter}
                  </Text>
                </Pressable>
              );
            })}
          </React.Fragment>
        ))}
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
