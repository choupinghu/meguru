import type { StatEntry } from "@/lib/stats";

/**
 * The hero copy and the live stat row — the bottom half of the shared
 * chrome (see SiteHeader for the top half). Identical on every route; the
 * numbers come from `lib/stats.ts`, computed once per page from the charm
 * list that page already queried for its own content.
 */
export default function SiteHero({ stats }: { stats: StatEntry[] }) {
  return (
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
  );
}
