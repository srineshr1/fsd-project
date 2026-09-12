import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { parseBody, parseQuery } from "../lib/validate.js";
import { authenticate } from "../middleware/authenticate.js";
import * as taskService from "../services/task.service.js";

const listQuery = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  dueFrom: z.coerce.date().optional(),
  dueTo: z.coerce.date().optional(),
  projectId: z.string().uuid().optional(),
  overdue: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
});

const patchSchema = z.object({
  title: z.string().min(2).max(160).optional(),
  description: z.string().min(1).max(4000).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  dueDate: z.coerce.date().optional(),
});

const statusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
});

export async function taskRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authenticate);

  app.get("/", async (request) => {
    const query = parseQuery(listQuery, request.query);
    const tasks = await taskService.listTasks(request.user, query);
    return { tasks };
  });

  app.get("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const task = await taskService.getTask(request.user, id);
    return { task };
  });

  app.patch("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const body = parseBody(patchSchema, request.body);
    const task = await taskService.updateTask(request.user, id, body);
    return { task };
  });

  app.patch("/:id/status", async (request) => {
    const { id } = request.params as { id: string };
    const body = parseBody(statusSchema, request.body);
    const task = await taskService.updateTaskStatus(request.user, id, body.status);
    return { task };
  });
}
