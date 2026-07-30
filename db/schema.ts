import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Region a design belongs to. The 8 map regions, plus `collab` for
// designs that don't map to a prefecture (airline / rail / park exclusives).
export const regionEnum = pgEnum("region", [
  "hokkaido",
  "tohoku",
  "kanto",
  "chubu",
  "kinki",
  "chugoku",
  "shikoku",
  "kyushu",
  "okinawa",
  "collab",
]);

export const conditionEnum = pgEnum("condition", [
  "bnib",
  "boxed-notag",
  "nobox-tag",
  "nobox-notag",
]);

export const rarityEnum = pgEnum("rarity", [
  "common",
  "uncommon",
  "rare",
  "grail",
]);

export const statusEnum = pgEnum("status", [
  "available",
  "reserved",
  "sold",
  "keepsake",
]);

/**
 * A gotochi (regional) Hello Kitty design — true of every copy anyone owns:
 * its name, where it's from, what it depicts, how scarce the release is.
 * Split from `items` in 0005: a `charms` row used to mix this with the
 * state of a single physical copy, which meant owning two of one design
 * meant duplicating (and risking drifting) its design data.
 */
export const designs = pgTable("designs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameJa: text("name_ja"),
  isCollab: boolean("is_collab").notNull().default(false),
  brand: text("brand"),
  prefectureCode: integer("prefecture_code"),
  region: regionEnum("region").notNull(),
  city: text("city"),
  /** What the design depicts (food / landmark / animal / ...). A proper
   * column as of 0005 — previously `charms.tags[0]`. */
  motif: text("motif"),
  /** How scarce this *release* is — describes the design, not one copy. */
  rarity: rarityEnum("rarity").notNull(),
  special: boolean("special").notNull().default(false),
  /** The design's story text. Nullable, unused until 0007. */
  story: text("story"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/**
 * A single physical copy of a design — its shelf state: condition, listing
 * status, price, any private note, and (from 0006) its real photo.
 */
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  designId: integer("design_id")
    .notNull()
    .references(() => designs.id),
  condition: conditionEnum("condition").notNull(),
  status: statusEnum("status").notNull(),
  priceSgd: integer("price_sgd"),
  note: text("note"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const designsRelations = relations(designs, ({ many }) => ({
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  design: one(designs, { fields: [items.designId], references: [designs.id] }),
}));

export type Design = typeof designs.$inferSelect;
export type NewDesign = typeof designs.$inferInsert;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
