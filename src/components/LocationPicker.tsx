import React from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SeatMap } from './SeatMap';
import { useAppTheme, useThemedStyles } from '../theme/ThemeContext';
import { venueOf } from '../venues';
import { t } from '../i18n';
import {
  CLASS_SIDES,
  MAX_CLASS_ROW,
  MAX_COACH,
  MUSCLE_GROUPS,
  OUTFIT_COLORS,
  OUTFIT_COLOR_HEX,
} from '../utils/location';
import type { UserLocation } from '../types';

const COACHES = Array.from({ length: MAX_COACH }, (_, i) => i + 1);
const CLASS_ROWS = Array.from({ length: MAX_CLASS_ROW }, (_, i) => i + 1);

interface Props {
  location: UserLocation;
  onChange: (location: UserLocation) => void;
}

/**
 * The one step that differs between venues: how you say where you are. Each
 * branch is the shortest input that still points at one person in that kind
 * of place.
 */
export function LocationPicker({ location, onChange }: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    sectionLabel: { ...typography.label, marginBottom: spacing(1) },
    fieldHint: {
      ...typography.subtitle,
      fontSize: 13,
      marginBottom: spacing(1.5),
    },
    coachList: { paddingVertical: spacing(0.5), gap: spacing(1) },
    chip: {
      minWidth: 52,
      height: 48,
      paddingHorizontal: spacing(1.5),
      marginRight: spacing(1),
      borderRadius: radii.pill,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipSelected: { backgroundColor: colors.text, borderColor: colors.text },
    chipText: {
      color: colors.textMuted,
      fontWeight: '700' as const,
      fontSize: 16,
    },
    chipTextSelected: { color: colors.background },
    grid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing(1),
    },
    tile: {
      flexGrow: 1,
      flexBasis: '46%' as const,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing(1.5),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(2),
    },
    tileSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.surfaceAlt,
    },
    tileText: { ...typography.body, fontWeight: '700' as const },
    sideTile: { flexBasis: '30%' as const, justifyContent: 'center' as const, paddingHorizontal: spacing(1) },
    swatch: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: colors.border,
    },
    spotLabel: {
      ...typography.label,
      marginTop: spacing(3),
      marginBottom: spacing(1),
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1.5),
      color: colors.text,
      fontSize: 15,
    },
    hint: { ...typography.subtitle, fontSize: 12, marginTop: spacing(1) },
  }));

  const venue = venueOf(location.kind);

  if (location.kind === 'plane') {
    return (
      <View>
        <Text style={styles.sectionLabel}>{venue.locationFieldLabel}</Text>
        <SeatMap
          seat={location.seat}
          onChange={seat => onChange({ kind: 'plane', seat })}
          allowWide
        />
      </View>
    );
  }

  if (location.kind === 'train') {
    return (
      <View>
        <Text style={styles.sectionLabel}>{t.picker.coachLabel}</Text>
        <FlatList
          data={COACHES}
          horizontal
          keyExtractor={item => String(item)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.coachList}
          initialScrollIndex={Math.max(0, location.coach - 3)}
          getItemLayout={(_, index) => ({
            length: 60,
            offset: 60 * index,
            index,
          })}
          renderItem={({ item }) => {
            const selected = item === location.coach;
            return (
              <Pressable
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => onChange({ ...location, coach: item })}
              >
                <Text
                  style={[styles.chipText, selected && styles.chipTextSelected]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          }}
        />
        <View style={{ height: theme.spacing(2) }} />
        <SeatMap
          seat={location.seat}
          onChange={seat => onChange({ ...location, seat })}
        />
      </View>
    );
  }

  if (location.kind === 'gym') {
    return (
      <View>
        <Text style={styles.sectionLabel}>{venue.locationFieldLabel}</Text>
        <View style={styles.grid}>
          {MUSCLE_GROUPS.map(muscle => {
            const selected = muscle === location.muscle;
            return (
              <Pressable
                key={muscle}
                style={[styles.tile, selected && styles.tileSelected]}
                onPress={() => onChange({ kind: 'gym', muscle })}
              >
                <Text style={styles.tileText}>{t.muscles[muscle]}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  if (location.kind === 'class') {
    return (
      <View>
        <Text style={styles.sectionLabel}>{t.picker.rowLabel}</Text>
        <Text style={styles.fieldHint}>{t.picker.classRowHint}</Text>
        <FlatList
          data={CLASS_ROWS}
          horizontal
          keyExtractor={item => String(item)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.coachList}
          initialScrollIndex={Math.max(0, location.row - 3)}
          getItemLayout={(_, index) => ({
            length: 60,
            offset: 60 * index,
            index,
          })}
          renderItem={({ item }) => {
            const selected = item === location.row;
            return (
              <Pressable
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => onChange({ ...location, row: item })}
              >
                <Text
                  style={[styles.chipText, selected && styles.chipTextSelected]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          }}
        />
        <Text style={styles.spotLabel}>{t.picker.classSideLabel}</Text>
        <Text style={styles.fieldHint}>{t.picker.classSideHint}</Text>
        <View style={styles.grid}>
          {CLASS_SIDES.map(side => {
            const selected = side === location.side;
            return (
              <Pressable
                key={side}
                style={[styles.tile, styles.sideTile, selected && styles.tileSelected]}
                onPress={() => onChange({ ...location, side })}
              >
                <Text style={styles.tileText}>{t.picker.classSides[side]}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.sectionLabel}>{venue.locationFieldLabel}</Text>
      <Text style={styles.fieldHint}>{t.picker.outfitHint}</Text>
      <View style={styles.grid}>
        {OUTFIT_COLORS.map(color => {
          const selected = color === location.color;
          return (
            <Pressable
              key={color}
              style={[styles.tile, selected && styles.tileSelected]}
              onPress={() => onChange({ ...location, color })}
            >
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: OUTFIT_COLOR_HEX[color] },
                ]}
              />
              <Text style={styles.tileText}>{t.colors[color]}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.spotLabel}>{t.picker.spotLabel}</Text>
      <TextInput
        selectionColor={theme.colors.accent}
        cursorColor={theme.colors.accent}
        style={styles.input}
        value={location.spot ?? ''}
        onChangeText={spot =>
          onChange({ ...location, spot: spot || undefined })
        }
        placeholder={t.picker.spotPlaceholder}
        placeholderTextColor={theme.colors.textMuted}
        maxLength={28}
      />
      <Text style={styles.hint}>{t.picker.spotHint}</Text>
    </View>
  );
}
