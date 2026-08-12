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
      <div className="eyebrow">Collect the culture, one charm at a time</div>
      <h2>
        Every charm a <em>postcard</em>.
      </h2>
      <p>
        Gotochi (ご当地) Hello Kitty are unique to the region that made them.
        Apples in Aomori, gold leaf in Kanazawa, a shīsā in Okinawa. Meguru
        means to go around, and that is what this is: a collection mapped
        back onto the country it came from, so you wander one by wandering
        the other.
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
