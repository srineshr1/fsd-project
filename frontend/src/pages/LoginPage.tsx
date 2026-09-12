import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../lib/api";
import { useAuth } from "../store/auth";
import { Button, ErrorText, Field, inputClass, prevent } from "../components/ui";

const DEMO_PASSWORD = "Password123!";

const DEMOS = [
  { key: "admin", name: "Ava Shah", role: "Admin", email: "admin@velozity.dev" },
  { key: "pm", name: "Priya Mehta", role: "PM", email: "priya@velozity.dev" },
  { key: "pm2", name: "James Okonkwo", role: "PM", email: "james@velozity.dev" },
  { key: "dev", name: "Ravi Iyer", role: "Developer", email: "ravi@velozity.dev" },
] as const;

export function LoginPage() {
  const user = useAuth((s) => s.user);
  const login = useAuth((s) => s.login);
  const [params] = useSearchParams();
  const [email, setEmail] = useState("admin@velozity.dev");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const autoStarted = useRef(false);

  async function enter(nextEmail: string, key: string) {
    setBusy(true);
    setBusyKey(key);
    setError(null);
    setEmail(nextEmail);
    setPassword(DEMO_PASSWORD);
    try {
      await login(nextEmail, DEMO_PASSWORD);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
      setBusyKey(null);
    }
  }

  useEffect(() => {
    if (autoStarted.current) return;
    const requested = params.get("demo")?.toLowerCase();
    if (!requested) return;
    const match = DEMOS.find((demo) => demo.key === requested || demo.role.toLowerCase() === requested);
    if (!match) return;
    autoStarted.current = true;
    void enter(match.email, match.key);
  }, [params]);

  async function submit() {
    setBusy(true);
    setBusyKey("form");
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
      setBusyKey(null);
    }
  }

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-block">
          <p className="text-2xl font-semibold">Velozity</p>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-copper">Ops</p>
        </Link>
        <p className="mt-2 mb-6 text-sm text-mute">
          Sign in, or jump into a seeded seat. No account to create.
        </p>

        <Button
          type="button"
          className="mb-4 w-full py-2.5"
          disabled={busy}
          onClick={() => void enter("admin@velozity.dev", "admin")}
        >
          {busyKey === "admin" ? "Opening demo…" : "Try demo as Admin"}
        </Button>

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
          <Button className="mt-2 w-full" disabled={busy} variant="ghost">
            {busyKey === "form" ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-5 mb-2 text-xs uppercase tracking-wider text-mute">Or pick a role</p>
        <div className="grid grid-cols-2 gap-2">
          {DEMOS.map((demo) => (
            <button
              key={demo.email}
              type="button"
              disabled={busy}
              className="rounded-lg border border-line bg-panel px-3 py-2 text-left hover:border-copper/40 disabled:opacity-50"
              onClick={() => void enter(demo.email, demo.key)}
            >
              <p className="text-sm">{busyKey === demo.key ? "Signing in…" : demo.name}</p>
              <p className="font-mono text-[11px] text-mute">{demo.role}</p>
            </button>
          ))}
        </div>
        <p className="mt-3 text-center font-mono text-[11px] text-mute">
          Demo password · {DEMO_PASSWORD}
        </p>
      </div>
    </div>
  );
}
