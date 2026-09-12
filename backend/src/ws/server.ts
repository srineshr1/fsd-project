import type { FastifyInstance } from "fastify";
import { Server } from "socket.io";
import { config } from "../config.js";
import { Errors } from "../lib/errors.js";
import { verifyAccessToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
import { listAccessibleProjectIds } from "../services/scope.js";
import type { AuthUser } from "../types/auth.js";
import { joinUserRooms, publishPresence, setIo } from "./hub.js";
import { addPresence, onlineCount, onlineUserIds, removePresence } from "./presence.js";

export function attachSocketServer(app: FastifyInstance): Server {
  const io = new Server(app.server, {
    cors: {
      origin: config.frontendOrigins,
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });
  setIo(io);

  io.use(async (socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ??
        (typeof socket.handshake.headers.authorization === "string"
          ? socket.handshake.headers.authorization.replace("Bearer ", "")
          : undefined);
      if (!token) {
        return next(Errors.unauthorized("Socket authentication required"));
      }
      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, name: true, role: true },
      });
      if (!user) {
        return next(Errors.unauthorized("Account no longer exists"));
      }
      socket.data.user = user as AuthUser;
      next();
    } catch (err) {
      next(err instanceof Error ? err : Errors.unauthorized());
    }
  });

  io.on("connection", async (socket) => {
    const user = socket.data.user as AuthUser;
    const projectIds = await listAccessibleProjectIds(user);
    joinUserRooms(socket, user, projectIds);
    addPresence(user.id, socket.id);
    publishPresence();

    socket.emit("presence:update", {
      onlineCount: onlineCount(),
      onlineUserIds: onlineUserIds(),
    });

    socket.on("project:subscribe", async (projectId: string, ack?: (ok: boolean) => void) => {
      if (typeof projectId !== "string") {
        ack?.(false);
        return;
      }
      if (!projectIds.includes(projectId)) {
        ack?.(false);
        return;
      }
      await socket.join(`project:${projectId}`);
      ack?.(true);
    });

    socket.on("disconnect", () => {
      removePresence(user.id, socket.id);
      publishPresence();
    });
  });

  return io;
}
