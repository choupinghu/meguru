import CharmThumb from "./CharmThumb";
import type { CharmView } from "@/lib/charms";
import {
  CONDITION_COLOR_VARS,
  CONDITION_LABELS,
  charmColor,
  locationLabel,
  motifLabel,
  priceLabel,
  rarityLabel,
  statusLabel,
} from "@/lib/charms";

/**
 * Ports the prototype's `.card` — thumbnail, name + Japanese name, location,
 * condition/rarity/status/motif badges, and a price or "Not for sale". Sold
 * charms get the muted/struck treatment. "Enquire" is a stub — no payment.
 */
export default function CharmCard({ charm }: { charm: CharmView }) {
  const color = charmColor(charm);
  const rarity = rarityLabel(charm.rarity);
  const status = statusLabel(charm.status);
  const motif = motifLabel(charm.motif);
  const isSold = charm.status === "sold";

  return (
    <article
      className={`card${isSold ? " is-sold" : ""}`}
      style={{ "--rc": color } as React.CSSProperties}
    >
      {charm.isCollab && charm.brand ? <span className="brand-tag">{charm.brand}</span> : null}
      <CharmThumb charm={charm} />
      <div className="card-body">
        <h4>{charm.name}</h4>
        {charm.nameJa ? <div className="cja">{charm.nameJa}</div> : null}
        <div className="loc">
          <span className="dot" />
          {locationLabel(charm)}
        </div>
        <div className="chips">
          <span className="tag">
            <span className="cd" style={{ background: CONDITION_COLOR_VARS[charm.condition] }} />
            {CONDITION_LABELS[charm.condition]}
          </span>
          {rarity ? <span className={`tag ${charm.rarity}`}>{rarity}</span> : null}
          {status ? <span className={`tag ${charm.status}`}>{status}</span> : null}
          {motif ? <span className="tag motif">{motif}</span> : null}
        </div>
      </div>
      <div className="card-foot">
        <span className={`price${charm.priceSgd == null ? " na" : ""}`}>{priceLabel(charm)}</span>
        {charm.status === "available" ? (
          <button type="button" className="enq">
            Enquire
          </button>
        ) : charm.status === "reserved" ? (
          <span className="hint">On hold</span>
        ) : null}
      </div>
    </article>
  );
}
