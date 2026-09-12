import type {
  Activity,
  Client,
  Dashboard,
  Notification,
  Project,
  Task,
  TaskPriority,
  TaskStatus,
  User,
} from "./types";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

let accessToken: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function tryRefresh(): Promise<boolean> {
  const res = await fetch(`${API}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { accessToken: string; user: User };
  accessToken = data.accessToken;
  return true;
}

export async function restoreSession(): Promise<User | null> {
  const ok = await tryRefresh();
  if (!ok) return null;
  const me = await api<{ user: User }>("/api/auth/me");
  return me.user;
}

async function api<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const res = await fetch(`${API}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && !retried && !path.startsWith("/api/auth/login") && !path.startsWith("/api/auth/refresh")) {
    refreshInFlight ??= tryRefresh().finally(() => {
      refreshInFlight = null;
    });
    const ok = await refreshInFlight;
    if (ok) return api<T>(path, init, true);
  }

  if (res.status === 204) return undefined as T;

  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as { error?: { code?: string; message?: string } };
    throw new ApiError(
      res.status,
      err.error?.code ?? "ERROR",
      err.error?.message ?? "Request failed",
    );
  }
  return data as T;
}

export const authApi = {
  login: (email: string, password: string) =>
    api<{ accessToken: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => api<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
};

export const dashboardApi = {
  get: () => api<{ dashboard: Dashboard }>("/api/dashboard"),
};

export const projectApi = {
  list: () => api<{ projects: Project[] }>("/api/projects"),
  get: (id: string) => api<{ project: Project }>(`/api/projects/${id}`),
  create: (body: { name: string; description: string; clientId: string }) =>
    api<{ project: Project }>("/api/projects", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<{ name: string; description: string; clientId: string }>) =>
    api<{ project: Project }>(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) => api<void>(`/api/projects/${id}`, { method: "DELETE" }),
  createTask: (
    projectId: string,
    body: {
      title: string;
      description: string;
      assigneeId?: string | null;
      status?: TaskStatus;
      priority?: TaskPriority;
      dueDate: string;
    },
  ) =>
    api<{ task: Task }>(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export const taskApi = {
  list: (params: Record<string, string>) => {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) qs.set(key, value);
    }
    const suffix = qs.toString() ? `?${qs}` : "";
    return api<{ tasks: Task[] }>(`/api/tasks${suffix}`);
  },
  updateStatus: (id: string, status: TaskStatus) =>
    api<{ task: Task }>(`/api/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

export const activityApi = {
  list: (limit = 20) => api<{ activities: Activity[] }>(`/api/activity?limit=${limit}`),
};

export const notificationApi = {
  list: () => api<{ notifications: Notification[]; unread: number }>("/api/notifications"),
  markRead: (id: string) =>
    api<{ notification: Notification }>(`/api/notifications/${id}/read`, { method: "PATCH" }),
  markAll: () => api<{ ok: boolean }>("/api/notifications/read-all", { method: "POST" }),
};

export const clientApi = {
  list: () => api<{ clients: Client[] }>("/api/clients"),
  create: (body: { name: string; company: string; email: string }) =>
    api<{ client: Client }>("/api/clients", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<{ name: string; company: string; email: string }>) =>
    api<{ client: Client }>(`/api/clients/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) => api<void>(`/api/clients/${id}`, { method: "DELETE" }),
};

export const userApi = {
  list: () => api<{ users: User[] }>("/api/users"),
  create: (body: { name: string; email: string; password: string; role: User["role"] }) =>
    api<{ user: User }>("/api/users", { method: "POST", body: JSON.stringify(body) }),
};
