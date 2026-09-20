export type SeatLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'J' | 'K';

export interface Seat {
  row: number; // 1-99
  letter: SeatLetter;
}

export interface Profile {
  id: string; // stable local UUID, regenerated per install (not tied to BLE MAC)
  seat: Seat;
  nickname: string; // shown alongside the seat badge; the seat itself is the real identity
  /** Optional free-text contact (Instagram handle, WhatsApp number, ...), shown only on the profile screen someone reaches by tapping your name - never in the group chat or the passenger list. */
  contact?: string;
}

export type MessageScope = 'group' | 'private';

export interface ChatMessage {
  id: string; // uuid, used for mesh dedup
  scope: MessageScope;
  fromId: string;
  fromSeat: Seat;
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
  seat: Seat;
  status: PresenceStatus;
  /** false means "I'm back" - broadcast with the same id to clear the alert everywhere, not just locally. */
  active: boolean;
  startedAt: number;
  /** Safety net in case "I'm back" never arrives (app closed, out of range): the UI drops it once now() passes this regardless. */
  expiresAt: number;
}

/** Deliberately a short fixed list: each one is a hand-drawn icon, because emoji render as tofu boxes on some devices. */
export type ReactionKind = 'ok' | 'heart' | 'laugh';

export interface PresenceReaction {
  id: string;
  /** The alert being reacted to. */
  alertId: string;
  fromId: string;
  fromSeat: Seat;
  kind: ReactionKind;
  sentAt: number;
}

/** Discovered peer, kept fresh by repeated BLE adverts; pruned when it goes stale. */
export interface DiscoveredPeer {
  peerId: string;
  profile?: Profile; // populated once the lightweight profile broadcast is received
  seat?: Seat; // available immediately from the advertisement, before the profile arrives
  rssi: number;
  lastSeenAt: number;
}
