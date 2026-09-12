import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ActivityFeed } from "../components/ActivityFeed";
import { StatusSelect } from "../components/StatusSelect";
import { cn, PriorityBadge, StatusBadge, STATUS_DOT } from "../components/ui";
import { useActivity } from "../hooks/useActivity";
import { dashboardApi } from "../lib/api";
import { dueLabel, PRIORITY_LABEL, STATUSES } from "../lib/format";
import type { AdminDashboard, Task, TaskStatus } from "../lib/types";
import { usePresence } from "../store/presence";

function Card({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <p className="text-xs uppercase tracking-wider text-mute">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-mute">{hint}</p> : null}
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: { to: string; label: string };
  children: ReactNode;
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-line bg-panel">
      <header className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
        <p className="text-sm font-medium">{title}</p>
        {action ? (
          <Link to={action.to} className="font-mono text-[11px] text-copper hover:text-copper-hover">
            {action.label}
          </Link>
        ) : null}
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-3">{children}</div>
    </section>
  );
}

export function DashboardPage() {
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: dashboardApi.get });
  const activity = useActivity();
  const onlineCount = usePresence((s) => s.onlineCount);
  const dashboard = data?.dashboard;

  if (!dashboard) return <p className="text-mute">Loading desk…</p>;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        {dashboard.role === "ADMIN" ? (
          <AdminDesk dashboard={dashboard} onlineCount={onlineCount || dashboard.onlineCount} />
        ) : null}

        {dashboard.role === "PROJECT_MANAGER" ? (
          <>
            <div className="grid shrink-0 gap-3 sm:grid-cols-2">
              <Card label="Your projects" value={dashboard.projectCount} />
              <Card
                label="Due this week"
                value={dashboard.upcomingThisWeek.length}
                hint="Incomplete tasks"
              />
            </div>
            <div className="grid min-h-[16rem] flex-1 gap-4 lg:grid-cols-2">
              <Panel title="Tasks by priority">
                <div className="space-y-2">
                  {(Object.keys(dashboard.tasksByPriority) as Array<keyof typeof dashboard.tasksByPriority>).map(
                    (priority) => (
                      <div key={priority} className="flex items-center justify-between rounded-lg bg-ink px-3 py-2">
                        <PriorityBadge priority={priority} />
                        <span className="font-mono text-sm">{dashboard.tasksByPriority[priority]}</span>
                      </div>
                    ),
                  )}
                </div>
              </Panel>
              <Panel title="Upcoming due dates" action={{ to: "/tasks", label: "All tasks" }}>
                {dashboard.upcomingThisWeek.length === 0 ? (
                  <p className="px-1 py-6 text-sm text-mute">Nothing due in the next 7 days.</p>
                ) : (
                  dashboard.upcomingThisWeek.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))
                )}
              </Panel>
            </div>
          </>
        ) : null}

        {dashboard.role === "DEVELOPER" ? (
          <Panel title="Assigned to you · priority then due date">
            {dashboard.tasks.length === 0 ? <p className="px-1 py-6 text-sm text-mute">No assigned tasks.</p> : null}
            {dashboard.tasks.map((task) => (
              <div key={task.id} className="mb-2 flex items-center justify-between gap-3 rounded-lg bg-ink px-3 py-2">
                <TaskRow task={task} />
                <StatusSelect task={task} />
              </div>
            ))}
          </Panel>
        ) : null}
      </div>
      <aside className="flex min-h-[22rem] w-full shrink-0 flex-col overflow-hidden rounded-xl border border-line bg-panel lg:h-auto lg:min-h-0 lg:w-[340px]">
        <p className="shrink-0 border-b border-line px-4 py-3 text-sm font-medium">Activity</p>
        <div className="min-h-0 flex-1 overflow-auto p-3">
          <ActivityFeed items={activity.data?.activities ?? []} />
        </div>
      </aside>
    </div>
  );
}

function AdminDesk({
  dashboard,
  onlineCount,
}: {
  dashboard: AdminDashboard;
  onlineCount: number;
}) {
  const openTasks =
    dashboard.tasksByStatus.TODO + dashboard.tasksByStatus.IN_PROGRESS + dashboard.tasksByStatus.IN_REVIEW;
  const maxStatus = Math.max(...STATUSES.map((status) => dashboard.tasksByStatus[status]), 1);

  return (
    <>
      <div className="grid shrink-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Projects" value={dashboard.totalProjects} />
        <Card label="Overdue" value={dashboard.overdueCount} hint="Flagged by the scheduler" />
        <Card label="Online now" value={onlineCount} hint="Live presence" />
        <Card label="Open tasks" value={openTasks} />
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
        {STATUSES.map((status) => (
          <StatusTile
            key={status}
            status={status}
            count={dashboard.tasksByStatus[status]}
            max={maxStatus}
          />
        ))}
      </div>
      <div className="grid min-h-[16rem] flex-1 gap-4 lg:grid-cols-2">
        <Panel title="Needs attention" action={{ to: "/tasks", label: "All tasks" }}>
          {dashboard.overdueTasks.length === 0 ? (
            <p className="px-1 py-6 text-sm text-mute">Nothing overdue.</p>
          ) : (
            dashboard.overdueTasks.map((task) => <TaskRow key={task.id} task={task} />)
          )}
        </Panel>
        <Panel title="Projects" action={{ to: "/projects", label: "All projects" }}>
          {dashboard.projects.length === 0 ? (
            <p className="px-1 py-6 text-sm text-mute">No projects yet.</p>
          ) : (
            <ul className="space-y-2">
              {dashboard.projects.map((project) => (
                <li key={project.id}>
                  <Link
                    to={`/projects/${project.id}`}
                    className="block rounded-lg bg-ink px-3 py-2.5 hover:bg-ink/70"
                  >
                    <p className="truncate text-sm">{project.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-mute">
                      {project.client?.company ?? "No client"} · {project.taskCount} tasks
                      {project.overdueCount > 0 ? (
                        <span className="text-overdue"> · {project.overdueCount} overdue</span>
                      ) : null}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function StatusTile({
  status,
  count,
  max,
}: {
  status: TaskStatus;
  count: number;
  max: number;
}) {
  return (
    <div className="rounded-xl border border-line bg-panel p-3">
      <StatusBadge status={status} />
      <p className="mt-2 text-2xl font-semibold">{count}</p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
        <div
          className={cn("h-full rounded-full", STATUS_DOT[status])}
          style={{ width: `${count === 0 ? 0 : Math.max(8, (count / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  return (
    <Link
      to={`/projects/${task.projectId}`}
      className="mb-1 flex rounded-lg bg-ink px-3 py-2 last:mb-0 hover:bg-ink/70"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">
          <span className="font-mono text-mute">#{task.number}</span> {task.title}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-mute">
          {task.project?.name} · {PRIORITY_LABEL[task.priority]} · {dueLabel(task.dueDate)}
          {task.isOverdue ? " · Overdue" : ""}
        </p>
      </div>
    </Link>
  );
}
