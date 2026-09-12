import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { ActivityFeed } from "../components/ActivityFeed";
import { KanbanBoard } from "../components/KanbanBoard";
import { Button, ErrorText, Field, FormActions, Modal, inputClass, prevent } from "../components/ui";
import { useActivity } from "../hooks/useActivity";
import { ApiError, projectApi, taskApi, userApi } from "../lib/api";
import type { Task, TaskPriority, TaskStatus } from "../lib/types";
import { useAuth } from "../store/auth";

export function ProjectDetailPage() {
  const { id = "" } = useParams();
  const user = useAuth((s) => s.user);
  const queryClient = useQueryClient();
  const projectQuery = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectApi.get(id),
    enabled: Boolean(id),
  });
  const activity = useActivity();
  const users = useQuery({
    queryKey: ["users"],
    queryFn: userApi.list,
    enabled: user?.role !== "DEVELOPER",
  });
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createTask = useMutation({
    mutationFn: () =>
      projectApi.createTask(id, {
        title,
        description,
        assigneeId: assigneeId || null,
        priority,
        dueDate: new Date(dueDate).toISOString(),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["project", id] });
      setOpen(false);
    },
  });

  const statusMut = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      taskApi.updateStatus(taskId, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["project", id] }),
  });

  if (projectQuery.error instanceof ApiError && projectQuery.error.status === 403) {
    return <p className="text-overdue">You don’t have access to this project.</p>;
  }
  const project = projectQuery.data?.project;
  if (!project) return <p className="text-mute">Loading project…</p>;

  const canWrite = user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER";
  const canChange = (task: Task) => {
    if (!user) return false;
    if (user.role === "ADMIN" || user.role === "PROJECT_MANAGER") return true;
    return task.assigneeId === user.id;
  };

  const feed = (activity.data?.activities ?? []).filter((item) => item.projectId === project.id);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
      <div>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-copper">
              {project.client?.company}
            </p>
            <h1 className="text-xl font-semibold">{project.name}</h1>
            <p className="mt-1 max-w-2xl text-sm text-mute">{project.description}</p>
            <p className="mt-2 font-mono text-[11px] text-mute">Owner · {project.createdBy?.name}</p>
          </div>
          {canWrite && <Button onClick={() => setOpen(true)}>New task</Button>}
        </div>
        <KanbanBoard
          tasks={project.tasks ?? []}
          canChange={canChange}
          onStatus={(task, status) => statusMut.mutate({ taskId: task.id, status })}
        />
      </div>
      <aside className="rounded-xl border border-line bg-panel p-4">
        <p className="mb-3 text-sm font-medium">Project activity</p>
        <ActivityFeed items={feed} empty="No events on this project yet." />
      </aside>
      <Modal title="New task" open={open} onClose={() => setOpen(false)}>
        <form
          onSubmit={prevent(async () => {
            setError(null);
            try {
              await createTask.mutateAsync();
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "Could not create task");
            }
          })}
        >
          {error && <ErrorText>{error}</ErrorText>}
          <Field label="Title">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Description">
            <textarea
              className={inputClass}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </Field>
          <Field label="Assignee">
            <select className={inputClass} value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">Unassigned</option>
              {(users.data?.users ?? [])
                .filter((item) => item.role === "DEVELOPER")
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Priority">
            <select
              className={inputClass}
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </Field>
          <Field label="Due date">
            <input
              className={inputClass}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </Field>
          <FormActions onCancel={() => setOpen(false)} submitLabel="Create task" />
        </form>
      </Modal>
    </div>
  );
}
