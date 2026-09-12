import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "../lib/api";
import type { Activity, Notification, Task } from "../lib/types";
import { useAuth } from "../store/auth";
import { usePresence } from "../store/presence";

const WS = import.meta.env.VITE_WS_URL ?? "http://localhost:3001";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function useSocket(): void {
  const user = useAuth((s) => s.user);
  const queryClient = useQueryClient();
  const setPresence = usePresence((s) => s.setPresence);

  useEffect(() => {
    if (!user) {
      socket?.disconnect();
      socket = null;
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    const next = io(WS, {
      auth: { token },
      withCredentials: true,
      transports: ["websocket", "polling"],
      extraHeaders: { "ngrok-skip-browser-warning": "true" },
    });
    socket = next;

    const catchUp = () => {
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };

    next.on("connect", catchUp);
    next.on("activity:created", (activity: Activity) => {
      queryClient.setQueryData<{ activities: Activity[] }>(["activity"], (current) => {
        const list = current?.activities ?? [];
        if (list.some((row) => row.id === activity.id)) return current;
        return { activities: [activity, ...list].slice(0, 50) };
      });
    });
    next.on("task:updated", (task: Task) => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["project", task.projectId] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    });
    next.on("notification:created", (notification: Notification) => {
      queryClient.setQueryData<{ notifications: Notification[]; unread: number }>(
        ["notifications"],
        (current) => {
          const list = current?.notifications ?? [];
          if (list.some((row) => row.id === notification.id)) return current;
          return {
            notifications: [notification, ...list],
            unread: (current?.unread ?? 0) + (notification.read ? 0 : 1),
          };
        },
      );
    });
    next.on("presence:update", (payload: { onlineCount: number; onlineUserIds: string[] }) => {
      setPresence(payload.onlineCount, payload.onlineUserIds);
    });

    return () => {
      next.disconnect();
      if (socket === next) socket = null;
    };
  }, [user, queryClient, setPresence]);
}
