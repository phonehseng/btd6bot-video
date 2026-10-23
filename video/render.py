"""Render a composition of video/studio.html to an mp4.

    python video/render.py long            # the lecture
    python video/render.py short1 short2   # shorts
    python video/render.py long --from 60 --to 75 --preview   # a slice, quickly

1. Footage clips (FOOTAGE in comps.js) are cut from the saved recording
   chunks, sped up and stored as numbered JPEG frames (done once per clip).
2. A headless Microsoft Edge (Playwright) opens studio.html, and for every
   frame calls render(t) and takes a screenshot. render(t) is a pure function
   of t, so frames can be made in any order.
3. The screenshots are piped straight into ffmpeg (H.264, yuv420p).
4. Scenes with a voice line (`vo`) are spoken by Piper, an offline neural
   text-to-speech (nothing leaves the PC), and the scene is made long enough
   for its line. The lines go over a music bed (video/music.py), which ducks
   under the voice, and the mix is muxed into the video.
5. Footage clips recorded with the game's own sound (gameaudio.py) keep it:
   the clip's stretch of audio is cut, sped up with its pitch kept (clips up
   to 2x; faster ones stay silent), lined up with the picture by
   cross-correlating on-screen motion with loudness, and mixed under the
   scene - the pops are real.

Runs at idle CPU priority, so the bot's game on the same PC keeps the CPU.
"""
import argparse
import ctypes
import hashlib
import json
import wave
import subprocess
import sys
import tempfile
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from video.paths import BUILD, FFMPEG, FPS, FRAMES, HERE, OUT, RAW   # noqa: E402

IDLE_PRIORITY = 0x40
VOICE = Path.home() / ".btd6bot_cache/tools/piper/en_GB-alan-medium.onnx"
VO_DIR = BUILD / "vo"
VO_SPEED = 1.08          # Piper length_scale: a touch slower than default, for a lecture
VO_LEAD = 0.25           # seconds into a scene before its line starts
MUSIC_LEVEL = 0.33       # music under the voice (it ducks further while the voice speaks)
GAME_LEVEL = 0.8         # the game's own sound in footage scenes
GAME_MAX_SPEED = 2.0     # faster clips are not given sound (it would be noise)
REC_DIR = Path.home() / ".btd6bot_cache" / "recordings"


def lower_priority():
    """Idle priority for this process; Edge and ffmpeg inherit it."""
    ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(), IDLE_PRIORITY)


def page_for(pw, comp):
    browser = pw.chromium.launch(channel="msedge", headless=True,
                                 args=["--allow-file-access-from-files", "--disable-web-security"])
    url = (HERE / "studio.html").as_uri() + f"?comp={comp}&frozen=1&build={BUILD.as_uri()}/"
    page = browser.new_page(viewport={"width": 1920, "height": 1920})
    page.goto(url)
    page.wait_for_function("typeof render === 'function' && window.DATA !== undefined")
    return browser, page


def cut_footage(footage):
    """Frames for every clip that has none yet; returns {id: frame count}."""
    counts = {}
    for cid, c in footage.items():
        out = FRAMES / cid
        if not (out.exists() and any(out.glob("*.jpg"))):
            out.mkdir(parents=True, exist_ok=True)
            with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as lst:
                for ch in c["chunks"]:
                    lst.write(f"file '{(RAW / f'rec_20261023_{ch}.mkv').as_posix()}'\n")
            # trim in source time first, then speed up (an output -t would
            # count sped-up seconds and run past the clip's end)
            vf = (f"trim=start={c['start']}:duration={c['dur']},setpts=(PTS-STARTPTS)/{c['speed']},"
                  f"fps={FPS},scale=1280:-2")
            subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst.name,
                            "-vf", vf, "-q:v", "3", str(out / "%05d.jpg")], check=True)
            print(f"footage {cid}: cut")
        counts[cid] = len(list(out.glob("*.jpg")))
    (FRAMES / "manifest.js").write_text(
        "".join(f"FOOTAGE[{json.dumps(k)}].frames = {v};\n" for k, v in counts.items()), encoding="utf-8")
    return counts


def speak(text):
    """The voice line as a WAV (cached by its text); returns (path, seconds)."""
    VO_DIR.mkdir(parents=True, exist_ok=True)
    path = VO_DIR / (hashlib.sha1(f"{VO_SPEED}|{text}".encode()).hexdigest()[:16] + ".wav")
    if not path.exists():
        from piper import PiperVoice, SynthesisConfig
        voice = PiperVoice.load(str(VOICE))
        with wave.open(str(path), "wb") as w:
            voice.synthesize_wav(text, w, syn_config=SynthesisConfig(length_scale=VO_SPEED))
    with wave.open(str(path)) as w:
        return path, w.getnframes() / w.getframerate()


def voice_lines(page, comp):
    """Speak every scene's `vo`; write their lengths to vo/durations.js so
    the composition can size its scenes. Returns [(scene index, path)]."""
    lines = page.evaluate("COMP.scenes.map((s) => s.vo || null)")
    dur_file = VO_DIR / "durations.json"
    durations = json.loads(dur_file.read_text()) if dur_file.exists() else {}
    out, lengths = [], []
    for i, text in enumerate(lines):
        if not text:
            lengths.append(0)
            continue
        path, secs = speak(text)
        out.append((i, path))
        lengths.append(round(secs, 2))
    durations[comp] = lengths
    dur_file.write_text(json.dumps(durations))
    (VO_DIR / "durations.js").write_text(f"window.VO_DUR = {json.dumps(durations)};\n", encoding="utf-8")
    return out


def mix_audio(video, lines, starts, duration, seed=7, game=(), moods=None):
    """Voice lines at their scenes' starts and the game's sound of footage
    scenes, over a music bed that ducks under both; muxed into `video`
    (replaced in place). game: [(wav, scene start, offset into the wav, seconds)].
    moods: [(seconds, mood)] for music that changes with the chapters."""
    from video.music import render as music, render_sections, write_wav
    tag = "_".join(m for _, m in moods) if moods else "tense"
    music_wav = VO_DIR / f"music_{int(duration)}_{seed}_{abs(hash(tag)) % 10**6}.wav"
    if not music_wav.exists():
        write_wav(music_wav, render_sections(moods, seed) if moods else music(duration + 1, seed))
    args = [FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", str(video), "-i", str(music_wav)]
    chains, labels = [], []
    for k, (i, path) in enumerate(lines):
        args += ["-i", str(path)]
        ms = int((starts[i] + VO_LEAD) * 1000)
        chains.append(f"[{len(labels) + 2}]aformat=sample_rates=44100:channel_layouts=stereo,adelay={ms}|{ms}[v{k}]")
        labels.append(f"[v{k}]")
    for k, (path, at, off, secs) in enumerate(game):
        args += ["-i", str(path)]
        ms = int(at * 1000)
        fade = min(0.3, secs / 4)
        chains.append(f"[{len(labels) + 2}]aformat=sample_rates=44100:channel_layouts=stereo,atrim=start={off:.3f}:duration={secs:.3f},"
                      f"asetpts=PTS-STARTPTS,afade=t=in:d={fade:.2f},afade=t=out:st={secs - fade:.3f}:d={fade:.2f},"
                      f"volume={GAME_LEVEL},adelay={ms}|{ms}[g{k}]")
        labels.append(f"[g{k}]")
    if not labels:          # nothing to duck under: music alone
        subprocess.run(args[:-2] + ["-i", str(music_wav), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac",
                                     "-b:a", "192k", "-t", str(duration), str(video.with_name(video.stem + "_mixed.mp4"))], check=True)
        video.with_name(video.stem + "_mixed.mp4").replace(video)
        return
    graph = ";".join(chains)
    graph += f";{''.join(labels)}amix=inputs={len(labels)}:normalize=0,apad[vo];[vo]asplit[key][voice]"
    graph += f";[1]volume={MUSIC_LEVEL}[bed];[bed][key]sidechaincompress=threshold=0.02:ratio=6:attack=30:release=500[ducked]"
    graph += ";[ducked][voice]amix=inputs=2:normalize=0,alimiter=limit=0.95[a]"
    out = video.with_name(video.stem + "_mixed.mp4")
    subprocess.run(args + ["-filter_complex", graph, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac",
                           "-b:a", "192k", "-t", str(duration), str(out)], check=True)
    out.replace(video)


def _decode(path):
    """Any audio file -> float32 stereo at 44.1 kHz."""
    import numpy as np
    raw = subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-i", str(path), "-f", "f32le", "-ac", "2",
                          "-ar", "44100", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2)


def _stamp(name):
    """aud_YYYYmmdd_HHMMSS_mmm / rec_YYYYmmdd_HHMMSS -> epoch seconds."""
    from datetime import datetime
    parts = Path(name).stem.split("_")
    t = datetime.strptime(parts[1] + parts[2], "%Y%m%d%H%M%S").timestamp()
    return t + (int(parts[3]) / 1000 if len(parts) > 3 else 0)


def clip_audio(cid, c):
    """The game's sound for a clip as a WAV next to its frames (None when it
    was not recorded, or the clip is too fast). Returns the path."""
    import numpy as np
    out = FRAMES / f"{cid}.wav"
    if out.exists():
        return out
    if c["speed"] > GAME_MAX_SPEED:
        return None
    first = c["chunks"][0]
    chunk = first if first.startswith("rec_") else f"rec_20261023_{first}"
    t0 = _stamp(chunk) + c["start"]
    t1 = t0 + c["dur"]
    files = sorted({f.name: f for d in (RAW, REC_DIR) for f in [*d.glob("aud_*.opus"), *d.glob("aud_*.wav")]}.values())
    parts = [(f, _stamp(f.name)) for f in files]
    pieces = [(f, t) for f, t in parts if t < t1 and t + 62 > t0]
    if not pieces:
        return None
    sr = 44100
    track = np.zeros((int((t1 - t0 + 3) * sr), 2), np.float32)
    covered = 0
    for f, t in pieces:
        a = _decode(f)
        at = int((t - (t0 - 1.5)) * sr)       # 1.5 s of slack on each side, for the sync search
        lo, hi = max(0, at), min(len(track), at + len(a))
        if hi > lo:
            track[lo:hi] = a[lo - at:hi - at]
            covered += hi - lo
    if covered < (t1 - t0) * sr * 0.8:
        return None
    # speed up, pitch kept
    tmp = FRAMES / f"{cid}_raw.wav"
    import wave
    with wave.open(str(tmp), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((np.clip(track, -1, 1) * 32767).astype("<i2").tobytes())
    fast = FRAMES / f"{cid}_fast.wav"
    subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", str(tmp), "-af", f"atempo={c['speed']}",
                    str(fast)], check=True)
    tmp.unlink()
    a = _decode(fast)
    fast.unlink()
    # line it up with the picture: motion between frames vs loudness, at 30 fps
    import cv2
    frames = sorted((FRAMES / cid).glob("*.jpg"))
    prev, motion = None, []
    for fpath in frames:
        g = cv2.resize(cv2.imread(str(fpath), cv2.IMREAD_GRAYSCALE), (160, 100)).astype(np.float32)
        motion.append(0.0 if prev is None else float(np.abs(g - prev).mean()))
        prev = g
    motion = np.array(motion)
    hop = sr // FPS
    loud = np.array([np.sqrt((a[i:i + hop] ** 2).mean()) for i in range(0, len(a) - hop, hop)])
    slack = int(1.5 / c["speed"] * FPS)        # the 1.5 s of slack, in clip frames
    best, best_lag = -1e9, slack
    m = (motion - motion.mean()) / (motion.std() + 1e-6)
    for lag in range(0, 2 * slack + 1):
        seg = loud[lag:lag + len(m)]
        if len(seg) < len(m):
            break
        sg = (seg - seg.mean()) / (seg.std() + 1e-6)
        score = float((m * sg).mean())
        if score > best:
            best, best_lag = score, lag
    start = best_lag * hop
    clip = a[start:start + len(frames) * hop]
    with wave.open(str(out), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((np.clip(clip, -1, 1) * 32767).astype("<i2").tobytes())
    print(f"footage {cid}: game audio, synced at {(best_lag - slack) / FPS * c['speed']:+.2f} s (score {best:.2f})")
    return out


WAIT_IMAGES = """async (urls) => {
  await Promise.all(urls.map((u) => { const i = new Image(); i.src = u; return i.decode().catch(() => null); }));
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}"""


def render(comp, t_from=None, t_to=None, preview=False):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        browser, page = page_for(pw, comp)
        footage = page.evaluate("FOOTAGE")
        cut_footage(footage)
        lines = voice_lines(page, comp)
        page.reload()
        page.wait_for_function("typeof render === 'function' && window.DATA !== undefined")
        info = page.evaluate("({w: COMP.w, h: COMP.h, d: COMP.duration})")
        w, h, dur = info["w"], info["h"], info["d"]
        page.set_viewport_size({"width": w, "height": h})
        fps = 15 if preview else FPS
        a, b = (t_from or 0), (t_to if t_to is not None else dur)
        n = int((b - a) * fps)
        name = f"{comp}" + (f"_{a:g}-{b:g}" if t_from is not None or t_to is not None else "") + ("_preview" if preview else "")
        out = OUT / f"{name}.mp4"
        enc = subprocess.Popen([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", str(fps),
                                "-i", "-", "-c:v", "libx264", "-preset", "veryfast" if preview else "medium",
                                "-crf", "23" if preview else "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out)],
                               stdin=subprocess.PIPE)
        started = time.time()
        for i in range(n):
            t = a + i / fps
            urls = page.evaluate(f"render({t})")
            page.evaluate(WAIT_IMAGES, urls)
            enc.stdin.write(page.screenshot(type="jpeg", quality=92))
            if i % (fps * 10) == 0:
                print(f"{comp}: {t:6.1f}s / {b:g}s  ({time.time() - started:.0f}s elapsed)", flush=True)
        enc.stdin.close()
        enc.wait()
        starts = page.evaluate("COMP.scenes.map((s) => s.t0)")
        shots = page.evaluate("COMP.scenes.map((s) => s.kind === 'footage' ? [s.clip, s.t0, s.d, (s.from || 0) + (s.start || 0)] : null)")
        moods = page.evaluate("COMP.moods ? COMP.moods() : null")
        browser.close()
    if t_from is None and t_to is None:
        game = []
        for shot in shots:
            if not shot:
                continue
            clip, at, d, off = shot
            wav = clip_audio(clip, footage[clip])
            if wav:
                game.append((wav, at, off, d))
        if lines or game or moods:
            mix_audio(out, lines, starts, dur, game=game, moods=moods)
    print("wrote", out)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("comps", nargs="+")
    ap.add_argument("--from", dest="t_from", type=float)
    ap.add_argument("--to", dest="t_to", type=float)
    ap.add_argument("--preview", action="store_true", help="15 fps, faster encode")
    ap.add_argument("--still", type=float, help="write one PNG at this time instead of a video")
    a = ap.parse_args()
    lower_priority()
    if a.still is not None:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            for comp in a.comps:
                browser, page = page_for(pw, comp)
                info = page.evaluate("({w: COMP.w, h: COMP.h})")
                page.set_viewport_size({"width": info["w"], "height": info["h"]})
                urls = page.evaluate(f"render({a.still})")
                page.evaluate(WAIT_IMAGES, urls)
                path = OUT / "stills" / f"{comp}_{a.still:g}.png"
                path.parent.mkdir(parents=True, exist_ok=True)
                page.screenshot(path=str(path))
                print("wrote", path)
                browser.close()
        return
    for comp in a.comps:
        render(comp, a.t_from, a.t_to, a.preview)


if __name__ == "__main__":
    main()
