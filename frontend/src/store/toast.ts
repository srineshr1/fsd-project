import { create } from "zustand";

type Toast = { id: number; message: string; tone: "ok" | "error" };

type ToastState = {
  items: Toast[];
  push: (message: string, tone?: Toast["tone"]) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;

export const useToast = create<ToastState>((set) => ({
  items: [],
  push: (message, tone = "ok") => {
    const id = nextId++;
    set((state) => ({ items: [...state.items, { id, message, tone }].slice(-4) }));
    window.setTimeout(() => {
      set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
    }, 3200);
  },
  dismiss: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
}));
