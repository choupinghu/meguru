import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import CharmThumb from "@/components/CharmThumb";
import CharmCarousel from "@/components/CharmCarousel";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import {
  CONDITION_COLOR_VARS,
  CONDITION_LABELS,
  charmColor,
  locationLabel,
  motifLabel,
  priceLabel,
  statusLabel,
  toCharmView,
  charmImages,
  toDesignView,
  type DesignView,
} from "@/lib/charms";
import { COLLAB_REGION, REGIONS, type RegionKey } from "@/lib/regions";

// Queries Neon via Drizzle at request time, same as `/` and `/browse` — force
// dynamic rendering so `next build` never needs a live connection, and there
// is no `generateStaticParams`: with only 54 designs and a route nobody hits
// at build time, pre-rendering nothing is simpler than pre-rendering all of it.
export const dynamic = "force-dynamic";

/** "Kantō" / "Off the map" for a design's `region` column (a plain enum
 * string, so — unlike `locationLabel`'s prefecture/city — it needs its own
 * lookup rather than reusing `charmColor`/`locationLabel`'s `Locatable` shape. */
function regionLabel(region: string): string {
  if (region === "collab") return COLLAB_REGION.en;
  return REGIONS[region as RegionKey]?.en ?? region;
}

/**
 * "More like this" (requirement 5): same motif first, up to 6, ordered by
 * id so the set is stable between requests (no `Math.random()` — that would
 * also disagree between server and client and break hydration). Tops up
 * with same-region designs only if motif alone yields fewer than 3 — every
 * motif today has at least 3 other members, so this rarely fires, but every
 * design (including the 29 with no item) is eligible, which is what gives
 * those documented-only designs an entry point anywhere on the site at all.
 */
function relatedDesigns(subject: DesignView, all: DesignView[]): DesignView[] {
  const byId = (a: DesignView, b: DesignView) => a.id - b.id;

  const motifMatches = all
    .filter((d) => d.id !== subject.id && subject.motif != null && d.motif === subject.motif)
    .sort(byId);

  const related = motifMatches.slice(0, 6);

  if (related.length < 3) {
    const included = new Set(related.map((d) => d.id));
    included.add(subject.id);
    const regionMatches = all
      .filter((d) => !included.has(d.id) && d.region === subject.region)
      .sort(byId);
    for (const d of regionMatches) {
      if (related.length >= 6) break;
      related.push(d);
      included.add(d.id);
    }
  }

  return related.sort(byId);
}

export default async function CharmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;

  // Non-numeric ids (and anything with stray characters) never reach the DB
  // lookup at all.
  if (!/^\d+$/.test(rawId)) notFound();
  const id = Number(rawId);

  // One query for the subject and every relation candidate (requirement 6 /
  // D6) — 54 rows is nothing, and this rules out both a second round trip
  // and any per-relation N+1.
  const rows = await db.query.designs.findMany({ with: { items: true } });
  const designs = rows.map((row) => toDesignView(row, row.items));

  const design = designs.find((d) => d.id === id);
  if (!design) notFound();

  const color = charmColor(design);
  const thumbCharm = toCharmView(design);
  const images = charmImages(design);
  const motif = motifLabel(design.motif);
  const region = regionLabel(design.region);
  const related = relatedDesigns(design, designs);

  return (
    <div className="meguru">
      <SiteHeader active="none" />
      <article className="charm-page">
        {/* Identity above the picture, picture above the story (0018/D4).
            "Kinki · Shiga · Lake Biwa" then the name tells you what you are
            looking at before you look at it, which reads better than the old
            art-beside-heading split. */}
        <div className="charm-hero" style={{ "--rc": color } as CSSProperties}>
          <div className="charm-head">
            <div className="crumb">{region}</div>
            <h1>{design.name}</h1>
            {design.nameJa ? <div className="charm-name-ja">{design.nameJa}</div> : null}
            <div className="charm-loc">
              <span className="dot" />
              {locationLabel(design)}
            </div>
            {motif ? (
              <div className="charm-meta">
                <span className="tag motif">{motif}</span>
              </div>
            ) : null}
          </div>
          {images.length > 0 ? (
            <CharmCarousel images={images} name={design.name} />
          ) : (
            <div className="charm-hero-art">
              <CharmThumb charm={thumbCharm} />
            </div>
          )}
        </div>

        {/* Story leads (requirement 2): full reading width, mincho display
            face, never truncated. Absent entirely for a design with no
            story text — no empty block, no stray heading. */}
        {design.story ? (
          <section className="charm-story">
            <p>{design.story}</p>
          </section>
        ) : null}

        {/* Availability (requirement 3 / D3): quiet supporting fact, well
            separated from the story above. A design with no item (29 of 54)
            renders none of this — no price, no condition, no status, no
            Enquire, and no empty container left behind. */}
        {design.items.length > 0 ? (
          <section className="charm-availability">
            <h2>Availability</h2>
            {design.items.map((item) => {
              const status = statusLabel(item.status);
              return (
                <div className="avail-row" key={item.id}>
                  <span className="tag">
                    <span
                      className="cd"
                      style={{ background: CONDITION_COLOR_VARS[item.condition] }}
                    />
                    {CONDITION_LABELS[item.condition]}
                  </span>
                  <span className={`price${item.priceSgd == null ? " na" : ""}`}>
                    {priceLabel(item)}
                  </span>
                  {status ? <span className={`tag ${item.status}`}>{status}</span> : null}
                  {item.status === "available" ? (
                    <button type="button" className="enq">
                      Enquire
                    </button>
                  ) : item.status === "reserved" ? (
                    <span className="hint">On hold</span>
                  ) : null}
                  {/* The item's own note (D8) — a dealer's remark about this
                      physical copy, styled apart from the design's story. */}
                  {item.note ? <p className="item-note">{item.note}</p> : null}
                </div>
              );
            })}
          </section>
        ) : null}

        {/* Opens outward (requirement 5): stops the page dead-ending. */}
        {related.length > 0 ? (
          <section className="section charm-related">
            <div className="sec-head">
              <div>
                <h3>
                  More like this <span className="ja">似ているもの</span>
                </h3>
              </div>
            </div>
            <div className="related-grid">
              {related.map((r) => (
                <Link
                  href={`/charm/${r.id}`}
                  className="related-card"
                  key={r.id}
                  style={{ "--rc": charmColor(r) } as CSSProperties}
                >
                  <CharmThumb charm={toCharmView(r)} />
                  <span className="related-name">{r.name}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </article>
      <SiteFooter />
    </div>
  );
}
