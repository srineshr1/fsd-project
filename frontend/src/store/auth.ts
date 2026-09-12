import { create } from "zustand";
import { authApi, restoreSession, setAccessToken } from "../lib/api";
import type { User } from "../lib/types";

type AuthState = {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  ready: false,
  login: async (email, password) => {
    const result = await authApi.login(email, password);
    setAccessToken(result.accessToken);
    set({ user: result.user });
  },
  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      set({ user: null });
    }
  },
  bootstrap: async () => {
    try {
      const user = await restoreSession();
      set({ user, ready: true });
    } catch {
      setAccessToken(null);
      set({ user: null, ready: true });
    }
  },
}));
