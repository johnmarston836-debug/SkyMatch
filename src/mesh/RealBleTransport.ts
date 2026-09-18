import { BleManager, type Device, type Subscription } from 'react-native-ble-plx';
import BLEAdvertiser from 'react-native-ble-advertiser';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';
import type { Seat } from '../types';
import type { BleTransport } from './BleTransport';
import { frameChunks, encodeFrame, decodeFrame, reassembleFrames, SERVICE_UUID, PROFILE_CHAR_UUID } from './protocol';
import { packSeat, unpackSeat } from '../utils/seat';
import { newId } from '../utils/id';

// react-native-ble-advertiser injects these as runtime constants on its native
// module, but its type declarations don't expose them - values match the
// underlying Android AdvertiseSettings constants.
const ADVERTISE_MODE_LOW_LATENCY = 2;
const ADVERTISE_TX_POWER_MEDIUM = 2;

/**
 * Real hardware transport. This is the one piece of the app that cannot be
 * verified without two physical phones, so read this carefully before
 * relying on it:
 *
 * - react-native-ble-plx only implements the BLE *central* role (scanning
 *   and connecting as a client). It cannot advertise or accept incoming
 *   connections.
 * - react-native-ble-advertiser fills the *peripheral* role on Android
 *   (BluetoothLeAdvertiser) so a phone can be discovered by others while
 *   also scanning itself - required for a true mesh where every node is
 *   symmetric. Its iOS support is unreliable for background/foreground
 *   peripheral GATT serving; CoreBluetooth's CBPeripheralManager would need
 *   a small native module (Swift) for a production-quality iOS build. This
 *   file targets Android as the reference platform and degrades to
 *   scan-only (you can see people, they may not see you) on iOS until that
 *   native module is written.
 * - GATT throughput is small (a few hundred bytes/connection interval), so
 *   payloads are split into `Frame`s (protocol.ts) tagged with a per-send
 *   frame id and reassembled by index on the other end - needed for a
 *   private message's image, which is many chunks, not just one.
 *
 * None of this can be exercised by an automated agent without real
 * hardware; treat this class as a reviewed-but-untested reference
 * implementation, not a verified one.
 */
export class RealBleTransport implements BleTransport {
  private manager = new BleManager();
  private scanSubscription: Subscription | null = null;
  private connectedDevices = new Map<string, Device>();
  private peerSeenListeners = new Set<(peerId: string, rssi: number, seat: Seat | null) => void>();
  private peerLostListeners = new Set<(peerId: string) => void>();
  private envelopeListeners = new Set<(raw: string, fromPeerId: string) => void>();
  private staleCheckTimer: ReturnType<typeof setInterval> | null = null;
  private lastSeenAt = new Map<string, number>();
  /** frameId -> (chunk index -> chunk part), across all devices - frame ids are globally unique so one map is enough. */
  private pendingFrames = new Map<string, Map<number, string>>();

  async start(myPeerId: string, seat: Seat | null): Promise<void> {
    await this.startAdvertising(myPeerId, seat);
    this.startScanning();
    this.staleCheckTimer = setInterval(() => this.pruneStalePeers(), 5000);
  }

  async stop(): Promise<void> {
    this.scanSubscription?.remove();
    this.scanSubscription = null;
    this.manager.stopDeviceScan();
    if (Platform.OS === 'android') {
      try {
        await BLEAdvertiser.stopBroadcast();
      } catch {
        // advertiser was never started (e.g. permission denied); nothing to clean up
      }
    }
    if (this.staleCheckTimer) clearInterval(this.staleCheckTimer);
    this.connectedDevices.clear();
  }

  onPeerSeen(listener: (peerId: string, rssi: number, seat: Seat | null) => void) {
    this.peerSeenListeners.add(listener);
    return () => this.peerSeenListeners.delete(listener);
  }

  onPeerLost(listener: (peerId: string) => void) {
    this.peerLostListeners.add(listener);
    return () => this.peerLostListeners.delete(listener);
  }

  onEnvelope(listener: (raw: string, fromPeerId: string) => void) {
    this.envelopeListeners.add(listener);
    return () => this.envelopeListeners.delete(listener);
  }

  async sendToPeer(peerId: string, raw: string): Promise<boolean> {
    const device = this.connectedDevices.get(peerId);
    if (!device) return false;
    for (const frame of frameChunks(raw, newId())) {
      await device.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        PROFILE_CHAR_UUID,
        Buffer.from(encodeFrame(frame), 'utf8').toString('base64'),
      );
    }
    return true;
  }

  async broadcast(raw: string, excludePeerId?: string): Promise<void> {
    await Promise.all(
      Array.from(this.connectedDevices.keys())
        .filter((peerId) => peerId !== excludePeerId)
        .map((peerId) => this.sendToPeer(peerId, raw)),
    );
  }

  private async startAdvertising(myPeerId: string, seat: Seat | null) {
    if (Platform.OS !== 'android') return; // see class doc: iOS peripheral mode needs a native module
    const seatByte = seat ? packSeat(seat) : 0xff;
    await BLEAdvertiser.setCompanyId(0xffff);
    await BLEAdvertiser.broadcast(SERVICE_UUID, [seatByte], {
      advertiseMode: ADVERTISE_MODE_LOW_LATENCY,
      txPowerLevel: ADVERTISE_TX_POWER_MEDIUM,
      connectable: true,
      includeDeviceName: false,
      includeTxPowerLevel: false,
    });
    void myPeerId; // full peer id is exchanged over GATT once connected, not fit in the advert
  }

  private startScanning() {
    this.scanSubscription = this.manager.onStateChange((state) => {
      if (state !== 'PoweredOn') return;
      this.manager.startDeviceScan([SERVICE_UUID], { allowDuplicates: true }, (error, device) => {
        if (error || !device) return;
        this.handleDeviceSeen(device);
      });
    }, true);
  }

  private handleDeviceSeen(device: Device) {
    const seatByte = device.manufacturerData ? Buffer.from(device.manufacturerData, 'base64')[0] : 0xff;
    const seat = seatByte !== undefined ? unpackSeat(seatByte) : null;
    this.lastSeenAt.set(device.id, Date.now());
    this.peerSeenListeners.forEach((listener) => listener(device.id, device.rssi ?? -100, seat));

    if (!this.connectedDevices.has(device.id)) {
      this.connectAndSubscribe(device).catch(() => {
        // connection races with the other side also trying to connect are expected in a mesh; safe to ignore
      });
    }
  }

  private async connectAndSubscribe(device: Device) {
    const connected = await device.connect();
    await connected.discoverAllServicesAndCharacteristics();
    this.connectedDevices.set(device.id, connected);

    connected.monitorCharacteristicForService(SERVICE_UUID, PROFILE_CHAR_UUID, (error, characteristic) => {
      if (error || !characteristic?.value) return;
      const frame = decodeFrame(Buffer.from(characteristic.value, 'base64').toString('utf8'));
      if (!frame) return;

      const parts = this.pendingFrames.get(frame.id) ?? new Map<number, string>();
      parts.set(frame.index, frame.part);
      this.pendingFrames.set(frame.id, parts);

      const raw = reassembleFrames(parts, frame.total);
      if (raw === null) return; // still waiting on more chunks of this frame
      this.pendingFrames.delete(frame.id);
      this.envelopeListeners.forEach((listener) => listener(raw, device.id));
    });

    connected.onDisconnected(() => {
      this.connectedDevices.delete(device.id);
    });
  }

  private pruneStalePeers() {
    const now = Date.now();
    this.lastSeenAt.forEach((seenAt, peerId) => {
      if (now - seenAt > 15_000) {
        this.lastSeenAt.delete(peerId);
        this.peerLostListeners.forEach((listener) => listener(peerId));
      }
    });
  }
}
