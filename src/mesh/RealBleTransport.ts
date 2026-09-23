import { BleManager, ConnectionPriority, type Device, type Subscription } from 'react-native-ble-plx';
import * as Peripheral from 'skymatch-peripheral';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';
import type { UserLocation } from '../types';
import type { BleTransport } from './BleTransport';
import { useMeshStatusStore } from '../state/meshStatusStore';
import {
  frameChunks,
  frameChunksForLink,
  encodeFrame,
  decodeFrame,
  isRepairFrame,
  missingIndices,
  reassembleFrames,
  repairFrame,
  newFrameId,
  type Frame,
  SERVICE_UUID,
  PROFILE_CHAR_UUID,
  MANUFACTURER_ID,
  PEER_STALE_MS,
} from './protocol';
import { packLocation, unpackLocation } from '../utils/location';

/**
 * The MTU an Android central asks for when it connects.
 *
 * Android starts every link at 23 bytes and never raises it unless asked,
 * while a frame is sized for about 180 (see CHUNK_SIZE in protocol.ts).
 * Notifications longer than the MTU are cut short without a word, so an
 * Android phone connected to anyone received nothing but torn frames, and
 * its own writes reached iOS in pieces. iOS negotiates this by itself.
 */
const ANDROID_MTU = 247;

/**
 * Most half-arrived sends kept at once. Each is a photo at most, and a
 * phone that opens hundreds of sends it never finishes is not someone we
 * owe the memory to.
 */
const MAX_PENDING_SENDS = 64;

/**
 * How long a partly-arrived send is kept before its chunks are thrown away.
 * Generous, because a photo's hundreds of frames take a while to cross, but
 * finite: a send interrupted half way can never complete, since the retry
 * comes under a new frame id.
 */
const INCOMPLETE_FRAME_TTL_MS = 60_000;

/** A send is assumed stalled, rather than merely slow, after this long without a chunk. */
const STALLED_MS = 2_500;

/** How long the chunks of an outgoing send are kept around in case they have to be repeated. */
const SENT_FRAME_TTL_MS = 60_000;

/**
 * How many repair rounds in a row may bring nothing before a send is given
 * up on. Counted from the last round that recovered anything: a request
 * names at most MAX_REPAIR_REQUEST chunks, so a photo that lost a long run
 * of them needs many rounds - and used to be abandoned after six whatever
 * they were achieving. The message layer resends the whole thing anyway if
 * it never arrives (see delivery.ts), so this only has to cover a bad
 * patch, not a peer who left.
 */
const MAX_REPAIR_ROUNDS = 6;

/**
 * Most links an iPhone keeps waiting to come back at once (see recoverLink).
 * Android phones change their Bluetooth address every so often, so a phone
 * that walked off can leave a wait behind that will never complete; the
 * oldest is cancelled to make room.
 */
const MAX_PENDING_RECONNECTS = 8;

/** The ATT protocol's own ceiling on one value, whatever the MTU. */
const MAX_ATT_VALUE = 512;

/**
 * Prefix that marks one of our advertisements in an iOS local name, followed
 * by the packed location (see packLocation): a venue letter and one or two
 * bytes in hex, seven characters at most. An advertisement carrying a
 * 128-bit service UUID has almost nothing left over, so this is the whole
 * budget.
 */
const LOCAL_NAME_PREFIX = 'SM';

function encodeLocalName(location: UserLocation | null): string {
  return LOCAL_NAME_PREFIX + (location ? packLocation(location) : '');
}

function locationFromLocalName(localName: string | null): UserLocation | null {
  if (!localName || !localName.startsWith(LOCAL_NAME_PREFIX)) return null;
  return unpackLocation(localName.slice(LOCAL_NAME_PREFIX.length));
}

/**
 * Where an advertisement says its phone is.
 *
 * iOS puts it in the local name. Android can't choose its local name - that
 * is the phone's Bluetooth name, for every app - so the same string travels
 * as manufacturer data in the scan response instead: two bytes of company
 * id, little-endian, then the characters.
 */
export function locationFromAdvert(localName: string | null, manufacturerData: string | null): UserLocation | null {
  const fromName = locationFromLocalName(localName);
  if (fromName || !manufacturerData) return fromName;
  const bytes = Buffer.from(manufacturerData, 'base64');
  if (bytes.length < 3 || bytes.readUInt16LE(0) !== MANUFACTURER_ID) return null;
  return locationFromLocalName(bytes.toString('latin1', 2));
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
 *   all, so the `skymatch-peripheral` native module does: it wraps
 *   CBPeripheralManager on iOS and BluetoothGattServer plus
 *   BluetoothLeAdvertiser on Android, behind the same calls.
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
  private peerSeenListeners = new Set<(peerId: string, rssi: number, location: UserLocation | null) => void>();
  private peerLostListeners = new Set<(peerId: string) => void>();
  private envelopeListeners = new Set<(raw: string, fromPeerId: string) => void>();
  private staleCheckTimer: ReturnType<typeof setInterval> | null = null;
  private repairTimer: ReturnType<typeof setInterval> | null = null;
  private lastSeenAt = new Map<string, number>();
  /** frameId -> the chunks of that send so far, across all devices - frame ids are globally unique so one map is enough. */
  private pendingFrames = new Map<
    string,
    {
      parts: Map<number, string>;
      touchedAt: number;
      total: number;
      from: string;
      /** Repair rounds since the last one that brought anything back. */
      rounds: number;
      /** How many chunks were in when the last repair round went out. */
      partsAtRound: number;
    }
  >();
  /**
   * The chunks we sent, kept so a receiver can ask for the ones that never
   * arrived. A photo is a few dozen kilobytes and they are dropped after a
   * minute; sending it all again from scratch costs far more.
   */
  private sentFrames = new Map<string, { frames: Frame[]; sentAt: number }>();
  /** profile id -> the Bluetooth device id we reach that person through. */
  private identities = new Map<string, string>();
  /** Device id -> when we started waiting for a dropped link to come back, oldest first. */
  private reconnecting = new Map<string, number>();
  /** Connections whose characteristic takes writes without a response; see writeFrames. */
  private fastWriters = new Set<string>();
  private running = false;

  async start(myPeerId: string, location: UserLocation | null): Promise<void> {
    this.running = true;
    await this.startAdvertising(location);
    this.startScanning();
    this.staleCheckTimer = setInterval(() => {
      this.pruneStalePeers();
      this.prunePendingFrames();
    }, 5000);
    this.repairTimer = setInterval(() => this.requestRepairs(), 1500);
    void myPeerId; // full peer id is exchanged over GATT once connected; it doesn't fit in an advert
  }

  async stop(): Promise<void> {
    this.running = false;
    this.reconnecting.forEach((_since, deviceId) => {
      this.manager.cancelDeviceConnection(deviceId).catch(() => {});
    });
    this.reconnecting.clear();
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
    await Peripheral.stop().catch(() => {});
    if (this.staleCheckTimer) clearInterval(this.staleCheckTimer);
    if (this.repairTimer) clearInterval(this.repairTimer);
    this.connectedDevices.clear();
    this.fastWriters.clear();
    this.identities.clear();
    this.pendingFrames.clear();
    this.sentFrames.clear();
  }

  onPeerSeen(listener: (peerId: string, rssi: number, location: UserLocation | null) => void) {
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

    const frames = this.framesFor(device, raw);
    this.rememberSent(frames);

    try {
      await this.writeFrames(deviceId, device, frames);
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

  /**
   * Frames sized for this connection. The negotiated MTU, less the three
   * bytes of ATT header, is what one packet carries; a link that never
   * reported one gets the small fixed frames every path can take.
   */
  private framesFor(device: Device, raw: string): Frame[] {
    const mtu = device.mtu ?? 0;
    return frameChunksForLink(raw, newFrameId(), Math.min(mtu - 3, MAX_ATT_VALUE));
  }

  /**
   * Writes a whole send, back to back.
   *
   * Every frame used to wait for the other phone's "got it" before the next
   * one went, and that round trip, not the radio, was what made a photo
   * take half a minute. Now all but the last go without a response - both
   * Bluetooth stacks still hold each one until there is room for it, and
   * the link layer delivers them in order - and the last is written with
   * one. Its answer can only come once everything before it has been taken,
   * so the send still fails loudly on a link that died, and the router
   * floods instead. A frame lost on the way anyway is what repair frames
   * and delivery receipts are for.
   */
  private async writeFrames(deviceId: string, device: Device, frames: Frame[]) {
    const fast = this.fastWriters.has(deviceId);
    for (let i = 0; i < frames.length; i++) {
      const value = Buffer.from(encodeFrame(frames[i]), 'utf8').toString('base64');
      if (fast && i < frames.length - 1) {
        await device.writeCharacteristicWithoutResponseForService(SERVICE_UUID, PROFILE_CHAR_UUID, value);
      } else {
        await device.writeCharacteristicWithResponseForService(SERVICE_UUID, PROFILE_CHAR_UUID, value);
      }
    }
  }

  /**
   * Whether the connection has our characteristic, and notes whether it
   * takes writes without a response. UUIDs come back in whatever case the
   * platform feels like, so they are compared folded.
   */
  private async hasOurCharacteristic(device: Device, deviceId: string): Promise<boolean> {
    try {
      const services = await device.services();
      const service = services.find((candidate) => candidate.uuid.toLowerCase() === SERVICE_UUID.toLowerCase());
      if (!service) return false;
      const characteristics = await service.characteristics();
      const ours = characteristics.find((candidate) => candidate.uuid.toLowerCase() === PROFILE_CHAR_UUID.toLowerCase());
      if (!ours) return false;
      if (ours.isWritableWithoutResponse) this.fastWriters.add(deviceId);
      else this.fastWriters.delete(deviceId);
      return true;
    } catch {
      return false;
    }
  }

  private dropDevice(deviceId: string) {
    this.connectedDevices.delete(deviceId);
    this.fastWriters.delete(deviceId);
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
      const frames = frameChunks(raw, newFrameId());
      // Remembered like the written ones: a phone that connected to us can
      // only be answered by notifying, and it needs to be able to ask for
      // the chunks it missed too.
      this.rememberSent(frames);
      for (const frame of frames) {
        await Peripheral.notify(Buffer.from(encodeFrame(frame), 'utf8').toString('base64'));
      }
    }
  }

  private async startAdvertising(location: UserLocation | null) {
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
    await Peripheral.start(SERVICE_UUID, PROFILE_CHAR_UUID, encodeLocalName(location));
    useMeshStatusStore.getState().setAdvertising(Peripheral.isSupported);
  }

  private startScanning() {
    this.scanSubscription = this.manager.onStateChange((state) => {
      useMeshStatusStore.getState().setCentralState(state);
      if (state !== 'PoweredOn') return;
      this.scan();
    }, true);
  }

  private scan() {
    this.manager.startDeviceScan([SERVICE_UUID], { allowDuplicates: true }, (error, device) => {
      if (error || !device) return;
      this.handleDeviceSeen(device);
    });
  }

  private handleDeviceSeen(device: Device) {
    // iOS peers pack their whole location into the local name (see
    // SkyMatchPeripheral.m on why manufacturer data is not an option there);
    // Android peers send the same string as manufacturer data.
    const location = locationFromAdvert(device.localName, device.manufacturerData);

    this.lastSeenAt.set(device.id, Date.now());
    useMeshStatusStore.getState().setNearby(this.lastSeenAt.size);
    this.peerSeenListeners.forEach((listener) => listener(device.id, device.rssi ?? -100, location));

    // Scanning with allowDuplicates fires many times a second, and a device
    // only lands in connectedDevices once its connection has fully settled.
    // Without this guard every one of those callbacks starts another
    // connection to the same phone, and the pile-up stops any of them from
    // ever completing.
    if (!this.connectedDevices.has(device.id) && !this.connecting.has(device.id)) {
      this.connecting.add(device.id);
      const options = Platform.OS === 'android' ? { requestMTU: ANDROID_MTU } : undefined;
      this.connectAndSubscribe(device.id, () => device.connect(options))
        .catch(() => {
          // Both sides racing to connect is normal in a mesh; the loser just retries later.
        })
        .finally(() => this.connecting.delete(device.id));
    }
  }

  private async connectAndSubscribe(deviceId: string, connect: () => Promise<Device>) {
    const linked = await connect();
    this.reconnecting.delete(deviceId);
    // The copy discovery hands back, not the one from connecting: iOS
    // settles the MTU just after the link comes up, and only the later copy
    // reports it - the earlier one would size every frame for 23 bytes.
    const connected = await linked.discoverAllServicesAndCharacteristics();

    // Confirm the characteristic is really there before treating this as a
    // usable link. CoreBluetooth caches a peripheral's GATT database, so a
    // phone that once ran a build without our service keeps answering from
    // that stale, empty cache: it advertises, it connects, and every write
    // then fails with "characteristic not found". Holding on to such a
    // connection means retrying against it forever.
    if (!(await this.hasOurCharacteristic(connected, deviceId))) {
      await connected.cancelConnection().catch(() => {});
      return;
    }

    this.connectedDevices.set(deviceId, connected);
    // Android starts a link on its slowest connection interval, around 50ms
    // a round trip - and a photo is hundreds of writes that each wait for
    // one. High priority is about 15ms. iOS picks its own and has no such
    // call.
    if (Platform.OS === 'android') {
      this.manager.requestConnectionPriorityForDevice(deviceId, ConnectionPriority.High).catch(() => {});
    }
    useMeshStatusStore.getState().setConnected(this.connectedDevices.size);

    connected.monitorCharacteristicForService(SERVICE_UUID, PROFILE_CHAR_UUID, (error, characteristic) => {
      if (error || !characteristic?.value) return;
      // A live link is as good as an advert for knowing they are here - and
      // with the screen locked, it is all an iPhone gets: CoreBluetooth
      // reports each phone once per scan in the background, however often
      // it advertises.
      this.lastSeenAt.set(deviceId, Date.now());
      this.handleIncomingFrame(Buffer.from(characteristic.value, 'base64').toString('utf8'), deviceId);
    });

    connected.onDisconnected(() => {
      this.dropDevice(deviceId);
      this.recoverLink(deviceId);
    });
  }

  /**
   * Gets a dropped link back on an iPhone, including one in a pocket.
   *
   * With the screen locked iOS keeps the app's Bluetooth running but changes
   * how scanning behaves: `allowDuplicates` is ignored, so a phone already
   * found is never reported again for as long as the scan runs. Reconnecting
   * only when a scan reports someone meant a link that dropped while the
   * screen was off stayed down until it was unlocked - and messages waited
   * with it. The other side can't make up for it either: a locked iPhone
   * advertises in a form Android doesn't recognise.
   *
   * Two things fix that, both allowed in the background. The disconnect is
   * itself what wakes the app, so it:
   * - asks CoreBluetooth to connect again to the same phone. That request
   *   never times out: iOS completes it on its own the moment the phone is
   *   back in range, screen on or off, with no scanning involved.
   * - restarts the scan, which clears the "already reported" list, so a
   *   phone that comes back under a new address is found too.
   *
   * Android needs neither: it scans and reconnects normally in the
   * background, and restarting scans there gets them throttled.
   */
  private recoverLink(deviceId: string) {
    if (Platform.OS !== 'ios' || !this.running) return;

    this.manager.stopDeviceScan();
    this.scan();

    if (this.connecting.has(deviceId)) return;
    if (this.reconnecting.size >= MAX_PENDING_RECONNECTS) {
      const oldest = this.reconnecting.keys().next().value;
      if (oldest !== undefined) {
        this.reconnecting.delete(oldest);
        this.manager.cancelDeviceConnection(oldest).catch(() => {});
      }
    }
    this.reconnecting.set(deviceId, Date.now());
    this.connecting.add(deviceId);
    this.connectAndSubscribe(deviceId, () => this.manager.connectToDevice(deviceId))
      .catch(() => {
        // Cancelled to make room, or by stop(); a scan finds them again if they come back.
      })
      .finally(() => {
        this.connecting.delete(deviceId);
        this.reconnecting.delete(deviceId);
      });
  }

  /** Buffers one frame and emits the envelope once every chunk of that send has arrived. */
  private handleIncomingFrame(rawFrame: string, fromPeerId: string) {
    const frame = decodeFrame(rawFrame);
    if (!frame) return;

    // Someone is asking us to repeat chunks of a send of ours.
    if (isRepairFrame(frame)) {
      void this.resend(frame.id, frame.need ?? [], fromPeerId);
      return;
    }

    // The common case - a text message, a profile beat - is one chunk, and
    // has nothing to wait for.
    if (frame.total === 1) {
      this.envelopeListeners.forEach((listener) => listener(frame.part, fromPeerId));
      return;
    }

    let pending = this.pendingFrames.get(frame.id);
    if (!pending) {
      if (this.pendingFrames.size >= MAX_PENDING_SENDS) this.dropOldestPending();
      pending = {
        parts: new Map<number, string>(),
        touchedAt: 0,
        total: frame.total,
        from: fromPeerId,
        rounds: 0,
        partsAtRound: 0,
      };
      this.pendingFrames.set(frame.id, pending);
    }
    // Every chunk of a send states the same total; one that doesn't is not
    // part of it, and letting it through would make the send unfinishable.
    if (frame.total !== pending.total) return;
    pending.parts.set(frame.index, frame.part);
    pending.touchedAt = Date.now();
    pending.from = fromPeerId;

    const raw = reassembleFrames(pending.parts, pending.total);
    if (raw === null) return; // still waiting on more chunks of this frame
    this.pendingFrames.delete(frame.id);
    this.envelopeListeners.forEach((listener) => listener(raw, fromPeerId));
  }

  private dropOldestPending() {
    let oldestId: string | null = null;
    let oldestAt = Infinity;
    this.pendingFrames.forEach((pending, frameId) => {
      if (pending.touchedAt < oldestAt) {
        oldestAt = pending.touchedAt;
        oldestId = frameId;
      }
    });
    if (oldestId !== null) this.pendingFrames.delete(oldestId);
  }

  /** Keeps an outgoing send around in case the other end asks for parts of it again. */
  private rememberSent(frames: Frame[]) {
    if (frames.length < 2) return; // a single-chunk send is cheaper to repeat whole
    this.sentFrames.set(frames[0].id, { frames, sentAt: Date.now() });
  }

  private async writeFrame(device: Device, frame: Frame) {
    await device.writeCharacteristicWithResponseForService(
      SERVICE_UUID,
      PROFILE_CHAR_UUID,
      Buffer.from(encodeFrame(frame), 'utf8').toString('base64'),
    );
  }

  /**
   * Puts one frame on the wire towards a device: over the connection we
   * opened to it when there is one, and otherwise as a notification, which
   * is the only way back to a phone that connected to us.
   */
  private async pushFrame(frame: Frame, deviceId: string) {
    const device = this.connectedDevices.get(deviceId);
    if (device) {
      try {
        await this.writeFrame(device, frame);
        return;
      } catch {
        this.dropDevice(deviceId);
      }
    }
    if (Peripheral.isSupported) {
      await Peripheral.notify(Buffer.from(encodeFrame(frame), 'utf8').toString('base64'));
    }
  }

  /** Answers a repair request with just the chunks that were named. */
  private async resend(frameId: string, need: number[], toDeviceId: string) {
    const sent = this.sentFrames.get(frameId);
    if (!sent) return; // too old, or never ours: the sender's own retry covers it

    for (const index of need) {
      const frame = sent.frames[index];
      if (frame) await this.pushFrame(frame, toDeviceId);
    }
  }

  /**
   * Asks for the chunks of a stalled send instead of waiting for the whole
   * thing to be sent again. A photo is hundreds of chunks and losing one
   * used to cost all of them.
   */
  private requestRepairs() {
    const now = Date.now();
    this.pendingFrames.forEach((pending, frameId) => {
      if (now - pending.touchedAt < STALLED_MS) return; // still arriving
      if (pending.parts.size > pending.partsAtRound) pending.rounds = 0; // the last round worked
      if (pending.rounds >= MAX_REPAIR_ROUNDS) return;
      const need = missingIndices(pending.parts, pending.total);
      if (need.length === 0) return;

      pending.rounds += 1;
      pending.partsAtRound = pending.parts.size;
      // Counts as activity, so the next round waits its turn rather than
      // firing again on the very next tick.
      pending.touchedAt = now;
      void this.pushFrame(repairFrame(frameId, need), pending.from);
    });
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
    this.sentFrames.forEach((sent, frameId) => {
      if (now - sent.sentAt > SENT_FRAME_TTL_MS) this.sentFrames.delete(frameId);
    });
  }

  private pruneStalePeers() {
    const now = Date.now();
    this.lastSeenAt.forEach((seenAt, peerId) => {
      if (now - seenAt > PEER_STALE_MS) {
        this.lastSeenAt.delete(peerId);
        this.peerLostListeners.forEach((listener) => listener(peerId));
      }
    });
    useMeshStatusStore.getState().setNearby(this.lastSeenAt.size);
  }
}
