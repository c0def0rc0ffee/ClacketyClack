// ClacketyClack: a full screen typing game in the Furballistics cartoon style.
// One canvas draws the whole scene (sky, sun, hills, clouds, scalloped sea and
// the falling keycaps); the DOM supplies only the HUD and the menu overlays.
// Words fall as keyboard keycaps; type them before they splash into the sea.
// Three splashes and it is game over.

'use strict';

/* ------------------------------------------------------------------ *
 * Themes: palettes borrowed from the Furballistics map themes, one is
 * picked at random per run. Pure decoration, gameplay never changes.
 * ------------------------------------------------------------------ */
const THEMES = [
  {
    name: 'meadow',
    sky: ['#6fb7e8', '#a8d8f2', '#eaf6fb'],
    hills: ['#9fc4c9', '#7fb096'],
    sun: '#fff3c0', halo: '#fff9dd', sunVisible: true,
    stars: null,
    cloud: '#ffffff',
    water: '#4585d6', waterTop: '#bfe1f2',
  },
  {
    name: 'moonlit',
    sky: ['#080e28', '#101a3e', '#1e2a54'],
    hills: ['#1d2748', '#232c4e'],
    sun: '#e8eeff', halo: '#b9c8ee', sunVisible: true,
    stars: '#dfe6ff',
    cloud: '#7c86ad',
    water: '#1f2f6b', waterTop: '#5a6cae',
  },
  {
    name: 'hell',
    sky: ['#151033', '#2a1c4a', '#4a2b52'],
    hills: ['#3a2450', '#51264a'],
    sun: '#ffd9a0', halo: '#ffb56a', sunVisible: false,
    stars: '#ffcf8a',
    cloud: '#b9a8d8',
    water: '#6a5bb5', waterTop: '#a99ae0',
  },
  {
    name: 'canyon',
    sky: ['#2a1c4a', '#83415e', '#e0854e'],
    hills: ['#5c2c50', '#8a4448'],
    sun: '#ffd9a0', halo: '#ffb56a', sunVisible: true,
    stars: null,
    cloud: '#f2c4a0',
    water: '#3f7f96', waterTop: '#9fd4e0',
  },
  {
    name: 'glacier',
    sky: ['#0c1a38', '#1d3a5f', '#4f7fa2'],
    hills: ['#24405e', '#2f4f70'],
    sun: '#e8f6ff', halo: '#cfe8f8', sunVisible: true,
    stars: '#cfe4ff',
    cloud: '#bfd4e8',
    water: '#1c4a68', waterTop: '#7fc8dc',
  },
];

/* ------------------------------------------------------------------ *
 * Difficulty tuning. Fall speeds are fractions of screen height per
 * second, so the game plays the same on any window size.
 * ------------------------------------------------------------------ */
/* SPEED is the difficulty dial and nothing else: how fast caps fall and how
 * often they arrive. It used to also decide word length, so Ultimate Badass
 * meant "fast AND fourteen letters"; length is now its own control below,
 * and the two combine however you like. `mult` is this speed's share of the
 * score, because the same word is worth more when it is falling faster. */
/* The old falls ran 0.032 to 0.050, a 56% spread across four tiers that in
 * play felt like nothing (the word length used to carry the difficulty, and
 * when that moved to its own control the tiers were left doing too little).
 * Now Ultimate Badass falls 2.7x faster than Easy and spawns nearly twice
 * as often: each step up should be felt in the wrists. */
const SPEEDS = {
  1: { label: 'Easy',            fall: 0.028, spawnMs: 2800, mult: 1 },
  2: { label: 'Medium',          fall: 0.042, spawnMs: 2300, mult: 1.3 },
  3: { label: 'Hard',            fall: 0.058, spawnMs: 1900, mult: 1.7 },
  4: { label: 'Ultimate Badass', fall: 0.075, spawnMs: 1600, mult: 2.2 },
};

/* How long the words are, chosen independently of how fast they fall.
 * Mixed is the default: the whole dictionary, longer words simply paying
 * more because they are more to type. */
const LENGTHS = {
  mixed:  { label: 'Mixed', bucket: () => true },
  short:  { label: '1-4',   bucket: (w) => w.length <= 4 },
  medium: { label: '5-7',   bucket: (w) => w.length >= 5 && w.length <= 7 },
  long:   { label: '8-12',  bucket: (w) => w.length >= 8 && w.length <= 12 },
  huge:   { label: '13+',   bucket: (w) => w.length >= 13 },
};

/*
 * Scoring. Three things earn points, exactly the three the player controls:
 *
 *   points = letters x PER_LETTER x speed multiplier x pace multiplier
 *
 * letters   what you actually had to type, so long words pay more
 * speed     the tier you chose, from 1x on Easy to 2.2x on Ultimate Badass
 * pace      how fast you got it out: your characters per second for THAT
 *           word against a reference pace, clamped at both ends so one
 *           lucky short word cannot run away with it and a slow one still
 *           scores something
 *
 * The pace clock starts at the first key of an attempt, not when the cap
 * appears, so staring at the screen costs you nothing and only typing speed
 * is measured. In letters mode there is nothing to spell, so the clock runs
 * from the previous pop and the pace multiplier measures reaction instead.
 */
const SCORE = {
  perLetter: 10,
  letterModeBase: 12, // a single cap is worth about what a short word is
  refCps: 5,          // 5 characters a second is roughly 60 wpm
  refLetterCps: 2,    // two caps a second is the pace to beat in letters mode
  minMult: 0.5,
  maxMult: 2.5,
};

const MAX_ACTIVE = 8;
const LIVES = 3;
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

/* The two ink colours everything on the canvas shares: the accent that
 * lights up typed progress (and pays out the points), and the plain text. */
const ACCENT = '#ffab3d';
const INK = '#e8eef4';

/* ------------------------------------------------------------------ *
 * DOM
 * ------------------------------------------------------------------ */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');
const hudScore = document.getElementById('hudScore');
const hudLevel = document.getElementById('hudLevel');
const hudLives = document.getElementById('hudLives');
const typedEl = document.getElementById('typed');
const bannerEl = document.getElementById('lessonBanner');
const lessonMsgEl = document.getElementById('lessonMsg');
const reviewEl = document.getElementById('review');
const learnOptsEl = document.getElementById('learnOpts');
const hardChip = document.getElementById('hardChip');
const menuEl = document.getElementById('menu');
const gameoverEl = document.getElementById('gameover');
const finalScoreEl = document.getElementById('finalScore');
const bestScoreEl = document.getElementById('bestScore');
const soundBtn = document.getElementById('soundToggle');
const bestRowEl = document.getElementById('bestRow');
const accountLineEl = document.getElementById('accountLine');
const earnedEl = document.getElementById('earned');
const menuBtn = document.getElementById('menuBtn');
const lenOptsEl = document.getElementById('lenOpts');

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */
let W = 0, H = 0, DPR = 1;
let theme = THEMES[0];
let state = 'menu'; // 'menu' | 'playing' | 'gameover'
let mode = 'words'; // 'words' | 'letters' | 'learn'
let lesson = 'vowels';   // key into LESSONS, used when mode === 'learn'
let hardMode = false;    // learn mode only: mix wrong words in as traps
let speed = 1;        // SPEEDS key: how fast caps fall, the difficulty dial
let wordLen = 'mixed'; // LENGTHS key: how long the words are, chosen separately
let score = 0;
let lives = LIVES;
let words = [];      // { text, x, y, w, h, typed, isTarget, why }
let splashed = [];   // target words that hit the sea this run
let mistakes = [];   // { text, why }: distractors the player typed
let particles = [];  // { x, y, vx, vy, life, max, color, r }
let buffer = '';
let spawnTimer = 0;
let elapsed = 0;
let shake = 0;
let usedRecently = [];
let soundOn = true;
let popped = 0;      // keycaps cleared this run
let charsTyped = 0;  // letters actually cleared, for the words-per-minute figure
let attemptStart = 0; // when the current attempt began, for the pace multiplier
let floaters = [];   // { x, y, text, life, max }: the points won, drifting up

/* Shape lesson batching: a round starts with the first few shapes of the
 * lesson's curriculum and unlocks the rest as pops are earned, so a new
 * player is never juggling twelve unfamiliar names at once. Splashed
 * shapes are weighted to come back sooner: the ones you miss are the ones
 * you need. */
const SHAPE_START_SET = 4;
const SHAPE_UNLOCK_EVERY = 3; // pops per newly unlocked shape
let shapeQueue = [];   // not yet introduced this round
let activeShapes = []; // currently in rotation
let shapeMisses = {};  // name -> times it splashed this round
let shapeUnlockPops = 0;

/* ------------------------------------------------------------------ *
 * Audio: tiny synthesized clacks, no assets. Created lazily because
 * browsers refuse an AudioContext before the first user gesture.
 * ------------------------------------------------------------------ */
let audio = null;

function playTone(freq, dur, type, gainVal) {
  if (!soundOn) return;
  if (!audio) {
    try { audio = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { return; }
  }
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(gainVal, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + dur);
}

const sfx = {
  clack: () => playTone(2200, 0.03, 'square', 0.025),
  pop: () => { playTone(660, 0.09, 'triangle', 0.09); playTone(990, 0.14, 'triangle', 0.06); },
  splash: () => playTone(140, 0.35, 'sine', 0.12),
  buzz: () => { playTone(200, 0.16, 'sawtooth', 0.07); playTone(130, 0.24, 'sawtooth', 0.05); },
  over: () => { playTone(330, 0.3, 'sawtooth', 0.06); playTone(165, 0.6, 'sawtooth', 0.06); },
};

soundBtn.addEventListener('click', () => {
  soundOn = !soundOn;
  soundBtn.classList.toggle('muted', !soundOn);
  soundBtn.blur();
});

/* ------------------------------------------------------------------ *
 * Sizing
 * ------------------------------------------------------------------ */
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resize);
resize();

/* The sea occupies the bottom of the screen; its surface is the kill line. */
function waterY() { return H * 0.86; }

/* ------------------------------------------------------------------ *
 * Deterministic star field (same trick as the Furballistics backdrop:
 * an LCG, so the sky never reshuffles between frames or loads).
 * ------------------------------------------------------------------ */
function starPoints() {
  const pts = [];
  let s = 0x51a25;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 110; i++) {
    pts.push({ fx: rnd(), fy: rnd() * 0.55, tw: rnd() * Math.PI * 2 });
  }
  return pts;
}
const STARS = starPoints();

/* Cloud puff clusters: fixed shapes, drifting x. */
function makeClouds() {
  const clouds = [];
  let s = 0xbeef;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 5; i++) {
    const puffs = [];
    const n = 3 + Math.floor(rnd() * 3);
    for (let p = 0; p < n; p++) {
      puffs.push({ dx: (p - n / 2) * 26 + rnd() * 10, dy: rnd() * 12 - 6, r: 16 + rnd() * 14 });
    }
    clouds.push({ fx: rnd(), fy: 0.08 + rnd() * 0.2, speed: 8 + rnd() * 8, puffs, drift: rnd() * 500 });
  }
  return clouds;
}
const CLOUDS = makeClouds();

/* ------------------------------------------------------------------ *
 * Backdrop drawing
 * ------------------------------------------------------------------ */
function shade(hex, mixHex, t) {
  const a = parseInt(hex.slice(1), 16), b = parseInt(mixHex.slice(1), 16);
  const ar = a >> 16, ag = (a >> 8) & 255, ab = a & 255;
  const br = b >> 16, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

function drawSky() {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, theme.sky[0]);
  grad.addColorStop(0.65, theme.sky[1]);
  grad.addColorStop(1, theme.sky[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawStars(t) {
  if (!theme.stars) return;
  ctx.fillStyle = theme.stars;
  for (const st of STARS) {
    const a = 0.45 + 0.55 * Math.abs(Math.sin(t * 0.6 + st.tw));
    ctx.globalAlpha = a;
    ctx.fillRect(st.fx * W, st.fy * H, 2.4, 2.4);
  }
  ctx.globalAlpha = 1;
}

function drawSun() {
  if (!theme.sunVisible) return;
  const x = W * 0.18, y = H * 0.16, r = Math.min(W, H) * 0.055;
  const halo = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 2.4);
  halo.addColorStop(0, theme.halo + 'cc');
  halo.addColorStop(1, theme.halo + '00');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = theme.sun;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/* Rolling silhouette ridges: the same two layer sine mix as Furballistics. */
function drawHills() {
  const layers = [
    { color: theme.hills[0], base: 0.74, amp: 0.10, phase: 1.7, f1: 0.006, f2: 0.015 },
    { color: theme.hills[1], base: 0.80, amp: 0.11, phase: 4.2, f1: 0.007, f2: 0.017 },
  ];
  for (const L of layers) {
    ctx.fillStyle = L.color;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 6) {
      const y = H * L.base
        - H * L.amp * (0.6 * Math.sin(x * L.f1 + L.phase) + 0.4 * Math.sin(x * L.f2 + L.phase * 2.7));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }
}

function drawClouds(t) {
  const lite = shade(theme.cloud, '#ffffff', 0.6);
  const dark = shade(theme.cloud, theme.sky[1], 0.45);
  for (const c of CLOUDS) {
    const span = W + 240;
    const x = ((c.fx * span + (t * c.speed + c.drift)) % span) - 120;
    const y = c.fy * H;
    // Shadow underbelly first, then the body, so the cloud reads as shaded.
    for (const pass of [{ color: dark, oy: 5 }, { color: lite, oy: 0 }]) {
      ctx.fillStyle = pass.color;
      ctx.beginPath();
      for (const p of c.puffs) {
        ctx.moveTo(x + p.dx + p.r, y + p.dy + pass.oy);
        ctx.arc(x + p.dx, y + p.dy + pass.oy, p.r, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  }
}

/* The Worms sea: a deep fill topped with three scalloped rows, each with
 * its own bob, drift and sway (the same motion model as the reference). */
const SCALLOP = 72;

function drawSeaRow(color, topY, drift, depth) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-SCALLOP * 2 + drift, topY + depth);
  ctx.lineTo(-SCALLOP * 2 + drift, topY);
  for (let x = -SCALLOP * 2; x < W + SCALLOP * 2; x += SCALLOP) {
    ctx.quadraticCurveTo(x + drift + SCALLOP / 2, topY - 17, x + drift + SCALLOP, topY);
  }
  ctx.lineTo(W + SCALLOP * 2 + drift, topY + depth);
  ctx.closePath();
  ctx.fill();
}

function drawSea(t) {
  const top = waterY();
  const deep = shade(theme.water, '#000020', 0.42);
  ctx.fillStyle = deep;
  ctx.fillRect(0, top, W, H - top);
  const tones = [
    shade(theme.waterTop, theme.water, 0.15),
    shade(theme.waterTop, theme.water, 0.62),
    shade(theme.water, '#000020', 0.28),
  ];
  for (let i = 0; i < 3; i++) {
    const dir = i % 2 ? -1 : 1;
    const speed = 14 + i * 7;
    const freq = 0.8 + i * 0.27;
    const drift = (((t * speed * dir) % SCALLOP) + SCALLOP) % SCALLOP - SCALLOP / 2;
    const sway = Math.sin(t * freq * 0.6 + i * 2.4) * 8;
    const bob = Math.sin(t * freq + i * 1.9) * 6;
    drawSeaRow(tones[i], top + 6 + i * 14 + bob, drift + sway, H);
  }
}

/* ------------------------------------------------------------------ *
 * Falling keycaps
 * ------------------------------------------------------------------ */
const CAP_FONT = "22px 'Semi-Coder', 'Courier New', monospace";
// Warm the font up front so the first keycaps never render in the fallback.
if (document.fonts && document.fonts.load) document.fonts.load(CAP_FONT, 'abc');
const CAP_PAD_X = 14;
const CAP_H = 42;

function measureCap(text) {
  ctx.font = CAP_FONT;
  return Math.max(CAP_H, Math.ceil(ctx.measureText(text).width) + CAP_PAD_X * 2);
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/* Draw `disp` centred in a cap of width `w` at `x`, the first `typed`
 * letters in the accent, the rest in plain ink at `restAlpha`. The caller
 * sets the font; both the word caps and the shape name lines land here. */
function drawTypedText(disp, typed, x, w, ty, restAlpha = 1) {
  const done = disp.slice(0, typed);
  const rest = disp.slice(typed);
  let tx = x + (w - ctx.measureText(disp).width) / 2;
  if (done) {
    ctx.fillStyle = ACCENT;
    ctx.fillText(done, tx, ty);
    tx += ctx.measureText(done).width;
  }
  if (rest) {
    ctx.globalAlpha = restAlpha;
    ctx.fillStyle = INK;
    ctx.fillText(rest, tx, ty);
    ctx.globalAlpha = 1;
  }
}

function drawCap(wrd) {
  const { x, y, w, h } = wrd;
  // Key side / depth.
  ctx.fillStyle = 'rgba(6, 11, 17, 0.85)';
  roundRect(ctx, x, y + 4, w, h, 9);
  ctx.fill();
  // Dished face.
  const face = ctx.createLinearGradient(0, y, 0, y + h);
  face.addColorStop(0, '#243447');
  face.addColorStop(1, '#16212e');
  ctx.fillStyle = face;
  roundRect(ctx, x, y, w, h, 9);
  ctx.fill();
  // Top highlight and hairline border.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1;
  roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 8.5);
  ctx.stroke();
  if (wrd.shape) {
    // A drawn shape instead of text. The outline picks up the typed accent
    // as you make progress, so the cap answers you even when its name is
    // hidden; in the labelled lesson the name sits underneath with the
    // usual typed-prefix highlight.
    const cx = x + w / 2;
    const cy = y + SHAPE_CAP_H / 2 + 2;
    const active = wrd.typed > 0;
    if (wrd.glyphs === 'colours') {
      // A filled swatch: the colour itself is the prompt. The hairline
      // keeps black and white legible on the cap face, and typing
      // progress shows as the accent ring since the fill is spoken for.
      roundRect(ctx, cx - 21, cy - 21, 42, 42, 10);
      ctx.fillStyle = COLOURS[wrd.shape];
      ctx.fill();
      ctx.strokeStyle = active ? ACCENT : 'rgba(232, 238, 244, 0.55)';
      ctx.lineWidth = active ? 3 : 1.5;
      ctx.stroke();
    } else {
      SHAPES[wrd.shape](ctx, cx, cy, 19);
      ctx.fillStyle = active ? 'rgba(255, 171, 61, 0.22)' : 'rgba(232, 238, 244, 0.1)';
      ctx.fill();
      ctx.strokeStyle = active ? ACCENT : INK;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    if (wrd.reveal !== 'none') {
      // The name line under the shape, per the lesson's scaffold:
      //   delay  hidden at first (guess now!), then fades in
      //   hint   first letter real, the rest dots
      // Typed letters always show in accent orange, whatever the scaffold:
      // your own keystrokes are never hidden from you.
      const full = wrd.text;
      let disp, restAlpha = 1;
      if (wrd.reveal === 'hint') {
        disp = full.split('').map((ch, i) => (i < wrd.typed || i === 0) ? ch : '·').join('');
      } else if (wrd.age >= SHAPE_REVEAL_SECS) {
        disp = full;
        restAlpha = Math.min(1, (wrd.age - SHAPE_REVEAL_SECS) / 0.4);
      } else {
        disp = full.slice(0, wrd.typed);
      }
      if (disp) {
        ctx.font = SHAPE_FONT;
        ctx.textBaseline = 'middle';
        drawTypedText(disp, wrd.typed, x, w, y + SHAPE_CAP_H + SHAPE_NAME_H / 2 - 3, restAlpha);
      }
    }
    return;
  }
  // Text: the typed prefix lights up in accent orange.
  ctx.font = CAP_FONT;
  ctx.textBaseline = 'middle';
  drawTypedText(wrd.text, wrd.typed, x, w, y + h / 2 + 1);
}

/* ------------------------------------------------------------------ *
 * Particles: pops and splashes
 * ------------------------------------------------------------------ */
function burst(x, y, color, n, speed, up) {
  for (let i = 0; i < n; i++) {
    const a = up ? (-Math.PI / 2 + (Math.random() - 0.5) * 1.6) : Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.6);
    particles.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: 0,
      max: 0.5 + Math.random() * 0.45,
      color,
      r: 2 + Math.random() * 3,
    });
  }
}

function drawParticles(dt) {
  for (const p of particles) {
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 900 * dt;
    const a = Math.max(0, 1 - p.life / p.max);
    if (a <= 0) continue;
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  particles = particles.filter((p) => p.life < p.max);
}

/* The points won by each pop, drifting up from where the cap was. With
 * length, speed and pace all in the sum, the number is worth showing:
 * it is the only way to see the formula reward you for typing faster. */
function drawFloaters(dt) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of floaters) {
    f.life += dt;
    f.y -= 46 * dt;
    const a = Math.max(0, 1 - f.life / f.max);
    if (a <= 0) continue;
    ctx.globalAlpha = a;
    ctx.font = `700 ${Math.min(30, Math.round(20 + f.text.length * 1.5))}px Fredoka, system-ui, sans-serif`;
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(12, 20, 28, 0.85)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = ACCENT;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.restore();
  floaters = floaters.filter((f) => f.life < f.max);
}

/* ------------------------------------------------------------------ *
 * Game logic
 * ------------------------------------------------------------------ */
function wordPool() {
  if (mode !== 'words') return null;
  return WORDS.filter(LENGTHS[wordLen].bucket);
}
let pool = [];

/* True when a single keypress pops a cap (letters mode, or a letters
 * style lesson like vowels). */
function letterStyle() {
  return mode === 'letters' || (mode === 'learn' && LESSONS[lesson].style === 'letters');
}

/* True when the falling caps carry a drawn shape: the shape lessons. The
 * player still types the full name, so everything downstream behaves like
 * words style; only the cap's face and size differ. */
function shapeStyle() {
  return mode === 'learn' && LESSONS[lesson].style === 'shapes';
}

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* Every falling cap is an entry: distractors are the hard mode traps. */
function pickEntry() {
  if (mode === 'letters') {
    return { text: rand(LETTERS), isTarget: true, why: '' };
  }
  if (shapeStyle()) {
    // Pick from the unlocked batch, preferring shapes not already on
    // screen, weighted toward the ones that have splashed.
    const onScreen = new Set(words.map((w) => w.text));
    let cands = activeShapes.filter((n) => !onScreen.has(n));
    if (cands.length === 0) cands = activeShapes;
    let total = 0;
    const cum = cands.map((n) => (total += 1 + (shapeMisses[n] || 0) * 2));
    const roll = Math.random() * total;
    const name = cands[cum.findIndex((c) => roll < c)];
    return { text: name, isTarget: true, why: '' };
  }
  if (mode === 'learn') {
    const L = LESSONS[lesson];
    // Lessons without distractors (the shape ones) simply have no traps.
    const trap = hardMode && L.distractors.length > 0 && Math.random() < 0.4;
    if (L.style === 'letters') {
      if (trap) { const d = rand(L.distractors); return { text: d.text, isTarget: false, why: d.why }; }
      return { text: rand(L.targets), isTarget: true, why: L.whyTarget };
    }
    let entry, tries = 0;
    do {
      if (trap) { const d = rand(L.distractors); entry = { text: d.text, isTarget: false, why: d.why }; }
      else entry = { text: rand(L.targets), isTarget: true, why: L.whyTarget };
      tries++;
    } while ((usedRecently.includes(entry.text) || words.some((a) => a.text === entry.text)) && tries < 40);
    usedRecently.push(entry.text);
    if (usedRecently.length > 25) usedRecently.shift();
    return entry;
  }
  let w, tries = 0;
  do {
    w = pool[Math.floor(Math.random() * pool.length)];
    tries++;
  } while ((usedRecently.includes(w) || words.some((a) => a.text === w)) && tries < 40);
  usedRecently.push(w);
  if (usedRecently.length > 25) usedRecently.shift();
  return { text: w, isTarget: true, why: '' };
}

/* Shape caps are squarer than text caps: room for the drawing, plus a
 * name line underneath in the labelled lesson. */
const SHAPE_FONT = "15px 'Semi-Coder', 'Courier New', monospace";
const SHAPE_CAP_W = 84;
const SHAPE_CAP_H = 66;
const SHAPE_NAME_H = 22;

/* How long a delayed label stays hidden: long enough to attempt a recall,
 * short enough that a stuck player is not punished. */
const SHAPE_REVEAL_SECS = 1.4;

function spawnWord() {
  if (words.length >= MAX_ACTIVE) return;
  const entry = pickEntry();
  const text = entry.text;
  const isShape = shapeStyle();
  const reveal = isShape ? LESSONS[lesson].reveal : null;
  let w;
  if (isShape) {
    // Wide enough for the drawing AND the name line ("parallelogram"
    // outgrows the default square cap).
    ctx.font = SHAPE_FONT;
    w = reveal !== 'none'
      ? Math.max(SHAPE_CAP_W, Math.ceil(ctx.measureText(text).width) + 18)
      : SHAPE_CAP_W;
  } else {
    w = measureCap(text);
  }
  const h = isShape ? SHAPE_CAP_H + (reveal !== 'none' ? SHAPE_NAME_H : 0) : CAP_H;
  let x = 0, tries = 0, overlap;
  do {
    x = 10 + Math.random() * Math.max(1, W - w - 20);
    overlap = words.some((a) => a.y < a.h * 2.4 && x < a.x + a.w + 12 && a.x < x + w + 12);
    tries++;
  } while (overlap && tries < 30);
  words.push({
    text, x, y: -h - 4, w, h, typed: 0, age: 0,
    isTarget: entry.isTarget, why: entry.why,
    shape: isShape ? text : null, reveal,
    glyphs: isShape ? LESSONS[lesson].glyphs : null,
  });
}

/* Speed ramps gently with time survived, capped so it stays typeable. */
function fallSpeed() {
  const ramp = Math.min(1.9, 1 + elapsed / 90);
  return H * SPEEDS[speed].fall * ramp;
}

function spawnEvery() {
  const ramp = Math.max(0.55, 1 - elapsed / 150);
  return SPEEDS[speed].spawnMs * ramp;
}

function updateGame(dt) {
  elapsed += dt;
  spawnTimer += dt * 1000;
  if (spawnTimer >= spawnEvery()) {
    spawnTimer = 0;
    spawnWord();
  }
  const vy = fallSpeed();
  const kill = waterY();
  for (const wrd of [...words]) {
    wrd.age += dt;
    wrd.y += vy * dt;
    if (wrd.y + wrd.h >= kill) {
      removeWord(wrd);
      if (!wrd.isTarget) {
        // A trap fell in untyped: exactly right, small splash, no penalty.
        burst(wrd.x + wrd.w / 2, kill + 4, theme.waterTop, 12, 180, true);
        sfx.splash();
        continue;
      }
      if (wrd.shape) {
        // Corrective feedback at the moment it matters: the name you could
        // not summon rises from the splash, paired with the shape you just
        // watched sink. It also comes back sooner (see pickEntry).
        shapeMisses[wrd.text] = (shapeMisses[wrd.text] || 0) + 1;
        floaters.push({ x: wrd.x + wrd.w / 2, y: kill - 30, text: wrd.text, life: 0, max: 1.7 });
      }
      burst(wrd.x + wrd.w / 2, kill + 4, theme.waterTop, 26, 260, true);
      sfx.splash();
      shake = 0.35;
      if (!splashed.includes(wrd.text)) splashed.push(wrd.text);
      loseLife();
    }
  }
}

function removeWord(wrd) {
  words.splice(words.indexOf(wrd), 1);
}

function loseLife() {
  lives--;
  refreshHud();
  if (lives <= 0) endGame();
}

/* Characters per second for the attempt just finished, against the pace
 * this mode expects. Floored at a tenth of a second so a paste or a stuck
 * key cannot mint points. */
function paceMult(letters) {
  const secs = Math.max(0.1, (performance.now() - attemptStart) / 1000);
  const ref = letterStyle() ? SCORE.refLetterCps : SCORE.refCps;
  const cps = letters / secs;
  return Math.min(SCORE.maxMult, Math.max(SCORE.minMult, cps / ref));
}

/* What one cap is worth: letters x speed x pace. See the SCORE comment. */
function scoreFor(wrd) {
  const letters = wrd.text.length;
  const base = letterStyle() ? SCORE.letterModeBase : SCORE.perLetter * letters;
  return Math.max(1, Math.round(base * SPEEDS[speed].mult * paceMult(letters)));
}

function popWord(wrd) {
  removeWord(wrd);
  const gain = scoreFor(wrd);
  score += gain;
  popped++;
  // Counted from what was cleared, not from keystrokes: backspacing and
  // dead ends should not flatter or punish the words-per-minute figure.
  charsTyped += wrd.text.length;
  floaters.push({
    x: wrd.x + wrd.w / 2, y: wrd.y + wrd.h / 2,
    text: '+' + gain, life: 0, max: 0.9,
  });
  // Shape lessons: pops earn the next shape out of the curriculum queue.
  if (wrd.shape && shapeQueue.length > 0) {
    shapeUnlockPops++;
    if (shapeUnlockPops >= SHAPE_UNLOCK_EVERY) {
      shapeUnlockPops = 0;
      activeShapes.push(shapeQueue.shift());
    }
  }
  burst(wrd.x + wrd.w / 2, wrd.y + wrd.h / 2, ACCENT, 22, 330, false);
  burst(wrd.x + wrd.w / 2, wrd.y + wrd.h / 2, INK, 10, 220, false);
  sfx.pop();
  refreshHud();
}

/* Pop every cap carrying this text at once: duplicates can spawn when the
 * pool is small, and one keystroke finishing the word should clear them
 * ALL, each paying full points at the same pace. The pace clock resets
 * once per clearance, not per cap, so the second twin scores exactly like
 * the first instead of at a fake instant pace. */
function popAllMatching(list) {
  for (const wrd of list) popWord(wrd);
  // The next attempt's pace clock starts here: in letters mode that makes
  // it a reaction time, which is the only thing there is to measure.
  attemptStart = performance.now();
}

/* The player typed a hard mode trap: take points, explain the mistake. */
function mistakePop(wrd) {
  removeWord(wrd);
  score = Math.max(0, score - 10);
  burst(wrd.x + wrd.w / 2, wrd.y + wrd.h / 2, '#ff6b5e', 22, 300, false);
  sfx.buzz();
  shake = 0.2;
  flashLesson(`'${wrd.text}' is ${wrd.why}, not ${LESSONS[lesson].whyTarget}!`);
  if (!mistakes.some((m) => m.text === wrd.text)) mistakes.push({ text: wrd.text, why: wrd.why });
  refreshHud();
}

function flashLesson(msg) {
  lessonMsgEl.textContent = msg;
  lessonMsgEl.classList.remove('hidden', 'show');
  void lessonMsgEl.offsetWidth; // restart the animation
  lessonMsgEl.classList.add('show');
}

function refreshHud() {
  hudScore.textContent = `Score: ${score}`;
  hudLevel.textContent = mode === 'learn'
    ? `${LESSONS[lesson].title}${hardMode ? ' (hard)' : ''} - ${SPEEDS[speed].label}`
    : `${SPEEDS[speed].label}${mode === 'letters' ? ' (letters)' : ` - ${LENGTHS[wordLen].label}`}`;
  hudLives.textContent = '❤️'.repeat(lives) + '🖤'.repeat(LIVES - lives);
}

function setBuffer(v) {
  // First letter of an attempt: start the pace clock here, so time spent
  // reading the screen before committing to a word is never counted.
  if (!buffer && v) attemptStart = performance.now();
  buffer = v;
  typedEl.textContent = buffer;
  for (const wrd of words) {
    wrd.typed = buffer && wrd.text.startsWith(buffer) ? buffer.length : 0;
  }
}

function deadEndFlash() {
  typedEl.classList.remove('dead-end');
  void typedEl.offsetWidth; // restart the animation
  typedEl.classList.add('dead-end');
}

function onKey(e) {
  if (state !== 'playing') return;
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  if (e.key === 'Backspace') {
    setBuffer(buffer.slice(0, -1));
    e.preventDefault();
    return;
  }
  if (e.key === 'Escape') {
    setBuffer('');
    return;
  }
  if (e.key.length !== 1) return;
  const ch = e.key.toLowerCase();
  if (!/[a-z]/.test(ch)) return;
  sfx.clack();

  if (letterStyle()) {
    // Pop EVERY matching letter at once; twins all count. A matching trap
    // only stings if there was no true target to pop, and only once.
    const same = words.filter((w) => w.text === ch);
    const targets = same.filter((w) => w.isTarget);
    if (targets.length) popAllMatching(targets);
    else if (same.length) mistakePop(same.sort((a, b) => b.y - a.y)[0]);
    return;
  }

  const next = buffer + ch;
  const same = words.filter((w) => w.text === next);
  if (same.length) {
    const targets = same.filter((w) => w.isTarget);
    if (targets.length) popAllMatching(targets);
    else mistakePop(same[0]);
    setBuffer('');
    return;
  }
  setBuffer(next);
  if (!words.some((w) => w.text.startsWith(next))) deadEndFlash();
}
document.addEventListener('keydown', onKey);

/* ------------------------------------------------------------------ *
 * Screens
 * ------------------------------------------------------------------ */
function startGame(lvl) {
  speed = lvl;
  theme = THEMES[Math.floor(Math.random() * THEMES.length)];
  pool = wordPool() || [];
  words = [];
  particles = [];
  floaters = [];
  attemptStart = performance.now();
  if (shapeStyle()) {
    shapeQueue = [...LESSONS[lesson].targets]; // curriculum order, easy first
    activeShapes = shapeQueue.splice(0, SHAPE_START_SET);
    shapeMisses = {};
    shapeUnlockPops = 0;
  }
  usedRecently = [];
  splashed = [];
  mistakes = [];
  score = 0;
  lives = LIVES;
  elapsed = 0;
  popped = 0;
  charsTyped = 0;
  spawnTimer = 0;
  setBuffer('');
  state = 'playing';
  menuEl.classList.add('hidden');
  gameoverEl.classList.add('hidden');
  hud.classList.remove('hidden');
  soundBtn.classList.remove('hidden');
  menuBtn.classList.remove('hidden');
  typedEl.classList.toggle('hidden', letterStyle());
  if (mode === 'learn') {
    const L = LESSONS[lesson];
    bannerEl.innerHTML = '';
    const strong = document.createElement('strong');
    strong.textContent = L.title;
    bannerEl.append(strong, ` ${L.banner}`);
    bannerEl.classList.remove('hidden');
  } else {
    bannerEl.classList.add('hidden');
  }
  lessonMsgEl.classList.add('hidden');
  refreshHud();
  spawnWord();
}

/* End of round review: the splashed and mixed up words are where the
 * learning lands, so show them, not just the score. */
function buildReview() {
  reviewEl.innerHTML = '';
  const lines = [];
  if (splashed.length) lines.push(`Splashed: ${splashed.slice(0, 8).join(', ')}`);
  for (const m of mistakes.slice(0, 6)) {
    lines.push(`'${m.text}' is ${m.why}, not ${LESSONS[lesson].whyTarget}`);
  }
  if (!lines.length) {
    reviewEl.classList.add('hidden');
    return;
  }
  const head = document.createElement('p');
  head.className = 'review-head';
  head.textContent = 'Words to practise';
  reviewEl.append(head);
  for (const line of lines) {
    const p = document.createElement('p');
    p.textContent = line;
    reviewEl.append(p);
  }
  reviewEl.classList.remove('hidden');
}

/* How this round is described to the player: mode, and whatever else was
 * chosen that changes what the score means. */
function roundLabel() {
  if (mode === 'learn') return `${LESSONS[lesson].title}, ${SPEEDS[speed].label}`;
  if (mode === 'letters') return SPEEDS[speed].label;
  return `${SPEEDS[speed].label}, ${LENGTHS[wordLen].label}`;
}

/* The slot name a best score is kept under, in the browser AND in the
 * account. Defaults to the speed being played; the menu asks for the other
 * speeds to fill its scoreboard.
 *
 * Word length is part of the key: 13+ letter monsters pay several times
 * what 1-4 does, so a single best per speed would just be whichever length
 * you last played long enough. Words-mode bests recorded before length
 * became its own control used the old shorter key and are simply no longer
 * read; the scoring formula changed under them anyway. */
function bestKey(lvl = speed) {
  const dims = mode === 'learn'
    ? '-' + lesson + (hardMode ? '-hard' : '') + '-'
    : (mode === 'words' ? '-' + wordLen + '-' : '');
  return 'cc-best-' + mode + dims + lvl;
}

function endGame() {
  state = 'gameover';
  words = [];
  sfx.over();
  const key = bestKey();
  // The account may hold a higher score from another machine, so beat the
  // best of both. ccBestFor falls back to localStorage alone when signed out.
  const best = Math.max(score, ccBestFor(key));
  localStorage.setItem(key, String(best));
  finalScoreEl.textContent = `Score: ${score}`;
  const label = roundLabel();
  bestScoreEl.textContent = `Best (${label}): ${best}`;
  reportRound(key, best);
  buildReview();
  typedEl.classList.add('hidden');
  bannerEl.classList.add('hidden');
  lessonMsgEl.classList.add('hidden');
  menuBtn.classList.add('hidden');
  gameoverEl.classList.remove('hidden');
}

/* Send the finished round to the platform and celebrate anything it earned.
 * Fire and forget: the game over screen is already up and nothing below is
 * allowed to hold it back or break it. Guests never get this far into the
 * server, which answers them a polite "not recorded". */
function reportRound(key, best) {
  earnedEl.classList.add('hidden');
  earnedEl.innerHTML = '';
  ccReportRound({
    mode,
    level: speed,
    wordLen: mode === 'words' ? wordLen : '',
    lesson: mode === 'learn' ? lesson : '',
    hard: mode === 'learn' && hardMode,
    score,
    wordsPopped: popped,
    charsTyped,
    splashed: splashed.length,
    mistakes: mistakes.length,
    durationSecs: Math.round(elapsed),
  }, key, best).then((fresh) => {
    renderScores();
    if (!fresh.length) return;
    const head = document.createElement('p');
    head.className = 'review-head';
    head.textContent = fresh.length > 1 ? 'Commendations earned' : 'Commendation earned';
    earnedEl.append(head);
    for (const a of fresh) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = a.name;
      p.append(strong, ` - ${a.desc}`);
      earnedEl.append(p);
    }
    earnedEl.classList.remove('hidden');
  });
}

/* The menu scoreboard: your best on each level of the mode currently
 * selected, and who you are playing as. Redrawn whenever the selection
 * changes or the account is re-read, so it always describes what pressing
 * a level button right now would be measured against. */
function renderScores() {
  bestRowEl.innerHTML = '';
  for (const lvl of [1, 2, 3, 4]) {
    const best = ccBestFor(bestKey(lvl));
    const cell = document.createElement('div');
    cell.className = 'best-cell';
    const name = document.createElement('span');
    name.className = 'best-label';
    name.textContent = SPEEDS[lvl].label;
    const val = document.createElement('span');
    val.className = 'best-value' + (best > 0 ? '' : ' none');
    val.textContent = best > 0 ? best.toLocaleString() : '-';
    cell.append(name, val);
    bestRowEl.append(cell);
  }

  accountLineEl.innerHTML = '';
  if (ccAccount.loggedIn) {
    const who = document.createElement('span');
    who.textContent = `Signed in as ${ccAccount.username}`;
    const rec = document.createElement('a');
    rec.href = CC_RECORD_URL;
    rec.target = '_blank';
    rec.rel = 'noopener';
    rec.textContent = ccAccount.total
      ? `Service Record (${ccAccount.earnedCount}/${ccAccount.total} commendations)`
      : 'Service Record';
    accountLineEl.append(who, ' · ', rec);
  } else {
    const who = document.createElement('span');
    who.textContent = 'Playing as a guest, scores saved in this browser only.';
    const link = document.createElement('a');
    link.href = CC_SIGNIN_URL;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Sign in';
    accountLineEl.append(who, ' ', link);
  }
}

function backToMenu() {
  state = 'menu';
  words = [];
  particles = [];
  renderScores();
  gameoverEl.classList.add('hidden');
  hud.classList.add('hidden');
  soundBtn.classList.add('hidden');
  menuBtn.classList.add('hidden');
  typedEl.classList.add('hidden');
  bannerEl.classList.add('hidden');
  lessonMsgEl.classList.add('hidden');
  menuEl.classList.remove('hidden');
}

const MODE_BLURBS = {
  words: 'Type the falling words before they splash into the sea.',
  letters: 'One key, one pop. No spelling required.',
  learn: 'Pick a lesson: the game teaches while you type.',
};
const modeBlurbEl = document.getElementById('modeBlurb');

/* Each menu group is pick-one-of-many: move the highlight, apply the choice,
 * redraw the scoreboard (every choice changes which bests are shown). */
function wireExclusive(selector, apply) {
  const group = document.querySelectorAll(selector);
  for (const el of group) {
    el.addEventListener('click', () => {
      for (const other of group) other.classList.remove('selected');
      el.classList.add('selected');
      apply(el);
      renderScores();
    });
  }
}

wireExclusive('#modeSeg .seg-btn', (btn) => {
  mode = btn.dataset.mode;
  modeBlurbEl.textContent = MODE_BLURBS[mode];
  learnOptsEl.classList.toggle('hidden', mode !== 'learn');
  lenOptsEl.classList.toggle('hidden', mode !== 'words');
});
wireExclusive('.len-chip', (chip) => { wordLen = chip.dataset.len; });
wireExclusive('.lesson-card', (card) => { lesson = card.dataset.lesson; });
hardChip.addEventListener('click', () => {
  hardMode = !hardMode;
  hardChip.classList.toggle('on', hardMode);
  hardChip.querySelector('.toggle-state').textContent = hardMode ? 'ON' : 'OFF';
  renderScores();
});

/* Deep link: #letters or #learn preselects that mode (bookmarkable). */
{
  const linked = document.querySelector(`#modeSeg [data-mode="${location.hash.slice(1)}"]`);
  if (linked) linked.click();
}
for (const btn of document.querySelectorAll('#menu .keybtn')) {
  btn.addEventListener('click', () => startGame(Number(btn.dataset.level)));
}
document.getElementById('btnRestart').addEventListener('click', () => startGame(speed));
document.getElementById('btnMenu').addEventListener('click', backToMenu);
/* Quitting mid round: the round is abandoned, so nothing is reported and no
 * best is touched, exactly as walking away has always behaved. */
menuBtn.addEventListener('click', backToMenu);

/* Account: draw the scoreboard immediately from localStorage, then redraw
 * once the platform answers. Signing in happens in another tab, so re-read
 * whenever this one is looked at again: come back signed in and the menu
 * has already caught up. */
renderScores();
ccRefresh().then(renderScores);
window.addEventListener('focus', () => {
  if (state === 'menu') ccRefresh().then(renderScores);
});

/* ------------------------------------------------------------------ *
 * Menu mascots: two keycap characters flanking the title, blinking on
 * their own clocks like the Furballistics title cats.
 * ------------------------------------------------------------------ */
function drawMascot(cv, pal, shut) {
  const c = cv.getContext('2d');
  c.clearRect(0, 0, 160, 160);
  // Key side, then the dished face, same build as the falling caps.
  c.fillStyle = pal.side;
  roundRect(c, 18, 38, 124, 110, 24);
  c.fill();
  const g = c.createLinearGradient(0, 28, 0, 140);
  g.addColorStop(0, pal.hi);
  g.addColorStop(1, pal.lo);
  c.fillStyle = g;
  roundRect(c, 18, 28, 124, 110, 24);
  c.fill();
  c.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  c.lineWidth = 3;
  roundRect(c, 24, 34, 112, 98, 19);
  c.stroke();
  // Cheeks.
  c.fillStyle = 'rgba(255, 110, 110, 0.38)';
  c.beginPath();
  c.arc(46, 99, 9, 0, Math.PI * 2);
  c.moveTo(123, 99);
  c.arc(114, 99, 9, 0, Math.PI * 2);
  c.fill();
  // Eyes: big and glossy, or two happy shut arcs mid-blink.
  c.lineCap = 'round';
  if (shut) {
    c.strokeStyle = pal.side;
    c.lineWidth = 5;
    c.beginPath();
    c.arc(58, 74, 10, Math.PI * 0.15, Math.PI * 0.85);
    c.stroke();
    c.beginPath();
    c.arc(102, 74, 10, Math.PI * 0.15, Math.PI * 0.85);
    c.stroke();
  } else {
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(58, 76, 13, 0, Math.PI * 2);
    c.moveTo(115, 76);
    c.arc(102, 76, 13, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#16212e';
    c.beginPath();
    c.arc(60, 79, 6, 0, Math.PI * 2);
    c.moveTo(110, 79);
    c.arc(104, 79, 6, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(62, 77, 2.2, 0, Math.PI * 2);
    c.moveTo(108, 77);
    c.arc(106, 77, 2.2, 0, Math.PI * 2);
    c.fill();
  }
  // Smile.
  c.strokeStyle = pal.side;
  c.lineWidth = 5;
  c.beginPath();
  c.arc(80, 97, 15, Math.PI * 0.2, Math.PI * 0.8);
  c.stroke();
}

const MASCOTS = [
  {
    cv: document.getElementById('mascotL'),
    pal: { hi: '#ffc670', lo: '#f09a2b', side: '#9a5714' },
    nextBlink: performance.now() + 1800,
    shut: false,
  },
  {
    cv: document.getElementById('mascotR'),
    pal: { hi: '#8ab4e6', lo: '#4a7ec2', side: '#26466b' },
    nextBlink: performance.now() + 3300,
    shut: false,
  },
];
for (const m of MASCOTS) drawMascot(m.cv, m.pal, false);

/* Redraw only on a blink edge, so the menu costs nothing per frame. */
function blinkMascots(now) {
  for (const m of MASCOTS) {
    if (!m.shut && now >= m.nextBlink) {
      m.shut = true;
      drawMascot(m.cv, m.pal, true);
    } else if (m.shut && now >= m.nextBlink + 150) {
      m.shut = false;
      m.nextBlink = now + 2500 + Math.random() * 3500;
      drawMascot(m.cv, m.pal, false);
    }
  }
}

/* ------------------------------------------------------------------ *
 * Main loop
 * ------------------------------------------------------------------ */
/* Read-only state peek for tests and debugging (top level lets are not
 * window properties, so tooling cannot see them without this). */
window.__cc = {
  get: () => ({ state, mode, lesson, hardMode, speed, wordLen, score, lives, buffer, mistakes, splashed, words: words.map((w) => w.text) }),
  debug: {
    splash: (t) => splashed.push(t),
    mistake: (t, why) => mistakes.push({ text: t, why }),
    loseLife,
  },
};

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = now / 1000;

  if (state === 'playing') updateGame(dt);
  if (state === 'menu') blinkMascots(now);
  if (shake > 0) shake = Math.max(0, shake - dt);

  ctx.save();
  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake * 14, (Math.random() - 0.5) * shake * 14);
  }
  drawSky();
  drawStars(t);
  drawSun();
  drawHills();
  drawClouds(t);
  for (const wrd of words) drawCap(wrd);
  drawSea(t);
  drawParticles(dt);
  drawFloaters(dt);
  ctx.restore();

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
