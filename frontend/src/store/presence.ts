import { create } from "zustand";

type PresenceState = {
  onlineCount: number;
  onlineUserIds: string[];
  setPresence: (onlineCount: number, onlineUserIds: string[]) => void;
};

export const usePresence = create<PresenceState>((set) => ({
  onlineCount: 0,
  onlineUserIds: [],
  setPresence: (onlineCount, onlineUserIds) => set({ onlineCount, onlineUserIds }),
}));
