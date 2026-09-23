import { setLanguage } from '../src/i18n';
import { formatLocation, packLocation, unpackLocation } from '../src/utils/location';
import type { UserLocation } from '../src/types';

describe('a location sent packed', () => {
  afterAll(() => setLanguage('es'));

  it('reads in each phone’s own language', () => {
    const chest: UserLocation = { kind: 'gym', muscle: 'chest' };
    const red: UserLocation = { kind: 'public', color: 'red' };
    const sentChest = packLocation(chest);
    const sentRed = packLocation(red);

    setLanguage('es');
    expect(formatLocation(unpackLocation(sentChest)!)).toBe('Pecho');
    setLanguage('en');
    expect(formatLocation(unpackLocation(sentChest)!)).toBe('Chest');
    expect(formatLocation(unpackLocation(sentRed)!)).not.toBe('Rojo');
  });
});
