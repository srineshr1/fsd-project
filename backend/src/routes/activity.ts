import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { parseQuery } from "../lib/validate.js";
import { authenticate } from "../middleware/authenticate.js";
import { listActivity } from "../services/activity.service.js";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export async function activityRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authenticate);

  app.get("/", async (request) => {
    const query = parseQuery(querySchema, request.query);
    const activities = await listActivity(request.user, query.limit ?? 20);
    return { activities };
  });
}
