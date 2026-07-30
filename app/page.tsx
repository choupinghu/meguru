import { db } from "@/db";
import { charms } from "@/db/schema";
import { toCharmView } from "@/lib/charms";
import { buildStats } from "@/lib/stats";
import MapExplorer from "@/components/MapExplorer";
import SiteHeader from "@/components/SiteHeader";
import SiteHero from "@/components/SiteHero";
import SiteFooter from "@/components/SiteFooter";

// This page queries Neon via Drizzle at request time. Force dynamic
// rendering so `next build` never tries to connect to the database.
export const dynamic = "force-dynamic";

export default async function Home() {
  const rows = await db.select().from(charms);
  const charmViews = rows.map(toCharmView);
  const stats = buildStats(charmViews);

  return (
    <div className="meguru">
      <SiteHeader active="map" />
      <SiteHero stats={stats} />
      <MapExplorer charms={charmViews} />
      <SiteFooter />
    </div>
  );
}
