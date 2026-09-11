"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * The images for one charm on /charm/[id], in order: the cut-out first, then
 * the photograph it came off the shelf as.
 *
 * No library. A scroll-snapping track gets touch swipe, trackpad momentum and
 * keyboard scrolling from the platform for free, and degrades to a scrollable
 * strip with JS off. An IntersectionObserver reads which slide is showing
 * rather than the component owning scroll state -- the DOM is the source of
 * truth, and fighting it is how carousels break.
 *
 * One image means no controls at all: no arrows, no dots, nothing to click.
 */
export default function CharmCarousel({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || images.length < 2) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.i));
          }
        }
      },
      { root: track, threshold: 0.55 }
    );
    track.querySelectorAll<HTMLElement>("[data-i]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [images.length]);

  const go = useCallback(
    (i: number) => {
      const track = trackRef.current;
      const clamped = Math.max(0, Math.min(images.length - 1, i));
      track?.querySelector<HTMLElement>(`[data-i="${clamped}"]`)?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        inline: "center",
        block: "nearest",
      });
    },
    [images.length]
  );

  if (images.length === 0) return null;
  const many = images.length > 1;

  return (
    <div className="carousel">
      <div
        className="carousel-track"
        ref={trackRef}
        tabIndex={0}
        aria-roledescription={many ? "carousel" : undefined}
        aria-label={many ? `${name}, ${images.length} images` : undefined}
      >
        {images.map((src, i) => (
          <div className="carousel-slide" key={src} data-i={i}>
            <Image
              src={src}
              /* Describes the image, not the charm: three slides all announcing
                 the same name tell a screen reader nothing about why it should
                 move between them. */
              alt={i === 0 ? `${name} — the charm` : `${name} — as photographed`}
              fill
              sizes="(max-width: 640px) 92vw, 520px"
              style={{ objectFit: "contain" }}
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {many ? (
        <>
          <button
            type="button"
            className="carousel-arrow prev"
            aria-label="Previous image"
            onClick={() => go(active - 1)}
            disabled={active === 0}
          >
            ←
          </button>
          <button
            type="button"
            className="carousel-arrow next"
            aria-label="Next image"
            onClick={() => go(active + 1)}
            disabled={active === images.length - 1}
          >
            →
          </button>
          <div className="carousel-dots" role="tablist" aria-label="Images">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Image ${i + 1} of ${images.length}`}
                className={`carousel-dot${i === active ? " is-active" : ""}`}
                onClick={() => go(i)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
