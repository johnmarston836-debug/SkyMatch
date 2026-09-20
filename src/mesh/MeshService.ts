import type { BleTransport } from './BleTransport';
import { MeshRouter } from './MeshRouter';
import { BROADCAST_ID, type MeshEnvelope } from './protocol';
import type { AvatarPacket, ChatMessage, PresenceAlert, PresenceReaction, Profile, Seat } from '../types';
import { newId } from '../utils/id';

type Listeners = {
  peerSeen: (peerId: string, seat: Seat | null) => void;
  peerLost: (peerId: string) => void;
  profile: (peerId: string, profile: Profile) => void;
  message: (message: ChatMessage) => void;
  presence: (alert: PresenceAlert) => void;
  reaction: (reaction: PresenceReaction) => void;
  avatar: (avatar: AvatarPacket) => void;
};

/**
 * The single entry point the app's UI/state layer talks to. Wires the
 * transport (real or mock) to the router and turns raw mesh envelopes into
 * typed app events.
 *
 * Everything here is broadcast-or-direct, never "upload to a server": the
 * group chat and presence alerts flood the whole mesh (`BROADCAST_ID`);
 * private messages go straight to one peer id, relayed hop-by-hop if
 * they're not directly in range. Private messages are the only ones that
 * may carry an image - see `sendPrivateMessage` for why the group chat
 * never does.
 */
export class MeshService {
  private router: MeshRouter;
  private listeners: { [K in keyof Listeners]: Set<Listeners[K]> } = {
    peerSeen: new Set(),
    peerLost: new Set(),
    profile: new Set(),
    message: new Set(),
    presence: new Set(),
    reaction: new Set(),
    avatar: new Set(),
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

  /** Broadcasts the lightweight {id, seat, nickname} profile so peers can label messages from us. */
  async broadcastProfile(profile: Profile) {
    await this.router.send({ id: newId(), kind: 'profile', fromId: this.myPeerId, toId: BROADCAST_ID, payload: profile });
  }

  async sendGroupMessage(message: ChatMessage) {
    await this.router.send({ id: message.id, kind: 'chat', fromId: this.myPeerId, toId: BROADCAST_ID, payload: message });
  }

  /**
   * Sends a 1:1 message, optionally carrying a small base64 image. Never do
   * this for the group chat: a broadcast image gets re-sent by every relay
   * hop to every other node, which floods the whole cabin's Bluetooth
   * bandwidth for one photo. A private image only costs the direct
   * connection (or the handful of hops) between the two people involved.
   */
  async sendPrivateMessage(message: ChatMessage) {
    if (!message.toId) throw new Error('sendPrivateMessage requires message.toId');
    await this.router.send({ id: message.id, kind: 'chat', fromId: this.myPeerId, toId: message.toId, payload: message });
  }

  /**
   * The envelope gets its own fresh id rather than reusing the alert's: an
   * alert and the "I'm back" that cancels it deliberately share an id, so
   * reusing it would make every other phone's dedup cache discard the
   * cancellation as a message it had already seen, and the banner would
   * never clear anywhere but here.
   */
  async sendPresenceAlert(alert: PresenceAlert) {
    await this.router.send({ id: newId(), kind: 'presence', fromId: this.myPeerId, toId: BROADCAST_ID, payload: alert });
  }

  /** Photos are broadcast rarely and never on the profile timer: one is worth hundreds of ordinary packets. */
  async sendAvatar(avatar: AvatarPacket) {
    await this.router.send({ id: newId(), kind: 'avatar', fromId: this.myPeerId, toId: BROADCAST_ID, payload: avatar });
  }

  async sendPresenceReaction(reaction: PresenceReaction) {
    await this.router.send({ id: reaction.id, kind: 'reaction', fromId: this.myPeerId, toId: BROADCAST_ID, payload: reaction });
  }

  private emit<K extends keyof Listeners>(event: K, ...args: Parameters<Listeners[K]>) {
    this.listeners[event].forEach((listener) => (listener as (...a: Parameters<Listeners[K]>) => void)(...args));
  }

  private handleEnvelope(envelope: MeshEnvelope) {
    switch (envelope.kind) {
      case 'profile':
        this.emit('profile', envelope.fromId, envelope.payload as Profile);
        break;
      case 'chat':
        this.emit('message', envelope.payload as ChatMessage);
        break;
      case 'presence':
        this.emit('presence', envelope.payload as PresenceAlert);
        break;
      case 'reaction':
        this.emit('reaction', envelope.payload as PresenceReaction);
        break;
      case 'avatar':
        this.emit('avatar', envelope.payload as AvatarPacket);
        break;
      default:
        break;
    }
  }
}
