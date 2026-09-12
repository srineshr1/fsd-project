import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTaskStatusChange } from "../hooks/useTaskStatusChange";
import { STATUS_LABEL, STATUSES } from "../lib/format";
import type { Task, TaskStatus } from "../lib/types";

export function StatusSelect({ task, disabled }: { task: Task; disabled?: boolean }) {
  const [pending, setPending] = useState<TaskStatus | null>(null);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const mutation = useTaskStatusChange();

  useEffect(() => {
    if (!pending) return;
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (popRef.current?.contains(target) || selectRef.current?.contains(target)) return;
      setPending(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [pending]);

  return (
    <div className="relative" onClick={(event) => event.stopPropagation()}>
      <select
        ref={selectRef}
        className="max-w-[9.5rem] rounded border border-line bg-panel px-2 py-1 text-xs text-paper"
        value={task.status}
        disabled={disabled || mutation.isPending}
        onChange={(event) => {
          const next = event.target.value as TaskStatus;
          if (next === task.status) return;
          const box = event.currentTarget.getBoundingClientRect();
          setAnchor({ top: box.bottom + 6, left: Math.max(8, box.right - 192) });
          setPending(next);
        }}
      >
        {STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABEL[status]}
          </option>
        ))}
      </select>
      {pending &&
        anchor &&
        createPortal(
          <div
            ref={popRef}
            className="fixed z-[80] w-48 rounded-lg border border-line bg-panel p-2 shadow-xl"
            style={{ top: anchor.top, left: anchor.left }}
          >
            <p className="text-xs leading-snug text-paper">
              Move #{task.number} to <span className="font-medium">{STATUS_LABEL[pending]}</span>?
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
          </div>,
          document.body,
        )}
    </div>
  );
}
