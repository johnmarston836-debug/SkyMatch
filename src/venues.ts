import type { ImageSourcePropType } from 'react-native';
import type { PresenceStatus, VenueKind } from './types';

/**
 * Everything that changes between an aeroplane, a train, a gym and a bar.
 *
 * The app underneath is the same in all four: a Bluetooth mesh chat where
 * nobody types a name to find anybody. What differs is only how a person is
 * pointed at - a seat, a coach and a seat, what they are training, what
 * they are wearing - and the words around it. Keeping the words here means
 * the screens don't each grow a switch on the venue.
 */
export interface Venue {
  kind: VenueKind;
  /** Name of the mode in the picker, where there is a whole row for it. */
  name: string;
  /** Same name for the four-across chips, where a quarter of the screen is all there is. */
  shortName: string;
  tagline: string;
  icon: ImageSourcePropType;
  /** What the shared chat is called: the cabin, the coach, the gym floor... */
  spaceTitle: string;
  /** The button that opens the list of people. */
  peopleLabel: string;
  peopleSearching: string;
  composerPlaceholder: string;
  emptyTitle: string;
  emptySubtitle: string;
  /** Step 1 of onboarding, once this venue is picked. */
  locationTitle: string;
  locationSubtitle: string;
  /** Why this has to be answered at all: it is the name everyone here knows you by. */
  locationHelp: string;
  /** Heading over the actual control, so it is never ambiguous what is being asked. */
  locationFieldLabel: string;
  /** How your own badge is introduced on the name step. */
  identityNote: string;
  enterCta: string;
  /** What the one-tap button announces here. */
  alertStatus: PresenceStatus;
  /** The button's glyph, off and on. */
  alertIcon: ImageSourcePropType;
  alertIconActive: ImageSourcePropType;
  /** Whether the empty state draws the seat map illustration (only places with seats). */
  hasSeats: boolean;
}

export const VENUES: Record<VenueKind, Venue> = {
  plane: {
    kind: 'plane',
    name: 'Avión',
    shortName: 'Avión',
    tagline: 'Tu asiento es tu identidad',
    icon: require('./assets/icons/plane.png'),
    spaceTitle: 'Cabina',
    peopleLabel: 'Pasajeros',
    peopleSearching: 'Buscando pasajeros cerca…',
    composerPlaceholder: 'Escribe a toda la cabina…',
    emptyTitle: 'Nadie ha hablado todavía',
    emptySubtitle: 'En cuanto haya pasajeros cerca con la app abierta, aparecerán aquí.',
    locationTitle: '¿En qué asiento vas?',
    locationSubtitle: 'Así te identificarán en el chat de la cabina.',
    locationHelp:
      'Aquí nadie sabe tu nombre: tu asiento es lo que sale junto a cada mensaje tuyo y lo que usan los demás para ubicarte en la cabina.',
    locationFieldLabel: 'TU ASIENTO',
    identityNote: 'En el chat de la cabina te verán como',
    enterCta: 'Entrar a la cabina',
    alertStatus: 'standing',
    alertIcon: require('./assets/icons/seated.png'),
    alertIconActive: require('./assets/icons/standing.png'),
    hasSeats: true,
  },
  train: {
    kind: 'train',
    name: 'Tren',
    shortName: 'Tren',
    tagline: 'Vagón y asiento',
    icon: require('./assets/icons/train.png'),
    spaceTitle: 'Tren',
    peopleLabel: 'Viajeros',
    peopleSearching: 'Buscando viajeros cerca…',
    composerPlaceholder: 'Escribe a todo el tren…',
    emptyTitle: 'Nadie ha hablado todavía',
    emptySubtitle: 'En cuanto haya viajeros cerca con la app abierta, aparecerán aquí.',
    locationTitle: '¿Dónde vas sentado?',
    locationSubtitle: 'Vagón y asiento: con eso te encuentran.',
    locationHelp:
      'Un tren es largo y los asientos se repiten en cada vagón. Los dos juntos salen junto a tus mensajes y son lo que permite que alguien sepa dónde estás.',
    locationFieldLabel: 'TU VAGÓN Y ASIENTO',
    identityNote: 'En el chat del tren te verán como',
    enterCta: 'Entrar al tren',
    alertStatus: 'standing',
    alertIcon: require('./assets/icons/seated.png'),
    alertIconActive: require('./assets/icons/standing.png'),
    hasSeats: true,
  },
  gym: {
    kind: 'gym',
    name: 'Gimnasio',
    shortName: 'Gimnasio',
    tagline: 'Por lo que entrenas hoy',
    icon: require('./assets/icons/dumbbell.png'),
    spaceTitle: 'Sala',
    peopleLabel: 'Gente',
    peopleSearching: 'Buscando gente entrenando cerca…',
    composerPlaceholder: 'Escribe a toda la sala…',
    emptyTitle: 'Nadie ha hablado todavía',
    emptySubtitle: 'En cuanto haya alguien cerca con la app abierta, aparecerá aquí.',
    locationTitle: '¿Qué entrenas hoy?',
    locationSubtitle: 'Es lo que te sitúa en la sala: quien entrene lo mismo te encuentra.',
    locationHelp:
      'En una sala sin asientos ni números, lo que te sitúa es la zona en la que estás, y eso lo dice lo que entrenas. Sale junto a tus mensajes y es lo que te empareja con quien está en las mismas máquinas.',
    locationFieldLabel: 'LO QUE ENTRENAS HOY',
    identityNote: 'En el chat de la sala te verán como',
    enterCta: 'Entrar a la sala',
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
    name: 'Espacio público',
    // "Espacio público" doesn't fit in a quarter of the screen, and a
    // truncated label names nothing.
    shortName: 'Público',
    tagline: 'Por lo que llevas puesto',
    icon: require('./assets/icons/people.png'),
    spaceTitle: 'Aquí cerca',
    peopleLabel: 'Gente',
    peopleSearching: 'Buscando gente cerca…',
    composerPlaceholder: 'Escribe a la gente de aquí…',
    emptyTitle: 'Nadie ha hablado todavía',
    emptySubtitle: 'En cuanto haya alguien cerca con la app abierta, aparecerá aquí.',
    locationTitle: '¿De qué color vas vestido?',
    locationSubtitle: 'El color de la ropa que llevas puesta ahora mismo.',
    locationHelp:
      'Aquí no hay asientos ni números, así que se señala a alguien como se hace siempre: por la ropa, "el de la camiseta roja". El color que elijas sale junto a tus mensajes y es lo que permite que te reconozcan entre la gente. Si te cambias de ropa o de sitio, cámbialo en Mi perfil.',
    locationFieldLabel: 'COLOR DE TU ROPA',
    identityNote: 'Aquí te verán como',
    enterCta: 'Entrar',
    alertStatus: 'standing',
    alertIcon: require('./assets/icons/seated.png'),
    alertIconActive: require('./assets/icons/standing.png'),
    hasSeats: false,
  },
};

/**
 * How each announcement reads. Keyed by the status the alert itself carries,
 * never by the venue of whoever is reading it: in a room where one person
 * chose gym and another chose bar, each alert has to keep the meaning its
 * sender gave it.
 */
export const PRESENCE_COPY: Record<
  PresenceStatus,
  { self: string; other: string; /** Appends the minutes left, which is the whole point of this one. */ countdown: boolean }
> = {
  standing: { self: 'Estás de pie', other: 'está de pie', countdown: false },
  leavingMachine: { self: 'Dejas la máquina', other: 'deja la máquina', countdown: true },
};

export const VENUE_ORDER: VenueKind[] = ['plane', 'train', 'gym', 'public'];

export function venueOf(kind: VenueKind): Venue {
  return VENUES[kind];
}
