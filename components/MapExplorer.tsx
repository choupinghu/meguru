"use client";

import { useLayoutEffect, useRef } from "react";
import type { CharmView } from "@/lib/charms";
import { REGIONS, regionForCode } from "@/lib/regions";
import JapanMapSvg from "./JapanMapSvg";

/**
 * Wraps the static <JapanMapSvg> in the prototype's mapcard frame and tints
 * every prefecture the collection actually reaches with its region colour.
 * Prefectures with nothing in them keep the neutral --land tone, so the map
 * reads as a picture of how far the collection travels.
 *
 * There are deliberately no pins. Tinting already carries "there are charms
 * here", and in 0003b the prefecture itself becomes the click target -- a far
 * bigger hit area than a dot, and with no arbitrary choice of where inside an
 * irregular shape the dot should sit.
 *
 * Static for now: hover, selection, zoom, the side panel and "Discover" all
 * land in 0003b.
 */
export default function MapExplorer({
  charms,
  tintAll = false,
}: {
  charms: CharmView[];
  /** QA (?tint=all): colour every prefecture by region, not just the ones
   *  with charms, so region groupings can be reviewed at a glance. */
  tintAll?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Prefecture codes the collection reaches. Collabs (prefectureCode === null)
  // don't belong to the map.
  const reached = new Set<number>();
  for (const charm of charms) {
    if (charm.prefectureCode != null) reached.add(charm.prefectureCode);
  }

  // Tint via the --rc custom property, the same pattern CharmCard/CharmThumb
  // use. Runs before paint so there's no flash of an untinted map, and only
  // touches class/style React doesn't own, so it can't cause a hydration
  // mismatch.
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.querySelectorAll<SVGGElement>(".prefecture[data-code]").forEach((g) => {
      const code = Number(g.getAttribute("data-code"));
      const has = reached.has(code);
      if (has || tintAll) {
        const regionKey = regionForCode(code);
        if (regionKey) g.style.setProperty("--rc", REGIONS[regionKey].color);
        g.classList.add("has");
      } else {
        g.classList.remove("has");
        g.style.removeProperty("--rc");
      }
      // In QA mode, still distinguish the ones with nothing in them.
      g.classList.toggle("qa-empty", tintAll && !has);
    });
  }, [charms, tintAll]);

  return (
    <section className="explore">
      <div className="mapcard">
        <div className="mapstage">
          <JapanMapSvg ref={svgRef} />
        </div>
      </div>
    </section>
  );
}
