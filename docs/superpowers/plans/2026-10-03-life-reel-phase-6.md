# Life Reel — Phase 6 (To Be Continued, Polish and QA) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the reel.
- Chapter 5 replaces its stand-in with the pencil sketch: the sunset boardwalk, where the world ahead is unfinished pencil and Yimeng and the dog walk into it.
- The loop closes cleanly: the sketch fades out and Sheffield fades in.
- The engine builds each shot's layers ahead of time and lets them go after, as the spec says.
- The road-trip map, the one slow build, takes a third of the time.
- A final QA sweep covers the console, the page without JavaScript and layout shift.

Merging to `main` comes after the user approves this phase. It is not part of this plan.

**Architecture:**
- `reel/ch5/sketch.js` reuses the beach scene's layers and makes a pencil twin of each: a graphite line where the tone changes, hatching in the darkest parts, paper elsewhere.
  - Each frame draws the colour world up to a ragged frontier and the pencil world past it, by clipping.
  - The cast is drawn in a new `sketch` tone, through `pencil()` in `reel/pixels.js`.
- The engine asks `nearShots()` in `reel/timeline.js` for the shot on screen and the next one. It builds the next one in idle time and drops any other.

**Tech Stack:** Vanilla JS (ES modules, Canvas 2D), Node 25 `node:test`, headless Chrome review tools from Phase 2.

**Spec:** `docs/superpowers/specs/2026-10-03-life-reel-design.md`: chapter 5, the technical design (files and rendering) and verification. Tasks 5 and 6 update it. **Builds on:** `docs/superpowers/plans/2026-10-03-life-reel-phase-5b.md`.

## Global Constraints

- Everything in the earlier plans' Global Constraints still holds:
  - native widths 195, 480 and 640 must all read well
  - branch `life-reel`; no merge, no push
- Chapter 5 is one shot:
  - id `ch5-sketch`, caption `To be continued…`
  - 4 s, with a 0.3 s fade in from the sunset and a 0.5 s fade out into the loop
- The reel runs 68.1 s:

  | Chapter | Start (s) | End (s) |
  |---|---|---|
  | Sheffield | 0 | 17.5 |
  | New York | 17.5 | 33.7 |
  | Michigan | 33.7 | 47.2 |
  | California | 47.2 | 64.1 |
  | To be continued | 64.1 | 68.1 |

  The page checks' times do not change.
- The road-trip map's pixels must not change. Task 1 pins them by hash.
- No more than two shots' layers are held at once: the one on screen and the next.
- The reduced-motion poster stays the approved beach scene.

## How to run things

- Unit tests: `node --test 'tests/reel/*.test.js'`. Page checks: `tests/reel/page-check.sh`.
- Frame review: keep `python3 -m http.server 8000 --bind 127.0.0.1` running from the repo root. Then run `node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times …` and `python3 tests/reel/sheet.py /tmp/f /tmp/f.png 2`.

---

### Task 1: The road-trip map, three times faster

**Files:**
- Modify: `reel/ch3/roadtrip.js`
- Test: `tests/reel/ch3-roadtrip.test.js`

**Interfaces:**
- No change outside `colourMap()`.
- The land colours are `[r, g, b]` arrays, so the 150,000 land pixels are written straight into the Painter rather than through hex strings.
- `nearRange()` skips any mountain-range segment whose box, grown by 4 px, misses the pixel. Only distances under 3.5 px are ever used.

- [ ] **Step 1: Pin the map.** Apply to `tests/reel/ch3-roadtrip.test.js`:

`tests/reel/ch3-roadtrip.test.js`, change 1. Find:

```js
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
```

Replace with:

```js
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { sceneContract, frameAt } from './fake-canvas.js';
```

`tests/reel/ch3-roadtrip.test.js`, change 2. Find:

```js
  assert.ok(mapX(195, 4.5) > mapX(195, 1.5), 'the map slides right as the car drives west');
});
```

Replace with:

```js
  assert.ok(mapX(195, 4.5) > mapX(195, 1.5), 'the map slides right as the car drives west');
});

test('road trip: the map is painted exactly as approved, pixel for pixel', () => {
  const s = roadtrip.build(480, 96), sha = (p) => createHash('sha256').update(p.data).digest('hex').slice(0, 16);
  assert.deepEqual([sha(s.layers.colour), sha(s.layers.grey)], ['7bf1e42f20b08159', '8ced6214334516e9']);
});
```

- [ ] **Step 2: Run it**

Run: `node --test tests/reel/ch3-roadtrip.test.js`
Expected: `ℹ fail 0`. The new test passes before the change too: it pins today's map.

- [ ] **Step 3: Speed it up.** Apply to `reel/ch3/roadtrip.js`:

`reel/ch3/roadtrip.js`, change 1. Find:

```js
const TINTS = [[-125, '#a8ac68'], [-119, '#c4a870'], [-112, '#caa66e'], [-106, '#a88e66'], [-101, '#b8b46a'], [-95, '#9cb064'], [-88, '#86a660'], [-80, '#78985c'], [-66, '#6e8e58']];
const mix = (a, b, u) => '#' + hexToRgb(a).map((v, i) => Math.round(v + (hexToRgb(b)[i] - v) * u).toString(16).padStart(2, '0')).join('');
```

Replace with:

```js
// Colours here are [r, g, b], so the map's 150,000 pixels never go through a hex string.
const TINTS = [[-125, '#a8ac68'], [-119, '#c4a870'], [-112, '#caa66e'], [-106, '#a88e66'], [-101, '#b8b46a'], [-95, '#9cb064'], [-88, '#86a660'], [-80, '#78985c'], [-66, '#6e8e58']].map(([lon, hex]) => [lon, hexToRgb(hex)]);
const mix = (a, b, u) => a.map((v, i) => Math.round(v + (b[i] - v) * u));
```

`reel/ch3/roadtrip.js`, change 2. Find:

```js
  const ranges = RANGES.map(line => line.map(toMap));
  const nearRange = (x, y) => {
```

Replace with:

```js
  const segs = RANGES.map(line => line.map(toMap)).flatMap(m => m.slice(1).map((b, i) => [m[i], b]))
    .map(([[ax, ay], [bx, by]]) => ({ ax, ay, dx: bx - ax, dy: by - ay, x0: Math.min(ax, bx) - 4, x1: Math.max(ax, bx) + 4, y0: Math.min(ay, by) - 4, y1: Math.max(ay, by) + 4 }));
  const nearRange = (x, y) => {                                                    // distance to the nearest range, if within 4 px
```

`reel/ch3/roadtrip.js`, change 3. Find:

```js
    for (const line of ranges) for (let i = 1; i < line.length; i++) {
      const [ax, ay] = line[i - 1], [bx, by] = line[i], dx = bx - ax, dy = by - ay;
      const u = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
      best = Math.min(best, Math.hypot(x - ax - u * dx, y - ay - u * dy));
```

Replace with:

```js
    for (const g of segs) {
      if (x < g.x0 || x > g.x1 || y < g.y0 || y > g.y1) continue;
      const u = Math.max(0, Math.min(1, ((x - g.ax) * g.dx + (y - g.ay) * g.dy) / (g.dx * g.dx + g.dy * g.dy)));
      best = Math.min(best, Math.hypot(x - g.ax - u * g.dx, y - g.ay - u * g.dy));
```

`reel/ch3/roadtrip.js`, change 4. Find:

```js
  };
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
```

Replace with:

```js
  };
  const put = (x, y, [rr, gg, bb]) => { const k = (y * MAP_W + x) * 4; p.data[k] = rr; p.data[k + 1] = gg; p.data[k + 2] = bb; p.data[k + 3] = 255; };
  const CANADA_TINT = hexToRgb('#c4d0b0'), MEXICO_TINT = hexToRgb('#e0c89a'), SHADE = [0, 0, 0];
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
```

`reel/ch3/roadtrip.js`, change 5. Find:

```js
    if (lat > latAt(CANADA, lon)) c = mix(c, '#c4d0b0', 0.35);
    if (lat < latAt(MEXICO, lon)) c = mix(c, '#e0c89a', 0.4);
```

Replace with:

```js
    if (lat > latAt(CANADA, lon)) c = mix(c, CANADA_TINT, 0.35);
    if (lat < latAt(MEXICO, lon)) c = mix(c, MEXICO_TINT, 0.4);
```

`reel/ch3/roadtrip.js`, change 6. Find:

```js
    if (lon > -86 && d < 3) c = v < 0.5 ? '#5e7e4a' : '#6a8a54';                  // the green Appalachians
    else if (lon < -100 && d < 3.5) c = d < 1.6 && v < 0.3 ? '#efefe9' : v < 0.5 ? '#8e765a' : '#9a8262';   // the western ranges, snow on the crest
    else if (v < 0.05) c = mix(c, '#000000', 0.12);
    p.px(x, y, c);
```

Replace with:

```js
    if (lon > -86 && d < 3) p.px(x, y, v < 0.5 ? '#5e7e4a' : '#6a8a54');           // the green Appalachians
    else if (lon < -100 && d < 3.5) p.px(x, y, d < 1.6 && v < 0.3 ? '#efefe9' : v < 0.5 ? '#8e765a' : '#9a8262');   // the western ranges, snow on the crest
    else put(x, y, v < 0.05 ? mix(c, SHADE, 0.12) : c);
```

- [ ] **Step 4: Run every check, and time the build**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 210`, `ℹ fail 0`, then 16 `ok` lines and exit 0. The pinned hashes still match.

Run: `node -e "import('./reel/ch3/roadtrip.js').then(m => { const t0 = performance.now(); m.roadtrip.build(480, 96); console.log(Math.round(performance.now() - t0) + ' ms'); })"`
Expected: about 30 ms. Before the change it was about 85 ms.

- [ ] **Step 5: Commit**

```bash
git add reel/ch3/roadtrip.js tests/reel/ch3-roadtrip.test.js
git commit -m "perf(reel): Paint the road-trip map in a third of the time"
```

---

### Task 2: Each shot ready on time, and let go after

**Files:**
- Modify: `reel/timeline.js`, `reel/reel.js`
- Test: `tests/reel/timeline.test.js`

**Interfaces:**
- Produces: `nearShots(tl, t) → [shot on screen, next shot]`, wrapping from the last shot to the first.
- The engine, after each frame, calls `upkeep(current scene, next scene)`.
  - It drops every built scene but those two.
  - It builds the next one in idle time (`requestIdleCallback`, or a 30 ms timeout where that is missing).
  - The poster has no next scene.

- [ ] **Step 1: Write the failing test.** Apply to `tests/reel/timeline.test.js`:

`tests/reel/timeline.test.js`, change 1. Find:

```js
import { buildTimeline, locate, chapterStart, liveStep, parseDebug } from '../../reel/timeline.js';
```

Replace with:

```js
import { buildTimeline, locate, nearShots, chapterStart, liveStep, parseDebug } from '../../reel/timeline.js';
```

`tests/reel/timeline.test.js`, change 2. Find:

```js
  assert.equal(fadeAlpha({ duration: 4 }, 0), 0, 'no fade unless the shot sets one');
});
```

Replace with:

```js
  assert.equal(fadeAlpha({ duration: 4 }, 0), 0, 'no fade unless the shot sets one');
});

test('nearShots gives the shot on screen and the next one, wrapping at the end of the loop', () => {
  const tl = buildTimeline(CH), ids = (t) => nearShots(tl, t).map(s => s.id);
  assert.deepEqual(ids(1), ['a', 'b']);
  assert.deepEqual(ids(9), ['c', 'd']);
  assert.deepEqual(ids(15), ['d', 'a']);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/reel/timeline.test.js`
Expected: the file fails to load (`does not provide an export named 'nearShots'`).

- [ ] **Step 3: Implement.** Apply to `reel/timeline.js`:

`reel/timeline.js`, change 1. Find:

```js

export function chapterStart(tl, n) {
```

Replace with:

```js

// The shots whose scenes should be ready at t: the one on screen, and the one after it.
export function nearShots(tl, t) {
  const { index } = locate(tl, t);
  return [tl.shots[index].shot, tl.shots[(index + 1) % tl.shots.length].shot];
}

export function chapterStart(tl, n) {
```

Then apply to `reel/reel.js`:

`reel/reel.js`, change 1. Find:

```js
import { buildTimeline, locate, chapterStart, liveStep, parseDebug, fadeAlpha } from './timeline.js';
```

Replace with:

```js
import { buildTimeline, locate, nearShots, chapterStart, liveStep, parseDebug, fadeAlpha } from './timeline.js';
```

`reel/reel.js`, change 2. Find:

```js
  const scenes = new Map();           // scene definition -> built scene at the current width
```

Replace with:

```js
  // Scenes built at the current width: the one on screen and the next, which is built ahead in idle
  // time so its first frame is on time. Any other is dropped, so memory holds two shots at most.
  const scenes = new Map();
  let ahead = null;
```

`reel/reel.js`, change 3. Find:

```js
    return scenes.get(def);
  }
```

Replace with:

```js
    return scenes.get(def);
  }
  function upkeep(current, next) {
    for (const def of scenes.keys()) if (def !== current && def !== next) scenes.delete(def);
    if (!next || scenes.has(next) || ahead === next) return;
    ahead = next;
    (window.requestIdleCallback || ((f) => setTimeout(f, 30)))(() => { if (ahead === next) { ahead = null; if (W) sceneFor(next); } });
  }
```

`reel/reel.js`, change 4. Find:

```js
    let shot, local, chapter;
```

Replace with:

```js
    let shot, local, chapter, next = null;
```

`reel/reel.js`, change 5. Find:

```js
      shot = at.entry.shot; local = at.local; chapter = soloChapter ?? at.chapter;
```

Replace with:

```js
      shot = at.entry.shot; local = at.local; chapter = soloChapter ?? at.chapter; next = nearShots(tl, t)[1];
```

`reel/reel.js`, change 6. Find:

```js
    shot.scene.render(ctx, local, sceneFor(shot.scene), env, shot);
    const fade = showingPoster ? 0 : fadeAlpha(shot, local);
```

Replace with:

```js
    shot.scene.render(ctx, local, sceneFor(shot.scene), env, shot);
    upkeep(shot.scene, next && next.scene);
    const fade = showingPoster ? 0 : fadeAlpha(shot, local);
```

- [ ] **Step 4: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 211`, `ℹ fail 0`, then 16 `ok` lines and exit 0.

- [ ] **Step 5: Commit**

```bash
git add reel/timeline.js reel/reel.js tests/reel/timeline.test.js
git commit -m "perf(reel): Build each shot ahead in idle time, and drop it once it is over"
```

---

### Task 3: The pencil tone

**Files:**
- Modify: `reel/pixels.js`, `reel/reel.js`
- Test: `tests/reel/pixels.test.js` (append)

**Interfaces:**
- Produces: `pencil(hex) → hex`, a colour as drawn in pencil on paper, from its luminance `l`:
  - below 70, graphite: `64 + l / 2`
  - from 70 up, paper, a little greyer the darker it was: `242 − (255 − l) × 0.14`
  - The value goes to the three channels as `v`, `v − 3` and `v − 10`, so `#000000` becomes `#403d36` and `#ffffff` becomes `#f2efe8`.
- Produces: tone `'sketch'` in `env.hero(key, pose, tone)` and `env.dog(key, pose, tone)`, mapped through `pencil`. In the engine, tones are a table: `{ muted, sketch }`.

- [ ] **Step 1: Write the failing test.** Append to `tests/reel/pixels.test.js`:

```js
test('pencil turns a colour into graphite or paper, as drawn on a page', async () => {
  const { pencil } = await import('../../reel/pixels.js');
  assert.equal(pencil('#000000'), '#403d36', 'black is graphite');
  assert.equal(pencil('#ffffff'), '#f2efe8', 'white is paper');
  const [r] = hexToRgb(pencil('#6c4fb6')), [k] = hexToRgb(pencil('#22202a'));
  assert.ok(r > 200 && k < 100, 'a purple hoodie goes pale, an outline stays dark');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/reel/pixels.test.js`
Expected: 1 failure in `pencil turns a colour …` (`pencil is not a function`).

- [ ] **Step 3: Implement.** Apply to `reel/pixels.js`:

`reel/pixels.js`, change 1. Find:

```js

// Rows + palette -> rows of hex colours ('.' stays '.'); what a sprite actually looks like.
```

Replace with:

```js

// A colour as drawn in pencil on paper, for chapter 5's sketch: the dark tones become graphite and the
// rest paper, a little greyer the darker they were.
export function pencil(hex) {
  const [r, g, b] = hexToRgb(hex), l = 0.3 * r + 0.59 * g + 0.11 * b;
  const v = Math.round(l < 70 ? 64 + l * 0.5 : 242 - (255 - l) * 0.14);
  return '#' + [v, v - 3, v - 10].map(c => c.toString(16).padStart(2, '0')).join('');
}

// Rows + palette -> rows of hex colours ('.' stays '.'); what a sprite actually looks like.
```

Then apply to `reel/reel.js`:

`reel/reel.js`, change 1. Find:

```js
import { mute } from './pixels.js';
```

Replace with:

```js
import { mute, pencil } from './pixels.js';
```

`reel/reel.js`, change 2. Find:

```js
const MUTE = 0.6;                     // how grey the cast goes in Michigan's 'muted' tone
```

Replace with:

```js
const MUTE = 0.6;                     // how grey the cast goes in Michigan's 'muted' tone
const TONES = { muted: (c) => mute(c, MUTE), sketch: pencil };
```

`reel/reel.js`, change 3. Find:

```js
// A sprite in a tone: 'full' as drawn, or 'muted' with every colour pulled towards grey.
```

Replace with:

```js
// A sprite in a tone: 'full' as drawn, 'muted' with every colour pulled towards grey, or 'sketch' in
// pencil on paper.
```

`reel/reel.js`, change 4. Find:

```js
  if (tone !== 'muted') return sprite;
  return { ...sprite, palette: Object.fromEntries(Object.entries(sprite.palette).map(([k, v]) => [k, mute(v, MUTE)])) };
```

Replace with:

```js
  const f = TONES[tone];
  if (!f) return sprite;
  return { ...sprite, palette: Object.fromEntries(Object.entries(sprite.palette).map(([k, v]) => [k, f(v)])) };
```

- [ ] **Step 4: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 212`, `ℹ fail 0`, then 16 `ok` lines and exit 0.

- [ ] **Step 5: Commit**

```bash
git add reel/pixels.js reel/reel.js tests/reel/pixels.test.js
git commit -m "feat(reel): Add a pencil tone for the cast"
```

---

### Task 4: The world ahead, in pencil

**Files:**
- Create: `reel/ch5/sketch.js`
- Test: `tests/reel/ch5-sketch.test.js` (new)

**Interfaces:**
- Consumes: `buildBeach` from `reel/beach.js` (its layers, `horizon`, `feet` and `glitter`); the `sketch` tone (Task 3); `Painter`; `tile`.
- Produces: `pencilLayer(painter) → Painter`, the same size.
  - Tones are averaged over 3 × 3 first, with columns wrapping, so dithering draws no lines and tiling layers still tile.
  - A graphite line goes wherever the averaged tone changes by more than 16, or next to an empty pixel.
  - The darkest parts (below 75) are hatched every fourth diagonal. Everything else is paper, and empty pixels stay empty.
- Produces: `frontierAt(s, t, y)`, the frontier's column in row `y`.
  - It starts 75 px ahead of Yimeng's left edge and comes along at the walk's 26 px/s.
  - Two sines make it ragged.
- Produces: `sketch`, a scene with every beach layer plus a `pencil_` twin of each. It exposes `hx = round(0.34 W)`.
  - The colour world, its glitter and the cast in full tone are drawn up to the frontier.
  - The pencil world and the cast in `sketch` tone are drawn past it. From 60 px past the frontier the paper fades in over the lines, until it is blank 150 px past it.
  - A ragged graphite stroke marks the frontier.

- [ ] **Step 1: Write the failing test.** Create `tests/reel/ch5-sketch.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { Painter } from '../../reel/pixels.js';
import { sketch, frontierAt, pencilLayer } from '../../reel/ch5/sketch.js';

sceneContract('ch5 sketch', sketch, 4);

test('sketch: every beach layer has a pencil twin, the same size', () => {
  const s = sketch.build(480, 96);
  for (const k of ['sky', 'clouds', 'head', 'ocean', 'beach', 'walk', 'fg']) {
    assert.deepEqual([s.layers[`pencil_${k}`].w, s.layers[`pencil_${k}`].h], [s.layers[k].w, s.layers[k].h], k);
  }
});

test('pencilLayer: a line where a shape ends, paper inside it, nothing where it is empty', () => {
  const src = new Painter(8, 8);
  for (let y = 2; y < 6; y++) for (let x = 2; x < 6; x++) src.px(x, y, '#3a76b8');
  const p = pencilLayer(src), at = (x, y) => [...p.data.slice((y * 8 + x) * 4, (y * 8 + x) * 4 + 4)];
  assert.ok(at(2, 2)[0] < 150, 'a graphite edge');
  assert.equal(at(0, 0)[3], 0, 'still empty outside');
  assert.ok(at(3, 3)[0] > at(2, 2)[0], 'paler inside than on the edge');
});

test('sketch: the frontier comes along the boardwalk at walking pace, and Yimeng and the dog cross it', () => {
  const s = sketch.build(480, 96);
  assert.equal(frontierAt(s, 0, 10) - frontierAt(s, 1, 10), 26);
  assert.ok(frontierAt(s, 0, 60) > s.hx + 52, 'it starts ahead of the dog');
  assert.ok(frontierAt(s, 4, 60) < s.hx, 'and ends behind Yimeng');
});

test('sketch: the world is drawn twice, in colour and in pencil, the cast in both tones', () => {
  const names = frameAt(sketch, 480, 2).ctx.calls.filter(c => c[0] === 'drawImage').map(c => c[1]);
  for (const n of ['sky', 'walk', 'pencil_sky', 'pencil_walk']) assert.ok(names.includes(n), n);
  assert.ok(names.some(n => /^work:walk:\d$/.test(n)) && names.some(n => /^work:walk:sketch:\d$/.test(n)));
  assert.ok(names.some(n => /^dog:houndstooth:\d$/.test(n)) && names.some(n => /^dog:houndstooth:sketch:\d$/.test(n)));
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/reel/ch5-sketch.test.js`
Expected: the file fails to load (`Cannot find module …/reel/ch5/sketch.js`).

- [ ] **Step 3: Implement.** Create `reel/ch5/sketch.js`:

```js
// Chapter 5: to be continued. The sunset boardwalk of the beach scene, and ahead of Yimeng the world
// turns into an unfinished pencil sketch. The frontier comes along the boardwalk, and Yimeng, in the
// California hoodie, and the dog, in its houndstooth, walk into it and are drawn in pencil too.
// Further on, the lines thin out to blank paper.
import { Painter } from '../pixels.js';
import { tile } from '../kit.js';
import { buildBeach } from '../beach.js';

const SPEED = 26;                            // the walk, px/s at the boardwalk, as on the beach
const AHEAD = 75;                            // how far ahead of Yimeng the sketch starts
const BLANK = [60, 150];                     // past the frontier: where the lines start to thin, and where the paper is blank
const PAPER = '#f2efe8';
const LAYERS = [['clouds', 0.06], ['head', 0.12], ['ocean', 0.25], ['beach', 0.5], ['walk', 1]];

// A layer redrawn in pencil: a graphite line wherever the tone changes or a shape ends, hatching in
// the darkest parts, paper everywhere else. Tones are averaged over 3 x 3 first, so dithering draws
// no lines. Empty pixels stay empty; columns wrap, so tiling layers still tile.
export function pencilLayer(src) {
  const { w, h, data } = src, p = new Painter(w, h), L = new Float32Array(w * h), S = new Float32Array(w * h);
  for (let k = 0; k < w * h; k++) L[k] = data[k * 4 + 3] ? 0.3 * data[k * 4] + 0.59 * data[k * 4 + 1] + 0.11 * data[k * 4 + 2] : -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let sum = 0, n = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const yy = y + j, v = yy < 0 || yy >= h ? -1 : L[yy * w + ((x + i + w) % w)];
      if (v >= 0) { sum += v; n++; }
    }
    S[y * w + x] = L[y * w + x] < 0 ? -1 : sum / n;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = y * w + x, l = S[k];
    if (l < 0) continue;
    const right = S[y * w + ((x + 1) % w)], down = y + 1 < h ? S[k + w] : l, up = y > 0 ? S[k - w] : l, left = S[y * w + ((x - 1 + w) % w)];
    const e = Math.abs(l - Math.max(0, right)) + Math.abs(l - Math.max(0, down)) + (Math.min(right, down, up, left) < 0 ? 40 : 0);
    const v = e > 16 ? Math.max(72, 150 - e * 1.5) : l < 75 && (x + y) % 4 === 0 ? 176 : 242;
    const o = k * 4;
    p.data[o] = v; p.data[o + 1] = v - 3; p.data[o + 2] = v - 10; p.data[o + 3] = 255;
  }
  return p;
}

// Where the frontier is on screen at t, in row y: coming along with the boardwalk, and ragged.
export const frontierAt = (s, t, y) => Math.round(s.hx + AHEAD - t * SPEED + Math.sin(y * 0.7) * 2 + Math.sin(y * 0.23 + 1) * 3);

export function buildSketch(W, H = 96) {
  const b = buildBeach(W, H), layers = { ...b.layers };
  for (const [k, p] of Object.entries(b.layers)) layers[`pencil_${k}`] = pencilLayer(p);
  return { ...b, hx: Math.round(W * 0.34), layers };
}

// The world, either in colour (prefix '') or in pencil ('pencil_'), clipped to [from, to) in each row.
function world(ctx, t, s, env, prefix, tone, from, to) {
  const { W, H, canvases: c, hx } = s;
  ctx.save(); ctx.beginPath();
  for (let y = 0; y < H; y++) { const a = Math.max(0, from(y)), b = Math.min(W, to(y)); if (b > a) ctx.rect(a, y, b - a, 1); }
  ctx.clip();
  ctx.drawImage(c[prefix + 'sky'], 0, 0);
  for (const [k, par] of LAYERS) tile(ctx, c[prefix + k], t * SPEED * par, k === 'ocean' ? s.horizon + 1 : 0);
  tile(ctx, c[prefix + 'fg'], t * SPEED * 1.3, 0);
  if (!prefix) {
    const tick = Math.floor(t * 6);                                               // the sun's glitter, in colour only
    s.glitter.forEach(([x, y, r], n) => { if (((n * 7 + tick) % 5) < 2) { ctx.fillStyle = r > 0.6 ? '#fff4c8' : '#ffd27e'; ctx.fillRect(Math.round(x), y, r > 0.8 ? 2 : 1, 1); } });
  } else {
    const edge = from(0);                                                          // the lines thinning out to blank paper
    ctx.fillStyle = PAPER;
    for (let x = Math.max(0, edge + BLANK[0]); x < W; x += 2) {
      ctx.globalAlpha = Math.min(1, (x - edge - BLANK[0]) / (BLANK[1] - BLANK[0])); ctx.fillRect(x, 0, 2, H);
    }
    ctx.globalAlpha = 1;
  }
  const hero = env.hero('work', 'walk', tone), dog = env.dog('houndstooth', 'trot', tone);
  ctx.drawImage(hero.canvases[Math.floor(t * 6) % 4], hx - hero.anchorX, s.feet - hero.footY);
  ctx.drawImage(dog.canvases[Math.floor(t * 9) % 4], hx + 28 - dog.anchorX, s.feet - dog.footY);
  ctx.restore();
}

export function renderSketch(ctx, t, s, env) {
  const { W, H } = s, edge = (y) => frontierAt(s, t, y);
  ctx.clearRect(0, 0, W, H);
  world(ctx, t, s, env, '', 'full', () => 0, edge);
  world(ctx, t, s, env, 'pencil_', 'sketch', edge, () => W);
  ctx.fillStyle = '#5a5650';                                                       // the frontier: a ragged pencil stroke
  for (let y = 0; y < H; y++) if ((y * 7) % 11 < 8) ctx.fillRect(edge(y), y, 1, 1);
}

export const sketch = { build: buildSketch, render: renderSketch };
```

- [ ] **Step 4: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 218`, `ℹ fail 0`, then 16 `ok` lines and exit 0. Task 5 adds the shot to the reel.

- [ ] **Step 5: Commit**

```bash
git add reel/ch5/sketch.js tests/reel/ch5-sketch.test.js
git commit -m "feat(reel): Add chapter 5: the world ahead in pencil"
```

---

### Task 5: The reel complete

**Files:**
- Create: `reel/ch5/index.js`
- Modify (rewrite): `reel/story.js`
- Modify: `index.html`, `docs/superpowers/specs/2026-10-03-life-reel-design.md`
- Test: `tests/reel/ch5-chapter.test.js` (new), `tests/reel/story.test.js` (new)

**Interfaces:**
- Consumes: `sketch` (Task 4).
- Produces: `CHAPTER_5 = { name: 'To be continued', shots: [ch5-sketch] }`. `CHAPTERS` becomes the five chapter modules, and the stand-in helper is gone.
- The canvas's `aria-label` now names the road trip and California's office, ranch, woods and sea. The hrefs do not change.

- [ ] **Step 1: Write the failing tests.** Create `tests/reel/ch5-chapter.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTER_5 } from '../../reel/ch5/index.js';

test('chapter 5 is the pencil sketch, 4 s, fading in from the sunset and out to the loop', () => {
  assert.equal(CHAPTER_5.name, 'To be continued');
  assert.deepEqual(CHAPTER_5.shots.map(s => [s.id, s.caption, s.duration]), [['ch5-sketch', 'To be continued…', 4]]);
  assert.ok(CHAPTER_5.shots[0].fadeIn > 0 && CHAPTER_5.shots[0].fadeOut > 0);
});
```

Create `tests/reel/story.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, POSTER } from '../../reel/story.js';
import { buildTimeline } from '../../reel/timeline.js';
import { beach } from '../../reel/beach.js';

test('the reel: five chapters, 68.1 s, every shot built and named once', () => {
  const tl = buildTimeline(CHAPTERS), ids = tl.shots.map(e => e.shot.id);
  assert.deepEqual(CHAPTERS.map(c => c.name), ['Sheffield', 'New York', 'Michigan', 'California', 'To be continued']);
  assert.equal(Math.round(tl.duration * 10) / 10, 68.1);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(tl.shots.every(e => e.shot.scene !== beach), 'no stand-ins left');
});

test('the loop closes: the last shot fades out and Sheffield fades in', () => {
  assert.ok(CHAPTERS.at(-1).shots.at(-1).fadeOut > 0);
  assert.ok(CHAPTERS[0].shots[0].fadeIn > 0);
});

test('the reduced-motion poster is the beach scene, in chapter 4', () => {
  assert.equal(POSTER.scene, beach);
  assert.equal(POSTER.chapter, 3);
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `node --test tests/reel/ch5-chapter.test.js tests/reel/story.test.js`
Expected: `ℹ fail 3`:
- `ch5-chapter.test.js` fails to load (`Cannot find module …/reel/ch5/index.js`).
- In `story.test.js`, `the reel: …` fails on `no stand-ins left`, and `the loop closes …` fails because the stand-in does not fade out.

- [ ] **Step 3: Implement.** Create `reel/ch5/index.js`:

```js
// Chapter 5: to be continued, in pencil.
import { sketch } from './sketch.js';

export const CHAPTER_5 = {
  name: 'To be continued',
  shots: [
    { id: 'ch5-sketch', scene: sketch, caption: 'To be continued…', duration: 4, fadeIn: 0.3, fadeOut: 0.5 },
  ],
};
```

Replace `reel/story.js` with:

```js
// The reel's running order, chapter by chapter. It loops: chapter 5 fades out, and Sheffield fades in.
import { beach } from './beach.js';
import { CHAPTER_1 } from './ch1/index.js';
import { CHAPTER_2 } from './ch2/index.js';
import { CHAPTER_3 } from './ch3/index.js';
import { CHAPTER_4 } from './ch4/index.js';
import { CHAPTER_5 } from './ch5/index.js';

export const CHAPTERS = [CHAPTER_1, CHAPTER_2, CHAPTER_3, CHAPTER_4, CHAPTER_5];

// Shown, still, to visitors who prefer reduced motion (chapter 4 = California).
export const POSTER = { id: 'poster', scene: beach, caption: 'California', duration: 1, chapter: 3 };
```

Apply to `index.html`:

`index.html`, change 1. Find:

```js
    <canvas class="reel-canvas" role="img" aria-label="Pixel-art animation: a small Yimeng walks to the right through five chapters of life, from Sheffield and travels across Europe, to New York and Columbia, a PhD in Michigan, and California, with a dog alongside from 2019. To be continued."></canvas>
```

Replace with:

```js
    <canvas class="reel-canvas" role="img" aria-label="Pixel-art animation: a small Yimeng walks to the right through five chapters of life: Sheffield and travels across Europe; New York and Columbia; a PhD in Michigan and a road trip across America; and California, from the office to a ranch, the woods and the sea. A dog walks alongside from 2019. To be continued, in pencil."></canvas>
```

- [ ] **Step 4: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 222`, `ℹ fail 0`, then 16 `ok` lines and exit 0, including `every href in index.html is unchanged`.

- [ ] **Step 5: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 63.95,64.25,64.6,65.6,66.6,67.6,67.95,0.1 && python3 tests/reel/sheet.py /tmp/f /tmp/f-end.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 64.6,65.8,66.9,67.8 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-end.png 3
```

Expected:
- 63.95 s: the sunset fading out.
- 64.25 s: the sunset boardwalk fading in, Yimeng in the purple hoodie and the dog in houndstooth walking right. Past a ragged pencil line ahead, the same boardwalk in pencil: palms, fence and horizon in graphite, the dark sky hatched. Beyond that is blank paper.
- 64.6 s: the frontier just ahead of the dog.
- 65.6 s: the dog crossing, its front drawn in pencil.
- 66.6 s: Yimeng crossing, the face in pencil and the back still in colour.
- 67.6 s: both in pencil, the lines ahead thinning out to blank paper.
- 67.95 s: fading out.
- 0.1 s: Sheffield fading in. The loop has closed.
- On the phone, the same at 195 px, with Yimeng half in colour, half in pencil at 66.9 s.

- [ ] **Step 6: Update the spec.** Apply to `docs/superpowers/specs/2026-10-03-life-reel-design.md`:

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 1. Find:

```markdown
### 5 · To be continued (~3 s). Caption: `To be continued…`
```

Replace with:

```markdown
### 5 · To be continued (~4 s). Caption: `To be continued…`
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 2. Find:

```markdown
The world ahead turns into an unfinished pencil sketch, and Yimeng (California outfit) and the dog (houndstooth) walk into it. The reel then loops back to Sheffield.
```

Replace with:

```markdown
The sunset boardwalk of the beach scene fades in from the sunset before it, and the world ahead of Yimeng is an unfinished pencil sketch.
- A ragged pencil frontier comes along the boardwalk. Yimeng (California outfit) and the dog (houndstooth) walk into it and are drawn in pencil too, half in colour while they cross.
- Further on, the lines thin out to blank paper.
- The shot fades out, and the reel loops back to Sheffield, which fades in.
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 3. Find:

```markdown
  - `reel/story.js` holds the running order and imports one folder per chapter (`reel/ch1/` … `reel/ch5/`) as each is built: an `index.js` with the chapter's shots, and one module per location.
  - `reel/beach.js` holds the approved beach scene, which is also the reduced-motion poster.
```

Replace with:

```markdown
  - `reel/story.js` holds the running order and imports one folder per chapter (`reel/ch1/` … `reel/ch5/`): an `index.js` with the chapter's shots, and one module per location.
  - `reel/beach.js` holds the approved beach scene. It is the reduced-motion poster, and the boardwalk that chapter 5 turns into a sketch.
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 4. Find:

```markdown
- **Rendering:** layers are pre-rendered once into offscreen canvases that tile seamlessly. They are built lazily just before a shot starts and released after it ends. Each frame composes the layers and actors onto one canvas at native resolution, about 480×96 on desktop, which the browser scales. The grey Michigan palette uses palette-derived muted variants of the cast (`env.hero(key, pose, 'muted')`), and the road trip draws a pre-greyed copy of the map under the coloured one, clipped to a circle that grows from East Lansing. Neither uses `ctx.filter`, which Safari lacks. All layouts use a seeded PRNG, so every play looks the same.
```

Replace with:

```markdown
- **Rendering:** layers are pre-rendered once into offscreen canvases that tile seamlessly. Each shot's layers are built ahead, in idle time while the shot before it plays, and released once it has ended, so no more than two shots' layers are held at once. Each frame composes the layers and actors onto one canvas at native resolution, about 480×96 on desktop, which the browser scales. The grey Michigan palette uses palette-derived muted variants of the cast (`env.hero(key, pose, 'muted')`), and the road trip draws a pre-greyed copy of the map under the coloured one, clipped to a circle that grows from East Lansing. Chapter 5 draws every layer of the beach again in pencil (a graphite line wherever the tone changes, hatching in the darkest parts) and the cast in a `sketch` tone, and splits the two along the frontier by clipping. None of these uses `ctx.filter`, which Safari lacks. All layouts use a seeded PRNG, so every play looks the same.
```

- [ ] **Step 7: Commit**

```bash
git add reel/ch5/index.js reel/story.js index.html tests/reel/ch5-chapter.test.js tests/reel/story.test.js docs/superpowers/specs/2026-10-03-life-reel-design.md
git commit -m "feat(reel): Close the loop with chapter 5, to be continued in pencil"
```

---

### Task 6: Final QA

**Files:**
- Create: `tests/reel/qa.mjs`
- Modify: `docs/superpowers/specs/2026-10-03-life-reel-design.md`

**Interfaces:**
- Produces: `node tests/reel/qa.mjs <url>`. It prints an `ok` or `FAIL` line per check and exits non-zero on any failure. The checks:
  - every shot, looping by its id at 1440 and 390 px in turn, then the reel from the top, with no console error
  - with scripts off, `#reel` is `display: none` and About starts where the header ends
  - with scripts on, About's top is the same at `DOMContentLoaded` and after the reel mounts, and there are 5 chapter buttons

- [ ] **Step 1: Write the sweep.** Create `tests/reel/qa.mjs`:

```js
// Final checks on the real page, through headless Chrome: every shot plays without a console error,
// the page without JavaScript has no reel and no gap, and the page does not shift when the reel mounts.
// Usage: node tests/reel/qa.mjs http://127.0.0.1:8000/
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CHAPTERS } from '../../reel/story.js';
import { buildTimeline } from '../../reel/timeline.js';

const BASE = process.argv[2] || 'http://127.0.0.1:8000/';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9600 + Math.floor(Math.random() * 90);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'reel-qa-'))}`, 'about:blank'], { stdio: 'ignore' });
let failed = 0;
const report = (ok, name, detail = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} - ${name}${ok || !detail ? '' : ': ' + detail}`); if (!ok) failed = 1; };

try {
  let target;
  for (let i = 0; i < 50 && !target; i++) { await sleep(100); try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page'); } catch {} }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });
  let id = 0;
  const pending = new Map(), errors = [], waiters = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id) pending.get(msg.id)?.(msg.result);
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a => a.value ?? a.description).join(' '));
    if (msg.method) waiters.filter(w => w.method === msg.method).forEach(w => w.res());
  };
  const send = (method, params = {}) => new Promise(res => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
  const once = (method) => new Promise(res => waiters.push({ method, res }));
  const open = async (url, width) => {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 1100, deviceScaleFactor: 1, mobile: width < 600 });
    const loaded = once('Page.loadEventFired');
    await send('Page.navigate', { url });
    await loaded;
  };
  const value = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true })).result.value;
  await send('Page.enable'); await send('Runtime.enable');

  // every shot, looping on its own, at desktop and phone widths in turn; then the reel from the top
  const shots = buildTimeline(CHAPTERS).shots.map(e => e.shot.id);
  for (const [i, shot] of shots.entries()) { await open(`${BASE}?reel=${shot}`, i % 2 ? 390 : 1440); await sleep(600); }
  await open(`${BASE}#reel`, 1440); await sleep(3000);
  report(errors.length === 0, `all ${shots.length} shots play without a console error`, errors.join(' | '));

  // without JavaScript: no reel, and About straight under the hero
  await send('Emulation.setScriptExecutionDisabled', { value: true });
  await open(BASE, 1440); await sleep(300);
  const noJs = await value("({ reel: getComputedStyle(document.querySelector('#reel')).display, gap: Math.round(document.querySelector('#about').getBoundingClientRect().top - document.querySelector('header').getBoundingClientRect().bottom) })");
  report(noJs.reel === 'none' && noJs.gap <= 0, 'without JavaScript the reel is hidden and leaves no gap', JSON.stringify(noJs));
  await send('Emulation.setScriptExecutionDisabled', { value: false });

  // with JavaScript: About is where it was while the page was still loading
  await send('Page.addScriptToEvaluateOnNewDocument', { source: "document.addEventListener('DOMContentLoaded', () => { window.__aboutAt = document.querySelector('#about').getBoundingClientRect().top; });" });
  await open(BASE, 1440); await sleep(1500);
  const shift = await value("({ before: Math.round(window.__aboutAt), after: Math.round(document.querySelector('#about').getBoundingClientRect().top), buttons: document.querySelectorAll('.reel-ch').length })");
  report(shift.before === shift.after && shift.buttons === 5, 'the page does not shift when the reel mounts', JSON.stringify(shift));
  ws.close();
} finally {
  chrome.kill();
}
process.exit(failed);
```

- [ ] **Step 2: Run it**

Run: `node tests/reel/qa.mjs http://127.0.0.1:8000/`
Expected, and exit 0:

```text
ok   - all 29 shots play without a console error
ok   - without JavaScript the reel is hidden and leaves no gap
ok   - the page does not shift when the reel mounts
```

- [ ] **Step 3: Look at every shot once more**

```bash
T=$(node -e "import('./reel/story.js').then(async ({ CHAPTERS }) => { const { buildTimeline } = await import('./reel/timeline.js'); console.log(buildTimeline(CHAPTERS).shots.map(e => (e.start + (e.end - e.start) * 0.6).toFixed(2)).join(',')); })")
rm -rf /tmp/qa && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/qa --width 1440 --times $T && python3 tests/reel/sheet.py /tmp/qa /tmp/qa-desk.png 1
rm -rf /tmp/qam && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/qam --width 390 --mobile --times $T && python3 tests/reel/sheet.py /tmp/qam /tmp/qa-phone.png 1
```

Expected: 29 frames at each width, one per shot, from the Sheffield rain to the pencil sketch. Every scene is drawn, with nothing cut off or blank. At 195 px, Yimeng, the dog and each shot's subject are all on screen.

- [ ] **Step 4: Update the spec.** Apply to `docs/superpowers/specs/2026-10-03-life-reel-design.md`:

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 1. Find:

```markdown
- **Layout:** the page height and positions do not shift when the reel script loads.
```

Replace with:

```markdown
- **Layout:** the page height and positions do not shift when the reel script loads.
- **QA sweep:** `tests/reel/qa.mjs` checks the last three in headless Chrome. It plays every shot looking for console errors, loads the page without JavaScript, and measures About before and after the reel mounts.
```

- [ ] **Step 5: Commit**

```bash
git add tests/reel/qa.mjs docs/superpowers/specs/2026-10-03-life-reel-design.md
git commit -m "test(reel): Add a final QA sweep: console, no JavaScript, layout shift"
```

- [ ] **Step 6: Hand over for review.** Give the user `http://127.0.0.1:8000/` (the whole reel, from `01` to `05` and round again) and `http://127.0.0.1:8000/?reel=ch5-sketch`, then stop. Merging `life-reel` into `main` deploys the site, so it waits for the user's explicit go-ahead.
