import { BleManager, type Device, type Subscription } from 'react-native-ble-plx';
import BLEAdvertiser from 'react-native-ble-advertiser';
import * as Peripheral from 'skymatch-peripheral';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';
import type { Seat } from '../types';
import type { BleTransport } from './BleTransport';
import { useMeshStatusStore } from '../state/meshStatusStore';
import {
  frameChunks,
  encodeFrame,
  decodeFrame,
  reassembleFrames,
  newFrameId,
  SERVICE_UUID,
  PROFILE_CHAR_UUID,
} from './protocol';
import { packSeat, unpackSeat } from '../utils/seat';

// react-native-ble-advertiser injects these as runtime constants on its native
// module, but its type declarations don't expose them - values match the
// underlying Android AdvertiseSettings constants.
const ADVERTISE_MODE_LOW_LATENCY = 2;
const ADVERTISE_TX_POWER_MEDIUM = 2;

/**
 * How long a partly-arrived send is kept before its chunks are thrown away.
 * Generous, because a photo's hundreds of frames take a while to cross, but
 * finite: a send interrupted half way can never complete, since the retry
 * comes under a new frame id.
 */
const INCOMPLETE_FRAME_TTL_MS = 60_000;

/** Prefix that marks one of our advertisements in an iOS local name, followed by the seat byte in hex. */
const LOCAL_NAME_PREFIX = 'SM';

function encodeLocalName(seat: Seat | null): string {
  const seatByte = seat ? packSeat(seat) : 0xff;
  return LOCAL_NAME_PREFIX + seatByte.toString(16).padStart(2, '0');
}

function seatFromLocalName(localName: string | null): Seat | null {
  if (!localName || !localName.startsWith(LOCAL_NAME_PREFIX)) return null;
  const seatByte = parseInt(localName.slice(LOCAL_NAME_PREFIX.length, LOCAL_NAME_PREFIX.length + 2), 16);
  if (Number.isNaN(seatByte)) return null;
  return unpackSeat(seatByte);
}

/**
 * Real hardware transport. Every phone plays both BLE roles at once, because
 * neither role alone is enough for a mesh:
 *
 * - Central (react-native-ble-plx): scans for the service UUID, connects to
 *   whoever it finds, writes frames into their characteristic and subscribes
 *   for notifications back.
 * - Peripheral: advertises so others can find us, and hosts the
 *   characteristic they write into. react-native-ble-plx cannot do this at
 *   all. On Android react-native-ble-advertiser handles the advertisement;
 *   on iOS the `skymatch-peripheral` native module wraps
 *   CBPeripheralManager and also serves the GATT characteristic.
 *
 * So a link between two phones is: A connects to B as a central, writes to
 * B's characteristic, and B answers by notifying its subscribers. Only one
 * of the two needs to initiate; whichever scans first wins, and the loser's
 * connection attempt fails harmlessly.
 *
 * GATT throughput is small, so payloads are split into `Frame`s
 * (protocol.ts) tagged with a per-send frame id and reassembled by index on
 * the other end - needed for a private message's image, which is many
 * chunks.
 *
 * This cannot be exercised without two physical phones, so treat the
 * hardware paths as reviewed rather than verified.
 */
export class RealBleTransport implements BleTransport {
  private manager = new BleManager();
  private scanSubscription: Subscription | null = null;
  private removeWriteListener: (() => void) | null = null;
  private removeStateListener: (() => void) | null = null;
  private removeSubscriberListener: (() => void) | null = null;
  /** Device ids with a connection attempt in flight, so duplicate scan hits don't pile up more. */
  private connecting = new Set<string>();
  private connectedDevices = new Map<string, Device>();
  private peerSeenListeners = new Set<(peerId: string, rssi: number, seat: Seat | null) => void>();
  private peerLostListeners = new Set<(peerId: string) => void>();
  private envelopeListeners = new Set<(raw: string, fromPeerId: string) => void>();
  private staleCheckTimer: ReturnType<typeof setInterval> | null = null;
  private lastSeenAt = new Map<string, number>();
  /** frameId -> the chunks of that send so far, across all devices - frame ids are globally unique so one map is enough. */
  private pendingFrames = new Map<string, { parts: Map<number, string>; touchedAt: number }>();
  /** profile id -> the Bluetooth device id we reach that person through. */
  private identities = new Map<string, string>();

  async start(myPeerId: string, seat: Seat | null): Promise<void> {
    await this.startAdvertising(seat);
    this.startScanning();
    this.staleCheckTimer = setInterval(() => {
      this.pruneStalePeers();
      this.prunePendingFrames();
    }, 5000);
    void myPeerId; // full peer id is exchanged over GATT once connected; it doesn't fit in an advert
  }

  async stop(): Promise<void> {
    this.scanSubscription?.remove();
    this.scanSubscription = null;
    this.manager.stopDeviceScan();
    this.removeWriteListener?.();
    this.removeWriteListener = null;
    this.removeStateListener?.();
    this.removeStateListener = null;
    this.removeSubscriberListener?.();
    this.removeSubscriberListener = null;
    useMeshStatusStore.getState().reset();
    if (Platform.OS === 'android') {
      try {
        await BLEAdvertiser.stopBroadcast();
      } catch {
        // advertiser was never started (e.g. permission denied); nothing to clean up
      }
    } else {
      await Peripheral.stop();
    }
    if (this.staleCheckTimer) clearInterval(this.staleCheckTimer);
    this.connectedDevices.clear();
    this.identities.clear();
    this.pendingFrames.clear();
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

  /**
   * Only ever writes over a connection we opened ourselves, and says so
   * honestly when it can't.
   *
   * The router addresses private messages by profile id, while this map is
   * keyed by Bluetooth device id, so those lookups always miss. Falling back
   * to notifying our subscribers here used to report success anyway - but a
   * notification only reaches phones that connected to *us*, which need not
   * include the intended recipient, and the router took that as delivered
   * and skipped the flood. Private messages were quietly lost. Returning
   * false instead lets the router flood, which does reach them.
   */
  async sendToPeer(peerId: string, raw: string): Promise<boolean> {
    // The router addresses people by profile id; this map is keyed by
    // Bluetooth device id. Translate when we have learned the pairing, and
    // otherwise treat the id as a device id (which is what a relay hop
    // passes in).
    const deviceId = this.identities.get(peerId) ?? peerId;
    const device = this.connectedDevices.get(deviceId);
    if (!device) return false;

    try {
      for (const frame of frameChunks(raw, newFrameId())) {
        await device.writeCharacteristicWithResponseForService(
          SERVICE_UUID,
          PROFILE_CHAR_UUID,
          Buffer.from(encodeFrame(frame), 'utf8').toString('base64'),
        );
      }
      return true;
    } catch {
      // A link can die mid-write, and the failure used to escape as an
      // unhandled rejection that also aborted the broadcast to everyone
      // else. Drop the peer and report failure so the router floods instead.
      this.dropDevice(deviceId);
      return false;
    }
  }

  /** Only ever records a connection we opened ourselves, so the id is one `sendToPeer` can use. */
  notePeerIdentity(deviceId: string, profileId: string) {
    if (!this.connectedDevices.has(deviceId)) return;
    this.identities.set(profileId, deviceId);
  }

  /** UUIDs come back in whatever case the platform feels like, so compare them folded. */
  private async hasOurCharacteristic(device: Device): Promise<boolean> {
    try {
      const services = await device.services();
      const service = services.find((candidate) => candidate.uuid.toLowerCase() === SERVICE_UUID.toLowerCase());
      if (!service) return false;
      const characteristics = await service.characteristics();
      return characteristics.some((candidate) => candidate.uuid.toLowerCase() === PROFILE_CHAR_UUID.toLowerCase());
    } catch {
      return false;
    }
  }

  private dropDevice(deviceId: string) {
    this.connectedDevices.delete(deviceId);
    // Whoever we reached through this connection has to be looked up again,
    // or we would keep writing into a link that is gone.
    this.identities.forEach((mapped, profileId) => {
      if (mapped === deviceId) this.identities.delete(profileId);
    });
    useMeshStatusStore.getState().setConnected(this.connectedDevices.size);
  }

  async broadcast(raw: string, excludePeerId?: string): Promise<void> {
    const targets = Array.from(this.connectedDevices.keys()).filter((peerId) => peerId !== excludePeerId);
    await Promise.all(targets.map((peerId) => this.sendToPeer(peerId, raw)));

    // Also push it to anyone who connected to us rather than the other way
    // round: they never appear in connectedDevices, so without this they'd
    // only ever hear from us when they happen to write first.
    if (Peripheral.isSupported) {
      for (const frame of frameChunks(raw, newFrameId())) {
        await Peripheral.notify(Buffer.from(encodeFrame(frame), 'utf8').toString('base64'));
      }
    }
  }

  private async startAdvertising(seat: Seat | null) {
    if (Platform.OS === 'android') {
      const seatByte = seat ? packSeat(seat) : 0xff;
      await BLEAdvertiser.setCompanyId(0xffff);
      await BLEAdvertiser.broadcast(SERVICE_UUID, [seatByte], {
        advertiseMode: ADVERTISE_MODE_LOW_LATENCY,
        txPowerLevel: ADVERTISE_TX_POWER_MEDIUM,
        connectable: true,
        includeDeviceName: false,
        includeTxPowerLevel: false,
      });
      return;
    }

    useMeshStatusStore.getState().setPeripheralSupported(Peripheral.isSupported);
    this.removeStateListener = Peripheral.addStateListener(({ state }) => {
      useMeshStatusStore.getState().setPeripheralState(state);
    });
    this.removeSubscriberListener = Peripheral.addSubscriberListener(({ count }) => {
      useMeshStatusStore.getState().setSubscribers(count);
    });
    this.removeWriteListener = Peripheral.addWriteListener(({ value, centralId }) => {
      this.handleIncomingFrame(Buffer.from(value, 'base64').toString('utf8'), centralId);
    });
    await Peripheral.start(SERVICE_UUID, PROFILE_CHAR_UUID, encodeLocalName(seat));
    useMeshStatusStore.getState().setAdvertising(Peripheral.isSupported);
  }

  private startScanning() {
    this.scanSubscription = this.manager.onStateChange((state) => {
      useMeshStatusStore.getState().setCentralState(state);
      if (state !== 'PoweredOn') return;
      this.manager.startDeviceScan([SERVICE_UUID], { allowDuplicates: true }, (error, device) => {
        if (error || !device) return;
        this.handleDeviceSeen(device);
      });
    }, true);
  }

  private handleDeviceSeen(device: Device) {
    // Android peers put the seat in manufacturer data; iOS peers can't (see
    // SkyMatchPeripheral.m) and put it in the local name instead.
    const manufacturerByte = device.manufacturerData
      ? Buffer.from(device.manufacturerData, 'base64')[0]
      : undefined;
    const seat =
      manufacturerByte !== undefined && manufacturerByte !== 0xff
        ? unpackSeat(manufacturerByte)
        : seatFromLocalName(device.localName);

    this.lastSeenAt.set(device.id, Date.now());
    useMeshStatusStore.getState().noteScanHit(device.id);
    this.peerSeenListeners.forEach((listener) => listener(device.id, device.rssi ?? -100, seat));

    // Scanning with allowDuplicates fires many times a second, and a device
    // only lands in connectedDevices once its connection has fully settled.
    // Without this guard every one of those callbacks starts another
    // connection to the same phone, and the pile-up stops any of them from
    // ever completing.
    if (!this.connectedDevices.has(device.id) && !this.connecting.has(device.id)) {
      this.connecting.add(device.id);
      this.connectAndSubscribe(device)
        .catch(() => {
          // Both sides racing to connect is normal in a mesh; the loser just retries later.
        })
        .finally(() => this.connecting.delete(device.id));
    }
  }

  private async connectAndSubscribe(device: Device) {
    const connected = await device.connect();
    await connected.discoverAllServicesAndCharacteristics();

    // Confirm the characteristic is really there before treating this as a
    // usable link. CoreBluetooth caches a peripheral's GATT database, so a
    // phone that once ran a build without our service keeps answering from
    // that stale, empty cache: it advertises, it connects, and every write
    // then fails with "characteristic not found". Holding on to such a
    // connection means retrying against it forever.
    if (!(await this.hasOurCharacteristic(connected))) {
      await connected.cancelConnection().catch(() => {});
      return;
    }

    this.connectedDevices.set(device.id, connected);
    useMeshStatusStore.getState().setConnected(this.connectedDevices.size);

    connected.monitorCharacteristicForService(SERVICE_UUID, PROFILE_CHAR_UUID, (error, characteristic) => {
      if (error || !characteristic?.value) return;
      this.handleIncomingFrame(Buffer.from(characteristic.value, 'base64').toString('utf8'), device.id);
    });

    connected.onDisconnected(() => this.dropDevice(device.id));
  }

  /** Buffers one frame and emits the envelope once every chunk of that send has arrived. */
  private handleIncomingFrame(rawFrame: string, fromPeerId: string) {
    const frame = decodeFrame(rawFrame);
    if (!frame) return;

    const pending = this.pendingFrames.get(frame.id) ?? { parts: new Map<number, string>(), touchedAt: 0 };
    pending.parts.set(frame.index, frame.part);
    pending.touchedAt = Date.now();
    this.pendingFrames.set(frame.id, pending);

    const raw = reassembleFrames(pending.parts, frame.total);
    if (raw === null) return; // still waiting on more chunks of this frame
    this.pendingFrames.delete(frame.id);
    this.envelopeListeners.forEach((listener) => listener(raw, fromPeerId));
  }

  /**
   * Throws away half-arrived sends. A photo is hundreds of frames and a link
   * that dies in the middle of one leaves its chunks here forever: they can
   * never be completed, because the sender starts the retry under a fresh
   * frame id. Without this they just accumulate.
   */
  private prunePendingFrames() {
    const now = Date.now();
    this.pendingFrames.forEach((pending, frameId) => {
      if (now - pending.touchedAt > INCOMPLETE_FRAME_TTL_MS) this.pendingFrames.delete(frameId);
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
