import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { parseBody } from "../lib/validate.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import * as projectService from "../services/project.service.js";
import * as taskService from "../services/task.service.js";

const createSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(1).max(2000),
  clientId: z.string().uuid(),
});

const patchSchema = createSchema.partial();

const createTaskSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().min(1).max(4000),
  assigneeId: z.string().uuid().nullable().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  dueDate: z.coerce.date(),
});

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authenticate);

  app.get("/", async (request) => {
    const projects = await projectService.listProjects(request.user);
    return { projects };
  });

  app.post("/", { preHandler: [authorize("ADMIN", "PROJECT_MANAGER")] }, async (request, reply) => {
    const body = parseBody(createSchema, request.body);
    const project = await projectService.createProject(request.user, body);
    return reply.status(201).send({ project });
  });

  app.get("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const project = await projectService.getProject(request.user, id);
    return { project };
  });

  app.patch("/:id", { preHandler: [authorize("ADMIN", "PROJECT_MANAGER")] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = parseBody(patchSchema, request.body);
    const project = await projectService.updateProject(request.user, id, body);
    return { project };
  });

  app.delete("/:id", { preHandler: [authorize("ADMIN", "PROJECT_MANAGER")] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await projectService.deleteProject(request.user, id);
    return reply.status(204).send();
  });

  app.post(
    "/:id/tasks",
    { preHandler: [authorize("ADMIN", "PROJECT_MANAGER")] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = parseBody(createTaskSchema, request.body);
      const task = await taskService.createTask(request.user, id, body);
      return reply.status(201).send({ task });
    },
  );
}
