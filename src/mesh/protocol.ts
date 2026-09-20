/**
 * SkyMatch mesh protocol.
 *
 * Every device is simultaneously a BLE peripheral (advertiser) and a BLE
 * central (scanner), so any two phones in range can find each other without
 * either one being a fixed "server". There is no internet and no backend:
 * the cabin group chat, private chats and presence alerts all travel over
 * BLE, either directly between two phones in range or relayed hop-by-hop
 * through everyone else's phone in between (store-and-forward flood
 * routing), the same approach used by offline mesh chat apps like Bridgefy
 * or Briar.
 *
 * Two payload shapes:
 *  - Advertisement (~24 bytes): broadcast continuously, no connection
 *    needed. Just enough to show a seat badge before the full profile
 *    arrives.
 *  - GATT packets: exchanged once two devices connect, used for profile
 *    broadcasts, the group chat, private messages and presence alerts.
 */

export const SERVICE_UUID = '6b2f1a00-2c9e-4f7a-8e1d-9a2f4c6b8e10';
export const PROFILE_CHAR_UUID = '6b2f1a01-2c9e-4f7a-8e1d-9a2f4c6b8e10';
export const RELAY_CHAR_UUID = '6b2f1a02-2c9e-4f7a-8e1d-9a2f4c6b8e10';

export const PROTOCOL_VERSION = 1;
export const MANUFACTURER_ID = 0xffff; // placeholder; replace with a registered company ID before shipping

/** Sentinel recipient id for the group chat and presence alerts: every node delivers locally AND keeps flooding it. */
export const BROADCAST_ID = '*';

export const DEFAULT_TTL = 6; // max hops a packet will travel before being dropped
export const SEEN_CACHE_SIZE = 512; // recently-relayed message ids kept to stop flood loops
export const PEER_STALE_MS = 15_000; // an advert not refreshed within this window is considered out of range

export type PacketKind = 'profile' | 'chat' | 'presence' | 'reaction' | 'avatar' | 'avatarRequest';

export interface MeshEnvelope<TPayload = unknown> {
  id: string; // uuid; used for dedup across the whole mesh
  kind: PacketKind;
  fromId: string;
  toId: string; // BROADCAST_ID, or the final recipient's peer id
  ttl: number;
  payload: TPayload;
}

/** Advertisement payload: the ~24 bytes broadcast on every BLE advert. */
export interface AdvertPayload {
  version: number;
  peerId: string; // 8-char short id, enough to dedup adverts; full uuid exchanged over GATT
  seatByte: number; // packSeat() output, or 0xff if the profile has no/unset seat
}

export function encodeEnvelope(envelope: MeshEnvelope): string {
  return JSON.stringify(envelope);
}

export function decodeEnvelope(raw: string): MeshEnvelope | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.id !== 'string' || typeof parsed.fromId !== 'string') return null;
    return parsed as MeshEnvelope;
  } catch {
    return null;
  }
}

/**
 * BLE MTU after negotiation is typically 185-512 bytes, and a group/private
 * text message fits in one write. A private message's image does not, so
 * every send is split into `Frame`s tagged with a per-send frame id: the
 * receiver buffers frames by id and only reassembles once every index has
 * arrived. Tagging (rather than assuming one write == one message, as an
 * earlier version of this file did) is what lets two messages be in flight
 * over the same characteristic at once without corrupting each other.
 */
/**
 * Sized so a whole encoded frame survives a BLE *notification*, which is the
 * tightest path we have: a notification cannot exceed the connection's MTU,
 * unlike a write with response, which the stack will split for us. Budgeting
 * 180 bytes on the wire and working backwards - base64 costs a third on top,
 * and the frame's own JSON wrapper about 46 characters - leaves roughly 80
 * for the payload. Oversized notifications are silently truncated, so being
 * conservative here is what keeps the peripheral-to-central direction alive.
 */
const CHUNK_SIZE = 80;

/** Short on purpose: the id is repeated in every chunk and eats the budget above. */
export function newFrameId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export interface Frame {
  id: string; // groups every chunk of one send together; unrelated to the envelope's own id
  index: number;
  total: number;
  part: string;
}

export function frameChunks(raw: string, frameId: string): Frame[] {
  const parts: string[] = [];
  for (let i = 0; i < raw.length; i += CHUNK_SIZE) {
    parts.push(raw.slice(i, i + CHUNK_SIZE));
  }
  if (parts.length === 0) parts.push('');
  return parts.map((part, index) => ({ id: frameId, index, total: parts.length, part }));
}

export function encodeFrame(frame: Frame): string {
  return JSON.stringify(frame);
}

export function decodeFrame(raw: string): Frame | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.id !== 'string' || typeof parsed.index !== 'number' || typeof parsed.total !== 'number') {
      return null;
    }
    return parsed as Frame;
  } catch {
    return null;
  }
}

/** Reassembles buffered frame parts (keyed by index) once every index 0..total-1 is present. */
export function reassembleFrames(parts: Map<number, string>, total: number): string | null {
  if (parts.size < total) return null;
  let raw = '';
  for (let i = 0; i < total; i++) {
    const part = parts.get(i);
    if (part === undefined) return null;
    raw += part;
  }
  return raw;
}
