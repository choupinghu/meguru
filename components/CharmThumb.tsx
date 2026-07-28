import Image from "next/image";
import type { CharmView } from "@/lib/charms";
import { charmColor } from "@/lib/charms";

/**
 * Renders a charm's `imageUrl` via next/image when present; otherwise falls
 * back to the prototype's procedural "pouch" SVG, tinted with the charm's
 * region hue. Every seeded row currently has a null `imageUrl`, so the
 * fallback is what shows until Spec 0006 wires up real photos.
 */
export default function CharmThumb({ charm }: { charm: CharmView }) {
  const color = charmColor(charm);

  return (
    <div className="thumb" style={{ "--rc": color } as React.CSSProperties}>
      {charm.imageUrl ? (
        <Image
          src={charm.imageUrl}
          alt={charm.name}
          fill
          sizes="(max-width: 520px) 45vw, 230px"
          style={{ objectFit: "cover" }}
        />
      ) : (
        <Pouch />
      )}
    </div>
  );
}

/** The prototype's procedural charm-pouch illustration, tinted by --rc. */
function Pouch() {
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
      <ellipse cx={24} cy={40} rx={7} ry={9} fill="rgba(255,255,255,.28)" />
    </svg>
  );
}
