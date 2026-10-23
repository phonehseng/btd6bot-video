"""Real data for the explainer's animations, made with the bot's own code.

Everything the animations show as "what the bot sees" comes from here, not
from a drawing program:

  * hud_*.png / ocr.json   a real cash readout: the crop, the HSV mask the HUD
                           reader makes (hud._binarize) and the OCR's answer
  * menu.jpg / menu.json   a real Victory screen and the words the OCR found
                           on it, with their boxes
  * garden.json            Covered Garden from the decompiled map file: track,
                           areas and the four glass panes in cycle order
  * garden_dist.png        the placement grid's distance transform there
  * margins.json           the damage model's margin, round by round, for the
                           Water Park Easy defence the bot had at round 28 on
                           2026-10-22 (the game it lost)
  * stills                 frames from the bot's own recordings

    python video/prep_assets.py
Writes to BUILD/assets (see video/paths.py).
"""
import json
import subprocess
import sys
from pathlib import Path
from types import SimpleNamespace as N

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from video.paths import ASSETS, BOT_ROOT, FFMPEG, RAW   # noqa: E402


def frame_at(chunk, seconds):
    """One frame (BGR) of a recording chunk."""
    out = subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-ss", str(seconds),
                          "-i", str(RAW / chunk), "-frames:v", "1", "-f", "image2pipe",
                          "-vcodec", "png", "-"], capture_output=True, check=True).stdout
    return cv2.imdecode(np.frombuffer(out, np.uint8), cv2.IMREAD_COLOR)


def ocr_words(img):
    """[(text, confidence, [x0, y0, x1, y1] as fractions)] for every word."""
    from btd6bot.vision import _engine
    res, _ = _engine()(img)
    h, w = img.shape[:2]
    words = []
    for box, text, conf in res or []:
        xs, ys = [p[0] for p in box], [p[1] for p in box]
        words.append((text, float(conf), [min(xs) / w, min(ys) / h, max(xs) / w, max(ys) / h]))
    return words


def cash_readout():
    """The cash box of a real in-game frame, its HUD mask and the OCR read."""
    from btd6bot.hud import _binarize, rec_text
    img = frame_at("rec_20261023_002149.mkv", 2)
    cv2.imwrite(str(ASSETS / "game_still.jpg"), img, [cv2.IMWRITE_JPEG_QUALITY, 92])
    # the cash word: the OCR's own detector finds it in the top-left corner
    top = img[: img.shape[0] // 8, : img.shape[1] // 3]
    cash = next(w for w in ocr_words(top) if w[0].lstrip().startswith("$"))
    th, tw = top.shape[:2]
    x0, y0, x1, y1 = cash[2]
    pad = 6
    box = (max(0, int(x0 * tw) - pad), max(0, int(y0 * th) - pad), int(x1 * tw) + pad, int(y1 * th) + pad)
    crop = top[box[1]:box[3], box[0]:box[2]]
    mask = _binarize(crop)
    text, conf = rec_text(crop)
    cv2.imwrite(str(ASSETS / "hud_crop.png"), crop)
    cv2.imwrite(str(ASSETS / "hud_mask.png"), mask)
    fh, fw = img.shape[:2]
    # a 12 x 8 patch of real pixel values (B, G, R) from the middle of the
    # cash digits, for "a frame is an array"
    cy, cx = (box[1] + box[3]) // 2, (box[0] + box[2]) // 2
    patch = img[cy - 4:cy + 4, cx - 6:cx + 6].tolist()
    return {"text": text, "conf": round(conf, 3), "patch": patch, "shape": list(img.shape),
            "box": [box[0] / fw, box[1] / fh, box[2] / fw, box[3] / fh]}


def menu_screen():
    img = frame_at("rec_20261023_025749.mkv", 1.5)
    cv2.imwrite(str(ASSETS / "menu.jpg"), img, [cv2.IMWRITE_JPEG_QUALITY, 92])
    return [{"text": t, "conf": round(c, 2), "box": b} for t, c, b in ocr_words(img) if c > 0.6]


def garden():
    """Covered Garden for the bird's-eye view: everything in play-field
    fractions (0..1 across the map area, without the tower panel)."""
    from btd6bot import layout as L, mapgeom
    from btd6bot.maplearn import MapModel
    import btd6bot.placement as PL
    lay = L.get(1920, 1200)
    m = MapModel.load("Covered Garden", lay["playfield"])
    geom = json.loads((mapgeom.GEOMETRY_DIR / f"{mapgeom.map_id_for(m.name)}.json").read_text(encoding="utf-8"))
    proj = mapgeom.Projection(m.playfield)
    x0, y0, x1, y1 = m.playfield

    def pf(points):
        f = proj.to_frac(points)
        return [[round((x - x0) / (x1 - x0), 4), round((y - y0) / (y1 - y0), 4)] for x, y in f]

    dyn = mapgeom.dynamics(geom)
    panes = dyn.panes[0]["areas"]
    areas = []
    for a in geom["areas"]:
        for poly in a.get("polygons") or []:
            areas.append({"name": a["name"], "type": a["type"], "pane": panes.index(a["id"]) if a["id"] in panes else None,
                          "pts": pf(poly)})
    track = [pf(p["points"]) for p in geom["paths"]]
    # (the distance transform is shown on an open map: Covered Garden is
    # mostly glass, so its grid shows little - see distance_images)
    distance_images("Monkey Meadow")
    return {"areas": areas, "track": track, "pane_names": ["bottom-left", "top-left", "top-right", "bottom-right"]}


def distance_images(map_name):
    """dist.png: the distance transform behind "legal spots" (each cell's
    distance to the nearest place a tower may not stand), and legal.png:
    where a dart monkey's footprint fits."""
    from btd6bot import layout as L, mapgeom
    from btd6bot.maplearn import MapModel
    import btd6bot.placement as PL
    m = MapModel.load(map_name, L.get(1920, 1200)["playfield"])
    m.refused = {}
    ok = PL.valid_spots(m, "dart")
    land = mapgeom.grids_for(m)["scan"]["land"] == 1
    dist = cv2.distanceTransform(np.pad(land, 1).astype(np.uint8), cv2.DIST_L2, 5)[1:-1, 1:-1]
    vis = cv2.applyColorMap(np.clip(dist * 9, 0, 255).astype(np.uint8), cv2.COLORMAP_INFERNO)
    vis[~land] = (24, 18, 16)
    vis = cv2.resize(vis, (vis.shape[1] * 6, vis.shape[0] * 6), interpolation=cv2.INTER_NEAREST)
    cv2.imwrite(str(ASSETS / "dist.png"), vis)
    legal = cv2.resize(np.where(ok, 255, 0).astype(np.uint8), (vis.shape[1], vis.shape[0]),
                       interpolation=cv2.INTER_NEAREST)
    cv2.imwrite(str(ASSETS / "legal.png"), legal)


# Log windows for the footage that shows the bot building: the clip's first
# frame is at clock time `start` (HH:MM:SS); lines up to `seconds` later.
LOG_WINDOWS = {
    "karts": ("02:09:44", 60),
    "cgPlace": ("02:17:57", 32),
    "parkPlace": ("02:46:58", 30),
}


def log_lines():
    """{clip: [[seconds into the clip, text, x, y]]} from logs/bot.log: every
    tower placed or upgraded, with the screen spot it is at (fractions) so
    the video can ring it."""
    import re
    from datetime import datetime
    root = BOT_ROOT
    lines = []
    for f in ("logs/bot.log.1", "logs/bot.log"):
        p = root / f
        if p.exists():
            lines += p.read_text(encoding="utf-8", errors="replace").splitlines()
    out = {}
    for clip, (start, seconds) in LOG_WINDOWS.items():
        t0 = datetime.strptime("2026-10-23 " + start, "%Y-%m-%d %H:%M:%S")
        spots, rows = {}, []
        for line in lines:
            m = re.match(r"(\d{4}-\d\d-\d\d \d\d:\d\d:\d\d),(\d+) I game: (placed (\S+) \((\w+)\) at ([\d.]+),([\d.]+)|upgraded (\S+) -> ([\d-]+))", line)
            if not m:
                continue
            t = (datetime.strptime(m.group(1), "%Y-%m-%d %H:%M:%S") - t0).total_seconds() + int(m.group(2)) / 1000
            if m.group(4):
                spots[m.group(4)] = (float(m.group(6)), float(m.group(7)))
            if not 0 <= t <= seconds:
                continue
            if m.group(4):
                x, y = spots[m.group(4)]
                rows.append([round(t, 2), f"placed {m.group(4)} ({m.group(5)}) at {x:.3f},{y:.3f}", x, y])
            else:
                x, y = spots.get(m.group(8), (None, None))
                rows.append([round(t, 2), f"upgraded {m.group(8)} -> {m.group(9)}", x, y])
        out[clip] = rows
    return out


def margins():
    """Rounds 15-40 of the Water Park Easy defence lost on 2026-10-22, as
    the bot had it at round 28 (tests/test_forecast_offline.py)."""
    from btd6bot.forecast import RoundForecast
    towers = [
        N(tid="a1", kind="tack", tiers=(4, 0, 2), x=0.740, y=0.334),
        N(tid="tack1", kind="tack", tiers=(1, 0, 0), x=0.350, y=0.819),
        N(tid="a2", kind="tack", tiers=(1, 0, 2), x=0.601, y=0.905),
        N(tid="b1", kind="tack", tiers=(0, 2, 2), x=0.639, y=0.462),
        N(tid="tack2", kind="tack", tiers=(3, 0, 0), x=0.174, y=0.692),
        N(tid="rv", kind="village", tiers=(0, 2, 0), x=0.521, y=0.606),
        N(tid="nin", kind="ninja", tiers=(3, 0, 2), x=0.751, y=0.283),
    ]
    f = RoundForecast("Water Park", "easy")
    return [[r, round(f.margin(towers, r), 2)] for r in range(15, 41)]


def main():
    ASSETS.mkdir(parents=True, exist_ok=True)
    # the bloon watch's own debug frame (Moon Landing Easy, round 10)
    src = BOT_ROOT / "logs/bloonwatch/20261022_185007_MoonLanding_easy_10_94.png"
    (ASSETS / "bloonwatch.png").write_bytes(src.read_bytes())
    # more of the bot's own debug images from its development: version one's
    # bloon heat maps, a decoded track drawn over the game that missed, the
    # path check (missed / fitted) and decoded maps as grids
    for name in ("models.png", "lc_overlay.png", "paths_check.png", "geom_check.png", "logs_check.png"):
        (ASSETS / name).write_bytes((src.parents[1] / name).read_bytes())
    data = {"ocr": cash_readout(), "menu": menu_screen(), "garden": garden(), "margins": margins(),
            "logs": log_lines()}
    (ASSETS / "data.js").write_text("window.DATA = " + json.dumps(data) + ";\n", encoding="utf-8")
    print("cash read:", data["ocr"], "| menu words:", len(data["menu"]),
          "| garden areas:", len(data["garden"]["areas"]), "| margins:", data["margins"][10:16])


if __name__ == "__main__":
    main()
