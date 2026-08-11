/**
 * The shared charm vocabulary: joined design/item view types mapped from
 * the Drizzle rows, plus condition / rarity / status / colour helpers.
 * Every component that renders a charm (CharmCard, CharmThumb, charm-art,
 * the map / panel) reads through this module rather than the raw DB rows.
 *
 * A `charms` row used to mix a design's identity (name, prefecture, motif,
 * rarity — true of every copy) with a single item's shelf state
 * (condition, status, price). Spec 0005 splits that into `designs` +
 * `items`; this module is the seam: `DesignView` is a design plus its
 * (possibly several) items, and `toCharmView` flattens a design down to the
 * single-item-shaped `CharmView` that CharmThumb / charm-art — ported
 * unchanged from before the split — still render from.
 */
import type { Design, Item } from "@/db/schema";
import { COLLAB_REGION, REGIONS, regionForCode } from "./regions";
import { PREFECTURES } from "./prefectures";

export type Condition = "bnib" | "boxed-notag" | "nobox-tag" | "nobox-notag";
export type Rarity = "common" | "uncommon" | "rare" | "grail";
export type Status = "available" | "reserved" | "sold" | "keepsake";

/** One physical copy of a design — its shelf state. */
export interface ItemView {
  id: number;
  condition: Condition;
  status: Status;
  priceSgd: number | null;
  note: string | null;
  imageUrl: string | null;
}

/** A design plus every item currently on the shelf for it. The unit every
 * page and (almost) every component works with. */
export interface DesignView {
  id: number;
  name: string;
  nameJa: string | null;
  isCollab: boolean;
  prefectureCode: number | null;
  region: string;
  city: string | null;
  brand: string | null;
  /** First tag is treated as the charm's motif (food / landmark / animal / ...). */
  motif: string | null;
  rarity: Rarity;
  special: boolean;
  /** The design's story text (spec 0007). Rendered only on `/charm/[id]`
   * (spec 0008) — never on Browse or the map panel's cards. */
  story: string | null;
  /** Design-level premier image — a photograph of *some* copy of this design.
   * Not a photograph of the item on the shelf; that is `ItemView.imageUrl`. */
  imageUrl: string | null;
  items: ItemView[];
}

export function toItemView(row: Item): ItemView {
  return {
    id: row.id,
    condition: row.condition as Condition,
    status: row.status as Status,
    priceSgd: row.priceSgd,
    note: row.note,
    imageUrl: row.imageUrl,
  };
}

export function toDesignView(design: Design, items: Item[]): DesignView {
  return {
    id: design.id,
    name: design.name,
    nameJa: design.nameJa,
    isCollab: design.isCollab,
    prefectureCode: design.prefectureCode,
    region: design.region,
    city: design.city,
    brand: design.brand,
    motif: design.motif,
    rarity: design.rarity as Rarity,
    special: design.special,
    story: design.story,
    imageUrl: design.imageUrl,
    items: items.map(toItemView),
  };
}

/**
 * A design flattened down to one representative item — the shape
 * CharmThumb / charm-art (unchanged since before the designs/items split)
 * still render from: a thumbnail only ever needs one image. Every seeded
 * design today has exactly one item, so this is lossless; a design with
 * several items just shows the first one's photo.
 */
export interface CharmView {
  id: number;
  name: string;
  nameJa: string | null;
  isCollab: boolean;
  prefectureCode: number | null;
  region: string;
  city: string | null;
  brand: string | null;
  motif: string | null;
  imageUrl: string | null;
}

/** True when a design can show an actual photograph rather than CharmArt —
 * either our own photo of the copy on the shelf, or a design-level reference
 * image. Discover uses this to pick only charms a visitor can actually *see*. */
export function hasPhoto(design: DesignView): boolean {
  return design.imageUrl != null || design.items.some((i) => i.imageUrl != null);
}

export function toCharmView(design: DesignView): CharmView {
  const item = design.items[0];
  return {
    id: design.id,
    name: design.name,
    nameJa: design.nameJa,
    isCollab: design.isCollab,
    prefectureCode: design.prefectureCode,
    region: design.region,
    city: design.city,
    brand: design.brand,
    motif: design.motif,
    // Our own photograph of this copy wins when we have one; the design-level
    // reference image is the fallback, never the other way round.
    imageUrl: item?.imageUrl ?? design.imageUrl ?? null,
  };
}

/** Condition label + a token reference (never a literal hex) for its dot. */
export const CONDITION_LABELS: Record<Condition, string> = {
  bnib: "BNIB",
  "boxed-notag": "Boxed · no tag",
  "nobox-tag": "No box · with tag",
  "nobox-notag": "No box · no tag",
};

export const CONDITION_COLOR_VARS: Record<Condition, string> = {
  bnib: "var(--ok)",
  "boxed-notag": "var(--warn)",
  "nobox-tag": "var(--clay)",
  "nobox-notag": "var(--ink-faint)",
};

/** Rare/grail badge label, or null when the rarity doesn't get a badge. */
export function rarityLabel(rarity: Rarity): string | null {
  if (rarity === "grail") return "Grail";
  if (rarity === "rare") return "Rare";
  return null;
}

/** Status badge label, or null for the default "available" state. */
export function statusLabel(status: Status): string | null {
  if (status === "reserved") return "Reserved";
  if (status === "sold") return "Sold";
  if (status === "keepsake") return "Keepsake";
  return null;
}

/** Human-readable motif chip text ("food" -> "Food"), or null if untagged. */
export function motifLabel(motif: string | null): string | null {
  if (!motif) return null;
  return motif.charAt(0).toUpperCase() + motif.slice(1);
}

/** The design fields `locationLabel`/`charmColor` need — satisfied by both
 * `DesignView` and the flattened `CharmView`. */
type Locatable = {
  isCollab: boolean;
  prefectureCode: number | null;
  brand: string | null;
  city: string | null;
};

/** "Prefecture · City" for gotochi charms, or the brand for collabs. */
export function locationLabel(charm: Locatable): string {
  if (charm.isCollab) return charm.brand ?? COLLAB_REGION.en;
  const prefecture = charm.prefectureCode != null ? PREFECTURES[charm.prefectureCode] : undefined;
  // A charm with no prefecture but a named area knows where it is from — it is
  // only unplaceable to prefecture resolution. Saying "Place unknown · Hokuriku"
  // would be false. Show what the object actually claims.
  if (!prefecture) return charm.city ?? "Place unknown";
  return charm.city ? `${prefecture.en} · ${charm.city}` : prefecture.en;
}

/** The region hue this charm should be tinted with (applied via --rc). */
export function charmColor(charm: Pick<Locatable, "isCollab" | "prefectureCode">): string {
  if (charm.isCollab) return COLLAB_REGION.color;
  const key = charm.prefectureCode != null ? regionForCode(charm.prefectureCode) : null;
  return key ? REGIONS[key].color : COLLAB_REGION.color;
}

/** Price as "S$N", or "Not for sale" when the item has no listed price. */
export function priceLabel(item: Pick<ItemView, "priceSgd">): string {
  return item.priceSgd != null ? `S$${item.priceSgd}` : "Not for sale";
}
