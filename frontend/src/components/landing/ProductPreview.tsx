import { cn } from "../ui";

const COLUMNS = [
  {
    label: "To Do",
    tone: "text-mute bg-line/60",
    cards: [
      { id: "12", title: "Atlas webhook schema", meta: "High · Sep 18", overdue: false },
      { id: "08", title: "Northwind invoices", meta: "Med · Sep 21", overdue: false },
    ],
  },
  {
    label: "Doing",
    tone: "text-progress bg-progress/10",
    cards: [{ id: "15", title: "Helios auth refresh", meta: "Critical · Sep 12", overdue: true }],
  },
  {
    label: "Review",
    tone: "text-review bg-review/10",
    cards: [{ id: "09", title: "Portal copy pass", meta: "Low · Sep 16", overdue: false }],
  },
  {
    label: "Done",
    tone: "text-ok bg-ok/10",
    cards: [{ id: "04", title: "Seed demo seats", meta: "Med · Sep 9", overdue: false }],
  },
] as const;

const FEED = [
  { who: "Ravi", text: "moved Helios to Doing", when: "2m" },
  { who: "Priya", text: "assigned Northwind invoices", when: "14m" },
  { who: "Cron", text: "flagged Helios overdue", when: "1h" },
] as const;

export function ProductPreview({ className }: { className?: string }) {
  return (
    <figure
      className={cn(
        "overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_40px_80px_-24px_rgb(0_0_0_/_0.65)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-overdue/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-review/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-ok/80" />
        <span className="ml-3 font-mono text-[11px] tracking-wider text-mute">velozity.ops / desk</span>
        <span className="ml-auto flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="lp-pulse absolute inline-flex h-full w-full rounded-full bg-ok" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
          </span>
          <span className="font-mono text-[11px] text-mute">4 online</span>
        </span>
      </div>
      <div className="bg-ink/70 p-3 sm:p-4">
        <div className="mb-3 grid grid-cols-4 gap-2">
          {[
            ["Projects", "3"],
            ["Overdue", "2"],
            ["Online", "4"],
            ["Open", "11"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-line bg-panel px-2 py-2 sm:px-3">
              <p className="truncate text-[10px] uppercase tracking-wider text-mute">{label}</p>
              <p className="mt-1 text-lg font-semibold sm:text-xl">{value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {COLUMNS.map((column) => (
            <div key={column.label} className="min-w-0 rounded-xl border border-line bg-panel/80 p-2">
              <div className="mb-2 flex items-center justify-between gap-1">
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap", column.tone)}>
                  {column.label}
                </span>
                <span className="font-mono text-[10px] text-mute">{column.cards.length}</span>
              </div>
              <div className="space-y-1.5">
                {column.cards.map((card) => (
                  <article
                    key={card.id}
                    className={cn(
                      "rounded-lg border bg-ink p-2",
                      card.overdue ? "border-overdue/50" : "border-line",
                    )}
                  >
                    <p className="font-mono text-[10px] text-mute">#{card.id}</p>
                    <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug">{card.title}</p>
                    <p
                      className={cn(
                        "mt-1 font-mono text-[10px] whitespace-nowrap",
                        card.overdue ? "text-overdue" : "text-mute",
                      )}
                    >
                      {card.overdue ? "Overdue" : card.meta}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 hidden gap-2 sm:grid sm:grid-cols-3">
          {FEED.map((item) => (
            <div key={item.text} className="lp-feed-item rounded-lg border border-line bg-panel px-2.5 py-2">
              <p className="truncate text-[11px] leading-snug">
                <span className="text-copper">{item.who}</span> {item.text}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-mute">{item.when} ago</p>
            </div>
          ))}
        </div>
      </div>
      <figcaption className="sr-only">
        Preview of the Velozity Ops desk with a kanban board, overdue flags, and a live activity feed.
      </figcaption>
    </figure>
  );
}
