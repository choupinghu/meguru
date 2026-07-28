"use client";

import { useLayoutEffect, useRef } from "react";
import type { CharmView } from "@/lib/charms";
import { REGIONS, regionForCode } from "@/lib/regions";
import JapanMapSvg from "./JapanMapSvg";

/**
 * Wraps the static <JapanMapSvg> in the prototype's mapcard frame and colours
 * every prefecture by its region: full strength where the collection reaches,
 * a pale wash of the same hue where it doesn't. The map therefore reads as a
 * picture of how far the collection travels while keeping the regional
 * grouping legible everywhere.
 *
 * There are deliberately no pins. Tinting already carries "there are charms
 * here", and in 0003b the prefecture itself becomes the click target -- a far
 * bigger hit area than a dot, and with no arbitrary choice of where inside an
 * irregular shape the dot should sit.
 *
 * Static for now: hover, selection, zoom, the side panel and "Discover" all
 * land in 0003b.
 */
export default function MapExplorer({ charms }: { charms: CharmView[] }) {
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
      // Every prefecture gets its region colour; the `has` class decides
      // whether it renders at full strength or as a pale wash.
      const regionKey = regionForCode(code);
      if (regionKey) g.style.setProperty("--rc", REGIONS[regionKey].color);
      g.classList.toggle("has", reached.has(code));
    });
  }, [charms]);

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
