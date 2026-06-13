import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/authStore";
import log from "loglevel";

if (import.meta.env.PROD) {
  log.setLevel("warn");
} else {
  log.setLevel("debug");
}

export default log;

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || window.location.origin;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = useAuthStore.getState().accessToken;

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socket.on("connect", () => {
      log.info("🔌 Socket connected", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      log.warn("🔌 Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      log.error("Socket error:", err.message);
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function reconnectSocket() {
  disconnectSocket();
  return getSocket();
}