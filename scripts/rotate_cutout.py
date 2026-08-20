#!/usr/bin/env python3
"""Rotate an installed cut-out by any angle, keeping transparency.

    npm run photos:rotate -- 0009 -12        rotate 0009 twelve degrees clockwise
    npm run photos:rotate -- 0009 8          ...and eight degrees anticlockwise
    npm run photos:rotate -- 0009 -12 --dry  write a preview, leave the real files alone

Positive is anticlockwise, matching how you would describe it out loud
("tilt it left"). Negative is clockwise.

Rotates the master in photos/cutouts/, re-trims the transparent margin so
framing stays tight, and rewrites the served WebP. Preview can only do 90
degree steps without pain; this does arbitrary angles with bicubic resampling.

Rotation is lossy -- each pass resamples. Prefer one rotation of -12 over four
of -3, and if you overshoot, re-rotate from the ORIGINAL rather than stacking a
correction on top.
"""
import os, sys, glob
from PIL import Image

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry" in sys.argv
    if len(args) < 2:
        print(__doc__); return 64
    no, deg = args[0], float(args[1])
    hits = glob.glob(f"photos/cutouts/{no}-*.png")
    if not hits:
        print(f"No cut-out for {no}. Have: "
              f"{', '.join(sorted(os.path.basename(f)[:4] for f in glob.glob('photos/cutouts/*.png')))}")
        return 1
    master = hits[0]
    kind = "figure" if "figure" in master else "reference"
    im = Image.open(master).convert("RGBA")
    before = im.size
    out = im.rotate(deg, resample=Image.BICUBIC, expand=True)
    bb = out.getbbox()
    if bb:
        out = out.crop(bb)
    if dry:
        p = f"photos/drafts/{no}-rotated-{deg:g}.png"
        out.save(p)
        print(f"  {no}  {before[0]}x{before[1]} -> {out.size[0]}x{out.size[1]}  preview: {p}")
        return 0
    # keep one undo step
    os.makedirs("photos/archive/pre-rotate", exist_ok=True)
    Image.open(master).save(f"photos/archive/pre-rotate/{os.path.basename(master)}")
    out.save(master)
    served = f"public/img/charms/{no}-{kind}.webp"
    out.save(served, "WEBP", quality=92, method=6)
    print(f"  {no}  {before[0]}x{before[1]} -> {out.size[0]}x{out.size[1]}  rotated {deg:g} deg")
    print(f"  previous version kept in photos/archive/pre-rotate/")
    print("  run: npm run db:seed   (paths unchanged, but restart the dev server to see it)")
    return 0

if __name__ == "__main__":
    sys.exit(main())
