/**
 * The shared charm vocabulary: a serialisable view type mapped from the
 * Drizzle row, plus condition / rarity / status / colour helpers. Every
 * component that renders a charm (CharmCard, CharmThumb, and later the map
 * / coverflow / collab shelf) reads through this module rather than the raw
 * DB row or the prototype's ad hoc field names.
 */
import type { Charm } from "@/db/schema";
import { COLLAB_REGION, REGIONS, regionForCode } from "./regions";
import { PREFECTURES } from "./prefectures";

export type Condition = "bnib" | "boxed-notag" | "nobox-tag" | "nobox-notag";
export type Rarity = "common" | "uncommon" | "rare" | "grail";
export type Status = "available" | "reserved" | "sold" | "keepsake";

/** A charm shaped for rendering — plain data, safe to pass from a server
 * component to a client component without leaking Drizzle internals. */
export interface CharmView {
  id: number;
  name: string;
  nameJa: string | null;
  isCollab: boolean;
  prefectureCode: number | null;
  region: string;
  city: string | null;
  brand: string | null;
  condition: Condition;
  rarity: Rarity;
  status: Status;
  priceSgd: number | null;
  special: boolean;
  note: string | null;
  imageUrl: string | null;
  /** First tag is treated as the charm's motif (food / landmark / animal / ...). */
  motif: string | null;
}

export function toCharmView(row: Charm): CharmView {
  return {
    id: row.id,
    name: row.name,
    nameJa: row.nameJa,
    isCollab: row.isCollab,
    prefectureCode: row.prefectureCode,
    region: row.region,
    city: row.city,
    brand: row.brand,
    condition: row.condition as Condition,
    rarity: row.rarity as Rarity,
    status: row.status as Status,
    priceSgd: row.priceSgd,
    special: row.special,
    note: row.note,
    imageUrl: row.imageUrl,
    motif: row.tags?.[0] ?? null,
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

/** "Prefecture · City" for gotochi charms, or the brand for collabs. */
export function locationLabel(charm: CharmView): string {
  if (charm.isCollab) return charm.brand ?? COLLAB_REGION.en;
  const prefecture = charm.prefectureCode != null ? PREFECTURES[charm.prefectureCode] : undefined;
  const prefLabel = prefecture?.en ?? "Unknown prefecture";
  return charm.city ? `${prefLabel} · ${charm.city}` : prefLabel;
}

/** The region hue this charm should be tinted with (applied via --rc). */
export function charmColor(charm: CharmView): string {
  if (charm.isCollab) return COLLAB_REGION.color;
  const key = charm.prefectureCode != null ? regionForCode(charm.prefectureCode) : null;
  return key ? REGIONS[key].color : COLLAB_REGION.color;
}

/** Price as "S$N", or "Not for sale" when the charm has no listed price. */
export function priceLabel(charm: CharmView): string {
  return charm.priceSgd != null ? `S$${charm.priceSgd}` : "Not for sale";
}
