import type { Strings } from './es';

/** Català. */
export const ca: Strings = {
  common: {
    back: 'Enrere',
    close: 'Tancar',
    send: 'Enviar',
    continue: 'Continuar',
    next: 'Següent',
    photo: 'Foto',
    private: 'Privat',
    you: 'Tu',
    remove: 'Treure',
    see: 'Veure',
    cancel: 'Cancel·lar',
  },

  welcome: {
    badge: 'SENSE WIFI NI DADES',
    title: 'El xat de la gent que tens al costat',
    body:
      'Un avió, un tren, el gimnàs o un bar: un xat comú amb qui tens a prop, ' +
      'identificat per on és o què porta posat, fent servir el Bluetooth del teu propi mòbil ' +
      'per connectar directament amb els altres.',
    cta: 'Començar',
    disclaimer: 'No surt res de la sala: tot viatja de mòbil a mòbil per Bluetooth.',
  },

  tutorial: {
    diagramYou: 'TU',
    page1Label: 'COM FUNCIONA · 1 DE 3',
    page1Title: 'Els missatges salten de mòbil en mòbil',
    page1Body:
      'SkyMatch no fa servir internet ni wifi. El teu mòbil parla per Bluetooth amb els que té a prop, i cadascun passa els missatges al següent.',
    page1Caption: 'El mòbil de la dreta és massa lluny per sentir-te, però el del mig li passa el teu missatge.',
    page1Body2:
      'El Bluetooth arriba a pocs metres, però cada salt suma: un missatge pot creuar diversos mòbils fins a arribar al seu destí. Com més gent porti SkyMatch, més lluny arriba.',
    page1CalloutTitle: 'Funciona en mode avió',
    page1CalloutBody:
      'No et cal wifi, dades ni cobertura. A l’avió pots deixar el mode avió activat i encendre només el Bluetooth.',
    page2Label: 'COM FUNCIONA · 2 DE 3',
    /** Page 2 on iOS: the links an iPhone already has keep working locked; finding new people is what iOS limits. */
    page2Title: 'Obre-la en arribar i desa’t el mòbil',
    page2Body:
      'Obre SkyMatch en arribar i deixa-la uns segons a la pantalla: així el teu iPhone es connecta amb qui té a prop. Després pots bloquejar-lo o fer servir altres apps, i continuaràs rebent missatges i fent de pont per als altres.',
    page2Caption: 'El mòbil del mig està bloquejat, i tot i així passa el teu missatge.',
    page2Body2:
      'No hi ha servidor: els missatges només existeixen als mòbils del voltant, així que el que es digui mentre estiguis desconnectat no es pot recuperar. Els teus xats privats sí que es desen al teu mòbil.',
    page2CalloutTitle: 'El que un iPhone bloquejat no pot fer',
    page2CalloutBody:
      'Amb la pantalla bloquejada triga més a trobar gent nova, i dos iPhone bloquejats que no s’han vist mai no es troben. Si tanques SkyMatch del tot des de la multitasca, deixes de rebre missatges i de fer de pont.',
    /** Page 2 on Android, where the app stays on the mesh in the background (SkyMatchBackgroundService). */
    page2TitleAndroid: 'Continua connectada encara que en surtis',
    page2BodyAndroid:
      'A Android, SkyMatch continua connectada en segon pla: ho veuràs en una notificació. Pots bloquejar el mòbil o fer servir altres apps, i continuaràs rebent missatges i fent de pont per als altres.',
    page2CalloutTitleAndroid: 'Quan deixa de funcionar',
    page2CalloutBodyAndroid:
      'Si toques «Desconnectar» a la notificació o tanques SkyMatch des de la multitasca, deixes de rebre missatges i de fer de pont.',
    page3Label: 'COM FUNCIONA · 3 DE 3',
    page3Title: 'Els vostres xats privats només els llegiu vosaltres dos',
    page3Body:
      'Els missatges privats van xifrats d’extrem a extrem. Els mòbils que fan de pont els passen sense poder obrir-los: ni el text ni les fotos.',
    page3Caption: 'El mòbil del mig passa el missatge tancat: només qui el rep el pot obrir.',
    page3Body2:
      'A més, tot el que envies va signat pel teu mòbil, així que ningú no pot escriure fent-se passar per tu.',
    securityCalloutTitle: 'Fixa’t en la capçalera del xat',
    securityCalloutBody:
      'Si l’altra persona fa servir una versió antiga de SkyMatch, el vostre xat privat no va xifrat i t’ho avisem en vermell. El que ningú no pot comprovar és la ubicació: el seient, el vagó o la màquina els indica cadascú.',
    understood: 'Entesos',
  },

  venuePicker: {
    step: 'PAS 1 DE 3',
    title: 'On ets?',
    subtitle:
      'Només canvia una cosa: com et troben els altres sense saber el teu nom. La resta de l’app és igual als quatre.',
  },

  locationStep: {
    step: 'PAS 2 DE 3',
  },

  profileSetup: {
    step: 'PAS 3 DE 3',
    title: 'Com et diem?',
    identitySuffix: '— el nom només és per acompanyar-lo.',
    namePlaceholder: 'El teu nom o sobrenom',
    contactLabel: 'Instagram / WhatsApp (opcional)',
    contactPlaceholder: '@elteuusuari o el teu número',
    contactHint: 'Només ho veurà qui toqui el teu nom al xat per obrir la teva fitxa. Deixa-ho en blanc si prefereixes no compartir-ho.',
  },

  sessionStart: {
    greeting: (nickname: string) => `HOLA, ${nickname.toUpperCase()}`,
    title: 'On ets ara?',
    subtitle: 'És l’única cosa que canvia d’un dia per l’altre. El teu nom, el teu contacte i la teva foto segueixen desats.',
  },

  cabin: {
    myProfile: 'El meu perfil',
  },

  chat: {
    title: 'Privat',
    noContact: 'No ha compartit contacte',
    placeholder: 'Escriu un missatge…',
    seen: 'Vist',
    /** Under a private message of ours that never reached them; tapping it tries again. */
    undelivered: 'No entregat · Toca per tornar-lo a enviar',
    replyingTo: (nickname: string) => `Responent a ${nickname}`,
    encrypted: 'Xifrat d’extrem a extrem: només vosaltres dos podeu llegir aquest xat',
    notEncrypted: 'Sense xifrar: aquesta persona fa servir una versió antiga de SkyMatch',
    away: (minutes: number) =>
      minutes < 1
        ? 'Sense connexió: ara no li arriben els teus missatges'
        : `Sense connexió des de fa ${minutes} min: ara no li arriben els teus missatges`,
    offline:
      'Sense connexió: ja no és a prop i no li arribaran els teus missatges',
  },

  passengers: {
    ownPreview: (body: string) => `Tu: ${body}`,
    noMessagesYet: 'Encara no hi ha missatges',
    away: (minutes: number) =>
      minutes < 1 ? 'Sense connexió · ara mateix' : `Sense connexió · fa ${minutes} min`,
    offline: 'Sense connexió',
    delete: 'Esborrar',
    deleteTitle: (nickname: string) => `Vols esborrar el xat amb ${nickname}?`,
    deleteBody: (nickname: string) =>
      `S’esborren els missatges i les fotos d’aquest mòbil. ${nickname} en conserva la seva còpia.`,
  },

  profile: {
    notArrivedYet: 'Encara no ha arribat el seu perfil.',
    contactLabel: 'CONTACTE',
    noContactShared: 'No ha compartit cap contacte.',
    openConversation: 'Obrir conversa',
    sendPrivateMessage: 'Enviar missatge privat',
    mute: 'Silenciar aquesta persona',
    unmute: 'Deixar de silenciar',
  },

  myProfile: {
    title: 'El meu perfil',
    changePhoto: 'Canviar foto',
    addPhoto: 'Afegir foto',
    photoTooBigTitle: 'Foto massa gran',
    photoTooBigBody: 'Prova amb una altra imatge: per Bluetooth només hi caben fotos molt petites.',
    nameLabel: 'NOM',
    contactLabel: 'INSTAGRAM / WHATSAPP (OPCIONAL)',
    contactHint: 'Només ho veurà qui obri la teva fitxa o un xat privat amb tu. Deixa-ho en blanc per no compartir-ho.',
    mutedTitle: 'Silenciats',
    mutedBody:
      'No veus els seus missatges. El teu mòbil segueix passant els seus als altres, perquè és part de com arriben els missatges de tothom.',
    mutedUnknown: 'Algú que ja no és a prop',
    alertsTitle: 'Avisos',
    alertsOn:
      'T’avisem dels missatges privats que arribin amb l’app en segon pla. Si tanques l’app del tot, el Bluetooth s’apaga i no arriba res.',
    alertsOff: 'Activa els avisos per assabentar-te dels missatges privats encara que no tinguis l’app a la pantalla.',
    openSettings: 'Obrir Configuració',
    enableAlerts: 'Activar avisos',
    save: 'Desar canvis',
    howItWorks: 'Com funciona SkyMatch',
  },

  reactions: {
    count: (total: number) => (total === 1 ? '1 reacció' : `${total} reaccions`),
    empty: 'Encara no hi ha reaccionat ningú.',
    tapToWrite: 'Toca per escriure-li',
  },

  radio: {
    panelLabel: 'ESTAT DE LA RÀDIO',
    advertising: 'Et veuen (emetent)',
    scanning: 'Tu busques (escaneig)',
    devices: 'Mòbils detectats',
    connected: 'Connectats',
    listeners: 'T’escolten',
    moduleMissing: 'mòdul no carregat',
    on: 'encès',
    off: 'apagat',
    noPermission: 'sense permís',
    unavailable: 'no disponible',
    starting: 'iniciant…',
    noAnswer: 'sense resposta',
    deniedTitle: 'SkyMatch no té permís de Bluetooth',
    deniedAction: 'Dona-l’hi a Configuració',
    poweredOffTitle: 'El Bluetooth està apagat',
    poweredOffAction: 'Encén-lo per veure qui tens a prop',
    unsupportedTitle: 'Aquest mòbil no pot fer servir Bluetooth de baix consum',
    invisibleTitle: 'Pots veure els altres, però ells no et veuen',
  },

  background: {
    title: 'SkyMatch continua connectat',
    body:
      'Reps missatges i continues fent de pont per als altres encara que surtis de l’app.',
    stop: 'Desconnectar',
    channelName: 'Connexió en segon pla',
  },

  notifications: {
    sentPhoto: 'T’ha enviat una foto',
    channelName: 'Missatges privats',
  },

  presence: {
    countdown: (minutes: number) => ` d’aquí a ${minutes} min`,
    byStatus: {
      standing: { self: 'Estàs dret', other: 'està dret' },
      leavingMachine: { self: 'Deixes la màquina', other: 'deixa la màquina' },
    },
  },

  muscles: {
    chest: 'Pit',
    back: 'Esquena',
    legs: 'Cama',
    shoulders: 'Espatlla',
    arms: 'Braç',
    core: 'Core',
    cardio: 'Cardio',
    fullbody: 'Full body',
  },

  colors: {
    black: 'Negre',
    white: 'Blanc',
    grey: 'Gris',
    red: 'Vermell',
    blue: 'Blau',
    green: 'Verd',
    yellow: 'Groc',
    pink: 'Rosa',
  },

  location: {
    coachShort: 'V',
    describeSeat: (seat: string) => `Seient ${seat}`,
    describeCoachSeat: (coach: number, seat: string) => `Vagó ${coach}, seient ${seat}`,
    describeMuscle: (muscle: string) => `Avui entrena ${muscle.toLowerCase()}`,
    describeOutfit: (color: string) => `Va de ${color.toLowerCase()}`,
  },

  picker: {
    coachLabel: 'VAGÓ',
    seatLetterHint: 'Toca la teva lletra de seient',
    rowLabel: 'FILA',
    outfitHint: 'El de la peça que més es vegi: la samarreta, la dessuadora o la jaqueta que portes posada.',
    spotLabel: 'ON ETS? (OPCIONAL)',
    spotPlaceholder: 'A la barra, a la terrassa, prop de l’entrada…',
    spotHint: 'Un lloc concret estalvia la meitat de les mirades. El pots canviar quan et moguis.',
  },

  venues: {
    plane: {
      name: 'Avió',
      shortName: 'Avió',
      tagline: 'El teu seient és la teva identitat',
      spaceTitle: 'Cabina',
      peopleLabel: 'Passatgers',
      peopleSearching: 'Buscant passatgers a prop…',
      composerPlaceholder: 'Escriu a tota la cabina…',
      emptyTitle: 'Encara no ha parlat ningú',
      emptySubtitle: 'Tan bon punt hi hagi passatgers a prop amb SkyMatch, apareixeran aquí.',
      locationTitle: 'A quin seient vas?',
      locationSubtitle: 'Així t’identificaran al xat de la cabina.',
      locationHelp:
        'Aquí ningú sap el teu nom: el teu seient és el que surt al costat de cada missatge teu i el que fan servir els altres per ubicar-te a la cabina.',
      locationFieldLabel: 'EL TEU SEIENT',
      identityNote: 'Al xat de la cabina et veuran com a',
      enterCta: 'Entrar a la cabina',
    },
    train: {
      name: 'Tren',
      shortName: 'Tren',
      tagline: 'Vagó i seient',
      spaceTitle: 'Tren',
      peopleLabel: 'Viatgers',
      peopleSearching: 'Buscant viatgers a prop…',
      composerPlaceholder: 'Escriu a tot el tren…',
      emptyTitle: 'Encara no ha parlat ningú',
      emptySubtitle: 'Tan bon punt hi hagi viatgers a prop amb SkyMatch, apareixeran aquí.',
      locationTitle: 'On vas assegut?',
      locationSubtitle: 'Vagó i seient: amb això et troben.',
      locationHelp:
        'Un tren és llarg i els seients es repeteixen a cada vagó. Tots dos junts surten al costat dels teus missatges i són el que permet que algú sàpiga on ets.',
      locationFieldLabel: 'EL TEU VAGÓ I SEIENT',
      identityNote: 'Al xat del tren et veuran com a',
      enterCta: 'Entrar al tren',
    },
    gym: {
      name: 'Gimnàs',
      shortName: 'Gimnàs',
      tagline: 'Pel que entrenes avui',
      spaceTitle: 'Sala',
      peopleLabel: 'Gent',
      peopleSearching: 'Buscant gent entrenant a prop…',
      composerPlaceholder: 'Escriu a tota la sala…',
      emptyTitle: 'Encara no ha parlat ningú',
      emptySubtitle: 'Tan bon punt hi hagi algú a prop amb SkyMatch, apareixerà aquí.',
      locationTitle: 'Què entrenes avui?',
      locationSubtitle: 'És el que et situa a la sala: qui entreni el mateix et troba.',
      locationHelp:
        'En una sala sense seients ni números, el que et situa és la zona on ets, i això ho diu el que entrenes. Surt al costat dels teus missatges i és el que t’aparella amb qui és a les mateixes màquines.',
      locationFieldLabel: 'EL QUE ENTRENES AVUI',
      identityNote: 'Al xat de la sala et veuran com a',
      enterCta: 'Entrar a la sala',
    },
    public: {
      name: 'Espai públic',
      shortName: 'Públic',
      tagline: 'Pel que portes posat',
      spaceTitle: 'Aquí a prop',
      peopleLabel: 'Gent',
      peopleSearching: 'Buscant gent a prop…',
      composerPlaceholder: 'Escriu a la gent d’aquí…',
      emptyTitle: 'Encara no ha parlat ningú',
      emptySubtitle: 'Tan bon punt hi hagi algú a prop amb SkyMatch, apareixerà aquí.',
      locationTitle: 'De quin color vas vestit?',
      locationSubtitle: 'El color de la roba que portes posada ara mateix.',
      locationHelp:
        'Aquí no hi ha seients ni números, així que s’assenyala algú com es fa sempre: per la roba, "el de la samarreta vermella". El color que triïs surt al costat dels teus missatges i és el que permet que et reconeguin entre la gent. Si et canvies de roba o de lloc, canvia-ho a El meu perfil.',
      locationFieldLabel: 'COLOR DE LA TEVA ROBA',
      identityNote: 'Aquí et veuran com a',
      enterCta: 'Entrar',
    },
  },
};
