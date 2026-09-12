import {
  AlertTriangle,
  ArrowRightLeft,
  Flag,
  Pencil,
  Plus,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { relativeTime } from "../lib/format";
import type { Activity, ActivityType } from "../lib/types";
import { cn, Empty, STATUS_TONE, StatusBadge } from "./ui";

const TYPE_TONE: Record<ActivityType, { icon: LucideIcon; wrap: string }> = {
  TASK_CREATED: { icon: Plus, wrap: "bg-copper/15 text-copper" },
  STATUS_CHANGED: { icon: ArrowRightLeft, wrap: "bg-progress/15 text-progress" },
  TASK_OVERDUE: { icon: AlertTriangle, wrap: "bg-overdue/15 text-overdue" },
  ASSIGNEE_CHANGED: { icon: UserRound, wrap: "bg-progress/15 text-progress" },
  PRIORITY_CHANGED: { icon: Flag, wrap: "bg-review/15 text-review" },
  TASK_UPDATED: { icon: Pencil, wrap: "bg-line text-mute" },
};

function toneFor(item: Activity) {
  if (item.type === "STATUS_CHANGED" && item.toStatus) {
    return { icon: ArrowRightLeft, wrap: STATUS_TONE[item.toStatus] };
  }
  return TYPE_TONE[item.type];
}

function messageWithoutActor(message: string, actor: string | undefined): string {
  if (!actor) return message;
  if (message.startsWith(actor)) return message.slice(actor.length).trimStart();
  return message;
}

export function ActivityFeed({
  items,
  empty = "No activity yet.",
}: {
  items: Activity[];
  empty?: string;
}) {
  if (items.length === 0) return <Empty>{empty}</Empty>;
  return (
    <ol className="relative space-y-0">
      <span aria-hidden className="absolute top-3 bottom-3 left-[13px] w-px bg-line" />
      {items.map((item) => (
        <ActivityRow key={item.id} item={item} />
      ))}
    </ol>
  );
}

function ActivityRow({ item }: { item: Activity }) {
  const tone = toneFor(item);
  const Icon = tone.icon;
  const actor = item.actor?.name;
  const actorLeads = Boolean(actor && item.message.startsWith(actor));

  return (
    <li className="relative flex gap-3 py-3 first:pt-0 last:pb-0">
      <span
        className={cn(
          "relative z-10 mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full ring-2 ring-panel",
          tone.wrap,
        )}
      >
        <Icon size={12} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug text-paper/95">
          {actorLeads ? <span className="font-medium text-copper">{actor} </span> : null}
          {messageWithoutActor(item.message, actorLeads ? actor : undefined)}
        </p>
        {item.fromStatus || item.toStatus ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {item.fromStatus ? <StatusBadge status={item.fromStatus} /> : null}
            {item.fromStatus && item.toStatus ? (
              <span className="font-mono text-[10px] text-mute">→</span>
            ) : null}
            {item.toStatus ? <StatusBadge status={item.toStatus} /> : null}
          </div>
        ) : item.type === "TASK_OVERDUE" ? (
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-overdue">Overdue</p>
        ) : null}
        <p className="mt-1 font-mono text-[11px] text-mute">
          {item.project?.name ? `${item.project.name} · ` : ""}
          {relativeTime(item.createdAt)}
        </p>
      </div>
    </li>
  );
}
