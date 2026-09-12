import type { TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { PRIORITY_RANK, publicTask } from "../lib/serialize.js";
import type { AuthUser } from "../types/auth.js";
import { taskWhere } from "./scope.js";
import { onlineCount, onlineUserIds } from "../ws/presence.js";

const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export async function getDashboard(user: AuthUser) {
  if (user.role === "ADMIN") {
    const overdueWhere = { isOverdue: true, status: { not: "DONE" as const } };
    const [totalProjects, tasks, overdueCount, overdueTasks, projects] = await Promise.all([
      prisma.project.count(),
      prisma.task.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.task.count({ where: overdueWhere }),
      prisma.task.findMany({
        where: overdueWhere,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true, createdById: true } },
        },
        orderBy: { dueDate: "asc" },
      }),
      prisma.project.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          client: { select: { id: true, name: true, company: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { tasks: true } },
          tasks: { where: overdueWhere, select: { id: true } },
        },
      }),
    ]);
    const tasksByStatus = Object.fromEntries(STATUSES.map((status) => [status, 0])) as Record<
      TaskStatus,
      number
    >;
    for (const row of tasks) {
      tasksByStatus[row.status] = row._count._all;
    }
    return {
      role: user.role,
      totalProjects,
      tasksByStatus,
      overdueCount,
      onlineCount: onlineCount(),
      onlineUserIds: onlineUserIds(),
      overdueTasks: overdueTasks.map(publicTask),
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        client: project.client,
        createdBy: project.createdBy,
        taskCount: project._count.tasks,
        overdueCount: project.tasks.length,
      })),
    };
  }

  if (user.role === "PROJECT_MANAGER") {
    const now = new Date();
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const where = taskWhere(user);
    const [projectCount, grouped, upcoming] = await Promise.all([
      prisma.project.count({ where: { createdById: user.id } }),
      prisma.task.groupBy({ by: ["priority"], where, _count: { _all: true } }),
      prisma.task.findMany({
        where: {
          AND: [where, { dueDate: { gte: now, lte: weekAhead }, status: { not: "DONE" } }],
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true, createdById: true } },
        },
        orderBy: { dueDate: "asc" },
      }),
    ]);
    const tasksByPriority = Object.fromEntries(PRIORITIES.map((p) => [p, 0])) as Record<
      TaskPriority,
      number
    >;
    for (const row of grouped) {
      tasksByPriority[row.priority] = row._count._all;
    }
    return {
      role: user.role,
      projectCount,
      tasksByPriority,
      upcomingThisWeek: upcoming.map(publicTask),
    };
  }

  const tasks = await prisma.task.findMany({
    where: { assigneeId: user.id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true, createdById: true } },
    },
  });
  const sorted = [...tasks].sort((a, b) => {
    const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (pr !== 0) return pr;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });
  return {
    role: user.role,
    tasks: sorted.map(publicTask),
  };
}
