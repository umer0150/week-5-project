import { useEffect, useRef, useMemo } from "react";
import { MessageSquarePlus, Zap, Shield, Clock } from "lucide-react";

import { useChatStore } from "../../store/chatStore";
import {
  useMessages,
  useSocketChat,
  useCreateConversation,
} from "../../hooks/useChat";

import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ChatInput from "./ChatInput";

export default function ChatWindow() {
  const { activeConversationId, messages, streamingMessage, isTyping } =
    useChatStore();

  const { sendMessage } = useSocketChat();
  const createConversation = useCreateConversation();

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useMessages(activeConversationId);

  /* ---------------- STABLE MESSAGES ---------------- */
  const currentMessages = useMemo(() => {
    if (!activeConversationId) return [];
    return messages[activeConversationId] ?? [];
  }, [activeConversationId, messages]);

  /* ---------------- AUTO SCROLL ---------------- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [currentMessages.length, streamingMessage]);

  /* ---------------- EMPTY STATE ---------------- */
  if (!activeConversationId) {
    return (
      <div className="h-full bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          {/* ICON */}
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-blue-500/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-blue-400" />
          </div>

          {/* TITLE */}
          <h2 className="text-xl sm:text-2xl font-semibold mb-2">
            Hi, I’m Alex
          </h2>

          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Your AI support assistant for FAQs, account help, orders, billing,
            and general queries.
          </p>

          {/* FEATURES */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
            {[
              {
                icon: Zap,
                label: "Fast",
                desc: "Instant replies",
              },
              {
                icon: Shield,
                label: "Secure",
                desc: "Protected",
              },
              {
                icon: Clock,
                label: "24/7",
                desc: "Always on",
              },
            ].map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="bg-gray-900 border border-gray-800 rounded-xl p-3 hover:border-blue-500/20 transition"
              >
                <Icon className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <p className="text-xs font-medium">{label}</p>
                <p className="text-[11px] text-gray-500 mt-1">{desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => createConversation.mutate("New Conversation")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium shadow-lg shadow-blue-500/20"
          >
            <MessageSquarePlus className="w-4 h-4" />
            Start Conversation
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- CHAT VIEW ---------------- */
  return (
    <div className="h-full bg-gray-950 text-white flex flex-col">
      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-3">
        {currentMessages.length === 0 && !streamingMessage && !isTyping && (
          <div className="text-center text-gray-500 text-sm mt-10">
            How can I help you today?
          </div>
        )}

        {currentMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {streamingMessage && (
          <MessageBubble message={streamingMessage} isStreaming />
        )}

        {isTyping && !streamingMessage && <TypingIndicator />}

        {/* scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* INPUT (mobile sticky-safe) */}
      <div className="sticky bottom-0 border-t border-gray-800 bg-gray-950/90 backdrop-blur px-3 sm:px-6 py-3">
        <ChatInput
          onSend={sendMessage}
          disabled={isTyping}
          placeholder="Type your message..."
        />
      </div>
    </div>
  );
}
