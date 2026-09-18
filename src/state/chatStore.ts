import { create } from 'zustand';
import type { ChatMessage } from '../types';

interface ChatState {
  groupMessages: ChatMessage[];
  /** Keyed by the *other* participant's peer id, regardless of message direction. */
  privateMessagesByPeer: Record<string, ChatMessage[]>;

  addGroupMessage: (message: ChatMessage) => void;
  addPrivateMessage: (peerId: string, message: ChatMessage) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  groupMessages: [],
  privateMessagesByPeer: {},

  addGroupMessage: (message) => {
    if (get().groupMessages.some((m) => m.id === message.id)) return; // mesh relay can deliver duplicates
    set((state) => ({ groupMessages: [...state.groupMessages, message].sort((a, b) => a.sentAt - b.sentAt) }));
  },

  addPrivateMessage: (peerId, message) => {
    const existing = get().privateMessagesByPeer[peerId] ?? [];
    if (existing.some((m) => m.id === message.id)) return;
    set((state) => ({
      privateMessagesByPeer: {
        ...state.privateMessagesByPeer,
        [peerId]: [...existing, message].sort((a, b) => a.sentAt - b.sentAt),
      },
    }));
  },
}));
