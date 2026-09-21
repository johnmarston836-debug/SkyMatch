import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { t } from '../i18n';
import type { ChatMessage } from '../types';

const STORAGE_KEY = '@skymatch/chats';

/** Kept per conversation. Beyond this the oldest go; a phone is not an archive. */
const MAX_STORED_PER_PEER = 150;

/**
 * How many photos of a conversation are kept. A photo is tens of kilobytes
 * and a hundred of them would be most of the app's storage, so the older
 * ones keep their bubble and lose their image.
 */
const MAX_STORED_PHOTOS_PER_PEER = 6;

/** What a freshly arrived private message shows as a banner over the cabin chat. */
export interface PrivateNotice {
  peerId: string;
  messageId: string;
  nickname: string;
  body: string;
}

interface ChatState {
  groupMessages: ChatMessage[];
  /** Keyed by the *other* participant's peer id, regardless of message direction. */
  privateMessagesByPeer: Record<string, ChatMessage[]>;
  /** Unread incoming private messages per peer. Cleared when their chat is opened. */
  unreadByPeer: Record<string, number>;
  /**
   * Whose private chat is on screen right now, so a message from that person
   * is never counted as unread nor announced as a banner.
   */
  activePeerId: string | null;
  /** The last incoming private message worth interrupting for; null once dismissed. */
  notice: PrivateNotice | null;
  /** False while SkyMatch is in the background, where nothing on screen is being read. */
  appActive: boolean;
  /**
   * The newest moment each person has read up to, from their own receipt.
   * A message of ours is seen when it was sent no later than this.
   */
  readUpToByPeer: Record<string, number>;
  /** False until the saved conversations are off disk. */
  hydrated: boolean;

  addGroupMessage: (message: ChatMessage) => void;
  addPrivateMessage: (peerId: string, message: ChatMessage, incoming?: boolean) => void;
  setActivePeer: (peerId: string | null) => void;
  setAppActive: (active: boolean) => void;
  markRead: (peerId: string) => void;
  dismissNotice: () => void;
  hydrate: () => Promise<void>;
  /** Records that someone read our messages up to a moment. Only ever moves forward. */
  noteReadUpTo: (peerId: string, upTo: number) => void;
  /** The newest message they sent us, or 0 - what a receipt of ours would cover. */
  newestIncoming: (peerId: string, myId: string) => number;
}

/** Trims a conversation to what is worth keeping on disk. */
function forStorage(messages: ChatMessage[]): ChatMessage[] {
  const kept = messages.slice(-MAX_STORED_PER_PEER);
  let photosLeft = MAX_STORED_PHOTOS_PER_PEER;
  // Walked backwards so the photos that survive are the most recent ones.
  return kept
    .slice()
    .reverse()
    .map((message) => {
      if (message.imageBase64 === undefined) return message;
      if (photosLeft > 0) {
        photosLeft -= 1;
        return message;
      }
      // The bubble survives, its photo doesn't: a hundred of them would be
      // most of the app's storage.
      const withoutPhoto = { ...message };
      delete withoutPhoto.imageBase64;
      return { ...withoutPhoto, body: withoutPhoto.body || t.common.photo };
    })
    .reverse();
}

async function persist(privateMessagesByPeer: Record<string, ChatMessage[]>) {
  const trimmed: Record<string, ChatMessage[]> = {};
  for (const [peerId, messages] of Object.entries(privateMessagesByPeer)) {
    if (messages.length > 0) trimmed[peerId] = forStorage(messages);
  }
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // A full disk is no reason to lose the conversation on screen.
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  groupMessages: [],
  privateMessagesByPeer: {},
  unreadByPeer: {},
  activePeerId: null,
  notice: null,
  appActive: true,
  readUpToByPeer: {},
  hydrated: false,

  addGroupMessage: (message) => {
    if (get().groupMessages.some((m) => m.id === message.id)) return; // mesh relay can deliver duplicates
    set((state) => ({ groupMessages: [...state.groupMessages, message].sort((a, b) => a.sentAt - b.sentAt) }));
  },

  addPrivateMessage: (peerId, message, incoming = false) => {
    const existing = get().privateMessagesByPeer[peerId] ?? [];
    if (existing.some((m) => m.id === message.id)) return;

    // Only messages arriving while that conversation is off screen count as
    // unread - otherwise reading a chat live would leave a badge behind. A
    // chat left open when the phone was locked is off screen too.
    const state = get();
    const announce = incoming && !(state.appActive && state.activePeerId === peerId);

    set((state) => ({
      privateMessagesByPeer: {
        ...state.privateMessagesByPeer,
        [peerId]: [...existing, message].sort((a, b) => a.sentAt - b.sentAt),
      },
      unreadByPeer: announce
        ? { ...state.unreadByPeer, [peerId]: (state.unreadByPeer[peerId] ?? 0) + 1 }
        : state.unreadByPeer,
      notice: announce
        ? {
            peerId,
            messageId: message.id,
            nickname: message.fromNickname,
            body: message.imageBase64 && !message.body ? t.common.photo : message.body,
          }
        : state.notice,
    }));

    // Never before the disk has been read: a message arriving in that
    // moment would be written over a history nobody had loaded yet, and the
    // whole conversation would be gone.
    if (get().hydrated) void persist(get().privateMessagesByPeer);
  },

  setAppActive: (active) => set({ appActive: active }),

  setActivePeer: (peerId) =>
    set((state) => ({
      activePeerId: peerId,
      // Opening a chat also silences a banner that was pointing at it.
      notice: peerId !== null && state.notice?.peerId === peerId ? null : state.notice,
    })),

  markRead: (peerId) => {
    if (!get().unreadByPeer[peerId]) return;
    set((state) => {
      const next = { ...state.unreadByPeer };
      delete next[peerId];
      return { unreadByPeer: next };
    });
  },

  dismissNotice: () => set({ notice: null }),

  hydrate: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      set({ hydrated: true });
      return;
    }
    try {
      const stored = JSON.parse(raw) as Record<string, ChatMessage[]>;
      // Merged rather than replaced: the mesh may already have delivered
      // something in the moment it took to read the disk.
      set((state) => {
        const privateMessagesByPeer = { ...stored };
        for (const [peerId, live] of Object.entries(state.privateMessagesByPeer)) {
          const saved = privateMessagesByPeer[peerId] ?? [];
          const ids = new Set(saved.map((message) => message.id));
          privateMessagesByPeer[peerId] = [...saved, ...live.filter((message) => !ids.has(message.id))].sort(
            (a, b) => a.sentAt - b.sentAt,
          );
        }
        return { privateMessagesByPeer, hydrated: true };
      });
      // Anything that landed while the disk was being read is only in
      // memory until now.
      void persist(get().privateMessagesByPeer);
    } catch {
      set({ hydrated: true });
    }
  },

  noteReadUpTo: (peerId, upTo) => {
    // Only forward: receipts can arrive out of order on a mesh, and a stale
    // one must never un-see a message.
    if ((get().readUpToByPeer[peerId] ?? 0) >= upTo) return;
    set((state) => ({ readUpToByPeer: { ...state.readUpToByPeer, [peerId]: upTo } }));
  },

  newestIncoming: (peerId, myId) => {
    const thread = get().privateMessagesByPeer[peerId] ?? [];
    let newest = 0;
    for (const message of thread) {
      if (message.fromId !== myId && message.sentAt > newest) newest = message.sentAt;
    }
    return newest;
  },
}));
