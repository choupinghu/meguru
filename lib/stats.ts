/**
 * The header stat row's four live figures. Pulled out of app/page.tsx so
 * `/` and `/browse` (both of which already have the full design list in
 * hand for their own content) can derive identical numbers from one place
 * rather than each re-deriving its own counting logic.
 *
 * Every figure here counts designs, not items — owning three copies of one
 * design must not extend "prefectures reached" or inflate the catalogue
 * count. Since `designs` is already one row per design, counting the array
 * itself (rather than anything nested under `.items`) is what keeps that
 * true.
 */
import type { DesignView } from "./charms";
import { REGION_LIST } from "./regions";

export interface StatEntry {
  value: number;
  label: string;
}

export function buildStats(designs: DesignView[]): StatEntry[] {
  const prefecturesReached = new Set(
    designs.filter((d) => d.prefectureCode != null).map((d) => d.prefectureCode)
  ).size;
  const rareAndGrail = designs.filter(
    (d) => d.rarity === "rare" || d.rarity === "grail"
  ).length;

  return [
    { value: designs.length, label: "Charms catalogued" },
    { value: prefecturesReached, label: "Prefectures reached" },
    { value: REGION_LIST.length, label: "Regions" },
    { value: rareAndGrail, label: "Rare & grail" },
  ];
}
