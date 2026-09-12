import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, taskApi } from "../lib/api";
import { STATUS_LABEL } from "../lib/format";
import { applyTaskToCaches } from "../lib/taskCache";
import type { Task, TaskStatus } from "../lib/types";
import { useToast } from "../store/toast";

export function useTaskStatusChange() {
  const queryClient = useQueryClient();
  const push = useToast((s) => s.push);

  return useMutation({
    mutationFn: ({ task, status }: { task: Task; status: TaskStatus }) =>
      taskApi.updateStatus(task.id, status),
    onSuccess: ({ task }, vars) => {
      applyTaskToCaches(queryClient, task);
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["project", task.projectId] });
      push(`Task #${task.number} moved to ${STATUS_LABEL[vars.status]}`);
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : "Could not update task status";
      push(message, "error");
    },
  });
}
