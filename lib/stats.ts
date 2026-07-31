/**
 * The header stat row's four live figures. Pulled out of app/page.tsx so
 * `/` and `/browse` (both of which already have the full design list in
 * hand for their own content) can derive identical numbers from one place
 * rather than each re-deriving its own counting logic.
 *
 * Since 0006, `designs` mixes the documented cultural record (no items,
 * never owned) with the real, owned collection (one item each) — so not
 * every figure can count the design array itself anymore. "Charms
 * catalogued" still counts every design passed in (the caller decides
 * whether that's all 54 or a subset). "Prefectures reached" specifically
 * counts only designs with at least one item — a design nobody owns hasn't
 * "reached" its prefecture, it's just documented as being from there. Rare
 * & grail still counts every design passed in, same as the catalogue count.
 */
import type { DesignView } from "./charms";
import { REGION_LIST } from "./regions";

export interface StatEntry {
  value: number;
  label: string;
}

export function buildStats(designs: DesignView[]): StatEntry[] {
  const prefecturesReached = new Set(
    designs
      .filter((d) => d.items.length > 0 && d.prefectureCode != null)
      .map((d) => d.prefectureCode)
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
