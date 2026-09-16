"use client";

import { useEffect, useMemo, useRef } from "react";
import type { DesignView } from "@/lib/charms";
import { charmColor, locationLabel, toCharmView } from "@/lib/charms";
import CharmThumb from "./CharmThumb";

/**
 * A vertical rail of charms between the map and the panel, on wide screens
 * only (see `.rail` in globals.css).
 *
 * The map answers "where", and the panel answers "what is this one" -- but
 * neither lets you scan the collection. A prefecture has to be clicked before
 * it shows anything, so a charm you would have stopped at is invisible until
 * you happen to drill into the right place. The rail puts the cut-outs
 * themselves on screen at all times, and it follows the same drill-down: the
 * whole owned set at the top level, a region's or prefecture's charms once you
 * are inside one.
 *
 * Clicking one does exactly what clicking its card in the panel does -- flies
 * the map to its prefecture and opens it in the panel. It is the same action,
 * reached from a picture instead of a list, so there is nothing new to learn
 * and no second idea of what "selected" means.
 *
 * Deliberately NOT the phone's centre-focus carousel. There the centred item is
 * the selection because there is nowhere else to show one; here the panel does
 * that, so the rail highlights whatever the panel is showing and otherwise
 * behaves like the list of pictures it looks like.
 */
export default function CharmRail({
  charms,
  selectedId,
  centreSelected = false,
  onSelect,
}: {
  charms: DesignView[];
  /** The charm the panel is currently showing, if any. */
  selectedId?: number | null;
  /** Put the selected charm in the middle of the rail rather than wherever it
   * happens to fall. Wanted for Discover, which can land on any charm in the
   * collection; not for a click on a tile, which is already in view and whose
   * neighbours should not jump around under the pointer. */
  centreSelected?: boolean;
  onSelect: (design: DesignView) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  // Rotated so the selected charm sits DEEP in the list rather than at its
  // middle. Two reasons.
  //
  // Scrolling alone cannot centre a charm near either end -- there is nothing
  // beyond it to scroll -- so a Discover pick in the first or last few would sit
  // against an edge however it was scrolled. Any rotation fixes that.
  //
  // But the middle also halves the runway. Putting the pick near the end and
  // starting from the top means the whole collection goes past on the way,
  // which is the point: Discover should feel like it reached across everything
  // to find this one. Duplicating the list would give more runway still, at the
  // cost of showing every charm twice once it settles -- the same repetition
  // that makes a looping rail read as a trick.
  //
  // Six from the end keeps it centrable: the rail shows about seven and a half
  // charms, so it still has half a rail below it to sit against.
  const list = useMemo(() => {
    if (!centreSelected || selectedId == null) return charms;
    const at = charms.findIndex((c) => c.id === selectedId);
    if (at < 0) return charms;
    const deep =
      charms.length >= 12 ? charms.length - 6 : Math.floor((charms.length - 1) / 2);
    const by = (at - deep + charms.length) % charms.length;
    return by === 0 ? charms : [...charms.slice(by), ...charms.slice(0, by)];
  }, [charms, selectedId, centreSelected]);

  // A selection made on the map or in the panel scrolls the rail to match, so
  // the highlight is never parked out of sight.
  useEffect(() => {
    if (selectedId == null) return;
    const track = trackRef.current;
    const el = track?.querySelector<HTMLElement>(`[data-id="${selectedId}"]`);
    if (!track || !el) return;

    const target = el.offsetTop + el.offsetHeight / 2 - track.clientHeight / 2;
    const max = track.scrollHeight - track.clientHeight;
    const settle = (at: number) => Math.max(0, Math.min(max, at));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      track.scrollTop = settle(target);
      return;
    }

    // Only Discover gets the long travel. Clicking a tile changes the selection
    // too, and running the same animation there flung the rail to the top and
    // scrolled back -- for a charm that was already under the pointer. That one
    // just needs to stay in view.
    if (!centreSelected) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    // From the very top, every time. The rotation above put the pick near the
    // end, so this runs the whole collection past on the way -- and starting
    // from a fixed place means the travel cannot collapse to nothing the way it
    // did when the target sat at a constant mid-list offset.
    track.scrollTop = 0;

    // Animated by hand rather than with behavior: "smooth", which gives no say
    // over how long it takes -- Chrome runs a 2000px scroll in roughly the same
    // blink as a 200px one, which is exactly what made this feel small. Eased
    // out over 900ms so it sets off quickly and arrives gently.
    const from = 0;
    const to = settle(target);
    const distance = to - from;
    const DURATION = 900;
    const started = performance.now();
    let id = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / DURATION);
      // ease-out cubic
      track.scrollTop = from + distance * (1 - Math.pow(1 - t, 3));
      if (t < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [selectedId, list, centreSelected]);

  if (list.length === 0) return null;

  return (
    <div className="rail" aria-label="Charms in view">
      <div className="rail-track" ref={trackRef}>
        {list.map((design) => {
          const selected = design.id === selectedId;
          return (
            <button
              key={design.id}
              type="button"
              data-id={design.id}
              className={`rail-item${selected ? " is-selected" : ""}`}
              style={{ "--rc": charmColor(toCharmView(design)) } as React.CSSProperties}
              aria-current={selected ? "true" : undefined}
              // The name is not drawn -- the tile is the point -- so it has to
              // reach a pointer and a screen reader some other way.
              title={`${design.name} — ${locationLabel(design)}`}
              aria-label={`${design.name}, ${locationLabel(design)}`}
              onClick={() => onSelect(design)}
            >
              <CharmThumb charm={toCharmView(design)} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
