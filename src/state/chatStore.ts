import { create } from 'zustand';
import type { ChatMessage } from '../types';

interface ChatState {
  messagesByMatch: Record<string, ChatMessage[]>;
  addMessage: (message: ChatMessage) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messagesByMatch: {},

  addMessage: (message) => {
    const existing = get().messagesByMatch[message.matchId] ?? [];
    if (existing.some((m) => m.id === message.id)) return; // mesh relay can deliver duplicates
    set((state) => ({
      messagesByMatch: {
        ...state.messagesByMatch,
        [message.matchId]: [...existing, message].sort((a, b) => a.sentAt - b.sentAt),
      },
    }));
  },
}));
