import type { NotificationType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { publishNotification } from "../ws/hub.js";
import type { AuthUser } from "../types/auth.js";

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  taskId?: string | null;
  projectId?: string | null;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      taskId: input.taskId ?? null,
      projectId: input.projectId ?? null,
    },
  });
  publishNotification(input.userId, notification);
  return notification;
}

export async function listNotifications(user: AuthUser) {
  return prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function unreadCount(user: AuthUser) {
  return prisma.notification.count({ where: { userId: user.id, read: false } });
}

export async function markRead(user: AuthUser, id: string) {
  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return null;
  }
  return prisma.notification.update({
    where: { id },
    data: { read: true },
  });
}

export async function markAllRead(user: AuthUser) {
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
}
