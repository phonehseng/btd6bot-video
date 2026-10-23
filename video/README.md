# Pop Theory - the explainer video

(The scripts live in `video/`; see the repository README for setup.)

A long video and three vertical shorts about the bot: a Python script that
plays an unmodded game by scanning the screen with OpenCV, and decides with
rules taken from the game's own data. The long video tells the story from
version one to the night shift, with on-screen text (no voice) and music
that follows its chapters; its text with real timestamps is generated into
`TEXT_long.md`. The shorts have a voice-over (Piper, offline) and music.
Footage keeps the game's own sound where it was recorded (`btd6bot/gameaudio.py`).

| File | What it does |
| --- | --- |
| `studio.html`, `engine.js`, `scenes.js`, `comps.js` | the animation: every frame is a pure function of time |
| `prep_assets.py` | real data for the animations, made with the bot's own code (OCR, masks, map geometry, damage model) |
| `render.py` | footage clips -> frames, then headless Edge -> ffmpeg -> mp4 |
| `review.py` | a contact sheet with one still per scene |
| `contact.py` | a contact sheet of recording chunks, to pick footage |
| `export_script.py` | the voice-over script, from the captions |
| `paths.py` | where inputs and outputs live (outside OneDrive) |

```
python video/prep_assets.py
python video/render.py long short1 short2 short3 short4
```

Footage is the bot's own desktop recording (`btd6bot/recorder.py`); the
chunks used are saved under `~/Videos/BTD6 Bot/Explainer/footage/raw`,
because the recorder keeps only the last 4 hours. Videos are written to
`~/Videos/BTD6 Bot/Explainer/`. Rendering needs Playwright (`pip install
playwright`) and uses the installed Microsoft Edge; it runs at idle CPU
priority so a game on the same PC is not slowed down.

Open `studio.html?comp=long&build=file:///C:/Users/<you>/Videos/BTD6%20Bot/Explainer/build/`
in a browser to preview it in real time.
