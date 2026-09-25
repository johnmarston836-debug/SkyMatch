import type { BleTransport } from './BleTransport';
import { MeshRouter } from './MeshRouter';
import { BROADCAST_ID, type MeshEnvelope } from './protocol';
import type {
  AvatarPacket,
  AvatarRequest,
  ChatMessage,
  DeliveryReceipt,
  PresenceAlert,
  PresenceReaction,
  Profile,
  ProfilePacket,
  ReadReceipt,
  UserLocation,
} from '../types';
import { newId } from '../utils/id';
import { readAvatar, readChatMessage, readDelivery, readPresenceAlert, readReaction, readReceipt } from './validate';
import { isKeyedId, publicKeysOf, type Identity } from '../crypto/identity';
import { SecureChannel, isSealed } from '../crypto/secure';

/**
 * How long a signed packet waits for its sender's keys. They come with the
 * sender's profile announcement, every ten seconds; a message that got here
 * first - someone we haven't heard announce yet - waits for it rather than
 * being thrown away.
 */
const PENDING_KEYS_MS = 30_000;
/** Most packets held per sender, and senders held, while waiting for keys. */
const MAX_PENDING_PER_SENDER = 20;
const MAX_PENDING_SENDERS = 64;

type Listeners = {
  peerSeen: (peerId: string, location: UserLocation | null) => void;
  peerLost: (peerId: string) => void;
  profile: (peerId: string, profile: ProfilePacket) => void;
  message: (message: ChatMessage) => void;
  presence: (alert: PresenceAlert) => void;
  reaction: (reaction: PresenceReaction) => void;
  avatar: (avatar: AvatarPacket) => void;
  /**
   * Someone is missing our photo, or holding an outdated one, and is asking
   * for it - `full` when they have opened our card and want the portrait.
   */
  avatarRequest: (fromId: string, full: boolean) => void;
  /** Someone has read what we sent them. */
  read: (receipt: ReadReceipt) => void;
  /** A private message of ours reached the person it was for. */
  delivered: (receipt: DeliveryReceipt) => void;
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
    avatarRequest: new Set(),
    read: new Set(),
    delivered: new Set(),
  };
  /** People whose build answers private messages with a DeliveryReceipt (ProfilePacket.acks). */
  private ackers = new Set<string>();

  /** Null only for a phone with no keys: the tests, and a profile not yet moved to a keyed id. */
  private secure: SecureChannel | null;
  /** Signed packets from people whose keys haven't arrived yet, oldest first. */
  private pending = new Map<string, { envelope: MeshEnvelope; at: number }[]>();

  constructor(
    private transport: BleTransport,
    private myPeerId: string,
    identity?: Identity,
  ) {
    // Signing with keys the id wasn't made from would get every packet we
    // send refused, so an identity that doesn't match is not used at all.
    this.secure = identity && identity.id === myPeerId ? new SecureChannel(identity) : null;
    this.router = new MeshRouter(transport, myPeerId);
    this.router.onDeliver((envelope) => this.admit(envelope));
    transport.onPeerSeen((peerId, _rssi, location) => this.emit('peerSeen', peerId, location));
    transport.onPeerLost((peerId) => this.emit('peerLost', peerId));
  }

  /** Whether private messages to this person are sealed: they have announced keys we could check. */
  isSecureWith(peerId: string): boolean {
    return this.secure?.knows(peerId) ?? false;
  }

  /** Looks around again now: see BleTransport.rescan. */
  rescan() {
    this.transport.rescan?.();
  }

  /** Whether this person says when a private message reached them; see delivery.ts. */
  acksFrom(peerId: string): boolean {
    return this.ackers.has(peerId);
  }

  async start(location: UserLocation | null) {
    await this.transport.start(this.myPeerId, location);
  }

  async stop() {
    await this.transport.stop();
  }

  on<K extends keyof Listeners>(event: K, listener: Listeners[K]): () => void {
    this.listeners[event].add(listener as never);
    return () => this.listeners[event].delete(listener as never);
  }

  /**
   * Broadcasts the lightweight {id, seat, nickname} profile so peers can
   * label messages from us, plus the fingerprint of our photo so they can
   * tell whether the one they hold for us is current.
   */
  async broadcastProfile(profile: Profile, avatarHash?: string, hello = false) {
    // `''` travels: it is how someone says they took their photo down.
    // `undefined` does not: it means we don't know yet, and announcing that
    // as "no photo" makes everyone else throw away the copy they hold.
    const withHash: ProfilePacket = {
      ...(avatarHash === undefined ? profile : { ...profile, avatarHash }),
      acks: true,
      ...(hello ? { hello: true } : {}),
    };
    const payload: ProfilePacket = this.secure ? { ...withHash, keys: publicKeysOf(this.secure.identity) } : withHash;
    await this.send({ id: newId(), kind: 'profile', fromId: this.myPeerId, toId: BROADCAST_ID, payload });
  }

  async sendGroupMessage(message: ChatMessage) {
    await this.send({ id: message.id, kind: 'chat', fromId: this.myPeerId, toId: BROADCAST_ID, payload: message });
  }

  /**
   * Sends a 1:1 message, optionally carrying a small base64 image. Never do
   * this for the group chat: a broadcast image gets re-sent by every relay
   * hop to every other node, which floods the whole cabin's Bluetooth
   * bandwidth for one photo. A private image only costs the direct
   * connection (or the handful of hops) between the two people involved.
   */
  async sendPrivateMessage(message: ChatMessage, retry = false) {
    if (!message.toId) throw new Error('sendPrivateMessage requires message.toId');
    // The "not delivered" mark is this phone's own note; it never travels.
    const outgoing = { ...message };
    delete outgoing.undelivered;
    // Sealed whenever the recipient has announced a key: the strangers'
    // phones it crosses on the way can pass it on but not read it. Someone
    // on a build without keys gets it as before - the chat says so.
    const payload = this.secure?.seal(outgoing) ?? outgoing;
    // A retry needs an envelope id nobody has seen, or every relay - and the
    // receiver - would drop it as a copy of the first attempt. The message
    // keeps its own id, which is what the receiver files it by.
    const id = retry ? newId() : message.id;
    await this.send({ id, kind: 'chat', fromId: this.myPeerId, toId: message.toId, payload });
  }

  /**
   * The envelope gets its own fresh id rather than reusing the alert's: an
   * alert and the "I'm back" that cancels it deliberately share an id, so
   * reusing it would make every other phone's dedup cache discard the
   * cancellation as a message it had already seen, and the banner would
   * never clear anywhere but here.
   */
  async sendPresenceAlert(alert: PresenceAlert) {
    await this.send({ id: newId(), kind: 'presence', fromId: this.myPeerId, toId: BROADCAST_ID, payload: alert });
  }

  /**
   * Sends our photo to the one person who asked for it. A photo is worth
   * hundreds of ordinary packets, so it is never broadcast: flooding it
   * would make every phone in the cabin relay all of those frames to
   * everyone else, including the many who already have it.
   */
  async sendAvatar(avatar: AvatarPacket, toId: string) {
    await this.send({ id: newId(), kind: 'avatar', fromId: this.myPeerId, toId, payload: avatar });
  }

  /**
   * Asks one peer for their photo: the thumbnail by default, the portrait
   * only when someone has actually opened their card.
   *
   * Tiny, and safe to repeat: it is sent again on every profile beat until
   * their photo actually arrives, which is what makes a photo survive the
   * frames a Bluetooth link loses - the old fire-and-forget push had no
   * second chance, so a photo either made it the first time or never
   * appeared at all.
   */
  async requestAvatar(toId: string, full = false) {
    const payload: AvatarRequest = full ? { full: true } : {};
    await this.send({ id: newId(), kind: 'avatarRequest', fromId: this.myPeerId, toId, payload });
  }

  /** Tells whoever sent us a private message that it arrived, so they stop sending it. */
  private async sendDelivered(message: ChatMessage) {
    const receipt: DeliveryReceipt = { fromId: this.myPeerId, toId: message.fromId, messageId: message.id };
    await this.send({ id: newId(), kind: 'delivered', fromId: this.myPeerId, toId: message.fromId, payload: receipt });
  }

  /** Tells one person we have read up to a point in what they sent us. */
  async sendReadReceipt(receipt: ReadReceipt) {
    await this.send({ id: newId(), kind: 'read', fromId: this.myPeerId, toId: receipt.toId, payload: receipt });
  }

  async sendPresenceReaction(reaction: PresenceReaction) {
    await this.send({ id: reaction.id, kind: 'reaction', fromId: this.myPeerId, toId: BROADCAST_ID, payload: reaction });
  }

  /** Everything this phone puts on the mesh goes through here, and is signed when it can be. */
  private send(envelope: Omit<MeshEnvelope, 'ttl'>) {
    const sig = this.secure?.sign(envelope);
    return this.router.send(sig ? { ...envelope, sig } : envelope);
  }

  /**
   * Decides whether a delivered packet is who it says it is.
   *
   * A keyed id (see isKeyedId) has to prove it: its packets are signed, and
   * the signature has to check out against the keys its id was made from.
   * An unsigned packet claiming such an id is someone else using it, and is
   * dropped. Ids from earlier builds carry no keys and are taken on trust,
   * as they always were - there is nothing to check them against.
   */
  private admit(envelope: MeshEnvelope) {
    const { fromId } = envelope;
    const secure = this.secure;

    if (!isKeyedId(fromId)) {
      this.handleEnvelope(envelope);
      return;
    }
    // Without keys of our own we can't check anyone else's either; what
    // this phone did before signing existed is all that is left.
    if (!secure) {
      if (!isSealed(envelope.payload)) this.handleEnvelope(envelope);
      return;
    }

    if (envelope.kind === 'profile') {
      const keys = (envelope.payload as ProfilePacket | null)?.keys;
      if (!keys || !secure.learn(fromId, keys, envelope)) return;
      this.handleEnvelope(envelope);
      this.releasePending(fromId);
      return;
    }

    if (!secure.knows(fromId)) {
      this.hold(envelope);
      return;
    }
    if (!secure.verify(envelope)) return;

    if (envelope.kind === 'chat' && isSealed(envelope.payload)) {
      const opened = secure.open(envelope.payload);
      if (!opened) return;
      this.handleEnvelope({ ...envelope, payload: opened });
      return;
    }
    this.handleEnvelope(envelope);
  }

  private hold(envelope: MeshEnvelope) {
    const now = Date.now();
    let queue = this.pending.get(envelope.fromId);
    if (!queue) {
      if (this.pending.size >= MAX_PENDING_SENDERS) {
        const oldest = this.pending.keys().next().value;
        if (oldest !== undefined) this.pending.delete(oldest);
      }
      queue = [];
      this.pending.set(envelope.fromId, queue);
    }
    queue.push({ envelope, at: now });
    if (queue.length > MAX_PENDING_PER_SENDER) queue.shift();
  }

  private releasePending(fromId: string) {
    const queue = this.pending.get(fromId);
    if (!queue) return;
    this.pending.delete(fromId);
    const cutoff = Date.now() - PENDING_KEYS_MS;
    queue.filter((entry) => entry.at >= cutoff).forEach((entry) => this.admit(entry.envelope));
  }

  private emit<K extends keyof Listeners>(event: K, ...args: Parameters<Listeners[K]>) {
    this.listeners[event].forEach((listener) => (listener as (...a: Parameters<Listeners[K]>) => void)(...args));
  }

  /**
   * Turns a delivered envelope into an app event, once its payload has been
   * checked (see validate.ts): what arrives here was written by another
   * phone, and one this phone can't read is dropped rather than drawn.
   */
  private handleEnvelope(envelope: MeshEnvelope) {
    const { fromId, payload } = envelope;
    switch (envelope.kind) {
      case 'profile':
        if ((payload as ProfilePacket | null)?.acks === true) this.ackers.add(fromId);
        else this.ackers.delete(fromId);
        this.emit('profile', fromId, payload as ProfilePacket);
        break;
      case 'chat': {
        const message = readChatMessage(payload, fromId);
        if (!message) break;
        // The scope has to agree with how it was addressed: a "private"
        // message flooded to everyone, or a group one aimed at us alone, is
        // not what it says it is.
        const addressedToMe = envelope.toId === this.myPeerId && message.toId === this.myPeerId;
        if (message.scope === 'group' ? envelope.toId !== BROADCAST_ID : !addressedToMe) break;
        this.emit('message', message);
        // Every copy is answered, not just the first: a second copy means
        // the answer to the first one got lost.
        if (message.scope === 'private') void this.sendDelivered(message);
        break;
      }
      case 'presence': {
        const alert = readPresenceAlert(payload, fromId);
        if (alert) this.emit('presence', alert);
        break;
      }
      case 'reaction': {
        const reaction = readReaction(payload, fromId);
        if (reaction) this.emit('reaction', reaction);
        break;
      }
      case 'avatar': {
        const avatar = readAvatar(payload, fromId);
        if (avatar) this.emit('avatar', avatar);
        break;
      }
      case 'avatarRequest':
        this.emit('avatarRequest', fromId, (payload as AvatarRequest | null)?.full === true);
        break;
      case 'read': {
        const receipt = readReceipt(payload, fromId, this.myPeerId);
        if (receipt) this.emit('read', receipt);
        break;
      }
      case 'delivered': {
        const receipt = readDelivery(payload, fromId, this.myPeerId);
        if (receipt) this.emit('delivered', receipt);
        break;
      }
      default:
        break;
    }
  }
}
