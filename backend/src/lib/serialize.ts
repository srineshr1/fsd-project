import type {
  Activity,
  Client,
  Project,
  Task,
  TaskPriority,
  TaskStatus,
  User,
} from "@prisma/client";

export const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const PRIORITY_RANK: Record<TaskPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export function publicUser(user: Pick<User, "id" | "email" | "name" | "role" | "createdAt">) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function publicClient(client: Client) {
  return {
    id: client.id,
    name: client.name,
    company: client.company,
    email: client.email,
    createdById: client.createdById,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
  };
}

type ProjectWithClient = Project & {
  client?: Pick<Client, "id" | "name" | "company">;
  createdBy?: Pick<User, "id" | "name" | "email">;
  _count?: { tasks: number };
};

export function publicProject(project: ProjectWithClient) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    clientId: project.clientId,
    createdById: project.createdById,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    client: project.client ?? null,
    createdBy: project.createdBy ?? null,
    taskCount: project._count?.tasks ?? undefined,
  };
}

type TaskWithRels = Task & {
  assignee?: Pick<User, "id" | "name" | "email"> | null;
  project?: Pick<Project, "id" | "name" | "createdById">;
};

export function publicTask(task: TaskWithRels) {
  return {
    id: task.id,
    number: task.number,
    title: task.title,
    description: task.description,
    projectId: task.projectId,
    assigneeId: task.assigneeId,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    isOverdue: task.isOverdue,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    assignee: task.assignee ?? null,
    project: task.project ?? null,
  };
}

type ActivityWithRels = Activity & {
  actor?: Pick<User, "id" | "name" | "email">;
  task?: Pick<Task, "id" | "number" | "title">;
  project?: Pick<Project, "id" | "name">;
};

export function publicActivity(activity: ActivityWithRels) {
  return {
    id: activity.id,
    type: activity.type,
    taskId: activity.taskId,
    projectId: activity.projectId,
    actorId: activity.actorId,
    fromStatus: activity.fromStatus,
    toStatus: activity.toStatus,
    message: activity.message,
    createdAt: activity.createdAt,
    actor: activity.actor ?? null,
    task: activity.task ?? null,
    project: activity.project ?? null,
  };
}
