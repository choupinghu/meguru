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
      {/* Headline and copy together, so the stats can sit beside them rather
          than under them on a wide screen -- see `.hero` in globals.css. */}
      <div className="hero-copy">
        <h2>
          Every charm a <em>postcard</em>
        </h2>
        {/* Written as short self-contained lines rather than prose with the full
            stops swapped out (owner, 2026-08-12). Each line stands alone, so the
            breaks carry the pauses that punctuation would. Kept as one <p> so it
            stays a single paragraph to a screen reader.

            The examples that used to sit here (apples in Aomori, gold leaf in
            Kanazawa, a shīsā in Okinawa) were cut: the map underneath is the
            demonstration, so listing them was telling what the page is about to
            show. Say what a visitor cannot work out by looking, and stop.

            "Wander" for 巡る takes a small liberty: 巡る is to go around, tour, make
            a circuit, and carries a sense of route that wandering does not. It is
            used because MapPanel already translates 巡ってみましょう the same way, so
            the site says one thing rather than two.

            Three lines doing three jobs: what the object is, what the name means,
            then the invitation. "One charm at a time" is salvaged from the eyebrow
            that was cut -- the cadence was never the problem there, "collect the
            country" was, and it works against a verb that fits.

            The warmth sits in "Let's" rather than "together". That drops the comma,
            which was the only punctuation left in the hero and conspicuous for it,
            and it mirrors the site's own Japanese: MapPanel says 巡ってみましょう,
            and ましょう is exactly this form.

            Rewritten 2026-11-10 (owner). "Souvenirs", because a gotochi charm is
            bought on the trip itself. "Each corner of Japan" rather than "region"
            or "prefecture", since no one level is right: the collection has
            cities, a sightseeing boat, a motorway service area and an aquarium.
            Japanese on one line only -- ご当地 was dropped from the first so two
            lines in a row do not read as a glossary -- and 巡る stays, being the
            name. The third line went through "Explore the rich local character
            of Japan" ("rich" read as selling), relaxed verbs (stroll, meander),
            openers for an invitation between equals ("tag along" and "follow" put
            the visitor behind), and "Let's discover", before the owner settled on
            "Come explore": a plain invitation, without the sales word. Its "!" is
            the hero's only punctuation, kept on purpose for the warmth. */}
        {/* One span per statement, not <br>: at these lengths each wraps to two
            rows on a phone, and with plain breaks the three ran together into one
            six-row block. A span per statement lets globals.css put a little air
            between statements, so the line still does the pausing. */}
        <p className="hero-lines">
          <span>Gotochi Hello Kitty are souvenirs unique to each corner of Japan</span>
          <span>Meguru (巡る) means to wander from place to place</span>
          <span>Come explore Japan one charm at a time!</span>
        </p>
      </div>
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
