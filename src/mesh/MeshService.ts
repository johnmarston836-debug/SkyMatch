import type { BleTransport } from './BleTransport';
import { MeshRouter } from './MeshRouter';
import type { MeshEnvelope } from './protocol';
import type { ChatMessage, Profile, Seat, SwipeAction, SwipeDirection } from '../types';
import { newId } from '../utils/id';

type Listeners = {
  peerSeen: (peerId: string, seat: Seat | null) => void;
  peerLost: (peerId: string) => void;
  profile: (peerId: string, profile: Profile) => void;
  swipe: (action: SwipeAction) => void;
  chat: (message: ChatMessage) => void;
};

/**
 * The single entry point the app's UI/state layer talks to. Wires the
 * transport (real or mock) to the router and turns raw mesh envelopes into
 * typed app events.
 */
export class MeshService {
  private router: MeshRouter;
  private listeners: { [K in keyof Listeners]: Set<Listeners[K]> } = {
    peerSeen: new Set(),
    peerLost: new Set(),
    profile: new Set(),
    swipe: new Set(),
    chat: new Set(),
  };

  constructor(
    private transport: BleTransport,
    private myPeerId: string,
  ) {
    this.router = new MeshRouter(transport, myPeerId);
    this.router.onDeliver((envelope) => this.handleEnvelope(envelope));
    transport.onPeerSeen((peerId, _rssi, seat) => this.emit('peerSeen', peerId, seat));
    transport.onPeerLost((peerId) => this.emit('peerLost', peerId));
  }

  async start(seat: Seat | null) {
    await this.transport.start(this.myPeerId, seat);
  }

  async stop() {
    await this.transport.stop();
  }

  on<K extends keyof Listeners>(event: K, listener: Listeners[K]): () => void {
    this.listeners[event].add(listener as never);
    return () => this.listeners[event].delete(listener as never);
  }

  async sendProfile(toId: string, profile: Profile) {
    await this.router.send({ id: newId(), kind: 'profile', fromId: this.myPeerId, toId, payload: profile });
  }

  async sendSwipe(toId: string, direction: SwipeDirection) {
    const action: SwipeAction = { fromId: this.myPeerId, toId, direction, timestamp: Date.now() };
    await this.router.send({ id: newId(), kind: 'swipe', fromId: this.myPeerId, toId, payload: action });
  }

  async sendChatMessage(message: ChatMessage) {
    await this.router.send({
      id: message.id,
      kind: 'chat',
      fromId: this.myPeerId,
      toId: message.toId,
      payload: message,
    });
  }

  private emit<K extends keyof Listeners>(event: K, ...args: Parameters<Listeners[K]>) {
    this.listeners[event].forEach((listener) => (listener as (...a: Parameters<Listeners[K]>) => void)(...args));
  }

  private handleEnvelope(envelope: MeshEnvelope) {
    switch (envelope.kind) {
      case 'profile':
        this.emit('profile', envelope.fromId, envelope.payload as Profile);
        break;
      case 'swipe':
        this.emit('swipe', envelope.payload as SwipeAction);
        break;
      case 'chat':
        this.emit('chat', envelope.payload as ChatMessage);
        break;
      default:
        break;
    }
  }
}
