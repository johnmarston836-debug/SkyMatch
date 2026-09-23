import type { MuscleGroup, OutfitColor, PresenceStatus, VenueKind } from '../types';

/**
 * The Spanish copy, and the shape every other language has to match.
 *
 * This file is the source of truth: `Strings` is inferred from it, so adding
 * a key here immediately makes the other dictionaries fail to compile until
 * they have it too. Anything with a value inside it is a function rather
 * than a template glued together at the call site, because where the value
 * lands in the sentence is a property of the language, not of the screen.
 */
export const es = {
  common: {
    back: 'Volver',
    close: 'Cerrar',
    send: 'Enviar',
    continue: 'Continuar',
    next: 'Siguiente',
    photo: 'Foto',
    private: 'Privado',
    you: 'Tú',
    remove: 'Quitar',
    see: 'Ver',
    cancel: 'Cancelar',
  },

  welcome: {
    badge: 'SIN WIFI NI DATOS',
    title: 'El chat de la gente que tienes al lado',
    body:
      'Un avión, un tren, el gimnasio o un bar: un chat común con quien está cerca de ti, ' +
      'identificado por dónde está o qué lleva puesto, usando el Bluetooth de tu propio móvil ' +
      'para conectar directamente con los demás.',
    cta: 'Empezar',
    disclaimer: 'Nada sale de la sala: todo viaja de móvil a móvil por Bluetooth.',
  },

  tutorial: {
    diagramYou: 'TÚ',
    page1Label: 'CÓMO FUNCIONA · 1 DE 3',
    page1Title: 'Los mensajes saltan de dispositivo en dispositivo',
    page1Body:
      'SkyMatch no usa internet ni wifi. Tu dispositivo habla por Bluetooth con los que tiene cerca, y cada uno pasa los mensajes al siguiente.',
    page1Caption: 'El dispositivo de la derecha está demasiado lejos para oírte, pero el de en medio le pasa tu mensaje.',
    page1Body2:
      'El Bluetooth llega a varios metros, y cada salto suma: un mensaje puede cruzar muchos dispositivos hasta llegar a su destino. Cuanta más gente lleve SkyMatch, más lejos llega.',
    page1CalloutTitle: 'Funciona en modo avión',
    page1CalloutBody:
      'No necesitas wifi, datos ni cobertura. En el avión puedes dejar el modo avión activado y encender solo el Bluetooth.',
    page2Label: 'CÓMO FUNCIONA · 2 DE 3',
    /** Page 2 on iOS: the links an iPhone already has keep working locked; finding new people is what iOS limits. */
    page2Title: 'Abre la app para descubrir gente alrededor',
    page2Body:
      'Abre SkyMatch unos segundos para que tu iPhone se conecte con quien tienes cerca. Después puedes bloquearlo o usar otras apps: si te escriben en un chat ya iniciado, seguirás recibiendo los mensajes con el iPhone bloqueado, y seguirás haciendo de puente para los demás.',
    page2Caption: 'El dispositivo de en medio está bloqueado, y aun así pasa tu mensaje.',
    page2Body2:
      'No hay servidor: los mensajes solo existen en los dispositivos de alrededor, así que lo que se diga mientras estés desconectado no se puede recuperar. Tus chats privados sí se guardan en tu dispositivo.',
    page2CalloutTitle: 'Lo que un iPhone bloqueado no puede hacer',
    page2CalloutBody:
      'Con la pantalla bloqueada tarda más en encontrar a gente nueva, y dos iPhone bloqueados que no se han visto nunca no se encuentran. Si cierras SkyMatch del todo desde la multitarea, dejas de recibir mensajes y de hacer de puente.',
    /** Page 2 on Android, where the app stays on the mesh in the background (SkyMatchBackgroundService). */
    page2TitleAndroid: 'Abre la app para descubrir gente alrededor',
    page2BodyAndroid:
      'SkyMatch sigue conectada en segundo plano: lo verás en una notificación. Si te escriben en un chat ya iniciado, seguirás recibiendo los mensajes con el dispositivo bloqueado, y seguirás haciendo de puente para los demás.',
    page2CalloutTitleAndroid: 'Cuándo deja de funcionar',
    page2CalloutBodyAndroid:
      'Si tocas «Desconectar» en la notificación o cierras SkyMatch desde la multitarea, dejas de recibir mensajes y de hacer de puente.',
    page3Label: 'CÓMO FUNCIONA · 3 DE 3',
    page3Title: 'Tus chats privados solo los leéis vosotros dos',
    page3Body:
      'Los mensajes privados van cifrados de extremo a extremo. Los dispositivos que hacen de puente los pasan sin poder abrirlos: ni el texto ni las fotos.',
    page3Caption:
      'El dispositivo de en medio solo tiene el mensaje cifrado; el de la derecha, a quien va dirigido, lo descifra.',
    page3Body2:
      'Además, todo lo que envías va firmado por tu dispositivo, así que nadie puede escribir haciéndose pasar por ti.',
    securityCalloutTitle: 'Tus chats se quedan contigo',
    securityCalloutBody:
      'Si alguien se aleja, vuestro chat sigue guardado en tu dispositivo, marcado en rojo como «Sin conexión». Cuando volváis a estar cerca, os reconectáis solos y seguís donde lo dejasteis. Lo que le escribas mientras está lejos no le llega en ese momento: se lo volvemos a enviar cuando reaparece, y si aun así no llega, verás «No entregado» para reenviarlo con un toque.',
    understood: 'Entendido',
  },

  venuePicker: {
    step: 'PASO 1 DE 3',
    title: '¿Dónde estás?',
    subtitle:
      'Cambia solo una cosa: cómo te encuentran los demás sin saber tu nombre. El resto de la app es igual en los cuatro.',
  },

  locationStep: {
    step: 'PASO 2 DE 3',
  },

  profileSetup: {
    step: 'PASO 3 DE 3',
    title: '¿Cómo te llamamos?',
    /** Closes the sentence that starts with the venue's `identityNote` and the badge. */
    identitySuffix: '— el nombre es solo para acompañarlo.',
    namePlaceholder: 'Tu nombre o apodo',
    contactLabel: 'Instagram / WhatsApp (opcional)',
    contactPlaceholder: '@tuusuario o tu número',
    contactHint: 'Solo lo verá quien toque tu nombre en el chat para abrir tu ficha. Déjalo en blanco si prefieres no compartirlo.',
  },

  sessionStart: {
    greeting: (nickname: string) => `HOLA, ${nickname.toUpperCase()}`,
    title: '¿Dónde estás ahora?',
    subtitle: 'Es lo único que cambia de un día para otro. Tu nombre, tu contacto y tu foto siguen guardados.',
  },

  cabin: {
    myProfile: 'Mi perfil',
  },

  chat: {
    title: 'Privado',
    noContact: 'No ha compartido contacto',
    placeholder: 'Escribe un mensaje…',
    seen: 'Visto',
    /** The ··· button in the chat's top bar, and what it offers. */
    options: 'Opciones',
    viewProfile: 'Ver perfil',
    /** Under the chat header while this person is muted; tapping it undoes it. */
    mutedNotice: (nickname: string) => `Has silenciado a ${nickname}: no ves sus mensajes nuevos.`,
    /** Under a private message of ours that never reached them; tapping it tries again. */
    undelivered: 'No entregado · Toca para reenviar',
    replyingTo: (nickname: string) => `Respondiendo a ${nickname}`,
    /** Under the header of a private chat, depending on whether the other phone announced keys. */
    encrypted: 'Cifrado de extremo a extremo',
    notEncrypted: 'Sin cifrar: esta persona usa una versión antigua de SkyMatch',
    away: (minutes: number) =>
      minutes < 1
        ? 'Sin conexión: ahora no le llegan tus mensajes'
        : `Sin conexión desde hace ${minutes} min: ahora no le llegan tus mensajes`,
    offline:
      'Sin conexión: ya no está cerca y no le llegarán tus mensajes',
  },

  passengers: {
    /** How your own last message is previewed in the conversation list. */
    ownPreview: (body: string) => `Tú: ${body}`,
    noMessagesYet: 'Sin mensajes todavía',
    /** Under someone the radio has stopped hearing (see AWAY_AFTER_MS). */
    away: (minutes: number) =>
      minutes < 1 ? 'Sin conexión · ahora mismo' : `Sin conexión · hace ${minutes} min`,
    offline: 'Sin conexión',
    /** The button a leftward swipe reveals behind a conversation, and the confirmation it asks for. */
    delete: 'Borrar',
    deleteTitle: (nickname: string) => `¿Borrar el chat con ${nickname}?`,
    deleteBody: (nickname: string) =>
      `Se borran los mensajes y las fotos de este móvil. ${nickname} conserva su copia.`,
  },

  profile: {
    notArrivedYet: 'Todavía no ha llegado su perfil.',
    contactLabel: 'CONTACTO',
    noContactShared: 'No ha compartido ningún contacto.',
    openConversation: 'Abrir conversación',
    sendPrivateMessage: 'Enviar mensaje privado',
    mute: 'Silenciar a esta persona',
    unmute: 'Dejar de silenciar',
  },

  settings: {
    title: 'Ajustes',
    /** Accessibility label of the gear on your profile. */
    open: 'Ajustes',
    appearance: 'APARIENCIA',
    appearanceSystem: 'Dispositivo',
    appearanceLight: 'Claro',
    appearanceDark: 'Oscuro',
    appearanceHint: '«Dispositivo» sigue el modo claro u oscuro que tengas en tu móvil.',
    accent: 'COLOR DE RESALTE',
    accentHint: 'El color de los botones de enviar, pasajeros y los principales, y de la raya al escribir.',
    /** Read out for each colour swatch. */
    accentNames: { blue: 'Azul', violet: 'Violeta', pink: 'Rosa', red: 'Rojo', orange: 'Naranja', green: 'Verde', teal: 'Turquesa', graphite: 'Grafito' },
    contact: 'CONTACTO',
    contactDeveloper: 'Escribir al desarrollador',
    contactSoon: 'Disponible muy pronto',
    contactHint: 'Cuéntanos qué te gusta, qué falla o qué echas de menos.',
  },

  myProfile: {
    title: 'Mi perfil',
    changePhoto: 'Cambiar foto',
    addPhoto: 'Añadir foto',
    photoTooBigTitle: 'Foto demasiado grande',
    photoTooBigBody: 'Prueba con otra imagen: por Bluetooth solo caben fotos muy pequeñas.',
    nameLabel: 'NOMBRE',
    contactLabel: 'INSTAGRAM / WHATSAPP (OPCIONAL)',
    contactHint: 'Solo lo verá quien abra tu ficha o un chat privado contigo. Déjalo en blanco para no compartirlo.',
    mutedTitle: 'Silenciados',
    mutedBody:
      'No ves sus mensajes. Tu móvil sigue pasando los suyos a los demás, porque es parte de cómo llegan los mensajes de todos.',
    mutedUnknown: 'Alguien que ya no está cerca',
    alertsTitle: 'Avisos',
    alertsOn:
      'Te avisamos de los mensajes privados que lleguen con la app en segundo plano. Si cierras la app del todo, el Bluetooth se apaga y no llega nada.',
    alertsOff: 'Activa los avisos para enterarte de los mensajes privados aunque no tengas la app en pantalla.',
    openSettings: 'Abrir Ajustes',
    enableAlerts: 'Activar avisos',
    save: 'Guardar cambios',
    howItWorks: 'Cómo funciona SkyMatch',
  },

  reactions: {
    count: (total: number) => (total === 1 ? '1 reacción' : `${total} reacciones`),
    empty: 'Todavía no ha reaccionado nadie.',
    tapToWrite: 'Toca para escribirle',
  },

  radio: {
    panelLabel: 'ESTADO DE LA RADIO',
    advertising: 'Te ven (emitiendo)',
    scanning: 'Tú buscas (escaneo)',
    devices: 'Móviles detectados',
    connected: 'Conectados',
    listeners: 'Te escuchan',
    moduleMissing: 'módulo no cargado',
    on: 'encendido',
    off: 'apagado',
    noPermission: 'sin permiso',
    unavailable: 'no disponible',
    starting: 'iniciando…',
    noAnswer: 'sin respuesta',
    deniedTitle: 'SkyMatch no tiene permiso de Bluetooth',
    deniedAction: 'Dáselo en Ajustes',
    poweredOffTitle: 'El Bluetooth está apagado',
    poweredOffAction: 'Enciéndelo para ver a quien tienes cerca',
    unsupportedTitle: 'Este móvil no puede usar Bluetooth de bajo consumo',
    invisibleTitle: 'Puedes ver a los demás, pero ellos no te ven',
  },

  /** The notification that keeps Android on the mesh with the app in the background. */
  background: {
    title: 'SkyMatch sigue conectado',
    body:
      'Recibes mensajes y sigues haciendo de puente para los demás aunque salgas de la app.',
    stop: 'Desconectar',
    channelName: 'Conexión en segundo plano',
  },

  notifications: {
    sentPhoto: 'Te ha enviado una foto',
    /** What Android lists this app's notifications under, in Settings. */
    channelName: 'Mensajes privados',
  },

  presence: {
    /** Appended to an alert that carries a countdown; the gym one does. */
    countdown: (minutes: number) => ` en ${minutes} min`,
    byStatus: {
      standing: { self: 'Estás de pie', other: 'está de pie' },
      leavingMachine: { self: 'Dejas la máquina', other: 'deja la máquina' },
    } as Record<PresenceStatus, { self: string; other: string }>,
  },

  muscles: {
    chest: 'Pecho',
    back: 'Espalda',
    legs: 'Pierna',
    shoulders: 'Hombro',
    arms: 'Brazo',
    core: 'Core',
    cardio: 'Cardio',
    fullbody: 'Full body',
  } as Record<MuscleGroup, string>,

  colors: {
    black: 'Negro',
    white: 'Blanco',
    grey: 'Gris',
    red: 'Rojo',
    blue: 'Azul',
    green: 'Verde',
    yellow: 'Amarillo',
    pink: 'Rosa',
  } as Record<OutfitColor, string>,

  location: {
    /** Prefix of the coach number on a badge: it has to stay one letter. */
    coachShort: 'V',
    describeSeat: (seat: string) => `Asiento ${seat}`,
    describeCoachSeat: (coach: number, seat: string) => `Vagón ${coach}, asiento ${seat}`,
    describeMuscle: (muscle: string) => `Hoy entrena ${muscle.toLowerCase()}`,
    describeOutfit: (color: string) => `Va de ${color.toLowerCase()}`,
  },

  picker: {
    coachLabel: 'VAGÓN',
    seatLetterHint: 'Toca tu letra de asiento',
    rowLabel: 'FILA',
    outfitHint: 'El de la prenda que más se vea: la camiseta, la sudadera o la chaqueta que llevas puesta.',
    spotLabel: '¿DÓNDE ESTÁS? (OPCIONAL)',
    spotPlaceholder: 'En la barra, la terraza, cerca de la entrada…',
    spotHint: 'Un sitio concreto ahorra la mitad de las miradas. Puedes cambiarlo cuando te muevas.',
  },

  venues: {
    plane: {
      name: 'Avión',
      shortName: 'Avión',
      tagline: 'Tu asiento es tu identidad',
      spaceTitle: 'Cabina',
      peopleLabel: 'Pasajeros',
      peopleSearching: 'Buscando pasajeros cerca…',
      composerPlaceholder: 'Escribe a toda la cabina…',
      emptyTitle: 'Nadie ha hablado todavía',
      emptySubtitle: 'En cuanto haya pasajeros cerca con SkyMatch, aparecerán aquí.',
      locationTitle: '¿En qué asiento vas?',
      locationSubtitle: 'Así te identificarán en el chat de la cabina.',
      locationHelp:
        'Aquí nadie sabe tu nombre: tu asiento es lo que sale junto a cada mensaje tuyo y lo que usan los demás para ubicarte en la cabina.',
      locationFieldLabel: 'TU ASIENTO',
      identityNote: 'En el chat de la cabina te verán como',
      enterCta: 'Entrar a la cabina',
    },
    train: {
      name: 'Tren',
      shortName: 'Tren',
      tagline: 'Vagón y asiento',
      spaceTitle: 'Tren',
      peopleLabel: 'Viajeros',
      peopleSearching: 'Buscando viajeros cerca…',
      composerPlaceholder: 'Escribe a todo el tren…',
      emptyTitle: 'Nadie ha hablado todavía',
      emptySubtitle: 'En cuanto haya viajeros cerca con SkyMatch, aparecerán aquí.',
      locationTitle: '¿Dónde vas sentado?',
      locationSubtitle: 'Vagón y asiento: con eso te encuentran.',
      locationHelp:
        'Un tren es largo y los asientos se repiten en cada vagón. Los dos juntos salen junto a tus mensajes y son lo que permite que alguien sepa dónde estás.',
      locationFieldLabel: 'TU VAGÓN Y ASIENTO',
      identityNote: 'En el chat del tren te verán como',
      enterCta: 'Entrar al tren',
    },
    gym: {
      name: 'Gimnasio',
      shortName: 'Gimnasio',
      tagline: 'Por lo que entrenas hoy',
      spaceTitle: 'Sala',
      peopleLabel: 'Gente',
      peopleSearching: 'Buscando gente entrenando cerca…',
      composerPlaceholder: 'Escribe a toda la sala…',
      emptyTitle: 'Nadie ha hablado todavía',
      emptySubtitle: 'En cuanto haya alguien cerca con SkyMatch, aparecerá aquí.',
      locationTitle: '¿Qué entrenas hoy?',
      locationSubtitle: 'Es lo que te sitúa en la sala: quien entrene lo mismo te encuentra.',
      locationHelp:
        'En una sala sin asientos ni números, lo que te sitúa es la zona en la que estás, y eso lo dice lo que entrenas. Sale junto a tus mensajes y es lo que te empareja con quien está en las mismas máquinas.',
      locationFieldLabel: 'LO QUE ENTRENAS HOY',
      identityNote: 'En el chat de la sala te verán como',
      enterCta: 'Entrar a la sala',
    },
    public: {
      name: 'Espacio público',
      // "Espacio público" doesn't fit in a quarter of the screen, and a
      // truncated label names nothing.
      shortName: 'Público',
      tagline: 'Por lo que llevas puesto',
      spaceTitle: 'Aquí cerca',
      peopleLabel: 'Gente',
      peopleSearching: 'Buscando gente cerca…',
      composerPlaceholder: 'Escribe a la gente de aquí…',
      emptyTitle: 'Nadie ha hablado todavía',
      emptySubtitle: 'En cuanto haya alguien cerca con SkyMatch, aparecerá aquí.',
      locationTitle: '¿De qué color vas vestido?',
      locationSubtitle: 'El color de la ropa que llevas puesta ahora mismo.',
      locationHelp:
        'Aquí no hay asientos ni números, así que se señala a alguien como se hace siempre: por la ropa, "el de la camiseta roja". El color que elijas sale junto a tus mensajes y es lo que permite que te reconozcan entre la gente. Si te cambias de ropa o de sitio, cámbialo en Mi perfil.',
      locationFieldLabel: 'COLOR DE TU ROPA',
      identityNote: 'Aquí te verán como',
      enterCta: 'Entrar',
    },
  } as Record<VenueKind, VenueStrings>,
};

/** The words that change from one kind of place to another. */
export interface VenueStrings {
  /** Name of the mode in the picker, where there is a whole row for it. */
  name: string;
  /** Same name for the four-across chips, where a quarter of the screen is all there is. */
  shortName: string;
  tagline: string;
  /** What the shared chat is called: the cabin, the coach, the gym floor... */
  spaceTitle: string;
  /** The button that opens the list of people. */
  peopleLabel: string;
  peopleSearching: string;
  composerPlaceholder: string;
  emptyTitle: string;
  emptySubtitle: string;
  locationTitle: string;
  locationSubtitle: string;
  /** Why this has to be answered at all: it is the name everyone here knows you by. */
  locationHelp: string;
  /** Heading over the actual control, so it is never ambiguous what is being asked. */
  locationFieldLabel: string;
  /** How your own badge is introduced on the name step. */
  identityNote: string;
  enterCta: string;
}

/** Every dictionary has exactly this shape - see `es` for why it is inferred rather than declared. */
export type Strings = typeof es;
