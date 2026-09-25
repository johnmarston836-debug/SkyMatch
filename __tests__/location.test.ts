import {
  formatLocation,
  describeLocation,
  packLocation,
  unpackLocation,
  defaultLocation,
  normalizeLocation,
} from '../src/utils/location';
import { PRESENCE_COUNTDOWN, venueOf, VENUE_ORDER } from '../src/venues';
import { LANGUAGES, setLanguage } from '../src/i18n';
import { quoteOf } from '../src/utils/id';
import {
  decodeFrame,
  encodeFrame,
  isRepairFrame,
  missingIndices,
  repairFrame,
  MAX_REPAIR_REQUEST,
} from '../src/mesh/protocol';
import type { UserLocation } from '../src/types';

// Every readable string below is language-dependent, so the language is
// pinned rather than left to whatever locale the runner happens to report.
beforeEach(() => setLanguage('es'));

const CASES: UserLocation[] = [
  { kind: 'plane', seat: { row: 14, letter: 'A' } },
  { kind: 'train', coach: 7, seat: { row: 22, letter: 'D' } },
  { kind: 'gym', muscle: 'legs' },
  { kind: 'public', color: 'red', spot: 'en la barra' },
  // Long-haul 3-4-3 cabins: letters the one-byte form can't hold.
  { kind: 'plane', seat: { row: 27, letter: 'K' } },
  { kind: 'plane', seat: { row: 80, letter: 'G' } },
  // Past row 32 the one-byte form runs out of bits, whatever the letter.
  { kind: 'plane', seat: { row: 40, letter: 'A' } },
  { kind: 'plane', seat: { row: 32, letter: 'H' } },
  { kind: 'train', coach: 12, seat: { row: 9, letter: 'J' } },
  { kind: 'class', row: 3, side: 'left' },
  { kind: 'class', row: 30, side: 'right' },
];

describe('classroom', () => {
  it('reads as a row and a side of the room', () => {
    expect(formatLocation({ kind: 'class', row: 3, side: 'left' })).toBe('F3 · Izq.');
    expect(packLocation({ kind: 'class', row: 3, side: 'center' })).toBe('C031');
  });

  it('rejects rows and sides that are not there', () => {
    expect(normalizeLocation({ kind: 'class', row: 0, side: 'left' })).toBeNull();
    expect(normalizeLocation({ kind: 'class', row: 4, side: 'back' })).toBeNull();
    expect(normalizeLocation({ kind: 'class', row: 4, side: 'right' })).toEqual({ kind: 'class', row: 4, side: 'right' });
    expect(unpackLocation('C039')).toBeNull();
  });

  it('says which class it is on the card, when given', () => {
    const location = normalizeLocation({ kind: 'class', row: 2, side: 'center', room: '1º C' });
    expect(location).toEqual({ kind: 'class', row: 2, side: 'center', room: '1º C' });
    expect(describeLocation(location!)).toBe('1º C · Fila 2, en el centro');
    // Too long for the advertisement: the badge stays row and side.
    expect(formatLocation(location!)).toBe('F2 · Centro');
  });
});

describe('locations', () => {
  it('survives the round trip through an advertisement', () => {
    // The packed form is all an iOS advertisement has room for once the
    // service UUID is in it, so anything lost here is lost on the radio.
    for (const location of CASES) {
      const unpacked = unpackLocation(packLocation(location));
      expect(unpacked).not.toBeNull();
      expect(unpacked!.kind).toBe(location.kind);
      // The free-text spot is the one thing too big to advertise.
      expect(formatLocation(unpacked!)).toBe(formatLocation(location));
    }
  });

  it('stays inside the advertisement budget', () => {
    // "SM" plus the packed location; a 128-bit service UUID leaves roughly
    // nine characters of local name behind it.
    for (const location of CASES) {
      expect(packLocation(location).length).toBeLessThanOrEqual(6);
    }
  });

  it('reads the way people actually point at someone', () => {
    expect(formatLocation(CASES[0])).toBe('14A');
    expect(formatLocation(CASES[1])).toBe('V7 · 22D');
    expect(formatLocation(CASES[2])).toBe('Pierna');
    expect(formatLocation(CASES[3])).toBe('Rojo');
    expect(describeLocation(CASES[1])).toBe('Vagón 7, asiento 22D');
    expect(describeLocation(CASES[3])).toBe('Rojo · en la barra');
  });

  it('gives every venue a usable starting point', () => {
    for (const kind of VENUE_ORDER) {
      const location = defaultLocation(kind);
      expect(location.kind).toBe(kind);
      expect(formatLocation(location).length).toBeGreaterThan(0);
    }
  });

  it('keeps the old one-byte form for every seat it can hold', () => {
    // Earlier builds read 'P' as a single byte; anything that fits keeps it.
    expect(packLocation({ kind: 'plane', seat: { row: 14, letter: 'A' } })).toMatch(/^P[0-9a-f]{2}$/);
    expect(packLocation({ kind: 'plane', seat: { row: 27, letter: 'K' } })).toBe('Q1b9');
  });

  it('rejects an advertisement it cannot read', () => {
    expect(unpackLocation('')).toBeNull();
    expect(unpackLocation('Z99')).toBeNull();
  });
});

describe('the one-tap announcement', () => {
  it('says the useful thing for each kind of place', () => {
    // A gym does not care that someone stood up; it cares that a machine is
    // about to be free.
    expect(venueOf('plane').alertStatus).toBe('standing');
    expect(venueOf('train').alertStatus).toBe('standing');
    expect(venueOf('public').alertStatus).toBe('standing');
    expect(venueOf('gym').alertStatus).toBe('leavingMachine');
  });

  it('only counts down where the minutes are the message', () => {
    expect(PRESENCE_COUNTDOWN.leavingMachine).toBe(true);
    expect(PRESENCE_COUNTDOWN.standing).toBe(false);
  });
});

describe('reply quotes', () => {
  it('keeps a quote short enough to stay cheap on the radio', () => {
    const long = 'a'.repeat(400);
    const quote = quoteOf({ fromNickname: 'Ana', body: long });
    expect(quote.excerpt.length).toBeLessThanOrEqual(70);
    expect(quote.excerpt.endsWith('…')).toBe(true);
  });

  it('quotes a photo by what it is, not by an empty line', () => {
    expect(quoteOf({ fromNickname: 'Ana', body: '', imageBase64: 'xx' }).excerpt).toBe('Foto');
    // A photo sent with a caption quotes the caption.
    expect(quoteOf({ fromNickname: 'Ana', body: 'mira esto', imageBase64: 'xx' }).excerpt).toBe('mira esto');
  });
});

describe('reading what arrived over the radio', () => {
  it('upgrades a profile from the build that only knew about planes', () => {
    // That build announced the seat at the top level, with no kind beside
    // it. Reading .kind off it is what crashed the passenger list.
    expect(normalizeLocation({ row: 14, letter: 'A' })).toEqual({
      kind: 'plane',
      seat: { row: 14, letter: 'A' },
    });
  });

  it('accepts every shape this build sends', () => {
    for (const location of CASES) {
      expect(normalizeLocation(JSON.parse(JSON.stringify(location)))).toEqual(location);
    }
  });

  it('refuses anything it cannot draw instead of passing it on', () => {
    expect(normalizeLocation(undefined)).toBeNull();
    expect(normalizeLocation(null)).toBeNull();
    expect(normalizeLocation('14A')).toBeNull();
    expect(normalizeLocation({})).toBeNull();
    // A kind of place invented by a newer build.
    expect(normalizeLocation({ kind: 'stadium', block: 3 })).toBeNull();
    // Right shape, impossible values.
    expect(normalizeLocation({ kind: 'plane', seat: { row: 999, letter: 'A' } })).toBeNull();
    expect(normalizeLocation({ kind: 'plane', seat: { row: 4, letter: 'Z' } })).toBeNull();
    expect(normalizeLocation({ kind: 'gym', muscle: 'brain' })).toBeNull();
    expect(normalizeLocation({ kind: 'public', color: 'chartreuse' })).toBeNull();
    expect(normalizeLocation({ kind: 'train', seat: { row: 4, letter: 'A' } })).toBeNull();
  });
});

describe('the four-across venue chips', () => {
  it('keeps every name short enough to fit in a quarter of the screen', () => {
    // A label that overflows is rendered as "Espacio públ…", which names
    // nothing. Nine characters is what fits at this size on the narrowest
    // phone the app supports.
    for (const language of LANGUAGES) {
      setLanguage(language);
      for (const kind of VENUE_ORDER) {
        expect(venueOf(kind).shortName.length).toBeLessThanOrEqual(9);
      }
    }
  });
});

describe('repairing a send instead of repeating it', () => {
  it('names exactly the chunks that never arrived', () => {
    const parts = new Map<number, string>([
      [0, 'a'],
      [1, 'b'],
      [3, 'd'],
    ]);
    expect(missingIndices(parts, 5)).toEqual([2, 4]);
    expect(missingIndices(new Map([[0, 'a']]), 1)).toEqual([]);
  });

  it('keeps a request small enough to be worth sending', () => {
    // A photo can be missing a hundred chunks after a bad patch. Asking for
    // all of them in one packet would itself need splitting, which is the
    // problem this is meant to solve.
    const many = Array.from({ length: 200 }, (_, i) => i);
    expect(repairFrame('abc', many).need).toHaveLength(MAX_REPAIR_REQUEST);
  });

  it('survives the trip as a frame like any other', () => {
    const frame = repairFrame('abc12345', [7, 9]);
    const decoded = decodeFrame(encodeFrame(frame));
    expect(decoded).not.toBeNull();
    expect(isRepairFrame(decoded!)).toBe(true);
    expect(decoded!.need).toEqual([7, 9]);
    // And an ordinary chunk is never mistaken for a request.
    expect(isRepairFrame({ id: 'x', index: 0, total: 2, part: 'hola' })).toBe(false);
  });
});
