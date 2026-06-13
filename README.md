# 🤖 SupportAI — AI Customer Support Agent

A full-stack PERN application with real-time AI-powered customer support, streaming responses, JWT auth, and escalation logic.

---

## 🗂️ Project Structure

```
ai-support-app/
├── backend/          ← Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/       ← env, redis config
│   │   ├── controllers/  ← auth, chat, tickets, faqs
│   │   ├── db/           ← drizzle schema, migrations, seed
│   │   ├── middleware/   ← auth JWT, error handler
│   │   ├── routes/       ← all API routes
│   │   ├── services/     ← AI (Anthropic), Socket.io
│   │   ├── types/        ← TypeScript types
│   │   ├── utils/        ← jwt, response helpers
│   │   ├── workers/      ← BullMQ ticket worker
│   │   └── index.ts      ← entry point
│   ├── drizzle.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/         ← React 18 + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/     ← ProtectedRoute
│   │   │   ├── chat/     ← ChatWindow, MessageBubble, ChatInput, TypingIndicator
│   │   │   └── layout/   ← Sidebar, AppLayout
│   │   ├── hooks/        ← useAuth, useChat, useTickets
│   │   ├── pages/        ← LoginPage, RegisterPage, ChatPage, TicketsPage, FAQPage
│   │   ├── services/     ← axios api, socket.io client
│   │   ├── store/        ← Zustand authStore, chatStore
│   │   ├── types/        ← shared TypeScript types
│   │   ├── App.tsx       ← Routes
│   │   └── main.tsx      ← Entry point
│   ├── package.json
│   └── vite.config.ts
│
└── docker-compose.yml  ← PostgreSQL + Redis
```

---

## ⚡ Quick Setup

### Step 1 — Prerequisites
- Node.js 20+ LTS
- Docker Desktop (for local Postgres + Redis)
- Anthropic API key → https://console.anthropic.com

---

### Step 2 — Start infrastructure

```bash
# From the project root (ai-support-app/)
docker-compose up -d
```

This starts:
- PostgreSQL 16 on port `5432`
- Redis 7 on port `6379`

---

### Step 3 — Backend setup

```bash
cd backend

# 1. Copy env file and fill in values
cp .env.example .env
# Edit .env — set your ANTHROPIC_API_KEY

# 2. Install dependencies
npm install

# 3. Push schema to database
npm run db:push

# 4. Seed FAQs
npx tsx src/db/seed.ts

# 5. Start dev server
npm run dev
```

Backend runs at: `http://localhost:5000`

---

### Step 4 — Frontend setup

```bash
cd frontend

# 1. Copy env file
cp .env.example .env

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

### Step 5 — Create your first account

1. Open `http://localhost:5173`
2. Click "Create one" to register
3. Start chatting with the AI agent!

---

## 🔧 Environment Variables

### Backend `.env`

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL URL | `postgresql://postgres:password@localhost:5432/ai_support` |
| `REDIS_URL` | Redis URL | `redis://localhost:6379` |
| `JWT_ACCESS_SECRET` | JWT access secret (32+ chars) | `your_secret_here_must_be_long` |
| `JWT_REFRESH_SECRET` | JWT refresh secret (32+ chars) | `another_secret_here_also_long` |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | `sk-ant-...` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

### Frontend `.env`

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | WebSocket server URL | `http://localhost:5000` |

---

## 🚀 Deploy to Railway

### Backend
1. Push `backend/` folder to a GitHub repo
2. Create new Railway project → "Deploy from GitHub"
3. Add environment variables in Railway dashboard
4. For database: add a **PostgreSQL** plugin in Railway (copy the `DATABASE_URL`)
5. For Redis: add a **Redis** plugin (copy the `REDIS_URL`)
6. After deploy: run migrations via Railway shell: `npm run db:push && npx tsx src/db/seed.ts`

### Frontend
1. Push `frontend/` to GitHub
2. Deploy to **Railway** or **Vercel**
3. Set `VITE_API_URL` and `VITE_SOCKET_URL` to your Railway backend URL
4. Build command: `npm run build`
5. Output directory: `dist`

---

## 🏗️ Key Features

| Feature | Implementation |
|---|---|
| AI chat with tool use | Anthropic Claude + `search_faqs`, `escalate_to_human`, `get_ticket_status` tools |
| Streaming responses | Socket.io chunks sent word-by-word |
| Conversation history | PostgreSQL via Drizzle ORM |
| JWT auth | Access token (15min) + refresh token rotation (7 days) |
| Real-time | Socket.io WebSocket connection |
| Background jobs | BullMQ + Redis (ticket auto-assign, notifications) |
| Escalation | AI decides when to create human support ticket |

---

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Sign in
- `POST /api/auth/refresh` — Refresh tokens
- `POST /api/auth/logout` — Sign out
- `GET /api/auth/me` — Get current user

### Conversations
- `GET /api/conversations` — List conversations
- `POST /api/conversations` — Create conversation
- `GET /api/conversations/:id` — Get with messages
- `DELETE /api/conversations/:id` — Delete

### Tickets
- `GET /api/tickets` — List tickets
- `POST /api/tickets` — Create ticket
- `PATCH /api/tickets/:id` — Update status

### FAQs
- `GET /api/faqs` — List FAQs (search + filter)
- `POST /api/faqs` — Create (admin only)

---

## 🔌 Socket Events

| Event | Direction | Description |
|---|---|---|
| `chat:message` | Client → Server | Send a message |
| `chat:chunk` | Server → Client | Streaming response chunk |
| `chat:done` | Server → Client | Stream complete |
| `chat:error` | Server → Client | Error occurred |
| `typing:start` | Server → Client | AI is thinking |
| `ticket:escalated` | Server → Client | Escalation happened |

---

## 🛠️ Useful Commands

```bash
# Backend
npm run dev          # Start with hot reload
npm run build        # Compile TypeScript
npm run db:studio    # Open Drizzle Studio (DB GUI)
npm run db:push      # Push schema changes
npm run db:generate  # Generate migrations

# Frontend  
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```
