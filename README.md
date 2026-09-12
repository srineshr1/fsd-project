# Velozity Ops

Internal project dashboard for a small agency: clients, projects, tasks, role-based access, and a live activity feed.

This is a full-stack TypeScript app. The API never trusts the frontend for authorization — every protected route checks the signed JWT, then applies a role-scoped query so a developer cannot read another person's tasks even by calling the endpoint directly.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | React + TypeScript + Vite | Required. Vite keeps the SPA fast; TypeScript is enforced across the UI. |
| Backend | **Fastify** 5 + TypeScript | Plugin encapsulation and first-class TypeScript types. Express would work; Fastify made auth/RBAC plugins cleaner. |
| Database | PostgreSQL 16 | Required. Relational data with real foreign keys. |
| ORM | **Prisma** | Typed queries, migrations, and a seed runner. No raw SQL in route handlers. |
| Realtime | **Socket.IO** | Rooms (`feed:admin`, `feed:pm:{id}`, `feed:dev:{id}`, `project:{id}`, `user:{id}`) map 1:1 onto the role-filtered feed. Automatic reconnect plus an explicit DB catch-up on connect. Native WebSockets would mean re-implementing rooms, heartbeats, and the auth handshake. |
| Jobs | **node-cron** | Overdue flagging is a periodic `UPDATE`, not a fan-out of jobs. Bull would add Redis for no gain here. Cron runs every minute inside the API process. |
| Tokens | Access JWT (memory) + opaque refresh (HttpOnly cookie) | Access token lives 15 minutes in RAM, never `localStorage`. Refresh token is a random 48-byte secret, stored as SHA-256 in Postgres, rotated on every refresh, cookie path `/api/auth`. |

## Architecture

```
React SPA  --HTTP+cookie-->  Fastify API  --Prisma-->  PostgreSQL
     |                            |
     +------ Socket.IO -----------+
                                  |
                           node-cron (overdue)
```

### Roles (enforced in the API)

| Role | Projects | Tasks | Activity feed | Clients / users |
| --- | --- | --- | --- | --- |
| Admin | All | All | Global | Full |
| Project Manager | Only projects they **created** | Tasks on those projects | Those projects only | Read clients; read developers |
| Developer | Only projects that contain their assigned tasks | **Assigned tasks only**; can change **status** only | Their assigned tasks only | None |

A modified JWT cannot escalate a role: tokens are HMAC-signed, and each request reloads the user from the database by `sub`. Role is never taken from the request body.

### Realtime feed

1. On any status change the API writes an `Activity` row (message, actor, from/to status, timestamp) — **stored, not derived**.
2. It then emits `activity:created` to:
   - `project:{projectId}` (anyone currently viewing that project)
   - `feed:admin` (admins)
   - `feed:pm:{ownerId}` (the PM who owns the project)
   - `feed:dev:{assigneeId}` (the assignee)
3. On socket connect/reconnect the client calls `GET /api/activity?limit=20`, which reads the last 20 rows the caller is allowed to see **from Postgres**. Catch-up is not an in-memory buffer.

Presence (admin "users online") is a process-local map of `userId → socket ids`, broadcast on join/leave.

### Overdue flagging

`isOverdue` is a column. A node-cron job (`*/1 * * * *`) selects tasks with `dueDate < now()`, `status != DONE`, `isOverdue = false`, sets the flag, writes a `TASK_OVERDUE` activity, and emits `task:updated`. The UI does **not** compute overdue on page load.

### Notifications

Persisted in `Notification`. Created when a task is assigned (developer) and when status becomes `IN_REVIEW` (the project owner). The unread badge is pushed over Socket.IO (`notification:created`); there is no polling.

## Database schema

```
User 1──* Project (createdBy)
User 1──* Task (assignee)
User 1──* Activity (actor)
User 1──* Notification
User 1──* RefreshToken
Client 1──* Project
Project 1──* Task
Task 1──* Activity
```

### Indexing decisions

| Index | Reason |
| --- | --- |
| `User.email` unique | Login lookup |
| `User.role` | Admin user lists |
| `Project(createdById)` | PM-scoped project lists (the hottest PM query) |
| `Project(clientId)` | Client → projects |
| `Task(projectId)`, `Task(projectId, status)` | Kanban by project |
| `Task(assigneeId)` and `(assigneeId, status, priority, dueDate)` | Developer dashboard sort/filter |
| `Task(status)`, `Task(priority)`, `Task(dueDate)`, `Task(isOverdue)` | Shareable filter query params + overdue job |
| `Activity(createdAt)`, `(projectId, createdAt)`, `(taskId, createdAt)` | Catch-up feed (`ORDER BY createdAt DESC LIMIT 20`) |
| `Notification(userId, read, createdAt)` | Badge + dropdown |
| `RefreshToken.tokenHash` unique, `expiresAt` | Refresh + cleanup |

## Live demo

- App (Vercel): https://fsd-project-frontend-umber.vercel.app
- API (Render): https://velozity-ops-api.onrender.com
- Repo: https://github.com/srineshr1/fsd-project

The API is a free Render web service, so the first request after idle time can take ~30s to wake. WebSockets need that long-lived process; the SPA stays on Vercel.

## Local setup

### Option A — Docker (preferred)

Requires Docker with permission to talk to the daemon.

```bash
cp .env.example .env
docker compose up --build
```

- Web: http://localhost:5173
- API: http://localhost:3001
- Postgres: localhost:5432

On first boot the API image runs `prisma migrate deploy`. Seed separately:

```bash
docker compose exec backend npx prisma db seed
```

### Option B — Postgres in Docker, apps on the host

```bash
cp .env.example .env
docker compose up -d db
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:3001

### Environment

See `.env.example`. Secrets never live in source. Important keys:

- `JWT_ACCESS_SECRET` — HMAC secret for access tokens
- `DATABASE_URL`
- `FRONTEND_ORIGIN` — CORS + Socket.IO origin
- `COOKIE_SECURE` / `COOKIE_SAMESITE` — set `true` / `none` when the SPA and API are on different HTTPS hosts (Vercel + a persistent API)

## Demo accounts

Password for every human user: `Password123!`

| Role | Email |
| --- | --- |
| Admin | `admin@velozity.dev` |
| Project Manager | `priya@velozity.dev` |
| Project Manager | `james@velozity.dev` |
| Developer | `ravi@velozity.dev` |
| Developer | `ananya@velozity.dev` |
| Developer | `marcus@velozity.dev` |
| Developer | `leila@velozity.dev` |

Seed also creates 3 clients, 3 projects (5+ tasks each, mixed statuses), at least 2 overdue tasks, and a pre-filled activity log.

Priya owns the Northwind and Helios projects. James owns Atlas Tracking API. Logging in as James must not show Priya's work, including via direct API calls.

## API (all protected except login/refresh/health)

| Method | Path | Who |
| --- | --- | --- |
| POST | `/api/auth/login` | public |
| POST | `/api/auth/refresh` | cookie |
| POST | `/api/auth/logout` | cookie |
| GET | `/api/auth/me` | any auth |
| GET/POST | `/api/users` | admin (PM may GET developers) |
| CRUD | `/api/clients` | admin write; PM read |
| CRUD | `/api/projects` | admin + owning PM; developers see assigned-only |
| GET/PATCH | `/api/tasks` | scoped; developers PATCH `/status` only |
| GET | `/api/activity?limit=20` | role-filtered catch-up |
| GET | `/api/dashboard` | role-specific payload |
| GET/PATCH | `/api/notifications` | own rows only |

Errors are always:

```json
{ "error": { "code": "FORBIDDEN", "message": "…" } }
```

Stack traces are never sent to the client.

## Known limitations

- Presence and Socket.IO rooms live in a **single process**. Multiple API replicas would need a Redis adapter and a shared presence store.
- node-cron runs inside the API. Two replicas would double-flag unless the job is leader-elected or moved to a worker.
- Vercel hosts the SPA. WebSockets need a long-lived Node process, so the API is not on Vercel serverless — it is deployed as a persistent service and the SPA points `VITE_API_URL` / `VITE_WS_URL` at it. Cross-origin cookies use `SameSite=None; Secure`.
- Access tokens are 15 minutes; a tab that sleeps longer than the refresh cookie (7 days) must log in again.
- File uploads, audit export, and email notifications are out of scope.

## Explanation (submission field)

The hardest part was keeping the live feed honest under three different scopes at once. A status change has to land in Postgres first (so catch-up is real), then fan out only to sockets that are allowed to see it. I used Socket.IO rooms bound at connection time from the same Prisma scope helpers the HTTP layer uses — admin joins `feed:admin`, a PM joins `feed:pm:{id}`, a developer joins `feed:dev:{id}` — so the publisher never "filters in JS after broadcast." Missed events are `SELECT … WHERE <role scope> ORDER BY createdAt DESC LIMIT 20`, not a server-side ring buffer.

If I did this again I would put Socket.IO on the Redis adapter from day one and run the overdue job as a single worker, so the design survives more than one API instance without a rewrite.
