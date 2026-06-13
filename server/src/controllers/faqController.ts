import { Request, Response } from "express";
import { db } from "../db";
import { faqs } from "../db/schema";
import { eq, ilike, or, and, desc, type SQL } from "drizzle-orm";
import { successResponse, errorResponse } from "../utils/response";
import type { AuthRequest } from "../types";
import { z } from "zod";

const faqSchema = z.object({
  question: z.string().min(10),
  answer: z.string().min(20),
  category: z.string().min(2),
  tags: z.array(z.string()).optional(),
});

// GET /api/faqs
export async function getFAQs(req: Request, res: Response): Promise<void> {
  try {
    const { search, category } = req.query;

    const conditions: SQL[] = [eq(faqs.isActive, true)];

    if (search) {
      conditions.push(
        or(
          ilike(faqs.question, `%${search}%`),
          ilike(faqs.answer, `%${search}%`)
        )!
      );
    }

    if (category) {
      conditions.push(eq(faqs.category, category as string));
    }

    const results = await db
      .select()
      .from(faqs)
      .where(and(...conditions))
      .orderBy(desc(faqs.viewCount))
      .limit(50);

    successResponse(res, results);
  } catch (err) {
    console.error("getFAQs error:", err);
    errorResponse(res, "Failed to get FAQs", 500);
  }
}

// POST /api/faqs (admin)
export async function createFAQ(req: AuthRequest, res: Response): Promise<void> {
  try {
    const body = faqSchema.parse(req.body);
    const [faq] = await db.insert(faqs).values(body).returning();
    successResponse(res, faq, "FAQ created", 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      errorResponse(res, err.issues[0].message, 422);
      return;
    }
    errorResponse(res, "Failed to create FAQ", 500);
  }
}

// PATCH /api/faqs/:id (admin)
export async function updateFAQ(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const body = faqSchema.partial().parse(req.body);

    const [updated] = await db
      .update(faqs)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(faqs.id, id))
      .returning();

    if (!updated) {
      errorResponse(res, "FAQ not found", 404);
      return;
    }
    successResponse(res, updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      errorResponse(res, err.issues[0].message, 422);
      return;
    }
    errorResponse(res, "Failed to update FAQ", 500);
  }
}

// DELETE /api/faqs/:id (admin)
export async function deleteFAQ(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    await db.update(faqs).set({ isActive: false }).where(eq(faqs.id, id));
    successResponse(res, null, "FAQ deleted");
  } catch (err) {
    errorResponse(res, "Failed to delete FAQ", 500);
  }
}