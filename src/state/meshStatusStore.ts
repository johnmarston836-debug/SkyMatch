import { create } from 'zustand';

/**
 * Radio-level diagnostics, surfaced in the cabin's empty state.
 *
 * Without this there is no way to tell apart the three very different
 * reasons the cabin can look empty: Bluetooth is off or unauthorised, we
 * are not advertising (so nobody can see us), or we see adverts but never
 * manage to connect. The mesh itself never reports failures - every path
 * fails quietly by design so a flaky link doesn't spam the chat.
 */
interface MeshStatus {
  /** False when the native peripheral module didn't load: we'd scan but stay invisible. */
  peripheralSupported: boolean;
  /** CBManagerState from CoreBluetooth, or null if the native module never reported in. */
  peripheralState: number | null;
  /** react-native-ble-plx's state for the scanning side. */
  centralState: string | null;
  advertising: boolean;
  /** Distinct devices the scanner has ever seen advertising our service. */
  scanHits: number;
  /** Peers we currently hold a GATT connection to. */
  connected: number;

  setPeripheralSupported: (supported: boolean) => void;
  setPeripheralState: (state: number) => void;
  setCentralState: (state: string) => void;
  setAdvertising: (advertising: boolean) => void;
  noteScanHit: (deviceId: string) => void;
  setConnected: (count: number) => void;
  reset: () => void;
}

const seenDevices = new Set<string>();

export const useMeshStatusStore = create<MeshStatus>((set) => ({
  peripheralSupported: false,
  peripheralState: null,
  centralState: null,
  advertising: false,
  scanHits: 0,
  connected: 0,

  setPeripheralSupported: (supported) => set({ peripheralSupported: supported }),
  setPeripheralState: (state) => set({ peripheralState: state }),
  setCentralState: (state) => set({ centralState: state }),
  setAdvertising: (advertising) => set({ advertising }),
  noteScanHit: (deviceId) => {
    if (seenDevices.has(deviceId)) return;
    seenDevices.add(deviceId);
    set({ scanHits: seenDevices.size });
  },
  setConnected: (count) => set({ connected: count }),
  reset: () => {
    seenDevices.clear();
    set({ peripheralState: null, centralState: null, advertising: false, scanHits: 0, connected: 0 });
  },
}));
