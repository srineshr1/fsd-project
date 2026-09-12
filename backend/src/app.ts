import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import Fastify from "fastify";
import { config } from "./config.js";
import { registerErrorHandler } from "./plugins/error-handler.js";
import { activityRoutes } from "./routes/activity.js";
import { authRoutes } from "./routes/auth.js";
import { clientRoutes } from "./routes/clients.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { notificationRoutes } from "./routes/notifications.js";
import { projectRoutes } from "./routes/projects.js";
import { taskRoutes } from "./routes/tasks.js";
import { userRoutes } from "./routes/users.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.isProd ? "info" : "debug",
    },
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || config.frontendOrigins.includes(origin)) {
        cb(null, true);
        return;
      }
      cb(new Error("Origin not allowed"), false);
    },
    credentials: true,
  });
  await app.register(cookie);

  await registerErrorHandler(app);

  app.get("/", async () => ({ ok: true }));
  app.head("/", async (_request, reply) => reply.code(200).send());
  app.get("/api/health", async () => ({ ok: true }));

  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(userRoutes, { prefix: "/api/users" });
  await app.register(clientRoutes, { prefix: "/api/clients" });
  await app.register(projectRoutes, { prefix: "/api/projects" });
  await app.register(taskRoutes, { prefix: "/api/tasks" });
  await app.register(activityRoutes, { prefix: "/api/activity" });
  await app.register(notificationRoutes, { prefix: "/api/notifications" });
  await app.register(dashboardRoutes, { prefix: "/api/dashboard" });

  return app;
}
