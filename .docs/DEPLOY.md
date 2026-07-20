# enoki web — deploy runbook (beta)

Goal: a live URL you can share into a Threads/WhatsApp post. Decisions made
2026-07-19: **no custom domain yet → Vercel subdomain**, **English default**,
**public-data whitelist approved**. Est. 30–60 min, mostly your account work.

Legend: **[you]** needs your login/dashboard · **[claude]** I can do/prepare.

---

## Step 0 — Pick the prod Supabase project **[you, 1 decision]**

The web app and the (future) mobile app are meant to share one Supabase project
so rooms are the same everywhere. But mobile isn't launched, and the existing
cloud project is your friend's (ithiria894). For a clean, low-risk beta:

- **Recommended:** a **fresh Supabase project you own** (acieshk). Push all
  migrations cleanly, zero risk to anyone's data. Web-beta rooms just won't be
  shared with a future mobile launch — fine for a web-only beta; can merge later.
- **Alternative:** reuse the friend's project — only if you two agree and
  coordinate the migration push (it changes the shared schema).

Assuming the fresh project below.

---

## Step 1 — Create + migrate the prod database **[you + claude]**

1. **[you]** supabase.com → New project (region near your wedge, e.g. Singapore
   for HK). Save the DB password. Note the **project ref** (in the URL).
2. **[you]** copy from Project Settings → API: the **Project URL** and the
   **anon/publishable key**.
3. **[claude/you]** push our migrations to it:
   ```sh
   cd <repo root>
   npx supabase link --project-ref <your-ref>      # prompts for DB password
   npx supabase db push                             # applies all supabase/migrations/*
   ```
   This ships: activities/members/rooms schema, RLS, `share_slug` trigger,
   `get_room_public`, `join_room`, `get_feed_public`, `funnel_events`, the
   report RPCs, `activities.banner`.
4. **[you] Auth settings** (Dashboard → Authentication):
   - **Anonymous sign-ins: ON** (guests can't join without this).
   - **Email confirmations: ON** + configure SMTP (for the #74 add-email
     upgrade to be real in prod). Beta-ok to skip SMTP and leave the upgrade
     unused, but the funnel core doesn't need it.
   - Review anonymous rate limits (default 30/hr/IP is fine to start).

---

## Step 2 — Deploy to Vercel **[you]**

1. vercel.com → Add New → Project → import `ithiria894/nearby-now`.
2. **Root Directory: `web`** (important — the app lives in web/, not the root).
   Framework preset auto-detects Next.js.
3. **Environment variables** (all three):
   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | your prod Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your prod anon key |
   | `NEXT_PUBLIC_SITE_URL` | the Vercel URL, e.g. `https://enoki-xxx.vercel.app` (set after first deploy, then redeploy — or guess the project name up front) |
4. Deploy. You get `https://<project>.vercel.app`.
5. Re-set `NEXT_PUBLIC_SITE_URL` to that exact URL and redeploy once (so OG
   image links are absolute).

> Custom domain later: buy it, add it in Vercel → Domains, update
> `NEXT_PUBLIC_SITE_URL`, redeploy. Nothing else changes.

---

## Step 3 — Verify prod **[claude can script most]**

- [ ] **Anon security:** with the prod anon key, `get_room_public('badslug')`
      returns empty; `select * from activities` (and members/profiles/room_events)
      as anon returns **zero rows**. (I'll run this against prod once it's up.)
- [ ] **Create → share → join:** on your phone, `/new` → post → copy link → open
      in a _different_ browser/incognito → join → chat. The one flow only a human
      can drive.
- [ ] **Unfurl:** paste a room link into a real **Threads / IG DM / WhatsApp** —
      the card shows title · place · spots with the OG image. This is the whole
      strategy; test it in the actual in-app browsers.
- [ ] **Feed:** `/` shows open + recently-happened; location pill / Online work.
- [ ] Lighthouse mobile ≥ 90 on a room page (I'll check).

---

## Step 4 — Seed + soft beta **[you, per COLD_START]**

- Create a handful of real hangouts so the feed isn't empty (never look like a
  dead town).
- Hand-DM 10–20 people who already post "找飯友 / 開團"-style: "made a tool that
  auto-collects RSVPs + opens a chat from one link, try it?"
- Watch `funnel_events` (link_open → join_done, create_done, report): plain SQL
  in the Supabase SQL editor. Headline = link→join conversion.

---

## Not needed for this beta

- **i18n / zh-Hant** — default is English; add when you target the Chinese wedge.
- **Mobile sync (#75), page transitions, follow/push (M5)** — post-beta.
- **Custom domain** — Vercel subdomain is fine to start.

## Pre-launch gates still open

- [ ] Legal copy review (/privacy, /terms drafts) — your read.
- [ ] 4 banner images (fitness/shopping/photo/other) — generate (prompts in
      web/public/banners/README.md).
- [ ] A way to actually read reports (SQL query is enough for beta; a console
      is post-beta).
