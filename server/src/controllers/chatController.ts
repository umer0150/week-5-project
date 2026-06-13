import { Response } from "express";
import { db } from "../db";
import { conversations, messages } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { successResponse, errorResponse } from "../utils/response";
import type { AuthRequest } from "../types";
import { z } from "zod";

// ─── Validation ───────────────────────────────────────────────────────────────

const createConversationSchema = z.object({
  title: z.string().optional(),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

// GET /api/conversations - list user's conversations
export async function getConversations(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, req.user!.userId as string))
      .orderBy(desc(conversations.updatedAt))
      .limit(50);

    successResponse(res, userConversations);
  } catch (err) {
    console.error("getConversations error:", err);
    errorResponse(res, "Failed to get conversations", 500);
  }
}

// POST /api/conversations - create new conversation
export async function createConversation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const body = createConversationSchema.parse(req.body);

    const [conversation] = await db
      .insert(conversations)
      .values({
        userId: req.user!.userId as string,
        title: body.title ?? "New Conversation",
      })
      .returning();

    successResponse(res, conversation, "Conversation created", 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      errorResponse(res, err.issues[0].message, 422);
      return;
    }
    console.error("createConversation error:", err);
    errorResponse(res, "Failed to create conversation", 500);
  }
}

// GET /api/conversations/:id - get single conversation with messages
export async function getConversation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    // Check ownership
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, id),
          eq(conversations.userId, req.user!.userId as string)
        )
      )
      .limit(1);

    if (!conversation) {
      errorResponse(res, "Conversation not found", 404);
      return;
    }

    // Get messages
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    successResponse(res, { ...conversation, messages: conversationMessages });
  } catch (err) {
    console.error("getConversation error:", err);
    errorResponse(res, "Failed to get conversation", 500);
  }
}

// DELETE /api/conversations/:id
export async function deleteConversation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, id),
          eq(conversations.userId, req.user!.userId as string)
        )
      )
      .limit(1);

    if (!conversation) {
      errorResponse(res, "Conversation not found", 404);
      return;
    }

    await db.delete(conversations).where(eq(conversations.id, id));

    successResponse(res, null, "Conversation deleted");
  } catch (err) {
    console.error("deleteConversation error:", err);
    errorResponse(res, "Failed to delete conversation", 500);
  }
}

// GET /api/conversations/:id/messages - get just messages
export async function getMessages(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    // Verify ownership
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, id),
          eq(conversations.userId, req.user!.userId as string)
        )
      )
      .limit(1);

    if (!conversation) {
      errorResponse(res, "Conversation not found", 404);
      return;
    }

    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    successResponse(res, conversationMessages);
  } catch (err) {
    console.error("getMessages error:", err);
    errorResponse(res, "Failed to get messages", 500);
  }
}