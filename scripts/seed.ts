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
 * Run with: npm run db:seed (dev) or npm run db:seed:prod (the live branch).
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
  /** Researched write-up (0007a). Null where it could not be sourced. */
  story: string | null;
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

/**
 * Write-ups for the owned 25 (spec 0007a). Two to four sentences each: what
 * the motif is, and why this place is the one associated with it.
 *
 * These are researched, not generated to fill the field. Where a design could
 * not be sourced it is absent from this map and `story` stays null — 0007
 * requires that a null beat an invention, because a plausible-sounding piece
 * of folklore attached to a real charm is worse than an empty paragraph.
 *
 * Deliberately omitted:
 *   0008  the aquarium exclusive — the card does not name its venue, so there
 *         is no subject to research. Nothing true can be said about which
 *         aquarium sold it or why it shows a ray.
 *
 * Hedged on purpose:
 *   0006  written about Shinshū miso rather than the company, because the
 *         manifest's attribution to Miyasaka Jozo is not something this
 *         write-up needs to assert to be worth reading.
 *   0020  written about Hokkaidō adzuki generally — the manifest flags the
 *         Tokachi reading as probable, not certain, so the caveat stays in
 *         the item's note and out of the design's story.
 */
const STORIES: Record<string, string> = {
  "0001":
    "Nankinmachi grew up beside Kobe's harbour after the port opened to foreign trade in 1868, built by Chinese merchants who were barred from the designated foreign quarter and settled just outside it instead. It is now one of Japan's three great Chinatowns, with Yokohama and Nagasaki, and it is a place you eat standing up — the steamed pork buns sold from its stalls are what the queues are for.",
  "0002":
    "Yosakoi is a young festival. It was invented in Kōchi in 1954 to lift a flagging local economy, and its dancers carry naruko, the wooden clappers once used to scare birds off the rice. It spread as a form any neighbourhood could adopt, and Arakawa's summer event is one of those adoptions — which is why a Tokyo ward's charm dances a Tosa dance, with the Toden Arakawa Line, the last of the city's streetcars, running behind it.",
  "0003":
    "Hamanako is brackish rather than fresh: an earthquake in 1498 broke the sandbar that had closed it and let the sea in. That half-salt water is why Japan's eel farming began here around 1900, and unagi is still what the lake is known for — hence the fish hood and the woven creel.",
  "0004":
    "Minamoto no Yoshitsune won the Genpei War for his half-brother and was hunted down by him for it. Benkei, the warrior monk who by legend lost a duel to him on Kyoto's Gojō Bridge and followed him ever after, is said to have died on his feet at Koromogawa in 1189 — shot full of arrows holding a bridge long enough for Yoshitsune to die by his own hand inside. They have been inseparable in Japanese storytelling since, which is why this charm names two characters and no place at all.",
  "0005":
    "Kegon Falls is where Lake Chūzenji empties. Lava from Mt. Nantai dammed the valley, the lake gathered behind it, and the water now leaves over a ninety-seven-metre drop. It is counted among Japan's three great waterfalls, and an elevator cut down through the rock puts you level with the plunge pool; the name comes from the Kegon Sutra, like much else in Nikkō.",
  "0006":
    "Nagano — Shinshū, in the older name this label uses — makes more miso than any other prefecture in Japan: a rice miso fermented in cold mountain air and sold pale gold rather than dark. This is a maker's promotional charm rather than a regional one, which is why it carries a company's name where the others carry a place's.",
  "0007":
    "Eisa is danced at Obon, when the dead are said to come home; neighbourhood youth associations parade through the streets with drums to see them off again at the end of the visit. It is a moving dance rather than a staged one, and the drum patterns and costumes still differ from village to village. The gate on the card is Shureimon, the approach to Shuri Castle, seat of the Ryūkyū kings whose court dress the charm borrows.",
  "0009":
    "The okojo is a stoat, and in the Japan Alps it lives above the treeline, hunting voles through the rocks. It moults brown in summer and near-white in winter, keeping only a black tail-tip, which is why hikers count a sighting as a small event. This one was a Nagano-only release, dated 2002.",
  "0010":
    "Mt. Daisen is the highest mountain in the Chūgoku region and was a centre of Shugendō, the mountain asceticism whose practitioners trained along its ridges. Tengu belong to that world — mountain spirits, part guardian and part trickster — and the karasu-tengu is the crow-billed, winged kind rather than the long-nosed one. Kitty carries the staff and wings of the ascetics who were said to become them.",
  "0011":
    "A sandbar three and a half kilometres long crosses Miyazu Bay, held together by some eight thousand pines. Its name means bridge to heaven, and the traditional way to look at it is matanozoki: bend forward and view it upside down between your legs, so the bar appears to hang in the sky. It has been one of the Three Views of Japan since the 1640s, named alongside Matsushima and Miyajima.",
  "0012":
    "Toba Aquarium keeps the only dugong in Japan, and one of very few anywhere in captivity. Dugongs graze seagrass instead of hunting it, which is thought to lie behind the mermaid stories that followed them, and they breed slowly enough that nets alone can empty a coastline. Toba is fitting ground for it — this is ama country, where women have free-dived the same water for shellfish for centuries.",
  "0013":
    "The Tosa was made in Kōchi during the Meiji era by crossing the native Shikoku dog with imported mastiffs, bulldogs and Great Danes, bred for a fighting style that rewards silence: a dog that growls or cries has lost. Bouts survive in Kōchi as a licensed tradition and borrow sumo's furniture wholesale — ranks, ceremonial aprons, a champion's tiered rope. Kitty is wearing the rope.",
  "0014":
    "Ōkuma Shigenobu founded the school that became Waseda University in 1882, while out of government, as a private counterweight to the imperial universities training state officials. The name belonged to the district first: waseda means a paddy of early-ripening rice. The Toden Arakawa Line terminates here, the last of Tokyo's streetcars, which is why the same tram turns up on this card and on the Arakawa one.",
  "0015":
    "Gama no abura — toad oil — was sold at the foot of Mt. Tsukuba by pitchmen whose patter was the real product: a blade drawn, an arm apparently opened, the salve applied, the wound gone. The spiel outlived any belief in the ointment and survives as a performance genre in its own right. Tsukuba itself rises alone off the Kantō plain with two summits, one male and one female, and a ropeway strung between them.",
  "0016":
    "Niimi Nankichi wrote Gon-gitsune at eighteen, in Handa where he was born, and died of tuberculosis at twenty-nine. In it a lone fox steals an eel from a villager, learns the man's mother has died, guesses what the eel was for, and starts leaving chestnuts and mushrooms at his door in secret — and is shot before the man understands who his benefactor was. Japanese schoolchildren all read it, which is why a fox holding a fish needs no caption here.",
  "0017":
    "Awaji has grown onions since the 1880s, and its mild winters and sandy, well-drained ground produce a bulb sweet enough to eat raw. They are cured slowly in slatted wooden huts left standing out in the fields, and those drying sheds are as much a part of the island's look as the onions are of its cooking.",
  "0018":
    "A lord out hawking in Meguro eats grilled pike mackerel at a farmhouse and cannot forget it. Back home he asks for sanma; his kitchen, thinking an oily fish beneath him, steams the fat out and serves it ruined, and he concludes that sanma is no good unless it comes from Meguro. The joke is that Meguro is inland and lands no fish whatever — and Meguro now holds a sanma festival every autumn on the strength of the joke.",
  "0019":
    "When Enzō-ji was built at Yanaizu in the ninth century, red oxen are said to have hauled the timber, and one refused to leave when the work was finished and turned to stone. The papier-mâché akabeko copies that ox: a red cow with a nodding head, made in Aizu ever since. It was given to children as a guard against illness, smallpox above all, and the black spots painted on some of them are the marks of the disease it was meant to take instead.",
  "0020":
    "Hokkaidō grows the large majority of Japan's adzuki, and nearly every traditional sweet in the country passes through it: the beans are boiled down with sugar into anko, the paste inside dorayaki, taiyaki, daifuku and monaka. They carry meaning beyond sweetness too — sekihan, rice steamed with adzuki until it stains red, is what gets served for a birth, a wedding or a graduation.",
  "0021":
    "Hiroshi Hara's Umeda Sky Building, finished in 1993, is two towers joined only at the very top, where a ring-shaped roof deck sits open to the weather a hundred and seventy-three metres up. Reaching it means an escalator crossing the gap between the towers with glass underfoot and nothing below. The original design called for four towers; two were built.",
  "0022":
    "Benzaiten arrived in Japan from the river goddess Saraswati and kept both the water and the music: she is worshipped on islands and beside ponds, and she carries a biwa. Enoshima is one of her three great sites, and its Myōon Benzaiten is an unusual figure — seated, carved nude, lute in hand, from the Kamakura period. On a clear day Fuji stands across the bay behind the torii, which is the view the card draws.",
  "0023":
    "Kondō Isami led the Shinsengumi, the swordsmen the shogunate kept in Kyoto through its final years to police a city full of men who wanted it gone. He was a farmer's son from Musashi who reached that command through a sword school rather than by birth, which those few years briefly allowed. Their pale haori carried a single character — 誠, makoto, sincerity — and he was beheaded in 1868, once the side he policed for had lost.",
  "0024":
    "Tazawa-ko is the deepest lake in Japan at four hundred and twenty-three metres, deep enough that it never freezes over. The story says a girl named Tatsuko prayed to keep her beauty and was told to drink from the lake; she drank, and became the dragon that lives in it. A gilded statue of her stands at the shore, facing the water she went into.",
  "0025":
    "Haguro is the lowest and most visited of the Dewa Sanzan, the three mountains Shugendō ascetics walk as a passage through death and rebirth, with Haguro standing for the present world. The way up is two thousand four hundred and forty-six stone steps through cedar, past a five-storey pagoda that has stood in some form since the tenth century. The yamabushi who make the circuit wear white, the colour of the dead, because that is the whole point of the walk.",
};

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
    story: STORIES[r.no] ?? null,
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
    story: d.story,
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

/**
 * Two targets, matching scripts/migrate.ts:
 *   npm run db:seed        -> DATABASE_URL            (the dev branch)
 *   npm run db:seed:prod   -> PRODUCTION_DATABASE_URL (the live site)
 *
 * Production is a *named* target rather than something you reach by editing
 * DATABASE_URL, for the same reason migrating is: this script TRUNCATEs before
 * inserting, so a forgotten variable swap would wipe live data on the next
 * routine `npm run db:seed`. The endpoint is printed before anything runs.
 */
const toProduction = process.env.SEED_TARGET === "production";

async function main() {
  const varName = toProduction ? "PRODUCTION_DATABASE_URL" : "DATABASE_URL";
  const url = process.env[varName];

  if (!url) {
    throw new Error(
      toProduction
        ? "PRODUCTION_DATABASE_URL is not set. Add the live branch's pooled connection string to .env.local to seed production."
        : "DATABASE_URL is not set. Add the pooled Neon connection string to .env.local before seeding."
    );
  }

  const endpoint = url.match(/@(ep-[a-z0-9-]+)/)?.[1] ?? "unknown endpoint";
  console.log(
    `Target: ${toProduction ? "PRODUCTION" : "dev"}  (${varName} -> ${endpoint})`
  );
  if (toProduction) {
    console.log(
      "This is the live database, and seeding TRUNCATEs first. Ctrl-C within 5s to abort."
    );
    await new Promise((r) => setTimeout(r, 5000));
  }

  const sql = neon(url);
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
  const withStory = allDesignRows.filter((d) => d.story != null).length;
  console.log(
    `Seeded ${allDesignRows.length} designs (${itemRows.length} with an item) across ${ownedPrefectures.size} owned prefectures.`
  );
  console.log(
    `${withStory} of ${allDesignRows.length} designs carry a write-up; ${allDesignRows.length - withStory} are deliberately null.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
