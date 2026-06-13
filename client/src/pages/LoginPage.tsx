import { useState } from "react";
import { Link } from "react-router-dom";
import { Bot, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useLogin } from "../hooks/useAuth";

/* ---------------- SCHEMA ---------------- */

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

/* ---------------- PAGE ---------------- */

export default function LoginPage() {
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    login.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white px-4">
      <div className="w-full max-w-md">
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
            <Bot className="w-7 h-7 text-blue-400" />
          </div>

          <h1 className="text-2xl font-semibold">NovaDesk AI</h1>
          <p className="text-gray-500 text-sm mt-1">
            Sign in to your support dashboard
          </p>
        </div>

        {/* CARD */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-7 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* EMAIL */}
            <div>
              <label className="text-sm text-gray-300">Email address</label>

              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />

                <input
                  type="email"
                  {...register("email")}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:border-blue-500/40 outline-none"
                  placeholder="you@example.com"
                />
              </div>

              {errors.email && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* PASSWORD */}
            <div>
              <label className="text-sm text-gray-300">Password</label>

              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />

                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:border-blue-500/40 outline-none"
                  placeholder="••••••••"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {errors.password && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={login.isPending}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white py-2.5 rounded-xl text-sm font-medium transition shadow-lg shadow-blue-500/20 disabled:opacity-60"
            >
              {login.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {login.isPending ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* DEMO */}
          <div className="mt-5 p-3 rounded-xl bg-gray-950 border border-gray-800">
            <p className="text-xs text-gray-400 mb-1">Demo credentials</p>
            <p className="text-xs text-gray-500">Email: demo@example.com</p>
            <p className="text-xs text-gray-500">Password: password123</p>
          </div>
        </div>

        {/* FOOTER */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
