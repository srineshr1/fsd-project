import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button, ErrorText, Field, FormActions, Modal, inputClass, prevent } from "../components/ui";
import { ApiError, userApi } from "../lib/api";
import { ROLE_LABEL } from "../lib/format";
import type { Role } from "../lib/types";
import { useAuth } from "../store/auth";

export function UsersPage() {
  const user = useAuth((s) => s.user);
  const queryClient = useQueryClient();
  const { data, error } = useQuery({ queryKey: ["users"], queryFn: userApi.list });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password123!");
  const [role, setRole] = useState<Role>("DEVELOPER");
  const [formError, setFormError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: userApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
    },
  });

  if (user?.role !== "ADMIN") {
    return <p className="text-overdue">Only admins can manage users.</p>;
  }
  if (error instanceof ApiError && error.status === 403) {
    return <p className="text-overdue">You don’t have access to users.</p>;
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Users</h1>
        <Button onClick={() => setOpen(true)}>New user</Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-panel text-xs uppercase tracking-wider text-mute">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {(data?.users ?? []).map((item) => (
              <tr key={item.id} className="odd:bg-panel/40">
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-mute">{item.email}</td>
                <td className="px-4 py-3 text-mute">{ROLE_LABEL[item.role]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal title="New user" open={open} onClose={() => setOpen(false)}>
        <form
          onSubmit={prevent(async () => {
            setFormError(null);
            try {
              await create.mutateAsync({ name, email, password, role });
            } catch (err) {
              setFormError(err instanceof ApiError ? err.message : "Could not create user");
            }
          })}
        >
          {formError && <ErrorText>{formError}</ErrorText>}
          <Field label="Name">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Email">
            <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Password">
            <input className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          <Field label="Role">
            <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="ADMIN">Admin</option>
              <option value="PROJECT_MANAGER">Project Manager</option>
              <option value="DEVELOPER">Developer</option>
            </select>
          </Field>
          <FormActions onCancel={() => setOpen(false)} submitLabel="Create" />
        </form>
      </Modal>
    </div>
  );
}
