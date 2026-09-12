import { useState } from "react";
import { Navigate } from "react-router-dom";
import { ApiError } from "../lib/api";
import { useAuth } from "../store/auth";
import { Button, ErrorText, Field, inputClass, prevent } from "../components/ui";

const DEMOS = [
  { name: "Ava Shah", role: "Admin", email: "admin@velozity.dev" },
  { name: "Priya Mehta", role: "PM", email: "priya@velozity.dev" },
  { name: "James Okonkwo", role: "PM", email: "james@velozity.dev" },
  { name: "Ravi Iyer", role: "Developer", email: "ravi@velozity.dev" },
];

export function LoginPage() {
  const user = useAuth((s) => s.user);
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState("admin@velozity.dev");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink p-6">
      <div className="w-full max-w-md">
        <p className="text-2xl font-semibold">Velozity</p>
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-copper">Ops</p>
        <p className="mt-2 mb-6 text-sm text-mute">Sign in to the agency project desk.</p>
        <form className="rounded-xl border border-line bg-panel p-5" onSubmit={prevent(submit)}>
          {error && <ErrorText>{error}</ErrorText>}
          <Field label="Email">
            <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <input
              className={inputClass}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Button className="mt-2 w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {DEMOS.map((demo) => (
            <button
              key={demo.email}
              className="rounded-lg border border-line bg-panel px-3 py-2 text-left hover:border-copper/40"
              onClick={() => {
                setEmail(demo.email);
                setPassword("Password123!");
              }}
            >
              <p className="text-sm">{demo.name}</p>
              <p className="font-mono text-[11px] text-mute">{demo.role}</p>
            </button>
          ))}
        </div>
        <p className="mt-3 text-center font-mono text-[11px] text-mute">Password for demos: Password123!</p>
      </div>
    </div>
  );
}
