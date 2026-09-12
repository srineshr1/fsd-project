import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { useSocket } from "./hooks/useSocket";
import { ClientsPage } from "./pages/ClientsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { TasksPage } from "./pages/TasksPage";
import { UsersPage } from "./pages/UsersPage";
import { useAuth } from "./store/auth";

function Protected({ children }: { children: ReactNode }) {
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-mute">
        Restoring session…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  useSocket();
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Route>
      <Route path="*" element={<Fallback />} />
    </Routes>
  );
}

function Fallback() {
  const user = useAuth((s) => s.user);
  return <Navigate to={user ? "/dashboard" : "/"} replace />;
}
