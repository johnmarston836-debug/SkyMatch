import 'react-native-get-random-values';
import nacl from 'tweetnacl';
import { Buffer } from 'buffer';

/*
 * tweetnacl looks for a random source when it loads, and in React Native
 * that is before anything is guaranteed to be in place. Handing it the
 * polyfill explicitly means keys never depend on import order.
 */
nacl.setPRNG((out, length) => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  out.set(bytes);
});

/**
 * Who this phone is, cryptographically.
 *
 * Two key pairs, because they do different jobs: an Ed25519 pair signs
 * everything this phone puts on the mesh, so nobody else can speak as us,
 * and an X25519 pair lets someone seal a private message that only we can
 * open, however many strangers' phones it crosses on the way.
 *
 * The profile id is not chosen, it is worked out from the signing key (see
 * keyedIdOf). That is what makes an id impossible to borrow: to send as
 * someone you would need their secret key, not just their id - and there is
 * no "first to announce wins" moment for an impostor to race.
 */
export interface Identity {
  id: string;
  signPublicKey: Uint8Array;
  signSecretKey: Uint8Array;
  boxPublicKey: Uint8Array;
  boxSecretKey: Uint8Array;
}

/** The public half, as it travels in a profile announcement. */
export interface PublicKeys {
  /** Ed25519 public key, base64. */
  sign: string;
  /** X25519 public key, base64. */
  box: string;
}

export function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

export function fromBase64(text: string): Uint8Array {
  return new Uint8Array(Buffer.from(text, 'base64'));
}

/**
 * The profile id that belongs to a signing key: the first 16 bytes of its
 * SHA-512, written as a UUID with version 8 (RFC 9562's "custom" version).
 *
 * Same length and look as the random v4 ids every earlier build uses, so
 * nothing that stores or shows ids changes - and the version digit is what
 * tells a phone that this id comes with a key, and so must sign.
 */
export function keyedIdOf(signPublicKey: Uint8Array): string {
  const bytes = nacl.hash(signPublicKey).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x80; // version 8
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** True for an id made by keyedIdOf: whoever claims it has to prove it. */
export function isKeyedId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);
}

export function createIdentity(): Identity {
  const sign = nacl.sign.keyPair();
  const box = nacl.box.keyPair();
  return {
    id: keyedIdOf(sign.publicKey),
    signPublicKey: sign.publicKey,
    signSecretKey: sign.secretKey,
    boxPublicKey: box.publicKey,
    boxSecretKey: box.secretKey,
  };
}

export function publicKeysOf(identity: Identity): PublicKeys {
  return { sign: toBase64(identity.signPublicKey), box: toBase64(identity.boxPublicKey) };
}

interface StoredIdentity {
  signSecretKey: string;
  boxSecretKey: string;
}

export function serializeIdentity(identity: Identity): string {
  const stored: StoredIdentity = {
    signSecretKey: toBase64(identity.signSecretKey),
    boxSecretKey: toBase64(identity.boxSecretKey),
  };
  return JSON.stringify(stored);
}

/** Rebuilds an identity from its two secret keys, or null if what was stored can't be one. */
export function deserializeIdentity(raw: string): Identity | null {
  try {
    const stored = JSON.parse(raw) as Partial<StoredIdentity>;
    if (typeof stored.signSecretKey !== 'string' || typeof stored.boxSecretKey !== 'string') return null;
    const signSecretKey = fromBase64(stored.signSecretKey);
    const boxSecretKey = fromBase64(stored.boxSecretKey);
    if (signSecretKey.length !== nacl.sign.secretKeyLength || boxSecretKey.length !== nacl.box.secretKeyLength) {
      return null;
    }
    const sign = nacl.sign.keyPair.fromSecretKey(signSecretKey);
    const box = nacl.box.keyPair.fromSecretKey(boxSecretKey);
    return {
      id: keyedIdOf(sign.publicKey),
      signPublicKey: sign.publicKey,
      signSecretKey: sign.secretKey,
      boxPublicKey: box.publicKey,
      boxSecretKey: box.secretKey,
    };
  } catch {
    return null;
  }
}
