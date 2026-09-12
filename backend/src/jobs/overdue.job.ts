import cron from "node-cron";
import { config } from "../config.js";
import { prisma } from "../lib/prisma.js";
import { publicTask } from "../lib/serialize.js";
import { recordActivity } from "../services/activity.service.js";
import { publishTaskUpdated } from "../ws/hub.js";

const SYSTEM_EMAIL = "system@velozity.local";

export function startOverdueJob(): void {
  cron.schedule(config.overdueCron, () => {
    void flagOverdueTasks();
  });
}

export async function flagOverdueTasks(): Promise<number> {
  const system = await prisma.user.findUnique({ where: { email: SYSTEM_EMAIL } });
  if (!system) return 0;

  const due = await prisma.task.findMany({
    where: {
      isOverdue: false,
      status: { not: "DONE" },
      dueDate: { lt: new Date() },
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true, createdById: true } },
    },
  });

  if (due.length === 0) return 0;

  await prisma.task.updateMany({
    where: { id: { in: due.map((task) => task.id) } },
    data: { isOverdue: true },
  });

  for (const task of due) {
    const flagged = { ...task, isOverdue: true };
    await recordActivity({
      type: "TASK_OVERDUE",
      taskId: task.id,
      projectId: task.projectId,
      actorId: system.id,
      message: `Task #${task.number} “${task.title}” was flagged as Overdue`,
      projectOwnerId: task.project.createdById,
      assigneeId: task.assigneeId,
    });
    publishTaskUpdated({
      task: publicTask(flagged),
      projectId: task.projectId,
      projectOwnerId: task.project.createdById,
      assigneeId: task.assigneeId,
    });
  }

  return due.length;
}
