"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { DesignView } from "@/lib/charms";
import { hasPhoto } from "@/lib/charms";
import CharmStrip from "./CharmStrip";
import { REGIONS, REGION_LIST, regionForCode, type RegionKey } from "@/lib/regions";
import { PREFECTURES } from "@/lib/prefectures";
import { PREFECTURE_BOUNDS, REGION_BOUNDS, type Bounds } from "@/lib/map-bounds";
import JapanMapSvg from "./JapanMapSvg";
import MapPanel, { type PanelView } from "./MapPanel";

/** The map's native coordinate space -- JapanMapSvg's `viewBox="0 0 1000 1000"`,
 * already in `[x, y, width, height]` viewBox-attribute form. */
/* The two transforms wrapping every prefecture group in JapanMapSvg. The selection
   outline is rendered at the SVG root (after all geometry, so nothing paints over it),
   so it has to re-apply this chain to land in the same place as the prefecture. */
const OUTER_TRANSFORM =
  "matrix(1.028807, 0, 0, 1.028807, -47.544239, -28.806583) matrix(1, 0, 0, 1, 6, 18)";

const FULL_VIEW_BOX: [number, number, number, number] = [0, 0, 1000, 1000];
/** Matches the prototype's `animateVB` easing/duration. */
const ZOOM_DURATION_MS = 650;
const DISCOVER_PRESS_MS = 360;

/** Padding added on each side of a framed box, as a fraction of its (square) side. */
const FRAME_PAD_FRACTION = 0.12;
/** Minimum framed side, in root viewBox units -- otherwise the smallest
 * prefectures (Saga, Kanagawa, Kagawa, Okinawa, Osaka are ~42-49 units
 * across) zoom past 20x with no surrounding context. */
const FRAME_MIN_SIDE = 120;

/**
 * The three-level drill-down state this component navigates between. `code`
 * (prefecture) implies `regionKey`; `anchorCode`, present only on some
 * `region`-level states, is a *framing* hint -- the prefecture whose click
 * produced this region view (or that we're backing out of) -- so
 * `computeTargetViewBox` can keep it in frame even when the region's own
 * bounds don't include it (Okinawa's inset, see requirement 5).
 */
type ExplorerState =
  | { level: "japan" }
  | { level: "region"; regionKey: RegionKey; anchorCode?: number }
  | { level: "prefecture"; regionKey: RegionKey; code: number };

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Bounding-box union in the shared `[x1, y1, x2, y2]` form used by `lib/map-bounds`. */
function unionBounds(a: Bounds, b: Bounds): Bounds {
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];
}

/**
 * Turns a constant `[x1, y1, x2, y2]` box from `lib/map-bounds` into a
 * `viewBox`-ready `[x, y, width, height]`, in the order the spec requires:
 *  1. square it (side = max(width, height), centred on the box's centre) --
 *     `#jpmap` is `width: 100%; height: auto` with no `preserveAspectRatio`,
 *     so a non-square viewBox changes the element's own intrinsic aspect
 *     ratio and collapses its rendered height;
 *  2. pad by ~12% of the side, so the subject isn't flush against the edge;
 *  3. floor the side at ~120 units, so small prefectures still render with
 *     surrounding context instead of a blurred close-up;
 *  4. clamp inside `0 0 1000 1000` by shifting (never shrinking), so the
 *     side stays square even at the edges of the map.
 */
function frameBounds([x1, y1, x2, y2]: Bounds): [number, number, number, number] {
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;

  let side = Math.max(x2 - x1, y2 - y1);
  side *= 1 + 2 * FRAME_PAD_FRACTION;
  side = Math.max(side, FRAME_MIN_SIDE);
  side = Math.min(side, 1000);

  let x = cx - side / 2;
  let y = cy - side / 2;
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  if (x + side > 1000) x = 1000 - side;
  if (y + side > 1000) y = 1000 - side;

  return [x, y, side, side];
}

/** The viewBox target for a given drill-down state, from the precomputed
 * constants in `lib/map-bounds` -- never measured from the DOM (see the
 * module docblock on why `getCTM`/`getBoundingClientRect` are wrong here). */
function computeTargetViewBox(state: ExplorerState): [number, number, number, number] {
  if (state.level === "japan") return FULL_VIEW_BOX;

  if (state.level === "prefecture") {
    const box = PREFECTURE_BOUNDS[state.code];
    return box ? frameBounds(box) : FULL_VIEW_BOX;
  }

  const regionBox = REGION_BOUNDS[state.regionKey];
  if (!regionBox) return FULL_VIEW_BOX;

  // Keep the prefecture that triggered this region view in frame. With Okinawa
  // now its own region, no region's bounds exclude one of its own prefectures,
  // so this is a plain union with no special case.
  const anchorBox =
    state.anchorCode != null ? PREFECTURE_BOUNDS[state.anchorCode] : undefined;
  return frameBounds(anchorBox ? unionBounds(regionBox, anchorBox) : regionBox);
}

/** Zooming out one level -- the transition for clicking an empty prefecture,
 * the SVG background, or a panel's back control (requirement 3 / 8). */
function zoomOutOneLevel(state: ExplorerState): ExplorerState {
  switch (state.level) {
    case "prefecture":
      // Anchor on the prefecture we're leaving so it stays in frame even if
      // its region's own bounds don't cover it (the Okinawa case).
      return { level: "region", regionKey: state.regionKey, anchorCode: state.code };
    case "region":
      return { level: "japan" };
    case "japan":
      return state;
  }
}

/** The full level-model transition for clicking a prefecture shape
 * (requirement 2). `hasCharms` distinguishes a drill-in target from an empty
 * prefecture, which always just zooms out one level (requirement 3). */
function clickPrefecture(state: ExplorerState, code: number, hasCharms: boolean): ExplorerState {
  if (!hasCharms) return zoomOutOneLevel(state);

  const region = regionForCode(code);
  if (!region) return zoomOutOneLevel(state);

  switch (state.level) {
    case "japan":
      return { level: "region", regionKey: region, anchorCode: code };
    case "region":
      if (state.regionKey === region) {
        return { level: "prefecture", regionKey: region, code };
      }
      return { level: "japan" };
    case "prefecture":
      if (state.code === code) return state;
      return { level: "region", regionKey: state.regionKey, anchorCode: state.code };
  }
}

/**
 * Wraps the static <JapanMapSvg> in the prototype's mapcard frame: region
 * legend chips, the tinted/clickable map, a Discover stamp, and a drill-down
 * side panel that mirrors a three-level state machine (all-Japan -> region
 * -> prefecture; see `ExplorerState` above).
 *
 * There are deliberately no pins (removed in 0003a): the prefecture shape
 * itself is the click target, `cursor: pointer` + the `.has:hover` fill swap
 * are the only affordance that a shape is interactive.
 *
 * Zoom targets come from the precomputed `lib/map-bounds` constants, not
 * from measuring the DOM: an animating `viewBox` moves the very "nearest
 * viewport" that `getCTM()`/`getScreenCTM()` resolve against, and
 * `getBoundingClientRect()` is screen space (layout/scroll dependent) --
 * both wrong for a value that's being read *during* the animation it drives.
 *
 * All 47 prefecture click/keyboard handlers are attached once via event
 * delegation on the SVG root (rather than one listener per shape), since the
 * SVG itself is a static, unchanging blob of markup.
 *
 * `charms` is one entry per design (never per item, see spec 0005) — every
 * count derived from it below (per-prefecture, per-region, the map-wide
 * total) is therefore design-based: owning a second copy of one design
 * never changes how many prefectures/regions/charms the map reports.
 */
export default function MapExplorer({ charms }: { charms: DesignView[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  // Geometry of the selected prefecture, re-drawn on top as an outline.
  const [selOutline, setSelOutline] = useState<{ transform: string; html: string } | null>(null);
  const prefEls = useRef<Map<number, SVGGElement>>(new Map());
  const curViewBox = useRef<[number, number, number, number]>(FULL_VIEW_BOX);
  const animationFrame = useRef<number | null>(null);
  const discoverTimeout = useRef<number | null>(null);
  const discoverBtnRef = useRef<HTMLButtonElement>(null);
  // Discover's no-repeat window (D2): most-recent-first design ids, trimmed
  // to WINDOW on every pick. A ref, not state -- it must never itself
  // trigger a re-render; only the picks it produces do that.
  const recentPicks = useRef<number[]>([]);

  const [state, setState] = useState<ExplorerState>({ level: "japan" });
  // The charm Discover most recently surfaced, if any -- drives the panel's
  // "charm" state independently of the map's own drill-down level (D7).
  // Cleared by every *other* interaction (a prefecture/region click, the
  // legend's All Japan chip, a panel's back control) so navigating away from
  // a discovered charm falls straight back through the normal panel states.
  const [discoveredCharm, setDiscoveredCharm] = useState<{
    design: DesignView;
    region: RegionKey | null;
  } | null>(null);

  // Prefecture codes the collection reaches, grouped into their designs.
  // Collabs (prefectureCode === null) don't belong to the map.
  const byCode = useMemo(() => {
    const map = new Map<number, DesignView[]>();
    for (const charm of charms) {
      if (charm.prefectureCode == null) continue;
      const list = map.get(charm.prefectureCode);
      if (list) list.push(charm);
      else map.set(charm.prefectureCode, [charm]);
    }
    return map;
  }, [charms]);

  const reachedCodes = useMemo(() => Array.from(byCode.keys()), [byCode]);

  const regionCounts = useMemo(() => {
    const counts = {} as Record<RegionKey, number>;
    for (const region of REGION_LIST) {
      counts[region.key] = region.codes.reduce(
        (sum, code) => sum + (byCode.get(code)?.length ?? 0),
        0
      );
    }
    return counts;
  }, [byCode]);

  const totalCharms = useMemo(
    () => charms.filter((c) => c.prefectureCode != null).length,
    [charms]
  );

  // Tint every prefecture by its region (full strength where reached, a pale
  // wash where not -- see globals.css), and make charm-bearing ones
  // interactive: `has` class (cursor + hover), keyboard-focusable, and
  // aria-labelled. Runs before paint so there's no flash of an untinted or
  // non-interactive map. Empty prefectures never get a tabindex/role/label,
  // so they never look interactive at the japan level.
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const map = new Map<number, SVGGElement>();
    svg.querySelectorAll<SVGGElement>(".prefecture[data-code]").forEach((g) => {
      const code = Number(g.getAttribute("data-code"));
      map.set(code, g);

      const regionKey = regionForCode(code);
      if (regionKey) g.style.setProperty("--rc", REGIONS[regionKey].color);

      const list = byCode.get(code);
      const has = !!list && list.length > 0;
      g.classList.toggle("has", has);

      if (has) {
        const name = PREFECTURES[code];
        const label = name?.en ?? `Prefecture ${code}`;
        g.setAttribute("tabindex", "0");
        g.setAttribute("role", "button");
        g.setAttribute("aria-label", `${label} — ${list!.length} charm${list!.length > 1 ? "s" : ""}`);
      } else {
        g.removeAttribute("tabindex");
        g.removeAttribute("role");
        g.removeAttribute("aria-label");
      }
    });
    prefEls.current = map;
  }, [byCode]);

  const animateViewBox = useCallback((target: [number, number, number, number]) => {
    const svg = svgRef.current;
    if (!svg) return;

    if (animationFrame.current != null) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }

    if (prefersReducedMotion()) {
      curViewBox.current = target;
      svg.setAttribute("viewBox", target.join(" "));
      return;
    }

    const start = curViewBox.current;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / ZOOM_DURATION_MS);
      const eased = 1 - Math.pow(1 - p, 3);
      const vb = start.map((s, i) => s + (target[i] - s) * eased) as [
        number,
        number,
        number,
        number
      ];
      curViewBox.current = vb;
      svg.setAttribute("viewBox", vb.join(" "));
      if (p < 1) {
        animationFrame.current = requestAnimationFrame(step);
      } else {
        animationFrame.current = null;
      }
    };
    animationFrame.current = requestAnimationFrame(step);
  }, []);

  // Selected-prefecture highlight (the vermilion `.selected` treatment).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.querySelectorAll(".prefecture.selected").forEach((g) => g.classList.remove("selected"));
    if (state.level === "prefecture") {
      prefEls.current.get(state.code)?.classList.add("selected");
      const sel = prefEls.current.get(state.code);
      setSelOutline(
        sel
          ? {
              transform: `${OUTER_TRANSFORM} ${sel.getAttribute("transform") ?? ""}`.trim(),
              html: sel.innerHTML,
            }
          : null
      );
    } else {
      setSelOutline(null);
    }
  }, [state]);

  // Dim prefectures outside the active region (region level, and the
  // prefecture level nested within it).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (state.level !== "japan") {
      svg.classList.add("filtered");
      const codes = new Set(REGIONS[state.regionKey].codes);
      prefEls.current.forEach((el, code) => {
        el.classList.toggle("in-region", codes.has(code));
      });
    } else {
      svg.classList.remove("filtered");
      prefEls.current.forEach((el) => el.classList.remove("in-region"));
    }
  }, [state]);

  // Zoom whenever the level-model state changes.
  useEffect(() => {
    animateViewBox(computeTargetViewBox(state));
  }, [state, animateViewBox]);

  // Click + keyboard delegation on the SVG root: 47 prefectures, one pair of
  // listeners. `closest(".prefecture")` matches ANY prefecture (not just
  // charm-bearing ones), since clicking an empty one -- or the background,
  // where `closest` finds nothing -- zooms out one level rather than doing
  // nothing; `.has` is checked separately to pick drill-in vs. zoom-out.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleClick = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return;
      const el = e.target.closest(".prefecture");
      if (!el) {
        setDiscoveredCharm(null);
        setState(zoomOutOneLevel);
        return;
      }
      const code = Number(el.getAttribute("data-code"));
      if (!Number.isFinite(code)) {
        setDiscoveredCharm(null);
        setState(zoomOutOneLevel);
        return;
      }
      const hasCharms = el.classList.contains("has");
      setDiscoveredCharm(null);
      setState((prev) => clickPrefecture(prev, code, hasCharms));
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      if (!(e.target instanceof Element)) return;
      // Only charm-bearing prefectures ever carry a tabindex, so this only
      // ever fires for a `.has` shape -- same drill-in transitions as click.
      const el = e.target.closest(".prefecture.has");
      if (!el) return;
      const code = Number(el.getAttribute("data-code"));
      if (!Number.isFinite(code)) return;
      e.preventDefault();
      setDiscoveredCharm(null);
      setState((prev) => clickPrefecture(prev, code, true));
    };

    svg.addEventListener("click", handleClick);
    svg.addEventListener("keydown", handleKeydown);
    return () => {
      svg.removeEventListener("click", handleClick);
      svg.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  // Cancel any in-flight zoom animation / pending Discover jump on unmount.
  useEffect(() => {
    return () => {
      if (animationFrame.current != null) cancelAnimationFrame(animationFrame.current);
      if (discoverTimeout.current != null) window.clearTimeout(discoverTimeout.current);
    };
  }, []);

  // Region chips jump straight to that region from any level.
  const selectRegion = useCallback((region: RegionKey) => {
    setDiscoveredCharm(null);
    setState({ level: "region", regionKey: region });
  }, []);

  // "All Japan" always returns to the top level.
  const resetToOverview = useCallback(() => {
    setDiscoveredCharm(null);
    setState({ level: "japan" });
  }, []);

  // The prefecture panel's "← Back" control: same transition as clicking
  // outside the focused prefecture (requirement 8).
  const backToRegion = useCallback(() => {
    setDiscoveredCharm(null);
    setState(zoomOutOneLevel);
  }, []);

  // Picking a card in the region/prefecture panel (spec 0010 fix): switches
  // the panel into that charm's preview in place. At the region level the
  // map is still zoomed out on the whole region, so this also flies to the
  // specific charm's prefecture, same as Discover's jump -- just without the
  // press/spin animation or its timeout, since this is a direct click on a
  // card, not the dice roll, and should feel immediate.
  const selectCharm = useCallback((design: DesignView) => {
    const region = design.prefectureCode != null ? regionForCode(design.prefectureCode) : null;
    setDiscoveredCharm({ design, region });
    // Fly to the charm's prefecture, the same as Discover's jump. Idempotent
    // when the panel is already at that prefecture; the point is the region
    // level, where the map would otherwise stay zoomed out on the whole region
    // while the panel showed one specific charm.
    if (design.prefectureCode != null && region) {
      setState({ level: "prefecture", regionKey: region, code: design.prefectureCode });
    }
  }, []);

  const handleDiscover = useCallback(() => {
    // The pool is the owned designs, placeless included (D1) -- `charms` is
    // already exactly that (app/page.tsx hands MapExplorer the items.length > 0
    // filter, never the documented-only designs) -- narrowed to those that can
    // show a photograph. Discover is the one surface that chooses *for* the
    // visitor, so handing them a placeholder is a worse outcome than skipping
    // that charm; every charm remains reachable by drilling into its
    // prefecture. Falls back to the whole pool if nothing has a photo yet, so
    // the button can never become a no-op.
    const withPhoto = charms.filter(hasPhoto);
    const pool = withPhoto.length > 0 ? withPhoto : charms;
    if (pool.length === 0) return;

    // No-repeat window (D2): exclude the most recent WINDOW picks. The
    // `Math.max(0, …)` guard matters for a tiny collection -- with one charm
    // the window is 0 and Discover still has something to pick instead of
    // nothing.
    const WINDOW = Math.min(5, Math.max(0, pool.length - 1));
    const excluded = new Set(recentPicks.current);
    let candidates = pool.filter((c) => !excluded.has(c.id));
    // The exclusion can never actually empty the pool at this WINDOW size,
    // but fall back to the full pool rather than have nothing to pick from.
    if (candidates.length === 0) candidates = pool;

    // Randomness lives here, in the click handler -- never during render --
    // so there's nothing for hydration to disagree about.
    const design = candidates[Math.floor(Math.random() * candidates.length)];
    recentPicks.current = [design.id, ...recentPicks.current].slice(0, WINDOW);

    const region = design.prefectureCode != null ? regionForCode(design.prefectureCode) : null;
    const reduceMotion = prefersReducedMotion();

    const btn = discoverBtnRef.current;
    if (btn && !reduceMotion) {
      btn.classList.remove("spin");
      void btn.offsetWidth; // force reflow so the press animation restarts
      btn.classList.add("spin");
    }

    if (discoverTimeout.current != null) {
      window.clearTimeout(discoverTimeout.current);
      discoverTimeout.current = null;
    }
    // A placed charm flies the map to its prefecture, on its region, exactly
    // as clicking that prefecture would (requirement 3 / 7). A placeless
    // charm (D3) returns the map to its resting all-Japan framing rather
    // than hiding it or faking a location -- nothing selected, nothing
    // in-region, same as the level nothing-chosen already renders.
    const jump = () => {
      setDiscoveredCharm({ design, region });
      setState(
        design.prefectureCode != null && region
          ? { level: "prefecture", regionKey: region, code: design.prefectureCode }
          : { level: "japan" }
      );
    };
    if (reduceMotion) {
      jump();
    } else {
      discoverTimeout.current = window.setTimeout(() => {
        jump();
        discoverTimeout.current = null;
      }, DISCOVER_PRESS_MS);
    }
  }, [charms]);

  const panelView: PanelView = useMemo(() => {
    // A Discover pick overrides whatever level the map itself is at -- it's
    // reset to null by every other interaction (see setDiscoveredCharm(null)
    // above), so this only ever wins right after a Discover click.
    if (discoveredCharm) {
      return { kind: "charm", design: discoveredCharm.design, region: discoveredCharm.region };
    }
    if (state.level === "prefecture") {
      return {
        kind: "prefecture",
        region: state.regionKey,
        code: state.code,
        charms: byCode.get(state.code) ?? [],
      };
    }
    if (state.level === "region") {
      return {
        kind: "region",
        region: state.regionKey,
        charms: REGIONS[state.regionKey].codes.flatMap((code) => byCode.get(code) ?? []),
      };
    }
    return {
      kind: "overview",
      totalCharms,
      prefecturesReached: reachedCodes.length,
      regionCounts,
    };
  }, [discoveredCharm, state, byCode, reachedCodes.length, regionCounts, totalCharms]);

  const hint =
    state.level === "prefecture"
      ? "Tap “← Back” to return to the region"
      : state.level === "region"
        ? "Tap a prefecture for its charms"
        : "Tap a region chip or a glowing prefecture to explore";

  // A drill-down shows that region's or prefecture's charms, in their own
  // order; the top level shows the whole pool, shuffled.
  const isDrilled = panelView.kind === "region" || panelView.kind === "prefecture";

  return (
    <section className="explore">
      <div className="explore-grid">
        <div className="mapcard">
          <div className="legend">
            <button
              type="button"
              className={`chip all${state.level === "japan" ? " active" : ""}`}
              onClick={resetToOverview}
            >
              <span className="sw" />
              All Japan
            </button>
            {REGION_LIST.map((region) => (
              <button
                key={region.key}
                type="button"
                className={`chip${
                  state.level !== "japan" && state.regionKey === region.key ? " active" : ""
                }`}
                style={{ "--rc": region.color } as CSSProperties}
                onClick={() => selectRegion(region.key)}
              >
                <span className="sw" />
                {region.en}
                <span className="cnt">{regionCounts[region.key]}</span>
              </button>
            ))}
          </div>
          <div className="mapstage">
            <JapanMapSvg ref={svgRef}>
              {selOutline ? (
                <g
                  className="sel-outline"
                  transform={selOutline.transform}
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: selOutline.html }}
                />
              ) : null}
            </JapanMapSvg>
            {/* Phone-only, see `.strip` in globals.css. It lives inside the
                stage rather than after it so it can be pinned to the map's own
                bottom edge -- overlaying the map costs no vertical space, which
                is the whole reason it replaces the panel here. At a region or
                prefecture it holds that drill-down's charms; at the top level,
                and for a charm surfaced by Discover, it holds the whole owned
                set so there is always something to swipe through. */}
            <CharmStrip
              charms={isDrilled ? panelView.charms : charms}
              focusId={discoveredCharm?.design.id ?? null}
              shuffle={!isDrilled}
            />
          </div>
          <div className="maptools">
            <div className="maptools-nav">
              {state.level !== "japan" ? (
                <button
                  type="button"
                  className="back-btn"
                  onClick={state.level === "prefecture" ? backToRegion : resetToOverview}
                >
                  {state.level === "prefecture" ? "\u2190 Region" : "\u2190 All Japan"}
                </button>
              ) : null}
              <span className="hint">{hint}</span>
            </div>
            <button
              type="button"
              className="discover"
              ref={discoverBtnRef}
              onClick={handleDiscover}
            >
              <span className="st" aria-hidden="true">
                巡
              </span>
              Discover a charm
            </button>
          </div>
        </div>

        <MapPanel
          view={panelView}
          onSelectRegion={selectRegion}
          onSelectCharm={selectCharm}
          onReset={resetToOverview}
          onBackToRegion={backToRegion}
        />
      </div>
    </section>
  );
}
