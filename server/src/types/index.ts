import { Request } from "express";

// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface JWTPayload {
  userId: string;
  email: string;
  role: "user" | "admin";
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

// ─── AI Types ─────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ToolResult {
  tool: string;
  result: unknown;
}

export interface EscalationResult {
  shouldEscalate: boolean;
  reason?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  ticketId?: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Socket Types ─────────────────────────────────────────────────────────────

export interface ServerToClientEvents {
  "chat:chunk": (data: { chunk: string; conversationId: string }) => void;
  "chat:done": (data: { conversationId: string; messageId: string }) => void;
  "chat:error": (data: { error: string }) => void;
  "ticket:escalated": (data: { ticket: unknown }) => void;
  "typing:start": (data: { conversationId: string }) => void;
  "typing:stop": (data: { conversationId: string }) => void;
}

export interface ClientToServerEvents {
  "chat:message": (data: {
    content: string;
    conversationId?: string;
  }) => void;
  "chat:join": (conversationId: string) => void;
  "chat:leave": (conversationId: string) => void;
}
