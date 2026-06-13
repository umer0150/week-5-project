import { Bot, User, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import clsx from "clsx";
import type { Message, StreamingMessage } from "../../types";

interface Props {
  message: Message | StreamingMessage;
  isStreaming?: boolean;
}

/* ---------------- SIMPLE RENDER ---------------- */

function renderContent(content: string) {
  return content.split("\n").map((line, i) => {
    const key = `${i}-${line}`;

    if (line.startsWith("- ") || line.startsWith("• ")) {
      return (
        <p key={key} className="ml-2">
          • {line.slice(2)}
        </p>
      );
    }

    if (/^\d+\./.test(line)) {
      return (
        <p key={key} className="ml-2">
          {line}
        </p>
      );
    }

    return (
      <p key={key} className="whitespace-pre-wrap">
        {line}
      </p>
    );
  });
}

/* ---------------- COMPONENT ---------------- */

export default function MessageBubble({ message, isStreaming }: Props) {
  const isAssistant = message.role === "assistant";

  const isEscalated = "metadata" in message && message.metadata?.escalated;

  return (
    <div
      className={clsx(
        "flex gap-2 sm:gap-3 w-full animate-fade-in",
        isAssistant ? "justify-start" : "justify-end",
      )}
    >
      {/* AI AVATAR */}
      {isAssistant && (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-blue-400" />
        </div>
      )}

      {/* MESSAGE COLUMN */}
      <div
        className={clsx(
          "max-w-[85%] sm:max-w-[75%] space-y-1",
          !isAssistant && "flex flex-col items-end",
        )}
      >
        {/* BUBBLE */}
        <div
          className={clsx(
            "px-3 sm:px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm border",
            "break-words whitespace-pre-wrap",

            isAssistant
              ? "bg-gray-900 text-gray-100 border-gray-800 rounded-tl-md"
              : "bg-blue-500 text-white border-blue-400/20 rounded-tr-md",
          )}
        >
          {isAssistant ? (
            <div className="space-y-1 text-gray-100">
              {renderContent(message.content)}
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}

          {/* STREAMING CURSOR */}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-blue-400 rounded-sm animate-pulse" />
          )}
        </div>

        {/* ESCALATION BADGE */}
        {isEscalated && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] text-amber-400">
              Escalated • Ticket #
              {(message as Message).metadata?.ticketId?.slice(0, 8)}
            </span>
          </div>
        )}

        {/* TIMESTAMP */}
        {"createdAt" in message && !isStreaming && (
          <p
            className={clsx(
              "text-[11px] text-gray-600",
              !isAssistant && "text-right",
            )}
          >
            {formatDistanceToNow(new Date(message.createdAt), {
              addSuffix: true,
            })}
          </p>
        )}
      </div>

      {/* USER AVATAR */}
      {!isAssistant && (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="w-4 h-4 text-gray-300" />
        </div>
      )}
    </div>
  );
}
