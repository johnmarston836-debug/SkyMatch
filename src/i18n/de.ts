import type { Strings } from './es';

/** Deutsch. */
export const de: Strings = {
  common: {
    back: 'Zurück',
    close: 'Schließen',
    send: 'Senden',
    continue: 'Weiter',
    next: 'Weiter',
    photo: 'Foto',
    private: 'Privat',
    you: 'Du',
    remove: 'Entfernen',
    see: 'Ansehen',
    cancel: 'Abbrechen',
  },

  welcome: {
    badge: 'OHNE WLAN UND MOBILE DATEN',
    title: 'Der Chat für die Leute direkt neben dir',
    body:
      'Ein Flugzeug, ein Zug, das Fitnessstudio oder eine Bar: ein gemeinsamer Chat mit allen in deiner Nähe, ' +
      'erkennbar daran, wo sie sind oder was sie anhaben — über das Bluetooth deines eigenen Handys, ' +
      'direkt von Gerät zu Gerät.',
    cta: 'Los geht’s',
    disclaimer: 'Nichts verlässt den Raum: alles läuft per Bluetooth von Handy zu Handy.',
  },

  tutorial: {
    diagramYou: 'DU',
    page1Label: 'SO FUNKTIONIERT’S · 1 VON 3',
    page1Title: 'Nachrichten springen von Handy zu Handy',
    page1Body:
      'SkyMatch nutzt weder Internet noch WLAN. Dein Handy spricht per Bluetooth direkt mit den Handys in deiner Nähe.',
    page1Caption: 'Das Handy rechts ist zu weit weg, um dich zu hören, aber das in der Mitte gibt deine Nachricht weiter.',
    page1Body2:
      'Bluetooth reicht nur wenige Meter, also reichen die Handys dazwischen die Nachrichten weiter, bis sie ' +
      'ankommen. Je mehr Leute die App offen haben, desto weiter kommt alles.',
    page2Label: 'SO FUNKTIONIERT’S · 2 VON 3',
    page2Title: 'Lass die App offen',
    page2Body:
      'Dein Handy sendet und empfängt nur, solange die App auf dem Bildschirm ist. Schließt du sie oder wechselst ' +
      'zu einer anderen App, bekommst du nichts mehr — und bist auch keine Brücke mehr für die anderen.',
    page2Caption: 'Das Handy in der Mitte hat die App geschlossen: es sendet nicht mehr, und die Nachricht kommt auf der anderen Seite nicht mehr an.',
    calloutTitle: 'Verlässt du die App, verpasst du das Gespräch',
    calloutBody:
      'Es gibt keinen Server: Nachrichten existieren nur auf den Handys um dich herum, und was gesagt wird, ' +
      'während du weg bist, lässt sich später nicht nachholen. Deine privaten Chats bleiben dagegen auf deinem ' +
      'eigenen Handy gespeichert, damit du die Leute, die du kennengelernt hast, nicht mit der App verlierst.',
    page2Body2:
      'Im Flugzeug ist der Flugmodus kein Problem: du kannst ihn anlassen und Bluetooth einzeln einschalten. ' +
      'Kein WLAN, keine mobilen Daten, nirgends Empfang nötig.',
    page2TitleAndroid: 'Schließ die App nicht',
    page2BodyAndroid:
      'Auf Android bleibt SkyMatch verbunden, auch wenn du die App verlässt – du siehst es an einer Benachrichtigung. Schließt du sie ganz über die letzten Apps oder tippst auf „Trennen“, bekommst du keine Nachrichten mehr und leitest keine mehr für andere weiter.',
    calloutTitleAndroid: 'Wenn du die App schließt, verpasst du das Gespräch',
    page3Label: 'SO FUNKTIONIERT’S · 3 VON 3',
    page3Title: 'Eure privaten Chats könnt nur ihr beide lesen',
    page3Body:
      'Private Nachrichten sind Ende-zu-Ende-verschlüsselt. Die Handys, die sie weiterreichen, können sie nicht lesen: weder den Text noch die Fotos.',
    page3Body2:
      'Außerdem ist alles, was du sendest, von deinem Handy signiert. Niemand kann schreiben und sich dabei als dich ausgeben.',
    securityCalloutTitle: 'Achte auf den Kopf des Chats',
    securityCalloutBody:
      'Nutzt die andere Person eine ältere Version von SkyMatch, ist euer privater Chat nicht verschlüsselt, und wir weisen dich in Rot darauf hin. Den Sitzplatz gibt dagegen jeder selbst an: Das kann niemand überprüfen.',
    understood: 'Verstanden',
  },

  venuePicker: {
    step: 'SCHRITT 1 VON 3',
    title: 'Wo bist du?',
    subtitle:
      'Nur eines ändert sich: wie die anderen dich finden, ohne deinen Namen zu kennen. Der Rest der App ist in allen vieren gleich.',
  },

  locationStep: {
    step: 'SCHRITT 2 VON 3',
  },

  profileSetup: {
    step: 'SCHRITT 3 VON 3',
    title: 'Wie sollen wir dich nennen?',
    identitySuffix: '— der Name steht nur daneben.',
    namePlaceholder: 'Dein Name oder Spitzname',
    contactLabel: 'Instagram / WhatsApp (optional)',
    contactPlaceholder: '@deinname oder deine Nummer',
    contactHint: 'Sieht nur, wer im Chat auf deinen Namen tippt und deine Karte öffnet. Lass es leer, wenn du es lieber nicht teilst.',
  },

  sessionStart: {
    greeting: (nickname: string) => `HALLO, ${nickname.toUpperCase()}`,
    title: 'Wo bist du gerade?',
    subtitle: 'Das ist das Einzige, was sich von Tag zu Tag ändert. Dein Name, dein Kontakt und dein Foto bleiben gespeichert.',
  },

  cabin: {
    myProfile: 'Mein Profil',
  },

  chat: {
    title: 'Privat',
    noContact: 'Kein Kontakt geteilt',
    placeholder: 'Schreib eine Nachricht…',
    seen: 'Gelesen',
    /** Under a private message of ours that never reached them; tapping it tries again. */
    undelivered: 'Nicht zugestellt · Tippen zum erneuten Senden',
    replyingTo: (nickname: string) => `Antwort an ${nickname}`,
    encrypted: 'Ende-zu-Ende-verschlüsselt: Nur ihr beide könnt diesen Chat lesen',
    notEncrypted: 'Nicht verschlüsselt: Diese Person nutzt eine ältere Version von SkyMatch',
    away: (minutes: number) =>
      minutes < 1
        ? 'Keine Verbindung: Deine Nachrichten kommen im Moment nicht an'
        : `Seit ${minutes} Min. keine Verbindung: Deine Nachrichten kommen im Moment nicht an`,
    offline:
      'Keine Verbindung: Die Person ist nicht mehr in der Nähe, deine Nachrichten kommen nicht an',
  },

  passengers: {
    ownPreview: (body: string) => `Du: ${body}`,
    noMessagesYet: 'Noch keine Nachrichten',
    away: (minutes: number) =>
      minutes < 1 ? 'Keine Verbindung · gerade eben' : `Keine Verbindung · vor ${minutes} Min.`,
    offline: 'Keine Verbindung',
    delete: 'Löschen',
    deleteTitle: (nickname: string) => `Chat mit ${nickname} löschen?`,
    deleteBody: (nickname: string) =>
      `Die Nachrichten und Fotos werden von diesem Handy gelöscht. ${nickname} behält die eigene Kopie.`,
  },

  profile: {
    notArrivedYet: 'Das Profil ist noch nicht angekommen.',
    contactLabel: 'KONTAKT',
    noContactShared: 'Diese Person hat keinen Kontakt geteilt.',
    openConversation: 'Unterhaltung öffnen',
    sendPrivateMessage: 'Private Nachricht senden',
    mute: 'Diese Person stummschalten',
    unmute: 'Stummschaltung aufheben',
  },

  myProfile: {
    title: 'Mein Profil',
    changePhoto: 'Foto ändern',
    addPhoto: 'Foto hinzufügen',
    photoTooBigTitle: 'Foto zu groß',
    photoTooBigBody: 'Probier ein anderes Bild: über Bluetooth passen nur sehr kleine Fotos.',
    nameLabel: 'NAME',
    contactLabel: 'INSTAGRAM / WHATSAPP (OPTIONAL)',
    contactHint: 'Sieht nur, wer deine Karte oder einen privaten Chat mit dir öffnet. Lass es leer, um es für dich zu behalten.',
    mutedTitle: 'Stummgeschaltet',
    mutedBody:
      'Du siehst ihre Nachrichten nicht. Dein Handy gibt ihre trotzdem an die anderen weiter, denn genau so kommen die Nachrichten von allen an.',
    mutedUnknown: 'Jemand, der nicht mehr in der Nähe ist',
    alertsTitle: 'Hinweise',
    alertsOn:
      'Wir sagen dir Bescheid, wenn private Nachrichten ankommen, während die App im Hintergrund läuft. Schließt du die App ganz, geht Bluetooth aus und es kommt gar nichts mehr an.',
    alertsOff: 'Schalte Hinweise ein, um von privaten Nachrichten zu erfahren, auch wenn die App nicht auf dem Bildschirm ist.',
    openSettings: 'Einstellungen öffnen',
    enableAlerts: 'Hinweise einschalten',
    save: 'Änderungen speichern',
    howItWorks: 'So funktioniert SkyMatch',
  },

  reactions: {
    count: (total: number) => (total === 1 ? '1 Reaktion' : `${total} Reaktionen`),
    empty: 'Noch hat niemand reagiert.',
    tapToWrite: 'Tippen, um zu schreiben',
  },

  radio: {
    panelLabel: 'STATUS DES FUNKS',
    advertising: 'Man sieht dich (Senden)',
    scanning: 'Du suchst (Scan)',
    devices: 'Erkannte Handys',
    connected: 'Verbunden',
    listeners: 'Hören dich',
    moduleMissing: 'Modul nicht geladen',
    on: 'an',
    off: 'aus',
    noPermission: 'keine Berechtigung',
    unavailable: 'nicht verfügbar',
    starting: 'startet…',
    noAnswer: 'keine Antwort',
    deniedTitle: 'SkyMatch hat keine Bluetooth-Berechtigung',
    deniedAction: 'Gib sie in den Einstellungen',
    poweredOffTitle: 'Bluetooth ist aus',
    poweredOffAction: 'Schalte es ein, um zu sehen, wer in der Nähe ist',
    unsupportedTitle: 'Dieses Handy kann kein Bluetooth Low Energy',
    invisibleTitle: 'Du siehst die anderen, aber sie sehen dich nicht',
  },

  background: {
    title: 'SkyMatch bleibt verbunden',
    body:
      'Du bekommst weiter Nachrichten und leitest sie für andere weiter, auch außerhalb der App.',
    stop: 'Trennen',
    channelName: 'Verbindung im Hintergrund',
  },

  notifications: {
    sentPhoto: 'Hat dir ein Foto geschickt',
    channelName: 'Private Nachrichten',
  },

  presence: {
    countdown: (minutes: number) => ` in ${minutes} Min.`,
    byStatus: {
      standing: { self: 'Du stehst', other: 'steht' },
      leavingMachine: { self: 'Du machst das Gerät frei', other: 'macht das Gerät frei' },
    },
  },

  muscles: {
    chest: 'Brust',
    back: 'Rücken',
    legs: 'Beine',
    shoulders: 'Schultern',
    arms: 'Arme',
    core: 'Core',
    cardio: 'Cardio',
    fullbody: 'Ganzkörper',
  },

  colors: {
    black: 'Schwarz',
    white: 'Weiß',
    grey: 'Grau',
    red: 'Rot',
    blue: 'Blau',
    green: 'Grün',
    yellow: 'Gelb',
    pink: 'Pink',
  },

  location: {
    coachShort: 'W',
    describeSeat: (seat: string) => `Platz ${seat}`,
    describeCoachSeat: (coach: number, seat: string) => `Wagen ${coach}, Platz ${seat}`,
    // German nouns keep their capital, so this one is the exception that
    // doesn't lowercase what it is handed.
    describeMuscle: (muscle: string) => `Trainiert heute ${muscle}`,
    describeOutfit: (color: string) => `Trägt ${color}`,
  },

  picker: {
    coachLabel: 'WAGEN',
    seatLetterHint: 'Tippe auf deinen Sitzbuchstaben',
    rowLabel: 'REIHE',
    outfitHint: 'Die vom Kleidungsstück, das man am meisten sieht: T-Shirt, Hoodie oder Jacke.',
    spotLabel: 'WO GENAU? (OPTIONAL)',
    spotPlaceholder: 'An der Bar, auf der Terrasse, nahe am Eingang…',
    spotHint: 'Ein konkreter Ort spart die Hälfte der Suchblicke. Du kannst ihn ändern, wenn du dich bewegst.',
  },

  venues: {
    plane: {
      name: 'Flugzeug',
      shortName: 'Flugzeug',
      tagline: 'Dein Sitz ist deine Identität',
      spaceTitle: 'Kabine',
      peopleLabel: 'Passagiere',
      peopleSearching: 'Suche nach Passagieren in der Nähe…',
      composerPlaceholder: 'Schreib an die ganze Kabine…',
      emptyTitle: 'Noch hat niemand etwas gesagt',
      emptySubtitle: 'Sobald Passagiere in der Nähe die App offen haben, tauchen sie hier auf.',
      locationTitle: 'Auf welchem Sitz sitzt du?',
      locationSubtitle: 'Daran erkennt man dich im Kabinen-Chat.',
      locationHelp:
        'Hier kennt niemand deinen Namen: dein Sitz steht neben jeder deiner Nachrichten und ist das, womit die anderen dich in der Kabine verorten.',
      locationFieldLabel: 'DEIN SITZ',
      identityNote: 'Im Kabinen-Chat sieht man dich als',
      enterCta: 'In die Kabine',
    },
    train: {
      name: 'Zug',
      shortName: 'Zug',
      tagline: 'Wagen und Platz',
      spaceTitle: 'Zug',
      peopleLabel: 'Reisende',
      peopleSearching: 'Suche nach Reisenden in der Nähe…',
      composerPlaceholder: 'Schreib an den ganzen Zug…',
      emptyTitle: 'Noch hat niemand etwas gesagt',
      emptySubtitle: 'Sobald Reisende in der Nähe die App offen haben, tauchen sie hier auf.',
      locationTitle: 'Wo sitzt du?',
      locationSubtitle: 'Wagen und Platz: damit finden sie dich.',
      locationHelp:
        'Ein Zug ist lang, und dieselben Platznummern kommen in jedem Wagen wieder. Zusammen stehen sie neben deinen Nachrichten und sind das, woran jemand erkennt, wo du bist.',
      locationFieldLabel: 'DEIN WAGEN UND PLATZ',
      identityNote: 'Im Zug-Chat sieht man dich als',
      enterCta: 'In den Zug',
    },
    gym: {
      name: 'Fitnessstudio',
      shortName: 'Studio',
      tagline: 'Nach dem, was du heute trainierst',
      spaceTitle: 'Trainingsfläche',
      peopleLabel: 'Leute',
      peopleSearching: 'Suche nach Trainierenden in der Nähe…',
      composerPlaceholder: 'Schreib an die ganze Fläche…',
      emptyTitle: 'Noch hat niemand etwas gesagt',
      emptySubtitle: 'Sobald jemand in der Nähe die App offen hat, taucht er hier auf.',
      locationTitle: 'Was trainierst du heute?',
      locationSubtitle: 'Das verortet dich auf der Fläche: wer dasselbe trainiert, findet dich.',
      locationHelp:
        'Auf einer Fläche ohne Sitze und ohne Nummern verortet dich die Zone, in der du bist — und die sagt deine Muskelgruppe. Sie steht neben deinen Nachrichten und bringt dich mit denen zusammen, die an denselben Geräten sind.',
      locationFieldLabel: 'WAS DU HEUTE TRAINIERST',
      identityNote: 'Im Studio-Chat sieht man dich als',
      enterCta: 'Auf die Fläche',
    },
    public: {
      name: 'Öffentlicher Raum',
      shortName: 'Draußen',
      tagline: 'Nach dem, was du anhast',
      spaceTitle: 'Hier in der Nähe',
      peopleLabel: 'Leute',
      peopleSearching: 'Suche nach Leuten in der Nähe…',
      composerPlaceholder: 'Schreib an die Leute hier…',
      emptyTitle: 'Noch hat niemand etwas gesagt',
      emptySubtitle: 'Sobald jemand in der Nähe die App offen hat, taucht er hier auf.',
      locationTitle: 'Welche Farbe hast du an?',
      locationSubtitle: 'Die Farbe der Kleidung, die du gerade trägst.',
      locationHelp:
        'Hier gibt es keine Sitze und keine Nummern, also zeigt man auf jemanden so, wie man es immer tut: über die Kleidung, "der mit dem roten T-Shirt". Die Farbe, die du wählst, steht neben deinen Nachrichten und sorgt dafür, dass man dich zwischen den Leuten erkennt. Wenn du dich umziehst oder weitergehst, ändere sie in Mein Profil.',
      locationFieldLabel: 'DIE FARBE DEINER KLEIDUNG',
      identityNote: 'Hier sieht man dich als',
      enterCta: 'Rein',
    },
  },
};
