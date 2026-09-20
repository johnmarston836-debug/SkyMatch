import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { LocationPicker } from './LocationPicker';
import { VENUES, VENUE_ORDER } from '../venues';
import { defaultLocation, formatLocation } from '../utils/location';
import { useThemedStyles } from '../theme/ThemeContext';
import type { UserLocation, VenueKind } from '../types';

interface Props {
  location: UserLocation;
  onChange: (location: UserLocation) => void;
}

/**
 * Pick a kind of place, then say where you are in it. Used both on the
 * launch screen and when editing your own profile, which are the two moments
 * this question comes up.
 */
export function VenueLocationChooser({ location, onChange }: Props) {
  const styles = useThemedStyles(({ colors, radii, spacing }) => ({
    venueRow: { flexDirection: 'row' as const, gap: spacing(1) },
    venueChip: {
      flex: 1,
      alignItems: 'center' as const,
      gap: spacing(0.5),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      paddingVertical: spacing(1.5),
    },
    venueChipSelected: { borderColor: colors.accent, backgroundColor: colors.surfaceAlt },
    venueIcon: { width: 22, height: 22, tintColor: colors.text },
    venueName: { color: colors.textMuted, fontSize: 11, fontWeight: '700' as const, textAlign: 'center' as const },
    venueNameSelected: { color: colors.text },
    readout: { alignItems: 'center' as const, marginVertical: spacing(3) },
    readoutText: {
      color: colors.text,
      fontSize: 38,
      fontWeight: '800' as const,
      letterSpacing: 1,
      textAlign: 'center' as const,
    },
    helpCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      padding: spacing(2),
      marginBottom: spacing(3),
    },
    helpText: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  }));

  return (
    <View>
      <View style={styles.venueRow}>
        {VENUE_ORDER.map((kind: VenueKind) => {
          const selected = kind === location.kind;
          return (
            <Pressable
              key={kind}
              style={[styles.venueChip, selected && styles.venueChipSelected]}
              // Changing place starts its location from scratch: a seat means
              // nothing in a gym, and a muscle group means nothing on a train.
              onPress={() => onChange(defaultLocation(kind))}
            >
              <Image source={VENUES[kind].icon} style={styles.venueIcon} resizeMode="contain" />
              <Text style={[styles.venueName, selected && styles.venueNameSelected]} numberOfLines={1}>
                {VENUES[kind].name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.readout}>
        <Text style={styles.readoutText}>{formatLocation(location)}</Text>
      </View>

      <View style={styles.helpCard}>
        <Text style={styles.helpText}>{VENUES[location.kind].locationHelp}</Text>
      </View>

      <LocationPicker location={location} onChange={onChange} />
    </View>
  );
}
