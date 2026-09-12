import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { publicUser } from "../lib/serialize.js";
import { parseBody } from "../lib/validate.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { createUser } from "../services/auth.service.js";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(80),
  role: z.enum(["ADMIN", "PROJECT_MANAGER", "DEVELOPER"]),
});

export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authenticate);

  app.get("/", { preHandler: [authorize("ADMIN", "PROJECT_MANAGER")] }, async (request) => {
    const role = request.user.role;
    const users = await prisma.user.findMany({
      where:
        role === "ADMIN"
          ? { email: { not: "system@velozity.local" } }
          : { role: "DEVELOPER", email: { not: "system@velozity.local" } },
      orderBy: { name: "asc" },
    });
    return { users: users.map(publicUser) };
  });

  app.post("/", { preHandler: [authorize("ADMIN")] }, async (request, reply) => {
    const body = parseBody(createSchema, request.body);
    const user = await createUser(body);
    return reply.status(201).send({ user });
  });
}
