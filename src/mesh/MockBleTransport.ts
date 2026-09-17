import type { Seat } from '../types';
import type { BleTransport } from './BleTransport';

interface SimulatedPeer {
  peerId: string;
  seat: Seat;
  rssi: number;
}

const SIMULATED_PEERS: SimulatedPeer[] = [
  { peerId: 'sim-mia', seat: { row: 14, letter: 'A' }, rssi: -52 },
  { peerId: 'sim-leo', seat: { row: 14, letter: 'C' }, rssi: -61 },
  { peerId: 'sim-noa', seat: { row: 16, letter: 'F' }, rssi: -70 },
  { peerId: 'sim-max', seat: { row: 9, letter: 'D' }, rssi: -58 },
];

/**
 * Deterministic in-memory simulation so the swipe deck, matching and chat
 * flows can be built and demoed without two physical phones. Every
 * "simulated peer" also echoes back a like once yours is sent, so a match
 * always triggers a few seconds later - useful for demoing the match/chat
 * screens end to end.
 */
export class MockBleTransport implements BleTransport {
  private peerSeenListeners = new Set<(peerId: string, rssi: number, seat: Seat | null) => void>();
  private envelopeListeners = new Set<(raw: string, fromPeerId: string) => void>();
  private timers: ReturnType<typeof setInterval>[] = [];
  private myPeerId = '';

  async start(myPeerId: string): Promise<void> {
    this.myPeerId = myPeerId;
    SIMULATED_PEERS.forEach((peer, index) => {
      const delay = 800 + index * 650;
      const timer = setTimeout(() => {
        this.peerSeenListeners.forEach((listener) => listener(peer.peerId, peer.rssi, peer.seat));
      }, delay);
      this.timers.push(timer as unknown as ReturnType<typeof setInterval>);
    });
  }

  async stop(): Promise<void> {
    this.timers.forEach(clearTimeout as unknown as (t: ReturnType<typeof setInterval>) => void);
    this.timers = [];
    this.peerSeenListeners.clear();
    this.envelopeListeners.clear();
  }

  onPeerSeen(listener: (peerId: string, rssi: number, seat: Seat | null) => void) {
    this.peerSeenListeners.add(listener);
    return () => this.peerSeenListeners.delete(listener);
  }

  onPeerLost() {
    return () => {};
  }

  onEnvelope(listener: (raw: string, fromPeerId: string) => void) {
    this.envelopeListeners.add(listener);
    return () => this.envelopeListeners.delete(listener);
  }

  async sendToPeer(peerId: string, raw: string): Promise<boolean> {
    const isSimulated = SIMULATED_PEERS.some((peer) => peer.peerId === peerId);
    if (!isSimulated) return false;

    // Echo the packet straight back so the sender can observe delivery in
    // the mock, and auto-reply with a like/message so demo flows complete.
    setTimeout(() => this.autoReply(peerId, raw), 600 + Math.random() * 900);
    return true;
  }

  async broadcast(raw: string, excludePeerId?: string): Promise<void> {
    SIMULATED_PEERS.filter((peer) => peer.peerId !== excludePeerId).forEach((peer) => {
      setTimeout(() => this.autoReply(peer.peerId, raw), 600 + Math.random() * 900);
    });
  }

  private autoReply(peerId: string, raw: string) {
    try {
      const envelope = JSON.parse(raw);
      if (envelope.kind === 'swipe' && envelope.payload?.direction === 'like') {
        this.envelopeListeners.forEach((listener) =>
          listener(
            JSON.stringify({
              id: `${peerId}-like-${Date.now()}`,
              kind: 'swipe',
              fromId: peerId,
              toId: this.myPeerId,
              ttl: 1,
              payload: { fromId: peerId, toId: this.myPeerId, direction: 'like', timestamp: Date.now() },
            }),
            peerId,
          ),
        );
      }
      if (envelope.kind === 'chat') {
        this.envelopeListeners.forEach((listener) =>
          listener(
            JSON.stringify({
              id: `${peerId}-msg-${Date.now()}`,
              kind: 'chat',
              fromId: peerId,
              toId: this.myPeerId,
              ttl: 1,
              payload: {
                id: `${peerId}-${Date.now()}`,
                matchId: envelope.payload.matchId,
                fromId: peerId,
                toId: this.myPeerId,
                body: '¡Hola! 👋 (respuesta simulada)',
                sentAt: Date.now(),
              },
            }),
            peerId,
          ),
        );
      }
    } catch {
      // ignore malformed mock traffic
    }
  }
}
