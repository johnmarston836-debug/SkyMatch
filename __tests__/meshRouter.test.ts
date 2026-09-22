import { MeshRouter } from '../src/mesh/MeshRouter';
import type { BleTransport } from '../src/mesh/BleTransport';
import {
  BROADCAST_ID,
  DEFAULT_TTL,
  FLOOD_LIMIT,
  MAX_FRAMES_PER_SEND,
  decodeEnvelope,
  decodeFrame,
  encodeEnvelope,
  encodeFrame,
  type MeshEnvelope,
} from '../src/mesh/protocol';

/** A transport that only records: the tests hand it packets as if from neighbours. */
class RecordingTransport implements BleTransport {
  sent: string[] = [];
  private listener: ((raw: string, fromPeerId: string) => void) | null = null;

  async start(): Promise<void> {}
  async stop(): Promise<void> {}
  onPeerSeen() {
    return () => {};
  }
  onPeerLost() {
    return () => {};
  }
  onEnvelope(listener: (raw: string, fromPeerId: string) => void) {
    this.listener = listener;
    return () => {};
  }
  async sendToPeer(): Promise<boolean> {
    return false;
  }
  async broadcast(raw: string): Promise<void> {
    this.sent.push(raw);
  }

  receive(envelope: Partial<MeshEnvelope>, fromNeighbour: string) {
    this.listener?.(JSON.stringify(envelope), fromNeighbour);
  }
}

function envelope(id: string, fromId = 'peer-x', ttl = DEFAULT_TTL): MeshEnvelope {
  return { id, kind: 'chat', fromId, toId: BROADCAST_ID, ttl, payload: {} };
}

describe('MeshRouter in a full room', () => {
  it('counts each packet once against its author, however many neighbours relay it', () => {
    const transport = new RecordingTransport();
    const router = new MeshRouter(transport, 'me');
    const delivered: string[] = [];
    router.onDeliver((e) => delivered.push(e.id));

    // Twenty neighbours all relay each of three messages from the same
    // person: sixty copies, three packets. It used to count sixty, and
    // silence them after the first.
    for (const id of ['m1', 'm2', 'm3']) {
      for (let neighbour = 0; neighbour < 20; neighbour++) {
        transport.receive(envelope(id, 'peer-x', DEFAULT_TTL - 1), `n${neighbour}`);
      }
    }
    expect(delivered).toEqual(['m1', 'm2', 'm3']);
  });

  it('still cuts off a sender of genuinely new packets past the allowance', () => {
    const transport = new RecordingTransport();
    const router = new MeshRouter(transport, 'me');
    const delivered: string[] = [];
    router.onDeliver((e) => delivered.push(e.id));

    for (let i = 0; i < FLOOD_LIMIT + 5; i++) transport.receive(envelope(`m${i}`), 'n1');
    expect(delivered).toHaveLength(FLOOD_LIMIT);
  });

  it('relays with one hop less, and never beyond the default TTL', () => {
    const transport = new RecordingTransport();
    new MeshRouter(transport, 'me');

    transport.receive({ ...envelope('m1'), ttl: 1_000_000 }, 'n1');
    expect(transport.sent).toHaveLength(1);
    expect(JSON.parse(transport.sent[0]).ttl).toBe(DEFAULT_TTL - 1);
  });

  it('does not relay a packet on its last hop', () => {
    const transport = new RecordingTransport();
    new MeshRouter(transport, 'me');
    transport.receive(envelope('m1', 'peer-x', 1), 'n1');
    expect(transport.sent).toHaveLength(0);
  });
});

describe('decoding what comes off the radio', () => {
  it('refuses envelopes missing what the router needs', () => {
    expect(decodeEnvelope('not json')).toBeNull();
    expect(decodeEnvelope(JSON.stringify({ id: 'a', fromId: 'b' }))).toBeNull();
    expect(decodeEnvelope(JSON.stringify({ id: '', fromId: 'b', toId: '*', kind: 'chat', ttl: 3 }))).toBeNull();
    expect(decodeEnvelope(encodeEnvelope(envelope('ok')))).not.toBeNull();
  });

  it('treats a missing or nonsense TTL as the last hop', () => {
    const decoded = decodeEnvelope(JSON.stringify({ ...envelope('a'), ttl: 'lots' }));
    expect(decoded?.ttl).toBe(0);
  });

  it('refuses frames whose numbers cannot belong to a real send', () => {
    const frame = { id: 'f1', index: 0, total: 2, part: 'ab' };
    expect(decodeFrame(encodeFrame(frame))).toEqual(frame);
    expect(decodeFrame(encodeFrame({ ...frame, total: MAX_FRAMES_PER_SEND + 1 }))).toBeNull();
    expect(decodeFrame(encodeFrame({ ...frame, total: 0 }))).toBeNull();
    expect(decodeFrame(encodeFrame({ ...frame, index: 2 }))).toBeNull();
    expect(decodeFrame(encodeFrame({ ...frame, index: 0.5 }))).toBeNull();
    expect(decodeFrame(JSON.stringify({ id: 'f1', index: 0, total: 1, part: 7 }))).toBeNull();
  });

  it('keeps only sensible chunk numbers in a repair request', () => {
    const decoded = decodeFrame(JSON.stringify({ id: 'f1', index: -1, total: 0, part: '', need: [1, -3, 'x', 2.5, 4] }));
    expect(decoded?.need).toEqual([1, 4]);
  });
});
