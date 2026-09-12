import type { Prisma } from "@prisma/client";
import { Errors } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import type { AuthUser } from "../types/auth.js";

export async function listAccessibleProjectIds(user: AuthUser): Promise<string[]> {
  if (user.role === "ADMIN") {
    const rows = await prisma.project.findMany({ select: { id: true } });
    return rows.map((row) => row.id);
  }
  if (user.role === "PROJECT_MANAGER") {
    const rows = await prisma.project.findMany({
      where: { createdById: user.id },
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }
  const rows = await prisma.task.findMany({
    where: { assigneeId: user.id },
    select: { projectId: true },
    distinct: ["projectId"],
  });
  return rows.map((row) => row.projectId);
}

export function projectWhere(user: AuthUser): Prisma.ProjectWhereInput {
  if (user.role === "ADMIN") return {};
  if (user.role === "PROJECT_MANAGER") return { createdById: user.id };
  return { tasks: { some: { assigneeId: user.id } } };
}

export function taskWhere(user: AuthUser): Prisma.TaskWhereInput {
  if (user.role === "ADMIN") return {};
  if (user.role === "PROJECT_MANAGER") return { project: { createdById: user.id } };
  return { assigneeId: user.id };
}

export function activityWhere(user: AuthUser): Prisma.ActivityWhereInput {
  if (user.role === "ADMIN") return {};
  if (user.role === "PROJECT_MANAGER") return { project: { createdById: user.id } };
  return { task: { assigneeId: user.id } };
}

export async function getProjectForUser(user: AuthUser, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: { select: { id: true, name: true, company: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { tasks: true } },
    },
  });
  if (!project) throw Errors.notFound("Project");

  if (user.role === "ADMIN") return project;
  if (user.role === "PROJECT_MANAGER") {
    if (project.createdById !== user.id) {
      throw Errors.forbidden("You can only access projects you created");
    }
    return project;
  }

  const assigned = await prisma.task.findFirst({
    where: { projectId, assigneeId: user.id },
    select: { id: true },
  });
  if (!assigned) {
    throw Errors.forbidden("You can only access projects that contain your assigned tasks");
  }
  return project;
}

export async function assertProjectWrite(user: AuthUser, projectId: string) {
  const project = await getProjectForUser(user, projectId);
  if (user.role === "DEVELOPER") {
    throw Errors.forbidden("Developers cannot modify projects");
  }
  if (user.role === "PROJECT_MANAGER" && project.createdById !== user.id) {
    throw Errors.forbidden("You can only manage projects you created");
  }
  return project;
}

export async function getTaskForUser(user: AuthUser, taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true, createdById: true } },
    },
  });
  if (!task) throw Errors.notFound("Task");

  if (user.role === "ADMIN") return task;
  if (user.role === "PROJECT_MANAGER") {
    if (task.project.createdById !== user.id) {
      throw Errors.forbidden("You can only access tasks on projects you created");
    }
    return task;
  }
  if (task.assigneeId !== user.id) {
    throw Errors.forbidden("You can only access tasks assigned to you");
  }
  return task;
}
