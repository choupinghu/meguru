# Meguru 巡

**Gotochi Hello Kitty, mapped across Japan.**

Meguru (巡る — *to make the rounds*) turns a personal collection of regional
(ご当地 / *gotochi*) Hello Kitty charms into an interactive map of the country
they came from. It is built **listing-first**: the point is to catalogue and
show the collection — where each charm is from, what it depicts, and the story
behind the thing it represents. Casual, enquiry-based buying can come later.

The gap it fills: collectors gather these for the joy of it, but rarely get to
see the *shape* of what they have gathered. Meguru makes the collection legible.

---

## Status

**Live.** A Next.js app on Vercel, backed by Neon Postgres.

**63 charms catalogued · 34 in the collection · 21 of 47 prefectures reached ·
62 write-ups.** The other 29 are documented but unowned — real designs that
exist, recorded so the catalogue is a reference and not only an inventory.

`prototype/index.html` is the original single-file build, kept as a frozen
reference. It still opens standalone with no build step.

## Run it

```
npm install
npm run dev            # http://localhost:3000
```

Needs `DATABASE_URL` in `.env.local` — every page is `force-dynamic`, so the
database is read per request rather than at build time.

| command | what it does |
|---|---|
| `npm run dev:phone` | opens a real Chrome window at a phone or tablet size |
| `npm run dev:kill` | stops dev servers Ctrl-C did not reach |
| `npm run db:migrate` / `db:seed` | apply migrations / reseed the dev branch |
| `npm run check:pages` | builds, serves, and asserts against the rendered HTML |
| `npm run photos:install` | publishes hand-cut charm images into `public/` |

`dev:phone` opens a *real* window on purpose: headless Chrome lays out at its
own viewport and merely crops, so media queries below that width never fire and
the screenshot lies about what a phone sees.

## The three surfaces

**`/` — the map.** All 47 prefectures. A prefecture is tinted by its region's
colour only if the collection reaches it, so the map itself shows how far the
collection has got. Region chips and clicks drill japan → region → prefecture.
**Discover** picks a charm at random and sweeps the whole collection to reach
it. Beside the map, a rail of cut-outs indexes whatever is in view; on a phone
that rail becomes a swipeable band under the map, and a tap opens a small record
over it. `/` never shows a price, condition or status.

**`/browse` — the index.** All 63 designs as cards. Owned charms are priced;
documented ones are dashed and priceless.

**`/charm/[id]` — the record.** The story first, a carousel of the cut-out and
the original photograph, then what the charm is and where it is from.

## Data model

Two tables — see `db/schema.ts` for the authoritative definition.

- **`designs`** — what is true of every copy of a design anywhere: name, place,
  motif, story.
- **`items`** — one physical copy on the shelf: condition, status, price, note,
  and our own photograph.

The split is what lets the catalogue hold 29 designs nobody owns. A design with
no item is structurally incapable of showing a price.

Content lives in `scripts/seed-data.ts` and is applied with `npm run db:seed`,
which truncates and reinserts.

## Rules the code keeps

- **Nothing unowned can show a price.** Price and condition live only on
  `items`, so a design with no item cannot display either. `/` renders none of
  them on any surface — though the server payload it sends still carries them
  for the owned 34, so they are readable in page source. Not rendered, not
  private.
- **The story never appears in the Browse grid.** `/browse` is breadth,
  `/charm/[id]` is depth.
- **A null beats an invention.** Where a fact cannot be sourced the field stays
  empty — five owned charms have no prefecture because the object does not name
  one, and they stay off the map rather than being placed on a guess.
- **Rarity is not displayed anywhere.** The values were never verified, so they
  do not headline a stat or badge a card.
- **Day/paper identity only.** No dark theme, by design.

`npm run check:pages` asserts the first two against the rendered HTML.

## Design

A washi-paper *stamp-rally journal* meets a collector's catalogue. Traditional
和色 palette — paper ground, sumi ink, a single **vermilion (朱)** accent, *ai*
indigo for structure, and muted per-region hues. Mincho-serif display and
humanist-sans UI, bilingual labels throughout. All colour lives in
`app/globals.css` as custom properties; components hold no hex literals.

## Photographs

Charms are shown as background-removed cut-outs so they sit on the map without
a box around them. Some are our own photographs; where a charm is still sealed
in its packaging — which makes a clean cut-out impossible — a loose example is
sourced instead, and provenance is recorded per image. `public/img/charms/SOURCES.md`
lists the origin of every sourced picture.

## Notes

- All stock is genuine and legally sourced; condition is labelled honestly.
- Japan prefecture geometry © [Geolonia](https://github.com/geolonia/japanese-prefectures) (MIT).
- "Hello Kitty" and "Gotochi Kitty" are trademarks of Sanrio Co., Ltd. Meguru is
  an independent collector's catalogue and is not affiliated with or endorsed by
  Sanrio.
