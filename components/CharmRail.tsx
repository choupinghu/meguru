"use client";

import { useEffect, useRef } from "react";
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
  onSelect,
}: {
  charms: DesignView[];
  /** The charm the panel is currently showing, if any. */
  selectedId?: number | null;
  onSelect: (design: DesignView) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  // A selection made on the map or in the panel scrolls the rail to match, so
  // the highlight is never parked out of sight.
  useEffect(() => {
    if (selectedId == null) return;
    const el = trackRef.current?.querySelector<HTMLElement>(`[data-id="${selectedId}"]`);
    el?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "nearest",
    });
  }, [selectedId, charms]);

  if (charms.length === 0) return null;

  return (
    <div className="rail" aria-label="Charms in view">
      <div className="rail-track" ref={trackRef}>
        {charms.map((design) => {
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
