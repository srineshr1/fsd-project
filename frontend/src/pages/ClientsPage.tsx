import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button, ErrorText, Field, FormActions, Modal, inputClass, prevent } from "../components/ui";
import { ApiError, clientApi } from "../lib/api";
import { useAuth } from "../store/auth";

export function ClientsPage() {
  const user = useAuth((s) => s.user);
  const queryClient = useQueryClient();
  const { data, error } = useQuery({ queryKey: ["clients"], queryFn: clientApi.list });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: clientApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clients"] });
      setOpen(false);
    },
  });

  if (user?.role !== "ADMIN") {
    return <p className="text-overdue">Only admins can manage clients.</p>;
  }
  if (error instanceof ApiError && error.status === 403) {
    return <p className="text-overdue">You don’t have access to clients.</p>;
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clients</h1>
        <Button onClick={() => setOpen(true)}>New client</Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-panel text-xs uppercase tracking-wider text-mute">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Email</th>
            </tr>
          </thead>
          <tbody>
            {(data?.clients ?? []).map((client) => (
              <tr key={client.id} className="odd:bg-panel/40">
                <td className="px-4 py-3">{client.company}</td>
                <td className="px-4 py-3 text-mute">{client.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-mute">{client.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal title="New client" open={open} onClose={() => setOpen(false)}>
        <form
          onSubmit={prevent(async () => {
            setFormError(null);
            try {
              await create.mutateAsync({ name, company, email });
            } catch (err) {
              setFormError(err instanceof ApiError ? err.message : "Could not create client");
            }
          })}
        >
          {formError && <ErrorText>{formError}</ErrorText>}
          <Field label="Company">
            <input className={inputClass} value={company} onChange={(e) => setCompany(e.target.value)} required />
          </Field>
          <Field label="Contact name">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Email">
            <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <FormActions onCancel={() => setOpen(false)} submitLabel="Create" />
        </form>
      </Modal>
    </div>
  );
}
