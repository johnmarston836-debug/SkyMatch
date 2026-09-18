import { BleManager, type Device, type Subscription } from 'react-native-ble-plx';
import BLEAdvertiser from 'react-native-ble-advertiser';
import * as Peripheral from 'skymatch-peripheral';
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
  private connectedDevices = new Map<string, Device>();
  private peerSeenListeners = new Set<(peerId: string, rssi: number, seat: Seat | null) => void>();
  private peerLostListeners = new Set<(peerId: string) => void>();
  private envelopeListeners = new Set<(raw: string, fromPeerId: string) => void>();
  private staleCheckTimer: ReturnType<typeof setInterval> | null = null;
  private lastSeenAt = new Map<string, number>();
  /** frameId -> (chunk index -> chunk part), across all devices - frame ids are globally unique so one map is enough. */
  private pendingFrames = new Map<string, Map<number, string>>();

  async start(myPeerId: string, seat: Seat | null): Promise<void> {
    await this.startAdvertising(seat);
    this.startScanning();
    this.staleCheckTimer = setInterval(() => this.pruneStalePeers(), 5000);
    void myPeerId; // full peer id is exchanged over GATT once connected; it doesn't fit in an advert
  }

  async stop(): Promise<void> {
    this.scanSubscription?.remove();
    this.scanSubscription = null;
    this.manager.stopDeviceScan();
    this.removeWriteListener?.();
    this.removeWriteListener = null;
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
   * Writes to the peer over our outgoing connection when we have one. When we
   * don't, the peer is someone who connected to *us*, so the only way back is
   * notifying our subscribers - which reaches them along with everyone else
   * subscribed. The mesh router dedups the extra copies.
   */
  async sendToPeer(peerId: string, raw: string): Promise<boolean> {
    const device = this.connectedDevices.get(peerId);
    const frames = frameChunks(raw, newId());

    if (!device) {
      if (!Peripheral.isSupported) return false;
      let sent = false;
      for (const frame of frames) {
        sent = await Peripheral.notify(Buffer.from(encodeFrame(frame), 'utf8').toString('base64'));
      }
      return sent;
    }

    for (const frame of frames) {
      await device.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        PROFILE_CHAR_UUID,
        Buffer.from(encodeFrame(frame), 'utf8').toString('base64'),
      );
    }
    return true;
  }

  async broadcast(raw: string, excludePeerId?: string): Promise<void> {
    const targets = Array.from(this.connectedDevices.keys()).filter((peerId) => peerId !== excludePeerId);
    await Promise.all(targets.map((peerId) => this.sendToPeer(peerId, raw)));

    // Also push it to anyone who connected to us rather than the other way
    // round: they never appear in connectedDevices, so without this they'd
    // only ever hear from us when they happen to write first.
    if (Peripheral.isSupported) {
      for (const frame of frameChunks(raw, newId())) {
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

    this.removeWriteListener = Peripheral.addWriteListener(({ value, centralId }) => {
      this.handleIncomingFrame(Buffer.from(value, 'base64').toString('utf8'), centralId);
    });
    await Peripheral.start(SERVICE_UUID, PROFILE_CHAR_UUID, encodeLocalName(seat));
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
      this.handleIncomingFrame(Buffer.from(characteristic.value, 'base64').toString('utf8'), device.id);
    });

    connected.onDisconnected(() => {
      this.connectedDevices.delete(device.id);
    });
  }

  /** Buffers one frame and emits the envelope once every chunk of that send has arrived. */
  private handleIncomingFrame(rawFrame: string, fromPeerId: string) {
    const frame = decodeFrame(rawFrame);
    if (!frame) return;

    const parts = this.pendingFrames.get(frame.id) ?? new Map<number, string>();
    parts.set(frame.index, frame.part);
    this.pendingFrames.set(frame.id, parts);

    const raw = reassembleFrames(parts, frame.total);
    if (raw === null) return; // still waiting on more chunks of this frame
    this.pendingFrames.delete(frame.id);
    this.envelopeListeners.forEach((listener) => listener(raw, fromPeerId));
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
