import React from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SeatMap } from './SeatMap';
import { useAppTheme, useThemedStyles } from '../theme/ThemeContext';
import { MAX_COACH, MUSCLE_GROUPS, MUSCLE_LABELS, OUTFIT_COLORS, OUTFIT_COLOR_INFO } from '../utils/location';
import type { UserLocation } from '../types';

const COACHES = Array.from({ length: MAX_COACH }, (_, i) => i + 1);

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
    chipText: { color: colors.textMuted, fontWeight: '700' as const, fontSize: 16 },
    chipTextSelected: { color: colors.background },
    grid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing(1) },
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
    tileSelected: { borderColor: colors.accent, backgroundColor: colors.surfaceAlt },
    tileText: { ...typography.body, fontWeight: '700' as const },
    swatch: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: colors.border },
    spotLabel: { ...typography.label, marginTop: spacing(3), marginBottom: spacing(1) },
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

  if (location.kind === 'plane') {
    return <SeatMap seat={location.seat} onChange={(seat) => onChange({ kind: 'plane', seat })} />;
  }

  if (location.kind === 'train') {
    return (
      <View>
        <Text style={styles.sectionLabel}>VAGÓN</Text>
        <FlatList
          data={COACHES}
          horizontal
          keyExtractor={(item) => String(item)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.coachList}
          initialScrollIndex={Math.max(0, location.coach - 3)}
          getItemLayout={(_, index) => ({ length: 60, offset: 60 * index, index })}
          renderItem={({ item }) => {
            const selected = item === location.coach;
            return (
              <Pressable
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => onChange({ ...location, coach: item })}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{item}</Text>
              </Pressable>
            );
          }}
        />
        <View style={{ height: theme.spacing(2) }} />
        <SeatMap seat={location.seat} onChange={(seat) => onChange({ ...location, seat })} />
      </View>
    );
  }

  if (location.kind === 'gym') {
    return (
      <View style={styles.grid}>
        {MUSCLE_GROUPS.map((muscle) => {
          const selected = muscle === location.muscle;
          return (
            <Pressable
              key={muscle}
              style={[styles.tile, selected && styles.tileSelected]}
              onPress={() => onChange({ kind: 'gym', muscle })}
            >
              <Text style={styles.tileText}>{MUSCLE_LABELS[muscle]}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View>
      <View style={styles.grid}>
        {OUTFIT_COLORS.map((color) => {
          const selected = color === location.color;
          return (
            <Pressable
              key={color}
              style={[styles.tile, selected && styles.tileSelected]}
              onPress={() => onChange({ ...location, color })}
            >
              <View style={[styles.swatch, { backgroundColor: OUTFIT_COLOR_INFO[color].hex }]} />
              <Text style={styles.tileText}>{OUTFIT_COLOR_INFO[color].label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.spotLabel}>¿DÓNDE ESTÁS? (OPCIONAL)</Text>
      <TextInput
        style={styles.input}
        value={location.spot ?? ''}
        onChangeText={(spot) => onChange({ ...location, spot: spot || undefined })}
        placeholder="En la barra, la terraza, cerca de la entrada…"
        placeholderTextColor={theme.colors.textMuted}
        maxLength={28}
      />
      <Text style={styles.hint}>Un sitio concreto ahorra la mitad de las miradas. Puedes cambiarlo cuando te muevas.</Text>
    </View>
  );
}
