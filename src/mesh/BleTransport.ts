import type { UserLocation } from '../types';

/**
 * Platform-agnostic contract the rest of the app codes against. Two
 * implementations exist:
 *  - `MockBleTransport`: simulated peers, no hardware, used in dev/demo
 *    builds and in the simulator (Web Bluetooth/iOS simulator/most Android
 *    emulators can't do real BLE peripheral+central at once anyway).
 *  - `RealBleTransport`: talks to actual hardware via react-native-ble-plx
 *    (central role) and react-native-ble-advertiser (peripheral role). See
 *    that file for the platform caveats — this is the hard part of the app.
 */
export interface BleTransport {
  start(myPeerId: string, location: UserLocation | null): Promise<void>;
  stop(): Promise<void>;

  /** Fires whenever an advertisement from a nearby peer is seen or refreshed. */
  onPeerSeen(listener: (peerId: string, rssi: number, location: UserLocation | null) => void): () => void;

  /** Fires when a peer hasn't been seen recently and should be treated as out of range. */
  onPeerLost(listener: (peerId: string) => void): () => void;

  /** Fires when a raw envelope (JSON string, already reassembled) arrives from a direct connection. */
  onEnvelope(listener: (raw: string, fromPeerId: string) => void): () => void;

  /** Best-effort direct delivery to a peer currently in range; mesh relay is handled by MeshRouter, not here. */
  sendToPeer(peerId: string, raw: string): Promise<boolean>;

  /** Broadcast to every directly-connected peer, used by the router to flood a relay packet outward. */
  broadcast(raw: string, excludePeerId?: string): Promise<void>;

  /**
   * Optional: tells the transport that the connection it knows as
   * `deviceId` belongs to the person whose profile id is `profileId`. The
   * router addresses everything by profile id, while a Bluetooth connection
   * is identified by a per-scanner device id, so without this every direct
   * send misses and has to be flooded to the whole cabin instead.
   */
  notePeerIdentity?(deviceId: string, profileId: string): void;
}
