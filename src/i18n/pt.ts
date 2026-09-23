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
    page1Title: 'As mensagens saltam de telemóvel em telemóvel',
    page1Body:
      'O SkyMatch não usa internet nem wi-fi. O teu telemóvel fala por Bluetooth com os que estão perto, e cada um passa as mensagens ao seguinte.',
    page1Caption: 'O telemóvel da direita está longe demais para te ouvir, mas o do meio passa-lhe a tua mensagem.',
    page1Body2:
      'O Bluetooth só chega a poucos metros, mas cada salto soma: uma mensagem pode atravessar vários telemóveis até chegar ao destino. Quanto mais gente tiver o SkyMatch, mais longe chega.',
    page1CalloutTitle: 'Funciona em modo de voo',
    page1CalloutBody:
      'Não precisas de wi-fi, dados nem rede. No avião podes deixar o modo de voo ligado e voltar a ligar só o Bluetooth.',
    page2Label: 'COMO FUNCIONA · 2 DE 3',
    /** Page 2 on iOS: the links an iPhone already has keep working locked; finding new people is what iOS limits. */
    page2Title: 'Abre-a ao chegar e guarda o telemóvel',
    page2Body:
      'Abre o SkyMatch ao chegar e deixa-o uns segundos no ecrã: é assim que o teu iPhone se liga a quem está por perto. Depois podes bloqueá-lo ou usar outras apps, e continuas a receber mensagens e a servir de ponte para os outros.',
    page2Caption: 'O telemóvel do meio está bloqueado e, mesmo assim, passa a tua mensagem.',
    page2Body2:
      'Não há servidor: as mensagens só existem nos telemóveis à tua volta, por isso o que se disser enquanto estiveres desligado não se pode recuperar. As tuas conversas privadas ficam guardadas no teu telemóvel.',
    page2CalloutTitle: 'O que um iPhone bloqueado não consegue fazer',
    page2CalloutBody:
      'Com o ecrã bloqueado demora mais a encontrar gente nova, e dois iPhone bloqueados que nunca se viram não se encontram. Se fechares o SkyMatch por completo no seletor de apps, deixas de receber mensagens e de servir de ponte.',
    /** Page 2 on Android, where the app stays on the mesh in the background (SkyMatchBackgroundService). */
    page2TitleAndroid: 'Continua ligada mesmo quando sais',
    page2BodyAndroid:
      'No Android, o SkyMatch continua ligado em segundo plano: vais vê-lo numa notificação. Podes bloquear o telemóvel ou usar outras apps, e continuas a receber mensagens e a servir de ponte para os outros.',
    page2CalloutTitleAndroid: 'Quando deixa de funcionar',
    page2CalloutBodyAndroid:
      'Se tocares em «Desligar» na notificação ou fechares o SkyMatch nas apps recentes, deixas de receber mensagens e de servir de ponte.',
    page3Label: 'COMO FUNCIONA · 3 DE 3',
    page3Title: 'As vossas conversas privadas só vocês os dois as leem',
    page3Body:
      'As mensagens privadas são encriptadas ponto a ponto. Os telemóveis que servem de ponte passam-nas sem as conseguir abrir: nem o texto nem as fotos.',
    page3Caption: 'O telemóvel do meio passa a mensagem fechada: só quem a recebe a pode abrir.',
    page3Body2:
      'Além disso, tudo o que envias vai assinado pelo teu telemóvel, por isso ninguém pode escrever a fazer-se passar por ti.',
    securityCalloutTitle: 'Repara no topo da conversa',
    securityCalloutBody:
      'Se a outra pessoa usar uma versão antiga do SkyMatch, a vossa conversa privada não vai encriptada e avisamos-te a vermelho. O que ninguém pode confirmar é a localização: o lugar, a carruagem ou a máquina indica-os cada um.',
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
    title: 'Como te chamamos?',
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
    /** Under a private message of ours that never reached them; tapping it tries again. */
    undelivered: 'Não entregue · Toque para reenviar',
    replyingTo: (nickname: string) => `A responder a ${nickname}`,
    encrypted: 'Encriptação ponta a ponta: só vocês os dois podem ler esta conversa',
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
      'Avisamos-te das mensagens privadas que chegarem com a app em segundo plano. Se fechares a app por completo, o Bluetooth desliga-se e não chega nada.',
    alertsOff: 'Ativa os avisos para saberes das mensagens privadas mesmo sem teres a app no ecrã.',
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
    channelName: 'Mensagens privadas',
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
  },

  picker: {
    coachLabel: 'CARRUAGEM',
    seatLetterHint: 'Toca na letra do teu lugar',
    rowLabel: 'FILA',
    outfitHint: 'A da peça que mais se vê: a t-shirt, a camisola ou o casaco que trazes vestido.',
    spotLabel: 'ONDE ESTÁS? (OPCIONAL)',
    spotPlaceholder: 'No balcão, na esplanada, perto da entrada…',
    spotHint: 'Um sítio concreto poupa metade dos olhares. Podes mudá-lo quando te mexeres.',
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
  },
};
