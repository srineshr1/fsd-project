import { useQuery } from "@tanstack/react-query";
import { ActivityFeed } from "../components/ActivityFeed";
import { StatusSelect } from "../components/StatusSelect";
import { PriorityBadge, StatusBadge } from "../components/ui";
import { useActivity } from "../hooks/useActivity";
import { dashboardApi } from "../lib/api";
import { dueLabel, PRIORITY_LABEL, STATUSES } from "../lib/format";
import type { Task } from "../lib/types";
import { usePresence } from "../store/presence";

function Card({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <p className="text-xs uppercase tracking-wider text-mute">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-mute">{hint}</p>}
    </div>
  );
}

export function DashboardPage() {
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: dashboardApi.get });
  const activity = useActivity();
  const onlineCount = usePresence((s) => s.onlineCount);
  const dashboard = data?.dashboard;

  if (!dashboard) return <p className="text-mute">Loading desk…</p>;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {dashboard.role === "ADMIN" && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card label="Projects" value={dashboard.totalProjects} />
              <Card label="Overdue" value={dashboard.overdueCount} hint="Flagged by the scheduler" />
              <Card label="Online now" value={onlineCount || dashboard.onlineCount} hint="Live presence" />
              <Card
                label="Open tasks"
                value={
                  dashboard.tasksByStatus.TODO +
                  dashboard.tasksByStatus.IN_PROGRESS +
                  dashboard.tasksByStatus.IN_REVIEW
                }
              />
            </div>
            <div className="rounded-xl border border-line bg-panel p-4">
              <p className="mb-3 text-sm text-mute">Tasks by status</p>
              <div className="grid grid-cols-4 gap-2">
                {STATUSES.map((status) => (
                  <div key={status} className="rounded-lg bg-ink p-3">
                    <StatusBadge status={status} />
                    <p className="mt-2 text-2xl">{dashboard.tasksByStatus[status]}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {dashboard.role === "PROJECT_MANAGER" && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Card label="Your projects" value={dashboard.projectCount} />
              <Card
                label="Due this week"
                value={dashboard.upcomingThisWeek.length}
                hint="Incomplete tasks"
              />
            </div>
            <div className="rounded-xl border border-line bg-panel p-4">
              <p className="mb-3 text-sm text-mute">Tasks by priority</p>
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
            </div>
            <div className="rounded-xl border border-line bg-panel p-4">
              <p className="mb-3 text-sm text-mute">Upcoming due dates</p>
              {dashboard.upcomingThisWeek.length === 0 && (
                <p className="text-sm text-mute">Nothing due in the next 7 days.</p>
              )}
              {dashboard.upcomingThisWeek.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          </>
        )}

        {dashboard.role === "DEVELOPER" && (
          <div className="rounded-xl border border-line bg-panel p-4">
            <p className="mb-3 text-sm text-mute">Assigned to you · priority then due date</p>
            {dashboard.tasks.length === 0 && <p className="text-sm text-mute">No assigned tasks.</p>}
            {dashboard.tasks.map((task) => (
              <div key={task.id} className="mb-2 flex items-center justify-between gap-3 rounded-lg bg-ink px-3 py-2">
                <TaskRow task={task} />
                <StatusSelect task={task} />
              </div>
            ))}
          </div>
        )}
      </div>
      <aside className="rounded-xl border border-line bg-panel p-4">
        <p className="mb-3 text-sm font-medium">Activity</p>
        <ActivityFeed items={activity.data?.activities ?? []} />
      </aside>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm">
        <span className="font-mono text-mute">#{task.number}</span> {task.title}
      </p>
      <p className="mt-0.5 font-mono text-[11px] text-mute">
        {task.project?.name} · {PRIORITY_LABEL[task.priority]} · {dueLabel(task.dueDate)}
        {task.isOverdue ? " · Overdue" : ""}
      </p>
    </div>
  );
}
