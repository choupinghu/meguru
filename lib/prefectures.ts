/**
 * All 47 Japanese prefectures, keyed by the `prefecture_code` (1-47) used in
 * the `charms` table. Ported from prototype/index.html's inline SVG
 * `<title>` elements (e.g. "沖縄 / Okinawa") into typed data.
 */

export interface Prefecture {
  ja: string;
  en: string;
}

export const PREFECTURES: Record<number, Prefecture> = {
  1: { ja: "北海道", en: "Hokkaido" },
  2: { ja: "青森", en: "Aomori" },
  3: { ja: "岩手", en: "Iwate" },
  4: { ja: "宮城", en: "Miyagi" },
  5: { ja: "秋田", en: "Akita" },
  6: { ja: "山形", en: "Yamagata" },
  7: { ja: "福島", en: "Fukushima" },
  8: { ja: "茨城", en: "Ibaraki" },
  9: { ja: "栃木", en: "Tochigi" },
  10: { ja: "群馬", en: "Gunma" },
  11: { ja: "埼玉", en: "Saitama" },
  12: { ja: "千葉", en: "Chiba" },
  13: { ja: "東京", en: "Tokyo" },
  14: { ja: "神奈川", en: "Kanagawa" },
  15: { ja: "新潟", en: "Niigata" },
  16: { ja: "富山", en: "Toyama" },
  17: { ja: "石川", en: "Ishikawa" },
  18: { ja: "福井", en: "Fukui" },
  19: { ja: "山梨", en: "Yamanashi" },
  20: { ja: "長野", en: "Nagano" },
  21: { ja: "岐阜", en: "Gifu" },
  22: { ja: "静岡", en: "Shizuoka" },
  23: { ja: "愛知", en: "Aichi" },
  24: { ja: "三重", en: "Mie" },
  25: { ja: "滋賀", en: "Shiga" },
  26: { ja: "京都", en: "Kyoto" },
  27: { ja: "大阪", en: "Osaka" },
  28: { ja: "兵庫", en: "Hyogo" },
  29: { ja: "奈良", en: "Nara" },
  30: { ja: "和歌山", en: "Wakayama" },
  31: { ja: "鳥取", en: "Tottori" },
  32: { ja: "島根", en: "Shimane" },
  33: { ja: "岡山", en: "Okayama" },
  34: { ja: "広島", en: "Hiroshima" },
  35: { ja: "山口", en: "Yamaguchi" },
  36: { ja: "徳島", en: "Tokushima" },
  37: { ja: "香川", en: "Kagawa" },
  38: { ja: "愛媛", en: "Ehime" },
  39: { ja: "高知", en: "Kochi" },
  40: { ja: "福岡", en: "Fukuoka" },
  41: { ja: "佐賀", en: "Saga" },
  42: { ja: "長崎", en: "Nagasaki" },
  43: { ja: "熊本", en: "Kumamoto" },
  44: { ja: "大分", en: "Oita" },
  45: { ja: "宮崎", en: "Miyazaki" },
  46: { ja: "鹿児島", en: "Kagoshima" },
  47: { ja: "沖縄", en: "Okinawa" },
};
