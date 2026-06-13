import { useState } from "react";
import {
  Ticket,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Plus,
  X,
} from "lucide-react";

import {
  useTickets,
  useCreateTicket,
  useUpdateTicket,
} from "../hooks/useTickets";

import { formatDistanceToNow } from "date-fns";
import clsx from "clsx";

import { useForm, type SubmitHandler } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { ticketSchema, type TicketFormData } from "../schema/schema";

import type { TicketStatus, TicketPriority } from "../types";

/* ---------------- STATUS CONFIG ---------------- */

type StatusConfigItem = {
  label: string;
  icon: React.ElementType;
  className: string;
};

const statusConfig: Record<TicketStatus, StatusConfigItem> = {
  open: {
    label: "Open",
    icon: Clock,
    className: "text-blue-300 bg-blue-500/10 border-blue-500/20",
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    className: "text-sky-300 bg-sky-500/10 border-sky-500/20",
  },
  escalated: {
    label: "Escalated",
    icon: AlertTriangle,
    className: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle,
    className: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  },
  closed: {
    label: "Closed",
    icon: XCircle,
    className: "text-gray-400 bg-gray-500/10 border-gray-500/20",
  },
};

/* ---------------- PRIORITY ---------------- */

const priorityColor: Record<TicketPriority, string> = {
  low: "text-gray-400",
  medium: "text-sky-300",
  high: "text-amber-300",
  urgent: "text-red-400",
};

/* ---------------- MODAL ---------------- */

function NewTicketModal({ onClose }: { onClose: () => void }) {
  const createTicket = useCreateTicket();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
    },
  });

  const onSubmit: SubmitHandler<TicketFormData> = async (data) => {
    createTicket.mutate(data, {
      onSuccess: onClose,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-white font-semibold">Create Support Ticket</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <input
              {...register("title")}
              placeholder="Brief issue title"
              className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-sm focus:border-blue-500/40 outline-none"
            />
            {errors.title && (
              <p className="text-red-400 text-xs mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <textarea
              {...register("description")}
              rows={4}
              placeholder="Describe your issue..."
              className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-sm focus:border-blue-500/40 outline-none resize-none"
            />
            {errors.description && (
              <p className="text-red-400 text-xs mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Priority */}
          <div>
            <select
              {...register("priority")}
              className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-sm focus:border-blue-500/40 outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || createTicket.isPending}
              className="flex-1 px-3 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/20"
            >
              {createTicket.isPending ? "Creating..." : "Create Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------- PAGE ---------------- */

export default function TicketsPage() {
  const [showModal, setShowModal] = useState(false);

  const { data: tickets = [], isLoading } = useTickets();
  const updateTicket = useUpdateTicket();

  return (
    <div className="h-full bg-gray-950 text-white flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
        <div>
          <h1 className="text-lg font-semibold">Support Tickets</h1>
          <p className="text-xs text-gray-500">
            {tickets.length} total tickets
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-sm shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-gray-900 border border-gray-800 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16">
            <Ticket className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No tickets yet</p>
            <p className="text-gray-600 text-sm mt-1">
              Create a ticket to get human support
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const status = statusConfig[ticket.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={ticket.id}
                  className="group bg-gray-900 border border-gray-800 hover:border-blue-500/20 rounded-2xl p-4 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500 font-mono">
                          #{ticket.id.slice(0, 8)}
                        </span>

                        <span
                          className={clsx(
                            "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border",
                            status.className,
                          )}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>

                        <span
                          className={clsx(
                            "text-xs font-medium capitalize",
                            priorityColor[ticket.priority],
                          )}
                        >
                          {ticket.priority}
                        </span>
                      </div>

                      <h3 className="text-sm font-medium text-white mt-2">
                        {ticket.title}
                      </h3>

                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {ticket.description}
                      </p>

                      <p className="text-xs text-gray-600 mt-2">
                        {formatDistanceToNow(new Date(ticket.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>

                    {ticket.status !== "resolved" &&
                      ticket.status !== "closed" && (
                        <button
                          onClick={() =>
                            updateTicket.mutate({
                              id: ticket.id,
                              status: "resolved",
                            })
                          }
                          className="text-xs px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition"
                        >
                          Resolve
                        </button>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && <NewTicketModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
