import { formatSeat, packSeat, unpackSeat } from './seat';
import type { MuscleGroup, OutfitColor, Seat, UserLocation, VenueKind } from '../types';

export const MAX_COACH = 20;

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'core',
  'cardio',
  'fullbody',
];

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Pecho',
  back: 'Espalda',
  legs: 'Pierna',
  shoulders: 'Hombro',
  arms: 'Brazo',
  core: 'Core',
  cardio: 'Cardio',
  fullbody: 'Full body',
};

export const OUTFIT_COLORS: OutfitColor[] = ['black', 'white', 'grey', 'red', 'blue', 'green', 'yellow', 'pink'];

/** Label and swatch for each colour. The swatch is what makes the list readable at a glance. */
export const OUTFIT_COLOR_INFO: Record<OutfitColor, { label: string; hex: string }> = {
  black: { label: 'Negro', hex: '#141414' },
  white: { label: 'Blanco', hex: '#F5F5F5' },
  grey: { label: 'Gris', hex: '#8E8E93' },
  red: { label: 'Rojo', hex: '#E23B3B' },
  blue: { label: 'Azul', hex: '#2F6BFF' },
  green: { label: 'Verde', hex: '#2FA84F' },
  yellow: { label: 'Amarillo', hex: '#E8B800' },
  pink: { label: 'Rosa', hex: '#E45BA5' },
};

export const DEFAULT_SEAT: Seat = { row: 14, letter: 'A' };

export function defaultLocation(kind: VenueKind): UserLocation {
  switch (kind) {
    case 'plane':
      return { kind: 'plane', seat: DEFAULT_SEAT };
    case 'train':
      return { kind: 'train', coach: 1, seat: DEFAULT_SEAT };
    case 'gym':
      return { kind: 'gym', muscle: 'chest' };
    case 'public':
      return { kind: 'public', color: 'black' };
  }
}

/**
 * The short form that goes on a badge next to a message: it has to fit in a
 * chip beside a name, so it is the shortest thing that still points at one
 * person in the room.
 */
export function formatLocation(location: UserLocation): string {
  switch (location.kind) {
    case 'plane':
      return formatSeat(location.seat);
    case 'train':
      return `V${location.coach} · ${formatSeat(location.seat)}`;
    case 'gym':
      return MUSCLE_LABELS[location.muscle];
    case 'public':
      return OUTFIT_COLOR_INFO[location.color].label;
  }
}

/** The longer form for a profile card, where there is room to say it properly. */
export function describeLocation(location: UserLocation): string {
  switch (location.kind) {
    case 'plane':
      return `Asiento ${formatSeat(location.seat)}`;
    case 'train':
      return `Vagón ${location.coach}, asiento ${formatSeat(location.seat)}`;
    case 'gym':
      return `Hoy entrena ${MUSCLE_LABELS[location.muscle].toLowerCase()}`;
    case 'public':
      return location.spot
        ? `${OUTFIT_COLOR_INFO[location.color].label} · ${location.spot}`
        : `Va de ${OUTFIT_COLOR_INFO[location.color].label.toLowerCase()}`;
  }
}

/** The colour to tint a badge with, where the location itself is a colour. */
export function locationSwatch(location: UserLocation): string | null {
  return location.kind === 'public' ? OUTFIT_COLOR_INFO[location.color].hex : null;
}

const VENUE_CODES: Record<VenueKind, string> = { plane: 'P', train: 'T', gym: 'G', public: 'U' };

function hex(byte: number): string {
  return byte.toString(16).padStart(2, '0');
}

/**
 * Packs a location into the handful of characters an iOS advertisement can
 * carry (a 128-bit service UUID leaves almost nothing behind it), so a
 * phone can show who is around before the full profile has crossed over.
 */
export function packLocation(location: UserLocation): string {
  const code = VENUE_CODES[location.kind];
  switch (location.kind) {
    case 'plane':
      return code + hex(packSeat(location.seat));
    case 'train':
      return code + hex(Math.min(location.coach, 0xfe)) + hex(packSeat(location.seat));
    case 'gym':
      return code + hex(MUSCLE_GROUPS.indexOf(location.muscle));
    case 'public':
      return code + hex(OUTFIT_COLORS.indexOf(location.color));
  }
}

export function unpackLocation(packed: string): UserLocation | null {
  const byteAt = (offset: number) => parseInt(packed.slice(offset, offset + 2), 16);
  switch (packed.charAt(0)) {
    case 'P': {
      const seat = unpackSeat(byteAt(1));
      return seat ? { kind: 'plane', seat } : null;
    }
    case 'T': {
      const coach = byteAt(1);
      const seat = unpackSeat(byteAt(3));
      return seat && !Number.isNaN(coach) ? { kind: 'train', coach, seat } : null;
    }
    case 'G': {
      const muscle = MUSCLE_GROUPS[byteAt(1)];
      return muscle ? { kind: 'gym', muscle } : null;
    }
    case 'U': {
      const color = OUTFIT_COLORS[byteAt(1)];
      return color ? { kind: 'public', color } : null;
    }
    default:
      return null;
  }
}
