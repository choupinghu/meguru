# CLAUDE.md — Meguru

Meguru (巡) is a **map-first web catalogue** for a personal collection of *gotochi*
(regional) Hello Kitty charms. **Listing-first**, not a store.

## Architecture (current)
- Single self-contained file: `index.html`. No build step, no dependencies, no backend.
- All charm data lives in the `CHARMS` array inside the `<script>` in `index.html`.
- Japan map is an inline SVG (Geolonia, MIT); each prefecture has a `data-code` (1–47).
- Region metadata + colours in the `REGIONS` object; conditions in `CONDITIONS`.

## Data model
One charm = one object in `CHARMS` (README has the authoritative field table):
`code` (prefecture 1–47) OR `collab:true`+`brand`; `name`, `ja`, `city`,
`cond` (bnib | boxed-notag | nobox-tag | nobox-notag),
`rarity` (common | uncommon | rare | grail),
`status` (available | reserved | sold | keepsake),
`price` (SGD number or `null`), optional `special`, `note`, `image`.

## Hard rules (do not violate)
- **Day / paper identity only.** No dark theme, no `prefers-color-scheme: dark`, no toggle. Deliberate.
- **Listing-first.** No real checkout / payment / credit-card flow. "Enquire" is a stub. Future payment is casual (bank transfer / PayLah) — not now.
- **Self-contained.** Everything must work by opening `index.html` directly (no server) until we formally migrate to Next.js.
- **Vanilla only.** No frameworks/libraries added to the prototype.
- Keep the Sanrio trademark disclaimer intact.

## Design conventions
- Traditional 和色 palette via CSS custom properties on `:root` (paper, sumi ink,
  vermilion accent, ai indigo, per-region hues). Reuse tokens — don't hardcode colours.
- Mincho serif for display, humanist sans for UI. Bilingual (kanji + romaji) labels.
- Respect `prefers-reduced-motion`.

## Run
`open index.html`  (macOS)

## Verify a change (definition of done)
1. Inline JS parses:
   ```
   node -e 'const fs=require("fs");const h=fs.readFileSync("index.html","utf8");const m=h.match(/<script>([\s\S]*)<\/script>/);fs.writeFileSync("/tmp/mg.js",m[1]);'
   node --check /tmp/mg.js
   ```
2. Tags roughly balanced (style / script / svg / section counts match).
3. Open `index.html`: map renders, region chips + pins work, coverflow loops, no console errors, still light-only.
4. Matches the spec's "Done when" checklist.

## Workflow (plan → execute)
- Feature specs live in `specs/` (local, untracked) — one file per feature.
- **Plan** in the main session (Opus): write/refine a spec (`/spec <idea>`).
- **Execute**: hand the spec to the `executor` subagent, which runs on Sonnet (`/ship specs/xxxx.md`).
- **Verify** (above), then commit. Small focused commits; end messages with the Co-Authored-By trailer.

## Roadmap
Short term: real inventory + photos (add `image`). Then migrate to Next.js on Vercel,
reusing the design tokens, the map, and the data model. Backend stays simple (start as a JSON/TS data file).
