import { Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { errorResponse } from "../utils/response";
import type { AuthRequest } from "../types";

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    errorResponse(res, "No token provided", 401);
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch {
    errorResponse(res, "Invalid or expired token", 401);
  }
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== "admin") {
    errorResponse(res, "Admin access required", 403);
    return;
  }
  next();
}
