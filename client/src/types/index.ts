// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  isEscalated: boolean;
  escalationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: unknown;
  metadata?: { escalated?: boolean; ticketId?: string };
  createdAt: string;
}

// ─── Tickets ──────────────────────────────────────────────────────────────────

export type TicketStatus = "open" | "in_progress" | "escalated" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface Ticket {
  id: string;
  conversationId?: string;
  userId: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── FAQs ─────────────────────────────────────────────────────────────────────

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags?: string[];
  isActive: boolean;
  viewCount: number;
  createdAt: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ─── Socket ───────────────────────────────────────────────────────────────────

export interface StreamingMessage {
  id: string;
  conversationId: string;
  role: "assistant";
  content: string;
  isStreaming: boolean;
}

