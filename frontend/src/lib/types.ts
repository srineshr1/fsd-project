export type Role = "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ActivityType =
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "STATUS_CHANGED"
  | "ASSIGNEE_CHANGED"
  | "PRIORITY_CHANGED"
  | "TASK_OVERDUE";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
};

export type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  clientId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  client?: Pick<Client, "id" | "name" | "company"> | null;
  createdBy?: Pick<User, "id" | "name" | "email"> | null;
  taskCount?: number;
  tasks?: Task[];
};

export type Task = {
  id: string;
  number: number;
  title: string;
  description: string;
  projectId: string;
  assigneeId: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
  assignee?: Pick<User, "id" | "name" | "email"> | null;
  project?: Pick<Project, "id" | "name" | "createdById"> | null;
};

export type Activity = {
  id: string;
  type: ActivityType;
  taskId: string;
  projectId: string;
  actorId: string;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus | null;
  message: string;
  createdAt: string;
  actor?: Pick<User, "id" | "name" | "email"> | null;
  task?: Pick<Task, "id" | "number" | "title"> | null;
  project?: Pick<Project, "id" | "name"> | null;
};

export type Notification = {
  id: string;
  userId: string;
  type: "TASK_ASSIGNED" | "TASK_IN_REVIEW";
  title: string;
  message: string;
  taskId: string | null;
  projectId: string | null;
  read: boolean;
  createdAt: string;
};

export type AdminDashboard = {
  role: "ADMIN";
  totalProjects: number;
  tasksByStatus: Record<TaskStatus, number>;
  overdueCount: number;
  onlineCount: number;
  onlineUserIds: string[];
  overdueTasks: Task[];
  projects: Array<{
    id: string;
    name: string;
    client: Pick<Client, "id" | "name" | "company"> | null;
    createdBy: Pick<User, "id" | "name" | "email"> | null;
    taskCount: number;
    overdueCount: number;
  }>;
};

export type PmDashboard = {
  role: "PROJECT_MANAGER";
  projectCount: number;
  tasksByPriority: Record<TaskPriority, number>;
  upcomingThisWeek: Task[];
};

export type DevDashboard = {
  role: "DEVELOPER";
  tasks: Task[];
};

export type Dashboard = AdminDashboard | PmDashboard | DevDashboard;
