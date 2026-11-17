# CampusHub · upGrad SOT Pune

The student hub for upGrad School of Technology, Pune (ADYPU): campus events, live Pune hackathons from Devpost (via Supabase), find classmates and teammates, campus board, lost & found, saved events.

Static frontend (Next.js App Router with `output: 'export'`), Supabase backend for the live feed. No framework server needed; deployable to GitHub Pages.

## Run it

```bash
npm ci
cp .env.example .env.local   # fill in (or use the local stack: supabase start)
npm run dev                  # http://localhost:3000
```

Node 20.9+ (developed on Node 26).

> **Build-time env:** the static export inlines `NEXT_PUBLIC_*` values at build time. If `.env.local` is missing or empty, the exported site renders the "Live feed unavailable" state instead of baking blanks into the bundle.

## The live Pune events feed

`Around Pune · live` on the Events page reads the `live_events` table from Supabase.

- **What it contains**: open and upcoming hackathons whose Devpost `displayed_location` contains "Pune". Nothing else — no fabricated dates, no inferred stipends.
- **Source**: Devpost's public search endpoint (`…/api/hackathons?search=Pune&status=open|upcoming`).
- **Sync**: `npm run sync:devpost` (machine-side; needs `SUPABASE_SERVICE_ROLE_KEY`), or the Deno edge function `supabase/functions/sync-live-events` triggered by pg_cron/hosted cron with an `SYNC_SECRET`.
- **Client**: `@supabase/supabase-js` with the publishable key; Row Level Security allows `select` of published rows only; the sync writes via the service role.
- **Realtime**: the page subscribes to `postgres_changes` on `live_events` and refreshes when rows change (Supabase Realtime publication).
- **Manual rows**: the campus team can insert rows with `source = 'manual'` — e.g. department hackathons like Techverse — using the sample insert below. **No fake rows are added to this table; empty feed is rendered honestly.**

```sql
-- Example (fill with real info, never guessed):
insert into public.live_events (external_id, source, title, official_url, deadline_on, location, organiser, open_state, mode)
values ('manual-techverse-2026', 'manual', 'Techverse 2026', 'https://organiser-link.example', null, 'Ajeenkya D.Y Patil University, Pune', 'upGrad SOT', 'upcoming', 'offline');
```

## Schema

`live_events` (see `supabase/migrations/20261117000000_live_events.sql`): external_id unique, source ('devpost' | 'manual' | ...), title, tagline, official_url (https only), starts_on/ends_on/deadline_on, location, organiser, category, themes[], prize_display, registrations_count, open_state ('open' | 'upcoming'), mode, thumbnail_url, synced_at, published. RLS: public `select` of published rows; no client writes.

## Notices

- **Sakuga VFX** by [finktheartist](https://github.com/finktheartist/sakuga-vfx), MIT — files in `public/sakuga-vfx/` (`button.js`, `tabs.js`, `toast.js`, `LICENSE`). Unmodified.
- Student data on this site is fictional sample data.
- No passwords are collected; there is no authentication yet.
