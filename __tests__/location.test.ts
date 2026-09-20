import { formatLocation, describeLocation, packLocation, unpackLocation, defaultLocation } from '../src/utils/location';
import { VENUE_ORDER } from '../src/venues';
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
