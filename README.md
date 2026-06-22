# Relay — AI Support Workspace

A multi-tenant support/operations SaaS: organizations invite their team, manage
tickets and customers, and triage from a collaborative dashboard — with an AI
copilot that accelerates real work (summaries, tag suggestions, first-reply
drafts). It includes authentication, organizations with roles, a ticket inbox
and detail view, customers, team management, a live metrics dashboard, an AI
copilot, and settings — backed by unit + e2e tests and CI.

> Design direction: an **operations-console / signal-relay** aesthetic — calm,
> instrument-panel precision with monospaced "signal readouts" for IDs, SLAs and
> metrics, and a single warm **signal-gold** accent. Deliberately not a default
> SaaS template.

---

## Stack

| Concern            | Choice                                                         |
| ------------------ | -------------------------------------------------------------- |
| Framework          | Next.js 16 (App Router, RSC) + TypeScript + React 19           |
| Styling            | Tailwind CSS v4 (CSS-first `@theme`) + custom design tokens     |
| Auth & data        | Supabase (Postgres, Auth, RLS) via `@supabase/ssr`              |
| Validation         | Zod (shared by client forms and server actions)                |
| Forms              | React Hook Form                                                |
| Server state       | TanStack Query                                                 |
| Icons / toasts     | lucide-react / sonner                                          |
| Theming            | next-themes (class-based light/dark)                           |
| Realtime           | Supabase Realtime (postgres_changes, RLS-scoped)              |
| Testing            | Vitest (unit) + Playwright (e2e)                               |
| Monitoring / CI    | `reportError` seam (Sentry-ready) · GitHub Actions            |

---

## Architecture & key decisions

- **Data access through `@supabase/ssr` + RLS, not a privileged ORM connection.**
  Tenant isolation is enforced *in the database* by Row Level Security keyed off
  the authenticated user's JWT. This is simpler and safer than querying through a
  service-role/Drizzle connection (which would bypass RLS and require hand-rolled
  tenant checks on every query). It also lets the app run locally with only the
  public URL + anon key. Drizzle stays available for future service-role
  analytics that genuinely need a direct connection.

- **SQL-first migrations** in [`supabase/migrations`](./supabase/migrations).
  Postgres is the source of truth: tables, enums, triggers, RLS policies and the
  `create_organization` RPC live in versioned SQL, applied via the Supabase
  GitHub integration / CLI. TypeScript types are generated from the live schema
  into [`src/lib/database.types.ts`](./src/lib/database.types.ts).

- **Atomic organization creation via a `SECURITY DEFINER` RPC.** Creating an org
  and the owner's `admin` membership in one call avoids the RLS chicken-and-egg
  (you can't insert a membership for an org you're not yet a member of).

- **Non-recursive RLS via private helper functions.** Membership/role checks
  (`private.is_org_member`, `private.has_org_role`, …) are `SECURITY DEFINER`
  functions in a non-exposed `private` schema, so policies on
  `organization_members` don't recurse. `auth.uid()` is wrapped in
  `(select auth.uid())` so it's evaluated once per query (Supabase RLS perf
  guidance), and every FK / policy column is indexed.

- **Route protection in `proxy.ts`** (Next 16's renamed middleware). The session
  is refreshed on every request; unauthenticated hits on `/dashboard` or
  `/onboarding` redirect to `/login?redirect=…`, and authenticated hits on the
  auth pages bounce to `/dashboard`.

---

## Data model

`profiles` (mirrors `auth.users`, auto-created by trigger) ·
`organizations` (name, **slug**, **owner_id**, created_at) ·
`organization_members` (role: `admin` | `manager` | `agent`) ·
plus the forward-looking support tables — `customers`, `tickets`,
`ticket_comments` (internal/public), `ticket_events` (audit), `tags`,
`ticket_tags`, `invitations`, `subscriptions` — all with multi-tenant RLS so the
inbox, customers and billing features can be built without reworking access
control.

The org creator becomes **Admin**. Roles are designed for least privilege:
agents work the queue, managers manage the team and data, admins also control
the workspace and (future) billing.

---

## Getting started

### 1. Prerequisites

- Node.js 20+ and npm
- A Supabase project (free tier is fine)

### 2. Install

```bash
npm install
```

### 3. Environment

Copy the example and fill in your project values:

```bash
cp .env.example .env.local
```

| Variable                        | Where to find it                                   | Required for           |
| ------------------------------- | -------------------------------------------------- | ---------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase → Project Settings → API                  | auth + data            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API                  | auth + data            |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase → Project Settings → API (server-only)    | future admin ops       |
| `DATABASE_URL` / `DIRECT_URL`   | Supabase → Project Settings → Database             | future Drizzle queries |

> The auth + organizations + dashboard flow runs with just the **URL** and
> **anon key** — RLS does the rest. The anon key is browser-safe by design.

### 4. Database

Migrations live in [`supabase/migrations`](./supabase/migrations). Apply them
with the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

(Or connect the repo in **Supabase → Integrations → GitHub**, which applies
migrations on push to `main`.)

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000 → **Start free** → create your account → name your
workspace → land on the dashboard. As an admin, click **Load sample data** to
populate a realistic demo (customers, tickets, tags, history).

> **Email confirmation:** Supabase enables email confirmation by default. For a
> friction-free local demo, turn it off under **Supabase → Authentication →
> Providers → Email → "Confirm email"**, or confirm the user from the dashboard.

---

## Project structure

```
src/
  app/
    (auth)/            login & signup (shared centered layout, server actions)
    onboarding/        create-workspace flow (RPC-backed)
    (app)/             protected area: shell layout + dashboard
    page.tsx           marketing landing
    proxy.ts           session refresh + route protection (Next 16)
  components/
    ui/                design-system primitives (button, card, input, …)
    relay/             brand/signature components (ticket id, status, priority)
    app/               app shell: sidebar, topbar, org switcher, user menu
  lib/
    supabase/          browser/server clients + session helper
    data/              org & dashboard queries
    validation/        Zod schemas
    domain.ts          shared ticket/role vocabulary + tokens
supabase/
  migrations/          versioned SQL (schema, RLS, RPC, triggers)
```

---

## Quality & testing

- **CI** (GitHub Actions): lint + typecheck + unit tests + build on every push.
- **Unit tests** (`npm test`, Vitest): validation schemas, `slugify`, the
  open-redirect guard, the AI mock provider, domain helpers.
- **E2E tests** (`npm run test:e2e`, Playwright): route protection, login,
  inbox → ticket detail, URL-persisted filters. Runs against a running app with
  a seeded demo account; override creds with `E2E_EMAIL` / `E2E_PASSWORD`.
- States covered across every area: loading, error (route `error.tsx` +
  `global-error.tsx`), and empty.
- Accessibility: visible keyboard focus, `prefers-reduced-motion`, semantic
  landmarks, labelled controls, focus-managed mobile navigation.
- **RLS tenant isolation** verified — a user cannot read or write another
  organization's data.
- Error monitoring is centralized in `src/lib/monitoring.ts` (console by
  default) and wired to Next's `onRequestError`; plugging Sentry is a one-file
  change.

---

## Roadmap

**Done:** ticket inbox (filters / search / tags / assignment, realtime) · ticket
detail (internal & public comments, history, optimistic updates, AI copilot) ·
live dashboard metrics · customers · team management & invitations · settings ·
unit + e2e tests · CI · error-monitoring seam.

**Next:** Stripe billing (test mode) · Vercel deploy + Lighthouse pass · live
realtime for tag changes · richer per-role UI gating.

---

_Portfolio-grade demo. Built with Next.js, Supabase and a custom design system._
