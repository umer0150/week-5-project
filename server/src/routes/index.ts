import { Router } from "express";
import * as authController from "../controllers/authController";
import * as chatController from "../controllers/chatController";
import * as ticketController from "../controllers/ticketController";
import * as faqController from "../controllers/faqController";
import { authenticate, requireAdmin } from "../middleware/auth";

export const router = Router();

// ─── Auth Routes ──────────────────────────────────────────────────────────────
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/refresh", authController.refreshToken);
router.post("/auth/logout", authenticate, authController.logout);
router.get("/auth/me", authenticate, authController.getMe);

// ─── Conversation Routes ──────────────────────────────────────────────────────
router.get("/conversations", authenticate, chatController.getConversations);
router.post("/conversations", authenticate, chatController.createConversation);
router.get("/conversations/:id", authenticate, chatController.getConversation);
router.delete("/conversations/:id", authenticate, chatController.deleteConversation);
router.get("/conversations/:id/messages", authenticate, chatController.getMessages);

// ─── Ticket Routes ────────────────────────────────────────────────────────────
router.get("/tickets", authenticate, ticketController.getTickets);
router.post("/tickets", authenticate, ticketController.createTicket);
router.get("/tickets/:id", authenticate, ticketController.getTicket);
router.patch("/tickets/:id", authenticate, ticketController.updateTicket);

// ─── FAQ Routes ───────────────────────────────────────────────────────────────
router.get("/faqs", faqController.getFAQs);
router.post("/faqs", authenticate, requireAdmin, faqController.createFAQ);
router.patch("/faqs/:id", authenticate, requireAdmin, faqController.updateFAQ);
router.delete("/faqs/:id", authenticate, requireAdmin, faqController.deleteFAQ);

// ─── Health Check ─────────────────────────────────────────────────────────────
router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
