import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { parseBody } from "../lib/validate.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import * as clientService from "../services/client.service.js";

const upsertSchema = z.object({
  name: z.string().min(2).max(80),
  company: z.string().min(2).max(120),
  email: z.string().email(),
});

const patchSchema = upsertSchema.partial();

export async function clientRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authenticate);

  app.get("/", { preHandler: [authorize("ADMIN", "PROJECT_MANAGER")] }, async (request) => {
    const clients = await clientService.listClients(request.user);
    return { clients };
  });

  app.post("/", { preHandler: [authorize("ADMIN")] }, async (request, reply) => {
    const body = parseBody(upsertSchema, request.body);
    const client = await clientService.createClient(request.user, body);
    return reply.status(201).send({ client });
  });

  app.patch("/:id", { preHandler: [authorize("ADMIN")] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = parseBody(patchSchema, request.body);
    const client = await clientService.updateClient(request.user, id, body);
    return { client };
  });

  app.delete("/:id", { preHandler: [authorize("ADMIN")] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await clientService.deleteClient(request.user, id);
    return reply.status(204).send();
  });
}
