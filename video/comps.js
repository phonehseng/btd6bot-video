// Pop Theory - what is shown when. The long video and the four shorts share
// the scene kinds of scenes.js; the text follows video/SCRIPT.md.

// Footage: whole 1-minute recording chunks (video/paths.py RAW) joined, then
// [start, start + dur) seconds of that, sped up `speed` times, as frames.
const FOOTAGE = {
  party:  { chunks: ["002149", "002249"], start: 0, dur: 64, speed: 4 },     // Party Parade Hard, rounds 75-80
  partyEnd: { chunks: ["002249"], start: 36, dur: 12, speed: 1 },          // ...and its DEFEAT at round 80
  rush:   { chunks: ["023149", "023249"], start: 36, dur: 32, speed: 2 },    // Bloonarius Prime ABR: the rush, DEFEAT r27
  popup:  { chunks: ["023149"], start: 2, dur: 22, speed: 1 },               // a window over the game, mid-round
  hang:   { chunks: ["014449", "014549", "014649", "014749", "014849", "014949", "015049", "015149", "015249", "015349", "015449", "015549"],
            start: 0, dur: 719, speed: 36 },                                // 12 minutes on one Victory screen
  garden: { chunks: ["021849", "021949"], start: 0, dur: 119, speed: 6 },    // Covered Garden Easy: the panes turning
  lotus:  { chunks: ["025849", "025949"], start: 30, dur: 34, speed: 2 },    // DEFEAT, "Continue?" - Cancel
  win:    { chunks: ["025749"], start: 0, dur: 7, speed: 1 },                // Park Path Hard: VICTORY
  // the bot building its defence: its log lines are shown in sync (prep_assets LOG_WINDOWS)
  karts:     { chunks: ["020849", "020949"], start: 55, dur: 60, speed: 1.5 },   // 02:09:44, Karts N Darts Easy
  cgPlace:   { chunks: ["021749", "021849"], start: 8, dur: 32, speed: 1.5 },    // 02:17:57, Covered Garden Easy
  parkPlace: { chunks: ["024649", "024749"], start: 9, dur: 30, speed: 1.5 },    // 02:46:58, Park Path ABR
  // one whole game: Park Path ABR, 02:46:59 - 02:57:49 (round 22 to 80, Fast Track)
  fullgame: { chunks: ["024549", "024649", "024749", "024849", "024949", "025049", "025149", "025249", "025349", "025449",
            "025549", "025649", "025749"], start: 70, dur: 655, speed: 16 },
};

const BRAND = "BTD6.AUTOMATIONS";

// ---------------------------------------------------------------- the long video
// ---------------------------------------------------------------- the long video
// A zero-to-hero story without a voice: the text carries it, the music
// follows the chapters (each scene's `mood`, see video/music.py MOODS).
const CODE = {
  defeat: ["def _real_end(self, st, frame):", "    # 'defeat' can appear in an upgrade panel", "    if st != \"defeat\":", "        return True",
    "    lives = self.g.hud.lives(frame)", "    if lives and lives > 0:", "        return False   # the lives say otherwise", "    return True"],
  votes: ["# rounds only go forward", "if last < rnd <= last + 2:", "    last = rnd", "elif rnd != last:", "    votes = votes + 1 if rnd == cand else 1",
    "    big = abs(rnd - last) > 3      # '11' -> '711'", "    if votes >= (15 if big else 4):", "        last = rnd"],
  window: ["def guard_point(self, fx, fy):", "    # never click through another window", "    self.guard()", "    if not self.screen.owns_point(fx, fy):",
    "        self._wait_for(game_is_back)"],
  victory: ["# a Victory screen with a game still noted", "elif st == \"victory\":", "    self._credit_unfinished_win()", "    self.menus.leave_victory()"],
};
const LONG = {
  w: 1920, h: 1080, layout: "wide",
  scenes: [
    // ------------------------------------------------ cold open
    { kind: "footage", clip: "party", speed: 4, d: 13, mood: "tense", label: "What if...", title: "Nobody is playing?",
      box: { kicker: "LIVE  10/23  00:21", big: "3 AM", sub: "Party Parade - Hard" }, stat: { label: "HANDS ON THE MOUSE", value: "0" },
      caps: ["The middle of the night. Bloons TD 6 on Hard, round seventy-five, and nobody is at the desk.",
        "No mods in the game, no AI in the program: a Python script is reading the screen and playing."] },
    { kind: "lineup", d: 8, mood: "tense", label: "From zero to 94 wins", title: "Pop Theory",
      box: { kicker: "A STORY IN SEVEN PARTS", big: "Pop Theory", sub: "Python + OpenCV vs. Bloons" },
      caps: ["Three days ago it couldn't tell a monkey from a wall. This is how it got here - mistakes included."] },

    // ------------------------------------------------ 1. day one
    { kind: "loop", d: 12, mood: "curious", label: "Part 1 - Day one", title: "See. Think. Act.", chips: ["Python", "OpenCV", "no mods", "no AI"],
      box: { kicker: "THE LOOP", big: "while True:", sub: "see -> think -> act" },
      caps: ["The idea is simple. See: capture the game window. Think: turn pixels into numbers, numbers into a decision. Act: move the mouse.",
        "No access to the game's memory, no mods. Only what a player can see."] },
    { kind: "stack", d: 9, mood: "curious", label: "Part 1 - Day one", title: "The toolbox",
      box: { kicker: "PIP INSTALL", big: "6 tools", sub: "no machine learning deciding" },
      caps: ["Screen capture, NumPy and OpenCV to see; a small OCR model to read digits; plain Python rules to decide; simulated input to act."] },
    { kind: "probe", d: 11, mood: "curious", label: "Part 1 - Day one", title: "It learned by touching",
      box: { kicker: "FIRST COMMIT  10/21", big: "map learner", sub: "hover, look, guess" },
      caps: ["Version one knew nothing about the maps. To find where a tower could stand, it held one over each spot and read the range circle: red meant no."] },
    { kind: "evidence", img: "models.png", tag: "logs/models.png  - version one", stamp: "PATCHY", d: 10, mood: "curious",
      label: "Part 1 - Day one", title: "Its whole map", box: { kicker: "MAP LEARNER", big: "heat map", sub: "learned by watching" },
      caps: ["To find the track, it painted every pixel where it had seen a bloon pass.",
        "These heat maps were everything it knew about eight maps. Gaps, smears and guesses."] },

    // ------------------------------------------------ 2. rock bottom
    { kind: "fails", d: 14, mood: "dark", label: "Part 2 - Rock bottom", title: "Mostly worked",
      box: { kicker: "BUG REPORT", big: "Day one", sub: "the dangerous kind of wrong" },
      items: [["Red monkeys", "a red tower sprite read as a red, refused circle", "WRONG"],
        ["Refused spots, forever", "the same rejected spot retried in a loop", "LOOP"],
        ['Round "11" -> "711"', "one OCR misread, and the threat calendar jumped ahead", "MISREAD"],
        ['"Defeat" in a panel', "quit three games it was winning, all lives left", "QUIT"],
        ["A Victory screen, missed", "stuck round counter: 4 minutes of clicks on it", "4 MIN"],
        ["4.7 hours", "one night, clicking the same screen", "STUCK"]], step: 1.6,
      caps: ["It mostly worked, which is the dangerous kind of wrong.",
        "A red monkey looked like a refused spot. Round eleven read as seven hundred and eleven. The word 'defeat' in an upgrade panel made it quit games it was winning.",
        "One night it clicked the same screen for four point seven hours."] },
    { kind: "night", d: 11, mood: "dark", label: "Part 2 - Rock bottom", title: "The first night",
      box: { kicker: "RESULTS.JSONL  10/22", big: "01:00 - 05:30", sub: "Medium and Hard" },
      losses: [["01:11", "Ancient Portal", "Medium", 54], ["01:17", "Logs", "Medium", 4], ["01:39", "Tree Stump", "Medium", 59],
        ["01:57", "Logs", "Medium", 30], ["04:03", "Luminous Cove", "Hard", 49], ["04:26", "Pat's Pond", "Hard", 40],
        ["04:29", "Dark Path", "Hard", 25], ["04:31", "Last Resort", "Hard", 24], ["04:40", "Enchanted Glade", "Hard", 63],
        ["04:59", "Party Parade", "Hard", 57], ["05:05", "Castle Revenge", "Hard", 46], ["05:17", "Covered Garden", "Hard", 76]],
      caps: ["Then the first real night: twelve losses between one and half past five in the morning.",
        "Something had to change. Guessing was the problem."] },

    // ------------------------------------------------ 3. reading the game
    { kind: "decompile", d: 12, mood: "discovery", label: "Part 3 - Reading the game", title: "Read the files",
      box: { kicker: "VERSION TWO", big: "no guessing", sub: "a copy, offline" },
      caps: ["So version two stopped guessing. A copy of the game's data was decompiled offline - never the running game, never a mod.",
        "Every map came out as exact geometry: the track as a path, the ground as polygons, and the map's own events."] },
    { kind: "evidence", img: "lc_overlay.png", tag: "logs/lc_overlay.png", stamp: "MISSED", d: 9, mood: "discovery",
      label: "Part 3 - Reading the game", title: "Off the track", box: { kicker: "LUMINOUS COVE", big: "misfit", sub: "first attempt" },
      caps: ["The first time the decoded track was drawn over the real game, it missed. The game's camera is tilted: height pulls everything up the screen."] },
    { kind: "evidence", img: "paths_check.png", crop: [0, 0.5, 0.86, 1], tag: "logs/paths_check.png", stamp: "FITTED", stampColor: C.green, d: 9, mood: "discovery",
      label: "Part 3 - Reading the game", title: "On the track", box: { kicker: "MONKEY MEADOW", big: "fitted", sub: "bloon for bloon" },
      caps: ["Fitting the projection against the screen fixed it: the line now runs through every bloon."] },
    { kind: "evidence", img: "geom_check.png", tag: "logs/geom_check.png", stamp: "DECODED", stampColor: C.amber, d: 10, mood: "discovery",
      label: "Part 3 - Reading the game", title: "Every map, decoded", box: { kicker: "91 MAPS", big: "grids", sub: "track, land, water, walls" },
      caps: ["Every map became a grid the bot can search: track, land, water and walls."] },
    { kind: "dist", d: 10, mood: "discovery", label: "Part 3 - Reading the game", title: "Legal spots",
      box: { kicker: "OPENCV", big: "distanceTransform", sub: "before the first click" },
      caps: ["One OpenCV call gives each cell its distance to the nearest wall. A tower fits where that distance beats its footprint.",
        "Every legal spot, known before the first click."] },

    // ------------------------------------------------ 4. learning to see
    { kind: "array", d: 9, mood: "tech", label: "Part 4 - Learning to see", title: "A frame is an array",
      box: { kicker: "NUMPY", big: "uint8", sub: "height x width x 3" },
      caps: ["To OpenCV, the game is an array of bytes. These are the real pixels of the money counter."] },
    { kind: "cash", d: 12, mood: "tech", label: "Part 4 - Learning to see", title: "Reading the money",
      box: { kicker: "HUD.PY", big: "$ in 30 ms", sub: "crop -> recognise -> doubt" },
      caps: ["Crop the box, run the text recogniser on that strip alone: thirty milliseconds.",
        "Then doubt it: three reads, keep the lower median. OCR invents digits; it never drops real ones."] },
    { kind: "code", file: "match.py", d: 10, hl: [5, 6], type: 1.8, mood: "tech", lines: CODE.votes,
      label: "Part 4 - Learning to see", title: "Never 711 again", box: { kicker: "PYTHON", big: "15 votes", sub: "a number is evidence" },
      caps: ["The '711' bug became a rule: rounds only go forward, and a big jump needs fifteen agreeing reads."] },
    { kind: "menu", d: 11, mood: "tech", label: "Part 4 - Learning to see", title: "A screen is words",
      box: { kicker: "MENUS.PY", big: "41 words", sub: "fuzzy, but safe" },
      caps: ["Menus are read as words. 'IVIGTORY' is close enough to victory.",
        "Some words are forbidden: Store, Purchase, Unlock All, Continue. Those buttons are never clicked."] },
    { kind: "code", file: "match.py", d: 10, hl: [5, 6], type: 1.8, mood: "tech", lines: CODE.defeat,
      label: "Part 4 - Learning to see", title: "Ask the lives", box: { kicker: "PYTHON", big: "if lives > 0", sub: "one word, one rule" },
      caps: ["And the word that made it quit winning games? A defeat now only counts if the lives counter agrees."] },
    { kind: "watch", d: 10, mood: "tech", label: "Part 4 - Learning to see", title: "How deep?",
      box: { kicker: "BLOONWATCH.PY", big: "5 Hz", sub: "how deep, not how many" },
      caps: ["During a round it finds bloons on the track five times a second, and measures how far the furthest one got.",
        "This is its own debug frame: boxes and confidence scores."] },

    // ------------------------------------------------ 5. thinking ahead
    { kind: "calendar", d: 11, mood: "build", label: "Part 5 - Thinking ahead", title: "Every round is known",
      box: { kicker: "ROUND DATA", big: "R1 -> R80", sub: "a threat calendar" },
      caps: ["Bloons rounds are fixed, and the round data came out of the files too: camo at twenty-four, lead at twenty-eight, the first MOAB at forty.",
        "Each threat gets its answer bought before it arrives."] },
    { kind: "margins", d: 12, mood: "build", label: "Part 5 - Thinking ahead", title: "The damage model",
      box: { kicker: "DPS_MODEL.PY", big: "margin", sub: "defence / demand" },
      caps: ["Then the maths: each tower's damage per second against each round's bloons, along this map's track.",
        "This is a real defence the bot lost with on Water Park. The model saw it failing ten rounds before the game ended."] },
    { kind: "reinforce", d: 10, mood: "build", label: "Part 5 - Thinking ahead", title: "Spend where it counts",
      box: { kicker: "REINFORCE.PY", big: "weak round", sub: "spend before it leaks" },
      caps: ["So now, when a coming round rates weak, it buys whatever raises that round's margin most per dollar - before the bloons arrive."] },

    // ------------------------------------------------ 6. setbacks
    { kind: "footage", clip: "rush", speed: 2, d: 13, mood: "dark", label: "Part 6 - Setbacks", title: "Still wrong sometimes",
      box: { kicker: "10/23  02:32", big: "DEFEAT", sub: "Bloonarius Prime - ABR" },
      notes: [[2, "Alternate Bloons Rounds: not the rounds it modelled", 9], [12.3, "round 27: defeat", 0, 0, C.red]],
      caps: ["It still loses. Alternate Bloons Rounds shuffle the round data the model was built on: a ceramic train it didn't expect, and defeat at round twenty-seven."] },
    { kind: "footage", clip: "popup", speed: 1, d: 11, mood: "dark", label: "Part 6 - Setbacks", title: "A window in the way",
      box: { kicker: "10/23  02:31", big: "popup", sub: "mid-round" },
      notes: [[6.5, "a window pops up over the game", 0, 0, C.red]],
      caps: ["Mid-round, a window popped up over the game. A click there would have landed in another program."] },
    { kind: "code", file: "inputs.py", d: 9, hl: [3, 4], type: 1.5, mood: "dark", lines: CODE.window,
      label: "Part 6 - Setbacks", title: "Look first", box: { kicker: "PYTHON", big: "owns_point", sub: "never click through" },
      caps: ["Now every click checks that the pixel belongs to the game first. If it doesn't, the bot waits."] },
    { kind: "footage", clip: "hang", speed: 36, d: 11, clock: ["01:44", 0.6], mood: "dark", label: "Part 6 - Setbacks", title: "Twenty-five minutes",
      box: { kicker: "10/23", big: "25 min", sub: "x36" },
      caps: ["It won this game - and then stared at its own Victory screen for twenty-five minutes with a silent log."] },
    { kind: "code", file: "runner.py", d: 9, hl: [2], type: 1.2, mood: "dark", lines: CODE.victory,
      label: "Part 6 - Setbacks", title: "Never lose a win", box: { kicker: "PYTHON", big: "credited", sub: "and stacks.txt" },
      caps: ["Now it writes down where it is every minute, and a Victory screen is always credited."] },
    { kind: "footage", clip: "lotus", speed: 2, d: 12, mood: "dark", label: "Part 6 - Setbacks", title: "Never pay to continue",
      box: { kicker: "MENUS.PY", big: "Cancel", sub: "a loss stays a loss" },
      notes: [[4.5, "Continue? costs Monkey Money", 9], [9, "-> Cancel. Every time.", 0, 0, C.green]],
      caps: ["And when it loses, it loses: a paid continue is a forbidden button. Each loss becomes a rule instead."] },

    // ------------------------------------------------ 7. the night shift
    { kind: "planner", d: 11, mood: "triumph", label: "Part 7 - The night shift", title: "It picks",
      box: { kicker: "PLANNER.PY", big: "p(win)", sub: "never a replay" },
      caps: ["Between games it scores every medal it hasn't won - chance to win, minutes, experience per minute - and picks the next one itself.",
        "Hard first, one medal at a time across every map."] },
    { kind: "footage", clip: "parkPlace", log: true, speed: 1.5, d: 12, mood: "triumph", label: "Part 7 - The night shift", title: "First try",
      box: { kicker: "BOT.LOG", big: "placed", sub: "x1.5" },
      caps: ["Then it opens the map and builds. Every tower lands on a spot the game accepts, and every click is in the log - here in sync with the game."] },
    { kind: "footage", clip: "fullgame", speed: 16, d: 41, mood: "triumph", label: "Part 7 - The night shift", title: "One whole game",
      box: { kicker: "10/23  02:47 - 02:58", big: "11 minutes", sub: "Park Path - ABR - x16" },
      notes: [[1, "round 22: Fast Track - the whole defence goes up first", 7], [9, "plan steps, then surplus into the strongest paths", 16],
        [18, "the damage model checks every coming round", 25], [27, "the bloon watch: nothing gets deep", 34], [38.5, "round 80: VICTORY", 0, 0, C.green]],
      caps: ["One whole game, Park Path on Alternate Bloons Rounds - the mode that beat it an hour earlier - eleven minutes in forty seconds.",
        "The defence goes up at once, the plan is bought as cash comes in, the model checks every coming round, the watch sees nothing get deep.",
        "Round eighty. No lives lost."] },
    { kind: "score", d: 11, mood: "triumph", label: "Part 7 - The night shift", title: "Three days later",
      stats: [["games", 118], ["wins", 94, C.green], ["medals", 389], ["player level", 130], ["losses", 23, C.red], ["test files", 41]],
      box: { kicker: "10/21 - 10/23", big: "3 days", sub: "one account, offline" },
      caps: ["A hundred and eighteen games: ninety-four wins, three hundred and eighty-nine medals, player level one-thirty.",
        "Every one of the twenty-three losses became a rule it now follows."] },
    { kind: "outro", d: 8, mood: "triumph", label: "Class dismissed", title: "Pop Theory",
      box: { kicker: "PYTHON + OPENCV", big: "btd6bot", sub: "no mods, no AI" },
      caps: ["From a script that couldn't tell a monkey from a wall, to the night shift. No mods, no AI - just pixels, OpenCV, and rules you can read."] },
  ],
  // the music: one section per run of scenes with the same mood
  moods() {
    const out = [];
    this.scenes.forEach((s) => {
      const m = s.mood || "tense";
      if (out.length && out[out.length - 1][1] === m) out[out.length - 1][0] += s.d;
      else out.push([s.d, m]);
    });
    return out;
  },
};

// ---------------------------------------------------------------- shorts
// Vertical, cut fast. Each scene has a voice line (`vo`, spoken by
// render.py's text-to-speech; the scene lasts as long as it takes to say it)
// and a caption (`body`) for people watching muted. Every short opens on a
// hook and ends on its answer.
const SHORT = (scenes) => ({ w: 1080, h: 1920, layout: "tall", scenes });
const FAILS = () => LONG.scenes.find((x) => x.kind === "fails").items;
const LOSSES = () => LONG.scenes.find((x) => x.kind === "night").losses;
const COMPS = {
  long: LONG,

  // ------------------------------------------------ 1: version one guessed, version two read the files
  short1: SHORT([
    { kind: "footage", clip: "party", d: 3, label: "Round 77 of 80", title: "Who is playing?", stat: { label: "HANDS ON THE MOUSE", value: "0" },
      body: "No mods. A Python script that scans the screen.", box: { kicker: "PARTY PARADE", big: "Hard", sub: "x4" },
      vo: "Nobody is touching the mouse, and the game has no mods. A Python script is scanning the screen, and playing." },
    { kind: "footage", clip: "karts", log: true, d: 3, label: "The evidence", title: "Every click, logged",
      body: "The bot's own log, in sync with the game.", box: { kicker: "BOT.LOG", big: "placed", sub: "x1.5" },
      vo: "Every tower it places, it writes down. Watch the log match the game." },
    { kind: "evidence", img: "models.png", tag: "logs/models.png  - version one", stamp: "PATCHY", d: 3,
      label: "Version one", title: "It guessed", body: "Its map: a heat map of wherever it had seen bloons go.",
      box: { kicker: "MAP LEARNER", big: "heat map", sub: "learned by watching" },
      vo: "Version one guessed. It painted wherever it had seen bloons go. This was its whole map." },
    { kind: "fails", step: 0.6, d: 3, label: "Version one", title: "It went wrong", items: FAILS().slice(0, 4),
      body: "11 read as 711. Quitting games it was winning.", box: { kicker: "BUG REPORT", big: "Day one", sub: "mostly worked" },
      vo: "It read round eleven as seven hundred and eleven, and quit games it was winning." },
    { kind: "decompile", d: 3, label: "Version two", title: "Read the files",
      body: "A copy of the game's data, decompiled offline: every map as polygons.", box: { kicker: "NO GUESSING", big: "map geometry", sub: "never the running game" },
      vo: "So version two read the game's own files. Every map, as exact polygons." },
    { kind: "evidence", img: "lc_overlay.png", tag: "logs/lc_overlay.png", stamp: "MISSED", d: 3,
      label: "First drawing", title: "Off the track", body: "The decoded track, drawn over the real game. Wrong.",
      box: { kicker: "LUMINOUS COVE", big: "misfit", sub: "a height offset" },
      vo: "Its first drawing of the track missed." },
    { kind: "evidence", img: "paths_check.png", crop: [0, 0.5, 0.86, 1], tag: "logs/paths_check.png", stamp: "FITTED", stampColor: C.green, d: 3,
      label: "Fitted", title: "On the track", body: "Fitted to the screen: the line runs through every bloon.",
      box: { kicker: "MONKEY MEADOW", big: "fitted", sub: "bloon for bloon" },
      vo: "Fitted, the line runs through every bloon." },
    { kind: "evidence", img: "geom_check.png", tag: "logs/geom_check.png", stamp: "DECODED", stampColor: C.amber, d: 3,
      label: "Version two", title: "Every map, decoded", body: "Track, land, water, walls: every legal spot known before the first click.",
      box: { kicker: "4 MAPS OF 91", big: "grids", sub: "from the game's files" },
      vo: "Every map decoded. Every legal spot known before the first click." },
    { kind: "footage", clip: "parkPlace", log: true, d: 3, label: "Now", title: "First try",
      body: "A whole defence in seconds.", box: { kicker: "PARK PATH", big: "ABR", sub: "x1.5" },
      vo: "Now a whole defence goes down in seconds." },
    { kind: "footage", clip: "fullgame", from: 36.5, d: 3, label: "Round 80", title: "Victory",
      body: "Round 80 of 80. No lives lost.", box: { kicker: "PARK PATH", big: "ABR", sub: "x16" },
      vo: "Round eighty. No lives lost." },
    { kind: "score", d: 3, stats: [["wins", 94, C.green], ["medals", 389], ["player level", 130]], label: "Three days later", title: "94 wins",
      body: "It stopped guessing the game, and started reading it.", box: { kicker: "10/21-10/23", big: "btd6bot", sub: "Python + OpenCV" },
      vo: "Ninety-four wins in three days. It stopped guessing, and started reading." },
  ]),

  // ------------------------------------------------ 2: there is no AI in this
  short2: SHORT([
    { kind: "footage", clip: "fullgame", from: 8, d: 3, label: "94 wins", title: "No AI inside", stat: { label: "NEURAL NETS DECIDING", value: "0" },
      body: "No ChatGPT, no machine learning making choices, no mods.", box: { kicker: "PARK PATH", big: "ABR", sub: "x16" },
      vo: "This bot has won ninety-four games of Bloons on its own. No A I. No mods." },
    { kind: "stack", d: 3, label: "What it is", title: "Python + OpenCV",
      body: "It scans the screen. No memory reading, no game files touched while it plays.", box: { kicker: "THE STACK", big: "if / else", sub: "21,000 lines" },
      vo: "It scans the screen with Python and Open C V, and follows plain rules. No memory reading, no chat bot." },
    { kind: "array", d: 3, label: "How it sees", title: "Pixels are numbers",
      body: "Every frame is an array. These are the real pixels of the money counter.", box: { kicker: "NUMPY", big: "uint8", sub: "30 frames a second" },
      vo: "It sees the game the way Open C V does: a grid of numbers." },
    { kind: "cash", d: 3, label: "How it reads", title: "$1,693",
      body: "The only neural net: a tiny text reader for digits.", box: { kicker: "RAPIDOCR", big: "30 ms", sub: "reads, never decides" },
      vo: "It cuts out the money and reads the digits, with a tiny text reader. That is its only neural net." },
    { kind: "decompile", d: 3, label: "How it knows the map", title: "From the files",
      body: "Every map's polygons, decompiled from a copy of the game's data.", box: { kicker: "REVERSE ENGINEERED", big: "map geometry", sub: "offline, never a mod" },
      vo: "Where to build comes from the game's own files, decompiled." },
    { kind: "calendar", d: 3, label: "How it knows the future", title: "Every round",
      body: "Camo at 24. Lead at 28. MOAB at 40.", box: { kicker: "ROUND DATA", big: "R1 -> R80", sub: "fixed, so known" },
      vo: "Every round is fixed, so it knows what's coming, and buys each answer before the bloons arrive." },
    { kind: "margins", from: 4, d: 3, label: "How it knows it will lose", title: "It saw it coming",
      body: "Damage per second vs the bloons, round by round: below 1 = leaks.", box: { kicker: "DPS MODEL", big: "R21 -> R38", sub: "a real loss" },
      vo: "It even does the maths on its own defence. It saw this loss coming ten rounds early." },
    { kind: "footage", clip: "karts", log: true, from: 3, d: 3, label: "Every decision", title: "Written down",
      body: "Every click is a rule, logged.", box: { kicker: "BOT.LOG", big: "in sync", sub: "x1.5" },
      vo: "Every click is a rule, and every rule is written down." },
    { kind: "footage", clip: "win", d: 3, label: "So", title: "No AI. Just rules.",
      body: "Python, OpenCV, and rules you can read.", box: { kicker: "PARK PATH", big: "Victory", sub: "round 80" },
      vo: "No A I. Just pixels, Open C V, and rules you can read." },
  ]),

  // ------------------------------------------------ 3: the night shift
  short3: SHORT([
    { kind: "footage", clip: "fullgame", from: 2, d: 3, label: "3 AM", title: "The night shift", stat: { label: "HOURS PLAYED", value: "6" },
      body: "Nobody told it what to play.", box: { kicker: "PARK PATH", big: "ABR", sub: "x16" },
      vo: "Three in the morning. Six hours in, and nobody told it what to play." },
    { kind: "planner", d: 3, label: "Between games", title: "It picks",
      body: "Every medal it hasn't won, scored: chance to win, minutes, XP per minute.", box: { kicker: "PLANNER.PY", big: "p(win)", sub: "never a replay" },
      vo: "Between games, it scores every medal it hasn't won yet, and picks the best next one itself." },
    { kind: "footage", clip: "parkPlace", log: true, d: 3, label: "Then", title: "It builds",
      body: "Opens the map, places the defence, logs every click.", box: { kicker: "BOT.LOG", big: "placed", sub: "x1.5" },
      vo: "It opens the map, scans the screen, builds the defence, and writes down every click." },
    { kind: "watch", d: 3, label: "During the round", title: "It watches",
      body: "How deep the furthest bloon got, 5 times a second.", box: { kicker: "OPENCV", big: "5 Hz", sub: "how deep, not how many" },
      vo: "During each round, it watches how far the bloons get, five times a second." },
    { kind: "reinforce", d: 3, label: "Before trouble", title: "It plans ahead",
      body: "A weak round coming? Buy what helps it most, per dollar.", box: { kicker: "DPS MODEL", big: "+0.31 / $1k", sub: "spend before it leaks" },
      vo: "If the maths says a coming round is weak, it spends where it helps most, before the bloons arrive." },
    { kind: "code", file: "match.py", d: 3, hl: [5, 6], type: 1.4,
      lines: ["def _real_end(self, st, frame):", "    # 'defeat' can appear in an upgrade panel", "    if st != \"defeat\":", "        return True",
        "    lives = self.g.hud.lives(frame)", "    if lives and lives > 0:", "        return False   # the lives say otherwise", "    return True"],
      label: "When it was wrong", title: "A new rule", body: "It once quit a winning game over one word. Never again.",
      box: { kicker: "PYTHON", big: "if lives > 0", sub: "a rule, not a guess" },
      vo: "It once quit a winning game over the word defeat in a menu. Now that is a rule." },
    { kind: "footage", clip: "lotus", from: 3, d: 3, label: "It never", title: "Pays to continue",
      body: "No store. No continues. Not one coin.", box: { kicker: "MENUS.PY", big: "Cancel", sub: "forbidden words" },
      vo: "It never spends what it shouldn't. No store, no paid continues." },
    { kind: "footage", clip: "popup", from: 5.5, d: 3, label: "Need your PC?", title: "It waits",
      notes: [[1, "a window over the game: the bot pauses", 0, 0, C.amber]],
      body: "Anything over the game, and it stops clicking until the game is back.", box: { kicker: "INPUTS.PY", big: "pause", sub: "never click through" },
      vo: "And if you need the computer, it stops, and waits until the game is back." },
    { kind: "score", d: 3, stats: [["wins", 94, C.green], ["medals", 389], ["player level", 130]], label: "By morning", title: "94 wins",
      body: "An unmodded game, a Python script, the night shift.", box: { kicker: "10/21-10/23", big: "btd6bot", sub: "Python + OpenCV" },
      vo: "By morning: ninety-four wins. Python and Open C V, on the night shift." },
  ]),
};
const COMP = COMPS[COMP_ID];

// Called by studio.html once vo/durations.js (written by render.py) has
// loaded: a scene with a voice line lasts as long as the line plus a breath;
// the lecture's captions need about 2.4 words a second.
function finalizeComp() {
  const vo = (window.VO_DUR || {})[COMP_ID] || [];
  COMP.scenes.forEach((s, i) => {
    if (s.vo && vo[i]) s.d = Math.max(s.d, Math.round((vo[i] + 0.7) * 10) / 10);
    if (COMP === LONG) {
      const words = (s.caps || []).join(" ").split(/\s+/).length;
      s.d = Math.max(s.d, Math.round((words / 2.4 + 1.5) * 2) / 2);
    }
    if (s.vo && !s.caps) s.caps = [s.body || ""];
  });
  let acc = 0;
  COMP.scenes.forEach((s) => { s.t0 = acc; acc += s.d; });
  COMP.duration = acc;
}
