import { db } from "@/db";
import { charms } from "@/db/schema";
import { toCharmView } from "@/lib/charms";
import { REGION_LIST } from "@/lib/regions";
import CharmCard from "@/components/CharmCard";

// This page queries Neon via Drizzle at request time. Force dynamic
// rendering so `next build` never tries to connect to the database.
export const dynamic = "force-dynamic";

export default async function Home() {
  const rows = await db.select().from(charms);
  const charmViews = rows.map(toCharmView);

  const prefecturesReached = new Set(
    charmViews.filter((c) => c.prefectureCode != null).map((c) => c.prefectureCode)
  ).size;
  const rareAndGrail = charmViews.filter(
    (c) => c.rarity === "rare" || c.rarity === "grail"
  ).length;

  const stats: Array<{ value: number; label: string }> = [
    { value: charmViews.length, label: "Charms catalogued" },
    { value: prefecturesReached, label: "Prefectures reached" },
    { value: REGION_LIST.length, label: "Regions" },
    { value: rareAndGrail, label: "Rare & grail" },
  ];

  return (
    <div className="meguru">
      <header className="top">
        <div className="brand">
          <div className="seal" aria-hidden="true">
            巡
          </div>
          <div>
            <h1>Meguru</h1>
            <div className="sub">Gotochi Hello Kitty · 全国めぐり</div>
          </div>
        </div>
        <div className="tagline">巡る — collect the country</div>
      </header>

      <section className="hero">
        <div className="eyebrow">Collect the country, one region at a time</div>
        <h2>
          Every charm is a <em>postcard</em> from somewhere in Japan.
        </h2>
        <p>
          Gotochi (ご当地) Hello Kitty are made region by region — apples in
          Aomori, gold leaf in Kanazawa, a shīsā in Okinawa. Meguru maps a
          personal collection onto the country it came from, so you can
          wander it the way you&apos;d wander Japan.
        </p>
        <div className="stat-row">
          {stats.map((stat) => (
            <div className="stat" key={stat.label}>
              <b>{stat.value}</b>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sec-head">
          <div>
            <h3>
              All charms <span className="ja">全ての棚</span>
            </h3>
            <p>
              Every charm in the collection, browsable here while the map and
              revolving shelf are being built.
            </p>
          </div>
        </div>
        <div className="charm-grid">
          {charmViews.map((charm) => (
            <CharmCard charm={charm} key={charm.id} />
          ))}
        </div>
      </section>

      <footer>
        <span>
          Made with <span className="mark">巡</span> Meguru — a working
          prototype, seeded with representative charms.
        </span>
        <span>
          &quot;Hello Kitty&quot; and &quot;Gotochi Kitty&quot; are trademarks
          of Sanrio Co., Ltd. Meguru is an independent collector&apos;s
          catalogue and is not affiliated with or endorsed by Sanrio.
        </span>
      </footer>
    </div>
  );
}
