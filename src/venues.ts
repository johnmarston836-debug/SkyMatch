import type { ImageSourcePropType } from 'react-native';
import { t, type VenueStrings } from './i18n';
import type { PresenceStatus, VenueKind } from './types';

/**
 * Everything that changes between an aeroplane, a train, a gym and a bar.
 *
 * The app underneath is the same in all four: a Bluetooth mesh chat where
 * nobody types a name to find anybody. What differs is only how a person is
 * pointed at - a seat, a coach and a seat, what they are training, what
 * they are wearing - and the words around it. Keeping it here means the
 * screens don't each grow a switch on the venue.
 *
 * The words themselves live in the dictionaries under src/i18n, because
 * they also change with the phone's language; what stays here is the part
 * that doesn't: which icon, which kind of alert, whether the place has
 * seats.
 */
export interface VenueConfig {
  kind: VenueKind;
  icon: ImageSourcePropType;
  /** What the one-tap button announces here. */
  alertStatus: PresenceStatus;
  /** The button's glyph, off and on. */
  alertIcon: ImageSourcePropType;
  alertIconActive: ImageSourcePropType;
  /** Whether the empty state draws the seat map illustration (only places with seats). */
  hasSeats: boolean;
}

/** A venue as a screen uses it: its fixed parts and its words together. */
export type Venue = VenueConfig & VenueStrings;

const VENUE_CONFIG: Record<VenueKind, VenueConfig> = {
  plane: {
    kind: 'plane',
    icon: require('./assets/icons/plane.png'),
    alertStatus: 'standing',
    alertIcon: require('./assets/icons/seated.png'),
    alertIconActive: require('./assets/icons/standing.png'),
    hasSeats: true,
  },
  train: {
    kind: 'train',
    icon: require('./assets/icons/train.png'),
    alertStatus: 'standing',
    alertIcon: require('./assets/icons/seated.png'),
    alertIconActive: require('./assets/icons/standing.png'),
    hasSeats: true,
  },
  gym: {
    kind: 'gym',
    icon: require('./assets/icons/dumbbell.png'),
    // Nobody in a gym cares that you are standing up. What the room wants
    // to know is which machine is about to be free - and that is already
    // implied by the muscle group you announced, so it costs no extra tap.
    alertStatus: 'leavingMachine',
    alertIcon: require('./assets/icons/dumbbell.png'),
    alertIconActive: require('./assets/icons/dumbbell.png'),
    hasSeats: false,
  },
  public: {
    kind: 'public',
    icon: require('./assets/icons/people.png'),
    alertStatus: 'standing',
    alertIcon: require('./assets/icons/seated.png'),
    alertIconActive: require('./assets/icons/standing.png'),
    hasSeats: false,
  },
};

/**
 * Which announcements append the minutes left, which is the whole point of
 * that one. Keyed by the status the alert itself carries, never by the
 * venue of whoever is reading it: in a room where one person chose gym and
 * another chose bar, each alert has to keep the meaning its sender gave it.
 */
export const PRESENCE_COUNTDOWN: Record<PresenceStatus, boolean> = {
  standing: false,
  leavingMachine: true,
};

export const VENUE_ORDER: VenueKind[] = ['plane', 'train', 'gym', 'public'];

/**
 * Built per call rather than held in a constant, because half of it is the
 * current language: a dictionary captured at module load would still be
 * Spanish after a change of language.
 */
export function venueOf(kind: VenueKind): Venue {
  return { ...VENUE_CONFIG[kind], ...t.venues[kind] };
}
