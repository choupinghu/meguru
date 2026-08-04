import { Fragment } from "react";
import Link from "next/link";
import CharmThumb from "./CharmThumb";
import type { DesignView } from "@/lib/charms";
import {
  CONDITION_COLOR_VARS,
  CONDITION_LABELS,
  charmColor,
  locationLabel,
  motifLabel,
  priceLabel,
  statusLabel,
  toCharmView,
} from "@/lib/charms";

/**
 * Ports the prototype's `.card` — thumbnail, name + Japanese name, location,
 * a motif/condition/status chip row, and per item a condition + price pair
 * (never a price without its condition). A design with a single item (every
 * owned design today) renders exactly as the pre-0005 single-`charms`-row
 * card did; a design with several items just repeats the pair. A design
 * whose items are all sold gets the muted/struck treatment; a design with no
 * item at all (0008b) gets the dashed "documented" treatment and no footer.
 * "Enquire" is a stub — no payment. Still no story text here.
 *
 * The thumbnail + identity block (everything but the price/Enquire footer)
 * link to `/charm/[id]` (spec 0008) — the footer stays outside the anchor so
 * the "Enquire" button remains an ordinary, independently clickable button
 * rather than an interactive element nested inside another.
 *
 * `onSelect` (spec 0010): when present, this card is a *picker*, not a link
 * — the map's region/prefecture panels use it to switch the panel into a
 * charm preview in place rather than navigating off `/` entirely. In picker
 * mode the identity block renders as a plain `<button>` instead of a
 * `next/link`, and `.card-foot` (price + Enquire) is dropped altogether
 * rather than merely hidden: `/` shows no price or Enquire button anywhere
 * (invariant 1 / spec 0010 D6), and there is no second interactive element
 * inside the card to worry about nesting once the footer is gone.
 */
export default function CharmCard({
  design,
  onSelect,
}: {
  design: DesignView;
  onSelect?: () => void;
}) {
  const color = charmColor(design);
  const motif = motifLabel(design.motif);
  const items = design.items;
  const isOwned = items.length > 0;
  const isSold = isOwned && items.every((item) => item.status === "sold");
  const thumbCharm = toCharmView(design);

  const identity = (
    <>
      <CharmThumb charm={thumbCharm} />
      <div className="card-body">
        <h4>{design.name}</h4>
        {design.nameJa ? <div className="cja">{design.nameJa}</div> : null}
        <div className="loc">
          <span className="dot" />
          {locationLabel(design)}
        </div>
        <div className="chips">
          {motif ? <span className="tag motif">{motif}</span> : null}
          {items.map((item) => {
            const status = statusLabel(item.status);
            return (
              <Fragment key={item.id}>
                <span className="tag">
                  <span className="cd" style={{ background: CONDITION_COLOR_VARS[item.condition] }} />
                  {CONDITION_LABELS[item.condition]}
                </span>
                {status ? <span className={`tag ${item.status}`}>{status}</span> : null}
              </Fragment>
            );
          })}
          {items.length === 0 ? <span className="tag documented">Documented</span> : null}
        </div>
      </div>
    </>
  );

  return (
    <article
      className={`card${isSold ? " is-sold" : ""}${isOwned ? "" : " is-documented"}`}
      style={{ "--rc": color } as React.CSSProperties}
    >
      {design.isCollab && design.brand ? <span className="brand-tag">{design.brand}</span> : null}
      {onSelect ? (
        <button type="button" className="card-link" onClick={onSelect}>
          {identity}
        </button>
      ) : (
        <Link href={`/charm/${design.id}`} className="card-link">
          {identity}
        </Link>
      )}
      {!onSelect && items.length > 0 ? (
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
      ) : null}
    </article>
  );
}
