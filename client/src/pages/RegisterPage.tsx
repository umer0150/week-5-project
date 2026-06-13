import { useState } from "react";
import { Link } from "react-router-dom";
import { Bot, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useRegister } from "../hooks/useAuth";

/* ---------------- SCHEMA ---------------- */

const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name is too long"),

  email: z.string().email("Enter a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain one uppercase letter")
    .regex(/[a-z]/, "Must contain one lowercase letter")
    .regex(/[0-9]/, "Must contain one number"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const registerMutation = useRegister();

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const password = watch("password");

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
            <Bot className="w-7 h-7 text-blue-400" />
          </div>

          <h1 className="text-2xl font-semibold text-white">Create Account</h1>

          <p className="text-gray-500 text-sm mt-1">
            Join NovaDesk AI Support Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-7 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <div>
              <label className="text-sm text-gray-300">Full Name</label>

              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />

                <input
                  type="text"
                  {...register("name")}
                  placeholder="John Doe"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/40"
                />
              </div>

              {errors.name && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="text-sm text-gray-300">Email Address</label>

              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />

                <input
                  type="email"
                  {...register("email")}
                  placeholder="you@example.com"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/40"
                />
              </div>

              {errors.email && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-gray-300">Password</label>

              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />

                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Create a strong password"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/40"
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

              {/* Password Strength */}
              {password && (
                <div className="mt-3 space-y-1">
                  <div className="flex gap-1">
                    <div
                      className={`h-1 flex-1 rounded ${
                        password.length >= 8 ? "bg-green-500" : "bg-gray-700"
                      }`}
                    />
                    <div
                      className={`h-1 flex-1 rounded ${
                        /[A-Z]/.test(password) ? "bg-green-500" : "bg-gray-700"
                      }`}
                    />
                    <div
                      className={`h-1 flex-1 rounded ${
                        /[0-9]/.test(password) ? "bg-green-500" : "bg-gray-700"
                      }`}
                    />
                  </div>

                  <p className="text-xs text-gray-500">
                    Use at least 8 characters, one uppercase letter, and one
                    number.
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white py-2.5 rounded-xl text-sm font-medium transition shadow-lg shadow-blue-500/20 disabled:opacity-60"
            >
              {registerMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}

              {registerMutation.isPending
                ? "Creating account..."
                : "Create Account"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
