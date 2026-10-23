// Pop Theory - the animation engine.
//
// Every frame is a pure function of time: render(t) rebuilds the stage from
// scratch, so video/render.py can ask for any frame in any order and get the
// same picture. No CSS transitions, no timers, no randomness (rand() is
// seeded).
//
// Layout: the composition (comps.js) is a list of scenes. Each scene has a
// `kind` (scenes.js draws its art into a 1600 x 1000 SVG "stage"), the card
// text (label, title, body or timed captions) and the top-right box.

const P = new URLSearchParams(location.search);
const BUILD = P.get("build") || "";                // file:///.../Explainer/build/
const COMP_ID = P.get("comp") || "long";

// ---------------------------------------------------------------- palette
const C = {
  bg: "#121212", panel: "#0b0b0b", line: "#2b2b2b", text: "#f2f2f2", dim: "#b5b5b5",
  mute: "#7a7a7a", amber: "#f2b632", red: "#e5484d", green: "#3ecf8e", blue: "#4c8dff",
  cyan: "#3fd4e6", purple: "#8e5cf0",
  fur: "#8a5a2e", face: "#e9c49a", bloon: { red: "#e5484d", blue: "#3b82f6", green: "#3ecf6e",
    yellow: "#f5d13b", pink: "#f472b6", black: "#2a2a2a", white: "#efefef", lead: "#8d96a0",
    purple: "#9b5de5", zebra: "#dcdcdc", rainbow: "#ff9f1c", ceramic: "#b5763a", camo: "#5d7a3a" },
};

// ---------------------------------------------------------------- maths
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, u) => a + (b - a) * u;
const ease = (u) => { u = clamp(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const easeOut = (u) => 1 - Math.pow(1 - clamp(u), 3);
// 0 -> 1 over [start, start + dur] (seconds of scene time)
const ramp = (t, start, dur = 0.5) => easeOut((t - start) / dur);
// a value that pops in: overshoots a little, then settles
const pop = (t, start, dur = 0.45) => {
  const u = clamp((t - start) / dur);
  return u <= 0 ? 0 : 1 + Math.sin(u * Math.PI) * 0.12 * (1 - u) - (1 - easeOut(u));
};
let SEED = 1;
function rand() { SEED = (SEED * 16807) % 2147483647; return (SEED - 1) / 2147483646; }
function seeded(n) { SEED = n * 7919 + 13; return rand; }
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const asset = (name) => BUILD + "assets/" + name;
// footage frame for scene time t (clips: see FOOTAGE in comps.js)
function footFrame(id, t) {
  const clip = FOOTAGE[id];
  const n = clamp(Math.floor(t * 30), 0, clip.frames - 1);
  return BUILD + "footage/" + id + "/" + String(n + 1).padStart(5, "0") + ".jpg";
}

// ---------------------------------------------------------------- characters
// All characters are drawn around (0, 0) at about 100 units tall, so a
// scene places them with translate/scale. "look" moves the pupils (-1..1).

function eyes(x1, x2, y, r, look = 0, blink = 0, lookY = 0) {
  const h = r * (1 - blink * 0.9);
  const e = (x) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${h}" fill="#fff"/>` +
    (blink < 0.8 ? `<circle cx="${x + look * r * 0.45}" cy="${y + lookY * r * 0.4}" r="${r * 0.48}" fill="#111"/>` +
      `<circle cx="${x + look * r * 0.45 - r * 0.15}" cy="${y + lookY * r * 0.4 - r * 0.18}" r="${r * 0.15}" fill="#fff"/>` : "");
  return e(x1) + e(x2);
}

// kinds: dart (plain), sniper (helmet), ninja (headband), heli (pilot cap),
// tack (orange), village (hat), ice (blue)
function monkey(o = {}) {
  const fur = o.fur || C.fur, face = o.face || C.face, look = o.look || 0, blink = o.blink || 0;
  let hat = "";
  if (o.kind === "sniper") hat = `<path d="M-44 -30 Q0 -78 44 -30 L44 -22 L-44 -22 Z" fill="#4d6b2f"/><rect x="-48" y="-26" width="96" height="8" rx="4" fill="#3b5323"/>`;
  if (o.kind === "ninja") hat = `<rect x="-46" y="-34" width="92" height="12" rx="6" fill="#d33"/><path d="M40 -30 l22 -6 l-4 12 z" fill="#d33"/>`;
  if (o.kind === "heli") hat = `<path d="M-40 -28 Q0 -66 40 -28 Z" fill="#2f6fdb"/><rect x="-10" y="-62" width="20" height="8" rx="3" fill="#ddd"/>`;
  if (o.kind === "village") hat = `<path d="M-50 -26 L0 -70 L50 -26 Z" fill="#c9a227"/>`;
  if (o.kind === "ice") hat = `<path d="M-42 -30 Q0 -70 42 -30 Z" fill="#9fd8ff"/>`;
  const body = o.body === false ? "" :
    `<ellipse cx="0" cy="62" rx="34" ry="30" fill="${fur}"/><ellipse cx="0" cy="68" rx="20" ry="18" fill="${face}"/>`;
  return `<g>${body}
    <circle cx="-46" cy="0" r="16" fill="${fur}"/><circle cx="46" cy="0" r="16" fill="${fur}"/>
    <circle cx="-46" cy="0" r="8" fill="${face}"/><circle cx="46" cy="0" r="8" fill="${face}"/>
    <circle cx="0" cy="0" r="44" fill="${fur}"/>
    <ellipse cx="-14" cy="-6" rx="20" ry="22" fill="${face}"/><ellipse cx="14" cy="-6" rx="20" ry="22" fill="${face}"/>
    <ellipse cx="0" cy="18" rx="30" ry="20" fill="${face}"/>
    ${eyes(-14, 14, -6, 9, look, blink)}
    <ellipse cx="0" cy="12" rx="7" ry="5" fill="#3a2414"/>
    <path d="M-10 24 Q0 31 10 24" stroke="#3a2414" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${hat}</g>`;
}

function bloon(color = "red", o = {}) {
  const fill = C.bloon[color] || color;
  const look = o.look || 0, blink = o.blink || 0;
  const dark = color === "black" || color === "lead" || color === "camo";
  const camo = color === "camo" ? `<path d="M-20 -20 q10 8 20 0 q-4 14 -20 6 z M6 10 q12 -2 14 10 q-12 4 -14 -10 z" fill="#3e5527"/>` : "";
  const stripes = color === "zebra" ? `<path d="M-30 -14 L30 -22 M-34 4 L34 -2 M-28 22 L28 18" stroke="#222" stroke-width="7"/>` : "";
  return `<g>
    <path d="M0 46 q-6 14 4 26 q8 10 -2 24" stroke="#999" stroke-width="2" fill="none"/>
    <path d="M-7 44 L7 44 L0 34 Z" fill="${fill}"/>
    <ellipse cx="0" cy="0" rx="36" ry="44" fill="${fill}"/>${camo}${stripes}
    <ellipse cx="-13" cy="-20" rx="8" ry="13" fill="#fff" opacity="${dark ? 0.18 : 0.35}"/>
    ${eyes(-11, 11, -2, 8, look, blink)}
    <ellipse cx="0" cy="13" rx="4" ry="3" fill="${dark ? "#555" : "#00000055"}"/></g>`;
}

function moab(o = {}) {
  const look = o.look || 0;
  return `<g>
    <path d="M70 -14 L98 -36 L98 36 L70 14 Z" fill="#2c5fb8"/>
    <rect x="-90" y="-38" width="170" height="76" rx="38" fill="#3b82f6"/>
    <rect x="-90" y="-38" width="170" height="76" rx="38" fill="none" stroke="#1e3f7a" stroke-width="5"/>
    <path d="M-60 -38 L-60 38 M10 -38 L10 38" stroke="#1e3f7a" stroke-width="4"/>
    <text x="-25" y="10" font-size="22" font-weight="900" fill="#fff" text-anchor="middle" font-family="Segoe UI Black, Arial Black">MOAB</text>
    ${eyes(-70, -48, -8, 9, look)}</g>`;
}

// the bot: a little monitor with a face
function bot(o = {}) {
  const look = o.look || 0, blink = o.blink || 0, glow = o.glow ?? 1;
  const ec = o.eye || C.amber;
  const h = 10 * (1 - blink * 0.85);
  return `<g>
    <rect x="-20" y="52" width="40" height="18" fill="#333"/><rect x="-44" y="68" width="88" height="10" rx="4" fill="#3a3a3a"/>
    <rect x="-70" y="-58" width="140" height="112" rx="14" fill="#1b1b1b" stroke="#444" stroke-width="4"/>
    <rect x="-58" y="-46" width="116" height="88" rx="8" fill="#0d1414"/>
    <ellipse cx="${-22 + look * 6}" cy="-8" rx="10" ry="${h}" fill="${ec}" opacity="${0.4 + 0.6 * glow}"/>
    <ellipse cx="${22 + look * 6}" cy="-8" rx="10" ry="${h}" fill="${ec}" opacity="${0.4 + 0.6 * glow}"/>
    <rect x="-16" y="18" width="32" height="5" rx="2" fill="${ec}" opacity="0.7"/>
    <text x="0" y="40" font-size="11" fill="#5c7" text-anchor="middle" font-family="Consolas">python</text></g>`;
}

const at = (x, y, s, inner, extra = "") => `<g transform="translate(${x} ${y}) scale(${s})" ${extra}>${inner}</g>`;

// ---------------------------------------------------------------- chrome
function lamp(w) {
  const cx = w / 2;
  return `<div class="beam" style="left:${cx - w * 0.45}px;width:${w * 0.9}px"></div>
    <div class="lamp" style="left:${cx - 70}px"></div>`;
}

function topBox(box) {
  if (!box) return "";
  return `<div class="tbox">${box.kicker ? `<div class="kick">${esc(box.kicker)}</div>` : ""}
    <div class="big">${esc(box.big)}</div>${box.sub ? `<div class="sub">${esc(box.sub)}</div>` : ""}</div>`;
}

function statBox(st) {
  if (!st) return "";
  return `<div class="sbox"><div class="kick">${esc(st.label)}</div>
    <div class="val" style="color:${st.color || C.amber}">${esc(st.value)}</div></div>`;
}

// the caption shown at scene time t: captions are spread over the scene by
// word count (a longer sentence stays up longer)
function captionAt(scene, t) {
  const caps = scene.caps || (scene.body ? [scene.body] : []);
  if (!caps.length) return { text: "", u: 1 };
  const words = caps.map((c) => c.split(/\s+/).length);
  const total = words.reduce((a, b) => a + b, 0);
  let acc = 0;
  for (let i = 0; i < caps.length; i++) {
    const start = (acc / total) * scene.d, end = ((acc + words[i]) / total) * scene.d;
    if (t < end || i === caps.length - 1) return { text: caps[i], u: clamp((t - start) / 0.35) };
    acc += words[i];
  }
}
