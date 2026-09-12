import type { FastifyInstance } from "fastify";
import { Errors } from "../lib/errors.js";
import { authenticate } from "../middleware/authenticate.js";
import * as notificationService from "../services/notification.service.js";

export async function notificationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authenticate);

  app.get("/", async (request) => {
    const [notifications, unread] = await Promise.all([
      notificationService.listNotifications(request.user),
      notificationService.unreadCount(request.user),
    ]);
    return { notifications, unread };
  });

  app.post("/read-all", async (request) => {
    await notificationService.markAllRead(request.user);
    return { ok: true };
  });

  app.patch("/:id/read", async (request) => {
    const { id } = request.params as { id: string };
    const notification = await notificationService.markRead(request.user, id);
    if (!notification) throw Errors.notFound("Notification");
    return { notification };
  });
}
