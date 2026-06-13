import { useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../services/api";
import { getSocket } from "../services/socket";
import { useChatStore } from "../store/chatStore";
import type { Conversation, Message, Ticket } from "../types";

// ─── Conversations ────────────────────────────────────────────────────────────

export function useConversations() {
  const { setConversations } = useChatStore();

  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await api.get<{ data: Conversation[] }>("/conversations");
      setConversations(res.data.data ?? []);
      return res.data.data ?? [];
    },
  });
}

export function useCreateConversation() {
  const { addConversation, setActiveConversation } = useChatStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (title?: string) => {
      const res = await api.post<{ data: Conversation }>("/conversations", { title });
      return res.data.data;
    },
    onSuccess: (conv) => {
      addConversation(conv);
      setActiveConversation(conv.id);
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => toast.error("Failed to create conversation"),
  });
}

export function useDeleteConversation() {
  const { removeConversation, setActiveConversation, activeConversationId } = useChatStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/conversations/${id}`);
      return id;
    },
    onSuccess: (id) => {
      removeConversation(id);
      if (activeConversationId === id) setActiveConversation(null);
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => toast.error("Failed to delete conversation"),
  });
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export function useMessages(conversationId: string | null) {
  const { setMessages } = useChatStore();

  return useQuery({
    queryKey: ["messages", conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const res = await api.get<{ data: Message[] }>(`/conversations/${conversationId}/messages`);
      const msgs = res.data.data ?? [];
      setMessages(conversationId!, msgs);
      return msgs;
    },
  });
}

// ─── Streaming Chat via Socket ────────────────────────────────────────────────

export function useSocketChat() {
  const {
    activeConversationId,
    addMessage,
    startStreaming,
    appendChunk,
    finishStreaming,
    clearStreaming,
    setTyping,
    setActiveConversation,
    addConversation,
  } = useChatStore();

  const qc = useQueryClient();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const socket = getSocket();

    socket.on("chat:chunk", ({ chunk, conversationId }) => {
      if (!isMounted.current) return;
      const { streamingMessage } = useChatStore.getState();
      if (!streamingMessage) {
        startStreaming(conversationId);
      }
      appendChunk(chunk);
    });

    socket.on("chat:done", ({ messageId }) => {
      if (!isMounted.current) return;
      finishStreaming(messageId);
      setTyping(false);
    });

    socket.on("chat:error", ({ error }) => {
      clearStreaming();
      setTyping(false);
      toast.error(error ?? "Something went wrong");
    });

    socket.on("typing:start", () => setTyping(true));
    socket.on("typing:stop", () => setTyping(false));

    socket.on("ticket:escalated", ({ ticket }: { ticket: Ticket }) => {
      toast(
        `🎫 Ticket #${ticket.id.slice(0, 8)} created — a human agent will follow up soon.`,
        { duration: 6000, icon: "🔔" }
      );
      qc.invalidateQueries({ queryKey: ["tickets"] });
    });

    return () => {
      isMounted.current = false;
      socket.off("chat:chunk");
      socket.off("chat:done");
      socket.off("chat:error");
      socket.off("typing:start");
      socket.off("typing:stop");
      socket.off("ticket:escalated");
    };
  }, [addMessage, startStreaming, appendChunk, finishStreaming, clearStreaming, setTyping, qc]);

  const sendMessage = useCallback(
    (content: string) => {
      const socket = getSocket();

      // Optimistically add user message
      const tempMsg: Message = {
        id: `temp-${Date.now()}`,
        conversationId: activeConversationId ?? "new",
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };

      if (activeConversationId) {
        addMessage(activeConversationId, tempMsg);
        socket.emit("chat:message", { content, conversationId: activeConversationId });
      } else {
        // New conversation — backend will create it
        socket.emit("chat:message", { content });

        // Listen for the first chunk to get the conversation ID
        socket.once("chat:chunk", ({ conversationId }) => {
          setActiveConversation(conversationId);
          addMessage(conversationId, { ...tempMsg, conversationId });
          qc.invalidateQueries({ queryKey: ["conversations"] });
        });
      }
    },
    [activeConversationId, addMessage, setActiveConversation, addConversation, qc]
  );

  return { sendMessage };
}
