/**
 * The 8 map regions charms are grouped into, plus the `collab` pseudo-region
 * for off-the-map (airline / rail / park exclusive) charms.
 *
 * Ported verbatim from prototype/index.html's `REGIONS` / `collabRegion`
 * objects — colours are per-region hues, not general design tokens, so they
 * live here as data (applied to elements via the `--rc` CSS custom
 * property) rather than in app/globals.css.
 */

export type RegionKey =
  | "hokkaido"
  | "tohoku"
  | "kanto"
  | "chubu"
  | "kinki"
  | "chugoku"
  | "shikoku"
  | "kyushu"
  | "okinawa";

export interface RegionInfo {
  key: RegionKey;
  ja: string;
  en: string;
  color: string;
  /** Prefecture codes (1-47) belonging to this region. */
  codes: number[];
}

export const REGIONS: Record<RegionKey, RegionInfo> = {
  hokkaido: { key: "hokkaido", ja: "北海道", en: "Hokkaido", color: "#7FA9C6", codes: [1] },
  tohoku: { key: "tohoku", ja: "東北", en: "Tōhoku", color: "#6E8E79", codes: [2, 3, 4, 5, 6, 7] },
  kanto: { key: "kanto", ja: "関東", en: "Kantō", color: "#C6813F", codes: [8, 9, 10, 11, 12, 13, 14] },
  chubu: {
    key: "chubu",
    ja: "中部",
    en: "Chūbu",
    color: "#4E6E9E",
    codes: [15, 16, 17, 18, 19, 20, 21, 22, 23],
  },
  kinki: { key: "kinki", ja: "近畿", en: "Kinki", color: "#96568A", codes: [24, 25, 26, 27, 28, 29, 30] },
  chugoku: { key: "chugoku", ja: "中国", en: "Chūgoku", color: "#AD8639", codes: [31, 32, 33, 34, 35] },
  shikoku: { key: "shikoku", ja: "四国", en: "Shikoku", color: "#4F9E89", codes: [36, 37, 38, 39] },
  kyushu: {
    key: "kyushu",
    ja: "九州",
    en: "Kyūshū",
    color: "#C25B4E",
    codes: [40, 41, 42, 43, 44, 45, 46],
  },
  // Okinawa stands on its own rather than being folded into Kyushu. The
  // eight-region scheme groups them, but the Ryukyu Kingdom was independent
  // until 1879 and its charms are distinctly Ryukyuan -- shisa, ryuso,
  // Yaeyama water buffalo, yanbaru kuina. It is also drawn as a detached
  // inset, so sharing Kyushu's bounds made every zoom to the region a
  // special case.
  okinawa: {
    key: "okinawa",
    ja: "沖縄",
    en: "Okinawa",
    color: "#BE5C86",
    codes: [47],
  },
};

export const REGION_LIST: RegionInfo[] = Object.values(REGIONS);

/** Pseudo-region for charms that don't map to a prefecture. */
export const COLLAB_REGION = {
  key: "collab" as const,
  ja: "コラボ",
  en: "Off the map",
  color: "#8C8375",
};

/** Which region a prefecture code (1-47) belongs to, or null if unknown. */
export function regionForCode(code: number): RegionKey | null {
  for (const region of REGION_LIST) {
    if (region.codes.includes(code)) return region.key;
  }
  return null;
}

/**
 * Whether text set on a region's solid colour should be dark (the ink token)
 * or light (the surface token). Measured against the site's ink (#2b2621,
 * relative luminance about 0.019) and paper (#f7f2e8, about 0.89): the two
 * give equal contrast at a background luminance of about 0.205, so anything
 * lighter takes ink. Kept here, beside the colours it reads, so components
 * never handle a colour value themselves.
 */
export function textOnRegionColour(hex: string): "ink" | "light" {
  const v = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(v.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.205 ? "ink" : "light";
}
