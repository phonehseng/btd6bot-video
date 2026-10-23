"""Where the explainer's inputs and outputs live.

The bot itself is a separate repository (btd6bot), checked out next to this
one: its code (OCR, map geometry, damage model) and its logs are read from
there - set BTD6BOT to use another place. The renders are large (thousands
of frames), so they are built outside the OneDrive project folders, next to
the bot's other videos."""
import glob
import os
import sys
from pathlib import Path

BOT_ROOT = Path(os.environ.get("BTD6BOT", Path(__file__).resolve().parents[2] / "btd6bot"))
if str(BOT_ROOT) not in sys.path:
    sys.path.insert(1, str(BOT_ROOT))      # `import btd6bot` from the bot's checkout

HERE = Path(__file__).resolve().parent
OUT = Path.home() / "Videos" / "BTD6 Bot" / "Explainer"
BUILD = OUT / "build"
ASSETS = BUILD / "assets"
FRAMES = BUILD / "footage"           # footage clips as numbered JPEG frames
RAW = OUT / "footage" / "raw"        # saved 1-minute recording chunks (recorder.py)
FFMPEG = sorted(glob.glob(str(Path.home() / ".btd6bot_cache/tools/ffmpeg/*/bin/ffmpeg.exe")))[-1]
FPS = 30
