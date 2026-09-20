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
}

export type MessageScope = 'group' | 'private';

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
  fromNickname: string;
  toId?: string; // only set for scope 'private'
  body: string;
  /** Small (<20KB) JPEG, base64-encoded. Private messages only - see MeshService docs on why group messages never carry images. */
  imageBase64?: string;
  sentAt: number;
  /** true when this bubble was relayed to us over the mesh rather than received directly */
  viaMesh?: boolean;
}

export type PresenceStatus = 'standing';

export interface PresenceAlert {
  id: string; // same id reused for the "back" broadcast that cancels this alert
  fromId: string;
  /** Rendered location, same reasoning as ChatMessage.fromLabel. */
  label: string;
  status: PresenceStatus;
  /** false means "I'm back" - broadcast with the same id to clear the alert everywhere, not just locally. */
  active: boolean;
  startedAt: number;
  /** Safety net in case "I'm back" never arrives (app closed, out of range): the UI drops it once now() passes this regardless. */
  expiresAt: number;
}

/** A profile photo, sent on its own because it is orders of magnitude bigger than everything else on the mesh. */
export interface AvatarPacket {
  fromId: string;
  /** Small base64 JPEG - see sendAvatar for the size ceiling and why it exists. */
  imageBase64: string;
  sentAt: number;
}

/** Deliberately a short fixed list: each one is a hand-drawn icon, because emoji render as tofu boxes on some devices. */
export type ReactionKind = 'ok' | 'heart' | 'laugh';

export interface PresenceReaction {
  id: string;
  /** The alert being reacted to. */
  alertId: string;
  fromId: string;
  fromLabel: string;
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
}
