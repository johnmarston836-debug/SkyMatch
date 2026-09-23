import { isAway, minutesAway } from './discoveryStore';
import type { ChatContact } from './chatStore';
import { formatLocation } from '../utils/location';
import type { DiscoveredPeer, UserLocation } from '../types';

/**
 * How reachable someone is right now:
 * - `connected`: their profile beat is arriving.
 * - `lost`: it stopped a little while ago (see AWAY_AFTER_MS) - they left the
 *   app, locked the phone, or walked out of range.
 * - `gone`: the radio forgot them long ago; all that is left is the chat.
 *
 * Only the first can receive a message. The other two are shown with the
 * red "no connection" mark, so nobody writes into a conversation believing
 * it is being delivered.
 */
export type Connection = 'connected' | 'lost' | 'gone';

export interface ConversationPeer {
  peerId: string;
  nickname: string;
  label: string;
  location?: UserLocation;
  contact?: string;
  /** Their keys were checked: private messages to them are sealed. */
  secure: boolean;
  connection: Connection;
  /** For `lost`: whole minutes since they were last heard. */
  minutesAway: number;
}

/** Everything a list row or a chat header needs about someone, whether or not they are still around. */
export function describeConversationPeer(
  peerId: string,
  peer: DiscoveredPeer | undefined,
  saved: ChatContact | undefined,
  now = Date.now(),
): ConversationPeer | null {
  if (peer?.profile) {
    const { nickname, location, contact } = peer.profile;
    return {
      peerId,
      nickname,
      label: formatLocation(location),
      location,
      contact,
      secure: peer.secure === true,
      connection: isAway(peer, now) ? 'lost' : 'connected',
      minutesAway: minutesAway(peer, now),
    };
  }
  if (saved) {
    return {
      peerId,
      nickname: saved.nickname,
      // In this phone's words when we know the location itself.
      label: saved.location ? formatLocation(saved.location) : saved.label,
      location: saved.location,
      contact: saved.contact,
      secure: false,
      connection: 'gone',
      minutesAway: 0,
    };
  }
  return null;
}

/**
 * Drops people who are only an older copy of someone connected right now.
 *
 * Reinstalling the app, or clearing its data, gives a phone a new identity -
 * and so a new profile id - while everyone around still holds the old one,
 * showing as "no connection" for the next ten minutes. The list then showed
 * the same person twice. An entry that is not connected, has no
 * conversation to keep, and matches someone connected by name and
 * location is taken to be that: two different people can't share a seat.
 */
export function withoutReplaced<T extends { person: ConversationPeer; lastMessage: unknown }>(list: T[]): T[] {
  const key = (person: ConversationPeer) => `${person.nickname.trim().toLowerCase()}\n${person.label}`;
  const live = new Set(list.filter((entry) => entry.person.connection === 'connected').map((entry) => key(entry.person)));
  return list.filter(
    (entry) => entry.person.connection === 'connected' || entry.lastMessage || !live.has(key(entry.person)),
  );
}
