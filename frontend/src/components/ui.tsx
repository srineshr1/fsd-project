import { clsx } from "clsx";
import type { ButtonHTMLAttributes, FormEvent, ReactNode } from "react";
import { PRIORITY_LABEL, STATUS_LABEL } from "../lib/format";
import type { TaskPriority, TaskStatus } from "../lib/types";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return clsx(parts);
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-50",
        variant === "primary" && "bg-copper text-ink hover:bg-copper-hover",
        variant === "ghost" && "border border-line bg-panel text-paper hover:border-copper/50",
        variant === "danger" && "bg-overdue/15 text-overdue hover:bg-overdue/25",
        className,
      )}
      {...props}
    />
  );
}

export const STATUS_DOT: Record<TaskStatus, string> = {
  TODO: "bg-mute",
  IN_PROGRESS: "bg-progress",
  IN_REVIEW: "bg-review",
  DONE: "bg-ok",
};

export const STATUS_TONE: Record<TaskStatus, string> = {
  TODO: "text-mute bg-line/60",
  IN_PROGRESS: "text-progress bg-progress/10",
  IN_REVIEW: "text-review bg-review/10",
  DONE: "text-ok bg-ok/10",
};

export const STATUS_TRIGGER: Record<TaskStatus, string> = {
  TODO: "border-line bg-panel text-mute",
  IN_PROGRESS: "border-progress/40 bg-progress/10 text-progress",
  IN_REVIEW: "border-review/40 bg-review/10 text-review",
  DONE: "border-ok/40 bg-ok/10 text-ok",
};

export const STATUS_OPTION: Record<TaskStatus, string> = {
  TODO: "text-mute",
  IN_PROGRESS: "text-progress",
  IN_REVIEW: "text-review",
  DONE: "text-ok",
};

export const STATUS_OPTION_ACTIVE: Record<TaskStatus, string> = {
  TODO: "bg-line/80",
  IN_PROGRESS: "bg-progress/15",
  IN_REVIEW: "bg-review/15",
  DONE: "bg-ok/15",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide",
        STATUS_TONE[status],
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const color =
    priority === "CRITICAL"
      ? "text-overdue"
      : priority === "HIGH"
        ? "text-copper"
        : priority === "MEDIUM"
          ? "text-review"
          : "text-mute";
  return (
    <span className={cn("font-mono text-[11px] uppercase tracking-wider", color)}>
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

export function Modal({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <button className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-line bg-panel p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button className="text-mute hover:text-paper" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="mb-3 block text-sm">
      <span className="mb-1.5 block text-mute">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-copper";

export function FormActions({
  onCancel,
  submitLabel,
}: {
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="mt-4 flex justify-end gap-2">
      <Button type="button" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit">{submitLabel}</Button>
    </div>
  );
}

export function prevent(handler: () => void | Promise<void>) {
  return (event: FormEvent) => {
    event.preventDefault();
    void handler();
  };
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-mute">{children}</p>;
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-sm text-overdue">{children}</p>;
}
