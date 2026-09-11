"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { DesignView } from "@/lib/charms";
import { charmColor, locationLabel, toCharmView } from "@/lib/charms";
import CharmThumb from "./CharmThumb";

/**
 * A translucent, swipeable band of charms along the bottom of the map, shown
 * only on small screens (see `.strip` in globals.css).
 *
 * It replaces the drill-down panel on a phone. The panel works on a desktop
 * because it sits *beside* the map; stacked below it on a 393px screen the two
 * could never be seen at once, and a region's charms became a vertical list
 * several screens tall -- which defeated the point of a map you drill into.
 * Laid sideways over the map's own bottom edge the same content costs no
 * vertical space at all, and a whole region is one swipe rather than one scroll
 * per charm.
 *
 * Two stages, both inside the band, so the map never moves under you:
 *
 *   swipe            -- changes which charm is centred. Nothing else.
 *   tap the centre   -- the band grows upward into a card: cutout, place, two
 *                       lines of story, a link to the full record.
 *   tap a neighbour  -- centres it. Opening takes a second tap, so a
 *                       mis-registered swipe cannot fling you into a charm.
 *
 * Expanding upward from the bottom edge is deliberate: an earlier attempt put
 * this in a full-screen overlay, which covered the map it was meant to sit
 * beside. Here the top of the map -- including the prefecture still lit from
 * the drill-down -- stays visible above the card.
 *
 * The centre item is the selected one. CSS can snap the track but cannot tell
 * which item is centred, so an IntersectionObserver watches a narrow band down
 * the middle and marks whatever sits in it.
 *
 * Swiping deliberately does NOT move the map: every swipe animating the map
 * would make the thing restless, and the map is the stable frame you read the
 * band against.
 */
export default function CharmStrip({
  charms,
  focusId,
  shuffle = false,
}: {
  charms: DesignView[];
  /** A charm chosen elsewhere (Discover, or a card in the panel) -- scrolled to
   * the centre so the band and the rest of the page agree on the selection. */
  focusId?: number | null;
  /** Randomise the order. Wanted for the top-level pool, where the band is an
   * invitation to wander; never for a drill-down, where an order that reshuffles
   * as you navigate reads as a bug. */
  shuffle?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [centreId, setCentreId] = useState<number | null>(charms[0]?.id ?? null);
  // Which list the card was opened against, rather than a bare boolean. Drilling
  // into another region hands down a new `charms` array, so the card closes by
  // derivation -- no effect, and no frame where last region's charm hangs over
  // the new map.
  const [openedFor, setOpenedFor] = useState<DesignView[] | null>(null);
  const expanded = openedFor === charms;
  const setExpanded = useCallback(
    (next: boolean) => setOpenedFor(next ? charms : null),
    [charms]
  );

  // Randomness after mount, never during render: the server and the first
  // client render must agree or hydration complains.
  // Tagged with the list it was built from, so a shuffle never outlives the
  // charms it ordered.
  const [order, setOrder] = useState<{ for: DesignView[]; list: DesignView[] } | null>(null);
  useEffect(() => {
    if (!shuffle || charms.length < 3) return;
    const shuffled = [...charms];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // Deferred a frame rather than set synchronously: the state is not
    // synchronising an external system, it is a one-off reorder, and setting
    // it inside the effect body cascades a second render before paint.
    const id = requestAnimationFrame(() => setOrder({ for: charms, list: shuffled }));
    return () => cancelAnimationFrame(id);
  }, [charms, shuffle]);

  const list = order?.for === charms ? order.list : charms;

  const setTrack = useCallback((node: HTMLDivElement | null) => {
    trackRef.current = node;
  }, []);

  // Whichever item overlaps the middle 10% of the track is the centre.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = Number((entry.target as HTMLElement).dataset.id);
          if (!Number.isNaN(id)) setCentreId(id);
        }
      },
      { root: track, rootMargin: "0px -45% 0px -45%", threshold: 0 }
    );
    track.querySelectorAll<HTMLElement>("[data-id]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [list]);

  const centreOn = useCallback((id: number) => {
    const track = trackRef.current;
    track?.querySelector<HTMLElement>(`[data-id="${id}"]`)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      inline: "center",
      block: "nearest",
    });
  }, []);

  // A new list starts at its first charm. The track is the same DOM node across
  // a drill-down, so without this its scroll position survives into a shorter
  // list: switching from the 34-charm pool to a 7-charm region left the band
  // parked at the far end, showing the last charm and three blanks.
  useEffect(() => {
    if (focusId != null) return;
    const track = trackRef.current;
    if (!track) return;
    track.scrollLeft = 0;
    const id = requestAnimationFrame(() => setCentreId(list[0]?.id ?? null));
    return () => cancelAnimationFrame(id);
  }, [list, focusId]);

  // A selection made elsewhere pulls the band to it.
  useEffect(() => {
    if (focusId == null) return;
    centreOn(focusId);
  }, [focusId, list, centreOn]);

  // Escape closes the card, matching every other dismissable thing on the site.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, setExpanded]);

  if (list.length === 0) return null;
  const centre = list.find((c) => c.id === centreId) ?? list[0];

  return (
    <div className={`strip${expanded ? " is-open" : ""}`}>
      {expanded ? (
        <div className="strip-card">
          <button
            type="button"
            className="strip-close"
            onClick={() => setExpanded(false)}
            aria-label="Close this charm"
          >
            <span aria-hidden="true">⌄</span>
          </button>
          <div
            className="strip-card-art"
            style={{ "--rc": charmColor(toCharmView(centre)) } as React.CSSProperties}
          >
            <CharmThumb charm={toCharmView(centre)} />
          </div>
          <div className="strip-card-body">
            <h4>{centre.name}</h4>
            {centre.nameJa ? <div className="cja">{centre.nameJa}</div> : null}
            <div className="loc">{locationLabel(centre)}</div>
            {centre.story ? <p className="strip-card-story">{centre.story}</p> : null}
            <Link href={`/charm/${centre.id}`} className="strip-more">
              Full record →
            </Link>
          </div>
        </div>
      ) : (
        <div className="strip-label" aria-live="polite">
          <b>{centre.name}</b>
          <span>{locationLabel(centre)}</span>
        </div>
      )}
      <div className="strip-track" ref={setTrack}>
        {list.map((design) => {
          const isCentre = design.id === centreId;
          return (
            <button
              key={design.id}
              type="button"
              data-id={design.id}
              className={`strip-item${isCentre ? " is-centre" : ""}`}
              style={{ "--rc": charmColor(toCharmView(design)) } as React.CSSProperties}
              aria-label={
                isCentre ? `${design.name} — open this charm` : `${design.name} — bring to centre`
              }
              onClick={() => {
                if (isCentre) setExpanded(!expanded);
                else {
                  setExpanded(false);
                  centreOn(design.id);
                }
              }}
            >
              <CharmThumb charm={toCharmView(design)} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
