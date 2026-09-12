import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import type { AccessTokenPayload, AuthUser } from "../types/auth.js";
import { Errors } from "./errors.js";

export function signAccessToken(user: AuthUser): string {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  return jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpires,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, config.jwtAccessSecret) as AccessTokenPayload;
  } catch {
    throw Errors.unauthorized("Invalid or expired access token");
  }
}

export function generateRefreshToken(): { raw: string; hash: string } {
  const raw = randomBytes(48).toString("hex");
  return { raw, hash: hashRefreshToken(raw) };
}

export function hashRefreshToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
