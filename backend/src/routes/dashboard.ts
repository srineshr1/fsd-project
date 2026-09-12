import type { FastifyInstance } from "fastify";
import { authenticate } from "../middleware/authenticate.js";
import { getDashboard } from "../services/dashboard.service.js";

export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authenticate);

  app.get("/", async (request) => {
    const dashboard = await getDashboard(request.user);
    return { dashboard };
  });
}
