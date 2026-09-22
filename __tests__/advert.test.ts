import { Buffer } from 'buffer';
import { locationFromAdvert } from '../src/mesh/RealBleTransport';
import { packLocation } from '../src/utils/location';
import type { UserLocation } from '../src/types';

const seat: UserLocation = { kind: 'plane', seat: { row: 14, letter: 'A' } };

describe('locationFromAdvert', () => {
  it('reads an iOS advert from its local name', () => {
    expect(locationFromAdvert(`SM${packLocation(seat)}`, null)).toEqual(seat);
  });

  it('reads an Android advert from its manufacturer data', () => {
    const data = Buffer.concat([Buffer.from([0xff, 0xff]), Buffer.from(`SM${packLocation(seat)}`, 'latin1')]);
    // The phone's own Bluetooth name is what Android puts in the local name.
    expect(locationFromAdvert('Pixel de Ana', data.toString('base64'))).toEqual(seat);
  });

  it('ignores the seat byte an older Android build advertised, and anyone else’s data', () => {
    expect(locationFromAdvert(null, Buffer.from([0xff, 0xff, 0x2a]).toString('base64'))).toBeNull();
    const other = Buffer.concat([Buffer.from([0x4c, 0x00]), Buffer.from('SMP1C', 'latin1')]);
    expect(locationFromAdvert(null, other.toString('base64'))).toBeNull();
    expect(locationFromAdvert(null, null)).toBeNull();
  });
});
