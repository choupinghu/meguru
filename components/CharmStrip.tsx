"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { DesignView } from "@/lib/charms";
import { charmColor, locationLabel, toCharmView } from "@/lib/charms";
import CharmThumb from "./CharmThumb";

/**
 * A swipeable strip of charms along the bottom of the map, shown only on small
 * screens (see `.strip` in globals.css).
 *
 * It exists because the phone layout had nowhere good to put a selected charm.
 * Below the map meant scrolling between the two; a bottom sheet reflowed the
 * page; an overlay covered the map it was meant to sit beside. A strip leaves
 * the map whole and lets a whole prefecture be browsed by swiping instead of
 * tapping in and backing out.
 *
 * The centre item is the selected one. CSS can snap the track but cannot tell
 * which item is centred, so an IntersectionObserver watches a narrow band down
 * the middle and marks whatever sits in it.
 *
 * Swiping deliberately does NOT move the map: every swipe animating the map
 * would make the thing restless, and the map is the stable frame you read the
 * strip against.
 */
export default function CharmStrip({
  charms,
  focusId,
}: {
  charms: DesignView[];
  /** A charm chosen elsewhere (Discover, or a card in the panel) — scrolled to
   * the centre so the strip and the rest of the page agree on the selection. */
  focusId?: number | null;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [centreId, setCentreId] = useState<number | null>(charms[0]?.id ?? null);

  // Randomness after mount, never during render: the server and the first
  // client render must agree or hydration complains.
  const [order, setOrder] = useState<DesignView[] | null>(null);
  useEffect(() => {
    if (charms.length < 3) return;
    const shuffled = [...charms];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // Deferred a frame rather than set synchronously: the state is not
    // synchronising an external system, it is a one-off reorder, and setting
    // it inside the effect body cascades a second render before paint.
    const id = requestAnimationFrame(() => setOrder(shuffled));
    return () => cancelAnimationFrame(id);
  }, [charms]);

  const list = order ?? charms;

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

  // A selection made elsewhere pulls the strip to it.
  useEffect(() => {
    if (focusId == null) return;
    const track = trackRef.current;
    track?.querySelector<HTMLElement>(`[data-id="${focusId}"]`)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [focusId, list]);

  if (list.length === 0) return null;
  const centre = list.find((c) => c.id === centreId) ?? list[0];

  return (
    <div className="strip">
      <div className="strip-label" aria-live="polite">
        <b>{centre.name}</b>
        <span>{locationLabel(centre)}</span>
      </div>
      <div className="strip-track" ref={setTrack}>
        {list.map((design) => (
          <Link
            key={design.id}
            href={`/charm/${design.id}`}
            data-id={design.id}
            className={`strip-item${design.id === centreId ? " is-centre" : ""}`}
            style={{ "--rc": charmColor(toCharmView(design)) } as React.CSSProperties}
            aria-label={`${design.name} — open the full record`}
          >
            <CharmThumb charm={toCharmView(design)} />
          </Link>
        ))}
      </div>
    </div>
  );
}
