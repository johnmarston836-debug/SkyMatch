import type { Strings } from './es';

/** English, and the fallback for every language the app doesn't carry. */
export const en: Strings = {
  common: {
    back: 'Back',
    close: 'Close',
    send: 'Send',
    continue: 'Continue',
    next: 'Next',
    photo: 'Photo',
    private: 'Private',
    you: 'You',
    remove: 'Remove',
    see: 'See',
    cancel: 'Cancel',
  },

  welcome: {
    badge: 'NO WI-FI, NO DATA',
    title: 'The chat for the people right next to you',
    body:
      'A plane, a train, the gym or a bar: one shared chat with whoever is near you, ' +
      'identified by where they are or what they are wearing, using your own phone’s Bluetooth ' +
      'to connect straight to everyone else.',
    cta: 'Get started',
    disclaimer: 'Nothing leaves the room: everything travels phone to phone over Bluetooth.',
  },

  tutorial: {
    diagramYou: 'YOU',
    page1Label: 'HOW IT WORKS · 1 OF 3',
    page1Title: 'Messages hop from phone to phone',
    page1Body:
      'SkyMatch uses no internet and no Wi-Fi. Your phone talks over Bluetooth to the phones around it, and each one hands messages on to the next.',
    page1Caption:
      'The phone on the right is too far away to hear you, but the one in the middle passes your message on.',
    page1Body2:
      'Bluetooth only reaches a few metres, but every hop adds up: a message can cross several phones on its way. The more people carry SkyMatch, the further it goes.',
    page1CalloutTitle: 'It works in flight mode',
    page1CalloutBody:
      'No Wi-Fi, data or signal needed. On a plane you can leave flight mode on and switch just Bluetooth back on.',
    page2Label: 'HOW IT WORKS · 2 OF 3',
    /** Page 2 on iOS: the links an iPhone already has keep working locked; finding new people is what iOS limits. */
    page2Title: 'Open it when you arrive, then pocket your phone',
    page2Body:
      'Open SkyMatch when you arrive and keep it on screen for a few seconds: that is how your iPhone connects with the people around you. After that you can lock it or use other apps, and you keep getting messages and relaying them for others.',
    page2Caption: 'The phone in the middle is locked, and still passes your message on.',
    page2Body2:
      'There is no server: messages only exist on the phones around you, so whatever is said while you are disconnected cannot be recovered. Your private chats do stay saved on your phone.',
    page2CalloutTitle: 'What a locked iPhone can’t do',
    page2CalloutBody:
      'With the screen locked it takes longer to find new people, and two locked iPhones that have never met won’t find each other. If you close SkyMatch completely from the app switcher, you stop getting messages and stop relaying them.',
    /** Page 2 on Android, where the app stays on the mesh in the background (SkyMatchBackgroundService). */
    page2TitleAndroid: 'It stays connected when you leave',
    page2BodyAndroid:
      'On Android, SkyMatch stays connected in the background - you’ll see it in a notification. You can lock your phone or use other apps, and you keep getting messages and relaying them for others.',
    page2CalloutTitleAndroid: 'When it stops working',
    page2CalloutBodyAndroid:
      'If you tap “Disconnect” in the notification or close SkyMatch from the recent apps, you stop getting messages and stop relaying them.',
    page3Label: 'HOW IT WORKS · 3 OF 3',
    page3Title: 'Only the two of you can read your private chats',
    page3Body:
      'Private messages are end-to-end encrypted. The phones that relay them pass them on without being able to open them: neither the text nor the photos.',
    page3Caption:
      'The phone in the middle only ever holds the message encrypted; the one on the right, who it is for, decrypts it.',
    page3Body2: 'And everything you send is signed by your phone, so nobody can write pretending to be you.',
    securityCalloutTitle: 'Check the top of the chat',
    securityCalloutBody:
      'If the other person is on an older version of SkyMatch, your private chat is not encrypted, and we warn you in red. What nobody can check is location: each person says their own seat, coach or machine.',
    understood: 'Got it',
  },

  venuePicker: {
    step: 'STEP 1 OF 3',
    title: 'Where are you?',
    subtitle:
      'Only one thing changes: how people find you without knowing your name. The rest of the app is the same in all four.',
  },

  locationStep: {
    step: 'STEP 2 OF 3',
  },

  profileSetup: {
    step: 'STEP 3 OF 3',
    title: 'What should we call you?',
    identitySuffix: '— the name is just there to go with it.',
    namePlaceholder: 'Your name or a nickname',
    contactLabel: 'Instagram / WhatsApp (optional)',
    contactPlaceholder: '@yourhandle or your number',
    contactHint: 'Only someone who taps your name in the chat to open your card will see it. Leave it blank if you’d rather not share it.',
  },

  sessionStart: {
    greeting: (nickname: string) => `HI, ${nickname.toUpperCase()}`,
    title: 'Where are you right now?',
    subtitle: 'It is the only thing that changes from one day to the next. Your name, your contact and your photo stay saved.',
  },

  cabin: {
    myProfile: 'My profile',
  },

  chat: {
    title: 'Private',
    noContact: 'No contact shared',
    placeholder: 'Write a message…',
    seen: 'Seen',
    /** The ··· button in the chat's top bar, and what it offers. */
    options: 'Options',
    viewProfile: 'View profile',
    /** Under the chat header while this person is muted; tapping it undoes it. */
    mutedNotice: (nickname: string) => `You muted ${nickname}: you don’t see their new messages.`,
    /** Under a private message of ours that never reached them; tapping it tries again. */
    undelivered: 'Not delivered · Tap to resend',
    replyingTo: (nickname: string) => `Replying to ${nickname}`,
    encrypted: 'End-to-end encrypted',
    notEncrypted: 'Not encrypted: this person is on an older version of SkyMatch',
    away: (minutes: number) =>
      minutes < 1
        ? 'No connection: your messages won’t reach them for now'
        : `No connection for ${minutes} min: your messages won’t reach them for now`,
    offline:
      'No connection: they are no longer nearby, and your messages won’t reach them',
  },

  passengers: {
    ownPreview: (body: string) => `You: ${body}`,
    noMessagesYet: 'No messages yet',
    away: (minutes: number) =>
      minutes < 1 ? 'No connection · just now' : `No connection · ${minutes} min ago`,
    offline: 'No connection',
    delete: 'Delete',
    deleteTitle: (nickname: string) => `Delete your chat with ${nickname}?`,
    deleteBody: (nickname: string) =>
      `The messages and photos are deleted from this phone. ${nickname} keeps their copy.`,
  },

  profile: {
    notArrivedYet: 'Their profile hasn’t arrived yet.',
    contactLabel: 'CONTACT',
    noContactShared: 'They haven’t shared any contact.',
    openConversation: 'Open conversation',
    sendPrivateMessage: 'Send a private message',
    mute: 'Mute this person',
    unmute: 'Unmute',
  },

  myProfile: {
    title: 'My profile',
    changePhoto: 'Change photo',
    addPhoto: 'Add photo',
    photoTooBigTitle: 'Photo too large',
    photoTooBigBody: 'Try another image: only very small photos fit over Bluetooth.',
    nameLabel: 'NAME',
    contactLabel: 'INSTAGRAM / WHATSAPP (OPTIONAL)',
    contactHint: 'Only someone who opens your card or a private chat with you will see it. Leave it blank to keep it to yourself.',
    mutedTitle: 'Muted',
    mutedBody:
      'You don’t see their messages. Your phone still passes theirs along to everyone else, because that is part of how everybody’s messages get through.',
    mutedUnknown: 'Someone who is no longer nearby',
    alertsTitle: 'Alerts',
    alertsOn:
      'We’ll tell you about private messages that arrive while the app is in the background. Close the app completely and Bluetooth goes off, so nothing arrives at all.',
    alertsOff: 'Turn alerts on to hear about private messages even when the app isn’t on screen.',
    openSettings: 'Open Settings',
    enableAlerts: 'Turn alerts on',
    save: 'Save changes',
    howItWorks: 'How SkyMatch works',
  },

  reactions: {
    count: (total: number) => (total === 1 ? '1 reaction' : `${total} reactions`),
    empty: 'Nobody has reacted yet.',
    tapToWrite: 'Tap to write to them',
  },

  radio: {
    panelLabel: 'RADIO STATUS',
    advertising: 'They see you (transmitting)',
    scanning: 'You’re looking (scanning)',
    devices: 'Phones detected',
    connected: 'Connected',
    listeners: 'Listening to you',
    moduleMissing: 'module not loaded',
    on: 'on',
    off: 'off',
    noPermission: 'no permission',
    unavailable: 'unavailable',
    starting: 'starting…',
    noAnswer: 'no answer',
    deniedTitle: 'SkyMatch has no Bluetooth permission',
    deniedAction: 'Grant it in Settings',
    poweredOffTitle: 'Bluetooth is off',
    poweredOffAction: 'Turn it on to see who is nearby',
    unsupportedTitle: 'This phone can’t use Bluetooth Low Energy',
    invisibleTitle: 'You can see everyone else, but they can’t see you',
  },

  background: {
    title: 'SkyMatch is still connected',
    body:
      'You keep getting messages and relaying them for others while you are out of the app.',
    stop: 'Disconnect',
    channelName: 'Background connection',
  },

  notifications: {
    sentPhoto: 'Sent you a photo',
    channelName: 'Private messages',
  },

  presence: {
    countdown: (minutes: number) => ` in ${minutes} min`,
    byStatus: {
      standing: { self: 'You’re standing up', other: 'is standing up' },
      leavingMachine: { self: 'You’re leaving the machine', other: 'is leaving the machine' },
    },
  },

  muscles: {
    chest: 'Chest',
    back: 'Back',
    legs: 'Legs',
    shoulders: 'Shoulders',
    arms: 'Arms',
    core: 'Core',
    cardio: 'Cardio',
    fullbody: 'Full body',
  },

  colors: {
    black: 'Black',
    white: 'White',
    grey: 'Grey',
    red: 'Red',
    blue: 'Blue',
    green: 'Green',
    yellow: 'Yellow',
    pink: 'Pink',
  },

  location: {
    coachShort: 'C',
    describeSeat: (seat: string) => `Seat ${seat}`,
    describeCoachSeat: (coach: number, seat: string) => `Coach ${coach}, seat ${seat}`,
    describeMuscle: (muscle: string) => `Training ${muscle.toLowerCase()} today`,
    describeOutfit: (color: string) => `Wearing ${color.toLowerCase()}`,
  },

  picker: {
    coachLabel: 'COACH',
    seatLetterHint: 'Tap your seat letter',
    rowLabel: 'ROW',
    outfitHint: 'Whichever layer shows most: the T-shirt, the hoodie or the jacket you have on.',
    spotLabel: 'WHEREABOUTS? (OPTIONAL)',
    spotPlaceholder: 'At the bar, on the terrace, near the door…',
    spotHint: 'A specific spot saves half the looking around. You can change it when you move.',
  },

  venues: {
    plane: {
      name: 'Plane',
      shortName: 'Plane',
      tagline: 'Your seat is your identity',
      spaceTitle: 'Cabin',
      peopleLabel: 'Passengers',
      peopleSearching: 'Looking for passengers nearby…',
      composerPlaceholder: 'Write to the whole cabin…',
      emptyTitle: 'Nobody has spoken yet',
      emptySubtitle: 'As soon as there are passengers nearby with SkyMatch, they’ll show up here.',
      locationTitle: 'Which seat are you in?',
      locationSubtitle: 'That is how people will know you in the cabin chat.',
      locationHelp:
        'Nobody here knows your name: your seat is what appears next to every message of yours, and what everyone else uses to place you in the cabin.',
      locationFieldLabel: 'YOUR SEAT',
      identityNote: 'In the cabin chat you’ll show up as',
      enterCta: 'Enter the cabin',
    },
    train: {
      name: 'Train',
      shortName: 'Train',
      tagline: 'Coach and seat',
      spaceTitle: 'Train',
      peopleLabel: 'Travellers',
      peopleSearching: 'Looking for travellers nearby…',
      composerPlaceholder: 'Write to the whole train…',
      emptyTitle: 'Nobody has spoken yet',
      emptySubtitle: 'As soon as there are travellers nearby with SkyMatch, they’ll show up here.',
      locationTitle: 'Where are you sitting?',
      locationSubtitle: 'Coach and seat: that’s all it takes to find you.',
      locationHelp:
        'A train is long and the same seat numbers come round again in every coach. Together they appear next to your messages, and they are what lets someone know where you are.',
      locationFieldLabel: 'YOUR COACH AND SEAT',
      identityNote: 'In the train chat you’ll show up as',
      enterCta: 'Enter the train',
    },
    gym: {
      name: 'Gym',
      shortName: 'Gym',
      tagline: 'By what you’re training today',
      spaceTitle: 'Gym floor',
      peopleLabel: 'People',
      peopleSearching: 'Looking for people training nearby…',
      composerPlaceholder: 'Write to the whole floor…',
      emptyTitle: 'Nobody has spoken yet',
      emptySubtitle: 'As soon as there is someone nearby with SkyMatch, they’ll show up here.',
      locationTitle: 'What are you training today?',
      locationSubtitle: 'It is what places you on the floor: whoever trains the same finds you.',
      locationHelp:
        'On a floor with no seats and no numbers, what places you is the area you are in, and that is what your muscle group says. It appears next to your messages and is what matches you with whoever is on the same machines.',
      locationFieldLabel: 'WHAT YOU’RE TRAINING TODAY',
      identityNote: 'In the gym chat you’ll show up as',
      enterCta: 'Enter the gym',
    },
    public: {
      name: 'Public space',
      shortName: 'Public',
      tagline: 'By what you’re wearing',
      spaceTitle: 'Around here',
      peopleLabel: 'People',
      peopleSearching: 'Looking for people nearby…',
      composerPlaceholder: 'Write to the people here…',
      emptyTitle: 'Nobody has spoken yet',
      emptySubtitle: 'As soon as there is someone nearby with SkyMatch, they’ll show up here.',
      locationTitle: 'What colour are you wearing?',
      locationSubtitle: 'The colour of the clothes you have on right now.',
      locationHelp:
        'There are no seats and no numbers here, so people are pointed out the way they always are: by their clothes, "the one in the red T-shirt". The colour you pick appears next to your messages and is what lets people recognise you in a crowd. If you change clothes or move, change it in My profile.',
      locationFieldLabel: 'YOUR CLOTHES’ COLOUR',
      identityNote: 'Here you’ll show up as',
      enterCta: 'Enter',
    },
  },
};
