import { Buffer } from 'buffer';
import nacl from 'tweetnacl';
import { MeshService } from '../src/mesh/MeshService';
import type { BleTransport } from '../src/mesh/BleTransport';
import { BROADCAST_ID, decodeEnvelope, type MeshEnvelope } from '../src/mesh/protocol';
import {
  createIdentity,
  deserializeIdentity,
  isKeyedId,
  keyedIdOf,
  serializeIdentity,
  toBase64,
  type Identity,
} from '../src/crypto/identity';
import { SecureChannel, signedText } from '../src/crypto/secure';
import type { ChatMessage, Profile, UserLocation } from '../src/types';

/**
 * One shared room: every transport hears everything every other one sends,
 * and the test can listen to - or inject into - the air itself.
 */
class Room {
  transports: RoomTransport[] = [];
  air: string[] = [];

  join(name: string) {
    const transport = new RoomTransport(this, name);
    this.transports.push(transport);
    return transport;
  }

  carry(raw: string, from: RoomTransport) {
    this.air.push(raw);
    this.transports.filter((t) => t !== from).forEach((t) => t.hear(raw, from.name));
  }

  /** What an impostor with a modified app, or a radio of their own, can put on the air. */
  inject(envelope: Partial<MeshEnvelope> & Record<string, unknown>) {
    const raw = JSON.stringify({ ttl: 6, ...envelope });
    this.transports.forEach((t) => t.hear(raw, 'impostor'));
  }
}

class RoomTransport implements BleTransport {
  private listeners = new Set<(raw: string, from: string) => void>();
  constructor(private room: Room, readonly name: string) {}
  async start() {}
  async stop() {}
  onPeerSeen() {
    return () => {};
  }
  onPeerLost() {
    return () => {};
  }
  onEnvelope(listener: (raw: string, from: string) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  async sendToPeer(_peerId: string, raw: string) {
    this.room.carry(raw, this);
    return true;
  }
  async broadcast(raw: string) {
    this.room.carry(raw, this);
  }
  hear(raw: string, from: string) {
    this.listeners.forEach((listener) => listener(raw, from));
  }
}

const LOCATION: UserLocation = { kind: 'plane', seat: { row: 14, letter: 'A' } };

function phone(room: Room, nickname: string, identity: Identity | null = createIdentity()) {
  const id = identity?.id ?? `legacy-${nickname}`;
  const service = new MeshService(room.join(nickname), id, identity ?? undefined);
  const profile: Profile = { id, nickname, location: LOCATION };
  const heard: ChatMessage[] = [];
  service.on('message', (received) => heard.push(received));
  return { id, service, profile, heard };
}

function message(from: { id: string; profile: Profile }, overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: `m-${Math.random()}`,
    scope: 'group',
    fromId: from.id,
    fromLabel: '14A',
    fromNickname: from.profile.nickname,
    body: 'hola',
    sentAt: 1_000,
    ...overrides,
  };
}

describe('identity', () => {
  it('makes an id from the signing key, marked as keyed', () => {
    const identity = createIdentity();
    expect(identity.id).toBe(keyedIdOf(identity.signPublicKey));
    expect(isKeyedId(identity.id)).toBe(true);
    // Every id earlier builds made is a random v4 UUID, never mistaken for one.
    expect(isKeyedId('3f2b8c1e-4d5a-4f6b-9c7d-8e9f0a1b2c3d')).toBe(false);
  });

  it('survives being stored and read back, and refuses what is not one', () => {
    const identity = createIdentity();
    const restored = deserializeIdentity(serializeIdentity(identity));
    expect(restored?.id).toBe(identity.id);
    expect(toBase64(restored!.boxPublicKey)).toBe(toBase64(identity.boxPublicKey));
    expect(deserializeIdentity('{"signSecretKey":"AAAA","boxSecretKey":"AAAA"}')).toBeNull();
    expect(deserializeIdentity('nonsense')).toBeNull();
  });
});

describe('signed mesh', () => {
  it('delivers a signed group message to everyone', async () => {
    const room = new Room();
    const ana = phone(room, 'Ana');
    const leo = phone(room, 'Leo');

    await ana.service.broadcastProfile(ana.profile);
    await ana.service.sendGroupMessage(message(ana));
    expect(leo.heard.map((m) => m.body)).toEqual(['hola']);
  });

  it('holds a message that arrives before its sender’s keys, and delivers it when they come', async () => {
    const room = new Room();
    const ana = phone(room, 'Ana');
    const leo = phone(room, 'Leo');

    await ana.service.sendGroupMessage(message(ana));
    expect(leo.heard).toHaveLength(0);
    await ana.service.broadcastProfile(ana.profile);
    expect(leo.heard.map((m) => m.body)).toEqual(['hola']);
  });

  it('refuses an unsigned message that claims a keyed id', async () => {
    const room = new Room();
    const ana = phone(room, 'Ana');
    const leo = phone(room, 'Leo');
    await ana.service.broadcastProfile(ana.profile);

    room.inject({ id: 'e1', kind: 'chat', fromId: ana.id, toId: BROADCAST_ID, payload: message(ana, { body: 'soy Ana, de verdad' }) });
    expect(leo.heard).toHaveLength(0);
  });

  it('refuses a message signed by anyone but the owner of the id', async () => {
    const room = new Room();
    const ana = phone(room, 'Ana');
    const leo = phone(room, 'Leo');
    const impostor = createIdentity();
    await ana.service.broadcastProfile(ana.profile);

    const envelope = { kind: 'chat' as const, fromId: ana.id, toId: BROADCAST_ID, payload: message(ana, { body: 'fake' }) };
    const sig = toBase64(nacl.sign.detached(Buffer.from(signedText(envelope)), impostor.signSecretKey));
    room.inject({ id: 'e1', ...envelope, sig });
    expect(leo.heard).toHaveLength(0);
  });

  it('refuses a profile announcing someone else’s id with the impostor’s own keys', async () => {
    const room = new Room();
    const ana = phone(room, 'Ana');
    const leo = phone(room, 'Leo');
    const impostor = new SecureChannel(createIdentity());
    const profiles: string[] = [];
    leo.service.on('profile', (_id, packet) => profiles.push(packet.nickname));

    // A genuine, correctly signed announcement - of a different id than the
    // one it claims.
    const payload = {
      id: ana.id,
      nickname: 'Ana',
      location: LOCATION,
      keys: { sign: toBase64(impostor.identity.signPublicKey), box: toBase64(impostor.identity.boxPublicKey) },
    };
    const envelope = { kind: 'profile' as const, fromId: ana.id, toId: BROADCAST_ID, payload };
    room.inject({ id: 'e1', ...envelope, sig: impostor.sign(envelope) });
    expect(profiles).toHaveLength(0);
  });

  it('refuses a message altered on the way', async () => {
    const room = new Room();
    const ana = phone(room, 'Ana');
    const leo = phone(room, 'Leo');
    await ana.service.broadcastProfile(ana.profile);
    await ana.service.sendGroupMessage(message(ana, { body: 'nos vemos en la puerta 3' }));

    const sent = decodeEnvelope(room.air[room.air.length - 1])!;
    const altered = { ...sent, id: 'relayed', payload: { ...(sent.payload as ChatMessage), id: 'm-new', body: 'nos vemos en la puerta 9' } };
    room.inject(altered);
    expect(leo.heard.map((m) => m.body)).toEqual(['nos vemos en la puerta 3']);
  });
});

describe('private messages', () => {
  it('are sealed: the phones that carry them cannot read them, the recipient can', async () => {
    const room = new Room();
    const ana = phone(room, 'Ana');
    const leo = phone(room, 'Leo');
    const bystander = phone(room, 'Mia');
    await ana.service.broadcastProfile(ana.profile);
    await leo.service.broadcastProfile(leo.profile);
    expect(ana.service.isSecureWith(leo.id)).toBe(true);

    await ana.service.sendPrivateMessage(
      message(ana, { scope: 'private', toId: leo.id, body: 'mi número es 600 111 222', imageBase64: 'U0VDUkVUUEhPVE8=' }),
    );

    expect(leo.heard.map((m) => [m.body, m.imageBase64])).toEqual([['mi número es 600 111 222', 'U0VDUkVUUEhPVE8=']]);
    expect(bystander.heard).toHaveLength(0);
    const onTheAir = room.air.join('\n');
    expect(onTheAir).not.toContain('600 111 222');
    expect(onTheAir).not.toContain('U0VDUkVUUEhPVE8=');
  });

  it('go in the clear, as before, to someone on a build without keys - and still arrive', async () => {
    const room = new Room();
    const ana = phone(room, 'Ana');
    const old = phone(room, 'Old', null);
    await old.service.broadcastProfile(old.profile);
    expect(ana.service.isSecureWith(old.id)).toBe(false);

    await ana.service.broadcastProfile(ana.profile);
    await ana.service.sendPrivateMessage(message(ana, { scope: 'private', toId: old.id, body: 'hola' }));
    expect(old.heard.map((m) => m.body)).toEqual(['hola']);

    // And the other way round: an old build is heard exactly as it always was.
    await old.service.sendPrivateMessage(message(old, { scope: 'private', toId: ana.id, body: 'qué tal' }));
    expect(ana.heard.map((m) => m.body)).toEqual(['qué tal']);
  });

  it('cannot be opened by anyone but the recipient, even with the right id on it', async () => {
    const room = new Room();
    const ana = phone(room, 'Ana');
    const leo = phone(room, 'Leo');
    const mia = phone(room, 'Mia');
    await ana.service.broadcastProfile(ana.profile);
    await leo.service.broadcastProfile(leo.profile);
    await mia.service.broadcastProfile(mia.profile);

    await ana.service.sendPrivateMessage(message(ana, { scope: 'private', toId: leo.id, body: 'secreto' }));
    const sealed = room.air.map((raw) => decodeEnvelope(raw)!).find((e) => e.kind === 'chat')!;
    // Readdressed to Mia: the signature no longer matches, and the box
    // wasn't made for her key anyway.
    room.inject({ ...sealed, id: 'x', toId: mia.id, payload: { ...(sealed.payload as object), toId: mia.id } });
    expect(mia.heard).toHaveLength(0);
  });
});
