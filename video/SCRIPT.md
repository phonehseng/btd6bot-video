# Pop Theory - a lecture in eight parts

(The first outline. The video follows video/comps.js; TEXT_long.md
has the final text with real timestamps.)

Explainer video and shorts about btd6bot: a Python program that plays Bloons
TD 6 by itself, by looking at the screen with OpenCV and deciding with rules
taken from the game's own data.

* Long video: `Pop Theory.mp4`, 1920x1080, 30 fps, about 5 minutes. No voice
  track: the subtitles carry the lecture; this file doubles as the voice-over
  script (read at ~150 words a minute, each block ends before the next).
* Shorts: four vertical videos, 1080x1920, 35-50 s each, built from the same
  scenes (see "Shorts" at the end).
* All game footage is the bot playing the real game, recorded by the bot's
  own recorder (`btd6bot/recorder.py`, ffmpeg desktop capture). Nothing is
  staged. Sped-up footage says so on screen.
* Rendered by `video/render.py` from `video/studio.html`: every frame is a
  pure function of time, captured from a headless browser and encoded with
  ffmpeg.

---

## Cold open

**0:00 - Nobody is touching the mouse** *(footage: a Hard game at x4)*

> It's three in the morning. This game of Bloons TD 6 is on Hard, round
> seventy-something, and nobody is at the desk. Every click you see is made
> by a Python program.

**0:12 - Title**

> Good evening. Tonight's lecture: Pop Theory. How a deterministic script
> learned to see a tower-defence game, and what it got wrong first.

## Part 1 - The machine

**0:20 - See, think, act** *(diagram: the loop)*

> The bot is a loop. See: grab the game window, sixty times a second if it
> wants to. Think: turn pixels into numbers, numbers into a decision. Act:
> move the mouse, press a hotkey. Then do it again. Forty-eight Python
> modules, about twenty-one thousand lines, a hundred and forty-four commits
> in three days.

**0:40 - The tools**

> The stack is small. mss and Win32 PrintWindow to grab the window. NumPy to
> hold it. OpenCV to cut, threshold and measure it. RapidOCR, a small ONNX
> text reader, for the numbers. And pydirectinput for the hands.

## Part 2 - The first attempt

**0:55 - It learned by touching** *(animation: a monkey hovered over the map,
its range circle turning red)*

> The first version, on day one, knew nothing about the maps. To find out
> where a tower could stand, it held one over the map and looked at the range
> circle: red means no. To find the track it watched bloons go by and drew a
> heat map of where they had been.

**1:15 - Why it failed** *(cards)*

> It mostly worked, which is the dangerous kind of wrong. Red monkeys made it
> think valid spots were blocked. A refused spot was retried forever. The OCR
> read round eleven as seven hundred and eleven. The word "defeat" in an
> upgrade panel made it quit three games it was winning with full lives. A
> Victory screen hid behind a stuck round counter for four minutes while it
> kept clicking. One night it clicked the same screen for four point seven
> hours.

**1:40 - The first night** *(footage: the losses montage)*

> The first night it lost twelve games between one and half past five in
> the morning. Every loss was a lesson, and every lesson became a rule.

## Part 3 - How it sees

**1:55 - A frame is an array** *(animation: the screen dissolving into numbers)*

> To OpenCV the game is an array of bytes: height, width and three colour
> channels. Everything the bot knows starts here.

**2:05 - Reading the money** *(animation: crop -> HSV mask -> OCR -> $1,106)*

> The money in the corner is white digits with a dark outline. The bot crops
> that box, converts it to HSV, keeps only bright low-saturation pixels with
> inRange, and hands the strip to the OCR's recognizer alone - no detection,
> no rotation - thirty milliseconds a read. Then it distrusts the answer: cash
> is the lower median of three reads, because OCR invents digits, never
> removes them.

**2:30 - Trust, but vote** *(animation: round counter votes)*

> The round counter only moves forward, one or two at a time. A reading
> outside that needs four agreeing reads; a big jump needs fifteen. Lives are
> tracked the same way. A number on screen is evidence, not truth.

**2:45 - Where am I?** *(animation: words on a menu)*

> Menus are read as words. "Victory", "Map select", "Hard" - the set of words
> on screen says which screen this is. Some words are forbidden: Store,
> Purchase, Unlock All. The bot will never click a button that spends real
> money.

## Part 4 - The map is a file

**3:00 - Reverse engineering** *(animation: game files -> polygons)*

> Version two stopped guessing. A copy of the game's data was decompiled
> offline - never the running game, never a mod - and every map came out as
> geometry: the track as a path, the ground as polygons marked land, water or
> blocked, and the map's events.

**3:20 - From polygons to legal spots** *(the bot's view: decoded grids)*

> Polygons become a grid. A distance transform gives every cell its distance
> to the nearest wall, and a tower may stand where that distance is at least
> its footprint. The bot now knows, before its first click, every spot the
> game will accept.

**3:40 - Covered Garden** *(birds-eye animation: four panes, the open one
moving clockwise)*

> Some maps move. Covered Garden has four glass panes; one is open each round,
> bottom-left on round one, then clockwise. The game's event list said so -
> a CycleAreasAction over four areas - and the bot builds under a pane only on
> its round, and upgrades a tower there only when its pane comes back.

## Part 5 - How it thinks

**4:00 - Every round is known** *(animation: the round calendar)*

> Bloons TD rounds are fixed. The decompiled round data says which bloons
> come in which round: camo at twenty-four, lead at twenty-eight, the first
> MOAB at forty. So the bot keeps a threat calendar: each threat needs an
> answer bought before it arrives.

**4:20 - The damage model** *(animation: margin bars per round)*

> Then it does the maths. Each tower's damage per second comes from the game's
> stats, each round's demand from its bloons' health and speed along this
> map's track. Margin is defence over demand. Above two is comfortable. Below
> one, something leaks.

**4:40 - Round sixty-three** *(footage: Pat's Pond loss)*

> Pat's Pond, Hard, round sixty-three: the model said 1.35, and the game
> agreed - it lost. Now, when the model rates the coming rounds weak, the bot
> spends on whatever raises those margins most per dollar, before the round
> arrives.

**5:00 - Watching the track** *(the bot's view: bloon detections)*

> And it watches. Five times a second during a round, the bot finds bloons
> on the track and measures how far along the route the furthest one got.
> In CHIMPS one bloon past the end is a loss, so "how deep" matters more than
> "how many".

## Part 6 - How it chooses

**5:20 - The planner** *(animation: the medal board)*

> Between games a planner scores every medal it hasn't won: chance of
> winning, minutes, experience and Monkey Money per minute. It never replays
> a beaten map. It works through Hard first, one medal at a time across every
> map, and it never pays to continue.

## Part 7 - Hurdles

**5:40 - Things that went wrong this week** *(cards over footage)*

> A chat window popped up over the game and the bot clicked into it - now it
> refuses to click through anything and simply waits. The bot sat on a
> Victory screen for twenty-five minutes with a silent log - now it writes
> where it is every minute. It won a game and was restarted before writing
> it down, so it played the map again - now a Victory screen is always
> credited. Each fix is a test in the repository.

## Part 8 - Results

**6:10 - The scoreboard**

> A hundred and fourteen games, ninety-one wins, three hundred and eighty-six
> medals, player level one-thirty, and every decision a rule you can read.
> Nothing in it learned by trial and error at run time. It was reasoned out
> of the game's own files.

**6:30 - Close** *(footage: a Victory screen)*

> That's the lecture. Class dismissed - the bot has a round to play.

---

## Shorts

Each short is 7-8 cards of about 5 seconds, vertical, in the same style.

1. **It never looked twice** - the first attempt: red circles, refused spots,
   "711", the word "defeat", the 4-minute Victory screen, 13 losses in a
   night, then: read the game's files instead.
2. **How a bot reads $1,106** - array, crop, HSV mask, OCR, lower median of
   three, round votes, forbidden words.
3. **The map is a file** - decompiled polygons, distance transform, legal
   spots, Covered Garden's moving panes.
4. **Round 63** - fixed rounds, threat calendar, damage model margins, the
   Pat's Pond loss, reinforcement, the bloon watch, never lose.
