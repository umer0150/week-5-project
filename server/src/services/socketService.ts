import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../utils/jwt";
import { db } from "../db";
import { messages, conversations } from "../db/schema";
import { eq, desc, and } from "drizzle-orm";
import { streamAIResponse } from "../services/aiService";
import { enqueueEscalation } from "../workers/ticketWorker";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  ChatMessage,
} from "../types";

export function setupSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) return next(new Error("Authentication required"));
    try {
      const user = verifyAccessToken(token);
      (socket as Socket & { user: typeof user }).user = user;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = (
      socket as Socket & { user: ReturnType<typeof verifyAccessToken> }
    ).user;
    console.log(`🔌 User connected: ${user.email} (${socket.id})`);

    socket.on("chat:join", async (conversationId: string) => {
      const conv = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, conversationId),
            eq(conversations.userId, user.userId),
          ),
        )
        .limit(1);

      if (conv.length === 0) {
        socket.emit("chat:error", { error: "Conversation not found" });
        return;
      }

      socket.join(`conv:${conversationId}`);
    });

    socket.on("chat:leave", (conversationId: string) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on(
      "chat:message",
      async (data: { content: string; conversationId?: string }) => {
        try {
          let conversationId = data.conversationId;

          if (!conversationId) {
            const [conv] = await db
              .insert(conversations)
              .values({
                userId: user.userId,
                title: data.content.slice(0, 50),
              })
              .returning();
            conversationId = conv.id;
            socket.join(`conv:${conversationId}`);
          } else {
            // Verify the conversation belongs to this user
            const conv = await db
              .select()
              .from(conversations)
              .where(
                and(
                  eq(conversations.id, conversationId),
                  eq(conversations.userId, user.userId),
                ),
              )
              .limit(1);

            if (conv.length === 0) {
              socket.emit("chat:error", { error: "Conversation not found" });
              return;
            }
          }

          await db.insert(messages).values({
            conversationId,
            role: "user",
            content: data.content,
          });

          const history = await db
            .select()
            .from(messages)
            .where(eq(messages.conversationId, conversationId))
            .orderBy(desc(messages.createdAt))
            .limit(20);

          const chatHistory: ChatMessage[] = history.reverse().map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));

          socket.emit("typing:start", { conversationId });
          console.log(`🤖 Calling AI for conversation: ${conversationId}`);

          let fullResponse = "";

          const { content, escalation } = await streamAIResponse(
            chatHistory,
            conversationId,
            user.userId,
            (chunk) => {
              fullResponse += chunk;
              socket.emit("chat:chunk", { chunk, conversationId });
            },
            (tool, input) => {
              console.log(`🔧 Tool called: ${tool}`, input);
            },
          );

          const [savedMsg] = await db
            .insert(messages)
            .values({
              conversationId,
              role: "assistant",
              content: content || fullResponse,
              metadata: escalation
                ? { escalated: true, ticketId: escalation.ticketId }
                : undefined,
            })
            .returning();

          await db
            .update(conversations)
            .set({ updatedAt: new Date() })
            .where(eq(conversations.id, conversationId));

          socket.emit("typing:stop", { conversationId });
          socket.emit("chat:done", {
            conversationId,
            messageId: savedMsg.id,
          });

          if (escalation?.shouldEscalate && escalation.ticketId) {
            await enqueueEscalation(escalation.ticketId, user.userId);
            socket.emit("ticket:escalated", {
              ticket: {
                id: escalation.ticketId,
                priority: escalation.priority,
                reason: escalation.reason,
              },
            });
          }
        } catch (err) {
          console.error("Socket chat error:", err);
          socket.emit("chat:error", { error: "Failed to process message" });
        }
      },
    );

    socket.on("disconnect", () => {
      console.log(`🔌 User disconnected: ${user.email}`);
    });
  });
}