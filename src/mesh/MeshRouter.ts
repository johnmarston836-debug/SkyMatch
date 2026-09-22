import type { BleTransport } from './BleTransport';
import {
  decodeEnvelope,
  encodeEnvelope,
  BROADCAST_ID,
  DEFAULT_TTL,
  FLOOD_LIMIT,
  FLOOD_WINDOW_MS,
  SEEN_CACHE_SIZE,
  type MeshEnvelope,
} from './protocol';

/**
 * Flood routing with a bounded "seen" cache: every node that relays a
 * packet decrements its TTL and rebroadcasts to everyone except where it
 * came from, until TTL hits 0 or it reaches a node that has already seen
 * that message id. This trades bandwidth for simplicity and works well at
 * the scale of a single cabin (dozens, not thousands, of nodes).
 */
export class MeshRouter {
  private seen: string[] = [];
  private seenSet = new Set<string>();
  /** When each sender's current allowance started, and how much of it is spent. */
  private rates = new Map<string, { since: number; count: number }>();
  private deliverListeners = new Set<(envelope: MeshEnvelope) => void>();

  constructor(
    private transport: BleTransport,
    private myPeerId: string,
  ) {
    transport.onEnvelope((raw, fromPeerId) => this.handleIncoming(raw, fromPeerId));
  }

  onDeliver(listener: (envelope: MeshEnvelope) => void) {
    this.deliverListeners.add(listener);
    return () => this.deliverListeners.delete(listener);
  }

  /**
   * Sends an envelope. `toId: BROADCAST_ID` floods it to the whole mesh (the
   * group chat, presence alerts); any other `toId` goes direct if that peer
   * is in range, flooded toward them otherwise.
   */
  async send(envelope: Omit<MeshEnvelope, 'ttl'> & { ttl?: number }): Promise<void> {
    const full: MeshEnvelope = { ttl: DEFAULT_TTL, ...envelope };
    this.markSeen(full.id);

    if (full.toId === BROADCAST_ID) {
      await this.transport.broadcast(encodeEnvelope(full));
      return;
    }

    const deliveredDirectly = await this.transport.sendToPeer(full.toId, encodeEnvelope(full));
    if (!deliveredDirectly) {
      await this.transport.broadcast(encodeEnvelope(full));
    }
  }

  private handleIncoming(raw: string, fromPeerId: string) {
    const envelope = decodeEnvelope(raw);
    if (!envelope) return;

    // A packet still carrying its full TTL has not been relayed by anyone,
    // so its sender is the neighbour that just handed it to us: the one
    // moment where the Bluetooth connection and a profile id can be tied
    // together. (A relayed packet names its original author, not the
    // neighbour, which is why the TTL check matters.)
    if (envelope.ttl === DEFAULT_TTL) this.transport.notePeerIdentity?.(fromPeerId, envelope.fromId);

    // Duplicates go before the flood check, not after. In a full room the
    // same packet reaches us once through every neighbour that relays it,
    // and counting each copy against its author used to silence ordinary
    // people: ten neighbours, one profile beat and two messages were enough
    // to drop everything else they said for the rest of the window.
    if (this.seenSet.has(envelope.id)) return;
    this.markSeen(envelope.id);
    if (this.floods(envelope.fromId)) return;

    if (envelope.toId === BROADCAST_ID) {
      this.deliverListeners.forEach((listener) => listener(envelope));
      if (envelope.ttl > 1) {
        void this.transport.broadcast(encodeEnvelope({ ...envelope, ttl: envelope.ttl - 1 }), fromPeerId);
      }
      return;
    }

    if (envelope.toId === this.myPeerId) {
      this.deliverListeners.forEach((listener) => listener(envelope));
      return;
    }

    // Not for us: relay onward if it still has hops left.
    if (envelope.ttl <= 1) return;
    const relayed: MeshEnvelope = { ...envelope, ttl: envelope.ttl - 1 };
    void this.transport.sendToPeer(relayed.toId, encodeEnvelope(relayed)).then((delivered) => {
      if (!delivered) void this.transport.broadcast(encodeEnvelope(relayed), fromPeerId);
    });
  }

  /**
   * True once a sender is past its allowance for the current window.
   *
   * Dropped here, before delivering *and* before relaying: a phone that
   * floods is not just noise on this screen, it is noise this phone would
   * otherwise repeat to everyone else in the room.
   */
  private floods(fromId: string): boolean {
    const now = Date.now();
    const rate = this.rates.get(fromId);

    if (!rate || now - rate.since > FLOOD_WINDOW_MS) {
      this.rates.set(fromId, { since: now, count: 1 });
      return false;
    }

    rate.count += 1;
    return rate.count > FLOOD_LIMIT;
  }

  private markSeen(id: string) {
    if (this.seenSet.has(id)) return;
    this.seenSet.add(id);
    this.seen.push(id);
    if (this.seen.length > SEEN_CACHE_SIZE) {
      const evicted = this.seen.shift();
      if (evicted) this.seenSet.delete(evicted);
    }
  }
}
