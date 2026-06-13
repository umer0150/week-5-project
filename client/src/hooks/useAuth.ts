import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { disconnectSocket } from "../services/socket";
import type { AuthResponse } from "../types";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export function useLogin() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      loginSchema.parse(data);
      const res = await api.post<{ data: AuthResponse }>("/auth/login", data);
      return res.data.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate("/chat");
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err.response?.data?.error ?? "Login failed");
    },
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      registerSchema.parse(data);
      const res = await api.post<{ data: AuthResponse }>("/auth/register", data);
      return res.data.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success("Account created successfully!");
      navigate("/chat");
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err.response?.data?.error ?? "Registration failed");
    },
  });
}

export function useLogout() {
  const { logout, refreshToken } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      try {
        await api.post("/auth/logout", { refreshToken });
      } catch {
        // Ignore errors - always log out locally
      }
    },
    onSettled: () => {
      disconnectSocket();
      logout();
      navigate("/login");
      toast.success("Logged out successfully");
    },
  });
}
