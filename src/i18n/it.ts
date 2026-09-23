import type { Strings } from './es';

/** Italiano. */
export const it: Strings = {
  common: {
    back: 'Indietro',
    close: 'Chiudi',
    send: 'Invia',
    continue: 'Continua',
    next: 'Avanti',
    photo: 'Foto',
    private: 'Privato',
    you: 'Tu',
    remove: 'Togli',
    see: 'Vedi',
    cancel: 'Annulla',
  },

  welcome: {
    badge: 'SENZA WIFI NÉ DATI',
    title: 'La chat di chi hai accanto',
    body:
      'Un aereo, un treno, la palestra o un bar: una chat comune con chi ti sta vicino, ' +
      'riconoscibile da dove si trova o da cosa indossa, usando il Bluetooth del tuo telefono ' +
      'per collegarti direttamente agli altri.',
    cta: 'Inizia',
    disclaimer: 'Non esce niente dalla stanza: tutto viaggia da telefono a telefono via Bluetooth.',
  },

  tutorial: {
    diagramYou: 'TU',
    page1Label: 'COME FUNZIONA · 1 DI 3',
    page1Title: 'I messaggi saltano da telefono a telefono',
    page1Body:
      'SkyMatch non usa internet né wifi. Il tuo telefono parla via Bluetooth con quelli che ha vicino, e ognuno passa i messaggi al successivo.',
    page1Caption: 'Il telefono a destra è troppo lontano per sentirti, ma quello in mezzo gli passa il tuo messaggio.',
    page1Body2:
      'Il Bluetooth arriva a pochi metri, ma ogni salto si somma: un messaggio può attraversare diversi telefoni prima di arrivare. Più persone hanno SkyMatch, più lontano arriva.',
    page1CalloutTitle: 'Funziona in modalità aereo',
    page1CalloutBody:
      'Non servono wifi, dati né campo. In aereo puoi lasciare attiva la modalità aereo e riaccendere solo il Bluetooth.',
    page2Label: 'COME FUNZIONA · 2 DI 3',
    /** Page 2 on iOS: the links an iPhone already has keep working locked; finding new people is what iOS limits. */
    page2Title: 'Aprila quando arrivi, poi metti via il telefono',
    page2Body:
      'Apri SkyMatch quando arrivi e tienila qualche secondo sullo schermo: così il tuo iPhone si collega con chi hai vicino. Dopo puoi bloccarlo o usare altre app, e continuerai a ricevere messaggi e a fare da ponte per gli altri.',
    page2Caption: 'Il telefono in mezzo è bloccato, eppure passa il tuo messaggio.',
    page2Body2:
      'Non c’è un server: i messaggi esistono solo sui telefoni intorno a te, quindi quello che si dice mentre sei disconnesso non si può recuperare. Le tue chat private invece restano salvate sul tuo telefono.',
    page2CalloutTitle: 'Cosa non può fare un iPhone bloccato',
    page2CalloutBody:
      'Con lo schermo bloccato ci mette di più a trovare persone nuove, e due iPhone bloccati che non si sono mai visti non si trovano. Se chiudi del tutto SkyMatch dal multitasking, smetti di ricevere messaggi e di fare da ponte.',
    /** Page 2 on Android, where the app stays on the mesh in the background (SkyMatchBackgroundService). */
    page2TitleAndroid: 'Resta connessa anche se esci',
    page2BodyAndroid:
      'Su Android, SkyMatch resta connessa in background: lo vedrai in una notifica. Puoi bloccare il telefono o usare altre app, e continuerai a ricevere messaggi e a fare da ponte per gli altri.',
    page2CalloutTitleAndroid: 'Quando smette di funzionare',
    page2CalloutBodyAndroid:
      'Se tocchi «Disconnetti» nella notifica o chiudi SkyMatch dalle app recenti, smetti di ricevere messaggi e di fare da ponte.',
    page3Label: 'COME FUNZIONA · 3 DI 3',
    page3Title: 'Le vostre chat private le leggete solo voi due',
    page3Body:
      'I messaggi privati sono crittografati end-to-end. I telefoni che fanno da ponte li passano senza poterli aprire: né il testo né le foto.',
    page3Caption: 'Il telefono in mezzo ha solo il messaggio cifrato; quello a destra, a cui è destinato, lo decifra.',
    page3Body2: 'Inoltre tutto ciò che invii è firmato dal tuo telefono, quindi nessuno può scrivere fingendosi te.',
    securityCalloutTitle: 'Guarda l’intestazione della chat',
    securityCalloutBody:
      'Se l’altra persona usa una versione vecchia di SkyMatch, la vostra chat privata non è crittografata e te lo segnaliamo in rosso. Quello che nessuno può verificare è la posizione: posto, carrozza o macchina li indica ognuno da sé.',
    understood: 'Ho capito',
  },

  venuePicker: {
    step: 'PASSO 1 DI 3',
    title: 'Dove sei?',
    subtitle:
      'Cambia solo una cosa: come ti trovano gli altri senza sapere il tuo nome. Il resto dell’app è uguale in tutti e quattro.',
  },

  locationStep: {
    step: 'PASSO 2 DI 3',
  },

  profileSetup: {
    step: 'PASSO 3 DI 3',
    title: 'Come ti chiamiamo?',
    identitySuffix: '— il nome serve solo ad accompagnarlo.',
    namePlaceholder: 'Il tuo nome o un soprannome',
    contactLabel: 'Instagram / WhatsApp (facoltativo)',
    contactPlaceholder: '@iltuonome o il tuo numero',
    contactHint: 'Lo vedrà solo chi tocca il tuo nome in chat per aprire la tua scheda. Lascialo vuoto se preferisci non condividerlo.',
  },

  sessionStart: {
    greeting: (nickname: string) => `CIAO, ${nickname.toUpperCase()}`,
    title: 'Dove sei adesso?',
    subtitle: 'È l’unica cosa che cambia da un giorno all’altro. Il tuo nome, il tuo contatto e la tua foto restano salvati.',
  },

  cabin: {
    myProfile: 'Il mio profilo',
  },

  chat: {
    title: 'Privato',
    noContact: 'Non ha condiviso un contatto',
    placeholder: 'Scrivi un messaggio…',
    seen: 'Visto',
    /** The ··· button in the chat's top bar, and what it offers. */
    options: 'Opzioni',
    viewProfile: 'Vedi profilo',
    /** Under the chat header while this person is muted; tapping it undoes it. */
    mutedNotice: (nickname: string) => `Hai silenziato ${nickname}: non vedi i suoi nuovi messaggi.`,
    /** Under a private message of ours that never reached them; tapping it tries again. */
    undelivered: 'Non consegnato · Tocca per inviare di nuovo',
    replyingTo: (nickname: string) => `Rispondi a ${nickname}`,
    encrypted: 'Crittografia end-to-end',
    notEncrypted: 'Non crittografata: questa persona usa una versione vecchia di SkyMatch',
    away: (minutes: number) =>
      minutes < 1
        ? 'Nessuna connessione: per ora i tuoi messaggi non arrivano'
        : `Nessuna connessione da ${minutes} min: per ora i tuoi messaggi non arrivano`,
    offline:
      'Nessuna connessione: questa persona non è più vicina e i tuoi messaggi non arriveranno',
  },

  passengers: {
    ownPreview: (body: string) => `Tu: ${body}`,
    noMessagesYet: 'Ancora nessun messaggio',
    away: (minutes: number) =>
      minutes < 1 ? 'Nessuna connessione · proprio ora' : `Nessuna connessione · ${minutes} min fa`,
    offline: 'Nessuna connessione',
    delete: 'Elimina',
    deleteTitle: (nickname: string) => `Eliminare la chat con ${nickname}?`,
    deleteBody: (nickname: string) =>
      `I messaggi e le foto vengono eliminati da questo telefono. ${nickname} conserva la propria copia.`,
  },

  profile: {
    notArrivedYet: 'Il suo profilo non è ancora arrivato.',
    contactLabel: 'CONTATTO',
    noContactShared: 'Non ha condiviso nessun contatto.',
    openConversation: 'Apri conversazione',
    sendPrivateMessage: 'Invia messaggio privato',
    mute: 'Silenzia questa persona',
    unmute: 'Non silenziare più',
  },

  myProfile: {
    title: 'Il mio profilo',
    changePhoto: 'Cambia foto',
    addPhoto: 'Aggiungi foto',
    photoTooBigTitle: 'Foto troppo grande',
    photoTooBigBody: 'Prova con un’altra immagine: via Bluetooth passano solo foto molto piccole.',
    nameLabel: 'NOME',
    contactLabel: 'INSTAGRAM / WHATSAPP (FACOLTATIVO)',
    contactHint: 'Lo vedrà solo chi apre la tua scheda o una chat privata con te. Lascialo vuoto per non condividerlo.',
    mutedTitle: 'Silenziati',
    mutedBody:
      'Non vedi i loro messaggi. Il tuo telefono continua a passare i loro agli altri, perché è parte di come arrivano i messaggi di tutti.',
    mutedUnknown: 'Qualcuno che non è più vicino',
    alertsTitle: 'Avvisi',
    alertsOn:
      'Ti avvisiamo dei messaggi privati che arrivano con l’app in secondo piano. Se chiudi l’app del tutto, il Bluetooth si spegne e non arriva niente.',
    alertsOff: 'Attiva gli avvisi per sapere dei messaggi privati anche senza l’app sullo schermo.',
    openSettings: 'Apri Impostazioni',
    enableAlerts: 'Attiva gli avvisi',
    save: 'Salva modifiche',
    howItWorks: 'Come funziona SkyMatch',
  },

  reactions: {
    count: (total: number) => (total === 1 ? '1 reazione' : `${total} reazioni`),
    empty: 'Non ha ancora reagito nessuno.',
    tapToWrite: 'Tocca per scrivergli',
  },

  radio: {
    panelLabel: 'STATO DELLA RADIO',
    advertising: 'Ti vedono (in trasmissione)',
    scanning: 'Tu cerchi (scansione)',
    devices: 'Telefoni rilevati',
    connected: 'Connessi',
    listeners: 'Ti ascoltano',
    moduleMissing: 'modulo non caricato',
    on: 'acceso',
    off: 'spento',
    noPermission: 'senza permesso',
    unavailable: 'non disponibile',
    starting: 'avvio…',
    noAnswer: 'nessuna risposta',
    deniedTitle: 'SkyMatch non ha il permesso Bluetooth',
    deniedAction: 'Daglielo in Impostazioni',
    poweredOffTitle: 'Il Bluetooth è spento',
    poweredOffAction: 'Accendilo per vedere chi hai vicino',
    unsupportedTitle: 'Questo telefono non può usare il Bluetooth a basso consumo',
    invisibleTitle: 'Tu vedi gli altri, ma loro non vedono te',
  },

  background: {
    title: 'SkyMatch resta connesso',
    body:
      'Continui a ricevere messaggi e a fare da ponte per gli altri anche fuori dall’app.',
    stop: 'Disconnetti',
    channelName: 'Connessione in background',
  },

  notifications: {
    sentPhoto: 'Ti ha mandato una foto',
    channelName: 'Messaggi privati',
  },

  presence: {
    countdown: (minutes: number) => ` tra ${minutes} min`,
    byStatus: {
      standing: { self: 'Sei in piedi', other: 'è in piedi' },
      leavingMachine: { self: 'Lasci la macchina', other: 'lascia la macchina' },
    },
  },

  muscles: {
    chest: 'Petto',
    back: 'Schiena',
    legs: 'Gambe',
    shoulders: 'Spalle',
    arms: 'Braccia',
    core: 'Core',
    cardio: 'Cardio',
    fullbody: 'Full body',
  },

  colors: {
    black: 'Nero',
    white: 'Bianco',
    grey: 'Grigio',
    red: 'Rosso',
    blue: 'Blu',
    green: 'Verde',
    yellow: 'Giallo',
    pink: 'Rosa',
  },

  location: {
    coachShort: 'C',
    describeSeat: (seat: string) => `Posto ${seat}`,
    describeCoachSeat: (coach: number, seat: string) => `Carrozza ${coach}, posto ${seat}`,
    describeMuscle: (muscle: string) => `Oggi allena ${muscle.toLowerCase()}`,
    describeOutfit: (color: string) => `Veste di ${color.toLowerCase()}`,
  },

  picker: {
    coachLabel: 'CARROZZA',
    seatLetterHint: 'Tocca la lettera del tuo posto',
    rowLabel: 'FILA',
    outfitHint: 'Quello del capo che si vede di più: la maglietta, la felpa o la giacca che hai addosso.',
    spotLabel: 'DOVE SEI? (FACOLTATIVO)',
    spotPlaceholder: 'Al bancone, in terrazza, vicino all’ingresso…',
    spotHint: 'Un punto preciso ti risparmia metà delle occhiate. Puoi cambiarlo quando ti sposti.',
  },

  venues: {
    plane: {
      name: 'Aereo',
      shortName: 'Aereo',
      tagline: 'Il tuo posto è la tua identità',
      spaceTitle: 'Cabina',
      peopleLabel: 'Passeggeri',
      peopleSearching: 'Cerco passeggeri qui vicino…',
      composerPlaceholder: 'Scrivi a tutta la cabina…',
      emptyTitle: 'Non ha ancora parlato nessuno',
      emptySubtitle: 'Appena ci saranno passeggeri vicini con SkyMatch, compariranno qui.',
      locationTitle: 'A che posto sei?',
      locationSubtitle: 'È così che ti riconosceranno nella chat della cabina.',
      locationHelp:
        'Qui nessuno sa il tuo nome: il tuo posto è quello che compare accanto a ogni tuo messaggio ed è quello che gli altri usano per collocarti in cabina.',
      locationFieldLabel: 'IL TUO POSTO',
      identityNote: 'Nella chat della cabina ti vedranno come',
      enterCta: 'Entra in cabina',
    },
    train: {
      name: 'Treno',
      shortName: 'Treno',
      tagline: 'Carrozza e posto',
      spaceTitle: 'Treno',
      peopleLabel: 'Viaggiatori',
      peopleSearching: 'Cerco viaggiatori qui vicino…',
      composerPlaceholder: 'Scrivi a tutto il treno…',
      emptyTitle: 'Non ha ancora parlato nessuno',
      emptySubtitle: 'Appena ci saranno viaggiatori vicini con SkyMatch, compariranno qui.',
      locationTitle: 'Dove sei seduto?',
      locationSubtitle: 'Carrozza e posto: con quelli ti trovano.',
      locationHelp:
        'Un treno è lungo e gli stessi numeri di posto tornano in ogni carrozza. Insieme compaiono accanto ai tuoi messaggi e sono quello che permette a qualcuno di sapere dove sei.',
      locationFieldLabel: 'LA TUA CARROZZA E IL TUO POSTO',
      identityNote: 'Nella chat del treno ti vedranno come',
      enterCta: 'Entra nel treno',
    },
    gym: {
      name: 'Palestra',
      shortName: 'Palestra',
      tagline: 'Per quello che alleni oggi',
      spaceTitle: 'Sala',
      peopleLabel: 'Gente',
      peopleSearching: 'Cerco gente che si allena qui vicino…',
      composerPlaceholder: 'Scrivi a tutta la sala…',
      emptyTitle: 'Non ha ancora parlato nessuno',
      emptySubtitle: 'Appena ci sarà qualcuno vicino con SkyMatch, comparirà qui.',
      locationTitle: 'Cosa alleni oggi?',
      locationSubtitle: 'È quello che ti colloca in sala: chi allena la stessa cosa ti trova.',
      locationHelp:
        'In una sala senza posti né numeri, quello che ti colloca è la zona in cui sei, e lo dice quello che alleni. Compare accanto ai tuoi messaggi ed è quello che ti mette in contatto con chi sta sulle stesse macchine.',
      locationFieldLabel: 'QUELLO CHE ALLENI OGGI',
      identityNote: 'Nella chat della sala ti vedranno come',
      enterCta: 'Entra in sala',
    },
    public: {
      name: 'Spazio pubblico',
      shortName: 'Pubblico',
      tagline: 'Per quello che indossi',
      spaceTitle: 'Qui vicino',
      peopleLabel: 'Gente',
      peopleSearching: 'Cerco gente qui vicino…',
      composerPlaceholder: 'Scrivi alla gente di qui…',
      emptyTitle: 'Non ha ancora parlato nessuno',
      emptySubtitle: 'Appena ci sarà qualcuno vicino con SkyMatch, comparirà qui.',
      locationTitle: 'Di che colore sei vestito?',
      locationSubtitle: 'Il colore dei vestiti che hai addosso adesso.',
      locationHelp:
        'Qui non ci sono posti né numeri, quindi si indica qualcuno come si fa sempre: dai vestiti, "quello con la maglietta rossa". Il colore che scegli compare accanto ai tuoi messaggi ed è quello che permette di riconoscerti tra la gente. Se ti cambi o ti sposti, cambialo in Il mio profilo.',
      locationFieldLabel: 'IL COLORE DEI TUOI VESTITI',
      identityNote: 'Qui ti vedranno come',
      enterCta: 'Entra',
    },
  },
};
