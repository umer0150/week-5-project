import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import { env } from "./config/env";
import { router } from "./routes";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { setupSocketHandlers } from "./services/socketService";
import { startTicketWorker } from "./workers/ticketWorker";
import type { ServerToClientEvents, ClientToServerEvents } from "./types";

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: env.FRONTEND_URL,
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// cors

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
  max: parseInt(env.RATE_LIMIT_MAX),
  message: { success: false, error: "Too many requests, please try again later." },
});
app.use("/api", limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", router);

// ─── Error Handlers ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Socket Handlers ──────────────────────────────────────────────────────────
setupSocketHandlers(io);

// ─── BullMQ Workers ───────────────────────────────────────────────────────────
startTicketWorker();

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = parseInt(env.PORT);

httpServer.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${env.NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${env.FRONTEND_URL}`);
  console.log(`📚 API: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket ready\n`);
});

export { app, io };
