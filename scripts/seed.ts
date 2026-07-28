/**
 * Idempotent seed: truncates `charms` and re-inserts a representative set of
 * REAL, documented Gotochi Kitty (ご当地キティ) designs — one per prefecture,
 * spread across all 8 regions, plus a couple of off-the-map collabs.
 *
 * Design names/motifs are sourced from public Gotochi Kitty catalogues
 * (ja.wikipedia.org/wiki/ご当地キティ and castel.jp/p/2850).
 *
 * NOTE: `condition`, `rarity`, `status` and `price` describe a *specific item*,
 * not the design — the values here are still placeholders to be replaced with
 * the real collection.
 *
 * Run with: npm run db:seed
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { charms, type NewCharm } from "../db/schema";

type Region =
  | "hokkaido"
  | "tohoku"
  | "kanto"
  | "chubu"
  | "kinki"
  | "chugoku"
  | "shikoku"
  | "kyushu-okinawa";

// Region prefecture-code ranges, ported from prototype/index.html's REGIONS.
const REGION_RANGES: Record<Region, number[]> = {
  hokkaido: [1],
  tohoku: [2, 3, 4, 5, 6, 7],
  kanto: [8, 9, 10, 11, 12, 13, 14],
  chubu: [15, 16, 17, 18, 19, 20, 21, 22, 23],
  kinki: [24, 25, 26, 27, 28, 29, 30],
  chugoku: [31, 32, 33, 34, 35],
  shikoku: [36, 37, 38, 39],
  "kyushu-okinawa": [40, 41, 42, 43, 44, 45, 46, 47],
};

function regionForCode(code: number): Region {
  for (const region of Object.keys(REGION_RANGES) as Region[]) {
    if (REGION_RANGES[region].includes(code)) return region;
  }
  throw new Error(`No region found for prefecture code ${code}`);
}

/** What the charm depicts — a second axis for browsing/filtering. */
type Motif =
  | "food"        // regional dish or produce
  | "landmark"    // place, building, natural landmark
  | "animal"      // creature
  | "nature"      // plant, flower, tree
  | "history"     // historical figure / warrior / costume
  | "folklore"    // legend, folk toy, yokai
  | "festival";   // matsuri, dance, costume event

type ProtoCharm = {
  code?: number;
  collab?: true;
  brand?: string;
  name: string;
  ja: string;
  city?: string;
  motif: Motif;
  cond: "bnib" | "boxed-notag" | "nobox-tag" | "nobox-notag";
  rarity: "common" | "uncommon" | "rare" | "grail";
  status: "available" | "reserved" | "sold" | "keepsake";
  price: number | null;
  special?: boolean;
  note?: string;
};

const CHARMS: ProtoCharm[] = [
  // ---- Hokkaido ----
  { code: 1, name: "Lavender", ja: "ラベンダー", city: "Furano 富良野", motif: "nature", cond: "bnib", rarity: "grail", status: "keepsake", price: null, special: true, note: "The very first Gotochi Kitty — Hokkaidō, 1998. Where the whole line began." },

  // ---- Tōhoku ----
  { code: 2, name: "Apple Girl", ja: "りんご娘", city: "Hirosaki 弘前", motif: "food", cond: "bnib", rarity: "common", status: "available", price: 20 },
  { code: 4, name: "Masamune's Armour", ja: "政宗陣羽織", city: "Sendai 仙台", motif: "history", cond: "boxed-notag", rarity: "rare", status: "available", price: 34, special: true, note: "Kitty in Date Masamune's crested war surcoat." },
  { code: 5, name: "Kiritanpo", ja: "きりたんぽ", city: "Akita 秋田", motif: "food", cond: "nobox-notag", rarity: "uncommon", status: "reserved", price: 22 },
  { code: 7, name: "Akabeko", ja: "赤べこ", city: "Aizu 会津", motif: "folklore", cond: "bnib", rarity: "uncommon", status: "available", price: 26, special: true, note: "The red papier-mâché cow of Aizu." },

  // ---- Kantō ----
  { code: 9, name: "Three Wise Monkeys", ja: "日光三猿", city: "Nikkō 日光", motif: "folklore", cond: "boxed-notag", rarity: "uncommon", status: "available", price: 25 },
  { code: 12, name: "Peanut", ja: "落花生", city: "Chiba 千葉", motif: "food", cond: "nobox-notag", rarity: "common", status: "available", price: 17 },
  { code: 13, name: "Tokyo Station", ja: "東京駅", city: "Marunouchi 丸の内", motif: "landmark", cond: "bnib", rarity: "common", status: "available", price: 22, special: true },
  { code: 14, name: "Yokohama Chinatown", ja: "横浜中華街", city: "Yokohama 横浜", motif: "landmark", cond: "bnib", rarity: "uncommon", status: "available", price: 27 },

  // ---- Chūbu ----
  { code: 15, name: "Sado Crested Ibis", ja: "佐渡トキ", city: "Sado 佐渡", motif: "animal", cond: "bnib", rarity: "rare", status: "available", price: 32 },
  { code: 17, name: "Toshiie & Matsu", ja: "利家とまつ", city: "Kanazawa 金沢", motif: "history", cond: "bnib", rarity: "rare", status: "available", price: 36, special: true, note: "The Kaga lord and his wife — a Kanazawa pair." },
  { code: 19, name: "Mt. Fuji", ja: "富士山", city: "Fujiyoshida 富士吉田", motif: "landmark", cond: "bnib", rarity: "common", status: "available", price: 24, special: true },
  { code: 21, name: "Shirakawa-gō", ja: "白川郷", city: "Shirakawa 白川", motif: "landmark", cond: "boxed-notag", rarity: "uncommon", status: "available", price: 28 },
  { code: 23, name: "Ebi Fry", ja: "エビフライ", city: "Nagoya 名古屋", motif: "food", cond: "nobox-notag", rarity: "uncommon", status: "available", price: 19 },

  // ---- Kinki ----
  { code: 25, name: "Kōga Ninja", ja: "甲賀忍者", city: "Kōka 甲賀", motif: "history", cond: "bnib", rarity: "rare", status: "available", price: 33, special: true },
  { code: 26, name: "Kinkaku-ji", ja: "金閣寺", city: "Kyoto 京都", motif: "landmark", cond: "bnib", rarity: "uncommon", status: "available", price: 30, special: true },
  { code: 27, name: "Kushikatsu", ja: "串カツ", city: "Shinsekai 新世界", motif: "food", cond: "boxed-notag", rarity: "common", status: "sold", price: 20 },
  { code: 29, name: "Prince Shōtoku", ja: "聖徳太子", city: "Nara 奈良", motif: "history", cond: "nobox-tag", rarity: "uncommon", status: "available", price: 25 },

  // ---- Chūgoku ----
  { code: 31, name: "GeGeGe no Kitarō", ja: "ゲゲゲの鬼太郎", city: "Sakaiminato 境港", motif: "folklore", cond: "bnib", rarity: "rare", status: "available", price: 35, special: true, note: "Yōkai crossover from Mizuki Shigeru's hometown." },
  { code: 33, name: "Momotarō", ja: "桃太郎", city: "Okayama 岡山", motif: "folklore", cond: "boxed-notag", rarity: "uncommon", status: "available", price: 26 },
  { code: 34, name: "Momiji", ja: "もみじ", city: "Miyajima 宮島", motif: "nature", cond: "nobox-notag", rarity: "common", status: "available", price: 18 },

  // ---- Shikoku ----
  { code: 36, name: "Awa Odori", ja: "阿波おどり", city: "Tokushima 徳島", motif: "festival", cond: "bnib", rarity: "rare", status: "available", price: 31, special: true },
  { code: 38, name: "Iyokan", ja: "いよかん", city: "Matsuyama 松山", motif: "food", cond: "boxed-notag", rarity: "common", status: "available", price: 19 },
  { code: 39, name: "Sakamoto Ryōma", ja: "坂本龍馬", city: "Kōchi 高知", motif: "history", cond: "bnib", rarity: "rare", status: "available", price: 34 },

  // ---- Kyūshū & Okinawa ----
  { code: 40, name: "Hakata Mentaiko", ja: "博多明太子", city: "Hakata 博多", motif: "food", cond: "bnib", rarity: "uncommon", status: "available", price: 23 },
  { code: 43, name: "Mt. Aso", ja: "阿蘇山", city: "Aso 阿蘇", motif: "landmark", cond: "boxed-notag", rarity: "uncommon", status: "available", price: 26 },
  { code: 46, name: "Yakushima Jōmon Cedar", ja: "屋久島縄文杉", city: "Yakushima 屋久島", motif: "nature", cond: "boxed-notag", rarity: "rare", status: "available", price: 30 },
  { code: 47, name: "Gōyā", ja: "ゴーヤー", city: "Naha 那覇", motif: "food", cond: "bnib", rarity: "uncommon", status: "available", price: 24, special: true },

  // ---- Off the map (company / venue exclusives, no prefecture) ----
  { collab: true, brand: "JR West", name: "Hello Kitty Shinkansen", ja: "ハローキティ新幹線", motif: "landmark", cond: "bnib", rarity: "rare", status: "available", price: 40, special: true, note: "From the 2018 JR West Hello Kitty Shinkansen (Shin-Ōsaka ↔ Hakata)." },
  { collab: true, brand: "Sanrio Puroland", name: "Puroland Exclusive", ja: "ピューロランド限定", motif: "landmark", cond: "bnib", rarity: "rare", status: "keepsake", price: null, note: "Park-exclusive edition." },
];

function toRow(c: ProtoCharm): NewCharm {
  const isCollab = !!c.collab;
  return {
    name: c.name,
    nameJa: c.ja,
    isCollab,
    prefectureCode: isCollab ? null : c.code!,
    region: isCollab ? "collab" : regionForCode(c.code!),
    city: isCollab ? null : c.city ?? null,
    brand: isCollab ? c.brand ?? null : null,
    condition: c.cond,
    rarity: c.rarity,
    status: c.status,
    priceSgd: c.price,
    special: !!c.special,
    note: c.note ?? null,
    tags: [c.motif],
  };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Add the pooled Neon connection string to .env.local before seeding."
    );
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log("Truncating charms ...");
  await sql`TRUNCATE TABLE charms RESTART IDENTITY`;

  const rows = CHARMS.map(toRow);
  console.log(`Inserting ${rows.length} charms ...`);
  await db.insert(charms).values(rows);

  const prefectures = new Set(
    CHARMS.filter((c) => !c.collab).map((c) => c.code)
  );
  console.log(
    `Seeded ${rows.length} charms across ${prefectures.size} prefectures.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
