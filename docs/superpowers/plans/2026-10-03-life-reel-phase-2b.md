# Life Reel — Phase 2b (Chapter 1 Revisions) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply Yimeng's chapter 1 review. The Eiffel Tower becomes an open lattice. The Nürburgring becomes a chase-camera lap in the *white* Golf GTI, with constant bends, climbs and drops and a crest jump. Lisbon's street gets a believable hillside: a retaining wall instead of a bare cobble triangle. Trolltunga becomes a golden-hour fjord.

**Architecture:** Same scene contract as Phase 2: `{ build(W, H) → { layers, … }, render(ctx, t, scene, env) }`. Three shots are rewritten whole: `ring.js`, `lisbon.js` and `trolltunga.js`. The Nürburgring switches to a pseudo-3D road, with track segments projected near to far, clipped behind crests, and trees as scaled triangles. `train.js` gets a hand-drawn lattice tower and taller windows. `kit.js` gains `paint()`, which turns pixel art into a Painter layer.

**Tech Stack:** Vanilla JS (ES modules, Canvas 2D), Node 25 `node:test`, headless Chrome review tools from Phase 2.

**Spec:** `docs/superpowers/specs/2026-10-03-life-reel-design.md`. **Builds on:** `docs/superpowers/plans/2026-10-03-life-reel-phase-2.md`.

## Global Constraints

- Everything in the Phase 2 plan's Global Constraints still holds (no build step, English captions, deterministic scenes, golden tests untouched, branch `life-reel`, no merge, no push).
- The Golf GTI is **white**, keeps the red grille stripe and red tail lights, and is seen from behind on a narrow, winding, hilly forest road.
- Chapter 1 grows to 17.5 s, because the Nürburgring shot lengthens from 2 s to 2.5 s. The page-check times (19, 25, 31, 39) still fall inside the stand-in chapters, so `page-check.sh` does not change.

## How to run things

- Same as Phase 2: `node --test 'tests/reel/*.test.js'`, `tests/reel/page-check.sh`, and the frame review with `tests/reel/frames.mjs` + `tests/reel/sheet.py` against a server on port 8000.

---

### Task 1: The Eiffel Tower in open lattice

**Files:**
- Modify: `reel/kit.js` (add `paint`), `reel/ch1/train.js`
- Test: `tests/reel/kit.test.js` (modify), `tests/reel/ch1-train.test.js` (append)

**Interfaces:**
- Produces: `paint(art) → Painter`. It has the art's size, inks the opaque pixels and leaves the rest transparent.
- Produces: the train's `lm0` layer is the 31×44 lattice tower. The window glass now runs from row 19 to row 63.

- [ ] **Step 1: Write the failing tests.** Apply to `tests/reel/kit.test.js`:

`tests/reel/kit.test.js`, change 1. Find:

```js
import { tile, gradient, art, label, ridge, drawHero } from '../../reel/kit.js';
```

Replace with:

```js
import { tile, gradient, art, paint, label, ridge, drawHero } from '../../reel/kit.js';
```

`tests/reel/kit.test.js`, change 2. Find:

```js

test('label renders 3x5 text in one ink', () => {
```

Replace with:

```js

test('paint copies pixel art into an RGBA Painter, leaving gaps transparent', () => {
  const p = paint(art('A.', { A: '#ff0000' }));
  assert.deepEqual([p.w, p.h], [2, 1]);
  assert.deepEqual([...p.data], [255, 0, 0, 255, 0, 0, 0, 0]);
});

test('label renders 3x5 text in one ink', () => {
```

Append to `tests/reel/ch1-train.test.js`:

```js
test('the train: the Eiffel Tower is open lattice, not a solid silhouette', () => {
  const lm = train.build(480, 96).layers.lm0;
  const row = (y) => Array.from({ length: lm.w }, (_, x) => lm.data[(y * lm.w + x) * 4 + 3] > 0);
  const gapsInside = (r) => { const a = r.indexOf(true), b = r.lastIndexOf(true); return r.slice(a, b + 1).filter(v => !v).length; };
  assert.ok([20, 24, 34].every(y => gapsInside(row(y)) > 0), 'see-through rows in the body and between the legs');
  assert.ok(lm.h >= 40, 'tall enough to read');
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `node --test 'tests/reel/kit.test.js' 'tests/reel/ch1-train.test.js'`
Expected: the kit file fails to load (`does not provide an export named 'paint'`), and `the Eiffel Tower is open lattice` fails, because the old tower's body rows are solid.

- [ ] **Step 3: Implement.** Apply to `reel/kit.js`:

`reel/kit.js`, change 1. Find:

```js

// One line of 3x5 text as pixel art in a single ink colour.
```

Replace with:

```js

// Pixel art painted into a Painter of its own size, for scenes that keep everything as layers.
export function paint(a) {
  const p = new Painter(a.w, a.h);
  a.rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] !== '.') p.px(x, y, a.palette[row[x]]); });
  return p;
}

// One line of 3x5 text as pixel art in a single ink colour.
```

Apply to `reel/ch1/train.js`:

`reel/ch1/train.js`, change 1. Find:

```js
import { tile, gradient, ridge, label } from '../kit.js';
```

Replace with:

```js
import { tile, gradient, ridge, label, art, paint } from '../kit.js';
```

`reel/ch1/train.js`, change 2. Find:

```js
const WIN_TOP = 24, WIN_BOT = 63;            // window glass rows (outside shows through)
```

Replace with:

```js
const WIN_TOP = 19, WIN_BOT = 63;            // window glass rows (outside shows through)
```

`reel/ch1/train.js`, change 3. Find:

```js
function eiffel() {
  const p = new Painter(25, 38), I = '#4f4036', L = '#8a735c';
  const half = (y) => (y < 4 ? 0.5 : y < 26 ? 1 + (y - 4) * 0.28 : 7.2 + (y - 26) * 0.42);
  for (let y = 0; y < 38; y++) {
    const w = half(y), cx = 12;
    for (let x = Math.round(cx - w); x <= Math.round(cx + w); x++) {
      const arch = y >= 28 && Math.abs(x - cx) < (y - 26) * 0.42 + 0.5 - 2.6;     // the arch between the legs
      if (arch) continue;
      const edge = Math.abs(Math.abs(x - cx) - w) < 1;
      p.px(x, y, edge ? I : ((x + y) % 3 === 0 ? L : I));
    }
  }
  for (const y of [9, 18, 26]) for (let x = Math.round(12 - half(y) - 1); x <= Math.round(12 + half(y) + 1); x++) p.px(x, y, L);
  return p;
}
```

Replace with:

```js
// The Eiffel Tower in open lattice: the great arch between the legs, a cross-braced middle,
// two platforms and the spire.
const EIFFEL = art(`
...............I...............
...............I...............
...............I...............
..............III..............
..............ILI..............
.............IIIII.............
..............I.I..............
..............III..............
..............I.I..............
.............IILII.............
.............I.I.I.............
.............IIIII.............
.............I.L.I.............
............IIIIIII............
............I.I.I.I............
............IIIIIII............
...........LLLLLLLLL...........
...........IIIIIIIII...........
...........II.I.I.II...........
...........I.I...I.I...........
..........II..I.I..II..........
..........I.I..I..I.I..........
..........II.I...I.II..........
.........II...I.I...II.........
.........I.I...I...I.I.........
.........II.I.I.I.I.II.........
........II...I...I...II........
........IIIIIIIIIIIIIII........
......LLLLLLLLLLLLLLLLLLL......
......IILILILILILILILILII......
......IIIIIIIIIIIIIIIIIII......
......III.I.I.....I.I.III......
.....III.I.I.......I.I.III.....
.....II.I.I.........I.I.II.....
....III.I.I.........I.I.III....
....II.I.I...........I.I.II....
...III.I.I...........I.I.III...
...II.I.I.............I.I.II...
..III.I.I.............I.I.III..
..II.I.I...............I.I.II..
.III.I.I...............I.I.III.
.II.I.I.................I.I.II.
III.I.I.................I.I.III
IIIIII...................IIIIII
`, { I: '#4f3d30', L: '#9a7c60' });
```

`reel/ch1/train.js`, change 4. Find:

```js
  Object.assign(layers, { lm0: eiffel(), lm1: colosseum(), lm2: sagrada(), lm3: matterhorn(), chalet: chalet(), flag: swissFlag() });
```

Replace with:

```js
  Object.assign(layers, { lm0: paint(EIFFEL), lm1: colosseum(), lm2: sagrada(), lm3: matterhorn(), chalet: chalet(), flag: swissFlag() });
```

- [ ] **Step 4: Run the unit tests**

Run: `node --test 'tests/reel/*.test.js'`
Expected: `ℹ pass 90`, `ℹ fail 0`.

- [ ] **Step 5: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 3.5 && python3 tests/reel/sheet.py /tmp/f /tmp/f-eiffel.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 3.5 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-eiffel.png 3
```

Expected: a full-height Eiffel Tower in one window pane, with daylight through its lattice:
- the great arch between the legs
- cross-braced girders in the middle
- two light platforms
- a thin spire and antenna

- [ ] **Step 6: Commit**

```bash
git add reel/kit.js reel/ch1/train.js tests/reel/kit.test.js tests/reel/ch1-train.test.js
git commit -m "fix(reel): Draw the Eiffel Tower as open lattice in taller windows"
```

---

### Task 2: The white Golf on a winding, hilly Nordschleife

**Files:**
- Modify (rewrite): `reel/ch1/ring.js`
- Modify: `reel/ch1/index.js` (the shot becomes 2.5 s)
- Test: `tests/reel/ch1-ring.test.js` (rewrite), `tests/reel/ch1-chapter.test.js` (17 → 17.5 s)

**Interfaces:**
- Produces:
  - `buildTrack() → { segs: [{ index, curve, y1, y2 }], crest }`. There are 204 segments, bends both ways (|curve| up to 8), more than 2000 world units of elevation, and `crest` is the highest segment.
  - `ring` (a scene). The car layer is `car`, the white Golf seen from behind. The car lifts up to 8 px just past the crest.

- [ ] **Step 1: Write the failing tests.** Replace `tests/reel/ch1-ring.test.js` with:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { ring, buildTrack } from '../../reel/ch1/ring.js';

sceneContract('ch1 Nürburgring', ring, 2.5);

test('the Nordschleife bends both ways and climbs and plunges', () => {
  const { segs, crest } = buildTrack();
  assert.ok(segs.some(s => s.curve > 4) && segs.some(s => s.curve < -4), 'hard bends left and right');
  const ys = segs.map(s => s.y2);
  assert.ok(Math.max(...ys) - Math.min(...ys) > 2000, 'real elevation change');
  assert.equal(segs[crest].y2, Math.max(...ys), 'the crest is the highest point');
});

test('the white Golf flies over the crest, then lands', () => {
  const { segs, crest } = buildTrack();
  const carY = (t) => frameAt(ring, 480, t).ctx.draws('car')[0][1];
  const atCrest = (crest + 2) * 200 / (46 * 200);                    // seconds until just past the crest
  assert.ok(carY(atCrest) < carY(0.05) - 4, 'airborne just past the crest');
  assert.ok(Math.abs(carY(2.2) - carY(0.05)) <= 1, 'back on the road later');
  assert.ok(segs.length * 200 > 2.5 * 46 * 200 + 80 * 200, 'the track outlasts the shot plus the draw distance');
});

test('the lap timer runs in the corner', () => {
  assert.ok(frameAt(ring, 480, 1).ctx.draws('art').length >= 2);
});
```

Then apply to `tests/reel/ch1-chapter.test.js`:

`tests/reel/ch1-chapter.test.js`, change 1. Find:

```js
test('chapter 1 runs Sheffield, then six Europe shots, 17 s in all', () => {
```

Replace with:

```js
test('chapter 1 runs Sheffield, then six Europe shots, 17.5 s in all', () => {
```

`tests/reel/ch1-chapter.test.js`, change 2. Find:

```js
  assert.equal(CHAPTER_1.shots.reduce((a, s) => a + s.duration, 0), 17);
```

Replace with:

```js
  assert.equal(CHAPTER_1.shots.reduce((a, s) => a + s.duration, 0), 17.5);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `node --test 'tests/reel/ch1-ring.test.js' 'tests/reel/ch1-chapter.test.js'`
Expected: the ring file fails to load (`does not provide an export named 'buildTrack'`), and the chapter total is still 17.

- [ ] **Step 3: Implement.** Replace `reel/ch1/ring.js` with:

```js
// Chapter 1, shot 4: the Nürburgring Nordschleife from a chase camera. Yimeng's white modified Golf
// GTI attacks a stretch of the Green Hell: bend after bend, climbing and plunging, airborne over a
// crest like Flugplatz. A pseudo-3D road (projected segments, near to far) under a lap timer.
import { Painter } from '../pixels.js';
import { gradient, ridge, label } from '../kit.js';

const SEG = 200, ROAD = 620, CAM_H = 700, DEPTH = 0.8, DRAW = 80;
const SPEED = 46 * SEG;                       // world units per second
const HY = 36;                                // horizon row for a flat road
const TREE_H = 2600;

// the stretch of track: [segments, curve, climb]
const TRACK = [
  [4, 0, 0], [16, 6, 1400], [8, 0.8, 900], [10, 0, -1800], [16, -8, -2600], [8, 0, 1200],
  [12, 7.5, 500], [12, -6.5, -900], [14, 5, 1700], [10, 0, -1300], [14, -7, 0], [30, 4, 800], [50, -3, 0],
];
const ease = (u) => (1 - Math.cos(u * Math.PI)) / 2;

export function buildTrack() {
  const segs = [];
  let y = 0;
  for (const [n, curve, climb] of TRACK) {
    const y0 = y;
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n;
      const c = curve * Math.sin(Math.PI * (i + 0.5) / n);         // ease into and out of each bend
      segs.push({ index: segs.length, curve: c, y1: y0 + climb * ease(u0), y2: y0 + climb * ease(u1) });
    }
    y = y0 + climb;
  }
  const crest = segs.reduce((best, s) => (s.y2 > best.y2 ? s : best), segs[0]).index;
  return { segs, crest };
}

function golfRear() {
  const W = 40, H = 22, p = new Painter(W, H);
  const B = '#f2f3f5', b = '#c9ccd3', K = '#1c1c22', G = '#2a3240', R = '#d8202f';
  for (let y = 0; y < 3; y++) for (let x = 11 - y; x <= 28 + y; x++) p.px(x, y, y === 2 ? K : B);   // roof, spoiler lip
  for (let y = 3; y < 9; y++) for (let x = 10 - (y - 3) * 0.4; x <= 29 + (y - 3) * 0.4; x++) p.px(Math.round(x), y, G);
  for (let y = 5; y < 9; y++) for (let x = 12; x < 16; x++) p.px(x, y, y === 5 ? '#3b3640' : '#16141a');  // the driver
  p.px(24, 4, '#4a5466'); p.px(25, 5, '#4a5466');                                                     // reflection
  for (let y = 9; y < 17; y++) for (let x = 3; x <= 36; x++) p.px(x, y, y === 9 || y === 13 ? b : B);
  for (const x0 of [3, 30]) for (let y = 9; y < 12; y++) for (let x = x0; x < x0 + 7; x++) p.px(x, y, y === 11 ? '#a8121e' : R);
  for (let y = 10; y < 13; y++) for (let x = 19; x < 22; x++) p.px(x, y, (x === 20 && y === 11) ? B : '#5a6070');   // badge
  p.rect(26, 14, 3, 1, R);                                                                             // GTI
  for (let y = 17; y < 19; y++) for (let x = 6; x <= 33; x++) p.px(x, y, K);                         // diffuser
  for (const x0 of [8, 30]) p.rect(x0, 18, 2, 1, '#9aa0aa');                                         // twin pipes
  for (const x0 of [2, 32]) for (let y = 14; y < 22; y++) for (let x = x0; x < x0 + 6; x++) p.px(x, y, (y + x) % 3 === 0 ? '#2a2a30' : '#14141a');
  return p;
}

export function buildRing(W, H = 96) {
  const layers = {};
  layers.sky = gradient(W, H, [['#9fb2c6', 0], ['#b6c5d4', 0.25], ['#cfd9e2', 0.42], ['#dde5ea', 0.5]]);
  const hills = new Painter(W * 3, H);                              // the Eifel's forested hills on the horizon
  const h1 = ridge(W * 3, 10, [[4, 3, 0.5], [2, 7, 1.3], [1, 19, 0.2]]);
  for (let i = 0; i < W * 3; i++) for (let j = 0; j < h1[i]; j++) hills.px(i, HY + 2 - j, j > h1[i] - 1.5 ? '#5d7a68' : '#4a6a58');
  layers.hills = hills;
  layers.car = golfRear();
  return { W, H, layers, track: buildTrack() };
}

const labels = new Map();                // text -> pixel art, so the timer does not churn objects
function text(str, ink) {
  const k = str + ink;
  if (!labels.has(k)) labels.set(k, label(str, ink));
  return labels.get(k);
}

function project(p, camY, camZ, W, H) {
  const z = p.z - camZ, scale = DEPTH / z;
  return { z, scale, x: Math.round(W / 2 + scale * p.x * W / 2), y: Math.round(HY - scale * (p.y - camY) * H / 2), w: Math.round(scale * ROAD * W / 2) };
}

function band(ctx, y1, y2, x1, w1, x2, w2, col, f) {
  // fill a road trapezoid row by row, from the far edge (y2) down to the near edge (y1); f widens it
  ctx.fillStyle = col;
  for (let y = Math.max(0, y2); y < y1; y++) {
    const u = (y - y2) / (y1 - y2), x = x2 + (x1 - x2) * u, w = (w2 + (w1 - w2) * u) * f;
    ctx.fillRect(Math.round(x - w), y, Math.round(2 * w), 1);
  }
}

export function renderRing(ctx, t, s, env) {
  const { W, H, canvases: c } = s, { segs, crest } = s.track, N = segs.length;
  const pos = t * SPEED, base = Math.floor(pos / SEG), pct = (pos % SEG) / SEG;
  const here = segs[base % N], camY = here.y1 + (here.y2 - here.y1) * pct + CAM_H;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  const turned = segs.slice(0, base).reduce((a, sg) => a + sg.curve, 0) + here.curve * pct;
  ctx.drawImage(c.hills, -Math.round(((turned * 3) % W + W) % W) - W, 0);   // hills slide as the road turns

  let x = 0, dx = -here.curve * pct, maxy = H;
  const drawn = [];
  for (let n = 0; n < DRAW; n++) {
    const sg = segs[(base + n) % N];
    const z1 = (base + n) * SEG, z2 = z1 + SEG;
    const p1 = project({ x: -x, y: sg.y1, z: z1 }, camY, pos, W, H);
    const p2 = project({ x: -x - dx, y: sg.y2, z: z2 }, camY, pos, W, H);
    x += dx; dx += sg.curve;
    drawn.push({ sg, p1, clip: maxy });
    if (p1.z <= DEPTH || p2.y >= p1.y || p2.y >= maxy) continue;
    const alt = Math.floor((base + n) / 2) % 2, y1 = Math.min(p1.y, maxy);
    band(ctx, y1, p2.y, W / 2, W, W / 2, W, alt ? '#3d6b38' : '#356236', 1);                       // grass
    band(ctx, y1, p2.y, p1.x, p1.w, p2.x, p2.w, '#8a8f98', 1.32);                                  // run-off by the Armco
    band(ctx, y1, p2.y, p1.x, p1.w, p2.x, p2.w, alt ? '#e8414b' : '#f4f1e6', 1.14);                // kerbs
    band(ctx, y1, p2.y, p1.x, p1.w, p2.x, p2.w, alt ? '#474a52' : '#41444c', 1);                   // asphalt
    if (alt) {                                                                                       // white edge lines
      for (const side of [-1, 1]) band(ctx, y1, p2.y, p1.x + side * p1.w * 0.93, p1.w * 0.03, p2.x + side * p2.w * 0.93, p2.w * 0.03, '#e9e6df', 1);
    }
    maxy = p2.y;
  }
  // trees, far to near, clipped behind crests
  for (let n = drawn.length - 1; n >= 1; n--) {
    const { sg, p1, clip } = drawn[n];
    if (p1.z <= DEPTH || sg.index % 2) continue;
    for (const side of [-1, 1]) {
      const off = side * (1.9 + ((sg.index * 7) % 5) * 0.25);
      const tx = p1.x + p1.scale * off * ROAD * W / 2, th = Math.round(p1.scale * TREE_H * H / 2), tw = th * 0.42;
      if (th < 2 || tx < -tw || tx > W + tw) continue;
      for (let j = 0; j < th; j++) {
        const y = p1.y - th + j;
        if (y >= clip || y < 0) continue;
        const half = Math.max(0.5, (j / th) * tw * (j % 4 === 3 ? 0.8 : 1));
        ctx.fillStyle = side < 0 ? '#1f3d2b' : '#24432f'; ctx.fillRect(Math.round(tx - half), y, Math.round(half * 2), 1);
        ctx.fillStyle = '#2f5a3c'; ctx.fillRect(Math.round(tx - side * half * 0.8), y, Math.max(1, Math.round(half * 0.4)), 1);
      }
    }
  }
  // the car: pushed wide in the bends, bouncing, airborne over the crest
  const ahead = segs[(base + 4) % N].curve;
  const air = Math.max(0, 1 - Math.abs(base + pct - crest - 2) / 5);   // airborne just past the crest
  const lift = Math.round(Math.sin(air * Math.PI / 2) * 8 * air);
  const cx = Math.round(W / 2 - c.car.width / 2 - ahead * 1.6), cy = H - c.car.height - 3 - lift + (Math.floor(t * 12) % 2);
  if (lift > 0) { ctx.fillStyle = 'rgba(20, 30, 20, 0.45)'; ctx.fillRect(cx + 4, H - 4, c.car.width - 8, 2); }
  ctx.drawImage(c.car, cx, cy);
  if (Math.abs(ahead) > 2.5) {                                          // tyre smoke on the hard bends
    ctx.fillStyle = 'rgba(225, 226, 230, 0.6)';
    for (let k = 0; k < 4; k++) {
      const age = (t * 7 + k * 0.25) % 1;
      ctx.fillRect(Math.round(cx + (ahead > 0 ? 2 : 32) - age * 6 * Math.sign(ahead)), Math.round(cy + 18 - age * 6), 4 + Math.round(age * 4), 2);
    }
  }
  // lap timer under the controls, running fast
  const secs = 474 + t * 4, m = Math.floor(secs / 60), sec = secs - m * 60;
  const lbl = env.art(text(`${m}:${sec.toFixed(2).padStart(5, '0')}`, '#f4f1e6')), lap = env.art(text('LAP', '#e8b923'));
  const bx = W - lbl.width - lap.width - 14;
  ctx.fillStyle = 'rgba(11, 11, 12, 0.7)'; ctx.fillRect(bx, 20, lbl.width + lap.width + 10, 9);
  ctx.drawImage(lap, bx + 3, 22); ctx.drawImage(lbl, bx + lap.width + 7, 22);
}

export const ring = { build: buildRing, render: renderRing };
```

Apply to `reel/ch1/index.js`:

`reel/ch1/index.js`, change 1. Find:

```js
    { id: 'ch1-ring', scene: ring, caption: 'Europe', duration: 2, fadeIn: 0.15, fadeOut: 0.2 },
```

Replace with:

```js
    { id: 'ch1-ring', scene: ring, caption: 'Europe', duration: 2.5, fadeIn: 0.15, fadeOut: 0.2 },
```

- [ ] **Step 4: Run the unit tests**

Run: `node --test 'tests/reel/*.test.js'`
Expected: `ℹ pass 92`, `ℹ fail 0`.

- [ ] **Step 5: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 9.6,10.0,10.4 && python3 tests/reel/sheet.py /tmp/f /tmp/f-ring.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 9.6,10.0 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-ring.png 3
```

Expected:
- From behind and slightly above, the white Golf (red tail lights, twin pipes) on a narrow asphalt ribbon with red/white kerbs and a grey run-off.
- Dense conifers on both sides.
- At 9.6 s the car is airborne just past the crest, with a shadow under it, while the road ahead snakes away in an S.
- At 10.0 s a sweeping bend with tyre smoke.
- At 10.4 s the road drops out of sight beyond a crest.
- The `LAP` timer is at the top right.

- [ ] **Step 6: Commit**

```bash
git add reel/ch1/ring.js reel/ch1/index.js tests/reel/ch1-ring.test.js tests/reel/ch1-chapter.test.js
git commit -m "fix(reel): Chase the white Golf through the Nordschleife's bends and crests"
```

---

### Task 3: Lisbon's hillside street

**Files:**
- Modify (rewrite): `reel/ch1/lisbon.js`
- Test: `tests/reel/ch1-lisbon.test.js` (append)

**Interfaces:**
- Produces: the built scene also exposes `kerb(x)`, the strip row of the far kerb at strip column `x`.
- The geometry: below the street, rows `kerb(x)+8` down are the retaining wall. The slope is 0.16 and the rail stays fixed at screen row 80 under the tram.

- [ ] **Step 1: Write the failing test.** Append to `tests/reel/ch1-lisbon.test.js`:

```js
test('Lisbon: under the street runs a limestone retaining wall, not open cobbles', () => {
  const s = lisbon.build(480, 96), st = s.layers.street;
  const hex = (x, y) => { const k = (y * st.w + x) * 4; return '#' + [0, 1, 2].map(i => st.data[k + i].toString(16).padStart(2, '0')).join(''); };
  const WALL = new Set(['#dcd2bd', '#b3a78f', '#cfc4ad', '#2f5fa8', '#e9eef6', '#4f7fc4', '#d63c8a', '#3f7a3a', '#2a2a2e']);
  for (const x of [120, 260, 400]) assert.ok(WALL.has(hex(x, s.kerb(x) + 12)), `wall below the street at x=${x}`);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test 'tests/reel/ch1-lisbon.test.js'`
Expected: `the retaining wall` test fails (`s.kerb is not a function`).

- [ ] **Step 3: Implement.** Replace `reel/ch1/lisbon.js` with:

```js
// Chapter 1, shot 3: Lisbon. The yellow 28 tram grinds up a steep street of tiled facades; below the
// street a limestone retaining wall with an iron railing, azulejo panels and bougainvillea; far off,
// the Tagus and the red 25 de Abril bridge. The camera climbs with the tram.
import { Painter, rng } from '../pixels.js';
import { gradient, label } from '../kit.js';

const SLOPE = 0.16;                      // the street rises 1 px for every ~6 px
const V = 34;                            // tram speed along x, px/s
const RAIL = 80;                         // screen row of the rail under the tram (fixed: the camera follows)

const FACADES = ['#e9a3a0', '#ecc76a', '#8fb9d6', '#a8d5b5', '#efe9dd', '#e7b48c'];
const LAUNDRY = ['#e8414b', '#f4f1ea', '#3f6fb5', '#f2c22e', '#4f9a4a'];

function tramArt() {
  const W = 50, H = 30, p = new Painter(W, H);
  const Y = '#f2c22e', y = '#d4a41f', C = '#f4efe2', K = '#2a2a2e', G = '#2c3a4a';
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const front = i > W - 6 ? (i - (W - 6)) : 0;               // rounded front end
    if (j < front - 2) continue;
    let c = null;
    if (j < 2) c = i > 3 && i < W - 4 ? C : null;
    else if (j < 4) c = C;
    else if (j < 6) c = Y;
    else if (j < 14) c = ((i - 3) % 8 < 6 && i > 2 && i < W - 3) ? G : Y;    // windows
    else if (j === 14) c = C;
    else if (j < 24) c = (j === 19 ? y : Y);
    else if (j < 26) c = K;
    if (c) p.px(i, j, c);
  }
  for (let i = 3; i < W - 3; i += 8) for (let j = 6; j < 14; j++) p.px(i + 6, j, C);   // window pillars
  for (const cx of [11, 37]) for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (i * i + j * j <= 5) p.px(cx + i, 27 + j, j < 0 && i < 0 ? '#4a4a50' : K);
  p.rect(W - 4, 20, 2, 2, '#fff6c8');                          // headlight
  p.rect(W - 13, 2, 9, 3, K);                                  // destination board "28"
  const n = label('28', '#f2c22e');
  for (let j = 0; j < 5; j++) for (let i = 0; i < n.w; i++) if (n.rows[j][i] === '#') p.px(W - 12 + i + 1, j - 1 + 2, '#f2c22e');
  return p;
}

function farView(W) {
  // the Tagus far below with the 25 de Abril bridge and a band of distant roofs
  const p = new Painter(W, 70);
  for (let j = 30; j < 70; j++) for (let i = 0; i < W; i++) p.px(i, j, j < 31 ? '#a9c9d9' : (i + j) % 9 === 0 ? '#8fb6d0' : '#78a6c6');
  for (let i = 0; i < W; i++) for (let j = 26; j < 30; j++) p.px(i, j, j === 26 ? '#b5c4a8' : '#9fb59a');   // the far bank
  const bx = Math.round(W * 0.08), span = Math.round(W * 0.55);
  for (let i = bx - 14; i < bx + span + 14; i++) p.px(i, 25, '#b8402e');                 // deck
  for (const tx of [bx, bx + span]) for (let j = 12; j < 26; j++) { p.px(tx, j, '#c8462f'); p.px(tx + 1, j, '#a83a28'); }
  for (let i = 0; i <= span; i++) {
    const sag = 12 + Math.round(11 * (1 - Math.pow((i / span) * 2 - 1, 2)));
    p.px(bx + i, sag, '#c8462f');
    if (i % 6 === 0) for (let j = sag + 1; j < 25; j++) p.px(bx + i, j, '#d47a62');
  }
  const r = rng(3);
  for (let i = 0; i < W; i += 3) {                                                      // roofs down by the river
    const h = 2 + Math.floor(r() * 4);
    for (let j = 0; j < h; j++) p.px(i, 44 - j, j === h - 1 ? '#c0603e' : '#efe7d8');
    p.px(i + 1, 44 - h + 1, '#a84f32');
  }
  for (let j = 45; j < 70; j++) for (let i = 0; i < W; i++) p.px(i, j, (i + j) % 5 === 0 ? '#c0603e' : (i * 3 + j) % 7 === 0 ? '#a84f32' : '#e6dccb');
  return p;
}

export function buildLisbon(W, H = 96) {
  const hx = Math.round(W * 0.34);
  const run = W + V * 2 + 60;                                   // how far the street must extend
  const top = Math.floor(RAIL - SLOPE * (run - hx)) - 72;         // the highest row any house reaches
  const LH = H + 24 - top;
  const st = new Painter(run, LH);                               // world strip: strip row 0 = screen row `top` at t = 0
  const kerb = (x) => Math.round(RAIL - 6 - SLOPE * (x - hx)) - top;   // the far kerb, where the houses stand
  const r = rng(28);

  for (let bx = -10, n = 0; bx < run; bx += 22, n++) {          // houses climbing the hill
    const h = 38 + Math.floor(r() * 12), col = FACADES[n % FACADES.length], tiled = n % 3 === 1;
    const roof = kerb(bx + 21) - h;                               // flat roofline, set by the uphill corner
    for (let i = bx; i < bx + 21; i++) {
      const base = kerb(i);
      for (let j = roof; j < base; j++) {
        let c = tiled && ((i >> 1) + (j >> 1)) % 2 === 0 ? '#3f6fb5' : (tiled ? '#e8eef6' : col);
        if (j >= base - 3) c = (i + j) % 4 === 0 ? '#b9ae98' : '#d4c9b3';      // stone plinth along the slope
        st.px(i, j, c);
      }
    }
    for (let i = bx - 1; i < bx + 22; i++) { st.px(i, roof - 1, '#c0603e'); st.px(i, roof - 2, '#a84f32'); }
    for (let fy = roof + 4; fy < kerb(bx + 16) - 12; fy += 9) for (const fx of [bx + 3, bx + 12]) {
      st.rect(fx, fy, 5, 6, '#2f3646'); st.rect(fx - 1, fy, 1, 6, '#3d7a4a'); st.rect(fx + 5, fy, 1, 6, '#3d7a4a');
      st.rect(fx - 1, fy + 6, 7, 1, '#2a2a2e');                   // iron balcony
    }
    const dx = bx + 14, db = kerb(dx + 2);                        // the front door, on the street
    st.rect(dx - 1, db - 10, 6, 10, '#d4c9b3'); st.rect(dx, db - 9, 4, 9, n % 2 ? '#3d5a7a' : '#6b2f2a');
    if (n % 2 === 0) {                                          // laundry strung between windows
      const ly = roof + 12;
      for (let i = bx + 2; i < bx + 20; i++) st.px(i, ly, '#5a5a60');
      for (let k = 0; k < 5; k++) st.rect(bx + 3 + k * 3, ly + 1, 2, 3, LAUNDRY[(n + k) % LAUNDRY.length]);
    }
  }
  for (let x = 0; x < run; x++) {
    const k = kerb(x);
    st.px(x, k, '#e8e1d2');                                       // far kerb
    for (let j = k + 1; j < k + 7; j++) st.px(x, j, (x + j * 3) % 5 === 0 ? '#9a9387' : '#bdb5a3');   // calcada
    st.px(x, k + 4, '#55504a'); st.px(x, k + 6, '#55504a');      // rails
    st.px(x, k + 7, '#e8e1d2');                                   // near kerb
    for (let j = k + 8; j < LH; j++) {                            // limestone retaining wall
      const row = Math.floor((j - k - 8) / 4), joint = (j - k - 8) % 4 === 0 || (x + row * 7) % 12 === 0;
      st.px(x, j, joint ? '#b3a78f' : (x * 3 + j) % 17 === 0 ? '#cfc4ad' : '#dcd2bd');
    }
    if (x % 5 === 0) for (let j = k + 7; j > k + 3; j--) st.px(x, j + 4, '#2a2a2e');   // railing posts
    st.px(x, k + 8, '#2a2a2e');                                   // railing top
  }
  for (let px0 = 30; px0 < run; px0 += 96) {                      // azulejo panels set into the wall
    const k = kerb(px0 + 12);
    for (let j = k + 14; j < k + 26; j++) for (let i = px0; i < px0 + 24; i++) st.px(i, j, (i === px0 || i === px0 + 23 || j === k + 14 || j === k + 25) ? '#2f5fa8' : ((i >> 1) + (j >> 1)) % 2 ? '#e9eef6' : '#4f7fc4');
  }
  for (let bx = 70; bx < run; bx += 130) {                         // bougainvillea spilling over the railing
    const k = kerb(bx);
    for (let n = 0; n < 40; n++) st.px(bx + Math.floor(r() * 16), k + 8 + Math.floor(r() * (6 + n / 6)), r() < 0.7 ? '#d63c8a' : '#3f7a3a');
  }
  return { W, H, hx, top, kerb, layers: { sky: gradient(W, H, [['#6fa9e0', 0], ['#86b9e6', 0.3], ['#a8cdee', 0.6], ['#cfe4f5', 0.9]]), far: farView(W), street: st, tram: tramArt() } };
}

export function renderLisbon(ctx, t, s, env) {
  const { W, H, canvases: c } = s;
  const cx = t * V, cy = -SLOPE * t * V;                          // the camera climbs with the tram
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  ctx.drawImage(c.far, 0, Math.round(-cy * 0.12) + 4);
  ctx.drawImage(c.street, -Math.round(cx), Math.round(s.top - cy));
  // the overhead wire, parallel to the street
  ctx.fillStyle = '#2a2a2e';
  for (let x = 0; x < W; x++) ctx.fillRect(x, Math.round(RAIL - 40 - SLOPE * (x - s.hx)), 1, 1);
  // Yimeng at the tram's front window, then the tram body sheared onto the slope
  const tx = s.hx - 8, ty = RAIL - 27;                            // wheels on the rails
  const hero = env.hero('travel'), bob = Math.floor(t * 6) % 2;
  const shear = (i) => Math.round(SLOPE * i);
  ctx.save();
  ctx.beginPath(); ctx.rect(tx + 35, ty + 6 - shear(37) + bob, 6, 8); ctx.clip();
  ctx.fillStyle = '#4a3a30'; ctx.fillRect(tx + 35, ty + 6 - shear(37) + bob, 6, 8);
  ctx.drawImage(hero.canvases[1], tx + 14, ty - 14 - shear(37) + bob);
  ctx.restore();
  for (let i = 0; i < c.tram.width; i++) {
    const dy = ty - shear(i) + bob;
    if (i >= 35 && i <= 40) {                                     // leave Yimeng's window open
      ctx.drawImage(c.tram, i, 0, 1, 6, tx + i, dy, 1, 6);
      ctx.drawImage(c.tram, i, 14, 1, c.tram.height - 14, tx + i, dy + 14, 1, c.tram.height - 14);
    } else ctx.drawImage(c.tram, i, 0, 1, c.tram.height, tx + i, dy, 1, c.tram.height);
  }
  ctx.fillStyle = '#2a2a2e';                                      // trolley pole up to the wire
  for (let k = 0; k < 14; k++) ctx.fillRect(tx + 22 + k, ty - 1 - shear(22) - k + bob, 1, 1);
}

export const lisbon = { build: buildLisbon, render: renderLisbon };
```

- [ ] **Step 4: Run the unit tests**

Run: `node --test 'tests/reel/*.test.js'`
Expected: `ℹ pass 93`, `ℹ fail 0`.

- [ ] **Step 5: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 7.3,8.6 && python3 tests/reel/sheet.py /tmp/f /tmp/f-lisbon.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 8.0 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-lisbon.png 3
```

Expected:
- Houses stand on the slope, each with a stone plinth that follows the street, and a door that opens onto it.
- Below the cobbles and rails: a railing, then a limestone block wall with blue-and-white azulejo panels and bougainvillea spilling over.
- Far off, the Tagus with the red bridge and a band of roofs.
- The tram's wheels sit on the rails.

- [ ] **Step 6: Commit**

```bash
git add reel/ch1/lisbon.js tests/reel/ch1-lisbon.test.js
git commit -m "fix(reel): Give Lisbon's tram street a retaining wall and a proper hillside"
```

---

### Task 4: Trolltunga over a golden fjord

**Files:**
- Modify (rewrite): `reel/ch1/trolltunga.js`
- Test: `tests/reel/ch1-trolltunga.test.js` (modify)

**Interfaces:**
- Produces: the built scene exposes:
  - `tip = round(0.6 W)`
  - `vx`, `vy`: where the fjord meets the sun, beyond the tip
  - `falls`: two waterfalls
  - `glint`: the sun's path on the water
- Yimeng walks with shoes on row 54 and sits with the seat outline on row 52. The camera drifts 4 px/s, and Yimeng moves with the rock.

- [ ] **Step 1: Write the failing test.** Apply to `tests/reel/ch1-trolltunga.test.js`:

`tests/reel/ch1-trolltunga.test.js`, change 1. Find:

```js
test('Trolltunga: walks out along the tongue, then sits at the tip', () => {
```

Replace with:

```js
test('Trolltunga: walks out along the tongue, then sits at the tip as the camera drifts', () => {
```

`tests/reel/ch1-trolltunga.test.js`, change 2. Find:

```js
  assert.equal(walking[0][3], 58 - 44);
```

Replace with:

```js
  assert.equal(walking[0][3], 56 - 2 - 44);
```

`tests/reel/ch1-trolltunga.test.js`, change 3. Find:

```js
  assert.deepEqual(sitting.map(c => [c[2], c[3]]), [[s.tip - 12 - 9, 58 - 1 - 38]]);
```

Replace with:

```js
  assert.deepEqual(sitting.map(c => [c[2], c[3]]), [[s.tip - 12 - 8 - 9, 56 - 4 - 38]]);   // 2 s of drift at 4 px/s
```

`tests/reel/ch1-trolltunga.test.js`, change 4. Find:

```js
});
```

Replace with:

```js
});

test('Trolltunga: a fjord runs to the sun between the walls, with waterfalls', () => {
  const s = trolltunga.build(480, 96);
  assert.ok(s.vx > s.tip, 'the fjord vanishes beyond the tip');
  assert.equal(s.falls.length, 2);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test 'tests/reel/ch1-trolltunga.test.js'`
Expected: 2 failures (the walk row is 58 − 44 in the old scene; the old scene has no `falls`).

- [ ] **Step 3: Implement.** Replace `reel/ch1/trolltunga.js` with:

```js
// Chapter 1, shot 5: Trolltunga at golden hour. A long fjord runs away to a low sun between sheer,
// back-lit walls with waterfalls; red houses sit far below. Yimeng walks out along the stratified
// rock tongue and sits at the tip, legs over the drop, while the camera drifts.
import { Painter, rng } from '../pixels.js';
import { gradient } from '../kit.js';

const TOP = 56;                          // the tongue's walking surface at its root
const WALK_END = 1.15;                   // seconds of walking before sitting down
const STEP = 26;                         // walk speed, px/s
const PAN = 4;                           // camera drift, px/s at the foreground
const PAD = 16;                          // extra width so the drift never shows an edge

const SKY = [['#1d3466', 0], ['#33508a', 0.2], ['#5a72a8', 0.4], ['#a58fb0', 0.58], ['#e3a27e', 0.75], ['#f5c48a', 0.88], ['#fde2a6', 0.97]];

const lerp = (a, b, u) => a + (b - a) * u;

// A fjord spur: a ridge that falls from (ax, ay), high on the outside, to (bx, by) at the water's
// edge. Everything below the ridge on the outer side is mountain. cols = [base, strata, crack,
// snow, rim]; the ridge line itself catches the low sun.
function spur(p, H, ax, ay, bx, by, cols, snow, seed, water) {
  const lo = Math.round(Math.min(ax, bx)), hi = Math.round(Math.max(ax, bx)), left = ax < bx;
  for (let x = lo; x <= hi; x++) {
    const u = (x - ax) / (bx - ax);
    const ridge = Math.round(ay + (by - ay) * Math.pow(u, 1.25) + Math.sin(x * 0.37 + seed) * 1.2 + Math.sin(x * 0.11 + seed * 2) * 1.8);
    for (let y = Math.max(0, ridge); y < H; y++) {
      if (water(x, y)) continue;                                  // never paint over the fjord itself
      const d = y - ridge;
      let c = (x * 3 + y * 7) % 13 === 0 ? cols[2] : (y + Math.round(x * (left ? 0.5 : -0.5))) % 6 === 0 ? cols[1] : cols[0];
      if (snow && d > 0 && d < 5 && u < 0.6 && (x + y) % 3 !== 0) c = cols[3];
      if (d === 0) c = cols[4];
      p.px(x, y, c);
    }
  }
  // the rest of the mountain beyond the ridge's high end
  const outer = left ? [0, lo] : [hi, p.w];
  for (let x = outer[0]; x < outer[1]; x++) for (let y = Math.max(0, Math.round(ay + Math.sin(x * 0.29 + seed) * 1.5)); y < H; y++) {
    if (water(x, y)) continue;
    p.px(x, y, y === Math.round(ay + Math.sin(x * 0.29 + seed) * 1.5) ? cols[4] : (x + y) % 6 === 0 ? cols[1] : cols[0]);
  }
}

export function buildTrolltunga(W, H = 96) {
  const layers = {}, vx = Math.round(W * 0.64), vy = 40;        // where the fjord meets the sun
  const tip = Math.round(W * 0.6), cliffEdge = Math.round(W * 0.36);
  layers.sky = gradient(W, 62, SKY);

  // the sun with a wide warm glow and faint rays fanning out of the valley
  const sun = new Painter(W, 46);
  for (let j = -30; j <= 30; j++) for (let i = -40; i <= 40; i++) {
    const d = Math.hypot(i, j * 1.3), x = vx + i, y = vy - 4 + j;
    if (d <= 3) sun.px(x, y, '#fff7dc');
    else if (d <= 4.5) sun.px(x, y, '#fde8b0');
    else if (d <= 9 && (i + j) % 2 === 0) sun.px(x, y, '#fcdca0');
    else if (d <= 16 && (i + j) % 3 === 0) sun.px(x, y, '#f8cf94');
    else if (d <= 26 && (i * 2 + j) % 5 === 0) sun.px(x, y, '#efbf8d');
  }
  for (const a of [-2.75, -2.45, -0.75, -0.42]) {                   // god rays
    for (let r = 8; r < 70; r++) for (let w = -1; w <= 1; w++) {
      const x = Math.round(vx + Math.cos(a) * r + w * Math.sin(a)), y = Math.round(vy - 4 + Math.sin(a) * r * 0.6);
      if ((x + y + r) % 3 === 0) sun.px(x, y, '#f6d4a2');
    }
  }
  layers.sun = sun;

  // the valley: water first, then spurs from far to near on both sides
  const walls = new Painter(W + PAD, H);
  for (let y = vy; y < H; y++) {
    const u = (y - vy) / (H - vy);
    for (let x = 0; x < W + PAD; x++) {
      let c = u < 0.06 ? '#f0d4a8' : u < 0.16 ? '#c8c6b6' : u < 0.36 ? '#8fb6bc' : u < 0.62 ? '#4f8a96' : '#2c5f6c';
      if ((x * 7 + y * 13) % 31 === 0) c = '#76a8b0';
      walls.px(x, y, c);
    }
  }
  const leftShore = (y) => vx - 3 - (y - vy) * (vx - 3 - W * 0.22) / (H - vy);   // shorelines open out
  const rightShore = (y) => vx + 4 + (y - vy) * (W * 0.98 - vx - 4) / (H - vy);   // from the sun to the viewer
  const water = (x, y) => y > vy && x > leftShore(y) && x < rightShore(y);
  const HAZE = ['#ad9db5', '#a394ae', '#9b8da8', '#c7b0bc', '#f4ca92'];   // far: hazy and warm
  const MID = ['#5d6787', '#56607f', '#4e5876', '#a3aec6', '#ebba86'];
  const NEAR = ['#303b58', '#2b3551', '#262f49', '#7c88a6', '#dca878'];
  for (const [side, ax, ay, endY, cols, snow, seed] of [
    [-1, W * 0.28, 31, 41, HAZE, false, 1], [1, W + PAD, 29, 41, HAZE, false, 2],
    [-1, W * 0.08, 21, 54, MID, true, 3], [1, W + PAD, 17, 54, MID, true, 4],
    [-1, -4, 6, 72, NEAR, true, 5], [1, W + PAD, 5, 74, NEAR, true, 6],
  ]) spur(walls, H, ax, ay, side < 0 ? leftShore(endY) : rightShore(endY), endY, cols, snow, seed, water);
  for (let y = vy + 1; y < H; y++) {                                       // a dark green fringe along each shore
    walls.px(Math.floor(leftShore(y)), y, '#33473a'); walls.px(Math.ceil(rightShore(y)), y, '#33473a');
  }
  for (const hy of [84, 87, 90]) {                                         // red boathouses on the right shore
    const x = Math.round(rightShore(hy)) + 2;
    walls.rect(x, hy, 3, 2, '#c0392b'); walls.rect(x, hy - 1, 3, 1, '#e8e2d4');
  }
  layers.walls = walls;
  const falls = [[rightShore(52) + 6, 38, 52], [rightShore(60) + 10, 30, 60]].map(([fx, top, foot]) => ({ x: Math.round(fx), top, foot }));

  // the cliff and its tongue, layered rock lit gold on top by the low sun
  const rock = new Painter(W + PAD, H), rr = rng(12);
  for (let i = 0; i <= tip + 2; i++) {
    const onCliff = i < cliffEdge;
    const lift = i > tip - 22 ? (i - (tip - 22)) * 0.13 : 0;
    const top = Math.round(TOP - lift + (onCliff ? Math.sin(i * 0.31) * 1.2 + Math.sin(i * 0.11) * 1.5 - 1 : 0));
    const thick = onCliff ? H : Math.round(lerp(14, 6, (i - cliffEdge) / (tip - cliffEdge)) + Math.sin(i * 0.8) * 1.3 + (rr() < 0.18 ? 1 : 0));
    const bottom = i > tip ? top + 4 - (i - tip) * 2 : Math.min(H, top + thick);
    for (let j = top; j < bottom; j++) {
      const d = j - top;
      let c = d === 0 ? '#f0c58c' : d === 1 ? '#a8896a' : d % 4 === 2 ? '#2f2a26' : (i * 5 + j * 3) % 11 === 0 ? '#2a2622' : (d % 4 === 0 ? '#4a433c' : '#3f3933');
      if (!onCliff && j >= bottom - 2) c = '#1f1c19';                          // ragged dark underside
      if (i >= tip - 1 && d > 0 && d < 5) c = '#d9a774';                       // the sunlit end face
      rock.px(i, j, c);
    }
  }
  layers.rock = rock;

  // haze that hangs in the valley below the tongue
  const mist = new Painter(W * 2, H), rm = rng(5);
  for (let n = 0; n < 10; n++) {
    const cx = rm() * W * 2, cy = 60 + rm() * 14, rx = 18 + rm() * 30, ry = 2.5 + rm() * 2;
    for (let y = -4; y <= 4; y++) for (let x = -rx; x <= rx; x++) {
      const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
      if (d < 0.55 || (d < 1 && (Math.round(x) + y) % 2 === 0)) mist.wpx(cx + x, cy + y, '#f4e6da');
    }
  }
  layers.mist = mist;
  const glint = [], rg = rng(9);                                            // the sun's path on the water
  for (let n = 0; n < 40; n++) {
    const y = vy + 1 + Math.floor(Math.pow(rg(), 1.3) * (H - vy - 2)), spread = 1 + (y - vy) * 0.18;
    glint.push([vx + 3 + (rg() - 0.5) * 2 * spread, y, rg()]);
  }
  return { W, H, layers, tip, vx, vy, falls, glint };
}

export function renderTrolltunga(ctx, t, s, env) {
  const { W, H, canvases: c } = s;
  const cam = t * PAN, wx = Math.round(-cam * 0.35), tick = Math.floor(t * 8);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  ctx.drawImage(c.sun, 0, 0);
  ctx.drawImage(c.walls, wx, 0);
  s.glint.forEach(([x, y, b], n) => {                                       // twinkling sun path
    if ((n * 5 + tick) % 4 < 2) { ctx.fillStyle = b > 0.5 ? '#fde8b0' : '#f2c693'; ctx.fillRect(Math.round(x) + wx, y, b > 0.8 ? 2 : 1, 1); }
  });
  for (const f of s.falls) {                                                 // waterfalls tumbling down the right wall
    for (let y = f.top; y < f.foot; y++) {
      if ((y + tick * 2) % 5 === 0) continue;
      ctx.fillStyle = (y + tick) % 3 ? '#e9eef2' : '#bcc8d4';
      ctx.fillRect(f.x + wx + (y % 7 === 0 ? 1 : 0), y, 1, 1);
    }
    ctx.fillStyle = 'rgba(240, 244, 248, 0.55)'; ctx.fillRect(f.x + wx - 2, f.foot - 1, 5, 2);
  }
  ctx.fillStyle = '#2a2a35';                                                 // two birds riding the air
  for (const [bx, by, ph] of [[0.45, 30, 0], [0.52, 34, 1.7]]) {
    const x = Math.round(W * bx + t * 5), y = Math.round(by + Math.sin(t * 2 + ph)), up = Math.floor(t * 4 + ph) % 2;
    ctx.fillRect(x - 1, y - up, 1, 1); ctx.fillRect(x, y, 1, 1); ctx.fillRect(x + 1, y - up, 1, 1);
  }
  ctx.globalAlpha = 0.35; ctx.drawImage(c.mist, Math.round(-cam * 0.6 - t * 3) % W, 0); ctx.globalAlpha = 1;
  ctx.drawImage(c.rock, Math.round(-cam), 0);
  const sitX = s.tip - 12 - Math.round(cam);
  if (t < WALK_END) {
    const hero = env.hero('trolltunga');
    const x = sitX - (WALK_END - t) * STEP;
    ctx.drawImage(hero.canvases[Math.floor(t * 6) % 4], Math.round(x) - hero.anchorX, TOP - 2 - hero.footY);
  } else {
    const hero = env.hero('trolltunga', 'sit');
    ctx.drawImage(hero.canvases[Math.floor((t - WALK_END) * 2) % 2], sitX - hero.anchorX, TOP - 4 - hero.seatY);
  }
}

export const trolltunga = { build: buildTrolltunga, render: renderTrolltunga };
```

- [ ] **Step 4: Run the unit tests**

Run: `node --test 'tests/reel/*.test.js'`
Expected: `ℹ pass 94`, `ℹ fail 0`.

- [ ] **Step 5: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 12.0,14.2 && python3 tests/reel/sheet.py /tmp/f /tmp/f-troll.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 14.2 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-troll.png 3
```

Expected:
- A low sun with a wide dithered glow and faint rays.
- A long fjord running from the sun towards the viewer: pale gold water near the sun, deep teal near us, a twinkling path of light.
- Three spurs on each side stepping back from dark blue (near) to violet haze (far), each with a lit ridge and snow on the near ones.
- Two waterfalls down the right wall, red boathouses on the right shore, two birds, and soft mist drifting under the tongue.
- Yimeng in the red shell walks out along the layered rock and sits at the tip, legs dangling, as everything drifts slightly with depth.

- [ ] **Step 6: Commit**

```bash
git add reel/ch1/trolltunga.js tests/reel/ch1-trolltunga.test.js
git commit -m "fix(reel): Set Trolltunga above a golden-hour fjord"
```

---

### Task 5: Checks, spec and hand-off

**Files:**
- Modify: `docs/superpowers/specs/2026-10-03-life-reel-design.md`

- [ ] **Step 1: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 94`, then 15 `ok` lines and exit 0.

- [ ] **Step 2: Update the spec's chapter 1 storyboard.** Apply:

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 1. Find:

```markdown
The full loop runs about 56 s, and the timings below are targets. The caption is the place name and fades in at the top left whenever it changes.
```

Replace with:

```markdown
The full loop runs about 57 s, and the timings below are targets. The caption is the place name and fades in at the top left whenever it changes.
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 2. Find:

```markdown
### 1 · Sheffield → Europe (~17 s). Caption: `Sheffield`, switching to `Europe` when the train leaves
```

Replace with:

```markdown
### 1 · Sheffield → Europe (~17.5 s). Caption: `Sheffield`, switching to `Europe` when the train leaves
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 3. Find:

```markdown
3. Lisbon: riding the yellow tram up a steep street lined with tiled façades.
4. Nürburgring: Yimeng's modified VW Golf GTI (lowered, aftermarket wheels, the red stripe across the grille) takes the "Green Hell" forest corners. A small lap timer runs in a corner. The body colour defaults to Tornado Red; Yimeng can name the real colour at the chapter 1 review.
5. Trolltunga: hike up, walk out to the tip of the rock tongue and sit with legs dangling over the lake 700 m below. The camera holds here. This is the stillest moment in the film, and it comes straight after the fastest one.
```

Replace with:

```markdown
3. Lisbon: riding the yellow tram up a steep street of tiled façades, above a limestone retaining wall with an iron railing, azulejo panels and bougainvillea. The Tagus and the 25 de Abril bridge lie far below.
4. Nürburgring, from a chase camera: Yimeng's white modified VW Golf GTI attacks a narrow stretch of the "Green Hell", bend after bend through the forest, climbing and plunging, and briefly airborne over a crest like Flugplatz. A small lap timer runs in a corner.
5. Trolltunga at golden hour: a long fjord runs away to a low sun between sheer, back-lit walls with waterfalls and red boathouses far below. Yimeng walks out along the stratified rock tongue and sits at the tip, legs dangling, while the camera drifts slowly. This is the stillest moment in the film, and it comes straight after the fastest one.
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-10-03-life-reel-design.md
git commit -m "docs: Describe the revised chapter 1 shots in the spec"
```

- [ ] **Step 4: Hand over for review.** Give the user:
- `http://127.0.0.1:8000/?reel=ch1-train`
- `?reel=ch1-lisbon`
- `?reel=ch1-ring`
- `?reel=ch1-trolltunga`
- `http://127.0.0.1:8000/` to see the whole chapter

Stop there. Chapter 2 gets its own plan after this review.
