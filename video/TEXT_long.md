# On-screen text: long (7:35)

Generated from video/comps.js by video/export_script.py. Each block starts at its
timestamp and should end before the next; read at about 150 words a minute.

### 0:00 - Nobody is playing? (17 s)

*[What if...; on screen: footage `party`]*

> The middle of the night. Bloons TD 6 on Hard, round seventy-five, and nobody is at the desk.
> No mods in the game, no AI in the program: a Python script is reading the screen and playing.

### 0:17 - Pop Theory (10 s)

*[From zero to 94 wins; on screen: animation `lineup`]*

> Three days ago it couldn't tell a monkey from a wall. This is how it got here - mistakes included.

### 0:27 - See. Think. Act. (16.5 s)

*[Part 1 - Day one; on screen: animation `loop`]*

> The idea is simple. See: capture the game window. Think: turn pixels into numbers, numbers into a decision. Act: move the mouse.
> No access to the game's memory, no mods. Only what a player can see.

### 0:43 - The toolbox (11 s)

*[Part 1 - Day one; on screen: animation `stack`]*

> Screen capture, NumPy and OpenCV to see; a small OCR model to read digits; plain Python rules to decide; simulated input to act.

### 0:54 - It learned by touching (13 s)

*[Part 1 - Day one; on screen: animation `probe`]*

> Version one knew nothing about the maps. To find where a tower could stand, it held one over each spot and read the range circle: red meant no.

### 1:07 - Its whole map (13.5 s)

*[Part 1 - Day one; on screen: animation `evidence`]*

> To find the track, it painted every pixel where it had seen a bloon pass.
> These heat maps were everything it knew about eight maps. Gaps, smears and guesses.

### 1:21 - Mostly worked (23 s)

*[Part 2 - Rock bottom; on screen: animation `fails`]*

> It mostly worked, which is the dangerous kind of wrong.
> A red monkey looked like a refused spot. Round eleven read as seven hundred and eleven. The word 'defeat' in an upgrade panel made it quit games it was winning.
> One night it clicked the same screen for four point seven hours.

### 1:44 - The first night (11.5 s)

*[Part 2 - Rock bottom; on screen: animation `night`]*

> Then the first real night: twelve losses between one and half past five in the morning.
> Something had to change. Guessing was the problem.

### 1:55 - Read the files (19.5 s)

*[Part 3 - Reading the game; on screen: animation `decompile`]*

> So version two stopped guessing. A copy of the game's data was decompiled offline - never the running game, never a mod.
> Every map came out as exact geometry: the track as a path, the ground as polygons, and the map's own events.

### 2:15 - Off the track (12 s)

*[Part 3 - Reading the game; on screen: animation `evidence`]*

> The first time the decoded track was drawn over the real game, it missed. The game's camera is tilted: height pulls everything up the screen.

### 2:27 - On the track (9 s)

*[Part 3 - Reading the game; on screen: animation `evidence`]*

> Fitting the projection against the screen fixed it: the line now runs through every bloon.

### 2:36 - Every map, decoded (10 s)

*[Part 3 - Reading the game; on screen: animation `evidence`]*

> Every map became a grid the bot can search: track, land, water and walls.

### 2:46 - Legal spots (13.5 s)

*[Part 3 - Reading the game; on screen: animation `dist`]*

> One OpenCV call gives each cell its distance to the nearest wall. A tower fits where that distance beats its footprint.
> Every legal spot, known before the first click.

### 2:59 - A frame is an array (9 s)

*[Part 4 - Learning to see; on screen: animation `array`]*

> To OpenCV, the game is an array of bytes. These are the real pixels of the money counter.

### 3:08 - Reading the money (14 s)

*[Part 4 - Learning to see; on screen: animation `cash`]*

> Crop the box, run the text recogniser on that strip alone: thirty milliseconds.
> Then doubt it: three reads, keep the lower median. OCR invents digits; it never drops real ones.

### 3:22 - Never 711 again (10 s)

*[Part 4 - Learning to see; on screen: animation `code`]*

> The '711' bug became a rule: rounds only go forward, and a big jump needs fifteen agreeing reads.

### 3:32 - A screen is words (12 s)

*[Part 4 - Learning to see; on screen: animation `menu`]*

> Menus are read as words. 'IVIGTORY' is close enough to victory.
> Some words are forbidden: Store, Purchase, Unlock All, Continue. Those buttons are never clicked.

### 3:44 - Ask the lives (10 s)

*[Part 4 - Learning to see; on screen: animation `code`]*

> And the word that made it quit winning games? A defeat now only counts if the lives counter agrees.

### 3:54 - How deep? (14.5 s)

*[Part 4 - Learning to see; on screen: animation `watch`]*

> During a round it finds bloons on the track five times a second, and measures how far the furthest one got.
> This is its own debug frame: boxes and confidence scores.

### 4:09 - Every round is known (15.5 s)

*[Part 5 - Thinking ahead; on screen: animation `calendar`]*

> Bloons rounds are fixed, and the round data came out of the files too: camo at twenty-four, lead at twenty-eight, the first MOAB at forty.
> Each threat gets its answer bought before it arrives.

### 4:24 - The damage model (18 s)

*[Part 5 - Thinking ahead; on screen: animation `margins`]*

> Then the maths: each tower's damage per second against each round's bloons, along this map's track.
> This is a real defence the bot lost with on Water Park. The model saw it failing ten rounds before the game ended.

### 4:42 - Spend where it counts (11 s)

*[Part 5 - Thinking ahead; on screen: animation `reinforce`]*

> So now, when a coming round rates weak, it buys whatever raises that round's margin most per dollar - before the bloons arrive.

### 4:53 - Still wrong sometimes (13 s)

*[Part 6 - Setbacks; on screen: footage `rush`]*

> It still loses. Alternate Bloons Rounds shuffle the round data the model was built on: a ceramic train it didn't expect, and defeat at round twenty-seven.

### 5:06 - A window in the way (11 s)

*[Part 6 - Setbacks; on screen: footage `popup`]*

> Mid-round, a window popped up over the game. A click there would have landed in another program.

### 5:17 - Look first (9 s)

*[Part 6 - Setbacks; on screen: animation `code`]*

> Now every click checks that the pixel belongs to the game first. If it doesn't, the bot waits.

### 5:26 - Twenty-five minutes (11 s)

*[Part 6 - Setbacks; on screen: footage `hang`]*

> It won this game - and then stared at its own Victory screen for twenty-five minutes with a silent log.

### 5:37 - Never lose a win (9 s)

*[Part 6 - Setbacks; on screen: animation `code`]*

> Now it writes down where it is every minute, and a Victory screen is always credited.

### 5:46 - Never pay to continue (12 s)

*[Part 6 - Setbacks; on screen: footage `lotus`]*

> And when it loses, it loses: a paid continue is a forbidden button. Each loss becomes a rule instead.

### 5:58 - It picks (15.5 s)

*[Part 7 - The night shift; on screen: animation `planner`]*

> Between games it scores every medal it hasn't won - chance to win, minutes, experience per minute - and picks the next one itself.
> Hard first, one medal at a time across every map.

### 6:14 - First try (14 s)

*[Part 7 - The night shift; on screen: footage `parkPlace`]*

> Then it opens the map and builds. Every tower lands on a spot the game accepts, and every click is in the log - here in sync with the game.

### 6:28 - One whole game (41 s)

*[Part 7 - The night shift; on screen: footage `fullgame`]*

> One whole game, Park Path on Alternate Bloons Rounds - the mode that beat it an hour earlier - eleven minutes in forty seconds.
> The defence goes up at once, the plan is bought as cash comes in, the model checks every coming round, the watch sees nothing get deep.
> Round eighty. No lives lost.

### 7:09 - Three days later (13 s)

*[Part 7 - The night shift; on screen: animation `score`]*

> A hundred and eighteen games: ninety-four wins, three hundred and eighty-nine medals, player level one-thirty.
> Every one of the twenty-three losses became a rule it now follows.

### 7:22 - Pop Theory (13 s)

*[Class dismissed; on screen: animation `outro`]*

> From a script that couldn't tell a monkey from a wall, to the night shift. No mods, no AI - just pixels, OpenCV, and rules you can read.

