import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import clsx from "clsx";

interface Props {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled, placeholder }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  /* ---------------- AUTO RESIZE ---------------- */
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [value]);

  /* ---------------- SEND ---------------- */
  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setValue("");
  };

  /* ---------------- KEYBOARD ---------------- */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    "Reset my password",
    "Track my order",
    "Cancel subscription",
    "Billing issue",
  ];

  return (
    <div className="w-full space-y-2">
      {/* SUGGESTIONS (mobile scrollable) */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSend(suggestion)}
            disabled={disabled}
            className={clsx(
              "whitespace-nowrap text-xs px-3 py-1.5 rounded-full border transition",
              "bg-gray-900 text-gray-400 border-gray-800",
              "hover:text-sky-300 hover:border-blue-500/20 hover:bg-gray-800",
              disabled && "opacity-40 cursor-not-allowed",
            )}
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* INPUT BOX */}
      <div
        className={clsx(
          "flex items-end gap-2 rounded-2xl px-3 py-2 border transition-all",
          "bg-gray-900/70 backdrop-blur-md",
          disabled
            ? "border-gray-800 opacity-60"
            : "border-gray-800 focus-within:border-blue-500/40 focus-within:shadow-lg focus-within:shadow-blue-500/10",
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            placeholder ?? "Ask anything — I’ll help you instantly..."
          }
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 resize-none focus:outline-none min-h-[24px] max-h-[120px] py-1"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className={clsx(
            "w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 transition-all",
            value.trim() && !disabled
              ? "bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/20"
              : "bg-gray-800 text-gray-500 cursor-not-allowed",
          )}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* HINT */}
      <p className="text-[11px] text-gray-600 text-center">
        Press <span className="text-gray-400">Enter</span> to send ·{" "}
        <span className="text-gray-400">Shift + Enter</span> for new line
      </p>
    </div>
  );
}