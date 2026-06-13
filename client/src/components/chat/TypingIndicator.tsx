import { Bot } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm">
        <div className="flex gap-1 items-center h-4">
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400" />
        </div>
      </div>
    </div>
  );
}
