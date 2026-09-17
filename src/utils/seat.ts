import type { Seat, SeatLetter } from '../types';

export const SEAT_LETTERS: SeatLetter[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'];
export const MAX_ROW = 80;

const LETTER_INDEX: Record<SeatLetter, number> = SEAT_LETTERS.reduce(
  (acc, letter, index) => ({ ...acc, [letter]: index }),
  {} as Record<SeatLetter, number>,
);

/** Packs a seat into a single byte for BLE advertisement payloads (row 0-79 in bits 3-7, letter in bits 0-2 among the first 8 letters; row>79 or letter J/K fall back to 0xFF meaning "see full profile"). */
export function packSeat(seat: Seat): number {
  const letterIndex = LETTER_INDEX[seat.letter];
  if (seat.row < 1 || seat.row > MAX_ROW || letterIndex > 7) return 0xff;
  return ((seat.row - 1) << 3) | letterIndex;
}

export function unpackSeat(byte: number): Seat | null {
  if (byte === 0xff) return null;
  const row = (byte >> 3) + 1;
  const letter = SEAT_LETTERS[byte & 0x07];
  if (!letter) return null;
  return { row, letter };
}

export function formatSeat(seat: Seat): string {
  return `${seat.row}${seat.letter}`;
}

export function parseSeat(text: string): Seat | null {
  const match = /^(\d{1,2})\s*([A-HJ-K])$/i.exec(text.trim());
  if (!match) return null;
  const row = Number(match[1]);
  const letter = match[2].toUpperCase() as SeatLetter;
  if (row < 1 || row > MAX_ROW) return null;
  return { row, letter };
}
