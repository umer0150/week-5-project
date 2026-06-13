import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/authStore";

// const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = useAuthStore.getState().accessToken;
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socket.on("connect", () => console.log("🔌 Socket connected"));
    socket.on("disconnect", () => console.log("🔌 Socket disconnected"));
    socket.on("connect_error", (err) => console.error("Socket error:", err.message));
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
