import type { Strings } from './es';

/** Français. */
export const fr: Strings = {
  common: {
    back: 'Retour',
    close: 'Fermer',
    send: 'Envoyer',
    continue: 'Continuer',
    next: 'Suivant',
    photo: 'Photo',
    private: 'Privé',
    you: 'Toi',
    remove: 'Retirer',
    see: 'Voir',
    cancel: 'Annuler',
  },

  welcome: {
    badge: 'SANS WIFI NI DONNÉES',
    title: 'Le chat des gens juste à côté de toi',
    body:
      'Un avion, un train, la salle de sport ou un bar : un chat commun avec ceux qui sont près de toi, ' +
      'repérés par où ils sont ou ce qu’ils portent, en utilisant le Bluetooth de ton propre téléphone ' +
      'pour te connecter directement aux autres.',
    cta: 'Commencer',
    disclaimer: 'Rien ne sort de la pièce : tout voyage de téléphone à téléphone par Bluetooth.',
  },

  tutorial: {
    diagramYou: 'TOI',
    page1Label: 'COMMENT ÇA MARCHE · 1 SUR 3',
    page1Title: 'Les messages sautent d’appareil en appareil',
    page1Body:
      'SkyMatch n’utilise ni internet ni le wifi. Ton appareil parle en Bluetooth avec ceux qui l’entourent, et chacun transmet les messages au suivant.',
    page1Caption:
      'L’appareil de droite est trop loin pour t’entendre, mais celui du milieu lui transmet ton message.',
    page1Body2:
      'Le Bluetooth porte à plusieurs mètres, et chaque saut s’ajoute : un message peut traverser de nombreux appareils avant d’arriver. Plus il y a de monde avec SkyMatch, plus il va loin.',
    page1CalloutTitle: 'Ça marche en mode avion',
    page1CalloutBody:
      'Pas besoin de wifi, de données ni de réseau. En avion, tu peux laisser le mode avion activé et rallumer seulement le Bluetooth.',
    page2Label: 'COMMENT ÇA MARCHE · 2 SUR 3',
    /** Page 2 on iOS: the links an iPhone already has keep working locked; finding new people is what iOS limits. */
    page2Title: 'Ouvre l’appli pour découvrir les gens autour de toi',
    page2Body:
      'Ouvre-la quelques secondes en arrivant pour te connecter aux personnes proches. Ensuite tu peux verrouiller ton iPhone : les discussions déjà commencées continuent de t’arriver.',
    page2Caption: 'L’appareil du milieu est verrouillé, et il transmet quand même ton message.',
    page2CalloutTitle: 'iPhone verrouillé',
    page2CalloutBody:
      'Il met plus de temps à trouver de nouvelles personnes, et deux iPhone verrouillés qui ne se sont jamais vus ne se trouvent pas. Si tu fermes SkyMatch depuis le sélecteur d’applis, tu ne reçois plus rien.',
    /** Page 2 on Android, where the app stays on the mesh in the background (SkyMatchBackgroundService). */
    page2TitleAndroid: 'Ouvre l’appli pour découvrir les gens autour de toi',
    page2BodyAndroid:
      'SkyMatch reste connectée en arrière-plan, comme l’indiquera une notification : tu peux verrouiller ton appareil et continuer à recevoir des messages.',
    page2CalloutTitleAndroid: 'Quand elle cesse de fonctionner',
    page2CalloutBodyAndroid:
      'Si tu touches « Déconnecter » dans la notification ou fermes SkyMatch depuis les applis récentes, tu ne reçois plus de messages et tu ne les relaies plus.',
    page3Label: 'COMMENT ÇA MARCHE · 3 SUR 3',
    page3Title: 'Vos discussions privées, vous seuls pouvez les lire',
    page3Body:
      'Les discussions privées sont chiffrées de bout en bout et signées : personne ne peut les lire ni se faire passer pour toi.',
    page3Caption:
      'L’appareil du milieu n’a que le message chiffré ; celui de droite, son destinataire, le déchiffre.',
    securityCalloutTitle: 'Tes discussions restent avec toi',
    securityCalloutBody:
      'Si quelqu’un s’éloigne, votre discussion reste enregistrée et marquée « Pas de connexion ». Quand vous êtes de nouveau proches, vous vous reconnectez tout seuls, et ce qui n’est pas arrivé est renvoyé.',
    permissionTitle: 'Touche « Autoriser »',
    permissionBody:
      'En entrant, ton iPhone te demandera d’utiliser le Bluetooth. Accepte : sans lui, SkyMatch ne peut trouver personne.',
    permissionBodyAndroid:
      'En entrant, ton appareil te demandera de trouver les appareils à proximité. Accepte : sans cette autorisation, SkyMatch ne peut trouver personne.',
    understood: 'Compris',
  },

  venuePicker: {
    step: 'ÉTAPE 1 SUR 3',
    title: 'Où es-tu ?',
    subtitle:
      'Une seule chose change : la façon dont les autres te trouvent sans connaître ton nom. Le reste de l’appli est identique dans les quatre.',
  },

  locationStep: {
    step: 'ÉTAPE 2 SUR 3',
  },

  profileSetup: {
    step: 'ÉTAPE 3 SUR 3',
    title: 'Crée ton profil',
    photoHint: 'Facultatif : les personnes autour de toi la verront.',
    identitySuffix: '— le nom est juste là pour l’accompagner.',
    namePlaceholder: 'Ton nom ou un surnom',
    contactLabel: 'Instagram / WhatsApp (facultatif)',
    contactPlaceholder: '@tonpseudo ou ton numéro',
    contactHint: 'Seul quelqu’un qui touche ton nom dans le chat pour ouvrir ta fiche le verra. Laisse vide si tu préfères ne pas le partager.',
  },

  sessionStart: {
    greeting: (nickname: string) => `SALUT, ${nickname.toUpperCase()}`,
    title: 'Où es-tu en ce moment ?',
    subtitle: 'C’est la seule chose qui change d’un jour à l’autre. Ton nom, ton contact et ta photo restent enregistrés.',
  },

  cabin: {
    myProfile: 'Mon profil',
  },

  chat: {
    title: 'Privé',
    noContact: 'Aucun contact partagé',
    placeholder: 'Écris un message…',
    seen: 'Vu',
    /** The ··· button in the chat's top bar, and what it offers. */
    options: 'Options',
    viewProfile: 'Voir le profil',
    /** Under the chat header while this person is muted; tapping it undoes it. */
    mutedNotice: (nickname: string) => `Tu as masqué ${nickname} : tu ne vois plus ses nouveaux messages.`,
    /** Under a private message of ours that never reached them; tapping it tries again. */
    undelivered: 'Non distribué · Touche pour renvoyer',
    replyingTo: (nickname: string) => `Réponse à ${nickname}`,
    encrypted: 'Chiffré de bout en bout',
    notEncrypted: 'Non chiffré : cette personne utilise une ancienne version de SkyMatch',
    away: (minutes: number) =>
      minutes < 1
        ? 'Pas de connexion : vos messages ne lui parviennent pas pour l’instant'
        : `Pas de connexion depuis ${minutes} min : vos messages ne lui parviennent pas pour l’instant`,
    offline:
      'Pas de connexion : cette personne n’est plus à proximité et vos messages ne lui parviendront pas',
  },

  passengers: {
    ownPreview: (body: string) => `Toi : ${body}`,
    noMessagesYet: 'Pas encore de messages',
    away: (minutes: number) =>
      minutes < 1 ? 'Pas de connexion · à l’instant' : `Pas de connexion · il y a ${minutes} min`,
    offline: 'Pas de connexion',
    delete: 'Supprimer',
    deleteTitle: (nickname: string) => `Supprimer la discussion avec ${nickname} ?`,
    deleteBody: (nickname: string) =>
      `Les messages et les photos sont supprimés de ce téléphone. ${nickname} garde sa copie.`,
  },

  profile: {
    notArrivedYet: 'Son profil n’est pas encore arrivé.',
    contactLabel: 'CONTACT',
    noContactShared: 'Cette personne n’a partagé aucun contact.',
    openConversation: 'Ouvrir la conversation',
    sendPrivateMessage: 'Envoyer un message privé',
    mute: 'Masquer cette personne',
    unmute: 'Ne plus masquer',
  },

  settings: {
    title: 'Réglages',
    /** Accessibility label of the gear on your profile. */
    open: 'Réglages',
    appearance: 'APPARENCE',
    appearanceSystem: 'Appareil',
    appearanceLight: 'Clair',
    appearanceDark: 'Sombre',
    appearanceHint: '« Appareil » suit le mode clair ou sombre de ton téléphone.',
    accent: 'COULEUR D’ACCENT',
    accentHint: 'La couleur des boutons envoyer, passagers et principaux, et du trait quand tu écris.',
    /** Read out for each colour swatch. */
    accentNames: { blue: 'Bleu', violet: 'Violet', pink: 'Rose', red: 'Rouge', orange: 'Orange', green: 'Vert', teal: 'Turquoise', graphite: 'Graphite' },
    contact: 'CONTACT',
    contactDeveloper: 'Écrire au développeur',
    contactSoon: 'Disponible très bientôt',
    contactHint: 'Dis-nous ce que tu aimes, ce qui ne marche pas ou ce qui te manque.',
    notifications: 'NOTIFICATIONS',
    notifyPrivate: 'Discussions privées',
    notifyCabin: 'Chat de cabine',
    notifyReactions: 'Réactions',
    notifyReactionsHint: 'Quand quelqu’un réagit à ton « Je suis debout » ou « Je libère la machine ».',
    notifyHint: 'Uniquement avec l’app en arrière-plan. Pour le chat de cabine, une toutes les 30 secondes au plus.',
  },

  myProfile: {
    title: 'Mon profil',
    changePhoto: 'Changer la photo',
    addPhoto: 'Ajouter une photo',
    photoTooBigTitle: 'Photo trop lourde',
    photoTooBigBody: 'Essaie une autre image : par Bluetooth, seules de très petites photos passent.',
    nameLabel: 'NOM',
    contactLabel: 'INSTAGRAM / WHATSAPP (FACULTATIF)',
    contactHint: 'Seul quelqu’un qui ouvre ta fiche ou une discussion privée avec toi le verra. Laisse vide pour ne pas le partager.',
    mutedTitle: 'Masqués',
    mutedBody:
      'Tu ne vois pas leurs messages. Ton téléphone continue de transmettre les leurs aux autres, parce que c’est comme ça que les messages de tout le monde arrivent.',
    mutedUnknown: 'Quelqu’un qui n’est plus à proximité',
    alertsTitle: 'Alertes',
    alertsOn:
      'On te prévient de ce qui arrive quand l’app est en arrière-plan ; choisis quoi dans Réglages. Si tu fermes complètement l’app, le Bluetooth s’arrête et rien n’arrive.',
    alertsOff: 'Active les alertes pour être prévenu des messages et réactions même sans l’app à l’écran.',
    openSettings: 'Ouvrir les Réglages',
    enableAlerts: 'Activer les alertes',
    save: 'Enregistrer',
    howItWorks: 'Comment fonctionne SkyMatch',
  },

  reactions: {
    count: (total: number) => (total === 1 ? '1 réaction' : `${total} réactions`),
    empty: 'Personne n’a encore réagi.',
    tapToWrite: 'Touche pour lui écrire',
  },

  radio: {
    panelLabel: 'ÉTAT DE LA RADIO',
    advertising: 'On te voit (émission)',
    scanning: 'Tu cherches (scan)',
    devices: 'Téléphones détectés',
    connected: 'Connectés',
    listeners: 'Ils t’écoutent',
    moduleMissing: 'module non chargé',
    on: 'allumé',
    off: 'éteint',
    noPermission: 'sans autorisation',
    unavailable: 'indisponible',
    starting: 'démarrage…',
    noAnswer: 'sans réponse',
    deniedTitle: 'SkyMatch n’a pas l’autorisation Bluetooth',
    deniedAction: 'Donne-la dans les Réglages',
    poweredOffTitle: 'Le Bluetooth est éteint',
    poweredOffAction: 'Allume-le pour voir qui est près de toi',
    unsupportedTitle: 'Ce téléphone ne peut pas utiliser le Bluetooth basse consommation',
    invisibleTitle: 'Tu vois les autres, mais eux ne te voient pas',
  },

  background: {
    title: 'SkyMatch reste connecté',
    body:
      'Vous recevez vos messages et relayez ceux des autres même hors de l’app.',
    stop: 'Déconnecter',
    channelName: 'Connexion en arrière-plan',
  },

  notifications: {
    sentPhoto: 'T’a envoyé une photo',
    channelName: 'Messages et alertes',
    cabinTitle: 'Chat de cabine',
    reactedTo: { standing: 'A réagi : tu es debout', leavingMachine: 'A réagi : tu libères la machine' },
  },

  presence: {
    countdown: (minutes: number) => ` dans ${minutes} min`,
    byStatus: {
      standing: { self: 'Tu es debout', other: 'est debout' },
      leavingMachine: { self: 'Tu libères la machine', other: 'libère la machine' },
    },
  },

  muscles: {
    chest: 'Pectoraux',
    back: 'Dos',
    legs: 'Jambes',
    shoulders: 'Épaules',
    arms: 'Bras',
    core: 'Gainage',
    cardio: 'Cardio',
    fullbody: 'Full body',
  },

  colors: {
    black: 'Noir',
    white: 'Blanc',
    grey: 'Gris',
    red: 'Rouge',
    blue: 'Bleu',
    green: 'Vert',
    yellow: 'Jaune',
    pink: 'Rose',
  },

  location: {
    coachShort: 'V',
    describeSeat: (seat: string) => `Place ${seat}`,
    describeCoachSeat: (coach: number, seat: string) => `Voiture ${coach}, place ${seat}`,
    describeMuscle: (muscle: string) => `S’entraîne aujourd’hui : ${muscle.toLowerCase()}`,
    describeOutfit: (color: string) => `Est en ${color.toLowerCase()}`,
    /** Prefix of the row number on a classroom badge: one letter, like the coach's. */
    rowShort: 'R',
    sideShort: { left: 'Gauche', center: 'Centre', right: 'Droite' },
    sideLong: { left: 'à gauche', center: 'au centre', right: 'à droite' },
    describeClass: (row: number, side: string) => `Rangée ${row}, ${side}`,
  },

  picker: {
    /** The two cabin layouts a plane seat can be picked from; long-haul planes run to K. */
    cabinNarrow: 'Une allée · 3-3',
    cabinWide: 'Deux allées · 3-4-3',
    coachLabel: 'VOITURE',
    seatLetterHint: 'Touche la lettre de ta place',
    rowLabel: 'RANG',
    outfitHint: 'Celle du vêtement qu’on voit le plus : le t-shirt, le sweat ou la veste que tu portes.',
    spotLabel: 'TU ES OÙ ? (FACULTATIF)',
    spotPlaceholder: 'Au bar, en terrasse, près de l’entrée…',
    spotHint: 'Un endroit précis évite la moitié des regards. Tu peux le changer quand tu bouges.',
    classRowHint: 'En partant du tableau : le premier rang est le 1.',
    classSideLabel: 'CÔTÉ DE LA SALLE',
    classSideHint: 'Face au tableau.',
    classSides: { left: 'Gauche', center: 'Centre', right: 'Droite' },
  },

  venues: {
    plane: {
      name: 'Avion',
      shortName: 'Avion',
      tagline: 'Ta place, c’est ton identité',
      spaceTitle: 'Cabine',
      peopleLabel: 'Passagers',
      peopleSearching: 'Recherche de passagers à proximité…',
      composerPlaceholder: 'Écris à toute la cabine…',
      emptyTitle: 'Personne n’a encore parlé',
      emptySubtitle: 'Dès qu’il y aura des passagers près de toi avec SkyMatch, ils apparaîtront ici.',
      locationTitle: 'Tu es à quelle place ?',
      locationSubtitle: 'C’est comme ça qu’on te reconnaîtra dans le chat de la cabine.',
      locationHelp:
        'Ici personne ne connaît ton nom : ta place est ce qui apparaît à côté de chacun de tes messages et ce que les autres utilisent pour te situer dans la cabine.',
      locationFieldLabel: 'TA PLACE',
      identityNote: 'Dans le chat de la cabine on te verra comme',
      enterCta: 'Entrer dans la cabine',
    },
    train: {
      name: 'Train',
      shortName: 'Train',
      tagline: 'Voiture et place',
      spaceTitle: 'Train',
      peopleLabel: 'Voyageurs',
      peopleSearching: 'Recherche de voyageurs à proximité…',
      composerPlaceholder: 'Écris à tout le train…',
      emptyTitle: 'Personne n’a encore parlé',
      emptySubtitle: 'Dès qu’il y aura des voyageurs près de toi avec SkyMatch, ils apparaîtront ici.',
      locationTitle: 'Tu es assis où ?',
      locationSubtitle: 'Voiture et place : ça suffit pour te trouver.',
      locationHelp:
        'Un train est long et les mêmes numéros de place reviennent dans chaque voiture. Les deux ensemble apparaissent à côté de tes messages et permettent à quelqu’un de savoir où tu es.',
      locationFieldLabel: 'TA VOITURE ET TA PLACE',
      identityNote: 'Dans le chat du train on te verra comme',
      enterCta: 'Entrer dans le train',
    },
    gym: {
      name: 'Salle de sport',
      shortName: 'Salle',
      tagline: 'Par ce que tu travailles aujourd’hui',
      spaceTitle: 'Salle',
      peopleLabel: 'Gens',
      peopleSearching: 'Recherche de gens qui s’entraînent à proximité…',
      composerPlaceholder: 'Écris à toute la salle…',
      emptyTitle: 'Personne n’a encore parlé',
      emptySubtitle: 'Dès qu’il y aura quelqu’un près de toi avec SkyMatch, il apparaîtra ici.',
      locationTitle: 'Tu travailles quoi aujourd’hui ?',
      locationSubtitle: 'C’est ce qui te situe dans la salle : ceux qui travaillent la même chose te trouvent.',
      locationHelp:
        'Dans une salle sans places ni numéros, ce qui te situe c’est la zone où tu es, et c’est ce que dit ton groupe musculaire. Il apparaît à côté de tes messages et c’est ce qui te met en lien avec ceux qui sont sur les mêmes machines.',
      locationFieldLabel: 'CE QUE TU TRAVAILLES AUJOURD’HUI',
      identityNote: 'Dans le chat de la salle on te verra comme',
      enterCta: 'Entrer dans la salle',
    },
    public: {
      name: 'Espace public',
      shortName: 'Public',
      tagline: 'Par ce que tu portes',
      spaceTitle: 'Par ici',
      peopleLabel: 'Gens',
      peopleSearching: 'Recherche de gens à proximité…',
      composerPlaceholder: 'Écris aux gens d’ici…',
      emptyTitle: 'Personne n’a encore parlé',
      emptySubtitle: 'Dès qu’il y aura quelqu’un près de toi avec SkyMatch, il apparaîtra ici.',
      locationTitle: 'Tu portes quelle couleur ?',
      locationSubtitle: 'La couleur des vêtements que tu portes en ce moment.',
      locationHelp:
        'Ici il n’y a ni places ni numéros, alors on désigne quelqu’un comme on le fait toujours : par ses vêtements, "le mec au t-shirt rouge". La couleur que tu choisis apparaît à côté de tes messages et permet qu’on te reconnaisse dans la foule. Si tu changes de vêtements ou d’endroit, change-la dans Mon profil.',
      locationFieldLabel: 'LA COULEUR DE TES VÊTEMENTS',
      identityNote: 'Ici on te verra comme',
      enterCta: 'Entrer',
    },
    class: {
      name: 'Cours',
      shortName: 'Cours',
      tagline: 'Ta rangée et ton côté de la salle',
      spaceTitle: 'Cours',
      peopleLabel: 'Camarades',
      peopleSearching: 'Recherche de camarades à proximité…',
      composerPlaceholder: 'Écris à toute la classe…',
      emptyTitle: 'Personne n’a encore parlé',
      emptySubtitle: 'Dès que des camarades à proximité auront SkyMatch, ils apparaîtront ici.',
      locationTitle: 'Où es-tu assis ?',
      locationSubtitle: 'Rangée et côté de la salle : c’est comme ça qu’on te trouve.',
      locationHelp: 'Dans une salle de cours, les tables n’ont pas de lettre, alors on désigne quelqu’un comme toujours : « celui du troisième rang, à gauche ». Ça s’affiche à côté de tes messages. Si tu changes de place, modifie-le dans Mon profil.',
      locationFieldLabel: 'TA PLACE EN COURS',
      identityNote: 'Dans le chat du cours, on te verra comme',
      enterCta: 'Entrer en cours',
    },
  },
};
