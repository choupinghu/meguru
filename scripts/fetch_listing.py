#!/usr/bin/env python3
"""Pull the original photo out of a marketplace listing.

    python3 scripts/fetch_listing.py <url> [<url> ...]

Accepts a native listing URL (Mercari, Rakuma, Yahoo Auctions) or a Buyee
proxy URL. Buyee itself cannot be fetched -- it sits behind AWS WAF bot
control, which answers every request with a JavaScript challenge -- but its
URLs carry the source item id, so we rebuild the native URL and fetch that.

Saves to photos/references/listings/ so it sits with everything else you can
cut from.
"""
import os, re, sys, subprocess, urllib.parse

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 "
      "(KHTML, like Gecko) Version/17.0 Safari/605.1.15")
DEST = "photos/references/listings"

def from_buyee(url):
    """Buyee proxy URL -> native listing URL, or None."""
    if "buyee.jp" not in url:
        return None
    m = re.search(r'/(m\d{9,})', url)                      # mercari
    if m: return f"https://jp.mercari.com/item/{m.group(1)}"
    m = re.search(r'auction/([a-zA-Z]\d{8,})', url)        # yahoo auctions
    if m: return f"https://page.auctions.yahoo.co.jp/jp/auction/{m.group(1)}"
    m = re.search(r'rakuma[^/]*/(?:item/)?([a-f0-9]{20,})', url)   # rakuma
    if m: return f"https://item.fril.jp/{m.group(1)}"
    return None

def og_image(html):
    for pat in (r'<meta[^>]+property=["\']og:image["\'][^>]*content=["\']([^"\']+)',
                r'<meta[^>]+content=["\']([^"\']+)["\'][^>]*property=["\']og:image'):
        m = re.search(pat, html)
        if m: return m.group(1)
    # rakuma item pages expose the large variant directly
    m = re.search(r'https://img\.fril\.jp/img/\d+/l/\d+\.jpg', html)
    return m.group(0) if m else None

def title(html):
    m = re.search(r'<meta[^>]+property=["\']og:title["\'][^>]*content=["\']([^"\']+)', html)
    return (m.group(1).replace(" by メルカリ", "") if m else "")

def fetch(url, i):
    native = from_buyee(url)
    if "buyee.jp" in url and not native:
        print(f"  {url[:60]}\n    Buyee URL with no recognisable source id — open it and paste the")
        print("    original listing link instead (Buyee blocks direct fetching)")
        return
    if native:
        print(f"  buyee -> {native}")
        url = native
    r = subprocess.run(["curl","-sS","-L","--max-time","25","-A",UA,
                        "-H","Accept-Language: ja-JP,ja;q=0.9",url],
                       capture_output=True, text=True, errors="replace")
    img = og_image(r.stdout)
    if not img:
        print(f"    no photo found — is the listing still up?")
        return
    host = urllib.parse.urlparse(url).netloc.split(".")[-2]
    os.makedirs(DEST, exist_ok=True)
    dst = f"{DEST}/new-{host}-{i}.jpg"
    subprocess.run(["curl","-sS","-L","--max-time","25","-A",UA,img,"-o",dst], check=False)
    try:
        from PIL import Image
        w, h = Image.open(dst).size
        print(f"    {title(r.stdout)[:52]}\n    saved {dst}  {w}x{h}")
    except Exception:
        print(f"    saved {dst} (could not read dimensions)")

def main():
    if len(sys.argv) < 2:
        print(__doc__); return 64
    for i, u in enumerate(sys.argv[1:]):
        fetch(u.strip(), i)
    return 0

if __name__ == "__main__":
    sys.exit(main())
