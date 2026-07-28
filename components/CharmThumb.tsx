import Image from "next/image";
import type { CharmView } from "@/lib/charms";
import { charmColor } from "@/lib/charms";
import CharmArt from "./charm-art";

/**
 * Renders a charm's `imageUrl` via next/image when present; otherwise falls
 * back to per-charm placeholder artwork (see charm-art.tsx): the prototype's
 * procedural "pouch" frame, tinted with the charm's region hue, with a small
 * motif emblem stamped on the body so every charm reads as distinct until
 * Spec 0006 wires up real photos.
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
        <CharmArt charm={charm} />
      )}
    </div>
  );
}
