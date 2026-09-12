import type { QueryClient } from "@tanstack/react-query";
import type { Project, Task } from "./types";

type ProjectPayload = { project: Project };
type TasksPayload = { tasks: Task[] };

export function applyTaskToCaches(queryClient: QueryClient, task: Task): void {
  queryClient.setQueriesData<ProjectPayload>({ queryKey: ["project", task.projectId] }, (current) => {
    if (!current?.project?.tasks) return current;
    const exists = current.project.tasks.some((row) => row.id === task.id);
    return {
      project: {
        ...current.project,
        tasks: exists
          ? current.project.tasks.map((row) => (row.id === task.id ? task : row))
          : [...current.project.tasks, task],
      },
    };
  });

  queryClient.setQueriesData<TasksPayload>({ queryKey: ["tasks"] }, (current) => {
    if (!current?.tasks) return current;
    return {
      tasks: current.tasks.map((row) => (row.id === task.id ? task : row)),
    };
  });

  queryClient.setQueriesData<{ dashboard: { role: string; tasks?: Task[] } }>(
    { queryKey: ["dashboard"] },
    (current) => {
      if (!current?.dashboard?.tasks) return current;
      return {
        dashboard: {
          ...current.dashboard,
          tasks: current.dashboard.tasks.map((row) => (row.id === task.id ? task : row)),
        },
      };
    },
  );
}
