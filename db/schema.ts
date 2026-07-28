import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

// Region a charm belongs to. The 8 map regions, plus `collab` for
// charms that don't map to a prefecture (airline / rail / park exclusives).
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

export const charms = pgTable("charms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameJa: text("name_ja"),
  isCollab: boolean("is_collab").notNull().default(false),
  prefectureCode: integer("prefecture_code"),
  region: regionEnum("region").notNull(),
  city: text("city"),
  brand: text("brand"),
  condition: conditionEnum("condition").notNull(),
  rarity: rarityEnum("rarity").notNull(),
  status: statusEnum("status").notNull(),
  priceSgd: integer("price_sgd"),
  special: boolean("special").notNull().default(false),
  note: text("note"),
  imageUrl: text("image_url"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Charm = typeof charms.$inferSelect;
export type NewCharm = typeof charms.$inferInsert;
