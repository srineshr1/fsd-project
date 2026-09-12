import { Bell } from "lucide-react";
import { useState } from "react";
import { useNotifications } from "../hooks/useNotifications";
import { relativeTime } from "../lib/format";
import { Button } from "./ui";

export function NotificationBell() {
  const { data, markRead, markAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const unread = data?.unread ?? 0;
  const items = data?.notifications ?? [];

  return (
    <div className="relative">
      <button
        className="relative rounded-lg border border-line p-2 text-mute hover:text-paper"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-copper px-1 text-center font-mono text-[10px] text-ink">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-line bg-panel p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Notifications</p>
            <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => markAll.mutate()}>
              Mark all read
            </Button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && <p className="py-6 text-center text-sm text-mute">Nothing yet.</p>}
            {items.map((item) => (
              <button
                key={item.id}
                className={`mb-2 w-full rounded-lg border px-3 py-2 text-left ${
                  item.read ? "border-transparent text-mute" : "border-line bg-ink"
                }`}
                onClick={() => {
                  if (!item.read) markRead.mutate(item.id);
                }}
              >
                <p className="text-sm text-paper">{item.title}</p>
                <p className="mt-0.5 text-xs text-mute">{item.message}</p>
                <p className="mt-1 font-mono text-[10px] text-mute">{relativeTime(item.createdAt)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
