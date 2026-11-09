#!/usr/bin/env python3
"""Publish web-sized copies of OUR OWN photograph of each owned charm.

    npm run photos:originals

These are the second slide of the carousel on /charm/[id]: the cut-out first,
then the object as it actually sits on the shelf.

Deliberately sourced from our own photographs, never from photos/prod/cutout-sources/.
That folder holds whatever each cut-out was cut from, which for a sourced charm
is someone else's listing photo -- publishing one cut-out of it under a stated
rationale is one thing, republishing their whole frame is another.

They come from photos/prod/display/ (NNNN_slug.jpg): the Drive photos with the
background evened out to white for the carded charms (owner decision 2026-11-09),
and untouched for the loose ones, where the swap looked artificial. That folder is
built from photos/staging/raw/ by photos/staging/tools/brighten/.

The owned numbers are read from scripts/seed-data.ts, so a new batch is picked up
without editing this file.

Never upscales: the long edge is min(1200, source), matching 0012/D7. Reports
anything landing under 900px so weak sources are visible without being dropped.
"""
import glob, os, re, sys
from PIL import Image

SOURCE = "photos/prod/display"

def main():
    seed = open("scripts/seed-data.ts", encoding="utf-8").read()
    # Only OWNED_RAW rows open with `{ no: "NNNN"`; DOCUMENTED rows have no number.
    owned = sorted(set(re.findall(r'\{ no: "(\d{4})"', seed)))
    os.makedirs("public/img/charms", exist_ok=True)
    written, small, missing = 0, [], []
    for no in owned:
        hits = glob.glob(f"{SOURCE}/{no}_*.jpg")
        if not hits:
            missing.append(no); continue
        im = Image.open(hits[0]).convert("RGB")
        long_edge = max(im.size)
        if long_edge > 1200:
            s = 1200 / long_edge
            im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        out = f"public/img/charms/{no}-original.webp"
        im.save(out, "WEBP", quality=82, method=6)
        written += 1
        if max(im.size) < 900:
            small.append((no, f"{im.width}x{im.height}"))
        print(f"  {no}  {im.width}x{im.height}  {os.path.getsize(out)//1024}KB  <- {os.path.basename(hits[0])}")
    print(f"\n  {written} written")
    if small:
        print(f"  under 900px, shipped anyway: {', '.join(f'{n} ({d})' for n, d in small)}")
    if missing:
        print(f"  NO SOURCE: {', '.join(missing)}")
    return 1 if missing else 0

sys.exit(main())
