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
      {/* No eyebrow above the headline (owner, 2026-08-12). Two rewrites of
          "Collect the …, one … at a time" both read oddly, and the headline
          carries the idea on its own. */}
      <h2>
        Every charm a <em>postcard</em>
      </h2>
      {/* Written as short self-contained lines rather than prose with the full
          stops swapped out (owner, 2026-08-12). Each line stands alone, so the
          breaks carry the pauses that punctuation would. Kept as one <p> so it
          stays a single paragraph to a screen reader. */}
      <p className="hero-lines">
        Gotochi (ご当地) Hello Kitty are unique to the region that made them
        <br />
        Apples in Aomori, gold leaf in Kanazawa, a shīsā in Okinawa
        <br />
        Meguru means to go around
        <br />
        Wander the map, wander the collection
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
