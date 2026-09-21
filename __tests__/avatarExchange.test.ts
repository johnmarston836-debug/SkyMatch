import { MeshService } from '../src/mesh/MeshService';
import type { BleTransport } from '../src/mesh/BleTransport';
import { shortHash } from '../src/utils/hash';
import { FLOOD_LIMIT, FLOOD_WINDOW_MS } from '../src/mesh/protocol';
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
