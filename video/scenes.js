// Pop Theory - scene art. Each kind is (t, scene) -> SVG for a 1600 x 1000
// stage, t in seconds from the scene's start. Real data (DATA, from
// video/prep_assets.py) wherever the scene shows what the bot sees.

const W = 1600, H = 1000;
const T = (x, y, s, size = 36, o = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${o.fill || C.text}" text-anchor="${o.anchor || "start"}"
     font-family="${o.font || "Segoe UI, Arial"}" font-weight="${o.weight || 600}" opacity="${o.op ?? 1}"
     ${o.ls ? `letter-spacing="${o.ls}"` : ""}>${esc(s)}</text>`;
const MONO = "Consolas, monospace", HEAVY = "Segoe UI Black, Arial Black";
const panel = (x, y, w, h, o = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r ?? 18}" fill="${o.fill || C.panel}"
     stroke="${o.stroke || C.line}" stroke-width="${o.sw ?? 3}" opacity="${o.op ?? 1}"/>`;
const blinkAt = (t, period = 3.7, phase = 0) => { const u = ((t + phase) % period) / period; return u > 0.95 ? 1 : 0; };
const img = (href, x, y, w, h, o = {}) =>
  `<image href="${href}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="${o.par || "xMidYMid slice"}" opacity="${o.op ?? 1}"/>`;

// a map drawn from the decompiled Covered Garden file, into box (x, y, w, h)
function gardenMap(x, y, w, h, o = {}) {
  const G = DATA.garden;
  const px = (p) => `${(x + p[0] * w).toFixed(1)},${(y + p[1] * h).toFixed(1)}`;
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#1f3d24"/>`;
  const show = o.reveal ?? 1;
  G.areas.forEach((a, i) => {
    if (i / G.areas.length > show) return;
    if (a.pane !== null && a.pane !== undefined) return;
    if (/^Edges/.test(a.name)) return;          // the map's border: drawn as the background
    const fill = a.type === "water" ? "#2b6cb0" : a.type === "land" ? "#4c8f4a" : "#2c5530";
    const op = a.type === "unplaceable" ? 0.8 : 0.95;
    s += `<polygon points="${a.pts.map(px).join(" ")}" fill="${fill}" opacity="${op}"/>`;
  });
  if (show > 0.3) {
    G.track.forEach((tr) => {
      s += `<polyline points="${tr.map(px).join(" ")}" fill="none" stroke="#d8c08a" stroke-width="${w * 0.028}"
        stroke-linejoin="round" stroke-linecap="round" opacity="${clamp((show - 0.3) * 3)}"/>`;
    });
  }
  return s;
}

// position along the decompiled track, u in 0..1, inside box
function trackPoint(u, x, y, w, h) {
  const pts = DATA.garden.track[0];
  const seg = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot((pts[i][0] - pts[i - 1][0]) * w, (pts[i][1] - pts[i - 1][1]) * h);
    seg.push(d); total += d;
  }
  let want = clamp(u) * total;
  for (let i = 1; i < pts.length; i++) {
    if (want <= seg[i - 1]) {
      const k = want / seg[i - 1];
      return [x + lerp(pts[i - 1][0], pts[i][0], k) * w, y + lerp(pts[i - 1][1], pts[i][1], k) * h];
    }
    want -= seg[i - 1];
  }
  const p = pts[pts.length - 1];
  return [x + p[0] * w, y + p[1] * h];
}

const SCENES = {
  // ---------------------------------------------------------------- footage
  footage(t, s) {
    const f = footFrame(s.clip, t + (s.start || 0));
    let out = panel(0, 0, W, H, { r: 22, fill: "#000" }) + img(f, 6, 6, W - 12, H - 12, { par: "xMidYMid meet" });
    out += `<rect x="24" y="24" width="${s.badge ? 150 : 120}" height="44" rx="8" fill="#000a"/>
      <circle cx="48" cy="46" r="9" fill="${C.red}" opacity="${0.5 + 0.5 * Math.round((t * 1.2) % 1)}"/>` +
      T(66, 56, s.badge || "LIVE", 26, { weight: 800, font: MONO });
    if (s.speed) out += `<rect x="${W - 150}" y="24" width="126" height="44" rx="8" fill="#000a"/>` +
      T(W - 87, 56, `x${s.speed}`, 28, { anchor: "middle", fill: C.amber, weight: 800, font: MONO });
    if (s.clock) {   // a wall clock for time-lapses: [start "HH:MM", minutes per scene second]
      const [hh, mm] = s.clock[0].split(":").map(Number);
      const m = hh * 60 + mm + t * s.clock[1];
      const lab = `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(Math.floor(m % 60)).padStart(2, "0")}`;
      out += `<rect x="${W - 330}" y="${H - 110}" width="300" height="80" rx="12" fill="#000c" stroke="${C.amber}" stroke-width="3"/>` +
        T(W - 180, H - 52, lab, 52, { anchor: "middle", fill: C.amber, font: MONO, weight: 800 });
    }
    if (s.log && DATA.logs && DATA.logs[s.clip]) {
      // clip seconds -> recording seconds (the clip is sped up)
      const src = (t + (s.start || 0)) * FOOTAGE[s.clip].speed;
      const seen = DATA.logs[s.clip].filter((l) => l[0] <= src);
      seen.forEach((l) => {     // rings: a fresh placement or upgrade pulses where it happened
        const age = src - l[0];
        if (age > 2.2 || l[2] === null) return;
        const x = 6 + l[2] * (W - 12), y = 6 + l[3] * (H - 12), k = clamp(age / 2.2);
        out += `<circle cx="${x}" cy="${y}" r="${40 + 70 * k}" fill="none" stroke="${C.amber}" stroke-width="${8 * (1 - k) + 2}" opacity="${1 - k}"/>` +
          `<circle cx="${x}" cy="${y}" r="10" fill="${C.amber}" opacity="${1 - k}"/>`;
      });
      const last = seen.slice(-3);
      if (last.length) {
        out += `<rect x="24" y="${H - 40 - last.length * 52}" width="${W - 48}" height="${last.length * 52 + 16}" rx="12" fill="#000000d0"/>`;
        last.forEach((l, i) => {
          const fresh = src - l[0] < 1.2;
          const y = H - 44 - (last.length - 1 - i) * 52;
          out += T(48, y, `bot.log  ${l[1]}`, 34, { font: MONO, weight: 700, fill: fresh ? C.amber : C.dim });
        });
      }
    }
    (s.notes || []).forEach((n) => {
      if (t < n[0] || (n[2] && t > n[2])) return;
      const a = ramp(t, n[0], 0.3);
      const y = n[3] || H - 90;
      out += `<g opacity="${a}"><rect x="40" y="${y - 50}" width="${n[1].length * 22 + 60}" height="72" rx="12" fill="#000d" stroke="${n[4] || C.amber}" stroke-width="3"/>` +
        T(70, y, n[1], 38, { fill: n[4] || C.amber, weight: 800 }) + `</g>`;
    });
    return out;
  },

  // ---------------------------------------------------------------- title lineup
  lineup(t, s) {
    let out = `<ellipse cx="800" cy="900" rx="700" ry="40" fill="#000" opacity="0.5"/>`;
    const cast = [
      [250, (o) => monkey(o)], [560, (o) => monkey({ ...o, kind: "sniper" })],
      [870, (o) => bloon("red", o)], [1260, (o) => moab(o)],
    ];
    cast.forEach(([x, draw], i) => {
      const a = pop(t, 0.2 + i * 0.25);
      const bob = Math.sin(t * 2 + i) * 6;
      const look = Math.sin(t * 0.7 + i * 1.3) * 0.8;
      out += at(x, 620 + bob, 2.2 * a, draw({ look, blink: blinkAt(t, 3.3 + i * 0.4, i) }));
    });
    return out;
  },

  // ---------------------------------------------------------------- see/think/act
  loop(t, s) {
    const cx = 800, cy = 470, R = 300;
    const nodes = [["SEE", "mss + PrintWindow", -90], ["THINK", "OpenCV, OCR, rules", 30], ["ACT", "pydirectinput", 150]];
    let out = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.line}" stroke-width="6" stroke-dasharray="14 14"/>`;
    const a = (t * 0.9) % 3;   // the packet: one lap every 3.3 s
    const ang = (-90 + a * 120) * Math.PI / 180;
    out += `<circle cx="${cx + R * Math.cos(ang)}" cy="${cy + R * Math.sin(ang)}" r="16" fill="${C.amber}"/>`;
    nodes.forEach(([lab, sub, deg], i) => {
      const r = deg * Math.PI / 180, x = cx + R * Math.cos(r), y = cy + R * Math.sin(r);
      const p = pop(t, 0.3 + i * 0.3);
      const lit = Math.floor(a) === i;
      out += `<g transform="translate(${x} ${y}) scale(${p})">` +
        `<circle r="96" fill="${C.panel}" stroke="${lit ? C.amber : C.line}" stroke-width="6"/>` +
        T(0, 12, lab, 44, { anchor: "middle", font: HEAVY, fill: lit ? C.amber : C.text }) + `</g>` +
        T(x, y + (deg === -90 ? -120 : 140), sub, 30, { anchor: "middle", fill: C.dim, op: ramp(t, 0.6 + i * 0.3), font: MONO });
    });
    out += at(cx, cy, 1.6 * pop(t, 0.1), bot({ look: Math.cos(ang), blink: blinkAt(t) }));
    const chips = s.chips || [];
    chips.forEach((c, i) => {
      const x = 60, y = 120 + i * 90, o = ramp(t, 1.8 + i * 0.5);
      out += `<g opacity="${o}">${panel(x, y, 330, 70, { r: 12 })}` + T(x + 24, y + 47, c, 30, { fill: C.amber, font: MONO, weight: 700 }) + `</g>`;
    });
    return out;
  },

  // ---------------------------------------------------------------- the stack
  stack(t, s) {
    const items = [["mss / PrintWindow", "grab the window"], ["NumPy", "frame = uint8 array"], ["OpenCV", "crop, mask, measure"],
      ["RapidOCR", "pixels -> text"], ["rules", "the game's own data"], ["pydirectinput", "mouse + keys"]];
    let out = "";
    items.forEach(([name, sub], i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const x = 110 + col * 480, y = 230 + row * 330, o = pop(t, 0.3 + i * 0.4);
      out += `<g transform="translate(${x + 190} ${y + 90}) scale(${o}) translate(${-190} ${-90})">` + panel(0, 0, 380, 180) +
        T(190, 80, name, 40, { anchor: "middle", font: HEAVY }) + T(190, 135, sub, 28, { anchor: "middle", fill: C.dim, font: MONO }) + `</g>`;
      if (i < items.length - 1 && col < 2) out += `<path d="M${x + 395} ${y + 90} l60 0" stroke="${C.amber}" stroke-width="6" opacity="${ramp(t, 0.6 + i * 0.4)}" marker-end="url(#arrow)"/>`;
    });
    out += `<path d="M1260 420 C 1400 470, 300 470, 300 540" stroke="${C.amber}" stroke-width="6" fill="none" opacity="${ramp(t, 1.6)}" stroke-dasharray="10 12"/>`;
    return out;
  },

  // ---------------------------------------------------------------- one of the bot's own debug images
  // s.img (in assets), s.crop [x0, y0, x1, y1] of it (fractions), a slow
  // zoom, and a stamp ("FAILED" / "FIXED") with its colour
  evidence(t, s) {
    const [x0, y0, x1, y1] = s.crop || [0, 0, 1, 1];
    const z = 1 + 0.08 * clamp(t / Math.max(1, s.d));        // slow push-in
    const fw = 1 / (x1 - x0), fh = 1 / (y1 - y0);
    // the cropped part fills the 1600 x 1000 stage (letterboxed by `meet`)
    const iw = 1600 * fw * z, ih = 1000 * fh * z;
    const ix = -x0 * iw - (1600 * (z - 1)) / 2, iy = -y0 * ih - (1000 * (z - 1)) / 2;
    let out = `<clipPath id="ev"><rect x="0" y="0" width="1600" height="1000" rx="20"/></clipPath>` +
      `<rect x="0" y="0" width="1600" height="1000" rx="20" fill="#000"/>` +
      `<g clip-path="url(#ev)"><image href="${asset(s.img)}" x="${ix}" y="${iy}" width="${iw}" height="${ih}" preserveAspectRatio="none"/></g>` +
      `<rect x="0" y="0" width="1600" height="1000" rx="20" fill="none" stroke="${C.line}" stroke-width="4"/>`;
    out += `<rect x="24" y="24" width="${s.tag.length * 19 + 50}" height="50" rx="10" fill="#000c"/>` +
      T(48, 60, s.tag, 30, { font: MONO, weight: 700, fill: C.dim });
    if (s.stamp) {
      const st = ramp(t, s.stampAt ?? 1.2, 0.3), col = s.stampColor || C.red;
      out += `<g transform="translate(1260 860) rotate(-8) scale(${1 + (1 - st) * 0.8})" opacity="${st}">` +
        `<rect x="-220" y="-56" width="440" height="112" rx="12" fill="#000b" stroke="${col}" stroke-width="8"/>` +
        T(0, 22, s.stamp, 64, { anchor: "middle", font: HEAVY, fill: col }) + `</g>`;
    }
    return out;
  },

  // ---------------------------------------------------------------- real code from the repository
  code(t, s) {
    const lines = s.lines, total = lines.join("").length;
    const shown = Math.floor(clamp((t - 0.3) / (s.type || 1.8)) * total);
    let out = panel(40, 40, 1520, 920, { fill: "#0b0f0c" }) +
      `<circle cx="90" cy="95" r="12" fill="#e5484d"/><circle cx="130" cy="95" r="12" fill="#f2b632"/><circle cx="170" cy="95" r="12" fill="#3ecf8e"/>` +
      T(220, 106, s.file, 30, { font: MONO, fill: C.dim, weight: 700 });
    const KW = /\b(def|if|not|and|or|return|while|for|in|raise|else|elif|True|False|None|self)\b/g;
    let used = 0;
    lines.forEach((line, i) => {
      const part = line.slice(0, Math.max(0, shown - used));
      used += line.length;
      const y = 200 + i * 62;
      if ((s.hl || []).includes(i) && t > (s.type || 1.8) + 0.5)
        out += `<rect x="60" y="${y - 44}" width="1480" height="60" rx="8" fill="${C.amber}" opacity="${0.18 * ramp(t, (s.type || 1.8) + 0.5)}"/>`;
      const comment = part.trim().startsWith("#");
      // colour keywords and strings (tspans), comments grey
      const html = esc(part).replace(/(&quot;|")(.*?)(\1)/g, `<tspan fill="${C.green}">$1$2$3</tspan>`)
        .replace(KW, `<tspan fill="${C.amber}">$1</tspan>`);
      out += `<text x="90" y="${y}" font-size="36" font-family="${MONO}" fill="${comment ? C.mute : C.text}" xml:space="preserve">${comment ? esc(part) : html}</text>`;
    });
    return out;
  },

  // ---------------------------------------------------------------- the hands: guarded input
  hands(t, s) {
    let out = "";
    // the two checks, ticking green
    [["is BTD6 the window in front?", "GetForegroundWindow"], ["does this pixel belong to it?", "WindowFromPoint"]].forEach(([q, api], i) => {
      const o = ramp(t, 0.3 + i * 0.6), ok = t > 1.2 + i * 0.6;
      out += `<g opacity="${o}">` + panel(60, 90 + i * 140, 800, 110) + T(100, 150 + i * 140, q, 34, { weight: 800 }) +
        T(100, 185 + i * 140, api, 24, { font: MONO, fill: C.dim }) +
        `<circle cx="800" cy="${145 + i * 140}" r="30" fill="${ok ? C.green : "#333"}"/>` +
        (ok ? `<path d="M786 ${145 + i * 140} l10 10 l18 -20" stroke="#111" stroke-width="7" fill="none"/>` : "") + `</g>`;
    });
    // the cursor travelling to its spot (Unity only registers a hover that moves)
    const u = ease(((t - 2) % 4) / 1.6);
    const cx = lerp(980, 1380, u), cy = lerp(160, 330, u);
    out += panel(920, 90, 620, 290) + T(950, 360, "SetCursorPos twice: it must travel", 24, { font: MONO, fill: C.dim });
    out += `<path d="M980 160 Q 1180 120 1380 330" stroke="${C.amber}" stroke-width="3" stroke-dasharray="8 10" fill="none" opacity="0.6"/>`;
    out += `<path d="M${cx} ${cy} l0 44 l12 -12 l10 22 l9 -4 l-10 -22 l17 0 z" fill="#fff" stroke="#111" stroke-width="3"/>`;
    out += at(1380, 300, 0.45, monkey({ look: -1 }));
    // the keyboard: hotkeys, the kill switch, and the key that is never pressed
    const keys = [["O", "desperado", C.amber], ["P", "mermonkey", C.amber], [";", "skywarden", C.amber],
      ["Esc", "never", C.red], ["Ctrl+Alt+F8", "stop", C.green]];
    let kx = 60;
    keys.forEach(([k, lab, col], i) => {
      const o = pop(t, 3.5 + i * 0.5), w = Math.max(180, 70 + k.length * 26);
      out += `<g transform="translate(${kx + w / 2} 600) scale(${o})">` +
        `<rect x="${-w / 2}" y="-60" width="${w}" height="120" rx="16" fill="#1c1c1c" stroke="${col}" stroke-width="5"/>` +
        T(0, 18, k, 48, { anchor: "middle", font: HEAVY }) + T(0, 105, lab, 28, { anchor: "middle", fill: col, font: MONO, weight: 700 }) +
        (k === "Esc" ? `<line x1="${-w / 2 - 10}" y1="-70" x2="${w / 2 + 10}" y2="70" stroke="${C.red}" stroke-width="8"/>` : "") + `</g>`;
      kx += w + 40;
    });
    out += T(60, 850, "pydirectinput: scan codes, as a keyboard would send them", 28, { font: MONO, fill: C.dim, op: ramp(t, 6) });
    return out;
  },

  // ---------------------------------------------------------------- first attempt: probe with the range circle
  probe(t, s) {
    const mx = 120, my = 90, mw = 1360, mh = 820;
    let out = gardenMap(mx, my, mw, mh, { reveal: 1 });
    // heat dots: where bloons have been (the old map learner)
    const learned = clamp(t / 9);
    for (let i = 0; i < 160 * learned; i++) {
      const [x, y] = trackPoint(i / 160, mx, my, mw, mh);
      out += `<circle cx="${x}" cy="${y}" r="9" fill="${C.amber}" opacity="0.55"/>`;
    }
    // bloons going by
    for (let k = 0; k < 5; k++) {
      const u = (t * 0.06 + k * 0.07) % 1;
      const [x, y] = trackPoint(u, mx, my, mw, mh);
      out += at(x, y, 0.5, bloon(["red", "blue", "green", "red", "yellow"][k], { look: 1 }));
    }
    // the hovered monkey, hopping between spots, judged by its circle colour
    const spots = [[0.12, 0.2, "ok"], [0.3, 0.5, "track"], [0.52, 0.82, "ok"], [0.86, 0.22, "redmonkey"], [0.7, 0.62, "ok"]];
    const k = Math.min(spots.length - 1, Math.floor(t / 1.9));
    const [sx, sy, verdict] = spots[k];
    const x = mx + sx * mw, y = my + sy * mh;
    const red = verdict !== "ok";
    out += `<circle cx="${x}" cy="${y}" r="120" fill="${red ? C.red : "#ffffff"}" opacity="0.22" stroke="${red ? C.red : "#fff"}" stroke-width="4"/>`;
    out += at(x, y, 0.75, monkey({ kind: verdict === "redmonkey" ? "ninja" : undefined, fur: verdict === "redmonkey" ? "#b33" : C.fur, look: 0.5 }));
    const lab = verdict === "ok" ? "free?" : verdict === "track" ? "blocked" : "blocked??";
    out += `<rect x="${x + 70}" y="${y - 110}" width="230" height="58" rx="10" fill="#000c"/>` +
      T(x + 185, y - 70, lab, 34, { anchor: "middle", fill: red ? C.red : C.green, font: MONO, weight: 800 });
    if (verdict === "redmonkey") out += T(x + 185, y + 170, "a red monkey reads as red", 28, { anchor: "middle", fill: C.amber, font: MONO });
    return out;
  },

  // ---------------------------------------------------------------- what went wrong
  fails(t, s) {
    let out = "";
    (s.items || []).forEach((it, i) => {
      const y = 70 + i * 150, o = ramp(t, 0.4 + i * (s.step || 1.1), 0.4);
      out += `<g opacity="${o}" transform="translate(${(1 - o) * 60} 0)">${panel(80, y, 1440, 122)}` +
        T(130, y + 58, it[0], 40, { font: HEAVY }) + T(130, y + 102, it[1], 28, { fill: C.dim, font: MONO }) + `</g>`;
      const st = ramp(t, 0.8 + i * (s.step || 1.1), 0.25);
      if (st > 0) out += `<g transform="translate(1430 ${y + 61}) scale(${1 + (1 - st) * 0.8}) rotate(-12)" opacity="${st}">
        <rect x="-80" y="-34" width="160" height="68" rx="8" fill="none" stroke="${C.red}" stroke-width="6"/>` +
        T(0, 14, it[2] || "WRONG", 34, { anchor: "middle", fill: C.red, font: HEAVY }) + `</g>`;
    });
    return out;
  },

  // ---------------------------------------------------------------- the first night's losses
  night(t, s) {
    const L = s.losses;    // [["01:11", "Ancient Portal", "Medium", 54], ...]
    const x0 = 140, x1 = 1460, y = 860;
    const toX = (hm) => { const [h, m] = hm.split(":").map(Number); return lerp(x0, x1, (h * 60 + m - 60) / 270); };
    let out = `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${C.line}" stroke-width="6"/>`;
    ["01:00", "02:00", "03:00", "04:00", "05:00"].forEach((hm) => {
      out += `<line x1="${toX(hm)}" y1="${y - 14}" x2="${toX(hm)}" y2="${y + 14}" stroke="${C.mute}" stroke-width="4"/>` +
        T(toX(hm), y + 60, hm, 30, { anchor: "middle", fill: C.mute, font: MONO });
    });
    const cursor = lerp(x0, x1, clamp(t / (s.d - 1.5)));
    out += `<line x1="${cursor}" y1="120" x2="${cursor}" y2="${y}" stroke="${C.amber}" stroke-width="3" opacity="0.6"/>`;
    let shown = 0;
    L.forEach((l, i) => {
      const x = toX(l[0]);
      if (x > cursor) return;
      shown++;
      const row = i % 6, yy = 170 + row * 105;
      const a = clamp((cursor - x) / 40);
      out += `<line x1="${x}" y1="${yy + 30}" x2="${x}" y2="${y}" stroke="${C.red}" stroke-width="2" opacity="${0.35 * a}"/>` +
        at(x, yy, 0.5 * a, bloon("red", { blink: 1 })) +
        T(x + 30, yy + 8, `${l[1]} ${l[2]}`, 26, { fill: C.text, op: a, weight: 700 }) +
        T(x + 30, yy + 40, `lost at round ${l[3]}`, 24, { fill: C.red, op: a, font: MONO });
    });
    out += T(1500, 100, `${shown}`, 110, { anchor: "end", font: HEAVY, fill: C.red }) +
      T(1500, 140, "games lost", 30, { anchor: "end", fill: C.dim, font: MONO });
    return out;
  },

  // ---------------------------------------------------------------- a frame is an array
  array(t, s) {
    const d = DATA.ocr, [fh, fw] = d.shape;
    const iw = 900, ih = iw * fh / fw;
    let out = img(asset("game_still.jpg"), 60, 160, iw, ih, { par: "none" });
    const z = ease((t - 1) / 1.2);
    const bx = 60 + d.box[0] * iw, by = 160 + d.box[1] * ih, bw = (d.box[2] - d.box[0]) * iw, bh = (d.box[3] - d.box[1]) * ih;
    out += `<rect x="${lerp(60, bx, z)}" y="${lerp(160, by, z)}" width="${lerp(iw, bw, z)}" height="${lerp(ih, bh, z)}" fill="none" stroke="${C.amber}" stroke-width="5"/>`;
    out += T(60, 130, `frame.shape = (${fh}, ${fw}, 3)   dtype = uint8`, 34, { font: MONO, fill: C.amber, op: ramp(t, 0.3) });
    // the real pixel values from the middle of the cash digits
    const p = d.patch, cw = 112, chh = 76, gx = 1000, gy = 200;
    p.forEach((row, r) => row.slice(0, 5).forEach((px, c) => {
      const o = ramp(t, 2.2 + (r * 5 + c) * 0.04, 0.25);
      const [b, g, rr] = px;
      out += `<g opacity="${o}"><rect x="${gx + c * cw}" y="${gy + r * chh}" width="${cw - 6}" height="${chh - 6}" rx="6" fill="rgb(${rr},${g},${b})"/>` +
        T(gx + c * cw + (cw - 6) / 2, gy + r * chh + 46, `${rr}`, 26, { anchor: "middle", font: MONO, weight: 700,
          fill: (rr + g + b) / 3 > 128 ? "#111" : "#eee" }) + `</g>`;
    }));
    out += T(gx, gy + 8 * chh + 40, "red channel of each pixel", 26, { fill: C.dim, font: MONO, op: ramp(t, 3) });
    return out;
  },

  // ---------------------------------------------------------------- reading the money
  cash(t, s) {
    const d = DATA.ocr;
    let out = "";
    const step = (i, x, title, body) => {
      const o = ramp(t, 0.3 + i * 1.3);
      out += `<g opacity="${o}">` + panel(x, 120, 460, 420) + T(x + 30, 180, title, 32, { font: HEAVY, fill: C.amber }) + body + `</g>`;
      if (i) out += `<path d="M${x - 50} 330 l36 0" stroke="${C.amber}" stroke-width="6" opacity="${o}"/>`;
    };
    step(0, 60, "1. crop", img(asset("hud_crop.png"), 90, 230, 400, 200, { par: "xMidYMid meet" }) +
      T(90, 500, "the cash box", 26, { fill: C.dim, font: MONO }));
    step(1, 570, "2. HSV mask", img(asset("hud_mask.png"), 600, 230, 400, 200, { par: "xMidYMid meet" }) +
      T(600, 470, "inRange: bright, grey", 26, { fill: C.dim, font: MONO }) + T(600, 505, "(noisy - opt-in only)", 26, { fill: C.red, font: MONO }));
    step(2, 1080, "3. recognise", T(1310, 360, d.text, 92, { anchor: "middle", font: HEAVY }) +
      T(1310, 430, `confidence ${d.conf}`, 30, { anchor: "middle", fill: C.green, font: MONO }) +
      T(1310, 500, "rec only: ~30 ms", 26, { anchor: "middle", fill: C.dim, font: MONO }));
    // three reads, lower median
    const reads = [d.text, d.text.replace("$1", "$11"), d.text];
    const o = ramp(t, 4.4);
    out += `<g opacity="${o}">` + T(60, 650, "three reads:", 34, { font: MONO, fill: C.dim });
    reads.forEach((r, i) => {
      const bad = r !== d.text;
      out += panel(330 + i * 300, 600, 270, 80, { r: 12, stroke: bad ? C.red : C.line }) +
        T(465 + i * 300, 655, r, 40, { anchor: "middle", font: MONO, weight: 800, fill: bad ? C.red : C.text });
    });
    const o2 = ramp(t, 5.6);
    out += `</g><g opacity="${o2}">` + T(60, 790, "lower median ->", 34, { font: MONO, fill: C.dim }) +
      T(400, 790, d.text, 64, { font: HEAVY, fill: C.green }) +
      T(60, 880, "OCR invents digits; it never drops the ones that are there.", 32, { fill: C.amber, font: MONO }) + `</g>`;
    return out;
  },

  // ---------------------------------------------------------------- round votes
  votes(t, s) {
    const reads = [21, 21, 721, 21, 22, 22, 721, 22, 23];
    const n = Math.min(reads.length, Math.floor(t / 0.75));
    let cur = 21, cand = null, voteN = 0, out = "";
    const log = [];
    for (let i = 0; i < n; i++) {
      const r = reads[i];
      let v;
      if (r === cur) v = ["same", C.mute];
      else if (r > cur && r <= cur + 2) { cur = r; v = ["+1: accepted", C.green]; }
      else { if (r === cand) voteN++; else { cand = r; voteN = 1; } v = [`jump: vote ${voteN}/15`, C.red]; }
      log.push([r, v]);
    }
    out += panel(80, 140, 560, 460) + T(360, 230, "ROUND", 44, { anchor: "middle", font: HEAVY, fill: C.dim }) +
      T(360, 470, String(cur), 220, { anchor: "middle", font: HEAVY, fill: C.amber });
    log.slice(-8).forEach(([r, v], i) => {
      const y = 170 + i * 90;
      out += panel(720, y - 50, 800, 74, { r: 10 }) + T(760, y, `read "${r}"`, 36, { font: MONO, weight: 700 }) +
        T(1480, y, v[0], 32, { anchor: "end", fill: v[1], font: MONO, weight: 700 });
    });
    // (kept inside the left column: the reads list fills the right)
    ["rounds only go forward,", "one or two at a time.", "a correction: 4 agreeing reads", "a big jump: 15"].forEach((line, i) =>
      out += T(80, 690 + i * 50, line, 32, { fill: C.dim, font: MONO }));
    return out;
  },

  // ---------------------------------------------------------------- menus as words
  menu(t, s) {
    const words = DATA.menu, iw = 1000, ih = 625, x0 = 40, y0 = 150;
    let out = img(asset("menu.jpg"), x0, y0, iw, ih, { par: "none" });
    words.forEach((w, i) => {
      const o = ramp(t, 0.4 + i * 0.05, 0.2);
      const [a, b, c, d] = w.box;
      const hit = /vi.?g?tory|victory/i.test(w.text);
      out += `<rect x="${x0 + a * iw}" y="${y0 + b * ih}" width="${(c - a) * iw}" height="${(d - b) * ih}" fill="none"
        stroke="${hit && t > 3.2 ? C.amber : C.green}" stroke-width="${hit && t > 3.2 ? 5 : 2}" opacity="${o}"/>`;
    });
    const o = ramp(t, 3.2);
    const vic = words.find((w) => /tory/i.test(w.text));
    out += `<g opacity="${o}">` + panel(1080, 150, 480, 300) +
      T(1110, 215, "OCR saw:", 30, { fill: C.dim, font: MONO }) + T(1110, 285, vic ? vic.text : "VICTORY", 52, { font: MONO, weight: 800, fill: C.amber }) +
      T(1110, 345, "normalised, close enough:", 28, { fill: C.dim, font: MONO }) + T(1110, 410, "screen = victory", 40, { font: MONO, weight: 800, fill: C.green }) + `</g>`;
    const o2 = ramp(t, 5);
    out += `<g opacity="${o2}">` + panel(1080, 480, 480, 300, { stroke: C.red }) + T(1110, 540, "never clicked:", 30, { fill: C.red, font: MONO, weight: 800 });
    ["STORE", "PURCHASE", "UNLOCK ALL", "CONTINUE (Monkey Money)"].forEach((w, i) =>
      out += T(1110, 595 + i * 48, w, 30, { font: MONO, weight: 700, fill: C.text }) +
        `<line x1="1105" y1="${585 + i * 48}" x2="${1115 + w.length * 17}" y2="${585 + i * 48}" stroke="${C.red}" stroke-width="4"/>`);
    return out + `</g>`;
  },

  // ---------------------------------------------------------------- decompiled map file
  decompile(t, s) {
    let out = "";
    const files = ["BloonsTD6_Data (a copy)", "GameAssembly.dll -> Cpp2IL", "map bundle -> areas, paths, events"];
    files.forEach((f, i) => {
      const o = ramp(t, 0.3 + i * 0.5);
      out += `<g opacity="${o}">` + panel(40, 120 + i * 120, 620, 96, { r: 12 }) +
        T(70, 180 + i * 120, f, 30, { font: MONO, weight: 700, fill: i === 2 ? C.amber : C.text }) + `</g>`;
    });
    const code = ['{ "type": "CycleAreasAction",', '  "areas": [4620, 4600, 4658, 4625],', '  "invert": 1,', '  "roundsPerRotate": 0 }',
      "", '"WindowLowerLeft"  unplaceable', '"WindowUpperLeft"  unplaceable', '"Track"            track'];
    const chars = Math.floor(clamp((t - 2) / 4) * code.join("").length);
    let used = 0;
    out += panel(40, 500, 620, 440, { r: 12, fill: "#0a0f0a" });
    code.forEach((line, i) => {
      const show = line.slice(0, Math.max(0, chars - used));
      used += line.length;
      out += T(64, 550 + i * 50, show, 26, { font: MONO, fill: i < 4 ? C.green : C.dim, weight: 600 });
    });
    out += gardenMap(720, 120, 840, 820, { reveal: clamp((t - 1) / 5) });
    // the panes, outlined once the map is drawn
    const po = ramp(t, 6.2);
    DATA.garden.areas.filter((a) => a.pane !== null && a.pane !== undefined).forEach((a) => {
      out += `<polygon points="${a.pts.map((p) => `${720 + p[0] * 840},${120 + p[1] * 820}`).join(" ")}" fill="#ffffff22" stroke="#fff" stroke-width="3" opacity="${po}"/>`;
    });
    return out;
  },

  // ---------------------------------------------------------------- distance transform
  dist(t, s) {
    let out = img(asset("dist.png"), 60, 110, 960, 820, { par: "none" });
    const o = ramp(t, 3);
    out += `<image href="${asset("legal.png")}" x="60" y="110" width="960" height="820" preserveAspectRatio="none" opacity="${0.45 * o}" style="mix-blend-mode:screen"/>`;
    out += panel(1060, 110, 500, 820) +
      T(1090, 180, "cv2.distanceTransform", 32, { font: MONO, weight: 800, fill: C.amber }) +
      T(1090, 240, "each cell: distance to", 30, { fill: C.dim, font: MONO }) + T(1090, 280, "the nearest wall", 30, { fill: C.dim, font: MONO }) +
      T(1090, 380, "legal spot:", 30, { fill: C.dim, font: MONO, op: ramp(t, 1.5) }) +
      T(1090, 440, "dist >= footprint", 40, { font: MONO, weight: 800, op: ramp(t, 1.5) }) +
      T(1090, 560, "darker = closer to", 28, { fill: C.dim, font: MONO, op: ramp(t, 2.5) }) +
      T(1090, 600, "track, water, walls", 28, { fill: C.dim, font: MONO, op: ramp(t, 2.5) }) +
      T(1090, 700, "white = a dart monkey", 28, { fill: C.green, font: MONO, op: o }) + T(1090, 740, "fits here", 28, { fill: C.green, font: MONO, op: o });
    // a footprint circle sliding over the grid
    const fx = 60 + (0.2 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.8))) * 960, fy = 110 + 0.55 * 820;
    out += `<circle cx="${fx}" cy="${fy}" r="38" fill="none" stroke="${C.amber}" stroke-width="5"/><circle cx="${fx}" cy="${fy}" r="5" fill="${C.amber}"/>`;
    return out;
  },

  // ---------------------------------------------------------------- Covered Garden panes
  garden(t, s) {
    const mx = 60, my = 100, mw = 940, mh = 840;
    const rnd = 1 + Math.floor(t / (s.per || 1.6));
    const open = (rnd - 1) % 4;
    let out = gardenMap(mx, my, mw, mh);
    DATA.garden.areas.filter((a) => a.pane !== null && a.pane !== undefined).forEach((a) => {
      const isOpen = a.pane === open;
      out += `<polygon points="${a.pts.map((p) => `${mx + p[0] * mw},${my + p[1] * mh}`).join(" ")}"
        fill="${isOpen ? "#00000000" : "#e8f4ff"}" fill-opacity="${isOpen ? 0 : 0.55}" stroke="${isOpen ? C.amber : "#fff"}" stroke-width="${isOpen ? 8 : 3}"/>`;
    });
    // towers placed under the top-left pane on its round (2), then waiting
    if (rnd >= 2) {
      const tl = [mx + 0.3 * mw, my + 0.3 * mh];
      out += at(tl[0], tl[1], 0.55 * pop(t, (s.per || 1.6) * 1), monkey({ kind: "ninja" }));
      if (open !== 1) out += `<g transform="translate(${tl[0] + 40} ${tl[1] - 60})"><rect x="-22" y="-8" width="44" height="34" rx="6" fill="${C.amber}"/>
        <path d="M-13 -8 v-10 a13 13 0 0 1 26 0 v10" stroke="${C.amber}" stroke-width="6" fill="none"/></g>`;
    }
    out += panel(1040, 100, 520, 220) + T(1070, 170, "ROUND", 30, { font: MONO, fill: C.dim }) +
      T(1070, 280, String(rnd), 110, { font: HEAVY, fill: C.amber }) +
      T(1300, 200, "open pane:", 28, { font: MONO, fill: C.dim }) + T(1300, 250, DATA.garden.pane_names[open], 32, { font: MONO, weight: 800 });
    out += panel(1040, 350, 520, 330, { fill: "#000" }) + img(footFrame(s.clip, t), 1046, 356, 508, 318, { par: "xMidYMid meet" }) +
      T(1060, 715, "the real game, x6", 26, { font: MONO, fill: C.dim });
    out += T(1040, 790, "(r - 1) mod 4 -> BL, TL, TR, BR", 30, { font: MONO, fill: C.amber, weight: 700 }) +
      T(1040, 840, "a tower under shut glass", 28, { font: MONO, fill: C.dim }) + T(1040, 880, "waits for its pane", 28, { font: MONO, fill: C.dim });
    return out;
  },

  // ---------------------------------------------------------------- the round calendar
  calendar(t, s) {
    const x0 = 100, x1 = 1500, y = 560;
    const toX = (r) => lerp(x0, x1, (r - 1) / 79);
    const head = lerp(1, 80, clamp(t / (s.d - 1)));
    let out = `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${C.line}" stroke-width="10" stroke-linecap="round"/>` +
      `<line x1="${x0}" y1="${y}" x2="${toX(head)}" y2="${y}" stroke="${C.amber}" stroke-width="10" stroke-linecap="round"/>`;
    [1, 20, 40, 60, 80].forEach((r) => out += T(toX(r), y + 60, `R${r}`, 28, { anchor: "middle", fill: C.mute, font: MONO }));
    const threats = [[24, "camo", "needs detection", "sniper + goggles"], [28, "lead", "needs sharp-proof", "bomb / fire"],
      [40, "moab", "first MOAB", "MOAB damage"], [63, "ceramic", "ceramic rush", "raw DPS"], [80, "black", "ZOMG", "everything"]];
    threats.forEach(([r, kind, need, answer], i) => {
      const a = pop(t, (r - 1) / 79 * (s.d - 1));
      if (a <= 0) return;
      const x = toX(r), up = i % 2 === 0;
      const yy = up ? (i % 4 === 0 ? 260 : 400) : 800;   // staggered so labels never collide
      out += `<line x1="${x}" y1="${y}" x2="${x}" y2="${yy + (up ? 70 : -70)}" stroke="${C.mute}" stroke-width="3" opacity="${a}"/>`;
      out += at(x, yy, (kind === "moab" ? 1.0 : 1.5) * a, kind === "moab" ? moab({ look: 1 }) : bloon(kind, { look: 1 }));
      out += T(x, yy + (up ? -100 : 130), `R${r} ${need}`, 34, { anchor: "middle", weight: 800, op: a }) +
        T(x, yy + (up ? -60 : 170), `-> ${answer}`, 28, { anchor: "middle", fill: C.green, font: MONO, op: a });
    });
    return out;
  },

  // ---------------------------------------------------------------- the damage model's margins
  margins(t, s) {
    const M = DATA.margins, x0 = 140, x1 = 1520, y0 = 880, top = 140;
    const ymax = 2.2, toY = (m) => y0 - (Math.min(m, ymax) / ymax) * (y0 - top);
    const bw = (x1 - x0) / M.length;
    let out = "";
    [[1, C.red, "1.0  leaks"], [2, C.green, "2.0  comfortable"]].forEach(([m, c, lab]) =>
      out += `<line x1="${x0}" y1="${toY(m)}" x2="${x1}" y2="${toY(m)}" stroke="${c}" stroke-width="3" stroke-dasharray="12 10"/>` +
        T(x1, toY(m) - 12, lab, 26, { anchor: "end", fill: c, font: MONO, weight: 700 }));
    M.forEach(([r, m], i) => {
      const g = ease((t - 0.5 - i * 0.12) / 0.6);
      const h = (y0 - toY(m)) * g;
      const col = m < 1 ? C.red : m < 2 ? C.amber : C.green;
      out += `<rect x="${x0 + i * bw + 5}" y="${y0 - h}" width="${bw - 10}" height="${h}" rx="4" fill="${col}"/>`;
      if (r % 5 === 0) out += T(x0 + i * bw + bw / 2, y0 + 40, String(r), 26, { anchor: "middle", fill: C.mute, font: MONO });
    });
    out += T(x0, 100, "margin = defence / demand, per round", 32, { font: MONO, fill: C.dim });
    const mark = (r, text, at_) => {
      const i = M.findIndex((x) => x[0] === r);
      const o = ramp(t, at_);
      const x = x0 + i * bw + bw / 2;
      return `<g opacity="${o}"><line x1="${x}" y1="${top + 60}" x2="${x}" y2="${y0}" stroke="#fff" stroke-width="3"/>` +
        T(x - 10, top + 40, text, 28, { anchor: "end", font: MONO, weight: 800, fill: "#fff" }) + `</g>`;
    };
    out += mark(28, "lives start falling: R28", 4.2) + mark(38, "defeat: R38", 5.4);
    return out;
  },

  // ---------------------------------------------------------------- reinforcement
  reinforce(t, s) {
    let out = "";
    const g = ease((t - 2.2) / 1.5);
    const m = lerp(0.8, 1.6, g);
    const y0 = 820, toY = (v) => y0 - v / 2.2 * 600;
    out += `<line x1="1000" y1="${toY(1)}" x2="1500" y2="${toY(1)}" stroke="${C.red}" stroke-width="3" stroke-dasharray="12 10"/>`;
    out += `<rect x="1150" y="${toY(m)}" width="200" height="${y0 - toY(m)}" rx="8" fill="${m < 1 ? C.red : C.amber}"/>` +
      T(1250, toY(m) - 20, m.toFixed(2), 48, { anchor: "middle", font: HEAVY }) + T(1250, y0 + 50, "round 63", 30, { anchor: "middle", fill: C.dim, font: MONO });
    const opts = [["ninja 3-0-2 -> 4-0-2", "+0.31 / $1k", true], ["new sniper", "+0.12 / $1k", false], ["village 0-2-0", "+0.05 / $1k", false]];
    opts.forEach(([a, b, best], i) => {
      const o = ramp(t, 0.4 + i * 0.4);
      out += `<g opacity="${o}">` + panel(80, 180 + i * 140, 820, 110, { stroke: best && t > 1.8 ? C.amber : C.line, sw: best && t > 1.8 ? 5 : 3 }) +
        T(120, 248 + i * 140, a, 36, { font: MONO, weight: 700 }) + T(860, 248 + i * 140, b, 32, { anchor: "end", font: MONO, fill: best ? C.green : C.dim }) + `</g>`;
    });
    for (let k = 0; k < 6; k++) {   // coins flying into the chosen upgrade
      const u = clamp((t - 2 - k * 0.12) / 0.7);
      if (u <= 0 || u >= 1) continue;
      out += `<circle cx="${lerp(1250, 860, u)}" cy="${lerp(toY(m) - 80, 235, u) - Math.sin(u * Math.PI) * 120}" r="16" fill="${C.amber}"/>`;
    }
    out += T(80, 700, "illustration of reinforce.py: the option that raises the", 28, { fill: C.mute, font: MONO }) +
      T(80, 740, "weakest coming round most per dollar wins", 28, { fill: C.mute, font: MONO });
    return out;
  },

  // ---------------------------------------------------------------- the bloon watch
  watch(t, s) {
    let out = img(asset("bloonwatch.png"), 40, 110, 1000, 675, { par: "none" });
    out += panel(1080, 110, 480, 675) + T(1110, 175, "bloon watch", 34, { font: HEAVY, fill: C.amber }) +
      T(1110, 230, "5 looks a second", 28, { fill: C.dim, font: MONO }) + T(1110, 270, "bloons found on the track,", 28, { fill: C.dim, font: MONO }) +
      T(1110, 310, "each placed on the route", 28, { fill: C.dim, font: MONO });
    const depth = 0.94 * ease((t - 1) / 3);
    out += T(1110, 420, "furthest bloon:", 30, { font: MONO, fill: C.dim }) + T(1110, 510, `${Math.round(depth * 100)}%`, 96, { font: HEAVY, fill: depth > 0.8 ? C.red : C.amber });
    out += `<rect x="1110" y="560" width="420" height="30" rx="15" fill="#222"/><rect x="1110" y="560" width="${420 * depth}" height="30" rx="15" fill="${depth > 0.8 ? C.red : C.amber}"/>
      <line x1="${1110 + 420 * 0.8}" y1="545" x2="${1110 + 420 * 0.8}" y2="605" stroke="#fff" stroke-width="3"/>`;
    out += T(1110, 660, "past 80%: crisis -", 28, { font: MONO, fill: C.dim, op: ramp(t, 4) }) + T(1110, 700, "abilities, then spend", 28, { font: MONO, fill: C.dim, op: ramp(t, 4) });
    out += T(40, 840, "Moon Landing Easy, round 10: the bot's own debug frame", 26, { fill: C.mute, font: MONO });
    return out;
  },

  // ---------------------------------------------------------------- the planner's medal board
  planner(t, s) {
    const modes = ["Hard", "Magic", "2x HP", "Half $", "ABR", "Impop.", "CHIMPS"];
    const maps = ["Monkey Meadow", "Logs", "Cubism", "Spa Pits", "Alpine Run", "Moon Landing", "Haunted", "Downstream", "Quarry", "Bloody Puddles"];
    const x0 = 360, y0 = 170, cw = 160, ch = 70;
    let out = "";
    modes.forEach((m, j) => out += T(x0 + j * cw + cw / 2, y0 - 25, m, 28, { anchor: "middle", font: MONO, weight: 800, fill: j === 6 ? C.red : C.amber }));
    maps.forEach((m, i) => out += T(x0 - 20, y0 + i * ch + 46, m, 28, { anchor: "end", font: MONO, fill: C.dim }));
    const order = [];
    for (let j = 0; j < modes.length; j++) for (let i = 0; i < maps.length; i++) order.push([i, j]);
    const done = Math.floor(clamp((t - 0.8) / (s.d - 2)) * order.length);
    order.forEach(([i, j], k) => {
      const filled = k < done;
      out += `<rect x="${x0 + j * cw + 8}" y="${y0 + i * ch + 8}" width="${cw - 16}" height="${ch - 16}" rx="10" fill="${filled ? (j === 6 ? C.red : C.amber) : "#1a1a1a"}" stroke="${C.line}" stroke-width="2"/>`;
      if (k === done) out += `<rect x="${x0 + j * cw + 4}" y="${y0 + i * ch + 4}" width="${cw - 8}" height="${ch - 8}" rx="12" fill="none" stroke="#fff" stroke-width="4"/>`;
    });
    out += T(x0, 930, "one medal at a time, across every map - never a replay", 30, { fill: C.text, font: MONO, weight: 700 });
    return out;
  },

  // ---------------------------------------------------------------- the scoreboard
  score(t, s) {
    let out = "";
    s.stats.forEach(([lab, val, color], i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const x = 80 + col * 500, y = 160 + row * 380, o = ramp(t, 0.3 + i * 0.35);
      const v = Math.round(val * ease((t - 0.3 - i * 0.35) / 1.4));
      out += `<g opacity="${o}">` + panel(x, y, 440, 320) + T(x + 220, y + 190, v.toLocaleString("en-US"), 120, { anchor: "middle", font: HEAVY, fill: color || C.amber }) +
        T(x + 220, y + 260, lab, 32, { anchor: "middle", fill: C.dim, font: MONO }) + `</g>`;
    });
    return out;
  },

  // ---------------------------------------------------------------- closing lineup with the bot
  outro(t, s) {
    let out = SCENES.lineup(t, s);
    out += at(800, 260, 1.3 * pop(t, 1.2), bot({ look: Math.sin(t), blink: blinkAt(t) }));
    return out;
  },
};
