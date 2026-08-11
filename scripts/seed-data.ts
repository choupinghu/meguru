/**
 * The seed's data, with no side effects and no database.
 *
 * Pulled out of `scripts/seed.ts` (spec 0015/D1) so that `check-content.ts`
 * (and anything else that just wants to read the 54 designs' data) can
 * import it without also importing `seed.ts` — which ends in a bare
 * `main().catch(...)` at module scope that TRUNCATEs `items`/`designs` the
 * moment the module loads. This file must stay importable with no database
 * and no environment variables: no imports from `db/`, nothing that runs on
 * import besides building these plain objects.
 *
 * `scripts/seed.ts` imports `DOCUMENTED` / `OWNED` (and the raw pieces below)
 * from here and keeps the Drizzle row mappers, the truncate and the inserts
 * — those depend on `db/schema`'s row types, which is the reason they stay
 * on the other side of this seam.
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
 */

/** What the design depicts — a second axis for browsing/filtering. */
/** Shelf condition of one physical copy. Mirrors db/schema.ts's conditionEnum,
 * restated here because this file deliberately imports nothing from db/. */
export type Condition = "bnib" | "boxed-notag" | "nobox-tag" | "nobox-notag";

export type Motif =
  | "food"        // regional dish or produce
  | "landmark"    // place, building, natural landmark
  | "animal"      // creature
  | "nature"      // plant, flower, tree
  | "history"     // historical figure / warrior / costume
  | "folklore"    // legend, folk toy, yokai
  | "festival";   // matsuri, dance, costume event

export type Rarity = "common" | "uncommon" | "rare" | "grail";

/**
 * A documented-but-not-owned design: the cultural record. No `cond`,
 * `status` or `price` field exists on this type at all — that is the
 * type-level guarantee that a design with no item can never carry one.
 */
export type DocumentedDesign = {
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
export type OwnedDesign = {
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
  /** Design-level premier image, or null where none could be sourced. */
  imageUrl: string | null;
  /** Our own photograph of this copy, or null. Takes precedence over the
   * design-level image everywhere it exists — it is the honest one. */
  photoUrl: string | null;
  condition: Condition;
  /** Explicit region where a prefecture code cannot supply one. */
  region: string | null;
};

export const DOCUMENTED: DocumentedDesign[] = [
  // ---- Hokkaido ----
  { code: 1, name: "Lavender", ja: "ラベンダー", city: "Furano 富良野", motif: "nature", rarity: "grail", special: true, story: "The very first Gotochi Kitty — Hokkaidō, 1998. Where the whole line began." },

  // ---- Tōhoku ----
  { code: 2, name: "Apple Girl", ja: "りんご娘", city: "Hirosaki 弘前", motif: "food", rarity: "common", story: "Aomori grows over half of Japan's apples and Hirosaki is where that started — a castle town whose samurai lost their stipends in the Meiji Restoration and turned to fruit on land that was too cold for much else. The first Western seedlings reached the prefecture in the 1870s. Ringo musume, apple girl, is what the women who picked and sorted them were called." },
  { code: 4, name: "Masamune's Armour", ja: "政宗陣羽織", city: "Sendai 仙台", motif: "history", rarity: "rare", special: true, story: "Kitty in Date Masamune's crested war surcoat." },
  { code: 5, name: "Kiritanpo", ja: "きりたんぽ", city: "Akita 秋田", motif: "food", rarity: "uncommon", story: "New rice, half-mashed and moulded around a skewer of Akita cedar, grilled over coals until it colours, then cut into the pot. It is hunters' food from the Ōdate valley — matagi cooking, made from the rice left in the bag at the end of a day and simmered with whatever bird had been taken. It is still an autumn dish, eaten when the new crop comes in, which is the only time it is really right." },
  // Akabeko (code 7) removed here — deduped against the real, owned copy below (D2).

  // ---- Kantō ----
  { code: 9, name: "Three Wise Monkeys", ja: "日光三猿", city: "Nikkō 日光", motif: "folklore", rarity: "uncommon", story: "The three monkeys are one panel of eight carved on the sacred stable at Tōshō-gū, a sequence that runs through a whole life; this is the childhood one, about what a child should be shielded from. The pun is Japanese and does not survive translation — mizaru, kikazaru, iwazaru, where the negative ending -zaru sounds like saru, monkey. See not, hear not, speak not." },
  { code: 12, name: "Peanut", ja: "落花生", city: "Chiba 千葉", motif: "food", rarity: "common", story: "Chiba grows something like three-quarters of Japan's peanuts, most of it on the Shimōsa plateau, where the volcanic soil drains far too freely for rice but suits a crop that ripens underground. They arrived in the 1870s. Boiled or roasted in the shell and sold from roadside stands across the prefecture, and the local preference is to eat them while they are still warm." },
  { code: 13, name: "Tokyo Station", ja: "東京駅", city: "Marunouchi 丸の内", motif: "landmark", rarity: "common", special: true, story: "The Marunouchi side is the 1914 original: red brick, Dutch-inflected, by Tatsuno Kingo, who also built the Bank of Japan. It lost its domes and its top floor to firebombing in 1945 and then spent six decades under a flat makeshift roof, which is how most of the twentieth century knew it. What stands there now is a 2012 restoration back to the first shape." },
  { code: 14, name: "Yokohama Chinatown", ja: "横浜中華街", city: "Yokohama 横浜", motif: "landmark", rarity: "uncommon", story: "Yokohama's port opened to foreign trade in 1859, and Chinese merchants — many of them arriving as compradors and interpreters for Western firms rather than independently — settled the reclaimed ground beside it. It is the largest Chinatown in Japan. It is also built to be entered: ten gates stand around the edge, each set to a compass direction and its guardian god." },

  // ---- Chūbu ----
  { code: 15, name: "Sado Crested Ibis", ja: "佐渡トキ", city: "Sado 佐渡", motif: "animal", rarity: "rare", story: "The toki was common enough in the Edo period to be shot as a pest, then hunted for its feathers until it was almost gone. The last five wild Japanese birds were caught on Sado in 1981 to be bred in captivity, and the last of them, Kin, died on the island in 2003 aged thirty-six. Birds released there since 2008 have bred in the wild again, which is why Sado keeps the bird." },
  { code: 17, name: "Toshiie & Matsu", ja: "利家とまつ", city: "Kanazawa 金沢", motif: "history", rarity: "rare", special: true, story: "The Kaga lord and his wife — a Kanazawa pair." },
  { code: 19, name: "Mt. Fuji", ja: "富士山", city: "Fujiyoshida 富士吉田", motif: "landmark", rarity: "common", special: true, story: "Fujiyoshida sits at the northern foot, and the old climb begins at Kitaguchi Hongū Fuji Sengen shrine in the town rather than at the road station most people start from now. The place grew on pilgrims: the Fuji-kō confraternities who walked up in white lodged in oshi houses along the main street, and some of those houses are still standing." },
  { code: 21, name: "Shirakawa-gō", ja: "白川郷", city: "Shirakawa 白川", motif: "landmark", rarity: "uncommon", story: "Gasshō-zukuri means hands joined in prayer, which is what the roof pitch looks like — steep enough to shed metres of snow, thatched a metre thick, and framed without nails. The lofts under them were silkworm floors. UNESCO listed the village together with Gokayama in 1995, and the thatch is still replaced the old way, the whole community on one house at a time." },
  { code: 23, name: "Ebi Fry", ja: "エビフライ", city: "Nagoya 名古屋", motif: "food", rarity: "uncommon", story: "Nagoya's claim on breaded fried prawn is a joke that stuck. The comedian Tamori, working Nagoya into his act in the early 1980s, had locals calling it ebi furyā in a broad local accent; the city took the teasing and made it a signature instead of denying it. It is now one of the Nagoya-meshi dishes people travel for, on the strength of a gag about vowels." },

  // ---- Kinki ----
  { code: 25, name: "Kōga Ninja", ja: "甲賀忍者", city: "Kōka 甲賀", motif: "history", rarity: "rare", special: true, story: "Kōga and Iga sit on either side of the same mountains and are the two traditions Japanese ninjutsu is traced back to — clusters of small self-governing villages that stayed outside anyone's control long enough to make a trade of irregular war. The Kōga hired themselves out to whoever needed them. The place is spelled Kōka today; the ninja kept the older reading." },
  { code: 26, name: "Kinkaku-ji", ja: "金閣寺", city: "Kyoto 京都", motif: "landmark", rarity: "uncommon", special: true, story: "Properly Rokuon-ji, and properly a retirement villa — Ashikaga Yoshimitsu took the estate in 1397 and it became a temple only when he died. Just the upper two of its three storeys carry gold leaf, and each storey is in a different architectural style. The pavilion standing now dates from 1955: a novice monk burned the original in 1950, which Mishima made a novel from." },
  { code: 27, name: "Kushikatsu", ja: "串カツ", city: "Shinsekai 新世界", motif: "food", rarity: "common", story: "Shinsekai went up in 1912 as an amusement quarter, came down in the world afterwards, and kushikatsu is what it eats — anything at all on a skewer, crumbed, fried, sold by the piece for very little. The rule everyone knows is about the shared sauce pot: one dip, never a second. The free cabbage on the counter is there to scoop it with instead." },
  { code: 29, name: "Prince Shōtoku", ja: "聖徳太子", city: "Nara 奈良", motif: "history", rarity: "uncommon", story: "Shōtoku is the figure Japanese Buddhism hangs itself on: regent for Empress Suiko, credited with the seventeen-article constitution and with sending the first embassies to Sui China. Hōryū-ji, which he founded west of Nara, holds the oldest wooden buildings standing anywhere on earth. How much of that biography is his and how much was written onto him later is still argued." },

  // ---- Chūgoku ----
  { code: 31, name: "GeGeGe no Kitarō", ja: "ゲゲゲの鬼太郎", city: "Sakaiminato 境港", motif: "folklore", rarity: "rare", special: true, story: "Yōkai crossover from Mizuki Shigeru's hometown." },
  { code: 33, name: "Momotarō", ja: "桃太郎", city: "Okayama 岡山", motif: "folklore", rarity: "uncommon", story: "Okayama ties the peach boy to Kibitsuhiko, a prince in the old chronicles who put down a local strongman called Ura — Ura read as the demon, and his hilltop fortress Kinojō as Onigashima. Whether the tale really began there is disputed by everyone except Okayama. But the millet dumplings the boy pays his animals with pun on Kibi, the province's old name, and the city has sold them ever since." },
  { code: 34, name: "Momiji", ja: "もみじ", city: "Miyajima 宮島", motif: "nature", rarity: "common", story: "Momijidani, the maple valley behind Itsukushima shrine, is why the island is a maple place at all — the trees there were planted. Momiji manjū, the leaf-shaped cake with bean paste inside, was invented on Miyajima in the early 1900s, and the story told is that an inn asked its confectioner for something shaped like the leaves in the valley above it." },

  // ---- Shikoku ----
  { code: 36, name: "Awa Odori", ja: "阿波おどり", city: "Tokushima 徳島", motif: "festival", rarity: "rare", special: true, story: "Awa is what Tokushima used to be called, and the dance is its Obon: four days in mid-August, teams called ren moving through the streets behind shamisen, taiko and a two-note flute figure that everyone in Japan can hum. The men dance low and loose, the women on the front edge of their geta under a folded straw hat. It draws over a million people to a city of a quarter that." },
  { code: 38, name: "Iyokan", ja: "いよかん", city: "Matsuyama 松山", motif: "food", rarity: "common", story: "Iyo is what Ehime was called before it was Ehime, and the prefecture is Japan's citrus country — the Inland Sea slopes are terraced with it, because fruit will hold on ground too steep to do anything else with. The iyokan itself was found in Yamaguchi in 1886 and brought over, where it took. Easier to peel than an orange, and sourer than a mikan." },
  { code: 39, name: "Sakamoto Ryōma", ja: "坂本龍馬", city: "Kōchi 高知", motif: "history", rarity: "rare", story: "Ryōma was a low-ranking Tosa samurai who left his domain without leave, which was a capital offence, and spent his short career getting enemies into the same room: the Satsuma–Chōshū alliance that ended the shogunate was largely his brokering. He was assassinated in Kyoto in 1867 aged thirty-one, a month after the shogun gave up power and before anything had replaced it. His statue stands on Katsurahama, looking out to sea." },

  // ---- Kyūshū & Okinawa ----
  { code: 40, name: "Hakata Mentaiko", ja: "博多明太子", city: "Hakata 博多", motif: "food", rarity: "uncommon", story: "Karashi mentaiko is a Korean dish naturalised in Hakata. Kawahara Toshio grew up in Busan eating myeongnan-jeot, and after being repatriated spent years reworking it for Japanese palates — less fermented, more chilli — before anyone would buy it. He began selling it in 1949. The Shinkansen reaching Hakata in 1975 turned it into the thing you are expected to bring home." },
  { code: 43, name: "Mt. Aso", ja: "阿蘇山", city: "Aso 阿蘇", motif: "landmark", rarity: "uncommon", story: "Aso's caldera is among the largest anywhere that people actually live inside — some fifty thousand of them, with towns, rice fields and a railway line on the crater floor. The five peaks standing in the middle are what is left of the original cone; Nakadake is still active and still closes the road when it gases. The grassland on the rim survives because it is burned off every spring." },
  { code: 46, name: "Yakushima Jōmon Cedar", ja: "屋久島縄文杉", city: "Yakushima 屋久島", motif: "nature", rarity: "rare", story: "Jōmon Sugi is the largest of the island's yakusugi and, by most estimates, the oldest living thing in Japan — somewhere between two and seven thousand years, a range that wide because the trunk is hollow and cannot be cored. It is five hours' walk in and five back. Yakushima's cedars survived the loggers because the ones on the worst ground grew too slowly to be worth the felling." },
  { code: 47, name: "Gōyā", ja: "ゴーヤー", city: "Naha 那覇", motif: "food", rarity: "uncommon", special: true, story: "Spelled with the long final vowel in Okinawan rather than the mainland's gōya. Bitter melon does what the islands need of it: it grows straight through the heat, and gōyā chanpurū — stir-fried with island tofu, egg and pork — is an everyday dinner rather than a regional speciality anyone makes a fuss of. Okinawa eats several times more of it per head than anywhere else in Japan." },

  // ---- Off the map (company / venue exclusives, no prefecture) ----
  { collab: true, brand: "JR West", name: "Hello Kitty Shinkansen", ja: "ハローキティ新幹線", motif: "landmark", rarity: "rare", special: true, story: "From the 2018 JR West Hello Kitty Shinkansen (Shin-Ōsaka ↔ Hakata)." },
  { collab: true, brand: "Sanrio Puroland", name: "Puroland Exclusive", ja: "ピューロランド限定", motif: "landmark", rarity: "rare", story: "Park-exclusive edition." },
];

// The 7 designs `special: true` (D4). 0004/0006/0008 are unplaced;
// the others carry a real prefecture badge.
export const SPECIAL_NOS = new Set(["0004", "0005", "0009", "0011", "0012", "0016", "0019"]);

// The 3 unplaced designs (D5) — null prefectureCode, region "collab".
export const UNPLACED: Record<string, { isCollab: boolean; brand: string | null }> = {
  "0004": { isCollab: false, brand: null }, // Yoshitsune & Benkei
  "0006": { isCollab: true, brand: "Miyasaka Jozo" }, // Shinshu-ichi Miso
  "0008": { isCollab: true, brand: null }, // Aquarium exclusive
};

// The 25 rows of photos/manifest.csv, transcribed by hand (several `notes`
// fields are quoted and contain commas, so this was read row-by-row rather
// than naively comma-split).
export const OWNED_RAW: {
  no: string;
  code: number | null;
  city: string | null;
  name: string;
  ja: string;
  motif: Motif;
  note: string;
  /** Defaults to "bnib" — true of all 25 charms photographed in 2026-07. */
  condition?: Condition;
  /** Override only where a charm names a *region* but no prefecture, so it
   * would otherwise fall to "collab" for want of a prefecture code. */
  region?: string;
}[] = [
  { no: "0001", code: 28, city: "Kobe 神戸", name: "Kobe Chinatown", ja: "神戸中華街", motif: "landmark", note: "Kitty in Chinese dress with a tray of buns; Nankinmachi" },
  { no: "0002", code: 13, city: "Arakawa 荒川", name: "Arakawa Yosakoi", ja: "荒川よさこい", motif: "festival", note: "Yosakoi dancer with naruko clappers; Toden Arakawa tram on card" },
  { no: "0003", code: 22, city: "Lake Hamana 浜名湖", name: "Lake Hamana", ja: "浜名湖", motif: "animal", note: "Kitty in a fish hood in a woven creel marked 浜名湖" },
  // Provenance reasoning behind 0004's note (kept here, not shown to
  // visitors): Design confirmed: the vertical red label is the five-glyph
  // name 義経＆弁慶, ending in 慶 — it names the characters, not a place.
  // This is the only card of the 25 with no 「〇〇限定」 prefecture badge, so
  // it is genuinely unplaced on the packaging and sits off the map alongside
  // the collabs. Hiraizumi (Iwate) or Kyoto (Gojo Bridge) are the likely
  // origins; only purchase provenance would settle it.
  { no: "0004", code: null, city: null, name: "Yoshitsune & Benkei", ja: "義経＆弁慶", motif: "history", note: "No 「〇〇限定」 prefecture badge on the packaging — this one names its characters, not a place." },
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

  // --- Batch shot 2026-08-10. Loose charms, so the first that are not BNIB.
  // Three more from this batch are photographed but not yet identified and are
  // deliberately absent: a null beats an invention.
  { no: "0026", code: 1, city: null, name: "Ezo Sika Deer", ja: "エゾシカ", motif: "animal", condition: "nobox-tag", note: "Sold on a 北海道限定 tag in the Hello Kitty Lavender line; sleeve and tag still with it" },
  { no: "0027", code: 12, city: "Narita 成田", name: "Narita Airport", ja: "成田空港", motif: "landmark", condition: "nobox-notag", note: "Kitty as an aircraft with a hinomaru on the tail; the wings read NARITA AIRPORT" },
  { no: "0029", code: 46, city: "Kagoshima 鹿児島", name: "Saigo Takamori", ja: "西郷隆盛", motif: "history", condition: "nobox-tag", note: "Kitty in Satsuma dress with Saigō's dog; retains its 鹿児島 ご当地キティ tag" },
  { no: "0030", code: 46, city: "Sakurajima 桜島", name: "Sakurajima Daikon", ja: "桜島大根", motif: "food", condition: "nobox-tag", note: "Retains its ご当地キティ 鹿児島 tag" },
  { no: "0031", code: null, city: null, name: "Wasabi", ja: "わさび", motif: "food", condition: "nobox-notag", note: "Kitty in green beside a leafy wasabi rhizome. Nothing on the charm names a place" },
  // 北陸産 names the Hokuriku region and no prefecture within it, so this one
  // is placed as finely as the evidence allows and no finer.
  { no: "0034", code: null, city: "Hokuriku 北陸", region: "chubu", name: "Hokuriku Crab", ja: "北陸産かに", motif: "food", condition: "nobox-notag", note: "The moulded plaque reads 北陸産 — the Hokuriku region rather than any one prefecture" },
  { no: "0035", code: 1, city: null, name: "Sea Urchin", ja: "北海道産うに", motif: "food", condition: "nobox-notag", note: "The moulded plaque reads 北海道産" },
  { no: "0036", code: 22, city: "Lake Hamana 浜名湖", name: "Lake Hamana Eel", ja: "浜名湖名物", motif: "food", condition: "nobox-notag", note: "The moulded plaque reads 浜名湖名物; Kitty carries a skewer and a fan" },
  { no: "0037", code: 25, city: "Lake Biwa 琵琶湖", name: "Lake Biwa Ayu", ja: "琵琶湖産鮎", motif: "food", condition: "nobox-notag", note: "The moulded plaque reads 琵琶湖産鮎" },
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
export const STORIES: Record<string, string> = {
  // --- Batch shot 2026-08-10.
  "0026":
    "The Ezo sika is Hokkaidō's own subspecies and the largest of Japan's sika deer, far heavier-coated than the ones that wander Nara. Hunting and the deep snows of the 1880s brought it close to extinction, and protection worked so thoroughly that the herds now have to be culled — venison has become an ordinary Hokkaidō dish rather than a rarity.",
  "0027":
    "Narita opened in 1978 after more than a decade of fighting. The government picked farmland at Sanrizuka without asking the farmers on it, and the protests that followed — barricades, tunnels, riot police, deaths on both sides — held the airport back for years and kept it to a single runway for decades afterwards. It sits sixty kilometres from the city it is named for serving.",
  "0029":
    "Saigō Takamori did more than almost anyone to bring down the shogunate, then died fighting the government he had helped build. In 1877 he led the Satsuma Rebellion out of Kagoshima against the new conscript army and the abolition of the samurai class, and lost. He was pardoned twelve years later. He is nearly always shown in plain country dress with his dog, which is how Kagoshima prefers to remember him.",
  "0030":
    "The Sakurajima daikon is the largest radish in the world — round rather than long, and heavy enough that the record holders pass thirty kilograms. It grows in volcanic ash on the slopes of an active volcano, in soil too poor at holding water for most things, which is precisely what the radish wants.",
  "0031":
    "Real wasabi is a stream plant. It grows on terraced gravel beds in cold running water and takes a year and a half or more to make a usable rhizome, which is why nearly everything served as wasabi is horseradish with mustard and green colouring. The rhizome is grated in slow circles on sharkskin and loses its heat within about fifteen minutes. Nothing on this charm names a place, and Shizuoka and Nagano would both claim it.",
  "0034":
    "Zuwaigani, the snow crab, comes out of the Sea of Japan between November and March, and the Hokuriku coast has spent a long time arguing about whose is best. Fukui lands them as Echizen-gani and tags each one at the boat; Ishikawa calls its own Kanō-gani. This charm declines to take sides — its plaque reads 北陸産, the region, which is as precisely as it can honestly be placed.",
  "0035":
    "Most of Japan's sea urchin comes out of Hokkaidō, where divers work from small boats with a glass-bottomed box in one hand and a hooked pole in the other. The prized ones graze the kelp beds off Rishiri and Rebun and taste of that kelp. What is eaten is not roe but the gonads — five of them, lifted out whole.",
  "0036":
    "Lake Hamana is brackish: a freshwater lake that broke through to the sea in an earthquake in 1498 and never closed again. That turned out to suit eels. Farming began there in 1900 and put Hamana's name on the trade for most of a century. Kabayaki is the local form — split, skewered, steamed, then grilled over charcoal under a sweet soy glaze, fanned the whole time.",
  "0037":
    "Ayu live a single year and taste, improbably, of melon. Most run to sea as fry and come back upriver in spring, but Lake Biwa holds a landlocked population that never leaves and never grows large: ko-ayu, small ayu. Shiga ships them live across Japan to stock rivers that have none, so a good part of the country's ayu started out in this lake. They are eaten whole, salted and grilled.",
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

/** Manifest rows with an owner-verified design-level reference image in
 * public/img/charms/. The other twelve are blister-packed: Kitty sits behind
 * plastic with printed card behind her, so no crop or mask isolates her, and
 * they keep the CharmArt placeholder. See public/img/charms/SOURCES.md. */
const REFERENCE_NOS = new Set([
  "0001", "0006", "0010", "0011", "0013", "0015", "0018",
  "0019", "0021", "0022", "0023", "0024", "0025",
]);

/** Charms photographed loose enough that Kitty could be cut out of our own
 * photograph. 0027, 0029 and 0030 are absent on purpose: their source frames
 * are all under 900px and the resulting figure crops are 138-220px, too soft
 * to show. They are queued for a reshoot and fall back to CharmArt until then. */
const OWN_PHOTO_NOS = new Set(["0026", "0031", "0034", "0035", "0036", "0037"]);

export const OWNED: OwnedDesign[] = OWNED_RAW.map((r) => {
  const unplaced = UNPLACED[r.no];
  const special = SPECIAL_NOS.has(r.no);
  const rarity: "uncommon" | "rare" = unplaced ? "rare" : "uncommon";
  // D3 remains a policy, not a per-charm valuation — extended here for the
  // first non-BNIB charms, since condition is the one thing a buyer can see.
  const condition = r.condition ?? "bnib";
  const price = unplaced
    ? 32
    : special
      ? 28
      : condition === "bnib"
        ? 24
        : condition === "nobox-tag"
          ? 20
          : 18;
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
    imageUrl: REFERENCE_NOS.has(r.no) ? `/img/charms/${r.no}-reference.webp` : null,
    photoUrl: OWN_PHOTO_NOS.has(r.no) ? `/img/charms/${r.no}-figure.webp` : null,
    condition: r.condition ?? "bnib",
    region: r.region ?? null,
  };
});
