"""Detect, embed and cluster faces across all photos (runs fully offline).

  python tools/faces.py detect  --sheet clusters.jpg   # cluster + contact sheet
  python tools/faces.py apply                           # write names into photos.json

`detect` writes tools/work/faces.json (every face with bbox, embedding, cluster).
The user maps cluster numbers to names in tools/names.json, e.g.
  {"आजी": [0, 7], "आजोबा": [2]}
`apply` then fills `people` in site/data/photos.json and saves one round avatar
per person in site/img/faces/<slug>.webp.
"""
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from sklearn.cluster import AgglomerativeClustering

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "site")
WORK = os.environ.get("WORK_DIR", os.path.join(ROOT, "tools", "work"))
DATA = os.path.join(SITE, "data", "photos.json")
FACES = os.path.join(ROOT, "tools", "faces.json")
NAMES = os.path.join(ROOT, "tools", "names.json")
# Face overrides for mistakes clustering makes: {"p12#3": "आजी", "p05#1": null}
FIXES = os.path.join(ROOT, "tools", "face_fixes.json")

MIN_FACE = 40        # px, on the 2400px working image
MIN_SCORE = 0.6
DIST = 0.62          # cosine distance threshold for clustering


def save(data):
    """Write photos.json plus photos.js (so index.html also works from file://)."""
    json.dump(data, open(DATA, "w"), ensure_ascii=False, indent=1)
    with open(DATA[:-2], "w") as f:
        f.write("window.PHOTOS = " + json.dumps(data["photos"], ensure_ascii=False) + ";\n")


def detect():
    from insightface.app import FaceAnalysis

    app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
    app.prepare(ctx_id=-1, det_size=(1024, 1024))
    photos = json.load(open(DATA))["photos"]
    faces = []
    for p in photos:
        img = cv2.imread(os.path.join(WORK, p["id"] + ".jpg"))
        for i, f in enumerate(app.get(img)):
            x1, y1, x2, y2 = [int(v) for v in f.bbox]
            if min(x2 - x1, y2 - y1) < MIN_FACE or f.det_score < MIN_SCORE:
                continue
            faces.append(dict(key=f"{p['id']}#{i}", photo=p["id"], src=p["src"],
                              bbox=[x1, y1, x2, y2], score=float(f.det_score),
                              emb=f.normed_embedding.astype(float).tolist()))
        print(p["id"], sum(1 for f in faces if f["photo"] == p["id"]), "faces")

    X = np.array([f["emb"] for f in faces])
    labels = AgglomerativeClustering(n_clusters=None, metric="cosine", linkage="average",
                                     distance_threshold=DIST).fit_predict(X)
    # Renumber clusters by size (0 = biggest).
    order = {c: i for i, (c, _) in enumerate(
        sorted(((c, (labels == c).sum()) for c in set(labels)), key=lambda t: -t[1]))}
    for f, l in zip(faces, labels):
        f["cluster"] = order[l]
    json.dump(faces, open(FACES, "w"))
    print(len(faces), "faces,", len(order), "clusters")


def crop_face(f, size=160, pad=0.35):
    img = Image.open(os.path.join(WORK, f["photo"] + ".jpg"))
    x1, y1, x2, y2 = f["bbox"]
    w, h = x2 - x1, y2 - y1
    s = max(w, h) * (1 + 2 * pad)
    cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
    box = [int(cx - s / 2), int(cy - s / 2), int(cx + s / 2), int(cy + s / 2)]
    return img.crop(box).resize((size, size), Image.LANCZOS)


def sheet(out, per_row=12, cell=110):
    faces = json.load(open(FACES))
    clusters = {}
    for f in faces:
        clusters.setdefault(f["cluster"], []).append(f)
    # Only clusters that repeat are interesting; singletons go on a last row.
    multi = sorted(c for c, fs in clusters.items() if len(fs) > 1)
    singles = [fs[0] for c, fs in clusters.items() if len(fs) == 1]
    rows = [(c, clusters[c][:per_row]) for c in multi]
    for i in range(0, len(singles), per_row):
        rows.append(("1x", singles[i:i + per_row]))
    font = ImageFont.load_default(size=22)
    im = Image.new("RGB", (80 + per_row * cell, len(rows) * (cell + 6)), "white")
    d = ImageDraw.Draw(im)
    for r, (c, fs) in enumerate(rows):
        y = r * (cell + 6)
        label = f"{c}" if c == "1x" else f"#{c}\n({len(clusters[c])})"
        d.multiline_text((6, y + 30), label, fill="black", font=font)
        for j, f in enumerate(fs):
            face = crop_face(f, cell - 6)
            im.paste(face, (80 + j * cell, y + 3))
            if c == "1x":
                d.text((82 + j * cell, y + cell - 22), f"{f['cluster']}", fill="yellow", font=font)
    im.save(out, quality=88)


SLUGS = {"आजी": "aaji", "आजोबा": "aajoba", "अद्वैत": "advait", "ओजस": "ojas", "प्राची": "prachi",
         "अमित": "amit", "क्षमा": "kshama", "क्षितिज": "kshitij", "तन्वी": "tanvi", "काव्य": "kavya",
         "मंथन": "manthan", "देवांग": "devang"}


def apply():
    faces = json.load(open(FACES))
    names = json.load(open(NAMES))
    fixes = json.load(open(FIXES)) if os.path.exists(FIXES) else {}
    by_cluster = {c: n for n, cs in names.items() for c in cs}
    data = json.load(open(DATA))
    people = {}
    for f in faces:
        n = fixes[f["key"]] if f["key"] in fixes else by_cluster.get(f["cluster"])
        f["name"] = n
        if n:
            people.setdefault(f["photo"], set()).add(n)
    for p in data["photos"]:
        p["people"] = sorted(people.get(p["id"], []), key=list(SLUGS).index)
    save(data)

    # Avatar: prefer a face named in avatars.json, else the largest confident one.
    picks = json.load(open(os.path.join(ROOT, "tools", "avatars.json"))) if os.path.exists(
        os.path.join(ROOT, "tools", "avatars.json")) else {}
    for n, slug in SLUGS.items():
        mine = [f for f in faces if f["name"] == n]
        if not mine:
            continue
        best = next((f for f in mine if f["key"] == picks.get(n)), None) or max(
            mine, key=lambda f: (f["bbox"][2] - f["bbox"][0]) * f["score"])
        crop_face(best, 320, pad=0.45).save(os.path.join(SITE, "img", "faces", slug + ".webp"),
                                             "WEBP", quality=82)
    # Solo 4:5 portraits cut around one face, e.g. {"aajoba": "p29#1"}.
    ppath = os.path.join(ROOT, "tools", "portraits.json")
    for slug, key in (json.load(open(ppath)) if os.path.exists(ppath) else {}).items():
        f = next(f for f in faces if f["key"] == key)
        img = Image.open(os.path.join(WORK, f["photo"] + ".jpg"))
        x1, y1, x2, _ = f["bbox"]
        w, cx = x2 - x1, (x1 + x2) / 2
        h = min(w * 4.2, img.height, img.width / .8)
        top = max(0, min(y1 - w * 1.2, img.height - h))
        left = max(0, min(cx - h * .4, img.width - h * .8))
        img.crop((int(left), int(top), int(left + h * .8), int(top + h))).resize((800, 1000), Image.LANCZOS) \
            .save(os.path.join(SITE, "img", f"portrait-{slug}.webp"), "WEBP", quality=82)

    counts = {n: sum(n in p["people"] for p in data["photos"]) for n in SLUGS}
    for n, c in sorted(counts.items(), key=lambda t: -t[1]):
        print(f"{n}\t{c}")


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "detect":
        detect()
    elif cmd == "apply":
        apply()
    if "--sheet" in sys.argv:
        sheet(sys.argv[sys.argv.index("--sheet") + 1])
