import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { PriorityBadge, StatusBadge } from "../components/ui";
import { taskApi } from "../lib/api";
import { dueLabel, PRIORITIES, STATUSES, STATUS_LABEL } from "../lib/format";
import type { TaskStatus } from "../lib/types";
import { useAuth } from "../store/auth";

export function TasksPage() {
  const [params, setParams] = useSearchParams();
  const user = useAuth((s) => s.user);
  const queryClient = useQueryClient();
  const filters = {
    status: params.get("status") ?? "",
    priority: params.get("priority") ?? "",
    dueFrom: params.get("dueFrom") ?? "",
    dueTo: params.get("dueTo") ?? "",
  };
  const { data } = useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => taskApi.list(filters),
  });
  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => taskApi.updateStatus(id, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  function set(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">Tasks</h1>
      <p className="mb-4 text-sm text-mute">Filters live in the URL so you can share the view.</p>
      <div className="mb-4 flex flex-wrap gap-2">
        <select className="rounded-lg border border-line bg-panel px-3 py-2 text-sm" value={filters.status} onChange={(e) => set("status", e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABEL[status]}
            </option>
          ))}
        </select>
        <select className="rounded-lg border border-line bg-panel px-3 py-2 text-sm" value={filters.priority} onChange={(e) => set("priority", e.target.value)}>
          <option value="">All priorities</option>
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-mute">
          From
          <input className="rounded-lg border border-line bg-panel px-2 py-1.5 text-sm text-paper" type="date" value={filters.dueFrom} onChange={(e) => set("dueFrom", e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-sm text-mute">
          To
          <input className="rounded-lg border border-line bg-panel px-2 py-1.5 text-sm text-paper" type="date" value={filters.dueTo} onChange={(e) => set("dueTo", e.target.value)} />
        </label>
        <button className="text-sm text-copper" onClick={() => setParams({})}>
          Clear
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-panel text-xs uppercase tracking-wider text-mute">
            <tr>
              <th className="px-4 py-3">Task</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data?.tasks ?? []).map((task) => (
              <tr key={task.id} className={task.isOverdue ? "bg-overdue/5" : "odd:bg-panel/40"}>
                <td className="px-4 py-3">
                  <Link to={`/projects/${task.projectId}`} className="hover:text-copper">
                    <span className="font-mono text-mute">#{task.number}</span> {task.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-mute">{task.project?.name}</td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className={`px-4 py-3 font-mono text-xs ${task.isOverdue ? "text-overdue" : "text-mute"}`}>
                  {dueLabel(task.dueDate)}
                  {task.isOverdue ? " · Overdue" : ""}
                </td>
                <td className="px-4 py-3">
                  {user?.role === "DEVELOPER" || user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER" ? (
                    <select
                      className="rounded border border-line bg-ink px-2 py-1 text-xs"
                      value={task.status}
                      onChange={(e) => statusMut.mutate({ id: task.id, status: e.target.value as TaskStatus })}
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABEL[status]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <StatusBadge status={task.status} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
