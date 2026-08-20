#!/usr/bin/env python3
"""Install hand-made cut-outs from photos/drafts/ into the site.

Drop a PNG with transparency named NNNN.png (e.g. 0007.png) into
photos/drafts/, then run:

    npm run photos:install

For each file it:
  1. checks the image actually has an alpha channel and is not fully opaque
     -- a JPEG renamed .png, or a PNG saved without transparency, is the most
     common mistake and produces a charm sitting on a white brick
  2. trims fully transparent margins so framing is consistent with the rest
  3. writes the master to photos/cutouts/ (same name as the served file) (ours)
  4. writes the served WebP to public/img/charms/
  5. tells you whether scripts/seed-data.ts needs the number adding

Nothing is deleted; re-running overwrites in place.
"""
import os, sys, glob, re
from PIL import Image

DRAFTS = "photos/drafts"
OWN = {"0026","0027","0029","0030","0031","0034","0035","0036","0037"}  # our own photos

def main():
    # Any file whose name STARTS with the four-digit charm number counts.
    # macOS names its cut-outs "0016 Background Removed.png", and being strict
    # about the rest of the filename just means silently finding nothing.
    files = sorted(f for f in glob.glob(f"{DRAFTS}/*")
                   if re.match(r"^\d{4}", os.path.basename(f))
                   and os.path.splitext(f)[1].lower() in (".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"))
    if not files:
        print(f"Nothing to install. Put NNNN.png files in {DRAFTS}/ first.")
        return 0
    src = open("scripts/seed-data.ts", encoding="utf-8").read()
    # Only the two Set literals count. Searching the whole file gives false
    # positives -- every charm number also appears in OWNED_RAW and STORIES.
    seed = "".join(m.group(1) for m in re.finditer(
        r"const (?:REFERENCE_NOS|OWN_PHOTO_NOS) = new Set\(\[(.*?)\]\)", src, re.S))
    installed, problems = [], []
    for f in files:
        no = os.path.basename(f)[:4]
        im = Image.open(f)
        if im.mode not in ("RGBA", "LA") and "transparency" not in im.info:
            problems.append(f"{no}: no alpha channel — export as PNG with transparency, not JPEG")
            continue
        im = im.convert("RGBA")
        alpha = im.getchannel("A")
        if alpha.getextrema()[0] == 255:
            problems.append(f"{no}: alpha is fully opaque — the background was not removed")
            continue
        bbox = im.getbbox()
        if bbox and bbox != (0, 0, im.width, im.height):
            im = im.crop(bbox)
        kind = "figure" if no in OWN else "reference"
        master = f"photos/cutouts/{no}-{kind}.png"
        os.makedirs(os.path.dirname(master), exist_ok=True)
        im.save(master)
        out = f"public/img/charms/{no}-{kind}.webp"
        im.save(out, "WEBP", quality=92, method=6)
        listed = f'"{no}"' in seed
        installed.append((no, kind, im.size, os.path.getsize(out) // 1024, listed))
        os.rename(f, f"{f}.installed")

    for no, kind, sz, kb, listed in installed:
        flag = "" if listed else "   <-- ADD TO seed-data.ts"
        print(f"  {no}  {sz[0]}x{sz[1]}  {kb}KB  -> {kind}{flag}")
    for p in problems:
        print(f"  SKIPPED {p}")
    if installed:
        missing = [n for n, _, _, _, l in installed if not l]
        print()
        if missing:
            print(f"Add to REFERENCE_NOS / OWN_PHOTO_NOS in scripts/seed-data.ts: {', '.join(missing)}")
        print("Then: npm run db:seed   (and restart the dev server to see it)")
    return 1 if problems else 0

sys.exit(main())
