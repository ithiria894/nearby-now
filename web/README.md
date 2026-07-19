# enoki web

Funnel-first web app for **enoki** (the share-link flow: create a room in ≤20s,
drop the link in a Threads/WhatsApp post, a stranger taps in with zero signup).

Spec / single source of truth: [`../.docs/WEB_PLAN.md`](../.docs/WEB_PLAN.md).
Task tracker: GitHub issue **#63** (work issues **#40–#62**).

This is a **separate app** from the Expo mobile app in the repo root — it has its
own `package.json` and lockfile and does **not** use npm workspaces. It talks to
the **same Supabase project** as mobile.

## Stack

Next.js 16 (App Router, TypeScript) · React 19 · no Tailwind (design system is a
hand-built token/component kit — see WEB_PLAN §7). ESLint 9 flat config.

## Setup

```sh
cd web
npm install
cp .env.local.example .env.local   # fill in the Supabase URL + anon key
npm run dev
```

Open http://localhost:3000 (routes so far: `/` and `/design`).

## Checking the UI on a phone (LAN)

Design review happens on a real phone. Bind dev to your LAN so a phone on the
same Wi-Fi can reach it:

```sh
npm run dev -- -H 0.0.0.0
```

Find your machine's LAN IP (`ipconfig` on Windows → IPv4 address, e.g.
`192.168.1.23`) and open `http://192.168.1.23:3000/design` on the phone.

> In-app-browser checks (Threads/IG/WhatsApp webview) need a public URL — use a
> temporary tunnel (e.g. `cloudflared`) rather than deploying early. Real
> deployment lands in issue #61 (M4).

## Scripts

| Script              | Does                                 |
| ------------------- | ------------------------------------ |
| `npm run dev`       | dev server (`-- -H 0.0.0.0` for LAN) |
| `npm run build`     | production build                     |
| `npm run start`     | serve the production build           |
| `npm run lint`      | ESLint                               |
| `npm run typecheck` | `tsc --noEmit`                       |

## Conventions (full detail in WEB_PLAN §8)

- **Front-door rule:** `next/*` server-only APIs (server components, route
  handlers, `generateMetadata`) live ONLY in the `/r/[slug]` page, the
  `/api/og` route, and root layout/font plumbing. Everything else is portable
  client React.
- Styling comes from `src/styles/tokens.css` (arrives in #41); the source of
  truth for token values is the mobile app's `src/ui/theme/uikit.ts` — mirror,
  don't fork.
- Do not touch the root Expo `package.json` / lockfile.
