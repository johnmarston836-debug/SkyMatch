/**
 * SkyMatch mesh protocol.
 *
 * Every device is simultaneously a BLE peripheral (advertiser) and a BLE
 * central (scanner), so any two phones in range can find each other without
 * either one being a fixed "server". There is no internet and no backend:
 * discovery, swiping and chat all travel over BLE, either directly between
 * two phones in range or relayed hop-by-hop through everyone else's phone
 * in between (store-and-forward flood routing), the same approach used by
 * offline mesh chat apps like Bridgefy or Briar.
 *
 * Two payload shapes:
 *  - Advertisement (~24 bytes): broadcast continuously, no connection
 *    needed. Just enough to show a seat badge on the swipe deck.
 *  - GATT packets: exchanged once two devices connect, used for full
 *    profile exchange, swipes, chat messages and mesh relay.
 */

export const SERVICE_UUID = '6b2f1a00-2c9e-4f7a-8e1d-9a2f4c6b8e10';
export const PROFILE_CHAR_UUID = '6b2f1a01-2c9e-4f7a-8e1d-9a2f4c6b8e10';
export const RELAY_CHAR_UUID = '6b2f1a02-2c9e-4f7a-8e1d-9a2f4c6b8e10';

export const PROTOCOL_VERSION = 1;
export const MANUFACTURER_ID = 0xffff; // placeholder; replace with a registered company ID before shipping

export const DEFAULT_TTL = 6; // max hops a chat/swipe packet will travel before being dropped
export const SEEN_CACHE_SIZE = 512; // recently-relayed message ids kept to stop flood loops
export const PEER_STALE_MS = 15_000; // an advert not refreshed within this window is considered out of range

export type PacketKind = 'profile' | 'swipe' | 'chat' | 'ack';

export interface MeshEnvelope<TPayload = unknown> {
  id: string; // uuid; used for dedup across the whole mesh
  kind: PacketKind;
  fromId: string;
  toId: string; // final recipient; intermediate hops just forward, they never open the payload
  ttl: number;
  payload: TPayload;
}

/** Advertisement payload: the ~24 bytes broadcast on every BLE advert. */
export interface AdvertPayload {
  version: number;
  peerId: string; // 8-char short id, enough to dedup adverts; full uuid exchanged over GATT
  seatByte: number; // packSeat() output, or 0xff if the profile has no/unset seat
}

/**
 * Encodes an envelope as JSON for the GATT relay characteristic.
 * BLE MTU after negotiation is typically 185-512 bytes, well under most
 * chat messages and profile JSON, so callers chunk with `chunk`/`reassemble`
 * below rather than relying on a single big write.
 */
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

const CHUNK_SIZE = 180; // bytes; stays under the smallest MTU we negotiate for on older Android devices

export function chunk(data: string): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    chunks.push(data.slice(i, i + CHUNK_SIZE));
  }
  return chunks.length > 0 ? chunks : [''];
}

export function reassemble(chunks: string[]): string {
  return chunks.join('');
}
