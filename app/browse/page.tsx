import { db } from "@/db";
import { charms } from "@/db/schema";
import { toCharmView } from "@/lib/charms";
import { buildStats } from "@/lib/stats";
import CharmCard from "@/components/CharmCard";
import SiteHeader from "@/components/SiteHeader";
import SiteHero from "@/components/SiteHero";
import SiteFooter from "@/components/SiteFooter";

// This page queries Neon via Drizzle at request time. Force dynamic
// rendering so `next build` never tries to connect to the database.
export const dynamic = "force-dynamic";

/**
 * The standalone catalogue: every charm (including off-the-map collabs) as
 * a CharmCard in the responsive grid, for scanning and comparing condition
 * against price, rarity, status and motif. Deliberately no story text here
 * — that's the one thing this surface never shows (see spec 0004/0008) —
 * and cards are not yet links (they become `/charm/[id]` links in 0008).
 */
export default async function BrowsePage() {
  const rows = await db.select().from(charms);
  const charmViews = rows.map(toCharmView);
  const stats = buildStats(charmViews);

  return (
    <div className="meguru">
      <SiteHeader active="browse" />
      <SiteHero stats={stats} />
      <section className="section">
        <div className="sec-head">
          <div>
            <h3>
              Browse <span className="ja">一覧</span>
            </h3>
            <p>
              Every charm in the collection, specs at a glance — condition
              paired with price, rarity, status and motif.
            </p>
          </div>
        </div>
        <div className="charm-grid">
          {charmViews.map((charm) => (
            <CharmCard charm={charm} key={charm.id} />
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
