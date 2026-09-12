import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTaskStatusChange } from "../hooks/useTaskStatusChange";
import { STATUS_LABEL, STATUSES } from "../lib/format";
import type { Task, TaskStatus } from "../lib/types";
import { cn, STATUS_DOT, STATUS_OPTION, STATUS_OPTION_ACTIVE, STATUS_TRIGGER } from "./ui";

export function StatusSelect({ task, disabled }: { task: Task; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<TaskStatus | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const mutation = useTaskStatusChange();
  const locked = disabled || mutation.isPending;

  useEffect(() => {
    if (!open && !pending) return;
    const onDoc = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setPending(null);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      setPending(null);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, pending]);

  return (
    <div ref={wrapRef} className="relative" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        disabled={locked}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        className={cn(
          "inline-flex max-w-[10.5rem] items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition disabled:opacity-50",
          STATUS_TRIGGER[task.status],
        )}
        onClick={() => {
          setPending(null);
          setOpen((value) => !value);
        }}
      >
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[task.status])} />
        <span className="truncate">{STATUS_LABEL[task.status]}</span>
        <ChevronDown size={12} className={cn("ml-0.5 shrink-0 opacity-70", open && "rotate-180")} />
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Task status"
          className="absolute right-0 z-30 mt-1 min-w-[11rem] overflow-hidden rounded-lg border border-line bg-panel py-1 shadow-[0_16px_40px_-16px_rgb(0_0_0_/_0.7)]"
        >
          {STATUSES.map((status) => {
            const selected = status === task.status;
            return (
              <li key={status} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={cn(
                    "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium",
                    STATUS_OPTION[status],
                    selected ? STATUS_OPTION_ACTIVE[status] : "hover:bg-ink",
                  )}
                  onClick={() => {
                    setOpen(false);
                    if (status !== task.status) setPending(status);
                  }}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
                  {STATUS_LABEL[status]}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      {pending ? (
        <div className="absolute right-0 z-40 mt-1 w-52 rounded-lg border border-line bg-panel p-2 shadow-xl">
          <p className="text-xs leading-snug text-paper">
            Move #{task.number} to{" "}
            <span className={cn("font-medium", STATUS_OPTION[pending])}>{STATUS_LABEL[pending]}</span>?
          </p>
          <div className="mt-2 flex justify-end gap-1">
            <button
              type="button"
              className="rounded px-2 py-1 text-[11px] text-mute hover:text-paper"
              onClick={() => setPending(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded bg-copper px-2 py-1 text-[11px] font-medium text-ink"
              onClick={() => {
                mutation.mutate({ task, status: pending });
                setPending(null);
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
