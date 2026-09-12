import type { FastifyReply, FastifyRequest } from "fastify";
import { config, REFRESH_COOKIE } from "../config.js";
import { Errors } from "../lib/errors.js";
import { generateRefreshToken, hashRefreshToken, signAccessToken } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { prisma } from "../lib/prisma.js";
import { publicUser } from "../lib/serialize.js";
import type { AuthUser } from "../types/auth.js";

function refreshExpiry(): Date {
  return new Date(Date.now() + config.refreshTokenDays * 24 * 60 * 60 * 1000);
}

function cookieFlags(request?: FastifyRequest) {
  const origin = request?.headers.origin ?? "";
  const crossSite = origin.startsWith("https://") && !origin.includes("localhost");
  return {
    httpOnly: true as const,
    secure: crossSite || config.cookieSecure,
    sameSite: (crossSite ? "none" : config.cookieSameSite) as "lax" | "none" | "strict",
    path: "/api/auth",
  };
}

export function setRefreshCookie(reply: FastifyReply, raw: string, request?: FastifyRequest): void {
  reply.setCookie(REFRESH_COOKIE, raw, {
    ...cookieFlags(request),
    expires: refreshExpiry(),
  });
}

export function clearRefreshCookie(reply: FastifyReply, request?: FastifyRequest): void {
  reply.clearCookie(REFRESH_COOKIE, cookieFlags(request));
}

async function issueSession(user: AuthUser, reply: FastifyReply, request?: FastifyRequest) {
  const accessToken = signAccessToken(user);
  const refresh = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refresh.hash,
      expiresAt: refreshExpiry(),
    },
  });
  setRefreshCookie(reply, refresh.raw, request);
  return { accessToken };
}

export async function login(email: string, password: string, reply: FastifyReply, request?: FastifyRequest) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    throw Errors.unauthorized("Invalid email or password");
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    throw Errors.unauthorized("Invalid email or password");
  }
  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  const session = await issueSession(authUser, reply, request);
  return {
    accessToken: session.accessToken,
    user: publicUser(user),
  };
}

export async function refresh(
  rawToken: string | undefined,
  reply: FastifyReply,
  request?: FastifyRequest,
) {
  if (!rawToken) {
    throw Errors.unauthorized("Missing refresh token");
  }
  const tokenHash = hashRefreshToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!stored || stored.expiresAt < new Date()) {
    clearRefreshCookie(reply, request);
    throw Errors.unauthorized("Refresh token is invalid or expired");
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const authUser: AuthUser = {
    id: stored.user.id,
    email: stored.user.email,
    name: stored.user.name,
    role: stored.user.role,
  };
  const session = await issueSession(authUser, reply, request);
  return {
    accessToken: session.accessToken,
    user: publicUser(stored.user),
  };
}

export async function logout(
  rawToken: string | undefined,
  reply: FastifyReply,
  request?: FastifyRequest,
) {
  if (rawToken) {
    const tokenHash = hashRefreshToken(rawToken);
    await prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }
  clearRefreshCookie(reply, request);
}

export async function createUser(input: {
  email: string;
  password: string;
  name: string;
  role: AuthUser["role"];
}) {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw Errors.conflict("A user with that email already exists");
  }
  const user = await prisma.user.create({
    data: {
      email,
      name: input.name,
      role: input.role,
      passwordHash: await hashPassword(input.password),
    },
  });
  return publicUser(user);
}
