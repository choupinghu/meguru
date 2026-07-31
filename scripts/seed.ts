/**
 * Idempotent seed: truncates `designs`/`items` and re-inserts two sets.
 *
 * DOCUMENTED (29) — the researched Gotochi Kitty designs from the original
 * seed (spec 0002), minus Akabeko (deduped against the real one below).
 * These are the cultural record only: no item, no condition, no status, no
 * price — a documented-but-unowned design must be *unable* to carry those,
 * not merely happen to lack them (their old `note` becomes `designs.story`
 * instead, since it was a cultural fact sitting on the wrong table).
 *
 * OWNED (25) — the real, photographed designs from `photos/manifest.csv`
 * (spec 0006). Each gets exactly one item: BNIB, available, a price set by
 * a stated policy (not per-charm market data — see specs/0006), and the
 * manifest's `notes` column copied verbatim into `items.note`. `imageUrl`
 * stays null; wiring real photo paths is 0013's job.
 *
 * Akabeko appears in both sources — the manifest's real copy (Fukushima /
 * Aizu, an actual owned item) wins; the researched entry is dropped.
 *
 * Run with: npm run db:seed
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { designs, items, type NewDesign, type NewItem } from "../db/schema";

type Region =
  | "hokkaido"
  | "tohoku"
  | "kanto"
  | "chubu"
  | "kinki"
  | "chugoku"
  | "shikoku"
  | "kyushu"
  | "okinawa";

// Region prefecture-code ranges, ported from prototype/index.html's REGIONS.
const REGION_RANGES: Record<Region, number[]> = {
  hokkaido: [1],
  tohoku: [2, 3, 4, 5, 6, 7],
  kanto: [8, 9, 10, 11, 12, 13, 14],
  chubu: [15, 16, 17, 18, 19, 20, 21, 22, 23],
  kinki: [24, 25, 26, 27, 28, 29, 30],
  chugoku: [31, 32, 33, 34, 35],
  shikoku: [36, 37, 38, 39],
  kyushu: [40, 41, 42, 43, 44, 45, 46],
  okinawa: [47],
};

function regionForCode(code: number): Region {
  for (const region of Object.keys(REGION_RANGES) as Region[]) {
    if (REGION_RANGES[region].includes(code)) return region;
  }
  throw new Error(`No region found for prefecture code ${code}`);
}

/** What the design depicts — a second axis for browsing/filtering. */
type Motif =
  | "food"        // regional dish or produce
  | "landmark"    // place, building, natural landmark
  | "animal"      // creature
  | "nature"      // plant, flower, tree
  | "history"     // historical figure / warrior / costume
  | "folklore"    // legend, folk toy, yokai
  | "festival";   // matsuri, dance, costume event

type Rarity = "common" | "uncommon" | "rare" | "grail";

/**
 * A documented-but-not-owned design: the cultural record. No `cond`,
 * `status` or `price` field exists on this type at all — that is the
 * type-level guarantee that a design with no item can never carry one.
 */
type DocumentedDesign = {
  code?: number;
  collab?: true;
  brand?: string;
  name: string;
  ja: string;
  city?: string;
  motif: Motif;
  rarity: Rarity;
  special?: boolean;
  /** Cultural fact about the design, shown regardless of ownership. */
  story?: string;
};

/**
 * One of the 25 photographed, actually-owned designs (from
 * `photos/manifest.csv`). Exactly one item is created per row.
 */
type OwnedDesign = {
  no: string; // manifest row number, e.g. "0001"
  prefectureCode: number | null;
  isCollab: boolean;
  brand: string | null;
  name: string;
  ja: string;
  city: string | null;
  motif: Motif;
  rarity: "uncommon" | "rare";
  special: boolean;
  /** Price per the stated D3 policy — a policy, not per-charm valuation. */
  price: number;
  /** Manifest `notes` column, copied verbatim. */
  note: string;
};

const DOCUMENTED: DocumentedDesign[] = [
  // ---- Hokkaido ----
  { code: 1, name: "Lavender", ja: "ラベンダー", city: "Furano 富良野", motif: "nature", rarity: "grail", special: true, story: "The very first Gotochi Kitty — Hokkaidō, 1998. Where the whole line began." },

  // ---- Tōhoku ----
  { code: 2, name: "Apple Girl", ja: "りんご娘", city: "Hirosaki 弘前", motif: "food", rarity: "common" },
  { code: 4, name: "Masamune's Armour", ja: "政宗陣羽織", city: "Sendai 仙台", motif: "history", rarity: "rare", special: true, story: "Kitty in Date Masamune's crested war surcoat." },
  { code: 5, name: "Kiritanpo", ja: "きりたんぽ", city: "Akita 秋田", motif: "food", rarity: "uncommon" },
  // Akabeko (code 7) removed here — deduped against the real, owned copy below (D2).

  // ---- Kantō ----
  { code: 9, name: "Three Wise Monkeys", ja: "日光三猿", city: "Nikkō 日光", motif: "folklore", rarity: "uncommon" },
  { code: 12, name: "Peanut", ja: "落花生", city: "Chiba 千葉", motif: "food", rarity: "common" },
  { code: 13, name: "Tokyo Station", ja: "東京駅", city: "Marunouchi 丸の内", motif: "landmark", rarity: "common", special: true },
  { code: 14, name: "Yokohama Chinatown", ja: "横浜中華街", city: "Yokohama 横浜", motif: "landmark", rarity: "uncommon" },

  // ---- Chūbu ----
  { code: 15, name: "Sado Crested Ibis", ja: "佐渡トキ", city: "Sado 佐渡", motif: "animal", rarity: "rare" },
  { code: 17, name: "Toshiie & Matsu", ja: "利家とまつ", city: "Kanazawa 金沢", motif: "history", rarity: "rare", special: true, story: "The Kaga lord and his wife — a Kanazawa pair." },
  { code: 19, name: "Mt. Fuji", ja: "富士山", city: "Fujiyoshida 富士吉田", motif: "landmark", rarity: "common", special: true },
  { code: 21, name: "Shirakawa-gō", ja: "白川郷", city: "Shirakawa 白川", motif: "landmark", rarity: "uncommon" },
  { code: 23, name: "Ebi Fry", ja: "エビフライ", city: "Nagoya 名古屋", motif: "food", rarity: "uncommon" },

  // ---- Kinki ----
  { code: 25, name: "Kōga Ninja", ja: "甲賀忍者", city: "Kōka 甲賀", motif: "history", rarity: "rare", special: true },
  { code: 26, name: "Kinkaku-ji", ja: "金閣寺", city: "Kyoto 京都", motif: "landmark", rarity: "uncommon", special: true },
  { code: 27, name: "Kushikatsu", ja: "串カツ", city: "Shinsekai 新世界", motif: "food", rarity: "common" },
  { code: 29, name: "Prince Shōtoku", ja: "聖徳太子", city: "Nara 奈良", motif: "history", rarity: "uncommon" },

  // ---- Chūgoku ----
  { code: 31, name: "GeGeGe no Kitarō", ja: "ゲゲゲの鬼太郎", city: "Sakaiminato 境港", motif: "folklore", rarity: "rare", special: true, story: "Yōkai crossover from Mizuki Shigeru's hometown." },
  { code: 33, name: "Momotarō", ja: "桃太郎", city: "Okayama 岡山", motif: "folklore", rarity: "uncommon" },
  { code: 34, name: "Momiji", ja: "もみじ", city: "Miyajima 宮島", motif: "nature", rarity: "common" },

  // ---- Shikoku ----
  { code: 36, name: "Awa Odori", ja: "阿波おどり", city: "Tokushima 徳島", motif: "festival", rarity: "rare", special: true },
  { code: 38, name: "Iyokan", ja: "いよかん", city: "Matsuyama 松山", motif: "food", rarity: "common" },
  { code: 39, name: "Sakamoto Ryōma", ja: "坂本龍馬", city: "Kōchi 高知", motif: "history", rarity: "rare" },

  // ---- Kyūshū & Okinawa ----
  { code: 40, name: "Hakata Mentaiko", ja: "博多明太子", city: "Hakata 博多", motif: "food", rarity: "uncommon" },
  { code: 43, name: "Mt. Aso", ja: "阿蘇山", city: "Aso 阿蘇", motif: "landmark", rarity: "uncommon" },
  { code: 46, name: "Yakushima Jōmon Cedar", ja: "屋久島縄文杉", city: "Yakushima 屋久島", motif: "nature", rarity: "rare" },
  { code: 47, name: "Gōyā", ja: "ゴーヤー", city: "Naha 那覇", motif: "food", rarity: "uncommon", special: true },

  // ---- Off the map (company / venue exclusives, no prefecture) ----
  { collab: true, brand: "JR West", name: "Hello Kitty Shinkansen", ja: "ハローキティ新幹線", motif: "landmark", rarity: "rare", special: true, story: "From the 2018 JR West Hello Kitty Shinkansen (Shin-Ōsaka ↔ Hakata)." },
  { collab: true, brand: "Sanrio Puroland", name: "Puroland Exclusive", ja: "ピューロランド限定", motif: "landmark", rarity: "rare", story: "Park-exclusive edition." },
];

// The 7 designs `special: true` (D4). 0004/0006/0008 are unplaced;
// the others carry a real prefecture badge.
const SPECIAL_NOS = new Set(["0004", "0005", "0009", "0011", "0012", "0016", "0019"]);

// The 3 unplaced designs (D5) — null prefectureCode, region "collab".
const UNPLACED: Record<string, { isCollab: boolean; brand: string | null }> = {
  "0004": { isCollab: false, brand: null }, // Yoshitsune & Benkei
  "0006": { isCollab: true, brand: "Miyasaka Jozo" }, // Shinshu-ichi Miso
  "0008": { isCollab: true, brand: null }, // Aquarium exclusive
};

// The 25 rows of photos/manifest.csv, transcribed by hand (several `notes`
// fields are quoted and contain commas, so this was read row-by-row rather
// than naively comma-split).
const OWNED_RAW: {
  no: string;
  code: number | null;
  city: string | null;
  name: string;
  ja: string;
  motif: Motif;
  note: string;
}[] = [
  { no: "0001", code: 28, city: "Kobe 神戸", name: "Kobe Chinatown", ja: "神戸中華街", motif: "landmark", note: "Kitty in Chinese dress with a tray of buns; Nankinmachi" },
  { no: "0002", code: 13, city: "Arakawa 荒川", name: "Arakawa Yosakoi", ja: "荒川よさこい", motif: "festival", note: "Yosakoi dancer with naruko clappers; Toden Arakawa tram on card" },
  { no: "0003", code: 22, city: "Lake Hamana 浜名湖", name: "Lake Hamana", ja: "浜名湖", motif: "animal", note: "Kitty in a fish hood in a woven creel marked 浜名湖" },
  { no: "0004", code: null, city: null, name: "Yoshitsune & Benkei", ja: "義経＆弁慶", motif: "history", note: "Design confirmed: the vertical red label is the five-glyph name 義経＆弁慶, ending in 慶 — it names the characters, not a place. This is the only card of the 25 with no 「〇〇限定」 prefecture badge, so it is genuinely unplaced on the packaging and sits off the map alongside the collabs. Hiraizumi (Iwate) or Kyoto (Gojo Bridge) are the likely origins; only purchase provenance would settle it." },
  { no: "0005", code: 9, city: "Nikko 日光", name: "Kegon Falls", ja: "華厳の滝", motif: "landmark", note: "Retains its original ¥1980 price sticker and Fujisey shop label" },
  { no: "0006", code: null, city: null, name: "Shinshu-ichi Miso", ja: "神州一味噌", motif: "food", note: "Brand collaboration (Miyasaka Jozo of Nagano); Kitty in a miso bowl" },
  { no: "0007", code: 47, city: "Naha 那覇", name: "Eisa drummer", ja: "沖縄エイサー", motif: "festival", note: "Kitty as eisa drummer in Ryukyuan dress; Shureimon gate on card" },
  { no: "0008", code: null, city: null, name: "Aquarium exclusive", ja: "水族館限定", motif: "animal", note: "Venue-exclusive (aquarium unnamed on card); Kitty riding a ray" },
  { no: "0009", code: 20, city: "Highlands 高原", name: "Mountain Meadows Okojo", ja: "MOUNTAIN MEADOWS おこじょ", motif: "animal", note: "Nagano-limited, 2002. The animal is an okojo (Japanese stoat/ermine) of the Japan Alps, which turns white in winter — not a chipmunk. Birch highland forest on card." },
  { no: "0010", code: 31, city: "Mt Daisen 大山", name: "Daisen Crow Tengu", ja: "大山カラス天狗", motif: "folklore", note: "Kitty as karasu-tengu with staff and wings" },
  { no: "0011", code: 26, city: "Amanohashidate 天橋立", name: "Amanohashidate", ja: "天の橋立", motif: "landmark", note: "One of the Three Views of Japan; AMANOHASHIDATE moulded on the arch" },
  { no: "0012", code: 24, city: "Toba 鳥羽", name: "Toba Aquarium Dugong", ja: "鳥羽水族館ジュゴン", motif: "animal", note: "Toba is the only aquarium in Japan keeping a dugong" },
  { no: "0013", code: 39, city: "Kochi 高知", name: "Tosa Inu", ja: "土佐犬", motif: "animal", note: "Kitty in Tosa fighting-dog costume with ceremonial rope" },
  { no: "0014", code: 13, city: "Waseda 早稲田", name: "Waseda", ja: "早稲田", motif: "landmark", note: "Kitty in student cap and uniform; Toden Arakawa tram terminus" },
  { no: "0015", code: 8, city: "Mt Tsukuba 筑波山", name: "Mt Tsukuba Toad", ja: "筑波山がま", motif: "folklore", note: "The Tsukuba gama (toad); ropeway on card" },
  { no: "0016", code: 23, city: "Handa 半田", name: "Gon the Fox", ja: "ごんぎつね", motif: "folklore", note: "Niimi Nankichi's tale; he was born in Handa. Kitty as Gon holding a fish" },
  { no: "0017", code: 28, city: "Awaji 淡路", name: "Awaji Onion", ja: "淡路玉ねぎ", motif: "food", note: "Awaji Island is famous for sweet onions" },
  { no: "0018", code: 13, city: "Meguro 目黒", name: "Meguro no Sanma", ja: "目黒のさんま", motif: "folklore", note: "From the rakugo tale; card reads サンマは目黒に限る" },
  { no: "0019", code: 7, city: "Aizu 会津", name: "Akabeko", ja: "あかべこ", motif: "folklore", note: "The red cow talisman of Aizu" },
  { no: "0020", code: 1, city: "Tokachi 十勝", name: "Azuki Beans", ja: "あずき", motif: "food", note: "Kitty with a bowl of adzuki; bean fields on card. The Tokachi reading of the blister text is probable, not certain." },
  { no: "0021", code: 27, city: "Umeda 梅田", name: "Floating Garden Observatory", ja: "空中庭園展望台", motif: "landmark", note: "The Umeda Sky Building observatory" },
  { no: "0022", code: 14, city: "Enoshima 江ノ島", name: "Enoshima Benzaiten", ja: "江ノ島妙音弁財天", motif: "folklore", note: "Kitty as Benzaiten with a biwa; Fuji and torii on card" },
  { no: "0023", code: 26, city: "Kyoto 京都", name: "Kondo Isami", ja: "近藤勇", motif: "history", note: "Shinsengumi commander; the haori bears the 誠 crest" },
  { no: "0024", code: 5, city: "Lake Tazawa 田沢湖", name: "Lake Tazawa Tatsuko", ja: "田沢湖辰子", motif: "folklore", note: "The Tatsuko maiden legend; Japan's deepest lake" },
  { no: "0025", code: 6, city: "Haguro 羽黒", name: "Mt Haguro", ja: "羽黒山", motif: "landmark", note: "Kitty as a yamabushi ascetic; one of the Dewa Sanzan" },
];

const OWNED: OwnedDesign[] = OWNED_RAW.map((r) => {
  const unplaced = UNPLACED[r.no];
  const special = SPECIAL_NOS.has(r.no);
  const rarity: "uncommon" | "rare" = unplaced ? "rare" : "uncommon";
  const price = unplaced ? 32 : special ? 28 : 24;
  return {
    no: r.no,
    prefectureCode: r.code,
    isCollab: unplaced ? unplaced.isCollab : false,
    brand: unplaced ? unplaced.brand : null,
    name: r.name,
    ja: r.ja,
    city: r.city,
    motif: r.motif,
    rarity,
    special,
    price,
    note: r.note,
  };
});

function toDocumentedDesignRow(d: DocumentedDesign): NewDesign {
  const isCollab = !!d.collab;
  return {
    name: d.name,
    nameJa: d.ja,
    isCollab,
    brand: isCollab ? d.brand ?? null : null,
    prefectureCode: isCollab ? null : d.code!,
    region: isCollab ? "collab" : regionForCode(d.code!),
    city: isCollab ? null : d.city ?? null,
    motif: d.motif,
    rarity: d.rarity,
    special: !!d.special,
    story: d.story ?? null,
  };
}

function toOwnedDesignRow(d: OwnedDesign): NewDesign {
  return {
    name: d.name,
    nameJa: d.ja,
    isCollab: d.isCollab,
    brand: d.brand,
    prefectureCode: d.prefectureCode,
    region: d.prefectureCode != null ? regionForCode(d.prefectureCode) : "collab",
    city: d.city,
    motif: d.motif,
    rarity: d.rarity,
    special: d.special,
    story: null,
  };
}

function toOwnedItemRow(d: OwnedDesign, designId: number): NewItem {
  return {
    designId,
    condition: "bnib",
    status: "available",
    priceSgd: d.price,
    note: d.note,
    imageUrl: null,
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

  console.log("Truncating items and designs ...");
  await sql`TRUNCATE TABLE items, designs RESTART IDENTITY`;

  const documentedRows = DOCUMENTED.map(toDocumentedDesignRow);
  const ownedRows = OWNED.map(toOwnedDesignRow);
  const allDesignRows = [...documentedRows, ...ownedRows];

  console.log(
    `Inserting ${allDesignRows.length} designs (${documentedRows.length} documented, ${ownedRows.length} owned) ...`
  );
  const insertedDesigns = await db
    .insert(designs)
    .values(allDesignRows)
    .returning({ id: designs.id });

  const ownedDesignIds = insertedDesigns.slice(documentedRows.length);
  const itemRows = OWNED.map((d, i) => toOwnedItemRow(d, ownedDesignIds[i].id));
  console.log(`Inserting ${itemRows.length} items (owned designs only) ...`);
  await db.insert(items).values(itemRows);

  const ownedPrefectures = new Set(
    OWNED.filter((d) => d.prefectureCode != null).map((d) => d.prefectureCode)
  );
  console.log(
    `Seeded ${allDesignRows.length} designs (${itemRows.length} with an item) across ${ownedPrefectures.size} owned prefectures.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
