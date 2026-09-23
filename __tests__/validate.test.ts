import {
  MAX_ALERT_LIFETIME_MS,
  MAX_BODY_CHARS,
  readAvatar,
  readChatMessage,
  readPresenceAlert,
  readReaction,
  readReceipt,
} from '../src/mesh/validate';
import { MeshService } from '../src/mesh/MeshService';
import type { BleTransport } from '../src/mesh/BleTransport';
import { BROADCAST_ID, encodeEnvelope, type MeshEnvelope } from '../src/mesh/protocol';
import type { ChatMessage } from '../src/types';

const message: ChatMessage = {
  id: 'm1',
  scope: 'group',
  fromId: 'peer-a',
  fromLabel: '14A',
  fromNickname: 'Ana',
  body: 'hola',
  sentAt: 1_000,
};

describe('readChatMessage', () => {
  it('accepts a well-formed message as it is', () => {
    expect(readChatMessage(message, 'peer-a')).toEqual(message);
  });

  it('refuses one claiming to be from someone the mesh says it is not', () => {
    expect(readChatMessage(message, 'peer-b')).toBeNull();
  });

  it('refuses the shapes that used to take the chat screen down', () => {
    expect(readChatMessage({ ...message, body: 42 }, 'peer-a')).toBeNull();
    expect(readChatMessage({ ...message, sentAt: 'yesterday' }, 'peer-a')).toBeNull();
    expect(readChatMessage({ ...message, scope: 'shout' }, 'peer-a')).toBeNull();
    expect(readChatMessage({ ...message, scope: 'private' }, 'peer-a')).toBeNull(); // no recipient
    expect(readChatMessage(null, 'peer-a')).toBeNull();
    expect(readChatMessage({ ...message, body: '' }, 'peer-a')).toBeNull();
  });

  it('cuts an overlong body down to what the composer allows', () => {
    const read = readChatMessage({ ...message, body: 'x'.repeat(10_000) }, 'peer-a');
    expect(read?.body).toHaveLength(MAX_BODY_CHARS);
  });

  it('never lets a photo into the group chat', () => {
    const read = readChatMessage({ ...message, imageBase64: 'AAAA' }, 'peer-a');
    expect(read?.imageBase64).toBeUndefined();
  });

  it('keeps a private photo, and a reply quote only when it is readable', () => {
    const read = readChatMessage(
      { ...message, scope: 'private', toId: 'me', imageBase64: 'AAAA', replyTo: { nickname: 3 } },
      'peer-a',
    );
    expect(read?.imageBase64).toBe('AAAA');
    expect(read?.replyTo).toBeUndefined();
  });

  it('keeps the seat an older build labelled its messages with', () => {
    const legacy = { ...message, fromLabel: undefined, fromSeat: { row: 3, letter: 'C' } };
    expect((readChatMessage(legacy, 'peer-a') as unknown as { fromSeat: unknown }).fromSeat).toEqual({
      row: 3,
      letter: 'C',
    });
  });
});

describe('the other packets', () => {
  it('caps how long an alert may claim to last', () => {
    const now = 10_000;
    const alert = readPresenceAlert(
      { id: 'a', fromId: 'p', label: '14A', status: 'standing', active: true, startedAt: now, expiresAt: now * 1e6 },
      'p',
      now,
    );
    expect(alert?.expiresAt).toBe(now + MAX_ALERT_LIFETIME_MS);
    expect(readPresenceAlert({ id: 'a', fromId: 'p', status: 'standing', active: true }, 'p')).toBeNull(); // no times
  });

  it('reads the alert of the first builds, which were a bathroom break with no cancel', () => {
    const alert = readPresenceAlert(
      { id: 'a', fromId: 'p', seat: { row: 3, letter: 'C' }, status: 'bathroom', startedAt: 1, expiresAt: 2 },
      'p',
      1,
    );
    expect(alert?.status).toBe('standing');
    expect(alert?.active).toBe(true);
  });

  it('accepts only the reactions the app can draw', () => {
    const reaction = { id: 'r', alertId: 'a', fromId: 'p', fromLabel: '1A', kind: 'heart', sentAt: 1 };
    expect(readReaction(reaction, 'p')).not.toBeNull();
    expect(readReaction({ ...reaction, kind: 'poop' }, 'p')).toBeNull();
  });

  it('counts a read receipt only when it is about our own messages', () => {
    expect(readReceipt({ fromId: 'p', toId: 'me', upTo: 5 }, 'p', 'me')).toEqual({ fromId: 'p', toId: 'me', upTo: 5 });
    expect(readReceipt({ fromId: 'p', toId: 'someone-else', upTo: 5 }, 'p', 'me')).toBeNull();
  });

  it('refuses a photo too big to be anyone’s profile picture', () => {
    expect(readAvatar({ fromId: 'p', imageBase64: 'x'.repeat(100_000), sentAt: 1 }, 'p')).toBeNull();
    expect(readAvatar({ fromId: 'p', imageBase64: 'AAAA', sentAt: 1 }, 'p')).toEqual({ fromId: 'p', imageBase64: 'AAAA', sentAt: 1 });
  });
});

describe('MeshService at the boundary', () => {
  class OneWayTransport implements BleTransport {
    private listener: ((raw: string, from: string) => void) | null = null;
    async start() {}
    async stop() {}
    onPeerSeen() {
      return () => {};
    }
    onPeerLost() {
      return () => {};
    }
    onEnvelope(listener: (raw: string, from: string) => void) {
      this.listener = listener;
      return () => {};
    }
    async sendToPeer() {
      return true;
    }
    async broadcast() {}
    receive(envelope: MeshEnvelope) {
      this.listener?.(encodeEnvelope(envelope), 'neighbour');
    }
  }

  it('drops a private message that was flooded to everyone rather than sent to us', () => {
    const transport = new OneWayTransport();
    const service = new MeshService(transport, 'me');
    const heard: string[] = [];
    service.on('message', (m) => heard.push(m.id));

    const privateMessage = { ...message, id: 'p1', scope: 'private' as const, toId: 'me' };
    transport.receive({ id: 'e1', kind: 'chat', fromId: 'peer-a', toId: BROADCAST_ID, ttl: 6, payload: privateMessage });
    transport.receive({ id: 'e2', kind: 'chat', fromId: 'peer-a', toId: 'me', ttl: 6, payload: privateMessage });
    expect(heard).toEqual(['p1']);
  });

  it('drops a malformed message instead of handing it to the chat', () => {
    const transport = new OneWayTransport();
    const service = new MeshService(transport, 'me');
    const heard: unknown[] = [];
    service.on('message', (m) => heard.push(m));
    transport.receive({ id: 'e1', kind: 'chat', fromId: 'peer-a', toId: BROADCAST_ID, ttl: 6, payload: { body: {} } });
    expect(heard).toHaveLength(0);
  });
});

describe('the packed location a packet carries', () => {
  it('is kept when it looks like one, and dropped when it does not', () => {
    expect(readChatMessage({ ...message, fromLoc: 'G00' }, 'peer-a')?.fromLoc).toBe('G00');
    expect(readChatMessage({ ...message, fromLoc: '<script>' }, 'peer-a')?.fromLoc).toBeUndefined();
    const alert = readPresenceAlert(
      { id: 'a', fromId: 'p', label: 'Pecho', loc: 'G00', nickname: 'Ana', status: 'leavingMachine', active: true, startedAt: 1, expiresAt: 2 },
      'p',
      1,
    );
    expect(alert).toMatchObject({ loc: 'G00', nickname: 'Ana' });
  });
});
