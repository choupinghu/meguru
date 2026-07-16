# Meguru 巡

**Gotochi Hello Kitty, mapped across Japan.**

Meguru (巡る — *to make the rounds*) turns a personal collection of regional
(ご当地 / *gotochi*) Hello Kitty charms into an interactive map of the country
they came from. It's built **listing-first**: the point is to catalogue and
show the collection — where each charm is from, what it depicts, and the
condition it's in. Casual, enquiry-based buying can come later.

The gap it fills: collectors gather these for the joy of it, but rarely get to
see the *shape* of what they've gathered. Meguru makes the collection legible.

---

## Status

**Working prototype** — a single self-contained `index.html`. No build step, no
dependencies, no backend. Currently seeded with ~24 *representative* charms
(real gotochi themes, **not** the actual inventory yet).

## Run it

Just open the file — it's fully self-contained:

```
open index.html
```

(A live preview is also published privately as a Claude Artifact.)

## What's in it

- **Interactive map of Japan** — all 47 prefectures. A prefecture is tinted by
  its region's colour *only if the collection has a charm from there*, so the
  map itself visualises how far across Japan the collection reaches.
- **Region drill-down** — region chips zoom the map and list that region's
  charms; vermilion pins open a single prefecture.
- **Discover** — a hanko-style stamp that jumps to a random region.
- **Revolving shelf** — a circular coverflow of charm images, centre enlarged,
  reshuffled on every load.
- **Off the map** — a separate shelf for company/theme collabs (airline, rail,
  park exclusives) that don't belong to a prefecture.
- **Condition, rarity & status** labelled plainly on every card.

## Adding a charm

Everything renders from the `CHARMS` array near the top of the `<script>` in
`index.html`. Listing a charm = adding one line:

```js
{code:26, name:'Maiko', ja:'舞妓', city:'Kyoto 京都',
 cond:'bnib', rarity:'rare', status:'available', price:36, special:true}
```

| field     | values |
|-----------|--------|
| `code`    | prefecture number **1–47** (see the SVG `data-code`s) — *omit for a collab* |
| `collab`  | `true` for off-the-map items; add `brand:'ANA'` |
| `name`    | display name (romaji / English) |
| `ja`      | Japanese label |
| `city`    | e.g. `'Kanazawa 金沢'` |
| `cond`    | `bnib` · `boxed-notag` · `nobox-tag` · `nobox-notag` |
| `rarity`  | `common` · `uncommon` · `rare` · `grail` |
| `status`  | `available` · `reserved` · `sold` · `keepsake` |
| `price`   | number in SGD, or `null` (not for sale) |
| `special` | optional `true` |
| `note`    | optional one-liner |

**Condition key:** `bnib` = brand new in box, tag intact · `boxed-notag` =
original box, no tag · `nobox-tag` = loose but tagged · `nobox-notag` = charm
only.

## Design

A washi-paper *stamp-rally journal* meets a collector's catalogue. Traditional
和色 palette — paper ground, sumi ink, a single **vermilion (朱)** accent
(hanko seal / torii / the bow), *ai* indigo for structure, and muted per-region
hues. Mincho-serif display + humanist-sans UI, bilingual labels throughout.
Committed to a single light/paper identity by design (no dark theme).

## Where it's headed

Short term: swap in the real inventory + photos. Then graduate to a **Next.js
app deployed on Vercel** (the backend stays simple — data can start as a JSON/TS
file), reusing the design system, map, and data model from this prototype. See
`nextsteps.md` (local, untracked) for the working roadmap.

## Notes

- All stock is genuine and legally sourced; condition is labelled honestly.
- Japan prefecture geometry © [Geolonia](https://github.com/geolonia/japanese-prefectures) (MIT), baked inline.
- "Hello Kitty" and "Gotochi Kitty" are trademarks of Sanrio Co., Ltd. Meguru
  is an independent collector's catalogue and is not affiliated with or endorsed
  by Sanrio.
