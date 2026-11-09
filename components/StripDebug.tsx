"use client";

/**
 * TEMPORARY, debug branch only -- never merge. Shown only with ?stripdebug in
 * the URL. Logs every touch and click on the page so a stuck phone strip can be
 * diagnosed from one screenshot: where the finger actually landed, whether
 * anything cancelled the event, and what the strip's scroll position did.
 */
import { useEffect, useState } from "react";

function describe(t: EventTarget | null): string {
  if (!(t instanceof Element)) return String(t);
  const item = t.closest(".strip-item");
  if (item) return `item:${(item.getAttribute("aria-label") ?? "").split(" — ")[0]}`;
  if (t.closest(".strip-track")) return "track";
  const cls = typeof t.className === "string" ? t.className : (t.className as SVGAnimatedString)?.baseVal;
  return `${t.tagName.toLowerCase()}${cls ? "." + cls.split(" ").slice(0, 2).join(".") : ""}`;
}

export default function StripDebug() {
  const [on, setOn] = useState(false);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    if (!window.location.search.includes("stripdebug")) return;
    const id = requestAnimationFrame(() => setOn(true));
    const t0 = performance.now();
    const track = () => document.querySelector<HTMLElement>(".strip-track");
    const push = (s: string) => setLines((prev) => [...prev.slice(-13), `${Math.round(performance.now() - t0)} ${s}`]);
    let moves = 0;
    const onEvent = (e: Event) => {
      const tr = track();
      const sl = tr ? Math.round(tr.scrollLeft) : -1;
      if (e.type === "touchmove") {
        moves++;
        if (moves % 8 !== 1) return;
      } else if (e.type === "touchstart") moves = 0;
      const te = e as TouchEvent;
      const p = te.touches?.[0] ?? te.changedTouches?.[0];
      const at = p ? document.elementFromPoint(p.clientX, p.clientY) : null;
      push(`${e.type} tgt=${describe(e.target)} at=${describe(at)} prevented=${e.defaultPrevented} sl=${sl}/${tr ? tr.scrollWidth - tr.clientWidth : -1}`);
      // read again after the browser has had a chance to act on it
      setTimeout(() => {
        if (e.defaultPrevented) push(`  ...${e.type} was CANCELLED by a handler`);
      }, 0);
    };
    const onScroll = () => {
      const tr = track();
      if (tr) push(`scroll sl=${Math.round(tr.scrollLeft)} snap=${getComputedStyle(tr).scrollSnapType}`);
    };
    const types = ["touchstart", "touchmove", "touchend", "touchcancel", "click"];
    // bubble phase on window, so defaultPrevented reflects every handler below
    types.forEach((ty) => window.addEventListener(ty, onEvent, { passive: true }));
    let lastTrack: HTMLElement | null = null;
    const poll = setInterval(() => {
      const tr = track();
      if (tr !== lastTrack) {
        lastTrack?.removeEventListener("scroll", onScroll);
        tr?.addEventListener("scroll", onScroll, { passive: true });
        push(`track ${lastTrack ? "REPLACED" : "found"}: items=${tr?.querySelectorAll(".strip-item").length} touch-action=${tr ? getComputedStyle(tr).touchAction : "-"} overflowX=${tr ? getComputedStyle(tr).overflowX : "-"}`);
        lastTrack = tr;
      }
    }, 300);
    return () => {
      cancelAnimationFrame(id);
      types.forEach((ty) => window.removeEventListener(ty, onEvent));
      lastTrack?.removeEventListener("scroll", onScroll);
      clearInterval(poll);
    };
  }, []);

  if (!on) return null;
  return (
    <pre
      style={{
        position: "fixed", left: 4, right: 4, top: 4, zIndex: 9999, maxHeight: "45vh", overflow: "hidden",
        margin: 0, padding: 6, fontSize: 9, lineHeight: 1.25, whiteSpace: "pre-wrap", pointerEvents: "none",
        background: "rgba(255,255,255,0.92)", color: "black", border: "1px solid black",
      }}
    >
      {lines.join("\n") || "stripdebug: waiting for touches"}
    </pre>
  );
}
