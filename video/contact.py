"""Contact sheet of recording chunks: one frame every few seconds, labelled
with chunk and offset, to pick footage for the explainer.

    python video/contact.py OUT.jpg CHUNK [CHUNK ...] [--every 10]
"""
import argparse
import glob
import subprocess
import tempfile
from pathlib import Path

import cv2
import numpy as np

FFMPEG = sorted(glob.glob(str(Path.home() / ".btd6bot_cache/tools/ffmpeg/*/bin/ffmpeg.exe")))[-1]


def frames(chunk, every):
    """(offset seconds, BGR thumbnail) every `every` seconds of a chunk."""
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-i", chunk,
                        "-vf", f"fps=1/{every},scale=320:-1", str(Path(tmp) / "%03d.jpg")], check=True)
        for i, f in enumerate(sorted(Path(tmp).glob("*.jpg"))):
            yield i * every, cv2.imread(str(f))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("chunks", nargs="+")
    ap.add_argument("--every", type=float, default=10)
    a = ap.parse_args()
    tiles = []
    for chunk in a.chunks:
        name = Path(chunk).stem[-6:]
        for off, img in frames(chunk, a.every):
            cv2.putText(img, f"{name}+{off:g}", (4, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
            tiles.append(img)
    cols = 6
    h, w = tiles[0].shape[:2]
    while len(tiles) % cols:
        tiles.append(np.zeros_like(tiles[0]))
    rows = [np.hstack(tiles[i:i + cols]) for i in range(0, len(tiles), cols)]
    cv2.imwrite(a.out, np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 80])


if __name__ == "__main__":
    main()
