import {
  Plus,
  MessageSquare,
  Trash2,
  Ticket,
  BookOpen,
  Bot,
  LogOut,
  AlertTriangle,
} from "lucide-react";

import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

import { useChatStore } from "../../store/chatStore";
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
} from "../../hooks/useChat";

import { useLogout } from "../../hooks/useAuth";
import { useAuthStore } from "../../store/authStore";
import { formatDistanceToNow } from "date-fns";
import clsx from "clsx";

/* ---------------- CONFIRM MODAL ---------------- */

function ConfirmDeleteModal({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-xs bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 text-amber-400 mb-2">
          <AlertTriangle className="w-4 h-4" />
          <p className="text-sm font-medium">Delete conversation?</p>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          This action cannot be undone.
        </p>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2 rounded-xl bg-gray-800 text-gray-300 text-sm hover:bg-gray-700"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 px-3 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- SIDEBAR ---------------- */

export default function Sidebar() {
  const location = useLocation();

  const { activeConversationId, setActiveConversation } = useChatStore();

  const { data: conversations = [], isLoading } = useConversations();

  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();

  const logout = useLogout();
  const { user } = useAuthStore();

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const navLinks = [
    { to: "/chat", icon: MessageSquare, label: "Chat" },
    { to: "/tickets", icon: Ticket, label: "My Tickets" },
    { to: "/faqs", icon: BookOpen, label: "FAQ" },
  ];

  return (
    <aside className="h-full w-full flex flex-col bg-gray-950 text-white min-h-0">
      {/* HEADER */}
      <div className="p-4 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>

          <div className="min-w-0">
            <h1 className="font-bold text-base truncate">NovaDesk AI</h1>
            <p className="text-xs text-gray-500">
              Intelligent Support Platform
            </p>
          </div>
        </div>
      </div>

      {/* NAV */}
      <nav className="p-3 border-b border-gray-800 flex-shrink-0">
        {navLinks.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={clsx(
              "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition",
              location.pathname === to
                ? "bg-blue-500/10 text-sky-300 border border-blue-500/20"
                : "text-gray-400 hover:bg-gray-900 hover:text-white",
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* CONVERSATIONS (IMPORTANT FIX: min-h-0 + overflow) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        <div className="flex items-center justify-between px-1 py-2">
          <span className="text-[11px] text-gray-500 uppercase tracking-widest">
            Recent Chats
          </span>

          <button
            onClick={() => createConversation.mutate(undefined)}
            className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-400 flex items-center justify-center"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-14 bg-gray-900 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setActiveConversation(conv.id)}
                className={clsx(
                  "group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer border transition",
                  activeConversationId === conv.id
                    ? "bg-blue-500/10 border-blue-500/20"
                    : "border-transparent hover:bg-gray-900",
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{conv.title}</p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(conv.updatedAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(conv.id);
                  }}
                  className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
            <span className="text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>

          <button
            onClick={() => logout.mutate()}
            className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DELETE MODAL */}
      <ConfirmDeleteModal
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteConversation.mutate(deleteId);
            setDeleteId(null);
          }
        }}
      />
    </aside>
  );
}
