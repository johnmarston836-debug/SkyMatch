import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@skymatch/settings';

/** Light, dark, or whatever the phone itself is set to. */
export type Appearance = 'system' | 'light' | 'dark';

/**
 * The colours offered for the app's highlight: the send button, the
 * passenger button, the main buttons, the caret while typing. Each one
 * carries white text legibly and reads on both a white and a black
 * background, which is what `accent` has to do.
 */
export const ACCENTS = {
  blue: '#2563EB',
  violet: '#7C3AED',
  pink: '#DB2777',
  red: '#DC2626',
  orange: '#EA580C',
  green: '#16A34A',
  teal: '#0D9488',
  graphite: '#475569',
} as const;

export type AccentName = keyof typeof ACCENTS;

/** The three kinds of notification the app can show, each switched on or off in Settings. */
export type NotifyKind = 'private' | 'cabin' | 'reactions';

interface Settings {
  appearance: Appearance;
  accent: AccentName;
  notify: Record<NotifyKind, boolean>;
}

const DEFAULTS: Settings = {
  appearance: 'system',
  accent: 'blue',
  notify: { private: true, cabin: true, reactions: true },
};

interface SettingsState extends Settings {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setAppearance: (appearance: Appearance) => void;
  setAccent: (accent: AccentName) => void;
  setNotify: (kind: NotifyKind, on: boolean) => void;
}

function read(raw: string | null): Settings {
  if (!raw) return DEFAULTS;
  try {
    const stored = JSON.parse(raw) as Partial<Settings>;
    return {
      appearance:
        stored.appearance === 'light' || stored.appearance === 'dark' || stored.appearance === 'system'
          ? stored.appearance
          : DEFAULTS.appearance,
      accent: typeof stored.accent === 'string' && stored.accent in ACCENTS ? stored.accent : DEFAULTS.accent,
      // Anything not stored as a plain false stays on: older installs had no switches.
      notify: {
        private: stored.notify?.private !== false,
        cabin: stored.notify?.cabin !== false,
        reactions: stored.notify?.reactions !== false,
      },
    };
  } catch {
    return DEFAULTS;
  }
}

/** How this phone's owner likes the app to look. Only ever local. */
export const useSettingsStore = create<SettingsState>((set, get) => {
  const persist = () => {
    const { appearance, accent, notify } = get();
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ appearance, accent, notify })).catch(() => {});
  };
  return {
    ...DEFAULTS,
    hydrated: false,
    hydrate: async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
      set({ ...read(raw), hydrated: true });
    },
    setAppearance: (appearance) => {
      set({ appearance });
      persist();
    },
    setAccent: (accent) => {
      set({ accent });
      persist();
    },
    setNotify: (kind, on) => {
      set((state) => ({ notify: { ...state.notify, [kind]: on } }));
      persist();
    },
  };
});
