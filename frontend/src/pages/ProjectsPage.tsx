import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Field, FormActions, Modal, ErrorText, inputClass, prevent } from "../components/ui";
import { ApiError, clientApi, projectApi } from "../lib/api";
import { useAuth } from "../store/auth";

export function ProjectsPage() {
  const user = useAuth((s) => s.user);
  const canCreate = user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER";
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["projects"], queryFn: projectApi.list });
  const clients = useQuery({
    queryKey: ["clients"],
    queryFn: clientApi.list,
    enabled: canCreate,
  });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: projectApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
      setName("");
      setDescription("");
    },
  });

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Projects</h1>
          <p className="text-sm text-mute">Scoped to what your role can see.</p>
        </div>
        {canCreate && <Button onClick={() => setOpen(true)}>New project</Button>}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {(data?.projects ?? []).map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="rounded-xl border border-line bg-panel p-4 hover:border-copper/40"
          >
            <p className="font-medium">{project.name}</p>
            <p className="mt-1 line-clamp-2 text-sm text-mute">{project.description}</p>
            <p className="mt-3 font-mono text-[11px] text-mute">
              {project.client?.company ?? "Client"} · {project.createdBy?.name ?? "Owner"}
              {project.taskCount != null ? ` · ${project.taskCount} tasks` : ""}
            </p>
          </Link>
        ))}
      </div>
      <Modal title="New project" open={open} onClose={() => setOpen(false)}>
        <form
          onSubmit={prevent(async () => {
            setError(null);
            try {
              await create.mutateAsync({ name, description, clientId });
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "Could not create project");
            }
          })}
        >
          {error && <ErrorText>{error}</ErrorText>}
          <Field label="Name">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
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
          <Field label="Client">
            <select
              className={inputClass}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            >
              <option value="">Select a client</option>
              {(clients.data?.clients ?? []).map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company}
                </option>
              ))}
            </select>
          </Field>
          <FormActions onCancel={() => setOpen(false)} submitLabel="Create" />
        </form>
      </Modal>
    </div>
  );
}
