import type { Server, Socket } from "socket.io";
import type { AuthUser } from "../types/auth.js";
import { onlineCount, onlineUserIds } from "./presence.js";

let ioRef: Server | null = null;

export function setIo(io: Server): void {
  ioRef = io;
}

export function tryGetIo(): Server | null {
  return ioRef;
}

export function userRoom(userId: string): string {
  return `user:${userId}`;
}

export function projectRoom(projectId: string): string {
  return `project:${projectId}`;
}

export function adminFeedRoom(): string {
  return "feed:admin";
}

export function pmFeedRoom(userId: string): string {
  return `feed:pm:${userId}`;
}

export function developerFeedRoom(userId: string): string {
  return `feed:dev:${userId}`;
}

export function joinUserRooms(socket: Socket, user: AuthUser, projectIds: string[]): void {
  socket.join(userRoom(user.id));
  for (const projectId of projectIds) {
    socket.join(projectRoom(projectId));
  }
  if (user.role === "ADMIN") {
    socket.join(adminFeedRoom());
  } else if (user.role === "PROJECT_MANAGER") {
    socket.join(pmFeedRoom(user.id));
  } else if (user.role === "DEVELOPER") {
    socket.join(developerFeedRoom(user.id));
  }
}

export type ActivityPayload = Record<string, unknown>;

export function publishActivity(input: {
  activity: ActivityPayload;
  projectId: string;
  projectOwnerId: string;
  assigneeId: string | null;
}): void {
  const io = tryGetIo();
  if (!io) return;
  const { activity, projectId, projectOwnerId, assigneeId } = input;
  io.to(projectRoom(projectId)).emit("activity:created", activity);
  io.to(adminFeedRoom()).emit("activity:created", activity);
  io.to(pmFeedRoom(projectOwnerId)).emit("activity:created", activity);
  if (assigneeId) {
    io.to(developerFeedRoom(assigneeId)).emit("activity:created", activity);
  }
}

export function publishTaskUpdated(input: {
  task: Record<string, unknown>;
  projectId: string;
  projectOwnerId: string;
  assigneeId: string | null;
}): void {
  const io = tryGetIo();
  if (!io) return;
  io.to(projectRoom(input.projectId)).emit("task:updated", input.task);
  io.to(adminFeedRoom()).emit("task:updated", input.task);
  io.to(pmFeedRoom(input.projectOwnerId)).emit("task:updated", input.task);
  if (input.assigneeId) {
    io.to(developerFeedRoom(input.assigneeId)).emit("task:updated", input.task);
  }
}

export function publishNotification(userId: string, notification: Record<string, unknown>): void {
  const io = tryGetIo();
  if (!io) return;
  io.to(userRoom(userId)).emit("notification:created", notification);
}

export function publishPresence(): void {
  const io = tryGetIo();
  if (!io) return;
  const payload = { onlineCount: onlineCount(), onlineUserIds: onlineUserIds() };
  io.to(adminFeedRoom()).emit("presence:update", payload);
}
