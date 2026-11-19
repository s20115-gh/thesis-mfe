# thesis-mfe

Code for a master's thesis comparing a **monolithic React frontend** with
**micro-frontend versions of the same app** built with Module Federation on
Vite (`@module-federation/vite`).

The app is a salon booking platform with eight feature modules: five for
customers and three for merchants. The same feature code is composed four
ways, and each version is measured for load and runtime performance, build
cost, code complexity and change impact:

| Configuration | Deployable units | Boundaries                                                                              |
| ------------- | ---------------- | --------------------------------------------------------------------------------------- |
| Monolith      | 1                | One Vite build with route-level code splitting                                          |
| F2            | 2                | Customer app · Merchant app                                                             |
| F4            | 4                | Discovery + Venue · Booking + Checkout + Account · Calendar · Catalog/staff + Analytics |
| F8            | 8                | One remote per feature module                                                           |

Two extra F4 variants isolate specific costs: **F4-noshare** (no shared
singleton libraries) and **F4-qc** (a separate data cache per remote).

## Status

Early setup. So far the repository holds the workspace and a **Module
Federation spike**: a throwaway shell and remote used to confirm that
federation works with this stack before the real app is built. The feature
modules, monolith, federated configurations and benchmark harness are not
built yet.

## Requirements

- Node **26.13.1** (see `.nvmrc`)
- pnpm **11.20.0**

Installs fail on other Node versions (`engine-strict=true`). All dependencies
are pinned to exact versions in `pnpm-lock.yaml`.

## Getting started

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium   # browser used for checks and measurements
```

## Local database

Supabase runs locally in Docker (Supabase CLI 3.1.0).

```bash
supabase start     # start the local stack
pnpm db:reset      # recreate the database from migrations + supabase/seed.sql
pnpm db:check      # check row level security and booking rules
```

The seed is deterministic and contains 36 venues (30 in Nairobi), their
services, staff and weekly hours, and about 5,800 bookings (8 weeks of
history and 2 weeks ahead). Test accounts, password `password123`:

| Email                  | Role                                            |
| ---------------------- | ----------------------------------------------- |
| `customer@example.com` | Customer with past and upcoming bookings        |
| `merchant@example.com` | Merchant who owns Amani Hair Studio (Westlands) |

## Running the spike

```bash
pnpm spike:build   # production builds of the remote and the shell
pnpm spike:serve   # shell on http://localhost:5173, remote on http://localhost:5174
```

Open http://localhost:5173 and click **Remote page**. The box with the dashed
border is a component loaded at runtime from the separately built remote.

With the server running, in a second terminal:

```bash
pnpm spike:check
```

This opens the shell in a headless browser and checks that the remote reuses
the shell's copies of React, React Router, TanStack Query and supabase-js, and
reads the shell's QueryClient. Each check prints `PASS` or `FAIL`.

Measurements always use production builds served by
`scripts/serve-static.mjs`, never the Vite dev server.

## Repository layout

```
.
├─ docs/
│  └─ decisions.md       versions, setup decisions and problems found
├─ scripts/
│  └─ serve-static.mjs   static server used for every configuration
└─ spike/
   ├─ shell/             host app, loads the remote on /remote
   ├─ remote/            exposes one component (remote/Hello)
   └─ check-sharing.mjs  automated check that libraries are shared
```

Planned, following `pnpm-workspace.yaml`:

```
apps/monolith/           the one-unit reference build
apps/mfe/                shell and remotes for F2, F4 and F8
packages/ui, data, contracts
packages/features/*      the eight feature modules, written once
bench/                   Lighthouse CI, Playwright journeys, analysis scripts
supabase/                schema and seed data
```

## Documentation

- [docs/decisions.md](docs/decisions.md): tool versions, environment, setup
  decisions and open problems.
