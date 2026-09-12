import type { ActivityType, TaskStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { publicActivity, STATUS_LABEL } from "../lib/serialize.js";
import type { AuthUser } from "../types/auth.js";
import { activityWhere } from "./scope.js";
import { publishActivity } from "../ws/hub.js";

const activityInclude = {
  actor: { select: { id: true, name: true, email: true } },
  task: { select: { id: true, number: true, title: true } },
  project: { select: { id: true, name: true } },
} as const;

export function statusChangeMessage(
  actorName: string,
  taskNumber: number,
  from: TaskStatus,
  to: TaskStatus,
): string {
  return `${actorName} moved Task #${taskNumber} from ${STATUS_LABEL[from]} → ${STATUS_LABEL[to]}`;
}

export async function recordActivity(input: {
  type: ActivityType;
  taskId: string;
  projectId: string;
  actorId: string;
  fromStatus?: TaskStatus | null;
  toStatus?: TaskStatus | null;
  message: string;
  projectOwnerId: string;
  assigneeId: string | null;
}) {
  const activity = await prisma.activity.create({
    data: {
      type: input.type,
      taskId: input.taskId,
      projectId: input.projectId,
      actorId: input.actorId,
      fromStatus: input.fromStatus ?? null,
      toStatus: input.toStatus ?? null,
      message: input.message,
    },
    include: activityInclude,
  });
  const payload = publicActivity(activity);
  publishActivity({
    activity: payload,
    projectId: input.projectId,
    projectOwnerId: input.projectOwnerId,
    assigneeId: input.assigneeId,
  });
  return payload;
}

export async function listActivity(user: AuthUser, limit = 20) {
  const rows = await prisma.activity.findMany({
    where: activityWhere(user),
    include: activityInclude,
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 50),
  });
  return rows.map(publicActivity);
}
