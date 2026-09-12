import type { FastifyReply, FastifyRequest } from "fastify";
import { Errors } from "../lib/errors.js";
import { verifyAccessToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
import type { AuthUser } from "../types/auth.js";

function readBearer(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

export async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const token = readBearer(request);
  if (!token) {
    throw Errors.unauthorized();
  }

  const payload = verifyAccessToken(token);
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) {
    throw Errors.unauthorized("Account no longer exists");
  }

  request.user = user as AuthUser;
}
