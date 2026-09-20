import {
  formatLocation,
  describeLocation,
  packLocation,
  unpackLocation,
  defaultLocation,
  normalizeLocation,
} from '../src/utils/location';
import { PRESENCE_COPY, VENUES, VENUE_ORDER } from '../src/venues';
import { quoteOf } from '../src/utils/id';
import type { UserLocation } from '../src/types';

const CASES: UserLocation[] = [
  { kind: 'plane', seat: { row: 14, letter: 'A' } },
  { kind: 'train', coach: 7, seat: { row: 22, letter: 'D' } },
  { kind: 'gym', muscle: 'legs' },
  { kind: 'public', color: 'red', spot: 'en la barra' },
];

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
      expect(packLocation(location).length).toBeLessThanOrEqual(5);
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

  it('rejects an advertisement it cannot read', () => {
    expect(unpackLocation('')).toBeNull();
    expect(unpackLocation('Z99')).toBeNull();
  });
});

describe('the one-tap announcement', () => {
  it('says the useful thing for each kind of place', () => {
    // A gym does not care that someone stood up; it cares that a machine is
    // about to be free.
    expect(VENUES.plane.alertStatus).toBe('standing');
    expect(VENUES.train.alertStatus).toBe('standing');
    expect(VENUES.public.alertStatus).toBe('standing');
    expect(VENUES.gym.alertStatus).toBe('leavingMachine');
  });

  it('only counts down where the minutes are the message', () => {
    expect(PRESENCE_COPY.leavingMachine.countdown).toBe(true);
    expect(PRESENCE_COPY.standing.countdown).toBe(false);
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
