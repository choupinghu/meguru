import { db } from "@/db";
import { toDesignView } from "@/lib/charms";
import MapExplorer from "@/components/MapExplorer";
import SiteHeader from "@/components/SiteHeader";
import SiteHero from "@/components/SiteHero";
import SiteFooter from "@/components/SiteFooter";

// This page queries Neon via Drizzle at request time. Force dynamic
// rendering so `next build` never tries to connect to the database.
export const dynamic = "force-dynamic";

export default async function Home() {
  const rows = await db.query.designs.findMany({ with: { items: true } });
  const designViews = rows.map((row) => toDesignView(row, row.items));
  // The map only ever shows what's actually owned, so it gets just the
  // designs with an item (should documented designs ever return).
  const ownedDesignViews = designViews.filter((d) => d.items.length > 0);

  return (
    <div className="meguru">
      <SiteHeader active="map" />
      <SiteHero />
      <MapExplorer charms={ownedDesignViews} />
      <SiteFooter />
    </div>
  );
}
