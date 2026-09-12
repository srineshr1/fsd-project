import { relativeTime } from "../lib/format";
import type { Activity } from "../lib/types";
import { Empty } from "./ui";

export function ActivityFeed({
  items,
  empty = "No activity yet.",
}: {
  items: Activity[];
  empty?: string;
}) {
  if (items.length === 0) return <Empty>{empty}</Empty>;
  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="border-b border-line/70 pb-3 last:border-0">
          <p className="text-sm leading-snug text-paper">{item.message}</p>
          <p className="mt-1 font-mono text-[11px] text-mute">
            {item.project?.name ? `${item.project.name} · ` : ""}
            {relativeTime(item.createdAt)}
          </p>
        </li>
      ))}
    </ol>
  );
}
