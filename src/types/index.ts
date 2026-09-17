export type SeatLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'J' | 'K';

export interface Seat {
  row: number; // 1-99
  letter: SeatLetter;
}

export interface Profile {
  id: string; // stable local UUID, regenerated per install (not tied to BLE MAC)
  name: string;
  age: number;
  bio: string;
  interests: string[];
  photoUri?: string; // local file URI; never transmitted at full resolution over mesh
  seat: Seat;
}

export type SwipeDirection = 'like' | 'pass';

export interface SwipeAction {
  fromId: string;
  toId: string;
  direction: SwipeDirection;
  timestamp: number;
}

export interface Match {
  id: string; // deterministic: sorted(profileAId, profileBId)
  peerId: string;
  peerProfile: Profile;
  matchedAt: number;
}

export interface ChatMessage {
  id: string; // uuid, used for mesh dedup
  matchId: string;
  fromId: string;
  toId: string;
  body: string;
  sentAt: number;
  deliveredAt?: number;
  /** true when this bubble was relayed to us over the mesh rather than received directly */
  viaMesh?: boolean;
}

/** Discovered peer, kept fresh by repeated BLE adverts; pruned when it goes stale. */
export interface DiscoveredPeer {
  peerId: string;
  profile?: Profile; // populated once full GATT exchange completes
  seat?: Seat; // available immediately from the advertisement, before full exchange
  rssi: number;
  lastSeenAt: number;
  directlyConnectable: boolean;
}
