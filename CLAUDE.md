# CLAUDE.md — Meguru

Meguru (巡) is a **map-first web catalogue** for a personal collection of *gotochi*
(regional) Hello Kitty charms. **Listing-first**, not a store.

## Architecture (current)
- Next.js (App Router) + TypeScript + Tailwind, deployed on Vercel. Package manager: **npm**.
- Data lives in **Neon** (serverless Postgres), accessed via **Drizzle ORM**
  (`@neondatabase/serverless` + `drizzle-orm/neon-http`).
- `db/schema.ts` — the `charms` table + `pgEnum`s (`region`, `condition`, `rarity`, `status`).
- `db/index.ts` — the Drizzle client, built from `process.env.DATABASE_URL` (the
  pooled Neon connection string). Never hardcode the secret; it lives only in
  `.env.local` (gitignored) and in Vercel's env vars.
- `drizzle.config.ts` + `drizzle/` — versioned SQL migrations, generated with
  `drizzle-kit generate` and applied with `npm run db:migrate`. Prefer
  generate+migrate over `push`.
- `scripts/seed.ts` — idempotent (truncate-then-insert) seed of the ~24
  representative charms, run with `npm run db:seed`.
- `app/page.tsx` is currently a throwaway proof page (queries the DB via
  Drizzle, `export const dynamic = 'force-dynamic'` so it never runs at build
  time) — Spec 2 replaces it with the real UI/design system.
- `prototype/index.html` — the original single-file, self-contained prototype.
  Kept as reference only; no longer the shipped app. It still must open and
  work standalone (see Verify below).

## Data model
The `charms` table (see `db/schema.ts` for the authoritative definition):
`id`, `name`, `nameJa`, `isCollab`, `prefectureCode` (1–47, null for collabs),
`region` (`hokkaido | tohoku | kanto | chubu | kinki | chugoku | shikoku |
kyushu-okinawa | collab`), `city`, `brand` (collabs), `condition`
(`bnib | boxed-notag | nobox-tag | nobox-notag`), `rarity`
(`common | uncommon | rare | grail`), `status`
(`available | reserved | sold | keepsake`), `priceSgd`, `special`, `note`,
`imageUrl` (Spec 4), `tags`, `createdAt`.

## Hard rules (do not violate)
- **Day / paper identity only.** No dark theme, no `prefers-color-scheme: dark`, no toggle. Deliberate.
- **Listing-first.** No real checkout / payment / credit-card flow. "Enquire" is a stub. Future payment is casual (bank transfer / PayLah) — not now.
- Keep the Sanrio trademark disclaimer intact (currently in `prototype/index.html`; must be preserved when the UI is ported in Spec 2).

## Design conventions
- Traditional 和色 palette via CSS custom properties on `:root` (paper, sumi ink,
  vermilion accent, ai indigo, per-region hues). Reuse tokens — don't hardcode colours.
- Mincho serif for display, humanist sans for UI. Bilingual (kanji + romaji) labels.
- Respect `prefers-reduced-motion`.
- (Design system currently only lives in `prototype/index.html`; Spec 2 ports it into the Next.js app.)

## Run
- `npm install`
- Dev server: `npm run dev` → http://localhost:3000
- Reference prototype: `open prototype/index.html` (macOS)

## Verify a change (definition of done)
1. `npm install` succeeds.
2. `npm run build` succeeds with no type errors. (Any page touching the DB
   must be `force-dynamic` or otherwise not require a live connection at
   build time.)
3. Schema changes: `npm run db:generate` produces a new versioned migration
   under `drizzle/`; with `DATABASE_URL` set, `npm run db:migrate` applies it
   cleanly.
4. Data changes: `npm run db:seed` re-runs without duplicating rows
   (truncate-then-insert or upsert).
5. `npm run dev` — the app loads and reflects the change; no console errors.
6. `prototype/index.html` still opens standalone (unaffected by app changes)
   and, when its inline JS is touched, still parses:
   ```
   node -e 'const fs=require("fs");const h=fs.readFileSync("prototype/index.html","utf8");const m=h.match(/<script>([\s\S]*)<\/script>/);fs.writeFileSync("/tmp/mg.js",m[1]);'
   node --check /tmp/mg.js
   ```
7. Matches the spec's "Done when" checklist.

## Workflow (plan → execute)
- Feature specs live in `specs/` (local, untracked) — one file per feature.
- **Plan** in the main session (Opus): write/refine a spec (`/spec <idea>`).
- **Execute**: hand the spec to the `executor` subagent, which runs on Sonnet (`/ship specs/xxxx.md`).
- **Verify** (above), then commit. Small focused commits; end messages with the Co-Authored-By trailer.

## Roadmap
See `specs/ROADMAP.md`. Next up: Spec 2 (port the prototype UI/design system/map
into React components reading from the DB), Spec 3 (faceted filters + REST
route), Spec 4 (images via Vercel Blob + admin).
