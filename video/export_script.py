"""Write the on-screen text (and voice lines) of a composition with the real
timestamps, so the script always matches the rendered video.

    python video/export_script.py long > video/TEXT_long.md
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from video.render import page_for   # noqa: E402


def stamp(t):
    return f"{int(t // 60)}:{int(t % 60):02d}"


def main():
    comp = sys.argv[1] if len(sys.argv) > 1 else "long"
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        browser, page = page_for(pw, comp)
        scenes = page.evaluate("COMP.scenes.map((s) => ({t0: s.t0, d: s.d, label: s.label, title: s.title, "
                               "kind: s.kind, clip: s.clip || null, caps: s.caps || (s.body ? [s.body] : [])}))")
        total = page.evaluate("COMP.duration")
        browser.close()
    print(f"# On-screen text: {comp} ({stamp(total)})\n")
    print("Generated from video/comps.js by video/export_script.py. Each block starts at its")
    print("timestamp and should end before the next; read at about 150 words a minute.\n")
    for s in scenes:
        shown = f"footage `{s['clip']}`" if s["clip"] else f"animation `{s['kind']}`"
        print(f"### {stamp(s['t0'])} - {s['title']} ({s['d']:g} s)\n")
        print(f"*[{s['label']}; on screen: {shown}]*\n")
        for c in s["caps"]:
            print(f"> {c}")
        print()


if __name__ == "__main__":
    main()
