import CharmThumb from "./CharmThumb";
import type { DesignView } from "@/lib/charms";
import {
  CONDITION_COLOR_VARS,
  CONDITION_LABELS,
  charmColor,
  locationLabel,
  motifLabel,
  priceLabel,
  rarityLabel,
  statusLabel,
  toCharmView,
} from "@/lib/charms";

/**
 * Ports the prototype's `.card` — thumbnail, name + Japanese name, location,
 * a rarity/motif chip row, and per item a condition + price pair (never a
 * price without its condition). A design with a single item (every seeded
 * design today) renders exactly as the pre-0005 single-`charms`-row card
 * did; a design with several items just repeats the pair. A design whose
 * items are all sold gets the muted/struck treatment. "Enquire" is a stub —
 * no payment. Still no story text here.
 */
export default function CharmCard({ design }: { design: DesignView }) {
  const color = charmColor(design);
  const rarity = rarityLabel(design.rarity);
  const motif = motifLabel(design.motif);
  const items = design.items;
  const isSold = items.length > 0 && items.every((item) => item.status === "sold");
  const thumbCharm = toCharmView(design);

  return (
    <article
      className={`card${isSold ? " is-sold" : ""}`}
      style={{ "--rc": color } as React.CSSProperties}
    >
      {design.isCollab && design.brand ? <span className="brand-tag">{design.brand}</span> : null}
      <CharmThumb charm={thumbCharm} />
      <div className="card-body">
        <h4>{design.name}</h4>
        {design.nameJa ? <div className="cja">{design.nameJa}</div> : null}
        <div className="loc">
          <span className="dot" />
          {locationLabel(design)}
        </div>
        {items.map((item) => {
          const status = statusLabel(item.status);
          return (
            <div className="chips" key={item.id}>
              <span className="tag">
                <span className="cd" style={{ background: CONDITION_COLOR_VARS[item.condition] }} />
                {CONDITION_LABELS[item.condition]}
              </span>
              {rarity ? <span className={`tag ${design.rarity}`}>{rarity}</span> : null}
              {status ? <span className={`tag ${item.status}`}>{status}</span> : null}
              {motif ? <span className="tag motif">{motif}</span> : null}
            </div>
          );
        })}
      </div>
      <div className="card-foot">
        {items.map((item) => (
          <span className={`price${item.priceSgd == null ? " na" : ""}`} key={item.id}>
            {priceLabel(item)}
          </span>
        ))}
        {items.length === 1 && items[0].status === "available" ? (
          <button type="button" className="enq">
            Enquire
          </button>
        ) : items.length === 1 && items[0].status === "reserved" ? (
          <span className="hint">On hold</span>
        ) : null}
      </div>
    </article>
  );
}
