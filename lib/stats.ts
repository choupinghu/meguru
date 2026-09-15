/**
 * The header stat row's two live figures. Pulled out of app/page.tsx so
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
 * "reached" its prefecture, it's just documented as being from there. The
 * "Rare & grail" figure was withdrawn in 0008b/D9: the underlying rarity
 * values are unverified, so it must not headline a stat any more than it
 * may badge a card. "In the collection" counts designs with at least one
 * item.
 *
 * "Regions" and "Prefectures reached" were withdrawn once the map carried
 * them. "Regions" was never a statistic at all — it read REGION_LIST.length,
 * a constant 9 that no collection could ever move, while the chip row above it
 * already listed all nine WITH their counts. "Prefectures reached" is what the
 * map itself draws: lit shapes against grey. What is left is the pair the map
 * cannot show, because a prefecture glows the same whether it holds one charm
 * or seven — how many charms there are, and how many of them are ours.
 */
import type { DesignView } from "./charms";

export interface StatEntry {
  value: number;
  label: string;
}

export function buildStats(designs: DesignView[]): StatEntry[] {
  const inCollection = designs.filter((d) => d.items.length > 0).length;

  return [
    { value: designs.length, label: "Charms catalogued" },
    { value: inCollection, label: "In the collection" },
  ];
}
