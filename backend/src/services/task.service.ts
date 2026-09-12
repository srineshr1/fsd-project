import type { TaskPriority, TaskStatus } from "@prisma/client";
import { Errors } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { PRIORITY_RANK, publicTask, STATUS_LABEL } from "../lib/serialize.js";
import type { AuthUser } from "../types/auth.js";
import { recordActivity, statusChangeMessage } from "./activity.service.js";
import { createNotification } from "./notification.service.js";
import { assertProjectWrite, getTaskForUser, taskWhere } from "./scope.js";
import { publishTaskUpdated } from "../ws/hub.js";

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  project: { select: { id: true, name: true, createdById: true } },
} as const;

export type TaskFilters = {
  status?: TaskStatus;
  priority?: TaskPriority;
  dueFrom?: Date;
  dueTo?: Date;
  projectId?: string;
  overdue?: boolean;
};

function applyFilters(user: AuthUser, filters: TaskFilters) {
  return {
    AND: [
      taskWhere(user),
      filters.projectId ? { projectId: filters.projectId } : {},
      filters.status ? { status: filters.status } : {},
      filters.priority ? { priority: filters.priority } : {},
      filters.overdue === true ? { isOverdue: true } : {},
      filters.dueFrom || filters.dueTo
        ? {
            dueDate: {
              ...(filters.dueFrom ? { gte: filters.dueFrom } : {}),
              ...(filters.dueTo ? { lte: filters.dueTo } : {}),
            },
          }
        : {},
    ],
  };
}

export async function listTasks(user: AuthUser, filters: TaskFilters) {
  const tasks = await prisma.task.findMany({
    where: applyFilters(user, filters),
    include: taskInclude,
  });
  return [...tasks]
    .sort((a, b) => {
      const rank = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (rank !== 0) return rank;
      return a.dueDate.getTime() - b.dueDate.getTime();
    })
    .map(publicTask);
}

export async function getTask(user: AuthUser, id: string) {
  const task = await getTaskForUser(user, id);
  return publicTask(task);
}

export async function createTask(
  user: AuthUser,
  projectId: string,
  input: {
    title: string;
    description: string;
    assigneeId?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate: Date;
  },
) {
  const project = await assertProjectWrite(user, projectId);

  if (input.assigneeId) {
    const assignee = await prisma.user.findUnique({ where: { id: input.assigneeId } });
    if (!assignee || assignee.role !== "DEVELOPER") {
      throw Errors.validation("Tasks can only be assigned to a developer");
    }
  }

  const dueDate = input.dueDate;
  const isOverdue = dueDate < new Date() && (input.status ?? "TODO") !== "DONE";

  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      projectId,
      assigneeId: input.assigneeId ?? null,
      status: input.status ?? "TODO",
      priority: input.priority ?? "MEDIUM",
      dueDate,
      isOverdue,
    },
    include: taskInclude,
  });

  await recordActivity({
    type: "TASK_CREATED",
    taskId: task.id,
    projectId,
    actorId: user.id,
    message: `${user.name} created Task #${task.number} “${task.title}”`,
    projectOwnerId: project.createdById,
    assigneeId: task.assigneeId,
  });

  if (task.assigneeId) {
    await createNotification({
      userId: task.assigneeId,
      type: "TASK_ASSIGNED",
      title: "New task assigned",
      message: `${user.name} assigned Task #${task.number} “${task.title}” to you`,
      taskId: task.id,
      projectId,
    });
  }

  const payload = publicTask(task);
  publishTaskUpdated({
    task: payload,
    projectId,
    projectOwnerId: project.createdById,
    assigneeId: task.assigneeId,
  });
  return payload;
}

export async function updateTask(
  user: AuthUser,
  id: string,
  input: {
    title?: string;
    description?: string;
    assigneeId?: string | null;
    priority?: TaskPriority;
    dueDate?: Date;
  },
) {
  if (user.role === "DEVELOPER") {
    throw Errors.forbidden("Developers can only update task status");
  }

  const existing = await getTaskForUser(user, id);

  if (input.assigneeId) {
    const assignee = await prisma.user.findUnique({ where: { id: input.assigneeId } });
    if (!assignee || assignee.role !== "DEVELOPER") {
      throw Errors.validation("Tasks can only be assigned to a developer");
    }
  }

  const dueDate = input.dueDate ?? existing.dueDate;
  const isOverdue = dueDate < new Date() && existing.status !== "DONE";

  const task = await prisma.task.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description,
      assigneeId: input.assigneeId === undefined ? undefined : input.assigneeId,
      priority: input.priority,
      dueDate: input.dueDate,
      isOverdue,
    },
    include: taskInclude,
  });

  if (input.assigneeId && input.assigneeId !== existing.assigneeId) {
    const assigneeName = task.assignee?.name ?? "unassigned";
    await recordActivity({
      type: "ASSIGNEE_CHANGED",
      taskId: task.id,
      projectId: task.projectId,
      actorId: user.id,
      message: `${user.name} assigned Task #${task.number} to ${assigneeName}`,
      projectOwnerId: task.project.createdById,
      assigneeId: task.assigneeId,
    });
    if (task.assigneeId) {
      await createNotification({
        userId: task.assigneeId,
        type: "TASK_ASSIGNED",
        title: "New task assigned",
        message: `${user.name} assigned Task #${task.number} “${task.title}” to you`,
        taskId: task.id,
        projectId: task.projectId,
      });
    }
  }

  if (input.priority && input.priority !== existing.priority) {
    await recordActivity({
      type: "PRIORITY_CHANGED",
      taskId: task.id,
      projectId: task.projectId,
      actorId: user.id,
      message: `${user.name} changed Task #${task.number} priority to ${input.priority}`,
      projectOwnerId: task.project.createdById,
      assigneeId: task.assigneeId,
    });
  }

  if (input.title || input.description || input.dueDate) {
    await recordActivity({
      type: "TASK_UPDATED",
      taskId: task.id,
      projectId: task.projectId,
      actorId: user.id,
      message: `${user.name} updated Task #${task.number}`,
      projectOwnerId: task.project.createdById,
      assigneeId: task.assigneeId,
    });
  }

  const payload = publicTask(task);
  publishTaskUpdated({
    task: payload,
    projectId: task.projectId,
    projectOwnerId: task.project.createdById,
    assigneeId: task.assigneeId,
  });
  return payload;
}

export async function updateTaskStatus(user: AuthUser, id: string, status: TaskStatus) {
  const existing = await getTaskForUser(user, id);

  if (user.role === "DEVELOPER" && existing.assigneeId !== user.id) {
    throw Errors.forbidden("You can only update the status of tasks assigned to you");
  }

  if (existing.status === status) {
    return publicTask(existing);
  }

  const isOverdue = existing.dueDate < new Date() && status !== "DONE";

  const task = await prisma.task.update({
    where: { id },
    data: { status, isOverdue: status === "DONE" ? false : isOverdue },
    include: taskInclude,
  });

  await recordActivity({
    type: "STATUS_CHANGED",
    taskId: task.id,
    projectId: task.projectId,
    actorId: user.id,
    fromStatus: existing.status,
    toStatus: status,
    message: statusChangeMessage(user.name, task.number, existing.status, status),
    projectOwnerId: task.project.createdById,
    assigneeId: task.assigneeId,
  });

  if (status === "IN_REVIEW") {
    await createNotification({
      userId: task.project.createdById,
      type: "TASK_IN_REVIEW",
      title: "Task ready for review",
      message: `${user.name} moved Task #${task.number} to ${STATUS_LABEL[status]}`,
      taskId: task.id,
      projectId: task.projectId,
    });
  }

  const payload = publicTask(task);
  publishTaskUpdated({
    task: payload,
    projectId: task.projectId,
    projectOwnerId: task.project.createdById,
    assigneeId: task.assigneeId,
  });
  return payload;
}
