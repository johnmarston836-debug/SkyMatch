import React from 'react';
import { View } from 'react-native';
import { useThemedStyles } from '../theme/ThemeContext';

const ROWS = 5;
const SEATS_PER_SIDE = 3;
/** Where "you" sit in the drawing - fixed, because a real row number (27F) has nowhere to go in five drawn rows. */
const MY_ROW = 2;
const MY_COLUMN = 1;

/**
 * An empty cabin seen from above, with one seat lit: you, alone, until
 * someone else opens the app. Stands in for the illustration slot in empty
 * states, where an emoji would be both vaguer and - on some devices - a
 * tofu box.
 */
export function CabinSeats() {
  const styles = useThemedStyles(({ colors, radii, spacing }) => ({
    fuselage: {
      alignSelf: 'center' as const,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: radii.lg,
      paddingVertical: spacing(2),
      paddingHorizontal: spacing(2.5),
      gap: spacing(1),
    },
    row: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing(0.75) },
    seat: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    seatMine: { backgroundColor: colors.accent, borderColor: colors.accent },
    aisle: { width: spacing(2) },
  }));

  return (
    <View style={styles.fuselage}>
      {Array.from({ length: ROWS }, (_unusedRow, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: SEATS_PER_SIDE * 2 }, (_unusedSeat, index) => {
            const mine = row === MY_ROW && index === MY_COLUMN;
            return (
              <React.Fragment key={index}>
                <View style={[styles.seat, mine && styles.seatMine]} />
                {index === SEATS_PER_SIDE - 1 && <View style={styles.aisle} />}
              </React.Fragment>
            );
          })}
        </View>
      ))}
    </View>
  );
}
