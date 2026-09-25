import type { Strings } from './es';

/**
 * Português. Escrito na variante europeia, que é a que apanha quem viaja
 * por aqui; `languageFor` ignora a região, por isso pt-BR cai também neste.
 */
export const pt: Strings = {
  common: {
    back: 'Voltar',
    close: 'Fechar',
    send: 'Enviar',
    continue: 'Continuar',
    next: 'Seguinte',
    photo: 'Foto',
    private: 'Privado',
    you: 'Tu',
    remove: 'Remover',
    see: 'Ver',
    cancel: 'Cancelar',
  },

  welcome: {
    badge: 'SEM WIFI NEM DADOS',
    title: 'O chat de quem está mesmo ao teu lado',
    body:
      'Um avião, um comboio, o ginásio ou um bar: um chat comum com quem está perto de ti, ' +
      'identificado por onde está ou pelo que traz vestido, usando o Bluetooth do teu próprio telemóvel ' +
      'para ligar diretamente aos outros.',
    cta: 'Começar',
    disclaimer: 'Nada sai da sala: tudo viaja de telemóvel para telemóvel por Bluetooth.',
  },

  tutorial: {
    diagramYou: 'TU',
    page1Label: 'COMO FUNCIONA · 1 DE 3',
    page1Title: 'As mensagens saltam de dispositivo em dispositivo',
    page1Body:
      'O SkyMatch não usa internet nem wi-fi. O teu dispositivo fala por Bluetooth com os que estão perto, e cada um passa as mensagens ao seguinte.',
    page1Caption: 'O dispositivo da direita está longe demais para te ouvir, mas o do meio passa-lhe a tua mensagem.',
    page1Body2:
      'O Bluetooth chega a vários metros, e cada salto soma: uma mensagem pode atravessar muitos dispositivos até chegar ao destino. Quanto mais gente tiver o SkyMatch, mais longe chega.',
    page1CalloutTitle: 'Funciona em modo de voo',
    page1CalloutBody:
      'Não precisas de wi-fi, dados nem rede. No avião podes deixar o modo de voo ligado e voltar a ligar só o Bluetooth.',
    page2Label: 'COMO FUNCIONA · 2 DE 3',
    /** Page 2 on iOS: the links an iPhone already has keep working locked; finding new people is what iOS limits. */
    page2Title: 'Abre a app para descobrir quem está à tua volta',
    page2Body:
      'Abre-a uns segundos ao chegar para te ligares a quem está por perto. Depois podes bloquear o iPhone: as conversas já começadas continuam a chegar-te.',
    page2Caption: 'O dispositivo do meio está bloqueado e, mesmo assim, passa a tua mensagem.',
    page2CalloutTitle: 'Com o iPhone bloqueado',
    page2CalloutBody:
      'Demora mais a encontrar gente nova, e dois iPhone bloqueados que nunca se viram não se encontram. Se fechares o SkyMatch no seletor de apps, deixas de receber.',
    /** Page 2 on Android, where the app stays on the mesh in the background (SkyMatchBackgroundService). */
    page2TitleAndroid: 'Abre a app para descobrir quem está à tua volta',
    page2BodyAndroid:
      'O SkyMatch continua ligado em segundo plano, como vais ver numa notificação: podes bloquear o dispositivo e continuar a receber mensagens.',
    page2CalloutTitleAndroid: 'Quando deixa de funcionar',
    page2CalloutBodyAndroid:
      'Se tocares em «Desligar» na notificação ou fechares o SkyMatch nas apps recentes, deixas de receber mensagens e de servir de ponte.',
    page3Label: 'COMO FUNCIONA · 3 DE 3',
    page3Title: 'As vossas conversas privadas só vocês os dois as leem',
    page3Body:
      'As conversas privadas são encriptadas ponto a ponto e assinadas: ninguém as pode ler nem fazer-se passar por ti.',
    page3Caption: 'O dispositivo do meio só tem a mensagem encriptada; o da direita, a quem se destina, desencripta-a.',
    securityCalloutTitle: 'As tuas conversas ficam contigo',
    securityCalloutBody:
      'Se alguém se afastar, a vossa conversa fica guardada e marcada «Sem ligação». Quando voltarem a estar perto ligam-se sozinhos, e o que não chegou é reenviado.',
    permissionTitle: 'Toca em «Permitir»',
    permissionBody:
      'Ao entrar, o teu iPhone vai pedir para usar o Bluetooth. Aceita: sem ele, o SkyMatch não consegue encontrar ninguém.',
    permissionBodyAndroid:
      'Ao entrar, o teu dispositivo vai pedir para encontrar dispositivos próximos. Aceita: sem essa permissão, o SkyMatch não consegue encontrar ninguém.',
    understood: 'Percebido',
  },

  venuePicker: {
    step: 'PASSO 1 DE 3',
    title: 'Onde estás?',
    subtitle:
      'Muda só uma coisa: como os outros te encontram sem saber o teu nome. O resto da app é igual nos quatro.',
  },

  locationStep: {
    step: 'PASSO 2 DE 3',
  },

  profileSetup: {
    step: 'PASSO 3 DE 3',
    title: 'Cria o teu perfil',
    photoHint: 'Opcional: as pessoas perto de ti vão vê-la.',
    identitySuffix: '— o nome só serve para acompanhar.',
    namePlaceholder: 'O teu nome ou alcunha',
    contactLabel: 'Instagram / WhatsApp (opcional)',
    contactPlaceholder: '@oteuutilizador ou o teu número',
    contactHint: 'Só vê quem tocar no teu nome no chat para abrir a tua ficha. Deixa em branco se preferires não partilhar.',
  },

  sessionStart: {
    greeting: (nickname: string) => `OLÁ, ${nickname.toUpperCase()}`,
    title: 'Onde estás agora?',
    subtitle: 'É a única coisa que muda de um dia para o outro. O teu nome, o teu contacto e a tua foto continuam guardados.',
  },

  cabin: {
    myProfile: 'O meu perfil',
  },

  chat: {
    title: 'Privado',
    noContact: 'Não partilhou contacto',
    placeholder: 'Escreve uma mensagem…',
    seen: 'Visto',
    /** The ··· button in the chat's top bar, and what it offers. */
    options: 'Opções',
    viewProfile: 'Ver perfil',
    /** Under the chat header while this person is muted; tapping it undoes it. */
    mutedNotice: (nickname: string) => `Silenciaste ${nickname}: não vês as mensagens novas.`,
    /** Under a private message of ours that never reached them; tapping it tries again. */
    undelivered: 'Não entregue · Toca para reenviar',
    replyingTo: (nickname: string) => `A responder a ${nickname}`,
    encrypted: 'Encriptação ponta a ponta',
    notEncrypted: 'Sem encriptação: esta pessoa usa uma versão antiga do SkyMatch',
    away: (minutes: number) =>
      minutes < 1
        ? 'Sem ligação: por agora as tuas mensagens não lhe chegam'
        : `Sem ligação há ${minutes} min: por agora as tuas mensagens não lhe chegam`,
    offline:
      'Sem ligação: já não está por perto e as tuas mensagens não lhe vão chegar',
  },

  passengers: {
    ownPreview: (body: string) => `Tu: ${body}`,
    noMessagesYet: 'Ainda sem mensagens',
    away: (minutes: number) =>
      minutes < 1 ? 'Sem ligação · agora mesmo' : `Sem ligação · há ${minutes} min`,
    offline: 'Sem ligação',
    delete: 'Apagar',
    deleteTitle: (nickname: string) => `Apagar a conversa com ${nickname}?`,
    deleteBody: (nickname: string) =>
      `As mensagens e as fotos são apagadas deste telemóvel. ${nickname} mantém a sua cópia.`,
  },

  profile: {
    notArrivedYet: 'O perfil ainda não chegou.',
    contactLabel: 'CONTACTO',
    noContactShared: 'Não partilhou nenhum contacto.',
    openConversation: 'Abrir conversa',
    sendPrivateMessage: 'Enviar mensagem privada',
    mute: 'Silenciar esta pessoa',
    unmute: 'Deixar de silenciar',
  },

  settings: {
    title: 'Definições',
    /** Accessibility label of the gear on your profile. */
    open: 'Definições',
    appearance: 'ASPETO',
    appearanceSystem: 'Dispositivo',
    appearanceLight: 'Claro',
    appearanceDark: 'Escuro',
    appearanceHint: '«Dispositivo» segue o modo claro ou escuro do teu telemóvel.',
    accent: 'COR DE DESTAQUE',
    accentHint: 'A cor dos botões enviar, passageiros e principais, e da linha ao escrever.',
    /** Read out for each colour swatch. */
    accentNames: { blue: 'Azul', violet: 'Violeta', pink: 'Rosa', red: 'Vermelho', orange: 'Laranja', green: 'Verde', teal: 'Turquesa', graphite: 'Grafite' },
    contact: 'CONTACTO',
    contactDeveloper: 'Escrever ao programador',
    contactSoon: 'Disponível muito em breve',
    contactHint: 'Conta-nos o que gostas, o que falha ou o que te falta.',
    notifications: 'NOTIFICAÇÕES',
    notifyPrivate: 'Chats privados',
    notifyCabin: 'Chat da cabine',
    notifyReactions: 'Reações',
    notifyReactionsHint: 'Quando alguém reage ao teu «Estou de pé» ou «Deixo a máquina».',
    notifyHint: 'Só avisam com a app em segundo plano. No chat da cabine, no máximo uma a cada 30 segundos.',
  },

  myProfile: {
    title: 'O meu perfil',
    changePhoto: 'Mudar foto',
    addPhoto: 'Adicionar foto',
    photoTooBigTitle: 'Foto demasiado grande',
    photoTooBigBody: 'Experimenta outra imagem: por Bluetooth só cabem fotos muito pequenas.',
    nameLabel: 'NOME',
    contactLabel: 'INSTAGRAM / WHATSAPP (OPCIONAL)',
    contactHint: 'Só vê quem abrir a tua ficha ou um chat privado contigo. Deixa em branco para não partilhar.',
    mutedTitle: 'Silenciados',
    mutedBody:
      'Não vês as mensagens deles. O teu telemóvel continua a passar as deles aos outros, porque é parte de como chegam as mensagens de todos.',
    mutedUnknown: 'Alguém que já não está perto',
    alertsTitle: 'Avisos',
    alertsOn:
      'Avisamos-te do que chegar com a app em segundo plano; escolhes o quê nas Definições. Se fechares a app de vez, o Bluetooth para e não chega nada.',
    alertsOff: 'Ativa os avisos para saberes de mensagens e reações mesmo sem a app no ecrã.',
    openSettings: 'Abrir Definições',
    enableAlerts: 'Ativar avisos',
    save: 'Guardar alterações',
    howItWorks: 'Como funciona o SkyMatch',
  },

  reactions: {
    count: (total: number) => (total === 1 ? '1 reação' : `${total} reações`),
    empty: 'Ainda ninguém reagiu.',
    tapToWrite: 'Toca para lhe escrever',
  },

  radio: {
    panelLabel: 'ESTADO DA RÁDIO',
    advertising: 'Veem-te (a emitir)',
    scanning: 'Tu procuras (leitura)',
    devices: 'Telemóveis detetados',
    connected: 'Ligados',
    listeners: 'Ouvem-te',
    moduleMissing: 'módulo não carregado',
    on: 'ligado',
    off: 'desligado',
    noPermission: 'sem permissão',
    unavailable: 'indisponível',
    starting: 'a iniciar…',
    noAnswer: 'sem resposta',
    deniedTitle: 'O SkyMatch não tem permissão de Bluetooth',
    deniedAction: 'Dá-lha nas Definições',
    poweredOffTitle: 'O Bluetooth está desligado',
    poweredOffAction: 'Liga-o para veres quem tens perto',
    unsupportedTitle: 'Este telemóvel não consegue usar Bluetooth de baixo consumo',
    invisibleTitle: 'Consegues ver os outros, mas eles não te veem',
  },

  background: {
    title: 'O SkyMatch continua ligado',
    body:
      'Continuas a receber mensagens e a servir de ponte para os outros mesmo fora da app.',
    stop: 'Desligar',
    channelName: 'Ligação em segundo plano',
  },

  notifications: {
    sentPhoto: 'Enviou-te uma foto',
    channelName: 'Mensagens e avisos',
    cabinTitle: 'Chat da cabine',
    reactedTo: { standing: 'Reagiu a estares de pé', leavingMachine: 'Reagiu a deixares a máquina' },
  },

  presence: {
    countdown: (minutes: number) => ` daqui a ${minutes} min`,
    byStatus: {
      standing: { self: 'Estás de pé', other: 'está de pé' },
      leavingMachine: { self: 'Deixas a máquina', other: 'deixa a máquina' },
    },
  },

  muscles: {
    chest: 'Peito',
    back: 'Costas',
    legs: 'Pernas',
    shoulders: 'Ombros',
    arms: 'Braços',
    core: 'Core',
    cardio: 'Cardio',
    fullbody: 'Full body',
  },

  colors: {
    black: 'Preto',
    white: 'Branco',
    grey: 'Cinzento',
    red: 'Vermelho',
    blue: 'Azul',
    green: 'Verde',
    yellow: 'Amarelo',
    pink: 'Rosa',
  },

  location: {
    coachShort: 'C',
    describeSeat: (seat: string) => `Lugar ${seat}`,
    describeCoachSeat: (coach: number, seat: string) => `Carruagem ${coach}, lugar ${seat}`,
    describeMuscle: (muscle: string) => `Hoje treina ${muscle.toLowerCase()}`,
    describeOutfit: (color: string) => `Anda de ${color.toLowerCase()}`,
    /** Prefix of the row number on a classroom badge: one letter, like the coach's. */
    rowShort: 'F',
    sideShort: { left: 'Esq.', center: 'Centro', right: 'Dir.' },
    sideLong: { left: 'à esquerda', center: 'ao centro', right: 'à direita' },
    describeClass: (row: number, side: string) => `Fila ${row}, ${side}`,
  },

  picker: {
    /** The two cabin layouts a plane seat can be picked from; long-haul planes run to K. */
    cabinNarrow: 'Um corredor · 3-3',
    cabinWide: 'Dois corredores · 3-4-3',
    coachLabel: 'CARRUAGEM',
    seatLetterHint: 'Toca na letra do teu lugar',
    rowLabel: 'FILA',
    outfitHint: 'A da peça que mais se vê: a t-shirt, a camisola ou o casaco que trazes vestido.',
    spotLabel: 'ONDE ESTÁS? (OPCIONAL)',
    spotPlaceholder: 'No balcão, na esplanada, perto da entrada…',
    spotHint: 'Um sítio concreto poupa metade dos olhares. Podes mudá-lo quando te mexeres.',
    classRowHint: 'A contar do quadro: a primeira fila é a 1.',
    classSideLabel: 'LADO DA SALA',
    classSideHint: 'Virado para o quadro.',
    classSides: { left: 'Esquerda', center: 'Centro', right: 'Direita' },
  },

  venues: {
    plane: {
      name: 'Avião',
      shortName: 'Avião',
      tagline: 'O teu lugar é a tua identidade',
      spaceTitle: 'Cabine',
      peopleLabel: 'Passageiros',
      peopleSearching: 'À procura de passageiros aqui perto…',
      composerPlaceholder: 'Escreve a toda a cabine…',
      emptyTitle: 'Ainda ninguém falou',
      emptySubtitle: 'Assim que houver passageiros perto com o SkyMatch, aparecem aqui.',
      locationTitle: 'Em que lugar vais?',
      locationSubtitle: 'É assim que te vão identificar no chat da cabine.',
      locationHelp:
        'Aqui ninguém sabe o teu nome: o teu lugar é o que aparece ao lado de cada mensagem tua e é o que os outros usam para te situar na cabine.',
      locationFieldLabel: 'O TEU LUGAR',
      identityNote: 'No chat da cabine vão ver-te como',
      enterCta: 'Entrar na cabine',
    },
    train: {
      name: 'Comboio',
      shortName: 'Comboio',
      tagline: 'Carruagem e lugar',
      spaceTitle: 'Comboio',
      peopleLabel: 'Viajantes',
      peopleSearching: 'À procura de viajantes aqui perto…',
      composerPlaceholder: 'Escreve a todo o comboio…',
      emptyTitle: 'Ainda ninguém falou',
      emptySubtitle: 'Assim que houver viajantes perto com o SkyMatch, aparecem aqui.',
      locationTitle: 'Onde vais sentado?',
      locationSubtitle: 'Carruagem e lugar: com isso encontram-te.',
      locationHelp:
        'Um comboio é comprido e os mesmos números de lugar repetem-se em cada carruagem. Os dois juntos aparecem ao lado das tuas mensagens e são o que permite a alguém saber onde estás.',
      locationFieldLabel: 'A TUA CARRUAGEM E O TEU LUGAR',
      identityNote: 'No chat do comboio vão ver-te como',
      enterCta: 'Entrar no comboio',
    },
    gym: {
      name: 'Ginásio',
      shortName: 'Ginásio',
      tagline: 'Pelo que treinas hoje',
      spaceTitle: 'Sala',
      peopleLabel: 'Gente',
      peopleSearching: 'À procura de gente a treinar aqui perto…',
      composerPlaceholder: 'Escreve a toda a sala…',
      emptyTitle: 'Ainda ninguém falou',
      emptySubtitle: 'Assim que houver alguém perto com o SkyMatch, aparece aqui.',
      locationTitle: 'O que treinas hoje?',
      locationSubtitle: 'É o que te situa na sala: quem treinar o mesmo encontra-te.',
      locationHelp:
        'Numa sala sem lugares nem números, o que te situa é a zona onde estás, e isso di-lo aquilo que treinas. Aparece ao lado das tuas mensagens e é o que te junta a quem está nas mesmas máquinas.',
      locationFieldLabel: 'O QUE TREINAS HOJE',
      identityNote: 'No chat da sala vão ver-te como',
      enterCta: 'Entrar na sala',
    },
    public: {
      name: 'Espaço público',
      shortName: 'Público',
      tagline: 'Pelo que trazes vestido',
      spaceTitle: 'Aqui perto',
      peopleLabel: 'Gente',
      peopleSearching: 'À procura de gente aqui perto…',
      composerPlaceholder: 'Escreve à gente daqui…',
      emptyTitle: 'Ainda ninguém falou',
      emptySubtitle: 'Assim que houver alguém perto com o SkyMatch, aparece aqui.',
      locationTitle: 'De que cor vais vestido?',
      locationSubtitle: 'A cor da roupa que trazes vestida agora mesmo.',
      locationHelp:
        'Aqui não há lugares nem números, por isso aponta-se para alguém como se faz sempre: pela roupa, "o da t-shirt vermelha". A cor que escolheres aparece ao lado das tuas mensagens e é o que permite que te reconheçam no meio da gente. Se mudares de roupa ou de sítio, muda-a em O meu perfil.',
      locationFieldLabel: 'A COR DA TUA ROUPA',
      identityNote: 'Aqui vão ver-te como',
      enterCta: 'Entrar',
    },
    class: {
      name: 'Aula',
      shortName: 'Aula',
      tagline: 'A tua fila e o teu lado da sala',
      spaceTitle: 'Aula',
      peopleLabel: 'Colegas',
      peopleSearching: 'À procura de colegas por perto…',
      composerPlaceholder: 'Escreve para a turma toda…',
      emptyTitle: 'Ainda ninguém falou',
      emptySubtitle: 'Assim que houver colegas por perto com SkyMatch, aparecem aqui.',
      locationTitle: 'Onde estás sentado?',
      locationSubtitle: 'Fila e lado da sala: é assim que te encontram.',
      locationHelp: 'Numa sala de aula as mesas não têm letra, por isso aponta-se para alguém como sempre: «o da terceira fila, à esquerda». Aparece junto às tuas mensagens. Se mudares de lugar, muda-o em O meu perfil.',
      locationFieldLabel: 'O TEU LUGAR NA AULA',
      identityNote: 'No chat da aula vão ver-te como',
      enterCta: 'Entrar na aula',
    },
  },
};
