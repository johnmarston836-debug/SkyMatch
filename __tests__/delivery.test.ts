import { DELIVERY_ATTEMPTS, DELIVERY_WAIT_MS, DeliveryTracker } from '../src/mesh/delivery';
import { MeshService } from '../src/mesh/MeshService';
import type { BleTransport } from '../src/mesh/BleTransport';
import { createIdentity } from '../src/crypto/identity';
import { readChatMessage } from '../src/mesh/validate';
import type { ChatMessage, DeliveryReceipt, Profile } from '../src/types';

/** Lets the promise chains inside the tracker run between timer steps. */
async function flush() {
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

describe('DeliveryTracker', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function tracker() {
    const resent: string[] = [];
    const gaveUp: string[] = [];
    const t = new DeliveryTracker(
      async (id) => {
        resent.push(id);
      },
      (id) => gaveUp.push(id),
    );
    return { t, resent, gaveUp };
  }

  async function wait() {
    jest.advanceTimersByTime(DELIVERY_WAIT_MS);
    await flush();
  }

  it('sends again until confirmed, then stops', async () => {
    const { t, resent, gaveUp } = tracker();
    t.expect('m1', 'leo');
    t.sent('m1');
    await wait();
    expect(resent).toEqual(['m1']);
    t.confirm('m1');
    await wait();
    await wait();
    expect(resent).toEqual(['m1']);
    expect(gaveUp).toEqual([]);
  });

  it('gives up after every attempt goes unanswered', async () => {
    const { t, resent, gaveUp } = tracker();
    t.expect('m1', 'leo');
    t.sent('m1');
    for (let i = 0; i < DELIVERY_ATTEMPTS + 2; i++) await wait();
    expect(resent).toHaveLength(DELIVERY_ATTEMPTS - 1);
    expect(gaveUp).toEqual(['m1']);
    expect(t.isPending('m1')).toBe(false);
  });

  it('tries once more when the person comes back, and only once', async () => {
    const { t, resent, gaveUp } = tracker();
    t.expect('m1', 'leo');
    t.sent('m1');
    for (let i = 0; i < DELIVERY_ATTEMPTS; i++) await wait();
    expect(gaveUp).toEqual(['m1']);
    resent.length = 0;

    t.peerBack('ana'); // someone else: nothing
    await flush();
    expect(resent).toEqual([]);

    t.peerBack('leo');
    await flush();
    expect(resent).toEqual(['m1']);
    for (let i = 0; i < DELIVERY_ATTEMPTS; i++) await wait();
    expect(gaveUp).toEqual(['m1', 'm1']);

    resent.length = 0;
    t.peerBack('leo');
    await flush();
    expect(resent).toEqual([]);
  });

  it('takes a receipt that comes back before the send has finished', async () => {
    const { t, resent, gaveUp } = tracker();
    t.expect('m1', 'leo');
    t.confirm('m1');
    t.sent('m1');
    for (let i = 0; i < DELIVERY_ATTEMPTS + 1; i++) await wait();
    expect(resent).toEqual([]);
    expect(gaveUp).toEqual([]);
  });

  it('starts a full new round when retried by hand', async () => {
    const { t, resent } = tracker();
    t.expect('m1', 'leo');
    t.sent('m1');
    for (let i = 0; i < DELIVERY_ATTEMPTS; i++) await wait();
    resent.length = 0;
    t.retry('m1', 'leo');
    await flush();
    for (let i = 0; i < DELIVERY_ATTEMPTS + 1; i++) await wait();
    expect(resent).toHaveLength(DELIVERY_ATTEMPTS);
  });
});

/** Two phones that hear each other, with the air recorded and a switch to make it drop everything. */
class Air {
  deaf = false;
  sent: string[] = [];
  ends: Radio[] = [];
  carry(raw: string, from: Radio) {
    this.sent.push(raw);
    if (this.deaf) return;
    this.ends.filter((end) => end !== from).forEach((end) => end.hear(raw));
  }
}

class Radio implements BleTransport {
  private listeners = new Set<(raw: string, from: string) => void>();
  constructor(private air: Air) {
    air.ends.push(this);
  }
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
    this.air.carry(raw, this);
    return true;
  }
  async broadcast(raw: string) {
    this.air.carry(raw, this);
  }
  hear(raw: string) {
    this.listeners.forEach((listener) => listener(raw, 'neighbour'));
  }
}

function phone(air: Air, nickname: string) {
  const identity = createIdentity();
  const service = new MeshService(new Radio(air), identity.id, identity);
  const profile: Profile = { id: identity.id, nickname, location: { kind: 'plane', seat: { row: 3, letter: 'C' } } };
  const heard: ChatMessage[] = [];
  const delivered: DeliveryReceipt[] = [];
  service.on('message', (m) => heard.push(m));
  service.on('delivered', (r) => delivered.push(r));
  return { id: identity.id, service, profile, heard, delivered };
}

function privateMessage(from: { id: string; profile: Profile }, toId: string): ChatMessage {
  return {
    id: 'msg-1',
    scope: 'private',
    fromId: from.id,
    toId,
    fromLabel: '3C',
    fromNickname: from.profile.nickname,
    body: 'foto',
    imageBase64: 'AAAA',
    sentAt: 1_000,
  };
}

describe('delivery receipts on the mesh', () => {
  it('announces that it answers, and answers every copy of a private message', async () => {
    const air = new Air();
    const ana = phone(air, 'Ana');
    const leo = phone(air, 'Leo');
    await ana.service.broadcastProfile(ana.profile);
    await leo.service.broadcastProfile(leo.profile);
    expect(ana.service.acksFrom(leo.id)).toBe(true);

    const message = privateMessage(ana, leo.id);
    await ana.service.sendPrivateMessage(message);
    expect(leo.heard.map((m) => m.id)).toEqual(['msg-1']);
    expect(ana.delivered).toEqual([{ fromId: leo.id, toId: ana.id, messageId: 'msg-1' }]);

    // A retry gets through the duplicate filter and is answered again; the
    // app files it once by its message id.
    await ana.service.sendPrivateMessage(message, true);
    expect(leo.heard.map((m) => m.id)).toEqual(['msg-1', 'msg-1']);
    expect(ana.delivered).toHaveLength(2);
  });

  it('never sends the local "undelivered" mark, nor accepts one from outside', async () => {
    const air = new Air();
    const ana = phone(air, 'Ana');
    const leo = phone(air, 'Leo');
    await ana.service.broadcastProfile(ana.profile);
    await leo.service.broadcastProfile(leo.profile);

    await ana.service.sendPrivateMessage({ ...privateMessage(ana, leo.id), undelivered: true }, true);
    expect(leo.heard[0].undelivered).toBeUndefined();
    expect(readChatMessage({ ...privateMessage(ana, leo.id), undelivered: true }, ana.id)?.undelivered).toBeUndefined();
  });

  it('gets no receipt when the air drops the message', async () => {
    const air = new Air();
    const ana = phone(air, 'Ana');
    const leo = phone(air, 'Leo');
    await ana.service.broadcastProfile(ana.profile);
    await leo.service.broadcastProfile(leo.profile);

    air.deaf = true;
    await ana.service.sendPrivateMessage(privateMessage(ana, leo.id));
    expect(ana.delivered).toEqual([]);
    air.deaf = false;
    await ana.service.sendPrivateMessage(privateMessage(ana, leo.id), true);
    expect(ana.delivered).toHaveLength(1);
  });
});
