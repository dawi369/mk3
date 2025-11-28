import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { SUPABASE_JWT_SECRET, HUB_API_KEY } from "@/config/env.js";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: "Authorization header required" });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Token required" });
    return;
  }

  // Option 1: Check if it's the static API key (for development)
  if (token === HUB_API_KEY) {
    req.user = { type: "api_key", role: "admin" };
    next();
    return;
  }

  // Option 2: Verify JWT token (for production/Supabase auth)
  try {
    const decoded = jwt.verify(token, SUPABASE_JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT Verification Error:", err);
    res.status(401).json({ error: "Invalid token" });
  }
};
