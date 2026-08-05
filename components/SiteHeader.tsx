import Link from "next/link";

/** `"none"` matches neither switcher link — for a route that belongs to
 * neither view (the charm depth page), rather than defaulting to whichever
 * one it was most recently reached from. */
export type ActiveView = "map" | "browse" | "none";

const VIEWS: Array<{ key: ActiveView; href: string; label: string }> = [
  { key: "map", href: "/", label: "Map" },
  { key: "browse", href: "/browse", label: "Browse" },
];

/**
 * The wordmark, tagline and Map/Browse view switcher — the top half of the
 * shared chrome (see SiteHero for the rest), defined once and rendered by
 * every route. `active` is passed explicitly by the calling page rather than
 * derived from the pathname: every route is a server component that already
 * knows which view it is, so there's no need for a client-side `usePathname`
 * just to answer that question.
 *
 * `sticky` (spec 0010 fix): opt-in, since `/` can't afford a permanently
 * docked header on top of its already-tight hero + map vertical budget.
 * `/browse` passes it so there's always a way back to the map on screen,
 * however far down the 54-card grid the page has scrolled.
 */
export default function SiteHeader({
  active,
  sticky,
}: {
  active: ActiveView;
  sticky?: boolean;
}) {
  return (
    <header className={`top${sticky ? " is-sticky" : ""}`}>
      <div className="brand">
        <div className="seal" aria-hidden="true">
          巡
        </div>
        <div>
          <h1>Meguru</h1>
          <div className="sub">Gotochi Hello Kitty · 全国めぐり</div>
        </div>
      </div>
      <nav className="switcher" aria-label="View switcher">
        {VIEWS.map((view) => (
          <Link
            key={view.key}
            href={view.href}
            className={`switch-link${active === view.key ? " active" : ""}`}
            aria-current={active === view.key ? "page" : undefined}
          >
            {view.label}
          </Link>
        ))}
      </nav>
      <div className="tagline">巡る — collect the country</div>
    </header>
  );
}
