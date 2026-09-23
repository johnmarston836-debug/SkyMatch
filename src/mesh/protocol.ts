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
/**
 * The company id Android's advert carries the location under (see
 * locationFromAdvert). 0xFFFF is the Bluetooth SIG's id for testing and
 * unregistered use, kept on purpose: registering one buys nothing here, and
 * a stranger's data under the same id is ignored because ours always
 * starts with "SM".
 */
export const MANUFACTURER_ID = 0xffff;

/** Sentinel recipient id for the group chat and presence alerts: every node delivers locally AND keeps flooding it. */
export const BROADCAST_ID = '*';

export const DEFAULT_TTL = 6; // max hops a packet will travel before being dropped

/**
 * The most packets one phone may put into the mesh in a window before the
 * rest are ignored.
 *
 * Everything received is relayed onward, so one phone - buggy or malicious -
 * can drown the Bluetooth of a whole room for everyone in it. The allowance
 * is far above normal use: a photo is one packet however many chunks it
 * takes, a profile beat is one every ten seconds, and nobody types thirty
 * messages in ten seconds.
 */
export const FLOOD_LIMIT = 30;
export const FLOOD_WINDOW_MS = 10_000;
export const SEEN_CACHE_SIZE = 512;

/**
 * Profile beats are not relayed by a phone that has already heard the same
 * beat this many times - its neighbours have it covered - and before
 * relaying, a phone waits a short random moment to find out.
 *
 * Beats are most of what crosses the mesh: everyone sends one every ten
 * seconds and every phone used to repeat every one of them. In simulated
 * cabins this cuts beat traffic by about 40% for a few points of reach, and
 * a beat that doesn't make it is replaced by the next one ten seconds
 * later. Messages are never held back like this: losing one is not
 * something the next ten seconds repair.
 */
export const BEAT_RELAY_SUPPRESS_AFTER = 3;
export const BEAT_RELAY_JITTER_MS: [number, number] = [30, 150]; // recently-relayed message ids kept to stop flood loops
export const PEER_STALE_MS = 15_000; // an advert not refreshed within this window is considered out of range

export type PacketKind = 'profile' | 'chat' | 'presence' | 'reaction' | 'avatar' | 'avatarRequest' | 'read' | 'delivered';

export interface MeshEnvelope<TPayload = unknown> {
  id: string; // uuid; used for dedup across the whole mesh
  kind: PacketKind;
  fromId: string;
  toId: string; // BROADCAST_ID, or the final recipient's peer id
  ttl: number;
  payload: TPayload;
  /**
   * Ed25519 signature over signedText() (src/crypto/secure.ts), base64.
   * Always present from a phone whose id is keyed; absent from the builds
   * before signing existed.
   */
  sig?: string;
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

/**
 * Reads an envelope off the radio, or refuses it.
 *
 * Everything here arrives from a phone we know nothing about, and the
 * router relays what it accepts to everyone else in the room, so a
 * malformed packet is not one phone's problem. The TTL is clamped rather
 * than trusted: a sender that stamps a huge one would have its packets
 * cross every hop of every mesh they ever reach.
 */
export function decodeEnvelope(raw: string): MeshEnvelope | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.id !== 'string' || parsed.id.length === 0) return null;
    if (typeof parsed.fromId !== 'string' || parsed.fromId.length === 0) return null;
    if (typeof parsed.toId !== 'string' || typeof parsed.kind !== 'string') return null;
    const ttl = typeof parsed.ttl === 'number' && Number.isFinite(parsed.ttl) ? Math.floor(parsed.ttl) : 0;
    return { ...(parsed as MeshEnvelope), ttl: Math.min(ttl, DEFAULT_TTL) };
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
  /**
   * Only on a repair request: the chunk numbers the receiver never got.
   *
   * Without this a photo is all or nothing. It is hundreds of chunks, and
   * losing any single one used to mean the receiver waited forever while the
   * sender started the whole thing again from scratch. Naming the gaps turns
   * that into a couple of chunks.
   */
  need?: number[];
}

/**
 * The most chunks one send may claim to have. Today's composer keeps a
 * private photo to about 500 chunks, but the builds before it sent the
 * picker's output as it came - a busy 480px photo can be several times
 * that - and a relay running this build must not cut those short for
 * everyone downstream. A frame claiming millions would otherwise have the
 * receiver walk all of them every time it looks for gaps.
 */
export const MAX_FRAMES_PER_SEND = 4096;

/** How many gaps one request names. A long list defeats the point of a small packet. */
export const MAX_REPAIR_REQUEST = 24;

/** A frame that carries no data and asks for the chunks that never arrived. */
export function repairFrame(id: string, need: number[]): Frame {
  return { id, index: -1, total: 0, part: '', need: need.slice(0, MAX_REPAIR_REQUEST) };
}

export function isRepairFrame(frame: Frame): boolean {
  return Array.isArray(frame.need);
}

/** Which chunks of a send are still missing, in order. */
export function missingIndices(parts: Map<number, string>, total: number): number[] {
  const missing: number[] = [];
  for (let i = 0; i < total; i++) {
    if (!parts.has(i)) missing.push(i);
  }
  return missing;
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
    if (parsed.need !== undefined) {
      if (!Array.isArray(parsed.need)) return null;
      const need = (parsed.need as unknown[])
        .filter((index): index is number => Number.isInteger(index) && (index as number) >= 0)
        .slice(0, MAX_REPAIR_REQUEST);
      return { id: parsed.id, index: -1, total: 0, part: '', need };
    }
    if (typeof parsed.part !== 'string') return null;
    if (!Number.isInteger(parsed.total) || parsed.total < 1 || parsed.total > MAX_FRAMES_PER_SEND) return null;
    if (!Number.isInteger(parsed.index) || parsed.index < 0 || parsed.index >= parsed.total) return null;
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
