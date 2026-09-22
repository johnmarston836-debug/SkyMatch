import { MeshService } from '../src/mesh/MeshService';
import type { BleTransport } from '../src/mesh/BleTransport';
import { shortHash } from '../src/utils/hash';
import { encodeEnvelope, frameChunks, newFrameId, FLOOD_LIMIT, FLOOD_WINDOW_MS } from '../src/mesh/protocol';
import { BROADCAST_ID } from '../src/mesh/protocol';
import type { AvatarPacket, UserLocation } from '../src/types';

/**
 * A pair of transports wired to each other, with a knob to drop the next N
 * sends. Photos are hundreds of Bluetooth frames with no acknowledgement, so
 * losing a send is the normal case these tests are about, not an edge case.
 */
class LinkedTransport implements BleTransport {
  peer: LinkedTransport | null = null;
  dropNext = 0;
  private envelopeListeners = new Set<(raw: string, fromPeerId: string) => void>();

  constructor(private name: string) {}

  async start(): Promise<void> {}
  async stop(): Promise<void> {}
  onPeerSeen() {
    return () => {};
  }
  onPeerLost() {
    return () => {};
  }
  onEnvelope(listener: (raw: string, fromPeerId: string) => void) {
    this.envelopeListeners.add(listener);
    return () => this.envelopeListeners.delete(listener);
  }

  async sendToPeer(_peerId: string, raw: string): Promise<boolean> {
    this.deliver(raw);
    return true;
  }

  async broadcast(raw: string): Promise<void> {
    this.deliver(raw);
  }

  private deliver(raw: string) {
    if (this.dropNext > 0) {
      this.dropNext -= 1;
      return;
    }
    this.peer?.envelopeListeners.forEach((listener) => listener(raw, this.name));
  }
}

function linked() {
  const aTransport = new LinkedTransport('a');
  const bTransport = new LinkedTransport('b');
  aTransport.peer = bTransport;
  bTransport.peer = aTransport;
  return {
    aTransport,
    bTransport,
    a: new MeshService(aTransport, 'peer-a'),
    b: new MeshService(bTransport, 'peer-b'),
  };
}

const LOCATION: UserLocation = { kind: 'plane', seat: { row: 14, letter: 'A' } };
const PHOTO = 'photo-bytes-in-base64';

/**
 * Measured, not guessed: a 64px face and a 256px portrait of the same
 * picture, re-encoded at the qualities MyProfileScreen asks the picker and
 * the rescaler for. What matters here is the ratio between them, which is
 * what decides whether a full carriage is affordable.
 */
const THUMB_CHARS = 1708;
const PORTRAIT_CHARS = 9500;
const fakePhoto = (chars: number) => 'x'.repeat(chars);

describe('avatar exchange', () => {
  it('carries the photo fingerprint in the profile announcement', async () => {
    const { a, b } = linked();
    const seen: Array<string | undefined> = [];
    b.on('profile', (_peerId, packet) => seen.push(packet.avatarHash));

    await a.broadcastProfile({ id: 'peer-a', location: LOCATION, nickname: 'Ana' }, shortHash(PHOTO));

    expect(seen).toEqual([shortHash(PHOTO)]);
  });

  it('answers a request with the photo itself', async () => {
    const { a, b } = linked();
    const received: AvatarPacket[] = [];
    b.on('avatar', (avatar) => received.push(avatar));
    a.on('avatarRequest', (fromId) => {
      void a.sendAvatar({ fromId: 'peer-a', imageBase64: PHOTO, sentAt: 1 }, fromId);
    });

    await b.requestAvatar('peer-a');

    expect(received).toHaveLength(1);
    expect(received[0].imageBase64).toBe(PHOTO);
  });

  it('asks for the face by default and the portrait only when said so', async () => {
    const { a, b } = linked();
    const asked: boolean[] = [];
    a.on('avatarRequest', (_fromId, full) => asked.push(full));

    await b.requestAvatar('peer-a');
    await b.requestAvatar('peer-a', true);

    // The default matters more than it looks: it is what every profile beat
    // in a crowded room triggers, twenty times over.
    expect(asked).toEqual([false, true]);
  });

  it('is understood by a phone running the build before thumbnails', async () => {
    // That build sent {fromId, imageBase64, sentAt} and asked with an empty
    // payload. Neither side may fall over.
    const { a, b } = linked();
    const asked: boolean[] = [];
    const received: AvatarPacket[] = [];
    a.on('avatarRequest', (_fromId, full) => asked.push(full));
    b.on('avatar', (avatar) => received.push(avatar));

    await b.requestAvatar('peer-a');
    await a.sendAvatar({ fromId: 'peer-a', imageBase64: PHOTO, sentAt: 1 }, 'peer-b');

    expect(asked).toEqual([false]);
    // No fingerprint and no size. The receiving side hashes what arrived -
    // which matches what that build announces, because it is the same photo
    // - and files it as a face, so the lists fill in exactly as before.
    expect(received[0].hash).toBeUndefined();
    expect(received[0].full).toBeUndefined();
  });

  it('still converges when the first answer is lost', async () => {
    const { a, aTransport, b } = linked();
    const received: AvatarPacket[] = [];
    b.on('avatar', (avatar) => received.push(avatar));
    a.on('avatarRequest', (fromId) => {
      void a.sendAvatar({ fromId: 'peer-a', imageBase64: PHOTO, sentAt: 1 }, fromId);
    });

    aTransport.dropNext = 1; // the photo never makes it across
    await b.requestAvatar('peer-a');
    expect(received).toHaveLength(0);

    // The next profile beat shows a fingerprint we still don't have, so we
    // ask again - which is the whole point of asking rather than pushing.
    await b.requestAvatar('peer-a');
    expect(received).toHaveLength(1);
  });
});

describe('what a full carriage costs', () => {
  /** The frames one photo of this size actually becomes on the wire. */
  const framesFor = (chars: number, full: boolean) => {
    const envelope = encodeEnvelope({
      id: 'abcdef12-3456-7890-abcd-ef1234567890',
      kind: 'avatar',
      fromId: 'peer-a',
      toId: 'peer-b',
      ttl: 6,
      payload: { fromId: 'peer-a', imageBase64: fakePhoto(chars), hash: 'abcd1234', full, sentAt: 1 },
    });
    return frameChunks(envelope, newFrameId()).length;
  };

  it('sends a face for a fraction of what a portrait costs', () => {
    const face = framesFor(THUMB_CHARS, false);
    const portrait = framesFor(PORTRAIT_CHARS, true);

    // This ratio is the whole point of the two sizes. Twenty people around
    // you is twenty faces either way; at portrait size that is a few
    // thousand frames before anybody has typed a word.
    expect(portrait / face).toBeGreaterThan(4);
    expect(face * 20).toBeLessThan(portrait * 5);
  });

  it('keeps a profile beat small enough to carry every ten seconds', () => {
    // The temptation is to put the face inside the profile and be done with
    // it. This is why it can't go there: the beat is broadcast to the whole
    // room six times a minute.
    const beat = encodeEnvelope({
      id: 'abcdef12-3456-7890-abcd-ef1234567890',
      kind: 'profile',
      fromId: 'peer-a',
      toId: BROADCAST_ID,
      ttl: 6,
      payload: { id: 'peer-a', location: LOCATION, nickname: 'Ana', avatarHash: 'abcd1234' },
    });
    expect(frameChunks(beat, newFrameId()).length).toBeLessThanOrEqual(3);
  });
});

describe('a phone that floods the mesh', () => {
  it('is ignored past its allowance, and heard again in the next window', async () => {
    const { a, b } = linked();
    const heard: string[] = [];
    b.on('message', (message) => heard.push(message.id));

    const send = (n: number) =>
      a.sendGroupMessage({
        id: `m${n}`,
        scope: 'group',
        fromId: 'peer-a',
        fromLabel: '14A',
        fromNickname: 'Ana',
        body: 'spam',
        sentAt: n,
      });

    for (let i = 0; i < FLOOD_LIMIT + 10; i++) await send(i);
    expect(heard).toHaveLength(FLOOD_LIMIT);

    // The allowance is per window, not a ban: after it passes they are heard.
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + FLOOD_WINDOW_MS + 1);
    await send(999);
    expect(heard).toHaveLength(FLOOD_LIMIT + 1);
    jest.spyOn(Date, 'now').mockRestore();
  });
});
