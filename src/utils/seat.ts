import type { Seat, SeatLetter } from '../types';

export const SEAT_LETTERS: SeatLetter[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'];
export const MAX_ROW = 80;

const LETTER_INDEX: Record<SeatLetter, number> = SEAT_LETTERS.reduce(
  (acc, letter, index) => ({ ...acc, [letter]: index }),
  {} as Record<SeatLetter, number>,
);

/**
 * Packs a seat into a single byte for BLE advertisement payloads: row - 1
 * in bits 3-7, the letter in bits 0-2 among the first eight letters. Five
 * bits of row is rows 1 to 32, and 0xFF is kept to mean "doesn't fit"; any
 * other seat - row 33 and beyond, or a J or K - comes back as 0xFF and goes
 * in the longer form (see packLocation).
 *
 * It used to let rows past 32 overflow the byte, so a phone in row 40
 * announced itself as some seat in row 3 or so to everyone else.
 */
export function packSeat(seat: Seat): number {
  const letterIndex = LETTER_INDEX[seat.letter];
  if (seat.row < 1 || seat.row > MAX_ROW || letterIndex > 7) return 0xff;
  const packed = ((seat.row - 1) << 3) | letterIndex;
  return packed < 0xff ? packed : 0xff;
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
