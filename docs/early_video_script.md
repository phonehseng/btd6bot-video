# Video script: "Teaching Python to play Bloons TD 6"

How the bot sees, thinks and clicks, using Python and OpenCV. About 8 minutes.
Each scene has the **narration** (VO) and what is **on screen**. Image files
named below exist in the repo (`docs/screens/`) or are produced by the bot
(`logs/`); copy the ones you use into a video folder.

---

## 1. Cold open (0:00–0:20)

**On screen:** the bot playing at 2x speed. The pane beside the chat reads
"● Running · Hard 4/88"; a tower is placed by an invisible hand.

**VO:** "Nobody is touching this keyboard. This is a Python program playing
Bloons TD 6. It reads the screen, decides what to build, and clicks, around
the clock. Here is how it works, piece by piece."

## 2. The loop (0:20–0:50)

**On screen:** a simple diagram: *Screen → See → Decide → Act → Screen*.

**VO:** "Every program like this is one loop: take a picture of the game,
understand it, decide, and send a mouse click. Python glues the pieces
together; OpenCV and NumPy do the seeing."

## 3. Taking the picture (0:50–1:20)

**On screen:** `btd6bot/screen.py`, the `PrintWindow` call. Then another
window covering the game while the captured image stays clean.

**VO:** "Most screen grabs copy whatever is on top. We ask Windows to paint
the game window into memory with PrintWindow, so other windows can sit on
top and the bot still sees the game. The result is a NumPy array: 1920 by
1200 pixels, three colour channels. Every later step is maths on that array."

## 4. Reading numbers: OCR (1:20–2:10)

**On screen:** the HUD crop (`$8,475`, lives, `Round 22/80`), then the text
the OCR returned.

**VO:** "Cash, lives and the round counter are text. We crop those regions
with plain array slicing and hand them to RapidOCR, a small neural network
running on the CPU in about ten milliseconds. Reading isn't trusting, though.
Halloween pumpkins next to the counter once turned six hundred and fifty
dollars into six thousand five hundred and seven. So the bot checks the format
the game always uses: thousands have commas, so a four-digit number without
one can't be real. It also takes the median of several reads, because one
frame can lie."

## 5. Knowing which screen it's on (2:10–2:40)

**On screen:** main menu, map select, defeat screen, each with its keywords
highlighted.

**VO:** "To know where it is, the bot reads every word on screen and matches
sets of keywords: PLAY, MONKEYS and HEROES together mean the main menu.
Words survive seasonal art changes; a pixel template of a Halloween menu
would not. A rule we learned the hard way: the word 'defeat' on a tower panel
isn't a defeat. The lives counter has to agree."

## 6. Colour as information (2:40–3:40)

**On screen:** `docs/screens/mapselect_all.png` with the 14 medal sample
points drawn; then the red "!" badge on the achievements ribbon.

**VO:** "OpenCV's HSV colour space separates *which* colour from *how
bright*. That makes simple, reliable tests. A medal slot is earned when its
patch holds enough of the medal's colour: green, purple, blue or gold.
The bot reads all fourteen medals on every map card in one pass. The red
'!' badge the game puts on a button is just a small patch of saturated red
with a little white. No machine learning needed, just counting pixels that
pass a threshold."

## 7. Seeing bloons move (3:40–4:50)

**On screen:** `logs/sb_view.png` (frame, then mask); the noisy first attempt
with cloud shadows and bats; then the clean Monkey Meadow track
(`logs/meadow_new.png`).

**VO:** "To learn where bloons travel, the bot opens Sandbox, where nothing
can be lost, and watches. The first version compared frames and lit up
anything that moved. On Monkey Meadow that included drifting cloud shadows,
and in October, flying bats. The fix was a little physics:
- divide each pixel by its brightness, which leaves pure colour, so a shadow
  changes nothing and a bloon changes everything;
- keep a background that slowly follows the scene, so water that pulses gets
  absorbed;
- look only for the colours of the bloons it actually sent: yellow when round
  17 is all yellow bloons.
OpenCV's morphology removes single-pixel noise. What's left is the path."

## 8. Reading the game's own map files (4:50–6:00)

**On screen:** UnityPy listing a map bundle; the extracted path drawn over
Tree Stump (`logs/paths_check.png`); then the placement grid
(`logs/ts_valid.png`: red blocked, green where a dart fits).

**VO:** "Watching works, but the game already knows its maps. With UnityPy,
a Python library for Unity files, the bot reads each map's exact track and
every placement area, from read-only copies of the game files. It does this
for every map, including ones added after the bot was written. The paths come
in three shapes: straight lines, Bézier chains and cubic splines. Get the
shape wrong and the track lands in the wrong place, so the bot rebuilds each
one the way the game's own code does. Then OpenCV draws the polygons into a
grid, cuts out the holes, and a distance transform answers the real
question: where does *this* tower's footprint fit without touching track,
water or another tower?"

## 9. Choosing a spot (6:00–6:50)

**On screen:** the heat map (track weighted by how far along it is), a
range-circle filter sliding over it, the best cells lighting up; then
line-of-sight rays from a spot, blocked by a wall.

**VO:** "A good spot covers lots of track. OpenCV's filter2D slides the
tower's range circle across the whole map at once and adds up the track
underneath. Track that other towers already cover counts less, so defences
spread across lanes. For towers that can't see through walls, the bot casts
straight lines from the best candidates to every track cell in range and
counts only what it can actually see."

## 10. Deciding and acting (6:50–7:30)

**On screen:** a strategy YAML file (roles like `dps`, `support`); the
planner line "NEXT: Logs / medium …"; mouse clicks landing.

**VO:** "What to build comes from small plan files that say *roles*, not
coordinates: a damage tower near the start, a support tower near it. The
planner picks the next map and mode by expected rewards per minute. Clicks
go out through Windows' SendInput, but only after checking the game is in
front, and the Escape key is never sent at all."

## 11. Running alone (7:30–8:00)

**On screen:** the status overlay strip, the progress pane, the GitHub
commit history scrolling.

**VO:** "A supervisor restarts the bot if it stops, a watchdog catches hangs,
and every lesson goes back into the code. Python for the glue, OpenCV for the
eyes, and a lot of patience for the bats."

---

### Production notes
- Turn on the status overlay (`tools/overlay.py`) for live captions of what
  the bot is doing.
- Every image in this script came from the bot's own debugging. Regenerate
  them with the commands in the commit history if you need higher resolution.
