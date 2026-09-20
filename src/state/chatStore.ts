import { create } from 'zustand';
import type { ChatMessage } from '../types';

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

  addGroupMessage: (message: ChatMessage) => void;
  addPrivateMessage: (peerId: string, message: ChatMessage, incoming?: boolean) => void;
  setActivePeer: (peerId: string | null) => void;
  markRead: (peerId: string) => void;
  dismissNotice: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  groupMessages: [],
  privateMessagesByPeer: {},
  unreadByPeer: {},
  activePeerId: null,
  notice: null,

  addGroupMessage: (message) => {
    if (get().groupMessages.some((m) => m.id === message.id)) return; // mesh relay can deliver duplicates
    set((state) => ({ groupMessages: [...state.groupMessages, message].sort((a, b) => a.sentAt - b.sentAt) }));
  },

  addPrivateMessage: (peerId, message, incoming = false) => {
    const existing = get().privateMessagesByPeer[peerId] ?? [];
    if (existing.some((m) => m.id === message.id)) return;

    // Only messages arriving while that conversation is off screen count as
    // unread - otherwise reading a chat live would leave a badge behind.
    const announce = incoming && get().activePeerId !== peerId;

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
            body: message.imageBase64 && !message.body ? 'Foto' : message.body,
          }
        : state.notice,
    }));
  },

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
}));
