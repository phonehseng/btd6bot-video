"""Background music for the explainer, synthesised from scratch with NumPy:
no samples, no loops from anywhere else, so it is free to use.

A piece is built from moods - a key and progression, a tempo, and which
instruments play (a soft pad, a plucked arpeggio with an echo, a sub bass,
a muted kick that makes the rest "breathe", ticking hats, and a noise riser
into each 8-bar section). The shorts use one mood ("tense": D minor, 96
bpm); the lecture changes mood with each chapter, crossfading between them.

    python video/music.py OUT.wav SECONDS [--mood tense]
"""
import argparse
import wave

import numpy as np

SR = 44100
CROSSFADE = 2.0          # seconds between two moods

# chords as MIDI notes
Dm, Bb, F, C, Gm, A = [50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55], [43, 46, 50], [45, 49, 52]
Am, G, Em, D, Bm = [45, 48, 52], [43, 47, 50], [40, 43, 47], [50, 54, 57], [47, 50, 54]

MOODS = {
    # the hook: dark and driving
    "tense":     {"bpm": 96, "chords": [Dm, Bb, F, C], "level": 0.7, "pad": 1, "arp": 1, "bass": 1, "kick": 1, "hats": 1},
    # the first steps: light, questioning, no drums
    "curious":   {"bpm": 88, "chords": [Am, F, C, G], "level": 0.45, "pad": 1, "arp": 1, "bass": 0.5, "kick": 0, "hats": 0},
    # the losses: slow pads, a lonely arpeggio
    "dark":      {"bpm": 68, "chords": [Dm, Gm, Dm, A], "level": 0.4, "pad": 1, "arp": 0.5, "bass": 0.6, "kick": 0, "hats": 0},
    # reading the game's files: things start to click
    "discovery": {"bpm": 100, "chords": [F, C, Dm, Bb], "level": 0.6, "pad": 1, "arp": 1, "bass": 1, "kick": 0.6, "hats": 0},
    # computer vision: busy and precise
    "tech":      {"bpm": 112, "chords": [Em, C, G, D], "level": 0.65, "pad": 0.8, "arp": 1, "bass": 1, "kick": 1, "hats": 1},
    # planning ahead: tension rising
    "build":     {"bpm": 104, "chords": [Dm, Bb, F, C], "level": 0.75, "pad": 1, "arp": 1, "bass": 1, "kick": 1, "hats": 1},
    # the payoff: major key, everything playing
    "triumph":   {"bpm": 104, "chords": [D, A, Bm, G], "level": 0.9, "pad": 1, "arp": 1, "bass": 1, "kick": 1, "hats": 1},
}


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lowpass(x, cutoff):
    """One-pole low-pass (cutoff in Hz, may be an array per sample)."""
    a = np.exp(-2 * np.pi * np.asarray(cutoff) / SR) * np.ones_like(x)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def saw(f, n, detune=0.0, phase=0.0):
    t = np.arange(n) / SR
    return 2 * ((t * f * (1 + detune) + phase) % 1.0) - 1


def env(n, attack, release):
    """Attack / exponential release envelope over n samples."""
    t = np.arange(n) / SR
    return np.minimum(1.0, t / max(attack, 1e-4)) * np.exp(-t / max(release, 1e-4))


def _add(buf, start, sig, gain=1.0):
    n = len(buf)
    if start >= n:
        return
    e = min(n, start + len(sig))
    buf[start:e] += sig[:e - start] * gain


def render_mood(seconds, mood="tense", seed=7):
    """`seconds` of one mood, stereo, not normalised."""
    m = MOODS[mood]
    rng = np.random.default_rng(seed)
    beat = 60 / m["bpm"]
    bar = 4 * beat
    n = int(seconds * SR)
    L, R, duck = np.zeros(n), np.zeros(n), np.ones(n)
    bars = int(np.ceil(seconds / bar)) + 1
    for b in range(bars):
        chord = m["chords"][b % 4]
        start = int(b * bar * SR)
        if start >= n:
            break
        intensity = min(1.0, m["level"] * (0.75 + 0.05 * (b % 8)))
        mb = int(bar * SR)
        if m["pad"]:
            seg = np.zeros(mb)
            for note in chord:
                for d in (-0.004, 0.0, 0.005):
                    seg += saw(hz(note), mb, d, rng.random())
            swell = np.sin(np.linspace(0, np.pi, mb)) ** 0.6
            seg = lowpass(seg, 450 + 900 * intensity) * swell * 0.035 * m["pad"]
            _add(L, start, seg)
            _add(R, start, seg, 0.95)
        if m["arp"]:
            pattern = [0, 1, 2, 1, 2, 0, 1, 2] * 2
            step = 4 if m["arp"] >= 1 else 2          # sixteenths, or eighths for a sparse arp
            for k, idx in enumerate(pattern[: 4 * step]):
                s = start + int(k * beat / step * SR)
                note = chord[idx] + 24 + (12 if (k % 8 == 7 and intensity > 0.7) else 0)
                ln = int(0.35 * SR)
                t = np.arange(ln) / SR
                tone = (np.sin(2 * np.pi * hz(note) * t) + 0.3 * np.sin(4 * np.pi * hz(note) * t)) * env(ln, 0.002, 0.09 if step == 4 else 0.25)
                vol = 0.05 * (0.6 + 0.4 * intensity)
                pan = 0.5 + 0.35 * np.sin(k * 0.7 + b)
                _add(L, s, tone, vol * (1 - pan) * 2)
                _add(R, s, tone, vol * pan * 2)
                d = s + int(0.75 * beat * SR)                 # echo, a dotted eighth later
                _add(L, d, tone, vol * 0.35 * pan * 2)
                _add(R, d, tone, vol * 0.35 * (1 - pan) * 2)
        if m["bass"]:
            for k in range(8):
                s = start + int(k * beat / 2 * SR)
                ln = int(beat / 2 * SR)
                t = np.arange(ln) / SR
                bass = np.sin(2 * np.pi * hz(chord[0] - 24) * t) * env(ln, 0.005, 0.18) * 0.16 * intensity * m["bass"]
                _add(L, s, bass)
                _add(R, s, bass)
        if m["kick"]:
            for k in range(4):
                s = start + int(k * beat * SR)
                if s >= n or b == 0:
                    continue
                ln = int(0.25 * SR)
                t = np.arange(ln) / SR
                f = 110 * np.exp(-t * 30) + 45
                kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(ln, 0.001, 0.07) * 0.32 * intensity * m["kick"]
                _add(L, s, kick)
                _add(R, s, kick)
                dl = min(n, s + int(0.3 * SR))
                duck[s:dl] = np.minimum(duck[s:dl], 0.45 + 0.55 * np.linspace(0, 1, dl - s) ** 0.7)
        if m["hats"] and b >= 4:
            for k in range(1, 16, 2):
                s = start + int(k * beat / 4 * SR)
                ln = int(0.04 * SR)
                hat = rng.standard_normal(ln) * env(ln, 0.0005, 0.012) * 0.03
                hat = hat - np.concatenate([[0], hat[:-1]])
                _add(L, s, hat, 0.8)
                _add(R, s, hat)
        if b % 8 == 7 and m["kick"]:
            ramp = np.linspace(0, 1, mb) ** 2
            noise = lowpass(rng.standard_normal(mb), 600 + 5000 * ramp) * ramp * 0.06
            _add(L, start, noise)
            _add(R, start, noise)
    return np.stack([L * duck, R * duck], axis=1)


def render(seconds, seed=7, mood="tense"):
    """One mood with fades, normalised (the shorts)."""
    return render_sections([(seconds, mood)], seed)


def render_sections(sections, seed=7):
    """[(seconds, mood)] in order, crossfaded, with a fade in and out."""
    total = int(sum(s for s, _ in sections) * SR)
    out = np.zeros((total + int(CROSSFADE * SR), 2))
    pos = 0
    xf = int(CROSSFADE * SR)
    for i, (secs, mood) in enumerate(sections):
        part = render_mood(secs + CROSSFADE, mood, seed + i)
        g = np.ones(len(part))
        if i:
            g[:xf] = np.linspace(0, 1, xf)
        if i < len(sections) - 1:
            g[-xf:] = np.linspace(1, 0, xf)
        start = max(0, pos - (xf // 2 if i else 0))
        e = min(len(out), start + len(part))
        out[start:e] += part[: e - start] * g[: e - start, None]
        pos += int(secs * SR)
    out = out[:total]
    fade_in, fade_out = int(1.5 * SR), int(2.5 * SR)
    g = np.ones(total)
    g[:fade_in] = np.linspace(0, 1, fade_in)
    g[-fade_out:] = np.linspace(1, 0, fade_out)
    out *= g[:, None]
    out /= max(1e-6, np.abs(out).max()) / 0.8
    return out


def write_wav(path, audio):
    data = (np.clip(audio, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("seconds", type=float)
    ap.add_argument("--mood", default="tense", choices=sorted(MOODS))
    ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args()
    write_wav(a.out, render(a.seconds, a.seed, a.mood))


if __name__ == "__main__":
    main()
