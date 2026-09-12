import { dueLabel, initials, STATUSES } from "../lib/format";
import type { Task, TaskStatus } from "../lib/types";
import { PriorityBadge, StatusBadge } from "./ui";

export function KanbanBoard({
  tasks,
  onStatus,
  canChange,
}: {
  tasks: Task[];
  onStatus: (task: Task, status: TaskStatus) => void;
  canChange: (task: Task) => boolean;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {STATUSES.map((status) => {
        const column = tasks.filter((task) => task.status === status);
        return (
          <section key={status} className="rounded-xl border border-line bg-panel/70 p-3">
            <header className="mb-3 flex items-center justify-between">
              <StatusBadge status={status} />
              <span className="font-mono text-xs text-mute">{column.length}</span>
            </header>
            <div className="space-y-2">
              {column.map((task) => (
                <article
                  key={task.id}
                  className={`rounded-lg border bg-ink p-3 ${task.isOverdue ? "border-overdue/50" : "border-line"}`}
                >
                  <p className="font-mono text-[11px] text-mute">#{task.number}</p>
                  <h3 className="mt-1 text-sm font-medium leading-snug">{task.title}</h3>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <PriorityBadge priority={task.priority} />
                    <span className={`font-mono text-[11px] ${task.isOverdue ? "text-overdue" : "text-mute"}`}>
                      {task.isOverdue ? "Overdue · " : ""}
                      {dueLabel(task.dueDate)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-line text-[10px]">
                      {task.assignee ? initials(task.assignee.name) : "—"}
                    </span>
                    {canChange(task) && (
                      <select
                        className="rounded border border-line bg-panel px-1 py-0.5 text-[11px]"
                        value={task.status}
                        onChange={(event) => onStatus(task, event.target.value as TaskStatus)}
                      >
                        {STATUSES.map((value) => (
                          <option key={value} value={value}>
                            {value.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
