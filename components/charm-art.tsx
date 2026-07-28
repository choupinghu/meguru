import type { CharmView } from "@/lib/charms";

/**
 * Per-charm placeholder artwork for CharmThumb.
 *
 * Real gotochi charms share one product form (pouch body + ring + bow) with
 * a different local motif stamped on the front. `CharmArt` renders that same
 * shared frame — ported verbatim from the original single "Pouch" — and
 * stamps a small badge with an emblem chosen by a three-level lookup:
 *
 *   1. a specific emblem for the charm, keyed by a stable slug of its name;
 *   2. else the emblem for its motif category (`tags[0]`);
 *   3. else nothing extra — the plain frame, identical to the pre-0002b
 *      placeholder, so an unrecognised charm never renders blank/broken.
 *
 * Keeping the frame identical and varying only the badge contents is what
 * makes 30 emblems read as one coherent set instead of clip-art. All shapes
 * use existing CSS tokens (plus the charm's own `--rc` region tint) — no new
 * hex literals.
 */

type Emblem = () => React.ReactElement;

const LINE = {
  fill: "none",
  stroke: "var(--ink)",
  strokeWidth: 2.2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Slugify a charm name into a stable emblem key ("Kōga Ninja" -> "koga-ninja"). */
export function slugifyName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ============================================================
   Motif fallbacks — one per category in tags[0]. These must always
   exist so an unknown/uncovered charm still reads as "its category"
   rather than falling all the way to a blank badge.
   ============================================================ */

const FoodMotif: Emblem = () => (
  <g>
    <path d="M0 -10 L9 6 L-9 6 Z" fill="var(--clay)" stroke="var(--ink)" strokeWidth={2} strokeLinejoin="round" />
    <path d="M-6.75 2 L6.75 2 L9 6 L-9 6 Z" fill="var(--ink)" opacity={0.8} />
  </g>
);

const LandmarkMotif: Emblem = () => (
  <g>
    <path d="M-6 9 V-4 M6 9 V-4" {...LINE} />
    <path d="M-9 -6 Q0 -9 9 -6" fill="none" stroke="var(--vermilion)" strokeWidth={3} strokeLinecap="round" />
    <path d="M-6.5 -1 H6.5" stroke="var(--vermilion)" strokeWidth={2.2} strokeLinecap="round" />
  </g>
);

const AnimalMotif: Emblem = () => (
  <g fill="var(--ink)">
    <ellipse cx={0} cy={4} rx={5.5} ry={4.5} />
    <circle cx={-6} cy={-4} r={2.1} />
    <circle cx={-1.5} cy={-7} r={2.1} />
    <circle cx={3.5} cy={-7} r={2.1} />
    <circle cx={8} cy={-4} r={2.1} />
  </g>
);

const NatureMotif: Emblem = () => (
  <g>
    <path d="M0 9 C -8 5 -8 -7 0 -9 C 8 -7 8 5 0 9 Z" fill="var(--ok)" stroke="var(--ink)" strokeWidth={1.8} />
    <path d="M0 8 L0 -8" stroke="var(--ink)" strokeWidth={1.4} strokeLinecap="round" />
  </g>
);

const HistoryMotif: Emblem = () => (
  <g>
    <path d="M-8 9 L7 -9" stroke="var(--ink)" strokeWidth={2.6} strokeLinecap="round" />
    <path d="M-8 9 L-10 11" stroke="var(--ink)" strokeWidth={2.6} strokeLinecap="round" />
    <circle cx={-6.5} cy={7.5} r={2} fill="var(--vermilion)" />
  </g>
);

const FolkloreMotif: Emblem = () => (
  <g>
    <ellipse cx={0} cy={1} rx={8} ry={9} fill="var(--surface)" stroke="var(--ink)" strokeWidth={2} />
    <path d="M-6 -6 L-3 -9" stroke="var(--ink)" strokeWidth={2.2} strokeLinecap="round" />
    <path d="M6 -6 L3 -9" stroke="var(--ink)" strokeWidth={2.2} strokeLinecap="round" />
    <circle cx={-3} cy={0} r={1.4} fill="var(--ink)" />
    <circle cx={3} cy={0} r={1.4} fill="var(--ink)" />
    <circle cx={-4} cy={5} r={1.6} fill="var(--vermilion)" />
    <circle cx={4} cy={5} r={1.6} fill="var(--vermilion)" />
  </g>
);

const FestivalMotif: Emblem = () => (
  <g>
    <path d="M-7 -6 Q-9 4 -7 8 L7 8 Q9 4 7 -6 Z" fill="var(--vermilion)" stroke="var(--ink)" strokeWidth={1.8} />
    <path d="M-7 -3 H7 M-7 0 H7 M-7 3 H7" stroke="var(--ink)" strokeWidth={1} opacity={0.5} />
    <path d="M0 -6 V-9 M0 8 V10" stroke="var(--ink)" strokeWidth={2} strokeLinecap="round" />
  </g>
);

const MOTIF: Record<string, Emblem> = {
  food: FoodMotif,
  landmark: LandmarkMotif,
  animal: AnimalMotif,
  nature: NatureMotif,
  history: HistoryMotif,
  folklore: FolkloreMotif,
  festival: FestivalMotif,
};

/* ============================================================
   Specific emblems — one per seeded charm with an obvious, simple
   iconic form. Anything without one is deliberately omitted here and
   falls back to its motif above (a clean fallback beats a bad drawing).
   Keyed by slugifyName(charm.name).
   ============================================================ */

const Lavender: Emblem = () => (
  <g>
    <path d="M0 9 V-4" stroke="var(--ink)" strokeWidth={1.8} strokeLinecap="round" />
    <path d="M0 6 L-4 4 M0 6 L4 4" stroke="var(--ok)" strokeWidth={1.4} strokeLinecap="round" />
    <circle cx={-2.4} cy={-9} r={1.5} fill="var(--indigo)" />
    <circle cx={2.4} cy={-9} r={1.5} fill="var(--indigo)" />
    <circle cx={0} cy={-11.5} r={1.5} fill="var(--indigo)" />
    <circle cx={-2} cy={-6.2} r={1.5} fill="var(--indigo)" />
    <circle cx={2} cy={-6.2} r={1.5} fill="var(--indigo)" />
    <circle cx={0} cy={-3.8} r={1.5} fill="var(--indigo)" />
  </g>
);

const Apple: Emblem = () => (
  <g>
    <path
      d="M0 -3 C -8 -4 -8 8 0 9 C 8 8 8 -4 0 -3 Z"
      fill="var(--vermilion)"
      stroke="var(--ink)"
      strokeWidth={1.8}
    />
    <path d="M0 -3 Q1 -7 4 -8" fill="none" stroke="var(--ink)" strokeWidth={1.6} strokeLinecap="round" />
    <path d="M2 -7 Q6 -8 7 -5" fill="var(--ok)" stroke="var(--ink)" strokeWidth={1.2} />
  </g>
);

const Armour: Emblem = () => (
  <g>
    <path d="M-8 7 Q-9 0 0 -2 Q9 0 8 7 Z" fill="var(--ink)" opacity={0.9} />
    <path d="M-1 -11 A5 5 0 1 0 -1 -1 A3.2 3.2 0 1 1 -1 -11 Z" fill="var(--vermilion)" />
  </g>
);

const Akabeko: Emblem = () => (
  <g>
    <ellipse cx={0} cy={3} rx={8} ry={6} fill="var(--vermilion)" stroke="var(--ink)" strokeWidth={1.8} />
    <path d="M-5 -5 L-6 -9 M5 -5 L6 -9" stroke="var(--ink)" strokeWidth={2} strokeLinecap="round" />
    <circle cx={-3} cy={1} r={1.2} fill="var(--ink)" />
    <circle cx={3} cy={1} r={1.2} fill="var(--ink)" />
    <circle cx={0} cy={5} r={1.4} fill="var(--ink)" />
  </g>
);

const ThreeWiseMonkeys: Emblem = () => (
  <g>
    <circle cx={-6} cy={2} r={4} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.6} />
    <circle cx={0} cy={2} r={4} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.6} />
    <circle cx={6} cy={2} r={4} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.6} />
    <path d="M-8 0 h4" stroke="var(--ink)" strokeWidth={1.4} strokeLinecap="round" />
    <path d="M-1 -1 v3" stroke="var(--ink)" strokeWidth={1.4} strokeLinecap="round" />
    <path d="M4 4 h4" stroke="var(--ink)" strokeWidth={1.4} strokeLinecap="round" />
  </g>
);

const Peanut: Emblem = () => (
  <g>
    <ellipse cx={0} cy={-4.5} rx={5.5} ry={5} fill="var(--clay)" stroke="var(--ink)" strokeWidth={1.6} />
    <ellipse cx={0} cy={4.5} rx={5.5} ry={5} fill="var(--clay)" stroke="var(--ink)" strokeWidth={1.6} />
    <path d="M-4 0 Q0 -2 4 0" fill="none" stroke="var(--ink)" strokeWidth={1.2} />
  </g>
);

const TokyoStation: Emblem = () => (
  <g>
    <rect x={-6} y={-2} width={12} height={11} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.8} />
    <path d="M-7 -2 L0 -10 L7 -2 Z" fill="var(--clay)" stroke="var(--ink)" strokeWidth={1.6} strokeLinejoin="round" />
    <circle cx={0} cy={4} r={3} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.4} />
    <path d="M0 4 L0 2 M0 4 L1.6 4.6" stroke="var(--ink)" strokeWidth={1} strokeLinecap="round" />
  </g>
);

const YokohamaChinatown: Emblem = () => (
  <g>
    <path d="M-7 9 V-2 M7 9 V-2" stroke="var(--ink)" strokeWidth={2.2} strokeLinecap="round" />
    <path d="M-9 -3 H9" stroke="var(--vermilion)" strokeWidth={3} strokeLinecap="round" />
    <path
      d="M-9 -3 Q-9 -6 -7 -7 M9 -3 Q9 -6 7 -7"
      fill="none"
      stroke="var(--vermilion)"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <circle cx={0} cy={-6.5} r={1.4} fill="var(--gold)" />
  </g>
);

const SadoCrestedIbis: Emblem = () => (
  <g>
    <path
      d="M-8 3 Q-2 -4 6 0 Q2 2 0 6 Q-4 4 -8 3 Z"
      fill="var(--surface)"
      stroke="var(--ink)"
      strokeWidth={1.6}
    />
    <path d="M6 0 L10 -2" stroke="var(--ink)" strokeWidth={1.8} strokeLinecap="round" />
    <circle cx={5} cy={-1.5} r={1} fill="var(--ink)" />
    <path d="M4 -3 Q5 -6 3 -7" fill="none" stroke="var(--vermilion)" strokeWidth={1.6} strokeLinecap="round" />
  </g>
);

const MtFuji: Emblem = () => (
  <g>
    <path d="M-9 8 L0 -9 L9 8 Z" fill="var(--indigo)" stroke="var(--ink)" strokeWidth={1.8} strokeLinejoin="round" />
    <path d="M-3 -3 L0 -9 L3 -3 L1 -2 L-1 -2 Z" fill="rgba(255,255,255,.75)" />
  </g>
);

const ShirakawaGo: Emblem = () => (
  <g>
    <path d="M-8 9 V1 H8 V9 Z" fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.6} />
    <path d="M-9 1 L0 -10 L9 1 Z" fill="var(--clay)" stroke="var(--ink)" strokeWidth={1.8} strokeLinejoin="round" />
    <path d="M-4 1 V-3 M4 1 V-3" stroke="var(--ink)" strokeWidth={1} opacity={0.6} />
  </g>
);

const EbiFry: Emblem = () => (
  <g>
    <path
      d="M-7 6 Q-8 -4 2 -8 Q8 -6 6 0 Q4 6 -2 7 Q-5 8 -7 6 Z"
      fill="var(--warn)"
      stroke="var(--ink)"
      strokeWidth={1.6}
    />
    <path d="M4 -8 L7 -10 M6 -6 L9 -7" stroke="var(--ink)" strokeWidth={1.4} strokeLinecap="round" />
  </g>
);

const Ninja: Emblem = () => (
  <g>
    <path d="M-7 8 Q-8 -2 0 -4 Q8 -2 7 8 Z" fill="var(--ink)" />
    <path d="M-6 0 H-1 M1 0 H6" stroke="var(--surface)" strokeWidth={1.6} strokeLinecap="round" />
    <path d="M-3 -4 L-4 -9 M3 -4 L4 -9" stroke="var(--vermilion)" strokeWidth={1.8} strokeLinecap="round" />
  </g>
);

const KinkakuJi: Emblem = () => (
  <g>
    <rect x={-8} y={0} width={16} height={8} fill="var(--gold)" stroke="var(--ink)" strokeWidth={1.6} />
    <path d="M-9 0 L9 0 L6 -4 L-6 -4 Z" fill="var(--gold)" stroke="var(--ink)" strokeWidth={1.4} strokeLinejoin="round" />
    <path d="M-5 -4 L5 -4 L3 -7 L-3 -7 Z" fill="var(--gold)" stroke="var(--ink)" strokeWidth={1.2} strokeLinejoin="round" />
    <circle cx={0} cy={-8.5} r={1} fill="var(--vermilion)" />
  </g>
);

const Kushikatsu: Emblem = () => (
  <g>
    <path d="M0 9 V-9" stroke="var(--ink)" strokeWidth={1.6} strokeLinecap="round" />
    <rect x={-4} y={-6} width={8} height={5} rx={2} fill="var(--clay)" stroke="var(--ink)" strokeWidth={1.4} />
    <rect x={-4} y={0} width={8} height={5} rx={2} fill="var(--clay)" stroke="var(--ink)" strokeWidth={1.4} />
  </g>
);

const Kitaro: Emblem = () => (
  <g>
    <circle cx={0} cy={2} r={7} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.8} />
    <circle cx={0} cy={2} r={3} fill="var(--indigo)" />
    <circle cx={0} cy={2} r={1.2} fill="var(--ink)" />
    <path d="M-2 -6 L-4 -10 M2 -6 L4 -10 M0 -7 L0 -11" stroke="var(--ink)" strokeWidth={1.6} strokeLinecap="round" />
  </g>
);

const Momotaro: Emblem = () => (
  <g>
    <path
      d="M0 -7 C -8 -8 -9 3 0 9 C 9 3 8 -8 0 -7 Z"
      fill="var(--vermilion)"
      stroke="var(--ink)"
      strokeWidth={1.6}
    />
    <path d="M0 -7 V0" stroke="var(--ink)" strokeWidth={1.2} strokeLinecap="round" opacity={0.5} />
    <path d="M0 -7 Q1 -10 4 -10" fill="none" stroke="var(--ok)" strokeWidth={1.6} strokeLinecap="round" />
  </g>
);

const Momiji: Emblem = () => (
  <g>
    <path
      d="M0 -9 L2 -3 L8 -4 L4 1 L7 7 L0 4 L-7 7 L-4 1 L-8 -4 L-2 -3 Z"
      fill="var(--vermilion)"
      stroke="var(--ink)"
      strokeWidth={1.3}
      strokeLinejoin="round"
    />
    <path d="M0 -9 V6" stroke="var(--ink)" strokeWidth={1} opacity={0.6} />
  </g>
);

const AwaOdori: Emblem = () => (
  <g>
    <path d="M-6 -6 L6 -6 L0 -11 Z" fill="var(--gold)" stroke="var(--ink)" strokeWidth={1.4} strokeLinejoin="round" />
    <circle cx={0} cy={-3} r={2} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.4} />
    <path d="M0 -1 V5" stroke="var(--ink)" strokeWidth={1.8} strokeLinecap="round" />
    <path
      d="M0 0 Q-7 -3 -8 -8 M0 0 Q7 -3 8 -8"
      fill="none"
      stroke="var(--vermilion)"
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    <path d="M0 5 L-4 9 M0 5 L4 9" stroke="var(--ink)" strokeWidth={1.8} strokeLinecap="round" />
  </g>
);

const Mikan: Emblem = () => (
  <g>
    <circle cx={0} cy={2} r={7.5} fill="var(--warn)" stroke="var(--ink)" strokeWidth={1.6} />
    <path d="M-5 2 H5 M0 -5 V9" stroke="var(--ink)" strokeWidth={0.8} opacity={0.35} />
    <path d="M0 -5.5 Q1 -8 4 -8.5" fill="none" stroke="var(--ok)" strokeWidth={1.6} strokeLinecap="round" />
  </g>
);

const Ryoma: Emblem = () => (
  <g>
    <path d="M-8 5 L8 5 L5 9 L-5 9 Z" fill="var(--clay)" stroke="var(--ink)" strokeWidth={1.6} strokeLinejoin="round" />
    <path d="M0 5 V-9" stroke="var(--ink)" strokeWidth={1.6} strokeLinecap="round" />
    <path d="M0 -9 L7 4 L0 4 Z" fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.4} strokeLinejoin="round" />
  </g>
);

const Mentaiko: Emblem = () => (
  <g>
    <ellipse cx={-3} cy={0} rx={4.5} ry={7} fill="var(--vermilion)" stroke="var(--ink)" strokeWidth={1.4} transform="rotate(-15 -3 0)" />
    <ellipse cx={3.5} cy={1} rx={4.5} ry={7} fill="var(--vermilion)" stroke="var(--ink)" strokeWidth={1.4} transform="rotate(12 3.5 1)" />
    <path d="M-3 -4 Q-2 0 -3 4 M3.5 -5 Q4.5 0 3.5 6" stroke="var(--ink)" strokeWidth={0.8} opacity={0.4} />
  </g>
);

const Volcano: Emblem = () => (
  <g>
    <path d="M-9 8 L-2 -8 L0 -5 L2 -8 L9 8 Z" fill="var(--ink)" opacity={0.85} />
    <circle cx={0} cy={-6.5} r={1.4} fill="var(--vermilion)" />
    <path d="M1 -10 Q3 -13 1 -15" fill="none" stroke="var(--ink-soft)" strokeWidth={1.4} strokeLinecap="round" />
  </g>
);

const Cedar: Emblem = () => (
  <g>
    <path d="M-2 9 V0" stroke="var(--clay)" strokeWidth={3} strokeLinecap="round" />
    <ellipse cx={-1} cy={-5} rx={9} ry={7} fill="var(--ok)" stroke="var(--ink)" strokeWidth={1.6} />
  </g>
);

const Goya: Emblem = () => (
  <g>
    <path
      d="M-8 0 Q-8 -8 0 -9 Q8 -8 8 0 Q8 8 0 9 Q-8 8 -8 0 Z"
      fill="var(--ok)"
      stroke="var(--ink)"
      strokeWidth={1.6}
    />
    <circle cx={-4} cy={-3} r={0.9} fill="var(--ink)" opacity={0.5} />
    <circle cx={2} cy={-5} r={0.9} fill="var(--ink)" opacity={0.5} />
    <circle cx={4} cy={2} r={0.9} fill="var(--ink)" opacity={0.5} />
    <circle cx={-3} cy={5} r={0.9} fill="var(--ink)" opacity={0.5} />
    <circle cx={0} cy={0} r={0.9} fill="var(--ink)" opacity={0.5} />
  </g>
);

const Shinkansen: Emblem = () => (
  <g>
    <path d="M-9 5 Q-9 -6 9 -3 Q9 3 6 6 Z" fill="var(--indigo)" stroke="var(--ink)" strokeWidth={1.6} />
    <circle cx={2} cy={-1} r={2} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.2} />
    <path d="M-9 3 Q0 6 8 4" fill="none" stroke="var(--vermilion)" strokeWidth={1.6} strokeLinecap="round" />
  </g>
);

const SPECIFIC: Record<string, Emblem> = {
  lavender: Lavender,
  "apple-girl": Apple,
  "masamune-s-armour": Armour,
  akabeko: Akabeko,
  "three-wise-monkeys": ThreeWiseMonkeys,
  peanut: Peanut,
  "tokyo-station": TokyoStation,
  "yokohama-chinatown": YokohamaChinatown,
  "sado-crested-ibis": SadoCrestedIbis,
  "mt-fuji": MtFuji,
  "shirakawa-go": ShirakawaGo,
  "ebi-fry": EbiFry,
  "koga-ninja": Ninja,
  "kinkaku-ji": KinkakuJi,
  kushikatsu: Kushikatsu,
  "gegege-no-kitaro": Kitaro,
  momotaro: Momotaro,
  momiji: Momiji,
  "awa-odori": AwaOdori,
  iyokan: Mikan,
  "sakamoto-ryoma": Ryoma,
  "hakata-mentaiko": Mentaiko,
  "mt-aso": Volcano,
  "yakushima-jomon-cedar": Cedar,
  goya: Goya,
  "hello-kitty-shinkansen": Shinkansen,
};

/** Three-level lookup: specific emblem -> motif emblem -> null (plain frame). */
/**
 * The emblem for a charm, already rendered. Returns the element rather than the
 * component so callers never assign a component during render, which would
 * create a fresh component identity on every pass (react-hooks/static-components).
 */
export function renderEmblem(charm: CharmView): React.ReactElement | null {
  const slug = slugifyName(charm.name);
  const emblem: Emblem | undefined =
    SPECIFIC[slug] ?? (charm.motif ? MOTIF[charm.motif] : undefined);
  return emblem ? emblem() : null;
}

/**
 * The shared charm silhouette (ring + pouch body + bow, tinted by --rc)
 * with the looked-up emblem stamped on a badge over the body. Falls back to
 * the plain frame (no badge) when nothing is found for this charm.
 */
export default function CharmArt({ charm }: { charm: CharmView }) {
  const emblem = renderEmblem(charm);

  return (
    <svg viewBox="0 0 64 82" aria-hidden="true">
      <path d="M32 4 a6 6 0 1 1 -0.01 0" fill="none" stroke="var(--ink-soft)" strokeWidth={2} />
      <rect x={11} y={15} width={42} height={60} rx={13} fill="var(--rc)" />
      <rect x={11} y={15} width={42} height={12} rx={6} fill="rgba(0,0,0,.14)" />
      <path d="M20 20 h24" stroke="rgba(255,255,255,.5)" strokeWidth={2} strokeLinecap="round" />
      <g transform="translate(32 15)">
        <path d="M0 0 L-11 -6 L-11 6 Z" fill="var(--vermilion)" />
        <path d="M0 0 L11 -6 L11 6 Z" fill="var(--vermilion)" />
        <circle r={3.4} fill="var(--vermilion)" stroke="rgba(255,255,255,.65)" strokeWidth={1} />
      </g>
      {emblem ? (
        <g transform="translate(32 48)">
          <circle r={16} fill="rgba(255,255,255,.30)" stroke="rgba(255,255,255,.55)" strokeWidth={1} />
          {emblem}
        </g>
      ) : (
        <ellipse cx={24} cy={40} rx={7} ry={9} fill="rgba(255,255,255,.28)" />
      )}
    </svg>
  );
}
