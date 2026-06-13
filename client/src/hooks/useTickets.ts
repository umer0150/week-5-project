import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../services/api";
import type { Ticket, TicketStatus, TicketPriority } from "../types";

export function useTickets() {
  return useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      const res = await api.get<{ data: Ticket[] }>("/tickets");
      return res.data.data ?? [];
    },
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      priority?: TicketPriority;
      conversationId?: string;
    }) => {
      const res = await api.post<{ data: Ticket }>("/tickets", data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket created successfully");
    },
    onError: () => toast.error("Failed to create ticket"),
  });
}

export function useUpdateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      status?: TicketStatus;
      priority?: TicketPriority;
    }) => {
      const res = await api.patch<{ data: Ticket }>(`/tickets/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket updated");
    },
    onError: () => toast.error("Failed to update ticket"),
  });
}
