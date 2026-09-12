import {
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Users,
  Building2,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { ROLE_LABEL } from "../lib/format";
import type { Role } from "../lib/types";
import { useAuth } from "../store/auth";
import { NotificationBell } from "./NotificationBell";
import { cn } from "./ui";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "PROJECT_MANAGER", "DEVELOPER"] },
  { to: "/projects", label: "Projects", icon: FolderKanban, roles: ["ADMIN", "PROJECT_MANAGER", "DEVELOPER"] },
  { to: "/tasks", label: "Tasks", icon: ListTodo, roles: ["ADMIN", "PROJECT_MANAGER", "DEVELOPER"] },
  { to: "/clients", label: "Clients", icon: Building2, roles: ["ADMIN"] },
  { to: "/users", label: "Users", icon: Users, roles: ["ADMIN"] },
] satisfies ReadonlyArray<{
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}>;

export function AppShell() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-ink">
      <aside className="flex w-[232px] shrink-0 flex-col border-r border-line bg-panel">
        <div className="border-b border-line px-5 py-5">
          <p className="text-lg font-semibold tracking-tight">Velozity</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-copper">Ops</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.filter((item) => (item.roles as Role[]).includes(user.role)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-mute hover:bg-ink hover:text-paper",
                  isActive && "bg-ink text-paper",
                )
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line p-4 text-xs text-mute">
          Internal agency desk
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line px-6 py-3">
          <p className="text-sm text-mute">Client project desk</p>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="text-right">
              <p className="text-sm">{user.name}</p>
              <p className="font-mono text-[11px] text-mute">{ROLE_LABEL[user.role]}</p>
            </div>
            <button
              className="rounded-lg border border-line p-2 text-mute hover:text-paper"
              onClick={() => void logout()}
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
