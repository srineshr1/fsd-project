import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Clock,
  FolderKanban,
  Lock,
  Menu,
  Radio,
  ShieldCheck,
  X,
} from "lucide-react";
import { ProductPreview } from "../components/landing/ProductPreview";
import { Reveal } from "../components/landing/Reveal";
import { cn } from "../components/ui";
import { useAuth } from "../store/auth";

const NAV = [
  { href: "#product", label: "Product" },
  { href: "#roles", label: "Roles" },
  { href: "#security", label: "Security" },
] as const;

const MARQUEE = [
  "Clients",
  "Projects",
  "Kanban",
  "Live feed",
  "Overdue flags",
  "HttpOnly refresh",
  "Role-scoped rooms",
  "Presence",
  "Northwind",
  "Helios",
  "Atlas Tracking API",
];

const FEATURES = [
  {
    icon: ShieldCheck,
    kicker: "01",
    title: "Scoped by construction",
    body: "Admin sees the studio. A PM sees only the projects they opened. A developer sees assigned tasks — and can change status, nothing else. Every request reloads the user from Postgres.",
  },
  {
    icon: Radio,
    kicker: "02",
    title: "A feed that is stored, not derived",
    body: "Status changes write an Activity row first, then emit to Socket.IO rooms bound at connect time. Missed events catch up from the database, not a memory buffer.",
  },
  {
    icon: Clock,
    kicker: "03",
    title: "Overdue is a column",
    body: "A minute cron flips isOverdue on the server and writes TASK_OVERDUE. The UI never computes lateness on page load.",
  },
  {
    icon: Bell,
    kicker: "04",
    title: "Signals, without polling",
    body: "Assigned work and In Review both land as persisted notifications. Admins get a live presence count of who is on the desk.",
  },
] as const;

const ROLES = [
  {
    role: "Admin",
    email: "admin@velozity.dev",
    accent: "text-copper",
    rule: "The whole studio",
    points: ["Every client, project, and task", "Global activity feed", "Users online, user admin"],
  },
  {
    role: "Project Manager",
    email: "priya@velozity.dev",
    accent: "text-progress",
    rule: "Projects they created",
    points: ["Read clients and developers", "Tasks on their own projects", "Feed scoped to those projects"],
  },
  {
    role: "Developer",
    email: "ravi@velozity.dev",
    accent: "text-ok",
    rule: "Assigned work only",
    points: ["No client directory", "Status changes, not edits", "Feed of their tasks alone"],
  },
] as const;

const STEPS = [
  {
    n: "01",
    title: "Sign in as a seat",
    body: "Access JWT lives in memory for 15 minutes. Refresh is an opaque secret in an HttpOnly cookie, rotated on every use.",
  },
  {
    n: "02",
    title: "The API draws the map",
    body: "Role-scoped Prisma queries sit behind every list. A modified token cannot escalate — HMAC-signed, user reloaded by sub.",
  },
  {
    n: "03",
    title: "Write, then broadcast",
    body: "Activity is stored, then fanned out to feed:admin, feed:pm:{id}, feed:dev:{id}, and the open project room.",
  },
  {
    n: "04",
    title: "Catch up from Postgres",
    body: "Reconnect calls GET /api/activity?limit=20. The last twenty rows the caller is allowed to see — not a ring buffer.",
  },
] as const;

export function LandingPage() {
  const user = useAuth((s) => s.user);
  const deskTo = user ? "/dashboard" : "/login?demo=admin";
  const deskLabel = user ? "Open desk" : "Try demo";

  return (
    <div className="lp-grid relative bg-ink text-paper">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(ellipse_at_70%_0%,rgba(208,140,74,0.16),transparent_58%)]"
      />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-copper focus:px-3 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>
      <ScrollProgress />
      <LandingNav deskTo={deskTo} deskLabel={deskLabel} />

      <main id="main">
        <Hero deskTo={deskTo} deskLabel={deskLabel} />
        <Marquee />
        <Problem />
        <Features />
        <Product />
        <Roles />
        <Security />
        <Cta deskTo={deskTo} deskLabel={deskLabel} />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Velozity</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-copper">Ops</p>
          </div>
          <p className="max-w-sm text-xs leading-relaxed text-mute">
            Internal agency desk. Authorization lives in Fastify, not in the React tree.
          </p>
        </div>
      </footer>
    </div>
  );
}

function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const p = max > 0 ? doc.scrollTop / max : 0;
      el.style.transform = `scaleX(${p})`;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed top-0 right-0 left-0 z-50 h-[2px] bg-line/60"
      aria-hidden
    >
      <div ref={ref} className="lp-progress h-full bg-copper" />
    </div>
  );
}

function LandingNav({ deskTo, deskLabel }: { deskTo: string; deskLabel: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors duration-300",
        scrolled ? "border-line bg-ink/80 backdrop-blur-md" : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#main" className="leading-tight">
          <p className="text-[15px] font-semibold tracking-tight">Velozity</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-copper">Ops</p>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-mute md:flex" aria-label="Landing">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="transition-colors hover:text-paper">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className="text-sm text-mute transition-colors hover:text-paper">
            Sign in with email
          </Link>
          <Link
            to={deskTo}
            className="inline-flex items-center gap-2 rounded-lg bg-copper px-3.5 py-2 text-sm font-medium text-ink hover:bg-copper-hover"
          >
            {deskLabel}
            <ArrowRight size={14} />
          </Link>
        </div>
        <button
          type="button"
          className="rounded-lg border border-line p-2 text-mute hover:text-paper md:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-line bg-ink px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm" aria-label="Mobile">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-mute hover:text-paper"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Link to="/login" className="text-mute hover:text-paper" onClick={() => setOpen(false)}>
              Sign in with email
            </Link>
            <Link
              to={deskTo}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-copper px-3.5 py-2 text-sm font-medium text-ink"
              onClick={() => setOpen(false)}
            >
              {deskLabel}
              <ArrowRight size={14} />
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function Hero({ deskTo, deskLabel }: { deskTo: string; deskLabel: string }) {
  return (
    <section className="relative mx-auto max-w-6xl overflow-x-clip px-6 pt-16 pb-20 lg:min-h-[calc(100svh-72px)] lg:pt-24">
      <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div>
          <p className="lp-enter font-mono text-[11px] uppercase tracking-[0.28em] text-copper">
            Internal agency desk
          </p>
          <h1 className="lp-enter lp-enter-2 mt-5 font-serif text-5xl leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Run the studio.
            <br />
            <span className="text-copper italic">Leak nothing.</span>
          </h1>
          <p className="lp-enter lp-enter-3 mt-6 max-w-md text-base leading-relaxed text-mute text-pretty">
            Clients, projects, tasks, and a live feed — scoped in the API so a developer cannot
            read another person&apos;s board even by calling the endpoint directly.
          </p>
          <div className="lp-enter lp-enter-4 mt-8 flex flex-wrap items-center gap-3">
            <Link
              to={deskTo}
              className="inline-flex items-center gap-2 rounded-lg bg-copper px-4 py-2.5 text-sm font-medium text-ink hover:bg-copper-hover"
            >
              {deskLabel}
              <ArrowRight size={16} />
            </Link>
            <a
              href="#product"
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-4 py-2.5 text-sm hover:border-copper/50"
            >
              See the board
            </a>
          </div>
          <dl className="lp-enter lp-enter-5 mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-6">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-mute">Seats</dt>
              <dd className="mt-1 text-lg">Three roles</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-mute">Feed</dt>
              <dd className="mt-1 text-lg">Socket.IO</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-mute">Overdue</dt>
              <dd className="mt-1 text-lg">Server cron</dd>
            </div>
          </dl>
        </div>
        <div className="lp-enter lp-enter-4 relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-10 bg-[radial-gradient(ellipse_at_center,rgba(208,140,74,0.16),transparent_70%)]"
          />
          <div className="lp-stage is-in relative">
            <ProductPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const items = [...MARQUEE, ...MARQUEE];
  return (
    <div className="border-y border-line bg-panel/40 py-4" aria-hidden>
      <div className="overflow-hidden">
        <div className="lp-marquee-track flex w-max gap-10 pr-10">
          {items.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="font-mono text-[11px] uppercase tracking-[0.28em] text-mute"
            >
              {item}
              <span className="ml-10 text-copper/70">/</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Problem() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-copper">The brief</p>
          <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight text-balance sm:text-5xl">
            Most desks leak the moment someone opens DevTools.
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <p className="max-w-xl text-base leading-relaxed text-mute">
            Hiding a nav item is not authorization. Velozity Ops checks a signed JWT, then applies
            a role-scoped query, so Priya&apos;s Northwind board never appears on James&apos;s
            session — including via a crafted request. The React app is a view. Fastify is the
            lock.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="border-y border-line bg-panel/30 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-copper">Capabilities</p>
          <h2 className="mt-4 max-w-xl font-serif text-4xl tracking-tight">
            Built for a small studio that cannot afford a messy ACL.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 80}>
              <article className="h-full rounded-2xl border border-line bg-ink/50 p-6 transition-colors hover:border-copper/35">
                <div className="mb-8 flex items-center justify-between">
                  <feature.icon size={18} className="text-copper" />
                  <span className="font-mono text-[11px] text-mute">{feature.kicker}</span>
                </div>
                <h3 className="text-lg font-medium">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{feature.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Product() {
  return (
    <section id="product" className="scroll-mt-24 overflow-x-clip py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <Reveal variant="left">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-copper">The board</p>
            <h2 className="mt-4 font-serif text-4xl tracking-tight">
              Kanban, overdue, and a feed that agrees with Postgres.
            </h2>
            <ul className="mt-8 space-y-5">
              <li className="flex gap-3">
                <FolderKanban size={16} className="mt-1 shrink-0 text-copper" />
                <span className="text-sm leading-relaxed text-mute">
                  Four columns per project. Developers change status only. Critical work and due
                  dates sit on the card, not in a tooltip.
                </span>
              </li>
              <li className="flex gap-3">
                <Clock size={16} className="mt-1 shrink-0 text-overdue" />
                <span className="text-sm leading-relaxed text-mute">
                  Overdue is painted from a column the cron owns. If the flag is on, the card
                  already knows.
                </span>
              </li>
              <li className="flex gap-3">
                <Radio size={16} className="mt-1 shrink-0 text-progress" />
                <span className="text-sm leading-relaxed text-mute">
                  The strip under the board is the same Activity table used for catch-up after a
                  dropped socket.
                </span>
              </li>
            </ul>
          </Reveal>
          <Reveal variant="scale" delay={100}>
            <div className="lp-stage">
              <ProductPreview />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Roles() {
  return (
    <section id="roles" className="scroll-mt-24 border-y border-line bg-panel/30 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-copper">Seats</p>
          <h2 className="mt-4 max-w-lg font-serif text-4xl tracking-tight">
            Three seats. Logging in as James must not show Priya&apos;s work.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {ROLES.map((seat, index) => (
            <Reveal key={seat.role} delay={index * 90}>
              <article className="flex h-full flex-col rounded-2xl border border-line bg-ink/60 p-6">
                <p className={cn("font-mono text-[11px] uppercase tracking-[0.22em]", seat.accent)}>
                  {seat.role}
                </p>
                <h3 className="mt-4 font-serif text-2xl leading-snug">{seat.rule}</h3>
                <ul className="mt-6 flex-1 space-y-2 text-sm text-mute">
                  {seat.points.map((point) => (
                    <li key={point} className="border-t border-line/80 pt-2">
                      {point}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 font-mono text-[11px] text-mute">{seat.email}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Security() {
  return (
    <section id="security" className="scroll-mt-24 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-copper">How it holds</p>
            <h2 className="mt-4 font-serif text-4xl tracking-tight">
              Tokens in RAM. Refresh in a cookie. Rooms named after the scope.
            </h2>
            <ol className="mt-10 space-y-8">
              {STEPS.map((step) => (
                <li key={step.n} className="grid grid-cols-[56px_1fr] gap-4">
                  <span className="font-mono text-sm text-copper">{step.n}</span>
                  <div>
                    <h3 className="text-base font-medium">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-mute">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal variant="right" delay={120}>
            <div className="rounded-2xl border border-line bg-panel p-5 text-mute sm:p-6">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-copper">Architecture</p>
              <ol className="space-y-2 font-mono text-[12px]">
                {[
                  ["Client", "React SPA · memory JWT"],
                  ["API", "Fastify · cookie refresh"],
                  ["Realtime", "Socket.IO scoped rooms"],
                  ["Data", "Postgres · Prisma · cron"],
                ].map(([layer, detail]) => (
                  <li
                    key={layer}
                    className="flex items-baseline justify-between gap-4 rounded-lg border border-line bg-ink px-3 py-2.5"
                  >
                    <span className="text-[10px] uppercase tracking-wider text-copper">{layer}</span>
                    <span className="text-right text-paper">{detail}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-ink p-4">
                  <Lock size={14} className="text-copper" />
                  <p className="mt-3 text-sm text-paper">Access JWT · 15 min</p>
                  <p className="mt-1 text-[11px]">Never localStorage. Memory only.</p>
                </div>
                <div className="rounded-xl border border-line bg-ink p-4">
                  <ShieldCheck size={14} className="text-copper" />
                  <p className="mt-3 text-sm text-paper">Refresh · HttpOnly</p>
                  <p className="mt-1 text-[11px]">SHA-256 in Postgres, rotated.</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Cta({ deskTo, deskLabel }: { deskTo: string; deskLabel: string }) {
  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Reveal variant="scale">
          <div className="relative overflow-hidden rounded-3xl border border-line bg-panel px-8 py-14 sm:px-14">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(208,140,74,0.18),transparent_55%)]"
            />
            <div className="relative max-w-2xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-copper">
                Seeded desk
              </p>
              <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
                Sit in a seat. Password is the same for every human user.
              </h2>
              <p className="mt-4 text-sm text-mute">
                <span className="font-mono text-paper">Password123!</span>
                {" · "}
                admin@velozity.dev · priya@velozity.dev · ravi@velozity.dev
              </p>
              <Link
                to={deskTo}
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-copper px-4 py-2.5 text-sm font-medium text-ink hover:bg-copper-hover"
              >
                {deskLabel}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
