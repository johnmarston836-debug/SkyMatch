import React, { useCallback, useRef } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
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
    [seat, onChange],
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
      <Text style={styles.helperText}>Toca tu letra de asiento</Text>

      <Text style={[typography.label, styles.rowLabel]}>FILA</Text>
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

const styles = StyleSheet.create({
  fuselage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(2),
  },
  seat: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  seatSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  seatText: { color: colors.textMuted, fontWeight: '700' },
  seatTextSelected: { color: colors.background },
  aisle: { width: spacing(3) },
  helperText: {
    ...typography.subtitle,
    textAlign: 'center',
    marginTop: spacing(1.5),
    marginBottom: spacing(3),
  },
  rowLabel: { textAlign: 'center', marginBottom: spacing(1) },
  rowList: { paddingHorizontal: spacing(2) },
  rowChip: {
    width: 48,
    height: 48,
    marginHorizontal: 4,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowChipSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  rowChipText: { color: colors.textMuted, fontWeight: '700', fontSize: 16 },
  rowChipTextSelected: { color: colors.background },
});
