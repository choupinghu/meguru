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
  seed = 0,
  shuffle = false,
  focusedCode = null,
  onFocusPrefecture,
}: {
  charms: DesignView[];
  /** A charm chosen elsewhere (Discover, or a card in the panel) -- scrolled to
   * the centre so the band and the rest of the page agree on the selection. */
  focusId?: number | null;
  /** Randomise the order. Wanted for the top-level pool, where the band is an
   * invitation to wander; never for a drill-down, where an order that reshuffles
   * as you navigate reads as a bug. */
  shuffle?: boolean;
  /** Changes every time the visitor moves the map. Re-rotates the charms, so
   * entering a region twice does not put the same charm under you -- which the
   * charms themselves cannot signal, since re-entering hands down exactly the
   * same ones. */
  seed?: number;
  /** The prefecture the map is currently focused on, or null. Decides whether a
   * tap on the centred charm focuses the map or opens the record. */
  focusedCode?: number | null;
  /** Fly the map to this charm's prefecture, opening nothing. */
  onFocusPrefecture?: (design: DesignView) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [centreId, setCentreId] = useState<number | null>(
    charms[Math.floor((charms.length - 1) / 2)]?.id ?? null
  );
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
  // Tagged with the CONTENTS it was built from, not the array identity. The
  // parent rebuilds this array on unrelated state changes -- selecting a charm
  // recomputes the panel view -- so an identity tag stopped matching moments
  // after it was set and the band silently fell back to the unrotated order.
  // That is why a three-charm region still opened on the same charm most of the
  // time even though the rotation was running every single entry.
  const key = `${seed}:${charms.map((c) => c.id).join(",")}`;
  const [order, setOrder] = useState<{ key: string; list: DesignView[] } | null>(null);
  useEffect(() => {
    if (charms.length < 2) return;
    let next: DesignView[];
    if (shuffle) {
      next = [...charms];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
    } else {
      // A drill-down is rotated, not shuffled. Picking a random opening index
      // instead could not give a three-charm region any variety at all: with
      // both ends ruled out -- an end centres with nothing beside it -- index 1
      // was the only legal slot, so Tōhoku and Hokkaidō opened on the same
      // charm every single time. Rotating moves a different charm into the
      // middle while the charms keep their cyclic order, so the band stays
      // balanced and still changes between visits.
      const by = 1 + Math.floor(Math.random() * (charms.length - 1));
      next = [...charms.slice(by), ...charms.slice(0, by)];
    }
    // Deferred a frame rather than set synchronously: the state is not
    // synchronising an external system, it is a one-off reorder, and setting
    // it inside the effect body cascades a second render before paint.
    const id = requestAnimationFrame(() => setOrder({ key, list: next }));
    return () => cancelAnimationFrame(id);
  }, [charms, key, shuffle]);

  const list = order?.key === key ? order.list : charms;

  const setTrack = useCallback((node: HTMLDivElement | null) => {
    trackRef.current = node;
  }, []);

  // The centre is whichever item's midpoint is nearest the track's, measured
  // outright. An IntersectionObserver watching a narrow band down the middle
  // did this before and was subtly wrong: during a fast flick several items
  // report intersecting in one callback and the last entry won, so the enlarged
  // frame could settle on a charm that was not the one under the middle.
  // offsetLeft/offsetWidth are layout values, unaffected by the scale
  // transform, which is exactly what should be measured here.
  // The single source of truth for which charm is focused: whatever is actually
  // nearest the middle of the track. Both the scroll listener and the opening
  // position call this, so the enlarged tile can never disagree with the tile
  // under the centre -- computing the two separately let them drift apart
  // whenever the scroll landed somewhere other than the index that asked for
  // it. offsetLeft/offsetWidth are layout values, unaffected by the scale
  // transform, which is exactly what should be measured here.
  const pickCentre = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const mid = track.scrollLeft + track.clientWidth / 2;
    let bestId: number | null = null;
    let bestDistance = Infinity;
    track.querySelectorAll<HTMLElement>("[data-id]").forEach((el) => {
      const distance = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestId = Number(el.dataset.id);
      }
    });
    if (bestId != null) setCentreId(bestId);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const onScroll = () => {
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          pickCentre();
        });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [list, pickCentre]);

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

  // A new list always opens on its middle charm, which keeps charms on both
  // sides of the focused one wherever the list is long enough. The variety
  // comes from the rotation above moving a different charm into that middle
  // slot, not from moving the slot around.
  //
  // Randomness lives in the effect, never in render: the server and the first
  // client render both use the middle, and the rotation arrives afterwards.
  //
  // Resetting at all matters: the track is the same DOM node across a
  // drill-down, so its scroll position otherwise survives into a shorter list.
  // Going from the 34-charm pool to a 7-charm region left the band clamped at
  // the far end, showing the last charm and three blanks.
  useEffect(() => {
    if (focusId != null) return;
    const track = trackRef.current;
    if (!track) return;
    const opening = list[Math.floor((list.length - 1) / 2)];
    const el = opening
      ? track.querySelector<HTMLElement>(`[data-id="${opening.id}"]`)
      : null;
    // Set outright rather than scrollIntoView: this is the band's opening
    // position, so it should already be there on the first paint, not glide
    // there afterwards.
    track.scrollLeft = el ? el.offsetLeft + el.offsetWidth / 2 - track.clientWidth / 2 : 0;
    // Read the position back rather than assuming it took: the browser clamps
    // to the track's scrollable range, so the charm that ends up centred is not
    // always the one that was asked for.
    const id = requestAnimationFrame(pickCentre);
    return () => cancelAnimationFrame(id);
  }, [list, focusId, pickCentre]);

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

  // A charm the map is not yet showing, and can show. One with no prefecture
  // has nothing to fly to, so it opens on the first tap rather than swallowing
  // one that appears to do nothing.
  const needsFocus = (design: DesignView) =>
    Boolean(onFocusPrefecture) &&
    design.prefectureCode != null &&
    focusedCode !== design.prefectureCode;

  return (
    <div className={`strip${expanded ? " is-open" : ""}`}>
      {/* The card floats above the band, over the map. The name stays rendered
          underneath it either way and is only hidden from view -- removing it
          would shorten the band and shift the carousel down the moment a charm
          was opened. */}
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
          {/* Only what is not already on screen. The cut-out is the centred
              carousel card, and the name and place are in the label right
              below -- repeating either would make the popup twice the size to
              say the same thing. The Japanese name is the one identity line
              the map view shows nowhere else, so it stays. */}
          <div className="strip-card-body">
            {centre.nameJa ? <div className="cja">{centre.nameJa}</div> : null}
            {centre.story ? <p className="strip-card-story">{centre.story}</p> : null}
            <Link href={`/charm/${centre.id}`} className="strip-more">
              Full record →
            </Link>
          </div>
        </div>
      ) : null}
      <div className="strip-label" aria-live="polite">
        <b>{centre.name}</b>
        <span>{locationLabel(centre)}</span>
      </div>
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
                !isCentre
                  ? `${design.name} — bring to centre`
                  : needsFocus(design)
                    ? `${design.name} — show its prefecture on the map`
                    : `${design.name} — open this charm`
              }
              onClick={() => {
                if (!isCentre) {
                  setExpanded(false);
                  centreOn(design.id);
                  return;
                }
                // Two stages, so tapping a charm never skips the map. The first
                // tap flies to its prefecture -- the step a desktop reader gets
                // by clicking the prefecture before picking a card -- and only
                // once the map is there does the next tap open the record.
                if (needsFocus(design)) {
                  onFocusPrefecture?.(design);
                  return;
                }
                setExpanded(!expanded);
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
