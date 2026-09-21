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
/**
   * Phones advertising our service that the scanner can hear *right now*.
   *
   * It used to be every distinct device ever seen, which only ever went up:
   * someone who walked off kept counting, and iOS hands the same phone a new
   * identifier when its app restarts, so it counted twice. A radio panel
   * that says three when there is one is worse than no panel.
   */
  nearby: number;
  /** Peers we currently hold a GATT connection to. */
  connected: number;
  /** Centrals listening to us: our only outbound path towards phones that connected to us. */
  subscribers: number;

  setPeripheralSupported: (supported: boolean) => void;
  setPeripheralState: (state: number) => void;
  setCentralState: (state: string) => void;
  setAdvertising: (advertising: boolean) => void;
  setNearby: (count: number) => void;
  setConnected: (count: number) => void;
  setSubscribers: (count: number) => void;
  reset: () => void;
}

export const useMeshStatusStore = create<MeshStatus>((set) => ({
  peripheralSupported: false,
  peripheralState: null,
  centralState: null,
  advertising: false,
  nearby: 0,
  connected: 0,
  subscribers: 0,

  setPeripheralSupported: (supported) => set({ peripheralSupported: supported }),
  setPeripheralState: (state) => set({ peripheralState: state }),
  setCentralState: (state) => set({ centralState: state }),
  setAdvertising: (advertising) => set({ advertising }),
  setNearby: (count) => set({ nearby: count }),
  setConnected: (count) => set({ connected: count }),
  setSubscribers: (count) => set({ subscribers: count }),
  reset: () =>
    set({ peripheralState: null, centralState: null, advertising: false, nearby: 0, connected: 0, subscribers: 0 }),
}));
