import { Response } from "express";
import { db } from "../db";
import { tickets } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { successResponse, errorResponse } from "../utils/response";
import type { AuthRequest } from "../types";
import { z } from "zod";

const createTicketSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  conversationId: z.string().uuid().optional(),
});

const updateTicketSchema = z.object({
  status: z.enum(["open", "in_progress", "escalated", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignedTo: z.string().uuid().optional(),
});

// GET /api/tickets
export async function getTickets(req: AuthRequest, res: Response): Promise<void> {
  try {
    const isAdmin = req.user?.role === "admin";

    const userTickets = isAdmin
      ? await db.select().from(tickets).orderBy(desc(tickets.createdAt)).limit(100)
      : await db
          .select()
          .from(tickets)
          .where(eq(tickets.userId, req.user!.userId))
          .orderBy(desc(tickets.createdAt))
          .limit(50);

    successResponse(res, userTickets);
  } catch (err) {
    console.error("getTickets error:", err);
    errorResponse(res, "Failed to get tickets", 500);
  }
}

// GET /api/tickets/:id
export async function getTicket(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.role === "admin";

    const query = isAdmin
      ? await db.select().from(tickets).where(eq(tickets.id, id)).limit(1)
      : await db
          .select()
          .from(tickets)
          .where(and(eq(tickets.id, id), eq(tickets.userId, req.user!.userId)))
          .limit(1);

    if (query.length === 0) {
      errorResponse(res, "Ticket not found", 404);
      return;
    }

    successResponse(res, query[0]);
  } catch (err) {
    console.error("getTicket error:", err);
    errorResponse(res, "Failed to get ticket", 500);
  }
}

// POST /api/tickets
export async function createTicket(req: AuthRequest, res: Response): Promise<void> {
  try {
    const body = createTicketSchema.parse(req.body);

    const [ticket] = await db
      .insert(tickets)
      .values({
        userId: req.user!.userId,
        title: body.title,
        description: body.description,
        priority: body.priority ?? "medium",
        conversationId: body.conversationId,
      })
      .returning();

    successResponse(res, ticket, "Ticket created", 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      errorResponse(res, err.errors[0].message, 422);
      return;
    }
    console.error("createTicket error:", err);
    errorResponse(res, "Failed to create ticket", 500);
  }
}

// PATCH /api/tickets/:id
export async function updateTicket(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const body = updateTicketSchema.parse(req.body);

    const [existing] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, id))
      .limit(1);

    if (!existing) {
      errorResponse(res, "Ticket not found", 404);
      return;
    }

    const updateData: Partial<typeof tickets.$inferInsert> = {
      ...body,
      updatedAt: new Date(),
    };

    if (body.status === "resolved") {
      updateData.resolvedAt = new Date();
    }

    const [updated] = await db
      .update(tickets)
      .set(updateData)
      .where(eq(tickets.id, id))
      .returning();

    successResponse(res, updated, "Ticket updated");
  } catch (err) {
    if (err instanceof z.ZodError) {
      errorResponse(res, err.errors[0].message, 422);
      return;
    }
    console.error("updateTicket error:", err);
    errorResponse(res, "Failed to update ticket", 500);
  }
}
