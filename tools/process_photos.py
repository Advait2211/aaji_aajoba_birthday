"""Normalize the original photos into web-ready WebP files.

Reads every photo in the project root (JPG/JPEG/HEIC), fixes orientation,
trims flat dark/white borders, applies manual crop overrides, and writes:
  site/img/full/<id>.webp   (1600px long edge)
  site/img/thumb/<id>.webp  (560px long edge)
  work/<id>.jpg             (2400px, for face detection; not deployed)
  site/data/photos.json     (merged with existing people/year data)

Usage: python tools/process_photos.py [--sheet out.jpg]
"""
import json
import os
import re
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageOps
import pillow_heif

pillow_heif.register_heif_opener()

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "site")
WORK = os.environ.get("WORK_DIR", os.path.join(ROOT, "tools", "work"))
DATA = os.path.join(SITE, "data", "photos.json")
EXTS = (".jpg", ".jpeg", ".heic")

# Per-photo fixes: {"rotate": deg, "crop": [l,t,r,b] fractions, "notrim": true}
# for sideways photos, photos-of-prints, and night shots the trim would eat.
MANUAL_CROPS = json.load(open(os.path.join(ROOT, "tools", "crops.json"))) if os.path.exists(
    os.path.join(ROOT, "tools", "crops.json")) else {}
# Manual year overrides for photos without EXIF dates.
YEARS = json.load(open(os.path.join(ROOT, "tools", "years.json"))) if os.path.exists(
    os.path.join(ROOT, "tools", "years.json")) else {}


def save(data):
    """Write photos.json plus photos.js (so index.html also works from file://)."""
    json.dump(data, open(DATA, "w"), ensure_ascii=False, indent=1)
    with open(DATA[:-2], "w") as f:
        f.write("window.PHOTOS = " + json.dumps(data["photos"], ensure_ascii=False) + ";\n")


def exif_date(im):
    ex = im.getexif()
    d = ex.get_ifd(0x8769).get(36867) or ex.get(306)
    return str(d) if d else None


def filename_date(name):
    m = re.search(r"(20\d\d)[-_]?(\d\d)[-_]?(\d\d)", name)
    if m and not name.startswith("WhatsApp"):
        return f"{m.group(1)}:{m.group(2)}:{m.group(3)} 00:00:00"
    return None


def is_flat(line, dark=40, light=228, std=14):
    m, s = line.mean(), line.std()
    return s < std and (m < dark or m > light)


def trim_borders(im, cap=0.15):
    g = np.asarray(im.convert("L"), dtype=np.float32)
    h, w = g.shape
    top = 0
    while top < h * cap and is_flat(g[top]):
        top += 1
    bottom = h
    while h - bottom < h * cap and is_flat(g[bottom - 1]):
        bottom -= 1
    left = 0
    while left < w * cap and is_flat(g[top:bottom, left]):
        left += 1
    right = w
    while w - right < w * cap and is_flat(g[top:bottom, right - 1]):
        right -= 1
    # Only trim if a real border exists (≥0.6% of the side); avoids nibbling.
    top = top if top > h * 0.006 else 0
    bottom = bottom if h - bottom > h * 0.006 else h
    left = left if left > w * 0.006 else 0
    right = right if w - right > w * 0.006 else w
    return (left, top, right, bottom)


def fit(im, long_edge):
    im = im.copy()
    im.thumbnail((long_edge, long_edge), Image.LANCZOS)
    return im


def main():
    os.makedirs(WORK, exist_ok=True)
    existing = {}
    if os.path.exists(DATA):
        existing = {p["src"]: p for p in json.load(open(DATA))["photos"]}

    files = sorted(f for f in os.listdir(ROOT) if f.lower().endswith(EXTS))
    records = []
    for f in files:
        im = Image.open(os.path.join(ROOT, f))
        date = exif_date(im) or filename_date(f)
        im = ImageOps.exif_transpose(im).convert("RGB")
        fix = MANUAL_CROPS.get(f, {})
        if "rotate" in fix:
            im = im.rotate(fix["rotate"], expand=True)
        if "crop" in fix:
            l, t, r, b = fix["crop"]
            W, H = im.size
            box = (int(l * W), int(t * H), int(r * W), int(b * H))
        elif fix.get("notrim"):
            box = (0, 0, *im.size)
        else:
            box = trim_borders(im)
        trimmed = box != (0, 0, *im.size)
        im = im.crop(box)
        records.append(dict(src=f, date=date, im=im, trimmed=trimmed, box=box))

    # Sort chronologically; undated photos use their year override, else go last.
    def key(r):
        y = YEARS.get(r["src"])
        if r["date"]:
            return r["date"]
        return f"{y}:06:01 00:00:00" if y else "9999"

    records.sort(key=key)
    photos = []
    for i, r in enumerate(records, 1):
        pid = f"p{i:02d}"
        im = r["im"]
        full, thumb = fit(im, 1600), fit(im, 560)
        full.save(os.path.join(SITE, "img", "full", pid + ".webp"), "WEBP", quality=80, method=6)
        thumb.save(os.path.join(SITE, "img", "thumb", pid + ".webp"), "WEBP", quality=78, method=6)
        fit(im, 2400).save(os.path.join(WORK, pid + ".jpg"), quality=92)
        year = int(r["date"][:4]) if r["date"] else YEARS.get(r["src"])
        prev = existing.get(r["src"], {})
        photos.append(dict(
            id=pid, src=r["src"], w=full.width, h=full.height,
            year=year, people=prev.get("people", []),
            caption=prev.get("caption", ""), trimmed=r["trimmed"],
        ))
        print(f"{pid} {r['src']:48s} {year} trim={r['box'] if r['trimmed'] else '-'}")

    save({"photos": photos})

    if "--sheet" in sys.argv:
        out = sys.argv[sys.argv.index("--sheet") + 1]
        cell = 300
        cols = 8
        rows = (len(photos) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * cell, rows * (cell + 24)), "white")
        d = ImageDraw.Draw(sheet)
        for i, p in enumerate(photos):
            t = Image.open(os.path.join(SITE, "img", "thumb", p["id"] + ".webp"))
            t.thumbnail((cell - 8, cell - 8))
            x, y = (i % cols) * cell, (i // cols) * (cell + 24)
            sheet.paste(t, (x + 4, y + 4))
            d.text((x + 6, y + cell), f"{p['id']} {p['year'] or '?'}{' T' if p['trimmed'] else ''}", fill="black")
        sheet.save(out, quality=85)


if __name__ == "__main__":
    main()
