/**
 * The header stat row's four live figures. Pulled out of app/page.tsx so
 * `/` and `/browse` (both of which already have the full charm list in hand
 * for their own content) can derive identical numbers from one place rather
 * than each re-deriving its own counting logic.
 */
import type { CharmView } from "./charms";
import { REGION_LIST } from "./regions";

export interface StatEntry {
  value: number;
  label: string;
}

export function buildStats(charms: CharmView[]): StatEntry[] {
  const prefecturesReached = new Set(
    charms.filter((c) => c.prefectureCode != null).map((c) => c.prefectureCode)
  ).size;
  const rareAndGrail = charms.filter(
    (c) => c.rarity === "rare" || c.rarity === "grail"
  ).length;

  return [
    { value: charms.length, label: "Charms catalogued" },
    { value: prefecturesReached, label: "Prefectures reached" },
    { value: REGION_LIST.length, label: "Regions" },
    { value: rareAndGrail, label: "Rare & grail" },
  ];
}
