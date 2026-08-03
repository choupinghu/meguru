"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import Link from "next/link";
import type { DesignView } from "@/lib/charms";
import { toCharmView, type CharmView } from "@/lib/charms";
import CharmThumb from "./CharmThumb";

/**
 * Ports the prototype's revolving-shelf coverflow (`prototype/index.html`
 * lines 202-218 for the CSS, 720-770 for the IIFE) as a client component —
 * spec 0009. A quiet, self-driving band beneath the map: it shows what the
 * collection's charms actually look like, and asks for nothing (D1). The
 * prev/next `.cf-nav` circles are dropped (D5); drag, arrow keys and click
 * are kept.
 *
 * D10's invariant restated: this component is handed `DesignView`s (every
 * one of which carries priced `items`, because 0009/D2 feeds it the owned
 * 25), but every item drawn here is immediately flattened to `StripCharm` —
 * id, name, nameJa, brand, isCollab and the price-less `CharmView` that
 * `toCharmView` produces. Nothing downstream of that flattening ever sees an
 * `items` array, so there is nothing for it to render a price from.
 */

const POOL_SIZE = 12;
const STEP_MS = 3400;
const DRAG_THRESHOLD_PX = 40;
const MOBILE_BREAKPOINT_PX = 560;
const GAP_MIN_PX = 78;
const GAP_MAX_PX = 128;
/** Fallback stage width before the first real measurement lands, matching
 * the prototype's `stage.clientWidth||760`. */
const DEFAULT_STAGE_WIDTH_PX = 760;

interface StripCharm {
  id: number;
  name: string;
  nameJa: string | null;
  brand: string | null;
  isCollab: boolean;
  charm: CharmView;
}

function toStripCharm(design: DesignView): StripCharm {
  return {
    id: design.id,
    name: design.name,
    nameJa: design.nameJa,
    brand: design.brand,
    isCollab: design.isCollab,
    charm: toCharmView(design),
  };
}

/** Fisher-Yates, same as the prototype's load-time shuffle — but never run
 * during render (D6): only from the mount-only effect below. */
function shuffle<T>(input: T[]): T[] {
  const pool = input.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

/** Shortest signed distance from `active` to `i`, wrapping at half the pool
 * length — the coverflow's notion of "how far to either side". */
function wrappedDistance(i: number, active: number, len: number): number {
  let d = i - active;
  if (d > len / 2) d -= len;
  if (d < -len / 2) d += len;
  return d;
}

function clamp(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Ported verbatim (0009 spec, "port these values verbatim"). */
function computeGap(stageWidth: number): number {
  return clamp(GAP_MIN_PX, GAP_MAX_PX, stageWidth / 6);
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`).matches;
}

export default function CharmStrip({ charms }: { charms: DesignView[] }) {
  // The full pool the mount-only shuffle draws from. Recomputed if the
  // `charms` prop identity ever changes, but never read during render.
  const pool = useMemo(() => charms.map(toStripCharm), [charms]);

  // D6: server and first client paint must agree, so the initial state is
  // the deterministic "first 12 of the array as given" with `active` at 0 —
  // no `Math.random()` before mount.
  const [items, setItems] = useState<StripCharm[]>(() => pool.slice(0, POOL_SIZE));
  const [active, setActive] = useState(0);
  const [gap, setGap] = useState(() => computeGap(DEFAULT_STAGE_WIDTH_PX));
  const [mobile, setMobile] = useState(false);

  // `go`/autoplay close over this instead of `items` state directly, so the
  // interval/pointer callbacks (set up once) never see a stale pool length.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const stageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const dragStartX = useRef<number | null>(null);

  const go = useCallback((n: number) => {
    setActive((prev) => {
      const len = itemsRef.current.length;
      if (len === 0) return prev;
      return (prev + n + len) % len;
    });
  }, []);

  const stopAuto = useCallback(() => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startAuto = useCallback(() => {
    stopAuto();
    // No autoplay at all under reduced motion (D8) — nothing moves on its
    // own; drag, click and arrow keys still work.
    if (prefersReducedMotion()) return;
    timerRef.current = window.setInterval(() => go(1), STEP_MS);
  }, [go, stopAuto]);

  // Mount-only: shuffle the pool into a fresh 12 + a random `active` (D6),
  // measure the stage for `gap`/mobile (recomputed on resize, per the
  // "port these values verbatim" section), and start autoplay.
  useEffect(() => {
    const shuffled = shuffle(pool).slice(0, POOL_SIZE);
    if (shuffled.length > 0) {
      // This is the one deliberate exception to "don't setState in an
      // effect" (0009/D6): the shuffle must never run during render (that's
      // the hydration mismatch `Math.random()` would cause), so a mount-only
      // effect landing a frame after the deterministic first paint is the
      // fix, not the bug.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(shuffled);
      setActive(Math.floor(Math.random() * shuffled.length));
    }

    const updateLayout = () => {
      const width = stageRef.current?.clientWidth || DEFAULT_STAGE_WIDTH_PX;
      setGap(computeGap(width));
      setMobile(isMobileViewport());
    };
    updateLayout();
    window.addEventListener("resize", updateLayout);
    startAuto();

    return () => {
      window.removeEventListener("resize", updateLayout);
      stopAuto();
    };
    // Deliberately mount-only (D6): the shuffle and the autoplay start must
    // each run exactly once, never re-fire when `pool`'s identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drag / swipe (D5): a persistent pointerdown on the viewport and
  // pointerup on window, exactly as the prototype wires it, so a drag that
  // ends outside the viewport still resolves.
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const handlePointerDown = (e: PointerEvent) => {
      dragStartX.current = e.clientX;
      stopAuto();
    };
    const handlePointerUp = (e: PointerEvent) => {
      if (dragStartX.current === null) return;
      const dx = e.clientX - dragStartX.current;
      if (dx > DRAG_THRESHOLD_PX) go(-1);
      else if (dx < -DRAG_THRESHOLD_PX) go(1);
      dragStartX.current = null;
    };

    vp.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      vp.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [go, stopAuto]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    }
  };

  if (charms.length === 0) return null;

  const len = items.length;
  const activeItem = items[active];

  return (
    <section className="section">
      <div className="sec-head">
        <div>
          <h3>
            From the shelf <span className="ja">棚から</span>
          </h3>
          <p>A dozen at a time, drifting past — the collection as objects rather than places.</p>
        </div>
      </div>
      <div
        className="coverflow"
        role="group"
        tabIndex={0}
        aria-label="Charm carousel — use arrow keys"
        onKeyDown={handleKeyDown}
        onPointerEnter={stopAuto}
        onPointerLeave={startAuto}
        onFocus={stopAuto}
        onBlur={startAuto}
      >
        <div className="cf-viewport" ref={viewportRef}>
          <div className="cf-stage" ref={stageRef}>
            {items.map((item, i) => {
              const d = wrappedDistance(i, active, len);
              const ad = Math.abs(d);
              const isCenter = d === 0;
              const scale = isCenter ? 1.16 : Math.max(0.55, 1 - ad * 0.13);
              const rotateY = clamp(-48, 48, -d * 20);
              const transform = mobile
                ? `translateX(${d * gap}px) scale(${scale})`
                : `translateX(${d * gap}px) rotateY(${rotateY}deg) scale(${scale})`;
              const style: CSSProperties = {
                transform,
                opacity: ad > 4 ? 0 : 1 - ad * 0.17,
                zIndex: 100 - ad,
                pointerEvents: ad > 4 ? "none" : "auto",
              };

              // D4: only the centre item is a next/link anchor and opens the
              // charm page; side items are buttons that centre themselves
              // and never navigate. Never nest one inside the other.
              if (isCenter) {
                return (
                  <Link
                    key={item.id}
                    href={`/charm/${item.id}`}
                    className="cf-item center"
                    style={style}
                    aria-label={item.name}
                  >
                    <CharmThumb charm={item.charm} />
                  </Link>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  className="cf-item"
                  style={style}
                  tabIndex={-1}
                  aria-label={item.name}
                  onClick={() => setActive(i)}
                >
                  <CharmThumb charm={item.charm} />
                </button>
              );
            })}
          </div>
        </div>
        <div className="cf-caption">
          {activeItem ? (
            <>
              <div className="nm">{activeItem.name}</div>
              <div className="jp">
                {activeItem.nameJa}
                {activeItem.isCollab && activeItem.brand ? ` · ${activeItem.brand}` : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
