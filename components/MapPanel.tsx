import type { CSSProperties } from "react";
import Link from "next/link";
import CharmThumb from "./CharmThumb";
import type { CharmView, DesignView } from "@/lib/charms";
import { locationLabel, motifLabel, toCharmView } from "@/lib/charms";
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
  | { kind: "region"; region: RegionKey; charms: DesignView[] }
  | { kind: "prefecture"; region: RegionKey; code: number; charms: DesignView[] }
  | { kind: "charm"; design: DesignView; region: RegionKey | null };

interface MapPanelProps {
  view: PanelView;
  onSelectRegion: (region: RegionKey) => void;
  /** Picking a card in the region/prefecture panels (spec 0010): switches
   * the panel into that charm's preview *in place*, without navigating off
   * `/` or moving the map (`MapExplorer` owns that distinction). */
  onReset: () => void;
}

/** aria-live="polite" so screen readers announce the panel's new contents
 * whenever a region/prefecture selection swaps them out. */
export default function MapPanel({
  view,
  onSelectRegion,
  onReset,
}: MapPanelProps) {
  return (
    <aside className="panel" aria-live="polite">
      {view.kind === "overview" ? (
        <OverviewPanel view={view} onSelectRegion={onSelectRegion} />
      ) : view.kind === "region" ? (
        <RegionPanel view={view} />
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
          onBack={onReset}
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

function RegionPanel({
  view,
}: {
  view: Extract<PanelView, { kind: "region" }>;
}) {
  // No heading or back button (owner, 2026-11-11): the map's trail names the
  // region and its back button leaves it.
  return view.charms.length ? (
    <p className="panel-note">Pick one from the column beside the map to read it here.</p>
  ) : (
    <p className="panel-note">No charms from this region yet.</p>
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
 * crumb, name, place, motif, artwork, a 3-line clamp of the story, the
 * item's own note, then a link out to the full record. Deliberately does
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
  onBack,
}: {
  design: Omit<DesignView, "items">;
  thumbCharm: CharmView;
  region: RegionKey | null;
  note: string | null;
  onBack: () => void;
}) {
  const regionInfo = region ? REGIONS[region] : null;
  const motif = motifLabel(design.motif);
  // Same hue a placed charm's card/thumb would use; a placeless one falls
  // back to the collab tint rather than the panel's default vermilion.
  const color = regionInfo?.color ?? COLLAB_REGION.color;

  return (
    <div className="charm-panel" style={{ "--rc": color } as CSSProperties}>
      <div className="panel-head">
        <div>
          {/* D4 item 1: the region's "ja · en" for a placed charm, or just
              COLLAB_REGION.en ("Off the map") for a placeless one. */}
          <div className="crumb">
            {regionInfo ? `${regionInfo.ja} · ${regionInfo.en}` : COLLAB_REGION.en}
          </div>
          <h3>{design.name}</h3>
          {design.nameJa ? <div className="ja">{design.nameJa}</div> : null}
        </div>
        <button type="button" className="reset" onClick={onBack}>
          ← Back
        </button>
      </div>
      {/* locationLabel (D4 item 3) deliberately gives the three placeless
          owned charms three different answers depending on *why* they have
          no place -- a collab with a brand, a collab without one, and a
          non-collab with no prefecture at all. Not a bug to normalise. */}
      <div className="loc">
        <span className="dot" />
        {locationLabel(design)}
      </div>
      {/* Motif only -- never rarity (invariant 4, not displayed anywhere). */}
      {motif ? (
        <div className="chips">
          <span className="tag motif">{motif}</span>
        </div>
      ) : null}
      <div className="charm-panel-art">
        <CharmThumb charm={thumbCharm} />
      </div>
      {/* Clamped with CSS (D5), never by splitting sentences -- these
          write-ups mix Japanese punctuation with abbreviations, so a "first
          two sentences" split on "." would misfire. */}
      {design.story ? <p className="charm-panel-story">{design.story}</p> : null}
      {/* The item's own note (D4 item 7) -- reuses .item-note from the charm
          page. Its `flex-basis: 100%` is inert here (no flex parent), which
          is fine: safe to reuse, not worth building a flex row just for it. */}
      {note ? <p className="item-note">{note}</p> : null}
      <Link href={`/charm/${design.id}`} className="charm-panel-link">
        Full record →
      </Link>
    </div>
  );
}
