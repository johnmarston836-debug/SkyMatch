import type { ImageSourcePropType } from 'react-native';
import type { VenueKind } from './types';

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
  /** Name of the mode in the picker. */
  name: string;
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
  /** How your own badge is introduced on the name step. */
  identityNote: string;
  enterCta: string;
  /** The stand-up banner, in the first person and about someone else. */
  standingSelf: string;
  standingOther: string;
  /** Whether the empty state draws the seat map illustration (only places with seats). */
  hasSeats: boolean;
}

export const VENUES: Record<VenueKind, Venue> = {
  plane: {
    kind: 'plane',
    name: 'Avión',
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
    identityNote: 'En el chat de la cabina te verán como',
    enterCta: 'Entrar a la cabina',
    standingSelf: 'Estás de pie',
    standingOther: 'está de pie',
    hasSeats: true,
  },
  train: {
    kind: 'train',
    name: 'Tren',
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
    identityNote: 'En el chat del tren te verán como',
    enterCta: 'Entrar al tren',
    standingSelf: 'Estás de pie',
    standingOther: 'está de pie',
    hasSeats: true,
  },
  gym: {
    kind: 'gym',
    name: 'Gimnasio',
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
    identityNote: 'En el chat de la sala te verán como',
    enterCta: 'Entrar a la sala',
    standingSelf: 'Estás libre',
    standingOther: 'está libre entre series',
    hasSeats: false,
  },
  public: {
    kind: 'public',
    name: 'Espacio público',
    tagline: 'Por lo que llevas puesto',
    icon: require('./assets/icons/people.png'),
    spaceTitle: 'Aquí cerca',
    peopleLabel: 'Gente',
    peopleSearching: 'Buscando gente cerca…',
    composerPlaceholder: 'Escribe a la gente de aquí…',
    emptyTitle: 'Nadie ha hablado todavía',
    emptySubtitle: 'En cuanto haya alguien cerca con la app abierta, aparecerá aquí.',
    locationTitle: '¿De qué color vas?',
    locationSubtitle:
      'Sin asientos ni números, lo que usa la gente para señalar a alguien es la ropa. Añade dónde estás si quieres afinar.',
    identityNote: 'Aquí te verán como',
    enterCta: 'Entrar',
    standingSelf: 'Estás de pie',
    standingOther: 'está de pie',
    hasSeats: false,
  },
};

export const VENUE_ORDER: VenueKind[] = ['plane', 'train', 'gym', 'public'];

export function venueOf(kind: VenueKind): Venue {
  return VENUES[kind];
}
