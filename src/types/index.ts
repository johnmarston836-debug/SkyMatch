export type SeatLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'J' | 'K';

export interface Seat {
  row: number; // 1-99
  letter: SeatLetter;
}

/**
 * The kind of place you are in. It is chosen once, when the app opens, and
 * decides the only thing that really differs between them: how a person is
 * pointed at without knowing their name.
 */
export type VenueKind = 'plane' | 'train' | 'gym' | 'public';

export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio' | 'fullbody';

/**
 * In a room with no seats and no numbers, what people actually use to point
 * someone out is what they are wearing - "el de la camiseta roja" - so that
 * is what identifies you here, optionally narrowed by where in the place you
 * are ("en la barra").
 */
export type OutfitColor = 'black' | 'white' | 'grey' | 'red' | 'blue' | 'green' | 'yellow' | 'pink';

/** Where you are, in whatever terms the place you are in actually uses. */
export type UserLocation =
  | { kind: 'plane'; seat: Seat }
  | { kind: 'train'; coach: number; seat: Seat }
  | { kind: 'gym'; muscle: MuscleGroup }
  | { kind: 'public'; color: OutfitColor; spot?: string };

export interface Profile {
  id: string; // stable local UUID, regenerated per install (not tied to BLE MAC)
  /** Seat, coach and seat, muscle group or outfit - see UserLocation. This is the real identity. */
  location: UserLocation;
  nickname: string; // shown alongside the location badge, to accompany it rather than replace it
  /** Optional free-text contact (Instagram handle, WhatsApp number, ...), shown only on the profile screen someone reaches by tapping your name - never in the group chat or the passenger list. */
  contact?: string;
}

/**
 * What actually travels in a profile announcement: the profile plus the
 * fingerprint of the sender's photo. Everyone re-announces every few
 * seconds, so this is also the heartbeat that lets a phone notice it is
 * missing someone's photo - or holding an old one - and ask for it.
 */
export interface ProfilePacket extends Profile {
  /** shortHash() of the base64 photo, or absent when that person has none. */
  avatarHash?: string;
  /**
   * The sender's public keys (see src/crypto/identity.ts). The id is made
   * from the signing one, which is how a receiver knows they are really
   * theirs; absent from builds before signing existed.
   */
  keys?: { sign: string; box: string };
  /**
   * Says this build answers every private message with a DeliveryReceipt,
   * so the sender can tell a message that got lost from one still on its
   * way. Absent from builds before delivery receipts.
   */
  acks?: boolean;
  /**
   * "Who is still here?" - sent when someone pulls their list down to
   * refresh. Everyone who hears it answers with their own announcement
   * straight away instead of at their next beat, so the list is right in a
   * second or two, not ten.
   */
  hello?: boolean;
}

export type MessageScope = 'group' | 'private';

/**
 * The message being answered, carried inside the reply itself rather than
 * looked up by id. The phone reading it may never have received the
 * original - it joined later, or that packet was one of the ones the radio
 * lost - and a quote that renders as a blank is worse than no quote.
 *
 * Deliberately without the original's id: a uuid is 36 characters, half a
 * Bluetooth frame, and nothing reads it. It belongs here the day a quote
 * becomes tappable, not before.
 */
export interface ReplyQuote {
  nickname: string;
  /** The first line or so of what was said; photos quote as "Foto". */
  excerpt: string;
}

export interface ChatMessage {
  id: string; // uuid, used for mesh dedup
  scope: MessageScope;
  fromId: string;
  /**
   * The sender's location already rendered ("14A", "V3 · 14A", "Pecho",
   * "Camiseta roja"). A message only ever needs to show it, and a short
   * string costs a fraction of the Bluetooth frames the full structure
   * would.
   */
  fromLabel: string;
  /**
   * The sender's location as packLocation() writes it ("G00", "P1c"), so
   * each phone can put it into words in its own language - "Pecho" on one,
   * "Chest" on the next - rather than showing the sender's. A few
   * characters; absent from older builds, which only send fromLabel.
   */
  fromLoc?: string;
  fromNickname: string;
  toId?: string; // only set for scope 'private'
  body: string;
  /** Small (<20KB) JPEG, base64-encoded. Private messages only - see MeshService docs on why group messages never carry images. */
  imageBase64?: string;
  /** Set when this message is an answer to another one. */
  replyTo?: ReplyQuote;
  sentAt: number;
  /**
   * Only on this phone, never sent: set on a private message of ours once
   * every attempt at getting it across went unanswered (see delivery.ts).
   */
  undelivered?: boolean;
  /** true when this bubble was relayed to us over the mesh rather than received directly */
  viaMesh?: boolean;
}

/**
 * What the one-tap button announces. It differs by venue because the useful
 * thing to say differs: in a seat it is "I'm up, come over"; in a gym nobody
 * cares that you are standing, but everybody cares that a machine is about
 * to be free.
 */
export type PresenceStatus = 'standing' | 'leavingMachine';

export interface PresenceAlert {
  id: string; // same id reused for the "back" broadcast that cancels this alert
  fromId: string;
  /** Rendered location, same reasoning as ChatMessage.fromLabel. */
  label: string;
  /** Packed location, same reasoning as ChatMessage.fromLoc. */
  loc?: string;
  /** Who is up, or leaving the machine: the name says it better than a muscle group does. */
  nickname?: string;
  status: PresenceStatus;
  /** false means "I'm back" - broadcast with the same id to clear the alert everywhere, not just locally. */
  active: boolean;
  startedAt: number;
  /** Safety net in case "I'm back" never arrives (app closed, out of range): the UI drops it once now() passes this regardless. */
  expiresAt: number;
}

/**
 * "I have read everything you sent me up to this moment."
 *
 * One mark for a whole conversation rather than one per message: a receipt
 * per message would double the traffic of a chat, and this says the same
 * thing in a packet that is the same size whether it covers one message or
 * forty. Repeating it is harmless, which matters on a radio that loses
 * things.
 */
/**
 * "It got here": sent back for every private message received, however
 * many times it arrives. Unlike a ReadReceipt it says nothing about anyone
 * looking at it - only that the sender can stop trying.
 */
export interface DeliveryReceipt {
  fromId: string;
  toId: string;
  messageId: string;
}

export interface ReadReceipt {
  fromId: string;
  toId: string;
  /** The `sentAt` of the newest message of theirs that has been read. */
  upTo: number;
}

/**
 * A profile photo, sent on its own because it is orders of magnitude bigger
 * than everything else on the mesh - and in one of two sizes, because the
 * face in a list and the portrait on a card are not worth the same number
 * of Bluetooth frames.
 */
export interface AvatarPacket {
  fromId: string;
  /** Small base64 JPEG - see sendAvatar for the size ceiling and why it exists. */
  imageBase64: string;
  /**
   * The sender's fingerprint of their photo, the same one their profile
   * announces, and the same for both sizes. It travels with the image
   * because the receiver cannot work it out: hashing a thumbnail gives a
   * different answer from hashing the portrait it was made from.
   */
  hash?: string;
  /** true for the portrait (PORTRAIT_SIDE), absent or false for the thumbnail (THUMB_SIDE). */
  full?: boolean;
  sentAt: number;
}

/** What someone is asking for when they want a photo. */
export interface AvatarRequest {
  /** true asks for the portrait; anything else asks for the thumbnail. */
  full?: boolean;
}

/** Deliberately a short fixed list: each one is a hand-drawn icon, because emoji render as tofu boxes on some devices. */
export type ReactionKind = 'ok' | 'heart' | 'laugh';

export interface PresenceReaction {
  id: string;
  /** The alert being reacted to. */
  alertId: string;
  fromId: string;
  fromLabel: string;
  /** Packed location, same reasoning as ChatMessage.fromLoc. */
  fromLoc?: string;
  kind: ReactionKind;
  sentAt: number;
}

/**
 * Someone else in the cabin, identified by their profile id - the same id
 * private messages are addressed to. Deliberately not the Bluetooth device
 * id, which differs depending on which phone is doing the scanning.
 */
export interface DiscoveredPeer {
  peerId: string;
  profile: Profile;
  /** When their last profile announcement arrived; they're dropped once it goes stale. */
  lastSeenAt: number;
  /** They announced keys this phone checked: private messages to them are sealed end to end. */
  secure?: boolean;
}
