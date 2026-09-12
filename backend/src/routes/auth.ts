import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { REFRESH_COOKIE } from "../config.js";
import { parseBody } from "../lib/validate.js";
import { authenticate } from "../middleware/authenticate.js";
import * as authService from "../services/auth.service.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/login", async (request, reply) => {
    const body = parseBody(loginSchema, request.body);
    return authService.login(body.email, body.password, reply, request);
  });

  app.post("/refresh", async (request, reply) => {
    const raw = request.cookies[REFRESH_COOKIE];
    return authService.refresh(raw, reply, request);
  });

  app.post("/logout", async (request, reply) => {
    const raw = request.cookies[REFRESH_COOKIE];
    await authService.logout(raw, reply, request);
    return { ok: true };
  });

  app.get("/me", { preHandler: [authenticate] }, async (request) => {
    return { user: request.user };
  });
}
