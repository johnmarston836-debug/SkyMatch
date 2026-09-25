import React, { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, Text, View } from 'react-native';
import { LocationPicker } from './LocationPicker';
import { venueOf, VENUE_ORDER } from '../venues';
import { defaultLocation } from '../utils/location';
import { useThemedStyles } from '../theme/ThemeContext';
import type { UserLocation, VenueKind } from '../types';

/** How far the chosen place drops and how much it grows: enough to read as "this one", not to jump. */
const SELECTED_DROP = 5;
const SELECTED_SCALE = 1.1;

/**
 * Keeps the chosen chip stepped down out of the row and a little bigger,
 * springing there when picked and back when another one is.
 */
function useSelectedLift(selected: boolean) {
  const progress = useRef(new Animated.Value(selected ? 1 : 0)).current;
  useEffect(() => {
    const animation = Animated.spring(progress, {
      toValue: selected ? 1 : 0,
      friction: 6,
      tension: 140,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, selected]);
  return {
    transform: [
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, SELECTED_DROP] }) },
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, SELECTED_SCALE] }) },
    ],
  };
}

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
    venueRow: { flexDirection: 'row' as const, gap: spacing(1), marginTop: spacing(2), marginBottom: spacing(3) + SELECTED_DROP },
    venueChip: {
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
    venueChipWrap: { flex: 1 },
    venueName: { color: colors.textMuted, fontSize: 11, fontWeight: '700' as const, textAlign: 'center' as const },
    venueNameSelected: { color: colors.text },
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
        {VENUE_ORDER.map((kind: VenueKind) => (
          <VenueChip
            key={kind}
            kind={kind}
            selected={kind === location.kind}
            styles={styles}
            // Changing place starts its location from scratch: a seat means
            // nothing in a gym, and a muscle group means nothing on a train.
            onPress={() => {
              if (kind !== location.kind) onChange(defaultLocation(kind));
            }}
          />
        ))}
      </View>

      <View style={styles.helpCard}>
        <Text style={styles.helpText}>{venueOf(location.kind).locationHelp}</Text>
      </View>

      <LocationPicker location={location} onChange={onChange} />
    </View>
  );
}

interface ChipProps {
  kind: VenueKind;
  selected: boolean;
  onPress: () => void;
  styles: {
    venueChipWrap: object;
    venueChip: object;
    venueChipSelected: object;
    venueIcon: object;
    venueName: object;
    venueNameSelected: object;
  };
}

function VenueChip({ kind, selected, onPress, styles }: ChipProps) {
  const venue = venueOf(kind);
  const lift = useSelectedLift(selected);
  return (
    <Animated.View style={[styles.venueChipWrap, lift, selected && { zIndex: 1 }]}>
      <Pressable
        style={[styles.venueChip, selected && styles.venueChipSelected]}
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={venue.name}
      >
        <Image source={venue.icon} style={styles.venueIcon} resizeMode="contain" />
        <Text
          style={[styles.venueName, selected && styles.venueNameSelected]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {venue.shortName}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
