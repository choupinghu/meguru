import type { CSSProperties } from "react";
import CharmCard from "./CharmCard";
import type { CharmView } from "@/lib/charms";
import { REGIONS, REGION_LIST, type RegionKey } from "@/lib/regions";
import { PREFECTURES } from "@/lib/prefectures";

/**
 * The three states of the drill-down side panel, ported from the
 * prototype's `renderOverview` / `selectRegion` / `selectPref`:
 *  - `overview`  -- All Japan: headline + a clickable region grid with counts.
 *  - `region`    -- that region's charms, with a back-to-all-Japan control.
 *  - `prefecture`-- that prefecture's charms, with a back-to-region control.
 * MapExplorer derives this from its selection state and hands it down;
 * MapPanel itself owns no state.
 */
export type PanelView =
  | {
      kind: "overview";
      totalCharms: number;
      prefecturesReached: number;
      regionCounts: Record<RegionKey, number>;
    }
  | { kind: "region"; region: RegionKey; charms: CharmView[] }
  | { kind: "prefecture"; region: RegionKey; code: number; charms: CharmView[] };

interface MapPanelProps {
  view: PanelView;
  onSelectRegion: (region: RegionKey) => void;
  onReset: () => void;
  onBackToRegion: () => void;
}

/** aria-live="polite" so screen readers announce the panel's new contents
 * whenever a region/prefecture selection swaps them out. */
export default function MapPanel({ view, onSelectRegion, onReset, onBackToRegion }: MapPanelProps) {
  return (
    <aside className="panel" aria-live="polite">
      {view.kind === "overview" ? (
        <OverviewPanel view={view} onSelectRegion={onSelectRegion} />
      ) : view.kind === "region" ? (
        <RegionPanel view={view} onReset={onReset} />
      ) : (
        <PrefecturePanel view={view} onBack={onBackToRegion} />
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
  return (
    <>
      <div className="panel-head">
        <div>
          <div className="crumb">All Japan · 全国</div>
          <h3>
            {view.totalCharms} charms across {view.prefecturesReached} prefectures
          </h3>
          <div className="ja">巡ってみましょう — pick a region to wander</div>
        </div>
      </div>
      <p className="panel-note">
        The map glows only where the collection reaches. Tap a region to zoom in.
      </p>
      <div className="reg-grid">
        {REGION_LIST.map((region) => {
          const count = view.regionCounts[region.key];
          return (
            <button
              key={region.key}
              type="button"
              className="reg-cell"
              disabled={count === 0}
              style={{ "--rc": region.color } as CSSProperties}
              onClick={() => onSelectRegion(region.key)}
            >
              <span className="sw" />
              <span>
                <span className="rn">{region.en}</span>
                <br />
                <span className="rj">{region.ja}</span>
              </span>
              <span className="rc">{count}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function RegionPanel({
  view,
  onReset,
}: {
  view: Extract<PanelView, { kind: "region" }>;
  onReset: () => void;
}) {
  const region = REGIONS[view.region];
  return (
    <>
      <div className="panel-head">
        <div>
          <div className="crumb" style={{ "--rc": region.color } as CSSProperties}>
            {region.ja} · Region
          </div>
          <h3>{region.en}</h3>
          <div className="ja">
            {view.charms.length} charm{view.charms.length !== 1 ? "s" : ""} here
          </div>
        </div>
        <button type="button" className="reset" onClick={onReset}>
          ← All Japan
        </button>
      </div>
      <div className="cards">
        {view.charms.length ? (
          view.charms.map((charm) => <CharmCard charm={charm} key={charm.id} />)
        ) : (
          <p className="panel-note">No charms from this region yet.</p>
        )}
      </div>
    </>
  );
}

function PrefecturePanel({
  view,
  onBack,
}: {
  view: Extract<PanelView, { kind: "prefecture" }>;
  onBack: () => void;
}) {
  const region = REGIONS[view.region];
  const name = PREFECTURES[view.code];
  return (
    <>
      <div className="panel-head">
        <div>
          <div className="crumb" style={{ "--rc": region.color } as CSSProperties}>
            {region.ja} · {region.en}
          </div>
          <h3>{name?.en ?? `Prefecture ${view.code}`}</h3>
          <div className="ja">
            {name?.ja} — {view.charms.length} charm{view.charms.length !== 1 ? "s" : ""}
          </div>
        </div>
        <button type="button" className="reset" onClick={onBack}>
          ← Back
        </button>
      </div>
      <div className="cards">
        {view.charms.length ? (
          view.charms.map((charm) => <CharmCard charm={charm} key={charm.id} />)
        ) : (
          <p className="panel-note">No charms from this prefecture yet.</p>
        )}
      </div>
    </>
  );
}
