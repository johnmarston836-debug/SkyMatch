import type { Seat } from '../types';
import type { BleTransport } from './BleTransport';
import { BROADCAST_ID } from './protocol';

interface SimulatedPeer {
  peerId: string;
  seat: Seat;
  nickname: string;
  contact?: string;
  rssi: number;
}

const SIMULATED_PEERS: SimulatedPeer[] = [
  { peerId: 'sim-mia', seat: { row: 14, letter: 'A' }, nickname: 'Mia', contact: '@mia.viaja', rssi: -52 },
  { peerId: 'sim-leo', seat: { row: 14, letter: 'C' }, nickname: 'Leo', rssi: -61 },
  { peerId: 'sim-noa', seat: { row: 16, letter: 'F' }, nickname: 'Noa', rssi: -70 },
  { peerId: 'sim-max', seat: { row: 9, letter: 'D' }, nickname: 'Max', contact: '+34 600 111 222', rssi: -58 },
];

const GROUP_LINES = ['¿Alguien sabe si hay wifi en este vuelo?', 'Menuda turbulencia hace un rato', '¿A qué hora aterrizamos?'];

/**
 * Deterministic in-memory simulation so the cabin group chat, private
 * messages and presence alerts can be built and demoed without two physical
 * phones. Simulated peers announce themselves, drop a line or two in the
 * group chat, and echo back private messages sent to them.
 */
export class MockBleTransport implements BleTransport {
  private peerSeenListeners = new Set<(peerId: string, rssi: number, seat: Seat | null) => void>();
  private envelopeListeners = new Set<(raw: string, fromPeerId: string) => void>();
  private timers: ReturnType<typeof setInterval>[] = [];
  private myPeerId = '';

  async start(myPeerId: string): Promise<void> {
    this.myPeerId = myPeerId;
    SIMULATED_PEERS.forEach((peer, index) => {
      const seenDelay = 800 + index * 650;
      this.timers.push(
        setTimeout(() => {
          this.peerSeenListeners.forEach((listener) => listener(peer.peerId, peer.rssi, peer.seat));
          this.deliver(
            this.makeEnvelope('profile', peer, { id: peer.peerId, seat: peer.seat, nickname: peer.nickname, contact: peer.contact }),
          );
        }, seenDelay) as unknown as ReturnType<typeof setInterval>,
      );

      const chatDelay = 4000 + index * 3000;
      if (index < GROUP_LINES.length) {
        this.timers.push(
          setTimeout(() => {
            this.deliver(
              this.makeEnvelope('chat', peer, {
                id: `${peer.peerId}-group-${Date.now()}`,
                scope: 'group',
                fromId: peer.peerId,
                fromSeat: peer.seat,
                fromNickname: peer.nickname,
                body: GROUP_LINES[index],
                sentAt: Date.now(),
              }),
            );
          }, chatDelay) as unknown as ReturnType<typeof setInterval>,
        );
      }
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
    const peer = SIMULATED_PEERS.find((candidate) => candidate.peerId === peerId);
    if (!peer) return false;
    setTimeout(() => this.autoReply(peer, raw), 600 + Math.random() * 900);
    return true;
  }

  async broadcast(raw: string, excludePeerId?: string): Promise<void> {
    SIMULATED_PEERS.filter((peer) => peer.peerId !== excludePeerId).forEach((peer) => {
      setTimeout(() => this.autoReply(peer, raw), 600 + Math.random() * 900);
    });
  }

  private autoReply(peer: SimulatedPeer, raw: string) {
    try {
      const envelope = JSON.parse(raw);
      if (envelope.kind !== 'chat' || envelope.payload?.scope !== 'private') return;

      this.deliver(
        this.makeEnvelope(
          'chat',
          peer,
          {
            id: `${peer.peerId}-reply-${Date.now()}`,
            scope: 'private',
            fromId: peer.peerId,
            fromSeat: peer.seat,
            fromNickname: peer.nickname,
            toId: this.myPeerId,
            body: '¡Hola! (respuesta simulada)',
            sentAt: Date.now(),
          },
          this.myPeerId,
        ),
      );
    } catch {
      // ignore malformed mock traffic
    }
  }

  private makeEnvelope(kind: 'profile' | 'chat' | 'presence', peer: SimulatedPeer, payload: unknown, toId: string = BROADCAST_ID) {
    return {
      id: `${peer.peerId}-${kind}-${Date.now()}-${Math.random()}`,
      kind,
      fromId: peer.peerId,
      toId,
      ttl: 1,
      payload,
    };
  }

  private deliver(envelope: object) {
    const raw = JSON.stringify(envelope);
    this.envelopeListeners.forEach((listener) => listener(raw, (envelope as { fromId: string }).fromId));
  }
}
