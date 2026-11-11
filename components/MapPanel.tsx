import type { CSSProperties } from "react";
import Link from "next/link";
import CharmThumb from "./CharmThumb";
import type { CharmView, DesignView } from "@/lib/charms";
import { locationLabel, motifLabel, toCharmView } from "@/lib/charms";
import { PREFECTURES } from "@/lib/prefectures";
import { COLLAB_REGION, REGIONS, REGION_LIST, textOnRegionColour, type RegionKey } from "@/lib/regions";

/**
 * The four states of the drill-down side panel, ported from the
 * prototype's `renderOverview` / `selectRegion` / `selectPref`, plus a
 * fourth added by spec 0010:
 *  - `overview`  -- All Japan: a one-line total + the nine regions as bubbles.
 *  - `region`    -- that region's designs, with a back-to-all-Japan control.
 *  - `prefecture`-- that prefecture's designs, with a back-to-region control.
 *  - `charm`     -- a single Discover pick (0010): a preview, not a second
 *    charm page -- see `CharmPanel` below. `region` is null for a placeless
 *    charm, which is what selects the "Off the map" crumb.
 * MapExplorer derives this from its selection state and hands it down;
 * MapPanel itself owns no state. `charms` is one entry per design (see
 * spec 0005), so every count below is design-based.
 */
export type PanelView =
  | {
      kind: "overview";
      totalCharms: number;
      prefecturesReached: number;
      regionCounts: Record<RegionKey, number>;
    }
  | { kind: "region"; region: RegionKey; charms: DesignView[]; reached: number[] }
  | { kind: "prefecture"; region: RegionKey; code: number; charms: DesignView[] }
  | { kind: "charm"; design: DesignView; region: RegionKey | null };

interface MapPanelProps {
  view: PanelView;
  onSelectRegion: (region: RegionKey) => void;
  onSelectPrefecture: (code: number) => void;
}

/** aria-live="polite" so screen readers announce the panel's new contents
 * whenever a region/prefecture selection swaps them out. */
export default function MapPanel({
  view,
  onSelectRegion,
  onSelectPrefecture,
}: MapPanelProps) {
  return (
    <aside className="panel" aria-live="polite">
      {view.kind === "overview" ? (
        <OverviewPanel view={view} onSelectRegion={onSelectRegion} />
      ) : view.kind === "region" ? (
        <RegionPanel view={view} onSelectPrefecture={onSelectPrefecture} />
      ) : view.kind === "prefecture" ? (
        <PrefecturePanel view={view} />
      ) : (
        // A Discover pick's "← Back" resets to the overview (D4 item 9) --
        // there's no single drill-down level to unwind back to, since a
        // placed charm may have been surfaced from any level, and a
        // placeless one from none at all.
        <CharmPanel
          design={view.design}
          thumbCharm={toCharmView(view.design)}
          region={view.region}
          note={view.design.items[0]?.note ?? null}
        />
      )}
    </aside>
  );
}

function OverviewPanel({
  view,
  onSelectRegion,
}: {
  view: Extract<PanelView, { kind: "overview" }>;
  onSelectRegion: (region: RegionKey) => void;
}) {
  // Owner, 2026-11-11: no "All Japan" heading (the map's trail says it), no
  // 巡ってみましょう line, no note that the map glows where the collection
  // reaches (it plainly does), and no per-region counts -- the point is to go
  // and look, not to tally. The nine regions fill the panel as a 3x3 grid of
  // bubbles in their own colour, kanji first.
  return (
    <div className="overview">
      <h3 className="overview-title">
        {view.totalCharms} charms across {view.prefecturesReached} prefectures
      </h3>
      <div className="reg-grid">
        {REGION_LIST.map((region) => {
          const count = view.regionCounts[region.key];
          return (
            <button
              key={region.key}
              type="button"
              className="reg-cell"
              data-region={region.key}
              disabled={count === 0}
              style={
                {
                  "--rc": region.color,
                  "--rt":
                    textOnRegionColour(region.color) === "ink"
                      ? "var(--ink)"
                      : "var(--surface)",
                } as CSSProperties
              }
              onClick={() => onSelectRegion(region.key)}
            >
              <span className="rj">{region.ja}</span>
              <span className="rn">{region.en}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Rows of omamori for a region of n prefectures, each row centred: 5 is
// 2-1-2 and 7 is 2-3-2, so an odd count stays balanced rather than leaving one
// hanging. Anything else fills rows of three, with the short row on top.
function pipRows(n: number): number[] {
  const fixed: Record<number, number[]> = {
    1: [1],
    2: [2],
    3: [3],
    4: [2, 2],
    5: [2, 1, 2],
    6: [3, 3],
    7: [2, 3, 2],
    8: [3, 2, 3],
    9: [3, 3, 3],
  };
  if (fixed[n]) return fixed[n];
  const rows = Array.from({ length: Math.floor(n / 3) }, () => 3);
  return n % 3 ? [n % 3, ...rows] : rows;
}

function RegionPanel({
  view,
  onSelectPrefecture,
}: {
  view: Extract<PanelView, { kind: "region" }>;
  onSelectPrefecture: (code: number) => void;
}) {
  // Every prefecture in the region as a box in the region's colour, kanji over
  // English (owner, 2026-11-11) -- the region-level counterpart of the All
  // Japan bubbles, but shaped as omamori (owner: boxes felt rigid, and the
  // charms are hung-up keepsakes much like omamori). One with no charms yet is
  // faded and cannot be picked. Each carries its prefecture's motif. Rows are
  // centred and balanced (see pipRows). The trail names the region and its
  // button leads back, so no heading here.
  const region = REGIONS[view.region];
  const reached = new Set(view.reached);
  const rows = pipRows(region.codes.length);
  const cols = Math.max(...rows);
  // Each omamori spans two columns of a grid twice as wide as the longest row, so
  // a shorter row can start half a step in and sit centred.
  const place = rows.flatMap((n, r) =>
    Array.from({ length: n }, (_, i) => ({
      gridRow: r + 1,
      gridColumn: `${cols - n + 1 + 2 * i} / span 2`,
    })),
  );
  return (
    <div className="overview">
      <div className="reg-grid" style={{ "--cols": cols * 2 } as CSSProperties}>
        {region.codes.map((code, i) => {
          const name = PREFECTURES[code];
          return (
            <button
              key={code}
              type="button"
              className="reg-cell"
              data-pref={code}
              disabled={!reached.has(code)}
              style={
                {
                  ...place[i],
                  "--rc": region.color,
                  "--rt":
                    textOnRegionColour(region.color) === "ink"
                      ? "var(--ink)"
                      : "var(--surface)",
                } as CSSProperties
              }
              onClick={() => onSelectPrefecture(code)}
            >
              <svg className="om-cord" viewBox="0 0 40 40" aria-hidden="true">
                <path d="M20 14C9 2 12-14 20-14S31 2 20 14M20 14L24 18L20 22L16 18ZM16 18C9 14 8 23 16 20.5M24 18C31 14 32 23 24 20.5M18.5 22L15.5 35M21.5 22L24.5 35" />
              </svg>
              <span className="om-body">
                <span className="om-label">
                  <span className="rj">{name?.ja}</span>
                  <span className="rn">{name?.en}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PrefecturePanel({
  view,
}: {
  view: Extract<PanelView, { kind: "prefecture" }>;
}) {
  // As RegionPanel: the trail names the prefecture and the map leads back.
  return view.charms.length ? (
    <p className="panel-note">Pick one from the column beside the map to read it here.</p>
  ) : (
    <p className="panel-note">No charms from this prefecture yet.</p>
  );
}

/**
 * A Discover pick (spec 0010): a preview, not a second `/charm/[id]` page --
 * name, artwork, a 3-line clamp of the story, the item's own note, then the
 * place and motif and a link out to the full record. Deliberately does
 * not take a `charms`/`items` array the way the other three panels do (D6):
 * the caller hands down only the single `note` string and a pre-flattened
 * `thumbCharm`, never the item's `priceSgd`/condition/status, so there is
 * nothing here that could grow a price or an Enquire button by accident.
 */
function CharmPanel({
  design,
  thumbCharm,
  region,
  note,
}: {
  design: Omit<DesignView, "items">;
  thumbCharm: CharmView;
  region: RegionKey | null;
  note: string | null;
}) {
  const regionInfo = region ? REGIONS[region] : null;
  const motif = motifLabel(design.motif);
  // Same hue a placed charm's card/thumb would use; a placeless one falls
  // back to the collab tint rather than the panel's default vermilion.
  const color = regionInfo?.color ?? COLLAB_REGION.color;

  // Owner, 2026-11-11: no back button and no region crumb (the map's trail
  // and its own back button cover both); the English and Japanese names set
  // at the same visual weight; the picture straight under the heading's
  // rule; the place and motif tags gathered at the foot, above a centred
  // "Full record" pill.
  return (
    <div className="charm-panel" style={{ "--rc": color } as CSSProperties}>
      <div className="panel-head">
        <div>
          <h3>{design.name}</h3>
          {design.nameJa ? <div className="ja">{design.nameJa}</div> : null}
        </div>
      </div>
      <div className="charm-panel-art">
        <CharmThumb charm={thumbCharm} />
      </div>
      {/* Clamped with CSS (D5), never by splitting sentences -- these
          write-ups mix Japanese punctuation with abbreviations, so a "first
          two sentences" split on "." would misfire. */}
      {design.story ? <p className="charm-panel-story">{design.story}</p> : null}
      {/* The item's own note (D4 item 7) -- reuses .item-note from the charm
          page. */}
      {note ? <p className="item-note">{note}</p> : null}
      <div className="charm-panel-foot">
        <div className="charm-panel-tags">
          {/* locationLabel (D4 item 3) deliberately gives the three placeless
              owned charms three different answers depending on *why* they
              have no place. Not a bug to normalise. */}
          <span className="loc">
            <span className="dot" />
            {locationLabel(design)}
          </span>
          {/* Motif only -- never rarity (invariant 4). */}
          {motif ? <span className="tag motif">{motif}</span> : null}
        </div>
        <Link href={`/charm/${design.id}`} className="charm-panel-link">
          Full record
        </Link>
      </div>
    </div>
  );
}
