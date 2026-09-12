import { useToast } from "../store/toast";
import { cn } from "./ui";

export function ToastHost() {
  const items = useToast((s) => s.items);
  const dismiss = useToast((s) => s.dismiss);
  if (items.length === 0) return null;
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-72 flex-col gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={cn(
            "pointer-events-auto rounded-lg border px-3 py-2 text-left text-sm shadow-lg",
            item.tone === "error"
              ? "border-overdue/40 bg-panel text-overdue"
              : "border-line bg-panel text-paper",
          )}
          onClick={() => dismiss(item.id)}
        >
          {item.message}
        </button>
      ))}
    </div>
  );
}
