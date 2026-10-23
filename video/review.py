"""Contact sheet of a composition: one still per scene (at `at` of its
length), to review the whole video at a glance.

    python video/review.py long [--at 0.6]
"""
import argparse
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from video.paths import OUT   # noqa: E402
from video.render import WAIT_IMAGES, lower_priority, page_for   # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("comp")
    ap.add_argument("--at", type=float, default=0.6)
    ap.add_argument("--cols", type=int, default=4)
    ap.add_argument("--only", type=int, nargs="*", help="scene numbers (1-based)")
    a = ap.parse_args()
    lower_priority()
    from playwright.sync_api import sync_playwright
    tiles = []
    with sync_playwright() as pw:
        browser, page = page_for(pw, a.comp)
        info = page.evaluate("({w: COMP.w, h: COMP.h, s: COMP.scenes.map((s) => [s.t0, s.d])})")
        page.set_viewport_size({"width": info["w"], "height": info["h"]})
        for i, (t0, d) in enumerate(info["s"]):
            if a.only and i + 1 not in a.only:
                continue
            urls = page.evaluate(f"render({t0 + d * a.at})")
            page.evaluate(WAIT_IMAGES, urls)
            png = page.screenshot(type="png")
            img = cv2.imdecode(np.frombuffer(png, np.uint8), cv2.IMREAD_COLOR)
            scale = 640 / img.shape[1]
            img = cv2.resize(img, (640, int(img.shape[0] * scale)), interpolation=cv2.INTER_AREA)
            cv2.putText(img, str(i + 1), (8, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
            tiles.append(img)
        browser.close()
    while len(tiles) % a.cols:
        tiles.append(np.zeros_like(tiles[0]))
    sheet = np.vstack([np.hstack(tiles[i:i + a.cols]) for i in range(0, len(tiles), a.cols)])
    out = OUT / "stills" / f"review_{a.comp}.jpg"
    out.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out), sheet, [cv2.IMWRITE_JPEG_QUALITY, 85])
    print("wrote", out)


if __name__ == "__main__":
    main()
