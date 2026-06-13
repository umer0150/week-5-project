import { create } from "zustand";
import type { Conversation, Message, StreamingMessage } from "../types";

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  streamingMessage: StreamingMessage | null;
  isTyping: boolean;

  setConversations: (convs: Conversation[]) => void;
  addConversation: (conv: Conversation) => void;
  removeConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;

  setMessages: (conversationId: string, msgs: Message[]) => void;
  addMessage: (conversationId: string, msg: Message) => void;

  startStreaming: (conversationId: string) => void;
  appendChunk: (chunk: string) => void;
  finishStreaming: (messageId: string) => void;
  clearStreaming: () => void;

  setTyping: (typing: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  streamingMessage: null,
  isTyping: false,

  setConversations: (conversations) => set({ conversations }),
  addConversation: (conv) =>
    set((s) => ({ conversations: [conv, ...s.conversations] })),
  removeConversation: (id) =>
    set((s) => ({ conversations: s.conversations.filter((c) => c.id !== id) })),
  setActiveConversation: (id) => set({ activeConversationId: id }),

  setMessages: (conversationId, msgs) =>
    set((s) => ({ messages: { ...s.messages, [conversationId]: msgs } })),

  addMessage: (conversationId, msg) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: [...(s.messages[conversationId] ?? []), msg],
      },
    })),

  startStreaming: (conversationId) =>
    set({
      streamingMessage: {
        id: `streaming-${Date.now()}`,
        conversationId,
        role: "assistant",
        content: "",
        isStreaming: true,
      },
    }),

  appendChunk: (chunk) =>
    set((s) => {
      if (!s.streamingMessage) return s;
      return {
        streamingMessage: {
          ...s.streamingMessage,
          content: s.streamingMessage.content + chunk,
        },
      };
    }),

  finishStreaming: (messageId) => {
    const { streamingMessage, activeConversationId } = get();
    if (!streamingMessage || !activeConversationId) return;

    const finalMessage: Message = {
      id: messageId,
      conversationId: streamingMessage.conversationId,
      role: "assistant",
      content: streamingMessage.content,
      createdAt: new Date().toISOString(),
    };

    set((s) => ({
      streamingMessage: null,
      messages: {
        ...s.messages,
        [activeConversationId]: [
          ...(s.messages[activeConversationId] ?? []),
          finalMessage,
        ],
      },
    }));
  },

  clearStreaming: () => set({ streamingMessage: null }),
  setTyping: (isTyping) => set({ isTyping }),
}));
