import { formatSeat, packSeat, unpackSeat, MAX_ROW, SEAT_LETTERS } from './seat';
import { t } from '../i18n';
import type { MuscleGroup, OutfitColor, Seat, SeatLetter, UserLocation, VenueKind } from '../types';

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

export const OUTFIT_COLORS: OutfitColor[] = ['black', 'white', 'grey', 'red', 'blue', 'green', 'yellow', 'pink'];

/**
 * The swatch for each colour, which is what makes the list readable at a
 * glance. Its name is in the dictionaries: "red" is a word like any other.
 */
export const OUTFIT_COLOR_HEX: Record<OutfitColor, string> = {
  black: '#141414',
  white: '#F5F5F5',
  grey: '#8E8E93',
  red: '#E23B3B',
  blue: '#2F6BFF',
  green: '#2FA84F',
  yellow: '#E8B800',
  pink: '#E45BA5',
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
      return `${t.location.coachShort}${location.coach} · ${formatSeat(location.seat)}`;
    case 'gym':
      return t.muscles[location.muscle];
    case 'public':
      return t.colors[location.color];
  }
}

/** The longer form for a profile card, where there is room to say it properly. */
export function describeLocation(location: UserLocation): string {
  switch (location.kind) {
    case 'plane':
      return t.location.describeSeat(formatSeat(location.seat));
    case 'train':
      return t.location.describeCoachSeat(location.coach, formatSeat(location.seat));
    case 'gym':
      return t.location.describeMuscle(t.muscles[location.muscle]);
    case 'public':
      return location.spot
        ? `${t.colors[location.color]} · ${location.spot}`
        : t.location.describeOutfit(t.colors[location.color]);
  }
}

/** The colour to tint a badge with, where the location itself is a colour. */
export function locationSwatch(location: UserLocation): string | null {
  return location.kind === 'public' ? OUTFIT_COLOR_HEX[location.color] : null;
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

/** Reads a seat out of untyped data, rejecting anything that isn't a real one. */
function normalizeSeat(value: unknown): Seat | null {
  if (typeof value !== 'object' || value === null) return null;
  const { row, letter } = value as { row?: unknown; letter?: unknown };
  if (typeof row !== 'number' || !Number.isFinite(row) || row < 1 || row > MAX_ROW) return null;
  if (typeof letter !== 'string' || !SEAT_LETTERS.includes(letter as SeatLetter)) return null;
  return { row, letter: letter as SeatLetter };
}

/**
 * Turns whatever arrived over the radio into a location this build can
 * render, or null when it can't.
 *
 * A packet is untyped input no matter what the types here say: it may come
 * from a phone still running the build where a profile was a bare seat, or
 * from a newer one announcing a kind of place this build has never heard of.
 * Reading `.kind` off that without asking first is what crashes the whole
 * passenger list on the phone that did update.
 */
export function normalizeLocation(value: unknown): UserLocation | null {
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Record<string, unknown>;

  // A profile from before this app knew about anywhere but an aeroplane:
  // the seat sat at the top level, with no kind beside it.
  if (raw.kind === undefined) {
    const seat = normalizeSeat(raw);
    return seat ? { kind: 'plane', seat } : null;
  }

  switch (raw.kind) {
    case 'plane': {
      const seat = normalizeSeat(raw.seat);
      return seat ? { kind: 'plane', seat } : null;
    }
    case 'train': {
      const seat = normalizeSeat(raw.seat);
      const coach = raw.coach;
      if (!seat || typeof coach !== 'number' || !Number.isFinite(coach) || coach < 1) return null;
      return { kind: 'train', coach, seat };
    }
    case 'gym': {
      const muscle = raw.muscle;
      if (typeof muscle !== 'string' || !MUSCLE_GROUPS.includes(muscle as MuscleGroup)) return null;
      return { kind: 'gym', muscle: muscle as MuscleGroup };
    }
    case 'public': {
      const color = raw.color;
      if (typeof color !== 'string' || !OUTFIT_COLORS.includes(color as OutfitColor)) return null;
      const spot = typeof raw.spot === 'string' && raw.spot.length > 0 ? raw.spot.slice(0, 40) : undefined;
      return { kind: 'public', color: color as OutfitColor, spot };
    }
    default:
      // Some future venue this build doesn't have. Better no badge than a crash.
      return null;
  }
}
