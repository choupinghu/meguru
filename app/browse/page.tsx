import { db } from "@/db";
import { toDesignView } from "@/lib/charms";
import { buildStats } from "@/lib/stats";
import CharmCard from "@/components/CharmCard";
import SiteHeader from "@/components/SiteHeader";
import SiteHero from "@/components/SiteHero";
import SiteFooter from "@/components/SiteFooter";

// This page queries Neon via Drizzle at request time. Force dynamic
// rendering so `next build` never tries to connect to the database.
export const dynamic = "force-dynamic";

/**
 * The hybrid catalogue (0008b): all 54 designs — the 25 owned and the 29
 * documented-but-unowned — as a CharmCard in one responsive grid. Owned
 * cards render condition/price/status alongside motif; a documented design
 * has no item and so no condition/price/status to show, and `CharmCard`
 * renders it as an explicit "Documented" state rather than omitting it
 * (buildStats has always seen the full set for "Charms catalogued" — see
 * D6). Sorted owned-first, then documented, `id` ascending within each
 * block (D2) so the collection's on-page order does not shuffle. Deliberately
 * no story text here — that's the one thing this surface never shows (see
 * spec 0004/0008).
 */
export default async function BrowsePage() {
  const rows = await db.query.designs.findMany({ with: { items: true } });
  const designViews = rows.map((row) => toDesignView(row, row.items));
  const stats = buildStats(designViews);
  const ordered = [...designViews].sort((a, b) => {
    const aOwned = a.items.length > 0 ? 0 : 1;
    const bOwned = b.items.length > 0 ? 0 : 1;
    return aOwned - bOwned || a.id - b.id;
  });

  return (
    <div className="meguru">
      {/* Sticky (spec 0010 fix): / can't afford a docked header on top of its
          already-tight hero + map budget, but /browse is a long scroll of
          cards with no other way back to the map once you're past the hero. */}
      <SiteHeader active="browse" sticky />
      <SiteHero stats={stats} />
      <section className="section">
        <div className="sec-head">
          <div>
            <h3>
              Browse <span className="ja">一覧</span>
            </h3>
            <p>
              Every charm catalogued — the 25 in the collection, and 29 more
              documented but not owned.
            </p>
          </div>
        </div>
        <div className="charm-grid">
          {ordered.map((design) => (
            <CharmCard design={design} key={design.id} />
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
