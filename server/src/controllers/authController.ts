import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { users, refreshTokens } from "../db/schema";
import { eq } from "drizzle-orm";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { successResponse, errorResponse } from "../utils/response";
import { z } from "zod";
import type { AuthRequest } from "../types";

// ─── Validation Schemas ───────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const body = registerSchema.parse(req.body);

    // Check if user already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);

    if (existing.length > 0) {
      errorResponse(res, "Email already registered", 409);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 12);

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        name: body.name,
        email: body.email,
        password: hashedPassword,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      });

    // Generate tokens
    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = signRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(refreshTokens).values({
      userId: user.id,
      token: refreshToken,
      expiresAt,
    });

    successResponse(
      res,
      { user, accessToken, refreshToken },
      "Registration successful",
      201,
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      errorResponse(res, err.issues[0].message, 422);
      return;
    }
    console.error("Register error:", err);
    errorResponse(res, "Registration failed", 500);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const body = loginSchema.parse(req.body);

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);

    if (!user || !(await bcrypt.compare(body.password, user.password))) {
      errorResponse(res, "Invalid email or password", 401);
      return;
    }

    if (!user.isActive) {
      errorResponse(res, "Account is deactivated", 403);
      return;
    }

    // Generate tokens
    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = signRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token (rotate - delete old ones for this user)
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, user.id));
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(refreshTokens).values({
      userId: user.id,
      token: refreshToken,
      expiresAt,
    });

    successResponse(
      res,
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
      "Login successful",
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      errorResponse(res, err.issues[0].message, 422);
      return;
    }
    console.error("Login error:", err);
    errorResponse(res, "Login failed", 500);
  }
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      errorResponse(res, "Refresh token required", 400);
      return;
    }

    // Verify token
    const decoded = verifyRefreshToken(token);

    // Check token exists in DB (not revoked)
    const [stored] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, token))
      .limit(1);

    if (!stored || stored.expiresAt < new Date()) {
      errorResponse(res, "Invalid or expired refresh token", 401);
      return;
    }

    // Generate new tokens (rotation)
    const newAccessToken = signAccessToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });
    const newRefreshToken = signRefreshToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    // Replace old refresh token
    await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(refreshTokens).values({
      userId: decoded.userId,
      token: newRefreshToken,
      expiresAt,
    });

    successResponse(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch {
    errorResponse(res, "Token refresh failed", 401);
  }
}

export async function logout(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { refreshToken: token } = req.body;

    if (token) {
      await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
    }

    // Delete all refresh tokens for this user
    if (req.user?.userId) {
      await db
        .delete(refreshTokens)
        .where(eq(refreshTokens.userId, req.user.userId));
    }

    successResponse(res, null, "Logged out successfully");
  } catch (err) {
    console.error("Logout error:", err);
    errorResponse(res, "Logout failed", 500);
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, req.user!.userId))
      .limit(1);

    if (!user) {
      errorResponse(res, "User not found", 404);
      return;
    }

    successResponse(res, user);
  } catch (err) {
    console.error("GetMe error:", err);
    errorResponse(res, "Failed to get user", 500);
  }
}
