# ── Stage 1: Build React frontend ──────────────────────────
FROM node:20-alpine AS client-build

WORKDIR /app/client

ARG VITE_API_URL
ARG VITE_SOCKET_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# ── Stage 2: Build Express backend ─────────────────────────
FROM node:20-alpine AS server-build

WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build

# ── Stage 3: Final image ────────────────────────────────────
FROM node:20-alpine AS final

WORKDIR /app

# Copy server files
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/node_modules ./server/node_modules
COPY --from=server-build /app/server/package*.json ./server/

# Copy client build into server public folder
COPY --from=client-build /app/client/dist ./server/dist/public

ENV NODE_ENV=production

WORKDIR /app/server

EXPOSE 5000

CMD ["node", "dist/index.js"]