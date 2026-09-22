import nacl from 'tweetnacl';
import { Buffer } from 'buffer';
import { fromBase64, keyedIdOf, toBase64, type Identity, type PublicKeys } from './identity';
import type { MeshEnvelope } from '../mesh/protocol';
import type { ChatMessage } from '../types';

/**
 * What a signature covers: who sent it, to whom, what kind of packet and
 * everything in it. Not the envelope id nor the TTL - relays rewrite the
 * TTL, and a packet re-sent under a new envelope id is still the same
 * packet: everything inside it carries its own id and is deduplicated by
 * that.
 *
 * The payload is signed as JSON.stringify gives it. Every hop parses and
 * re-stringifies, which gives back the same string for anything that was
 * produced by JSON.stringify in the first place - so the bytes a relay
 * passes on are the bytes that were signed.
 */
export function signedText(envelope: Pick<MeshEnvelope, 'kind' | 'fromId' | 'toId' | 'payload'>): string {
  return `${envelope.kind}\n${envelope.fromId}\n${envelope.toId}\n${JSON.stringify(envelope.payload ?? null)}`;
}

function utf8(text: string): Uint8Array {
  return new Uint8Array(Buffer.from(text, 'utf8'));
}

/** How many signatures are remembered, in each direction. */
const SIGNATURE_CACHE_SIZE = 256;

/**
 * A small memory of signatures already made or checked.
 *
 * Signing costs about 17ms and checking about 26ms in Hermes, and the same
 * profile announcement comes round from every person every ten seconds.
 * Ed25519 signatures are deterministic, so an unchanged announcement has
 * the same signature every time: recognising it is a string comparison
 * instead of a curve operation, and a full room stops costing anything
 * after the first round.
 */
class SignatureCache {
  private entries = new Map<string, string>();

  get(key: string): string | undefined {
    return this.entries.get(key);
  }

  set(key: string, value: string) {
    this.entries.delete(key);
    this.entries.set(key, value);
    if (this.entries.size > SIGNATURE_CACHE_SIZE) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
  }
}

/**
 * The part of a private message that is sealed: what was said. Who said it
 * - nickname, seat - is announced to the whole room every ten seconds
 * anyway, so it travels in the clear, where the envelope's signature still
 * covers it; sealing it too would only cost frames.
 */
interface SealedContent {
  body: string;
  replyTo?: ChatMessage['replyTo'];
}

/**
 * What goes into the box: a 4-byte length, the SealedContent JSON, and then
 * the photo, if any, as raw bytes.
 *
 * Raw, not base64: the box is base64-encoded to travel anyway, and a photo
 * that was base64 already would come out encoded twice - a third more
 * frames for the heaviest thing a private chat sends.
 */
function packContent(content: SealedContent, imageBase64?: string): Uint8Array {
  const json = utf8(JSON.stringify(content));
  const image = imageBase64 ? new Uint8Array(Buffer.from(imageBase64, 'base64')) : new Uint8Array(0);
  const packed = new Uint8Array(4 + json.length + image.length);
  new DataView(packed.buffer).setUint32(0, json.length);
  packed.set(json, 4);
  packed.set(image, 4 + json.length);
  return packed;
}

function unpackContent(packed: Uint8Array): (SealedContent & { imageBase64?: string }) | null {
  if (packed.length < 4) return null;
  const jsonLength = new DataView(packed.buffer, packed.byteOffset, packed.byteLength).getUint32(0);
  if (4 + jsonLength > packed.length) return null;
  const content = JSON.parse(Buffer.from(packed.subarray(4, 4 + jsonLength)).toString('utf8')) as SealedContent;
  if (!content || typeof content !== 'object') return null;
  const image = packed.subarray(4 + jsonLength);
  return image.length > 0 ? { ...content, imageBase64: Buffer.from(image).toString('base64') } : content;
}

/** A private message as it travels once sealed. */
export interface SealedMessage {
  id: string;
  scope: 'private';
  fromId: string;
  toId: string;
  fromLabel: string;
  fromNickname: string;
  sentAt: number;
  /** XSalsa20-Poly1305 box of packContent(), base64. */
  sealed: string;
  /** The box's 24-byte nonce, base64. */
  nonce: string;
}

export function isSealed(payload: unknown): payload is SealedMessage {
  return !!payload && typeof (payload as SealedMessage).sealed === 'string' && typeof (payload as SealedMessage).nonce === 'string';
}

/**
 * The cryptography of one phone: its identity, and the public keys of the
 * people it has heard from.
 */
export class SecureChannel {
  /** profile id -> their public keys, as their own signed announcement gave them. */
  private directory = new Map<string, { sign: Uint8Array; box: Uint8Array }>();
  private madeSignatures = new SignatureCache();
  private checkedSignatures = new SignatureCache();
  /** profile id -> the shared key for boxes to and from them, worked out once. */
  private sharedKeys = new Map<string, Uint8Array>();

  constructor(readonly identity: Identity) {}

  get id() {
    return this.identity.id;
  }

  sign(envelope: Pick<MeshEnvelope, 'kind' | 'fromId' | 'toId' | 'payload'>): string {
    const text = signedText(envelope);
    const cached = this.madeSignatures.get(text);
    if (cached) return cached;
    const signature = toBase64(nacl.sign.detached(utf8(text), this.identity.signSecretKey));
    this.madeSignatures.set(text, signature);
    return signature;
  }

  /**
   * Records someone's keys from their profile announcement - but only when
   * the keys are the ones their id was made from, and the announcement is
   * signed by them. Returns whether it was.
   */
  learn(fromId: string, keys: PublicKeys, envelope: MeshEnvelope & { sig?: string }): boolean {
    if (typeof keys?.sign !== 'string' || typeof keys?.box !== 'string') return false;
    let sign: Uint8Array;
    let box: Uint8Array;
    try {
      sign = fromBase64(keys.sign);
      box = fromBase64(keys.box);
    } catch {
      return false;
    }
    if (sign.length !== nacl.sign.publicKeyLength || box.length !== nacl.box.publicKeyLength) return false;
    if (keyedIdOf(sign) !== fromId) return false;
    if (!this.checkSignature(envelope, sign)) return false;

    const known = this.directory.get(fromId);
    if (!known || toBase64(known.box) !== keys.box) this.sharedKeys.delete(fromId);
    this.directory.set(fromId, { sign, box });
    return true;
  }

  knows(profileId: string): boolean {
    return this.directory.has(profileId);
  }

  /** Checks a signed packet from someone whose keys we already hold. */
  verify(envelope: MeshEnvelope & { sig?: string }): boolean {
    const keys = this.directory.get(envelope.fromId);
    if (!keys) return false;
    return this.checkSignature(envelope, keys.sign);
  }

  private checkSignature(envelope: MeshEnvelope & { sig?: string }, signKey: Uint8Array): boolean {
    if (typeof envelope.sig !== 'string') return false;
    const text = signedText(envelope);
    const cacheKey = `${envelope.fromId}\n${envelope.sig}`;
    if (this.checkedSignatures.get(cacheKey) === text) return true;
    let signature: Uint8Array;
    try {
      signature = fromBase64(envelope.sig);
    } catch {
      return false;
    }
    if (signature.length !== nacl.sign.signatureLength) return false;
    const valid = nacl.sign.detached.verify(utf8(text), signature, signKey);
    if (valid) this.checkedSignatures.set(cacheKey, text);
    return valid;
  }

  private sharedKey(peerId: string): Uint8Array | null {
    const cached = this.sharedKeys.get(peerId);
    if (cached) return cached;
    const keys = this.directory.get(peerId);
    if (!keys) return null;
    const shared = nacl.box.before(keys.box, this.identity.boxSecretKey);
    this.sharedKeys.set(peerId, shared);
    return shared;
  }

  /** Seals a private message for its recipient, or null when we don't hold their key. */
  seal(message: ChatMessage): SealedMessage | null {
    if (!message.toId) return null;
    const key = this.sharedKey(message.toId);
    if (!key) return null;

    const content: SealedContent = { body: message.body, replyTo: message.replyTo };
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const sealed = nacl.box.after(packContent(content, message.imageBase64), nonce, key);
    return {
      id: message.id,
      scope: 'private',
      fromId: message.fromId,
      toId: message.toId,
      fromLabel: message.fromLabel,
      fromNickname: message.fromNickname,
      sentAt: message.sentAt,
      sealed: toBase64(sealed),
      nonce: toBase64(nonce),
    };
  }

  /**
   * Opens a private message sealed for us. Null when it wasn't for us, or
   * was tampered with on the way - the box can only be opened with the
   * sender's key and ours, and not at all once a byte has changed.
   */
  open(sealed: SealedMessage): Record<string, unknown> | null {
    if (sealed.toId !== this.identity.id) return null;
    const key = this.sharedKey(sealed.fromId);
    if (!key) return null;
    try {
      const opened = nacl.box.open.after(fromBase64(sealed.sealed), fromBase64(sealed.nonce), key);
      if (!opened) return null;
      const content = unpackContent(opened);
      if (!content) return null;
      return {
        ...content,
        id: sealed.id,
        scope: 'private',
        fromId: sealed.fromId,
        toId: sealed.toId,
        fromLabel: sealed.fromLabel,
        fromNickname: sealed.fromNickname,
        sentAt: sealed.sentAt,
      };
    } catch {
      return null;
    }
  }
}
