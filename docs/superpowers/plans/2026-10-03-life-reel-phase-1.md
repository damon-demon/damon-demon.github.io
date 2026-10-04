# Life Reel — Phase 1 (Engine and Cast) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put a working life-reel banner on the homepage. This phase delivers the playback engine, the full approved cast (Yimeng in all 19 outfits, the dog in all 8) and the approved California beach scene. Until each chapter is built, a beach stand-in plays it.

**Architecture:** All pixel and timing logic lives in pure ES modules (`pixels`, `hero`, `dog`, `beach`, `timeline`), unit-tested with Node's built-in test runner. Golden fixtures, generated from the approved mockups in `.superpowers/pixel-mock/`, hold the sprites and the beach scene to the exact pixels the user approved. A thin DOM layer (`sprites.js`, `reel.js`) turns grids into canvases and runs playback. A headless-Chrome script checks the behaviour on the real page.

**Tech Stack:** Vanilla JS (ES modules, Canvas 2D) and CSS. Node 25 `node:test` for unit tests. Python 3 for fixture generation and the local static server. Headless Google Chrome for page checks and screenshots.

**Spec:** `docs/superpowers/specs/2026-10-03-life-reel-design.md`

## Global Constraints

- No framework, no build step, no npm dependencies. The page loads `<script type="module" src="reel/reel.js">` and GitHub Pages serves the files as they are.
- All on-screen text is English. Captions are place names only: `Sheffield`, `Europe`, `New York`, `Michigan`, `California`, `To be continued…`.
- The native canvas height is 96 px. Scale is 2× at viewport ≤600 px, 3× up to 1800 px, 4× above that. Native width = `ceil(stage width / scale)`.
- The stage fades into `--bg` over its top 34% and bottom 12%, with a film-grain overlay at opacity 0.07.
- Playback starts only when ≥25% of the banner is visible and pauses offscreen. Redraws are capped at 30 fps, and the reel loops.
- With `prefers-reduced-motion: reduce` there is no autoplay: a still poster frame (the beach scene) shows, with a play button.
- Without JS the section is hidden, because its styles apply only under `html.js`.
- A pause/play button is required (WCAG 2.2.2). Chapter buttons are `<button>`s labelled `Chapter n: Place`.
- Debug hook: `?reel=<seconds>` renders that moment paused; `?reel=<shot-id>` loops one shot.
- Every existing `href` in `index.html` stays unchanged. The About path only gains the `is-live` class.
- All work is on branch `life-reel`. Do not merge, and do not push.
- Sprites and the beach scene must match the approved mockups pixel for pixel; the golden tests enforce this.

## File structure

| File | Responsibility |
|---|---|
| `reel/pixels.js` | Pure pixel helpers: text grids with generated outlines, Bresenham lines, recolouring, the seeded PRNG, an RGBA `Painter`, banded gradients |
| `reel/hero.js` | Yimeng's rig and all 19 outfits. `heroSprite(key)` returns the 4-frame walk cycle |
| `reel/dog.js` | The dog, adult and puppy, in its 8 outfits. `dogSprite(key)` returns the 4-frame trot |
| `reel/beach.js` | The approved beach scene: pure `buildBeach(W)` plus `renderBeach(ctx, t, scene, env)` |
| `reel/timeline.js` | Pure clock maths: chapters of shots to absolute times, `locate`, chapter starts, the step mapping, `?reel=` parsing |
| `reel/sprites.js` | DOM adapter that turns grids and Painters into canvases |
| `reel/story.js` | Running order. This phase uses beach stand-ins for all five chapters, plus the reduced-motion poster |
| `reel/reel.js` | The engine: mount, size, clock, render, captions, chapter buttons, pause, IntersectionObserver, reduced motion, debug hooks, timeline sync |
| `index.html` | `<section id="reel">` markup after the hero, and the module script tag |
| `style.css` | `Reel` block, `.step.is-live`, mobile tweaks |
| `tests/reel/*.test.js` | Node unit tests |
| `tests/reel/fixtures/*` | Golden fixtures and the scripts that generate them from the approved mockups |
| `tests/reel/page-check.sh` | Headless-Chrome DOM checks on the real page |
| `tests/reel/shoot.mjs` | DevTools-protocol screenshots (390 px phone, scroll-to, reduced motion, no-JS) |

This refines the spec's file list. The cast is split into `hero.js` and `dog.js`, and `timeline.js`, `sprites.js`, `story.js` and `beach.js` are new. The chapter files (`ch1-…`) come in later phases. Task 7 updates the spec to match.

## How to run things

- Unit tests: `node --test 'tests/reel/*.test.js'`. Quote the glob: Node 25 treats a bare directory argument as a file and fails.
- Page checks: `tests/reel/page-check.sh`. It serves the repo on port 8137 and needs Google Chrome at the default macOS path, or set `CHROME`.
- Screenshots: start `python3 -m http.server 8000 --bind 127.0.0.1` from the repo root, then run `node tests/reel/shoot.mjs <url> <out.png> [options]`.

---

### Task 1: Pixel helpers

**Files:**
- Create: `reel/pixels.js`
- Test: `tests/reel/pixels.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `parseRows(part: string | string[]) → string[]`: strings lose leading and trailing newlines and are padded with `.` to equal width. Arrays pass through untouched.
  - `class Grid(w, h)` with `get(x, y)` (`'.'` outside the grid), `set(x, y, ch)` (ignored outside), `stamp(part, ox, oy, { outline, over, opaqueOnly })`, `outlineAll(color)` and `rows() → string[]`.
  - `line(grid, x0, y0, x1, y1, col, width = 1) → [x, y][]`, where `col` is a character or `(i, n) => character`.
  - `recolor(part, mapping, rowFrom = 0, rowTo = 99) → string[]`.
  - `rng(seed) → () => number in [0, 1)`, `hexToRgb(hex) → [r, g, b]` and `resolve(rows, palette) → (hex | '.')[][]`.
  - `class Painter(w, h)` with `w`, `h`, `data: Uint8ClampedArray` (RGBA), `px(i, j, hex)`, `wpx(i, j, hex)` (wraps x) and `rect(i, j, w, h, hex)`.
  - `bandColor(stops: [hex, t][], t, i, j) → hex`.

- [ ] **Step 1: Write the failing test**

Create `tests/reel/pixels.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRows, Grid, line, recolor, rng, hexToRgb, resolve, Painter, bandColor } from '../../reel/pixels.js';

test('parseRows trims surrounding newlines and pads rows to equal width', () => {
  assert.deepEqual(parseRows('\nab\nc\n'), ['ab', 'c.']);
  assert.deepEqual(parseRows(['x', 'yz']), ['x', 'yz'], 'row arrays pass through untouched');
});

test('Grid ignores writes outside and reads them as transparent', () => {
  const g = new Grid(2, 2);
  g.set(5, 5, 'A');
  assert.equal(g.get(5, 5), '.');
  g.set(1, 0, 'A');
  assert.deepEqual(g.rows(), ['.A', '..']);
});

test('stamp draws the part and, with outline, a 4-neighbour ring over transparent pixels', () => {
  const g = new Grid(3, 3);
  g.stamp('A', 1, 1, { outline: 'k' });
  assert.deepEqual(g.rows(), ['.k.', 'kAk', '.k.']);
});

test('stamp outline modes: over replaces anything, opaqueOnly only touches drawn pixels', () => {
  const over = new Grid(3, 1); over.stamp('BBB', 0, 0); over.stamp('A', 1, 0, { outline: 'k', over: true });
  assert.deepEqual(over.rows(), ['kAk']);
  const opaque = new Grid(3, 1); opaque.stamp('B', 0, 0); opaque.stamp('A', 1, 0, { outline: 'k', opaqueOnly: true });
  assert.deepEqual(opaque.rows(), ['kA.']);
});

test('outlineAll rings the silhouette but never outlines an outline', () => {
  const g = new Grid(5, 1);
  g.set(2, 0, 'A');
  g.outlineAll('k');
  assert.deepEqual(g.rows(), ['.kAk.']);
  g.outlineAll('k');
  assert.deepEqual(g.rows(), ['.kAk.'], 'running it twice adds nothing');
});

test('line walks Bresenham steps, supports per-step colours and widths', () => {
  const g = new Grid(4, 3);
  const pts = line(g, 0, 0, 3, 2, (i) => String(i));
  assert.deepEqual(pts, [[0, 0], [1, 1], [2, 1], [3, 2]]);
  assert.deepEqual(g.rows(), ['0...', '.12.', '...3']);
  const w = new Grid(3, 1); line(w, 0, 0, 0, 0, 'x', 2);
  assert.deepEqual(w.rows(), ['xx.']);
});

test('recolor only swaps characters inside the row range', () => {
  assert.deepEqual(recolor('PP\nPP\nPP', { P: 'S' }, 1, 2), ['PP', 'SS', 'PP']);
});

test('rng is deterministic per seed and stays in [0, 1)', () => {
  const a = rng(7), b = rng(7);
  const xs = Array.from({ length: 50 }, () => a());
  assert.deepEqual(xs, Array.from({ length: 50 }, () => b()));
  assert.ok(xs.every(x => x >= 0 && x < 1));
});

test('hexToRgb and resolve turn palette characters into colours', () => {
  assert.deepEqual(hexToRgb('#d9a35b'), [217, 163, 91]);
  assert.deepEqual(resolve(['a.'], { a: '#000000' }), [['#000000', '.']]);
});

test('Painter writes opaque RGBA, rounds coordinates and wraps with wpx', () => {
  const p = new Painter(3, 1);
  p.px(0.4, 0, '#ff0000');
  p.wpx(-1, 0, '#00ff00');
  assert.deepEqual([...p.data], [255, 0, 0, 255, 0, 0, 0, 0, 0, 255, 0, 255]);
});

test('bandColor picks the band and dithers just above the next boundary', () => {
  const stops = [['#000000', 0], ['#ffffff', 0.5]];
  assert.equal(bandColor(stops, 0.1, 0, 1), '#000000');
  assert.equal(bandColor(stops, 0.45, 0, 0), '#ffffff', 'even pixel near the boundary takes the next band');
  assert.equal(bandColor(stops, 0.45, 0, 1), '#000000', 'odd pixel keeps the current band');
  assert.equal(bandColor(stops, 0.7, 0, 0), '#ffffff');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test 'tests/reel/pixels.test.js'`
Expected: FAIL, with `Cannot find module '…/reel/pixels.js'`.

- [ ] **Step 3: Write the implementation**

Create `reel/pixels.js`:

```js
// Pixel helpers shared by the cast and the scenes. Pure: no DOM, so Node tests can import them.
// Sprites are text grids, one character per pixel, '.' = transparent.

// String or row array -> rows of equal width. Strings lose their leading/trailing newlines.
export function parseRows(part) {
  if (Array.isArray(part)) return part;
  const r = part.replace(/^\n+|\n+$/g, '').split('\n');
  const w = Math.max(...r.map(x => x.length));
  return r.map(x => x.padEnd(w, '.'));
}

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export class Grid {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.px = Array.from({ length: h }, () => new Array(w).fill('.'));
  }

  get(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.px[y][x] : '.';
  }

  set(x, y, ch) {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y][x] = ch;
  }

  // Stamp a fill-only part. With `outline`, a 1px 4-neighbour ring of that colour goes down
  // first: over transparent pixels only, over anything (`over`), or over opaque pixels only
  // (`opaqueOnly`, used for an arm drawn across the torso).
  stamp(part, ox, oy, { outline = null, over = false, opaqueOnly = false } = {}) {
    const g = parseRows(part);
    const filled = new Set();
    g.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] !== '.') filled.add((x + ox) + ',' + (y + oy)); });
    if (outline) {
      for (const key of filled) {
        const [x, y] = key.split(',').map(Number);
        for (const [dx, dy] of N4) {
          const px = x + dx, py = y + dy;
          if (filled.has(px + ',' + py)) continue;
          const cur = this.get(px, py);
          if (opaqueOnly) { if (cur !== '.') this.set(px, py, outline); } else if (over || cur === '.') this.set(px, py, outline);
        }
      }
    }
    g.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] !== '.') this.set(x + ox, y + oy, row[x]); });
  }

  // Outer silhouette: every transparent pixel touching a non-outline pixel becomes `color`.
  outlineAll(color) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.px[y][x] !== '.') continue;
      if (N4.some(([dx, dy]) => { const c = this.get(x + dx, y + dy); return c !== '.' && c !== color; })) add.push([x, y]);
    }
    for (const [x, y] of add) this.px[y][x] = color;
  }

  rows() {
    return this.px.map(r => r.join(''));
  }
}

// Bresenham line. `col` is a character or (i, n) => character; width > 1 thickens to the right.
export function line(grid, x0, y0, x1, y1, col, width = 1) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  const pts = [];
  for (;;) {
    pts.push([x0, y0]);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
  pts.forEach(([x, y], i) => {
    const c = typeof col === 'function' ? col(i, pts.length) : col;
    for (let w = 0; w < width; w++) grid.set(x + w, y, c);
  });
  return pts;
}

// Swap characters in rows [rowFrom, rowTo).
export function recolor(part, mapping, rowFrom = 0, rowTo = 99) {
  return parseRows(part).map((r, y) => (y >= rowFrom && y < rowTo ? [...r].map(ch => mapping[ch] ?? ch).join('') : r));
}

// Deterministic PRNG (LCG), so every play of the reel looks the same.
export function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// Rows + palette -> rows of hex colours ('.' stays '.'); what a sprite actually looks like.
export function resolve(rows, palette) {
  return rows.map(r => [...r].map(ch => (ch === '.' ? '.' : palette[ch])));
}

// RGBA pixel buffer for procedural backgrounds. wpx wraps horizontally so tiles stay seamless.
export class Painter {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = new Uint8ClampedArray(w * h * 4);
    this.cache = {};
  }

  px(i, j, col) {
    i = Math.round(i); j = Math.round(j);
    if (i < 0 || j < 0 || i >= this.w || j >= this.h) return;
    const [r, g, b] = this.cache[col] || (this.cache[col] = hexToRgb(col));
    const k = (j * this.w + i) * 4;
    this.data[k] = r; this.data[k + 1] = g; this.data[k + 2] = b; this.data[k + 3] = 255;
  }

  wpx(i, j, col) {
    this.px(((Math.round(i) % this.w) + this.w) % this.w, j, col);
  }

  rect(i, j, rw, rh, col) {
    for (let y = j; y < j + rh; y++) for (let x = i; x < i + rw; x++) this.wpx(x, y, col);
  }
}

// Banded vertical gradient with a 2-row checker dither just above each boundary.
export function bandColor(stops, t, i, j) {
  let k = 0;
  while (k < stops.length - 1 && t >= stops[k + 1][1]) k++;
  if (k < stops.length - 1) {
    const next = stops[k + 1][1], span = stops[k + 1][1] - stops[k][1];
    if (next - t < span * 0.22 && (i + j) % 2 === 0) return stops[k + 1][0];
  }
  return stops[k][0];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test 'tests/reel/pixels.test.js'`
Expected: `ℹ pass 11`, `ℹ fail 0`.

- [ ] **Step 5: Commit**

```bash
git add reel/pixels.js tests/reel/pixels.test.js
git commit -m "feat(reel): Add pixel grid and painter helpers"
```

---

### Task 2: Yimeng's rig and wardrobe

**Files:**
- Create: `tests/reel/fixtures/make-cast-golden.py`
- Create (generated): `tests/reel/fixtures/cast-golden.json`
- Create: `reel/hero.js`
- Test: `tests/reel/hero.test.js`

**Interfaces:**
- Consumes: from Task 1, `Grid`, `parseRows`, `line`, `recolor` and `resolve`.
- Produces:
  - `OUTFIT_KEYS`: `sheffield, travel, trolltunga, iceland, nyc, michelin, columbia, mi_winter, lab, gym1, gym5, phd, work, hunt, forage, fish, tide, scuba, freedive`.
  - `heroSprite(key) → { frames: string[][], palette: {char: hex}, width: 42, height: 50, anchorX: 9, footY: 44 }`. There are 4 frames, and the sprite throws `unknown outfit: <key>` for keys not in the list.
  - Also exported: `OUTFITS`, `BASE_PALETTE`, `SPRITE_W`, `SPRITE_H`, `ANCHOR_X`, `FOOT_Y`.
  - `cast-golden.json`: `{ hero: {key: {frames, palette}}, dog: {key: {frames, palette}} }`. Task 3 uses the `dog` half.

- [ ] **Step 1: Create the fixture generator**

Create `tests/reel/fixtures/make-cast-golden.py`:

```python
"""Freeze the approved mockup sprites as golden data for the JS port.

Needs the local, gitignored mockups in .superpowers/pixel-mock/. Run from the repo root:
    python3 tests/reel/fixtures/make-cast-golden.py tests/reel/fixtures/cast-golden.json
"""
import json, sys
sys.path.insert(0, '.superpowers/pixel-mock')
import art_wear, art_dog


def used(frames, pal):
    chars = sorted({ch for f in frames for row in f for ch in row if ch != '.'})
    return {ch: pal[ch] for ch in chars}


hero = {}
for key in art_wear.OUTFITS:
    frames, pal = art_wear.get(key)
    hero[key] = {'frames': frames, 'palette': used(frames, pal)}
dog = {}
for key, name in [('pup', 'pup_a'), ('bandana', 'dog_a_bandana'), ('msu_knit', 'dog_a_msu_knit'),
                  ('bare', 'dog_a_bare'), ('houndstooth', 'dog_a_houndstooth'), ('hikepack', 'dog_a_hikepack'),
                  ('blaze', 'dog_a_blaze'), ('lifevest', 'dog_a_lifevest')]:
    frames, pal = art_dog.get(name)
    dog[key] = {'frames': frames, 'palette': used(frames, pal)}
out = sys.argv[1]
with open(out, 'w') as fh:
    json.dump({'hero': hero, 'dog': dog}, fh, ensure_ascii=False, indent=0)
print(out, len(hero), 'outfits,', len(dog), 'dog sprites')
```

- [ ] **Step 2: Generate the golden fixture from the approved mockups**

Run (from the repo root): `python3 tests/reel/fixtures/make-cast-golden.py tests/reel/fixtures/cast-golden.json`
Expected: `tests/reel/fixtures/cast-golden.json 19 outfits, 8 dog sprites`. The file is about 199 KB.

- [ ] **Step 3: Write the failing test**

Create `tests/reel/hero.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { heroSprite, OUTFIT_KEYS, FOOT_Y, ANCHOR_X } from '../../reel/hero.js';
import { resolve } from '../../reel/pixels.js';

const golden = JSON.parse(readFileSync(new URL('./fixtures/cast-golden.json', import.meta.url))).hero;

test('the wardrobe has exactly the 19 approved outfits', () => {
  assert.deepEqual([...OUTFIT_KEYS].sort(), Object.keys(golden).sort());
});

for (const key of Object.keys(golden)) {
  test(`outfit ${key} matches the approved mockup pixel for pixel`, () => {
    const s = heroSprite(key);
    assert.equal(s.frames.length, 4);
    s.frames.forEach((f, i) => {
      assert.deepEqual(resolve(f, s.palette), resolve(golden[key].frames[i], golden[key].palette), `frame ${i}`);
    });
  });
}

test('sprites report where the character stands', () => {
  const s = heroSprite('work');
  assert.equal(s.width, 42); assert.equal(s.height, 50);
  assert.equal(s.anchorX, ANCHOR_X); assert.equal(s.footY, FOOT_Y);
  // the lowest opaque row of a walk frame is the shoe outline, one below the foot row
  const lowest = Math.max(...s.frames[1].map((r, y) => (/[^.]/.test(r) ? y : -1)));
  assert.equal(lowest, FOOT_Y);
});

test('unknown outfits fail loudly', () => {
  assert.throws(() => heroSprite('tuxedo'), /unknown outfit: tuxedo/);
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `node --test 'tests/reel/hero.test.js'`
Expected: FAIL, with `Cannot find module '…/reel/hero.js'`.

- [ ] **Step 5: Write the implementation**

Create `reel/hero.js`. Its sprite grids and drawing order are a straight port of `.superpowers/pixel-mock/art_a.py` and `art_wear.py`, so do not "tidy" the grids: the golden test compares every pixel.

```js
// Yimeng: the pixel rig (head, torso, arms, legs) and every outfit in the spec's wardrobe.
// Ported from the approved mockup (.superpowers/pixel-mock/art_a.py + art_wear.py); the
// golden test in tests/reel/hero.test.js holds this file to those exact pixels.
import { Grid, parseRows, line, recolor } from './pixels.js';

export const SPRITE_W = 42, SPRITE_H = 50;
export const ANCHOR_X = 9;            // the character's left edge inside the sprite
export const FOOT_Y = 44;             // the row the shoes stand on (rig y 33 + offset 11)
const OX = 9, OY = 11;

export const BASE_PALETTE = {
  k: '#2a1f2d', H: '#25212c', h: '#4a4458', f: '#4a4352', e: '#f0c39f', q: '#c98d6e',
  S: '#f4cfae', s: '#e0a985', o: '#b5735a', G: '#3a2419', g: '#ffffff', E: '#241c22',
  m: '#c46a5e', Y: '#eef1f6', B: '#8a2438', b: '#5e1727', r: '#ad4357', T: '#1e1c24',
  P: '#3e4262', p: '#2b2d46', l: '#50557c', O: '#17151b', n: '#4d4856',
};
// Colours every outfit can rely on for props and hats unless it overrides them.
const PROP_DEFAULTS = {
  x: '#22232b', M: '#3b404c', m: '#2a2e37', V: '#d9a35b', v: '#a87e3e', K: '#1c1c22',
  J: '#3b404c', j: '#2a2e37', Z: '#e08a2c', z: '#b06a1e', F: '#16181e', a: '#bfe3f2',
};

// ---------- rig ----------
const HEAD = `
...........HHH......
.......HHHHHHHHH....
.....HHHHHHHHHhhH...
....HHHHHHHHHHHHHH..
...HHHHHHHHHHHHHHHH.
...HHHHHHHHHHHHHHHH.
..fHHHHHHHHHHHHHHHS.
..ffHHHHHHHHHHHSSSS.
..fffHHHHHHSSSSSSSS.
..ffffeeSSSSSSSSSSS.
..fffeqeSSSSSSSSSSSS
..ffffeSSSSSSSSSSSS.
...fffSSSSSSSSSSSSs.
....ffSSSSSSSSSSSs..
......sSSSSSSSSss...
`;
const FACE = `
....................
....................
....................
....................
....................
....................
....................
....................
.............GGGGG..
........GGGGGGgSEG..
.............GSSEG..
.............GGGGG..
......Y.............
.................m..
....................
`;
const ARMS = {
  mid: `
.......BB...........
.......Br...........
.......Br...........
.......BB...........
.......SS...........
`,
  fwd: `
.......BB...........
.......BBr..........
........BBr.........
........BBB.........
.........SS.........
`,
  back: `
.......BB...........
......rBB...........
......rBB...........
......BBB...........
......SS............
`,
};
const ARM_HOLD = `
.......BB...........
.......BBr..........
.......BBBBSS.......
`;
const ARM_BIG = {
  mid: `
.....SSSSS..........
.....SSSSs..........
......SSSs..........
......SSSs..........
.......SS...........
`,
  fwd: `
......SSSS..........
.......SSSs.........
........SSSs........
........SSS.........
.........SS.........
`,
  back: `
......SSSS..........
.....sSSS...........
.....sSSS...........
.....sSS............
......SS............
`,
};
const LEGS = {
  pass: `
......ppPPPP........
.......ppPPl........
.......ppPPl........
.......ppPPl........
......pp.PPl........
.....OnO.PPl........
.........OOnOO......
.........OOOOO......
`,
  near: `
......ppPPPP........
......pp..PPl.......
......pp..PPl.......
.....pp....PPl......
.....pp....PPl......
....pp......PPl.....
...OnO......OOOnO...
...OO.......OOOOO...
`,
  far: `
......PPpppp........
......PPl..pp.......
......PPl..pp.......
.....PPl....pp......
.....PPl....pp......
....PPl......pp.....
...OOnO......OOnOO..
...OOOO......OOOOO..
`,
  stand: `
......ppPPPP........
......pp.PPl........
......pp.PPl........
......pp.PPl........
......pp.PPl........
......pp.PPl........
.....OOO.OOOOO......
.....OOO.OOOOO......
`,
};

// ---------- torsos (8 rows, x5..12) and skirts (over the legs) ----------
const T = {
  blazer: `
......bBBBTT........
.....bBBBBBTT.......
.....bBBBBrTT.......
.....bBBBBrTB.......
.....bBBBBBTB.......
.....bBBBBBBB.......
.....bbBBBBBB.......
......PPPPPP........
`,
  hoodie: `
......BBBBBB........
.....bBBBBBBw.......
.....bBBBBBBw.......
.....bBBBBBBB.......
.....bBBbbbbB.......
.....bBBBBBBB.......
.....bbbbbbbb.......
......PPPPPP........
`,
  sunhood: `
......BBBBBB........
.....bBBBBBBz.......
.....bBBBBBBz.......
.....bBBBBBBz.......
.....bBBBBBBz.......
.....bBBBBBBz.......
.....bbbbbbbz.......
......PPPPPP........
`,
  puffer: `
.....bBBBBBBB.......
....bBBBBBBBBB......
....bbbbbbbbbb......
....bBBBBBBBBB......
....bbbbbbbbbb......
....bBBBBBBBBB......
....bbbbbbbbbb......
......PPPPPP........
`,
  tank: `
......sSBBBS........
.....sSSBBBBS.......
.....sSBBBBBB.......
.....bBBBBBBB.......
.....bBBBBBBB.......
.....bBBBBBBB.......
.....bbBBBBBB.......
......PPPPPP........
`,
  tankBig: `
....sSSSBBBBSS......
...sSSSSBBBBBSS.....
...sSSBBBBBBBBB.....
....bBBBBBBBBBB.....
.....bBBBBBBBBB.....
.....bBBBBBBBB......
......bBBBBBB.......
......PPPPPP........
`,
  shell: `
......BBBBTT........
.....bBBBBBrT.......
.....bBBBBBrB.......
.....bBBBBBrB.......
.....bBBBBBrB.......
.....bBBBBBrB.......
.....bbbbbbbb.......
......PPPPPP........
`,
  vest: `
......TTTTTT........
.....tTBBTBBT.......
.....tBBBBBBB.......
.....tBbbBbbB.......
.....tBBBBBBB.......
.....tBbbBbbB.......
.....ttBBBBBB.......
......PPPPPP........
`,
  bib: `
......TTTTTT........
.....tTTBTTTT.......
.....tTTBTTTT.......
.....bBBBBBBB.......
.....bBBBBBBB.......
.....bBBBBBBB.......
.....bBBBBBBB.......
......PPPPPP........
`,
  wetsuit: `
......BBBBBB........
.....bBBBBBBB.......
.....bBBBBBBB.......
.....bBBBBBBB.......
.....brrrrrrB.......
.....bBBBBBBB.......
.....bbBBBBBB.......
......PPPPPP........
`,
  gown: `
......BBBBBB........
.....bBBBBBrB.......
.....bBBBBBrB.......
.....bBBBBBrB.......
.....bBBBBBrB.......
.....bBBBBBrB.......
.....bBBBBBrB.......
.....bBBBBBBB.......
`,
  phd: `
......BBBBBB........
.....bBBBBBKB.......
.....bBBBBBKB.......
.....bBBBBBKB.......
.....bBBBBBKB.......
.....bBBBBBKB.......
.....bBBBBBKB.......
.....bBBBBBKB.......
`,
  coat: `
......bBBBTT........
.....bBBBBBTT.......
.....bBBBBrTT.......
.....bBBBBrBB.......
.....bBBBBrBB.......
.....bBBBBBBB.......
.....bbbbbbbb.......
.....bBBBBBBB.......
`,
};
const SKIRT = {
  gown: `
.....bBBBBBrBB......
.....bBBBBBrBB......
....bBBBBBBrBBB.....
....bBBBBBBrBBB.....
....bbBBBBBBBBB.....
`,
  phd: `
.....bBBBBBKBB......
.....bBBBBBKBB......
....bBBBBBBKBBB.....
....bBBBBBBKBBB.....
....bbBBBBBBBBB.....
`,
  coat: `
.....bBBBBBBB.......
.....bBBBBBBB.......
.....bbBBBBBB.......
`,
};
const HOOD = `
.BB.
BBBB
bBBB
`;

// ---------- hats (head-grid coordinates) ----------
const HAT = {
  beanie: `
.....JJJJJJJJJ......
...JJJJJJJJJJJJJ....
..JJJJJJJJJJJJJJJ...
..JJJJJJJJJJJJJJJJ..
..JJJJJJJJJJJJJJJJ..
..jjjjjjjjjjjjjjjjj.
`,
  cap: `
.......JJJJJ........
.....JJJJJJJJJ......
....JJJJJJJJJJJJ....
...JJJJJJJJJJJJJJ...
...JJJJJJJJJJJJJJJ..
..JJJJJJJJJJjjjjjjjjj
`,
  mortar: `
..JJJJJJJJJJJJJJJJJJ
.jjjjjjjjjjjjjjjjjj.
.....JJJJJJJJJJ.....
....JJJJJJJJJJJJ....
...JJJJJJJJJJJJJJ...
...jJJJJJJJJJJJJJJ..
`,
  tam: `
......KKKKKKK.......
...KKKKKKKKKKKKK....
..KKKKKKKKKKKKKKKK..
..KKKKKKKKKKKKKKKK..
...KKKKKKKKKKKKKKK..
`,
  bucket: `
.......JJJJJJ.......
.....JJJJJJJJJJ.....
....JJJJJJJJJJJJ....
....jjjjjjjjjjjj....
.JJJJJJJJJJJJJJJJJJJ
JJ.................JJ
`,
};
const POM = `
.........VVV........
........VVVVV.......
.........VVV........
`;

// ---------- props ----------
const PROP = {
  backpack: `
.MMMM.
MMMMMm
MMMMMm
MmmmMm
MMMMMm
MMMMMm
.mmmm.
`,
  bigpack: `
.ZZZZZ.
.zzzzz.
MMMMMMm
MMMMMMm
MmmmmMm
MMMMMMm
MMMMMMm
MMMMMMm
MMMMMMm
.mmmmm.
`,
  tank: `
.xx.
VVVV
VVVv
VVVv
VVVv
VVVv
VVVv
VVVv
VVVv
.vv.
`,
  umbrella: `
........VVVVV........
.....VVVVVVVVVVV.....
...VVVVVVVVVVVVVVV...
..VVVVVVVVVVVVVVVVV..
.VVVVVVVVVVVVVVVVVVV.
VvVVvVVvVVvVVvVVvVVvV
`,
  basket: `
.x...x.
.xxxxx.
ZzZZzZZ
MMMMMMM
MmMmMmM
.MMMMM.
`,
  bucket: `
.xxxxx.
x.ZZZ.x
MMMMMMM
MMMMMMM
.MMMMM.
`,
};

// ---------- the wardrobe ----------
// props: [kind, part, dx, dy]; kinds: back, umbrella, hand, camera, rod, gun.
export const OUTFITS = {
  sheffield: { torso: 'hoodie', hold: true, props: [['back', 'backpack', 2, 18], ['umbrella', 'umbrella', 1, -6]],
    pal: { B: '#5a3a9a', b: '#3e2672', w: '#e9e4f5', P: '#3d5c8c', p: '#2c4468', l: '#5677a8', O: '#e7e2d8', n: '#bdb7aa', M: '#3b404c', m: '#2a2e37', V: '#24324f', v: '#3b4c72', x: '#20232b' } },
  travel: { torso: 'blazer', props: [['back', 'backpack', 2, 18], ['camera', null, 0, 0]],
    pal: { B: '#4f6f9f', b: '#3a5480', r: '#6d8dbd', T: '#efebe2', P: '#c9b48e', p: '#a8946f', l: '#ddc9a3', O: '#e7e2d8', n: '#bdb7aa', M: '#7a5a3e', m: '#5c4330' } },
  trolltunga: { torso: 'shell', props: [['back', 'bigpack', 1, 14]],
    pal: { B: '#c8402e', b: '#8f2a1e', r: '#e2604a', T: '#2a2a30', P: '#5b6170', p: '#454a57', l: '#737a8a', O: '#5a3b2a', n: '#7a5440', M: '#3d4350', m: '#2b2f39', Z: '#e08a2c', z: '#b06a1e' } },
  iceland: { torso: 'puffer', hats: ['beanie'],
    pal: { B: '#2c3a5c', b: '#1f2a44', P: '#2b2d36', p: '#1f2028', l: '#3a3d4a', O: '#3a2c24', n: '#5a463a', J: '#d8a531', j: '#a87e1e' } },
  nyc: { torso: 'coat', skirt: 'coat', scarf: true,
    pal: { B: '#b38a5c', b: '#8a6642', r: '#cfa676', T: '#2a2a30', P: '#24242c', p: '#18181e', l: '#33333d', O: '#1a1416', n: '#3a2c2c', L: '#6b2a3a', Q: '#8a3a4c' } },
  michelin: { torso: 'blazer', pal: {} },
  columbia: { torso: 'gown', skirt: 'gown', sleeve: { B: 'B', b: 'b', r: 'r' }, hats: ['mortar'], tassel: 'V',
    pal: { B: '#9cc7ea', b: '#6f9fca', r: '#c3def3', J: '#9cc7ea', j: '#6f9fca', V: '#f4f1ea', P: '#24242c', p: '#18181e', l: '#33333d', O: '#1a1416', n: '#3a2c2c' } },
  mi_winter: { torso: 'puffer', hats: ['beanie'], pom: true,
    pal: { B: '#1f5a46', b: '#16463a', P: '#2b2d36', p: '#1f2028', l: '#3a3d4a', O: '#3a2c24', n: '#5a463a', J: '#eeece4', j: '#c9c6bb', V: '#1f5a46' } },
  lab: { torso: 'hoodie', phones: true,
    pal: { B: '#6b6b76', b: '#50505a', w: '#e6e6ea', P: '#3a3a44', p: '#2a2a32', l: '#4c4c58', O: '#e7e2d8', n: '#bdb7aa', N: '#8a8aa0' } },
  gym1: { torso: 'tank', shorts: true, sleeve: { B: 'S', b: 's', r: 'S' }, armOutline: 's',
    pal: { B: '#2a2a33', b: '#1c1c22', P: '#4b4b58', p: '#383843', l: '#5e5e6c', O: '#e7e2d8', n: '#c84a3a' } },
  gym5: { torso: 'tankBig', shorts: true, bigArms: true, armOutline: 's',
    pal: { B: '#2a2a33', b: '#1c1c22', P: '#4b4b58', p: '#383843', l: '#5e5e6c', O: '#e7e2d8', n: '#c84a3a' } },
  phd: { torso: 'phd', skirt: 'phd', sleeve: { B: 'B', b: 'b', r: 'K' }, hats: ['tam'], tassel: 'V',
    pal: { B: '#1f5a46', b: '#16463a', r: '#2e7a60', K: '#121214', V: '#e2b84a', P: '#24242c', p: '#18181e', l: '#33333d', O: '#1a1416', n: '#3a2c2c' } },
  work: { torso: 'sunhood', hood: true,
    pal: { B: '#6c4fb6', b: '#4d378c', r: '#8a6fd2', z: '#c9bdf0', P: '#24252c', p: '#18191e', l: '#363844', O: '#ece8df', n: '#bdb7aa' } },
  hunt: { torso: 'blazer', camo: true, hats: ['cap'],
    pal: { B: '#5d5b3c', b: '#3f3e29', r: '#7b7450', T: '#2c2b22', P: '#8a7b5a', p: '#6c5f44', l: '#a3936d', O: '#4a3324', n: '#6a4a34', J: '#ff6b1a', j: '#c94e0f' } },
  forage: { torso: 'hoodie', hats: ['beanie'], props: [['hand', 'basket', -3, 1]],
    pal: { B: '#5d6b3e', b: '#434e2c', w: '#5d6b3e', P: '#6a6052', p: '#504839', l: '#827766', O: '#5a3b2a', n: '#7a5440', J: '#a5532e', j: '#7d3c20', V: '#a5532e', M: '#9a6b3a', m: '#7a5028', x: '#7a5028', Z: '#f0a830', z: '#d07a18' } },
  fish: { torso: 'vest', sleeve: { B: 'T', b: 't', r: 'T' }, hold: true, hats: ['bucket'], props: [['rod', null, 0, 0]],
    pal: { B: '#a8996e', b: '#857852', t: '#4c4f5a', T: '#5f6370', P: '#4c4f5a', p: '#393b44', l: '#60636f', O: '#3a2c24', n: '#5a463a', J: '#c2b088', j: '#9a8a64' } },
  tide: { torso: 'bib', sleeve: { B: 'T', b: 't', r: 'T' }, props: [['hand', 'bucket', -3, 1]],
    pal: { B: '#3b5a44', b: '#2b4232', T: '#c9c2b4', t: '#a39c8e', P: '#3b5a44', p: '#2b4232', l: '#4f7259', O: '#2a3a2e', n: '#3b5a44', M: '#3a7fc4', m: '#2a5f96', x: '#20232b', Z: '#6b3f8f', z: '#4a2a66' } },
  scuba: { torso: 'wetsuit', sleeve: { B: 'B', b: 'b', r: 'B' }, mask: true, fins: 4, stand: true, props: [['back', 'tank', 2, 16]],
    pal: { B: '#1d2028', b: '#121418', r: '#2f74c0', P: '#1d2028', p: '#121418', l: '#2c3240', O: '#16181e', n: '#2f74c0', V: '#e8b923', v: '#b88d14', x: '#3a3a40', F: '#1d2028' } },
  freedive: { torso: 'wetsuit', camo: true, sleeve: { B: 'B', b: 'b', r: 'B' }, hold: true, mask: true, snorkel: true, fins: 9, stand: true, props: [['gun', null, 0, 0]],
    pal: { B: '#3e4a36', b: '#2a3326', r: '#3e4a36', P: '#3e4a36', p: '#2a3326', l: '#55634a', O: '#2a3326', n: '#55634a', F: '#2a3326', x: '#16181e' } },
};
export const OUTFIT_KEYS = Object.keys(OUTFITS);

const CAMO = ['BrbB', 'bBBr', 'rBbB', 'BBrb'];
const SCARF = [[6, 16, 'L'], [7, 16, 'Q'], [8, 16, 'L'], [9, 16, 'Q'], [10, 16, 'L'], [11, 16, 'Q'],
  [10, 17, 'L'], [11, 17, 'Q'], [11, 18, 'L'], [11, 19, 'Q'], [11, 20, 'L']];
const MASK = [[12, 8, 'k'], [13, 8, 'k'], [14, 8, 'k'], [15, 8, 'k'], [16, 8, 'k'], [17, 8, 'k'], [18, 8, 'k'],
  [12, 9, 'k'], [13, 9, 'g'], [14, 9, 'a'], [15, 9, 'a'], [16, 9, 'E'], [17, 9, 'a'], [18, 9, 'k'],
  [12, 10, 'k'], [13, 10, 'a'], [14, 10, 'a'], [15, 10, 'a'], [16, 10, 'E'], [17, 10, 'a'], [18, 10, 'k'],
  [12, 11, 'k'], [13, 11, 'k'], [14, 11, 'k'], [15, 11, 'k'], [16, 11, 'k'], [17, 11, 'k'], [18, 11, 'k'], [19, 11, 'k']];
const HAND = { mid: [7, 22], fwd: [9, 22], back: [6, 22], hold: [11, 20] };
// The walk cycle: [legs, arm, bob]. Contact frames sit 1px lower.
const WALK = [['near', 'back', 1], ['pass', 'mid', 0], ['far', 'fwd', 1], ['pass', 'mid', 0]];
const HAIR_UNDER_HAT = new Set(['H', 'h', 'k', 'f']);

// Clear hair/outline above the hat's top edge in each column, then stamp the hat.
function stampHat(c, hat, x0, y0) {
  const g = parseRows(hat), tops = new Map();
  g.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] !== '.' && !tops.has(x)) tops.set(x, y); });
  for (const [x, ty] of tops) for (let yy = y0 - 3; yy < y0 + ty; yy++) if (HAIR_UNDER_HAT.has(c.get(x0 + x, yy))) c.set(x0 + x, yy, '.');
  c.stamp(g, x0, y0);
}

// Headphone band: the first opaque pixel (and the one below it) in columns 5..15.
function headphones(c, x0, y0) {
  for (let x = x0 + 5; x < x0 + 16; x++) {
    for (let y = y0 - 2; y < y0 + 12; y++) if (c.get(x, y) !== '.') { c.set(x, y, 'N'); c.set(x, y + 1, 'N'); break; }
  }
}

function palette(o) {
  const pal = { ...BASE_PALETTE, ...PROP_DEFAULTS, ...o.pal };
  if (o.mask) { pal.a = '#bfe3f2'; pal.g = '#ffffff'; }
  return pal;
}

function frame(o, [legsKey, armKey, bob]) {
  if (o.stand) { legsKey = 'pass'; armKey = 'mid'; }
  if (o.hold) armKey = 'hold';
  const props = o.props || [];
  const c = new Grid(SPRITE_W, SPRITE_H), X = OX, Y = OY;

  for (const [kind, part, dx, dy] of props) {
    if (kind === 'back') c.stamp(PROP[part], X + dx, Y + dy + bob, { outline: 'k' });
    if (kind === 'umbrella') {
      c.stamp(PROP[part], X + dx, Y + dy + bob, { outline: 'k' });
      line(c, X + 12, Y + dy + 6 + bob, X + 12, Y + 19 + bob, 'x');
    }
  }

  let legs = o.stand ? LEGS.stand : LEGS[legsKey];
  if (o.shorts) legs = recolor(legs, { P: 'S', l: 'S', p: 's' }, 3);
  c.stamp(legs, X, Y + 25, { outline: 'k' });
  if (o.fins) {
    for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) {
      if ((c.px[y][x] === 'O' || c.px[y][x] === 'n') && y >= Y + 31) {
        for (let k = 1; k <= o.fins; k++) if (c.get(x + k, y) === '.') c.set(x + k, y, 'F');
      }
    }
  }
  if (o.skirt) c.stamp(SKIRT[o.skirt], X, Y + 25 + bob, { outline: 'k', over: true });

  c.stamp(T[o.torso], X, Y + 17 + bob, { outline: 'k' });
  if (o.scarf) for (const [x, y, col] of SCARF) c.set(X + x, Y + y + bob, col);
  if (o.camo) {
    for (let y = Y + 17 + bob; y < Y + 25 + bob; y++) for (let x = 0; x < c.w; x++) {
      if (c.px[y][x] === 'B' || c.px[y][x] === 'r') c.px[y][x] = CAMO[y % 4][x % 4];
    }
  }
  if (props.some(([kind, part]) => kind === 'back' && part === 'backpack')) {
    for (const dy of [17, 18, 19]) c.set(X + 9, Y + dy + bob, 'm');     // shoulder strap
  }
  if (o.hood) c.stamp(HOOD, X + 3, Y + 15 + bob, { outline: 'k' });

  let arm = o.bigArms ? ARM_BIG[armKey] : armKey === 'hold' ? ARM_HOLD : ARMS[armKey];
  if (o.sleeve) arm = recolor(arm, o.sleeve);
  c.stamp(arm, X, Y + 18 + bob, { outline: o.armOutline || 'b', opaqueOnly: true });
  const hx = X + HAND[armKey][0], hy = Y + HAND[armKey][1] + bob;

  for (const [kind, part, dx, dy] of props) {
    if (kind === 'hand') c.stamp(PROP[part], hx + dx, hy + dy, { outline: 'k' });
    if (kind === 'camera') {
      c.stamp('xx\nxx', X + 11, Y + 20 + bob, { outline: 'k' });
      c.set(X + 12, Y + 20 + bob, 'g');
      line(c, X + 8, Y + 17 + bob, X + 11, Y + 20 + bob, 'x');
    }
    if (kind === 'gun') {
      line(c, hx - 2, hy, hx + 17, hy, 'M');
      line(c, hx - 2, hy + 1, hx + 6, hy + 1, 'm');
      c.set(hx + 18, hy, 'g'); c.set(hx + 19, hy, 'g');
    }
  }

  c.stamp(HEAD, X, Y + 1 + bob, { outline: 'k', over: true });
  if (o.mask) {
    c.stamp(parseRows(FACE).map(r => r.replace(/[GgE]/g, '.')), X, Y + 1 + bob);
    for (const [x, y, col] of MASK) c.set(X + x, Y + 1 + y + bob, col);
    for (let x = 4; x < 12; x++) c.set(X + x, Y + 1 + 9 + bob, 'k');      // strap
  } else {
    c.stamp(FACE, X, Y + 1 + bob);
  }
  for (const [kind] of props) {
    if (kind === 'rod') {
      line(c, hx + 1, hy, hx + 16, hy - 20, 'x');
      line(c, hx + 16, hy - 19, hx + 16, hy - 6, 'g');
      c.set(hx + 2, hy + 1, 'x'); c.set(hx + 3, hy + 1, 'x');
    }
  }
  if (o.snorkel) {
    for (let y = -4; y < 3; y++) c.set(X + 5, Y + 1 + y + bob, 'x');
    c.set(X + 6, Y + 1 - 4 + bob, 'x');
  }
  for (const hat of o.hats || []) stampHat(c, HAT[hat], X, Y + bob - (hat === 'mortar' || hat === 'tam' ? 1 : 0));
  if (o.pom) c.stamp(POM, X, Y - 2 + bob);
  if (o.tassel) for (let y = 0; y < 6; y++) c.set(X + 16, Y + y + bob, o.tassel);
  if (o.phones) {
    headphones(c, X, Y + 1 + bob);
    c.stamp('NNN\nNNN\nNNN\nNNN', X + 4, Y + 1 + 8 + bob, { outline: 'k', over: true });
  }
  c.outlineAll('k');
  return c.rows();
}

// The 4-frame walk cycle for one outfit, plus what the engine needs to place it.
export function heroSprite(key) {
  const o = OUTFITS[key];
  if (!o) throw new Error(`unknown outfit: ${key}`);
  return { frames: WALK.map(pose => frame(o, pose)), palette: palette(o), width: SPRITE_W, height: SPRITE_H, anchorX: ANCHOR_X, footY: FOOT_Y };
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `node --test 'tests/reel/hero.test.js'`
Expected: `ℹ pass 22`, `ℹ fail 0`. That is one test per outfit, plus the key list, the anchors and the unknown-key error.

- [ ] **Step 7: Commit**

```bash
git add reel/hero.js tests/reel/hero.test.js tests/reel/fixtures/make-cast-golden.py tests/reel/fixtures/cast-golden.json
git commit -m "feat(reel): Port Yimeng's rig and 19 outfits from the approved mockups"
```

---

### Task 3: The dog

**Files:**
- Create: `reel/dog.js`
- Test: `tests/reel/dog.test.js`

**Interfaces:**
- Consumes: from Task 1, `Grid`, `line` and `resolve`; from Task 2, the `dog` half of `tests/reel/fixtures/cast-golden.json`.
- Produces:
  - `DOG_KEYS = ['pup', 'bandana', 'msu_knit', 'bare', 'houndstooth', 'hikepack', 'blaze', 'lifevest']`.
  - `dogSprite(key) → { frames: string[][], palette, width, height, anchorX: 0, footY }`. There are 4 frames. The adult is 24×17 with `footY` 15, and the puppy (`'pup'`, wearing its Columbia-blue bandana) is 19×14 with `footY` 12. Unknown keys throw `unknown dog outfit: <key>`.
  - Also exported: `DOG_PALETTE`.

- [ ] **Step 1: Write the failing test**

Create `tests/reel/dog.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dogSprite, DOG_KEYS } from '../../reel/dog.js';
import { resolve } from '../../reel/pixels.js';

const golden = JSON.parse(readFileSync(new URL('./fixtures/cast-golden.json', import.meta.url))).dog;

test('the dog has the puppy plus the 7 adult outfits', () => {
  assert.deepEqual([...DOG_KEYS].sort(), Object.keys(golden).sort());
});

for (const key of Object.keys(golden)) {
  test(`dog ${key} matches the approved mockup pixel for pixel`, () => {
    const s = dogSprite(key);
    assert.equal(s.frames.length, 4);
    s.frames.forEach((f, i) => {
      assert.deepEqual(resolve(f, s.palette), resolve(golden[key].frames[i], golden[key].palette), `frame ${i}`);
    });
  });
}

test('adult and puppy report their size and foot row', () => {
  assert.deepEqual([dogSprite('houndstooth').width, dogSprite('houndstooth').height, dogSprite('houndstooth').footY], [24, 17, 15]);
  assert.deepEqual([dogSprite('pup').width, dogSprite('pup').height, dogSprite('pup').footY], [19, 14, 12]);
});

test('unknown dog outfits fail loudly', () => {
  assert.throws(() => dogSprite('tutu'), /unknown dog outfit: tutu/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test 'tests/reel/dog.test.js'`
Expected: FAIL, with `Cannot find module '…/reel/dog.js'`.

- [ ] **Step 3: Write the implementation**

Create `reel/dog.js`. It is a port of `.superpowers/pixel-mock/art_dog.py`, and the same warning applies: keep the grids exactly as they are.

```js
// The dog: a slender sighthound (as in the hero photo), adult and puppy, with its outfits.
// Ported from the approved mockup (.superpowers/pixel-mock/art_dog.py); the golden test in
// tests/reel/dog.test.js holds this file to those exact pixels.
import { Grid, line } from './pixels.js';

export const DOG_PALETTE = {
  k: '#22202a', C: '#5a5e6e', c: '#454857', L: '#2e303b', N: '#141218', w: '#ffffff', e: '#3b3d48',
  X: '#e9dcc0', Q: '#e9dcc0', Z: '#d8c9aa', G: '#1f5a46', g: '#16463a', W: '#f1efe6', b: '#a9d0ec',
  d: '#6f9fc4', O: '#ff6b1a', o: '#c94e0f', R: '#e9e9e9', Y: '#ffc21a', y: '#d39a0b', r: '#d8402f',
  h: '#2b2730', T: '#2f6f73', t: '#22524f', u: '#e0782f', 1: '#efe4cb', 2: '#9a6a45', 3: '#3a2e28', 4: '#d9cbb0',
};

// X = torso garment area, Q = neck garment area; dress() re-colours them per outfit.
const ADULT = {
  body: `
..............ee......
.............eCCC.....
.............CCCCCC...
..............CCCCCCC.
.............CCc......
............QQQ.......
......XXXXXXXXX.......
....XXXXXXXXXXXX......
...XXXXXXXXXXXXX......
....XXXX...XXXXX......
`,
  // hip/shoulder (x0, y0) -> paw (x1, y1); index 0 = far leg, 1 = near leg
  poses: {
    ext: { back: [[5, 10, 2, 15], [6, 10, 4, 15]], front: [[13, 10, 16, 15], [14, 10, 17, 15]] },
    gather: { back: [[5, 10, 6, 15], [6, 10, 8, 15]], front: [[13, 10, 12, 15], [14, 10, 13, 15]] },
  },
  eye: [16, 2], nose: [21, 3], tail: [3, 9, 0, 12], w: 24, h: 17, footY: 15,
};
const PUPPY = {
  body: `
.........ee.....
........eeCCC...
........eCCCCC..
.........CCCCCCC
.........CCCC...
.......QQQ......
...XXXXXXXX.....
..XXXXXXXXX.....
..XXXXXXXXX.....
`,
  poses: {
    ext: { back: [[3, 9, 2, 12], [4, 9, 3, 12]], front: [[9, 9, 10, 12], [10, 9, 11, 12]] },
    gather: { back: [[3, 9, 4, 12], [4, 9, 5, 12]], front: [[9, 9, 8, 12], [10, 9, 9, 12]] },
  },
  eye: [12, 2], nose: [16, 3], tail: [2, 7, 0, 8], w: 19, h: 14, footY: 12,
};

const TILE = ['1123', '1132', '2311', '3211'];     // houndstooth-ish: cream with brown/dark teeth

// Re-colour the garment placeholders; bodyY = canvas row of body-grid row 0.
function dress(c, outfit, bodyY) {
  for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) {
    const ch = c.px[y][x];
    if (ch !== 'X' && ch !== 'Q' && ch !== 'Z') continue;
    const ry = y - bodyY;
    let out;
    if (outfit === 'houndstooth') {
      const t = TILE[y % 4][x % 4];
      out = ch === 'Z' ? (t === '1' ? '4' : t) : t;
    } else if (outfit === 'msu_knit') {
      out = ch === 'Z' ? 'g' : ch === 'X' && ry === 7 ? 'W' : ch === 'X' && ry === 9 ? 'g' : 'G';
    } else if (outfit === 'blaze') {
      out = ch === 'Q' ? 'C' : ch === 'Z' ? 'o' : ry === 7 ? 'R' : ry === 9 ? 'o' : 'O';
    } else if (outfit === 'lifevest') {
      out = ch === 'Q' ? 'C' : ch === 'Z' ? 'y' : ry === 8 ? 'r' : ry === 9 ? 'y' : 'Y';
    } else if (outfit === 'hikepack' && ch === 'X' && ry >= 6 && ry <= 8 && x >= 6 && x <= 12) {
      out = ry === 8 ? 't' : 'T';
    } else if (outfit === 'hikepack' && ch === 'X' && ry === 7 && (x === 13 || x === 14)) {
      out = 'u';
    } else {                                   // bare, bandana, the rest of hikepack: coat
      out = (ch === 'X' && ry === 9) || ch === 'Z' ? 'c' : 'C';
    }
    c.px[y][x] = out;
  }
  const extra = {
    bandana: [[12, 6, 'b'], [13, 6, 'b'], [14, 6, 'b'], [13, 7, 'b'], [14, 7, 'd'], [14, 8, 'd']],
    lifevest: [[8, 5, 'h'], [9, 4, 'h'], [10, 4, 'h'], [11, 5, 'h']],
    hikepack: [[7, 5, 'T'], [8, 5, 'T'], [9, 5, 'u'], [10, 5, 'T'], [11, 5, 'T'], [8, 4, 't'], [9, 4, 't'], [10, 4, 't']],
  }[outfit] || [];
  for (const [x, y, col] of extra) c.set(x, y + bodyY, col);
}

function frame(spec, outfit, pose, bob) {
  const c = new Grid(spec.w, spec.h);
  c.stamp(spec.body, 0, 1 + bob, { outline: 'k' });
  c.set(spec.eye[0], spec.eye[1] + 1 + bob, 'N');
  c.set(spec.nose[0], spec.nose[1] + 1 + bob, 'N');
  dress(c, outfit, 1 + bob);
  // Thin legs, no outline: far legs (index 0) first in shade, near legs on top.
  for (const i of [0, 1]) {
    for (const group of ['back', 'front']) {
      const [x0, y0, x1, y1] = spec.poses[pose][group][i];
      const col = i === 0 ? 'c' : 'C';
      line(c, x0, y0 + bob, x1, y1, col);
      c.set(x1 + 1, y1, col);                  // paw
    }
  }
  const [tx0, ty0, tx1, ty1] = spec.tail;
  line(c, tx0, ty0 + bob, tx1, ty1 + bob, 'C');
  return c;
}

// Trot cycle: [pose, bob].
const TROT = [['ext', 0], ['gather', -1], ['ext', 0], ['gather', -1]];

export const DOG_KEYS = ['pup', 'bandana', 'msu_knit', 'bare', 'houndstooth', 'hikepack', 'blaze', 'lifevest'];

// 'pup' is the puppy in its Columbia-blue bandana; every other key dresses the adult.
export function dogSprite(key) {
  if (!DOG_KEYS.includes(key)) throw new Error(`unknown dog outfit: ${key}`);
  const spec = key === 'pup' ? PUPPY : ADULT;
  const frames = TROT.map(([pose, bob]) => {
    const c = frame(spec, key === 'pup' ? 'bare' : key, pose, bob);
    if (key === 'pup') for (const [x, y, col] of [[7, 6, 'b'], [8, 6, 'b'], [9, 6, 'b'], [8, 7, 'b'], [9, 7, 'd']]) c.set(x, y + 1 + bob, col);
    return c.rows();
  });
  return { frames, palette: DOG_PALETTE, width: spec.w, height: spec.h, anchorX: 0, footY: spec.footY };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test 'tests/reel/dog.test.js'`
Expected: `ℹ pass 11`, `ℹ fail 0`.

- [ ] **Step 5: Commit**

```bash
git add reel/dog.js tests/reel/dog.test.js
git commit -m "feat(reel): Port the dog and its 8 outfits from the approved mockups"
```

---

### Task 4: The beach scene

**Files:**
- Create: `tests/reel/fixtures/make-beach-golden.mjs`
- Create (generated): `tests/reel/fixtures/beach-golden.json`
- Create: `reel/beach.js`
- Test: `tests/reel/beach.test.js`

**Interfaces:**
- Consumes: from Task 1, `Painter`, `bandColor` and `rng`.
- Produces:
  - `buildBeach(W, H = 96)` is pure and returns `{ W, H, layers: { sky, clouds, head, ocean, beach, walk, fg }, horizon: 56, shore: 72, walkTop: 80, feet: 88, TW: 2 * W, glitter: [x, y, brightness][] }`. Every layer is a `Painter`.
  - `renderBeach(ctx, t, scene, env)` expects `scene.canvases` to hold one canvas per layer name, and `env.hero(key)` and `env.dog(key)` to return `{ canvases, anchorX, footY }`. Yimeng wears `work` and the dog wears `houndstooth`.
  - `beach = { build: buildBeach, render: renderBeach }`. Every scene definition has this shape, and the engine relies on it.

- [ ] **Step 1: Create the fixture generator**

This script runs the approved mockup `scene.js` in Node, with a stand-in for the canvas, and records a SHA-256 hash for every layer at three native widths: phone, desktop and wide.

Create `tests/reel/fixtures/make-beach-golden.mjs`:

```js
// Freeze the approved beach scene (mockup scene.js) as per-layer SHA-256 hashes.
// Needs the local, gitignored mockups in .superpowers/pixel-mock/. Run from the repo root:
//   node tests/reel/fixtures/make-beach-golden.mjs .superpowers/pixel-mock/scene.js tests/reel/fixtures/beach-golden.json
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const src = readFileSync(process.argv[2], 'utf8')
  .replace('window.PixelMock = { makeBanner, zoomSheet };', 'window.PixelMock = { makeBanner, zoomSheet, buildScene };');
function fakeCanvas() {
  const cv = { width: 0, height: 0 };
  cv.getContext = () => ({
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    putImageData(img) { cv.img = img; },
  });
  return cv;
}
const ctx = { window: {}, document: { createElement: fakeCanvas }, Math };
vm.runInNewContext(src, ctx);
const sha = (d) => createHash('sha256').update(d).digest('hex');
const out = {};
for (const W of [195, 480, 640]) {
  const s = ctx.window.PixelMock.buildScene(1, W, 96);
  const layers = {};
  for (const [k, cv] of Object.entries(s.L)) layers[k] = { w: cv.img.width, h: cv.img.height, sha256: sha(cv.img.data) };
  out[W] = { horizon: s.horizon, shore: s.shore, walkTop: s.walkTop, feet: s.feet, TW: s.TW, layers, glitter: s.glit };
}
writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
console.log('wrote', process.argv[3], Object.keys(out));
```

- [ ] **Step 2: Generate the golden fixture**

Run (from the repo root): `node tests/reel/fixtures/make-beach-golden.mjs .superpowers/pixel-mock/scene.js tests/reel/fixtures/beach-golden.json`
Expected: `wrote tests/reel/fixtures/beach-golden.json [ '195', '480', '640' ]`.

- [ ] **Step 3: Write the failing test**

Create `tests/reel/beach.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildBeach, renderBeach } from '../../reel/beach.js';

const golden = JSON.parse(readFileSync(new URL('./fixtures/beach-golden.json', import.meta.url)));
const sha = (d) => createHash('sha256').update(d).digest('hex');

for (const W of Object.keys(golden)) {
  test(`beach at native width ${W} matches the approved mockup`, () => {
    const s = buildBeach(Number(W));
    const g = golden[W];
    for (const k of ['horizon', 'shore', 'walkTop', 'feet', 'TW']) assert.equal(s[k], g[k], k);
    assert.deepEqual(Object.keys(s.layers).sort(), Object.keys(g.layers).sort());
    for (const [name, p] of Object.entries(s.layers)) {
      assert.deepEqual({ w: p.w, h: p.h, sha256: sha(p.data) }, g.layers[name], name);
    }
    assert.deepEqual(s.glitter, g.glitter);
  });
}

// A canvas stand-in that records what gets drawn where.
function recorder() {
  const calls = [];
  return {
    calls,
    clearRect: () => {}, fillRect: (...a) => calls.push(['fillRect', ...a]),
    drawImage: (img, x, y) => calls.push(['drawImage', img.name, x, y]),
    set fillStyle(v) { calls.push(['fillStyle', v]); },
  };
}

test('render scrolls each layer by its parallax and walks both characters', () => {
  const s = buildBeach(480);
  s.canvases = Object.fromEntries(Object.entries(s.layers).map(([k, p]) => [k, { name: k, width: p.w }]));
  const frames = (who, n) => ({ canvases: Array.from({ length: 4 }, (_, i) => ({ name: `${who}${i}` })), anchorX: n.anchorX, footY: n.footY });
  const env = { hero: () => frames('hero', { anchorX: 9, footY: 44 }), dog: () => frames('dog', { anchorX: 0, footY: 15 }) };
  const ctx = recorder();
  renderBeach(ctx, 2, s, env);
  const draws = ctx.calls.filter(c => c[0] === 'drawImage');
  const at = (name) => draws.filter(d => d[1] === name).map(d => [d[2], d[3]]);
  assert.deepEqual(at('sky'), [[0, 0]]);
  assert.deepEqual(at('clouds'), [[-3, 0], [957, 0]]);           // 2 s * 26 px/s * 0.06 = 3.12 -> 3
  assert.deepEqual(at('walk'), [[-52, 0], [908, 0]]);            // parallax 1
  assert.deepEqual(at('ocean'), [[-13, 57], [947, 57]]);         // 13 px, drawn just under the horizon
  assert.deepEqual(at('hero0'), [[163 - 9, 88 - 44]]);           // frame floor(2*6)%4 = 0 at 34% of 480
  assert.deepEqual(at('dog2'), [[163 + 28, 88 - 15]]);           // frame floor(2*9)%4 = 2, 28 px ahead
  assert.equal(draws.at(-1)[1], 'fg', 'the ice plant is drawn last, in front of the characters');
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `node --test 'tests/reel/beach.test.js'`
Expected: FAIL, with `Cannot find module '…/reel/beach.js'`.

- [ ] **Step 5: Write the implementation**

Create `reel/beach.js`. Keep every constant and expression as it is. One known trap: the approved ice plant uses `top = H - Math.round(…) - 1`. A later tweak to raise it by `R(3)` never applied to the mockup the user approved, so adding it here breaks the `fg` hash.

```js
// California coast at golden hour: the approved test scene and the reduced-motion poster.
// Ported from the approved mockup (.superpowers/pixel-mock/scene.js); tests/reel/beach.test.js
// holds every layer to the mockup's exact pixels.
import { Painter, bandColor, rng } from './pixels.js';

const u = 1;                         // pixel density of option A
const R = (v) => Math.round(v * u);
const SPEED = 26;                    // native px per second at parallax 1 (matches the walk cycle)

const SKY = [
  ['#29264f', 0.00], ['#3a3264', 0.14], ['#573d72', 0.28], ['#84497c', 0.41],
  ['#b25b7e', 0.53], ['#d67274', 0.64], ['#ec8f69', 0.74], ['#f5ad68', 0.83], ['#fbcd84', 0.92],
];
const OCEAN = [['#3b4c85', 0], ['#465c99', 0.3], ['#5370a8', 0.6], ['#6585b5', 0.85]];

// Pure: every layer as a Painter. Scrolling layers are TW = 2W wide and tile seamlessly.
export function buildBeach(W, H = 96) {
  const horizon = R(56), shore = R(72), walkTop = R(80), feet = R(88);
  const TW = W * 2;
  const layers = {};

  // sky (static) + sun
  const sky = new Painter(W, horizon + 1);
  for (let j = 0; j <= horizon; j++) for (let i = 0; i < W; i++) sky.px(i, j, bandColor(SKY, j / horizon, i, j));
  const sx = Math.round(W * 0.72), sy = horizon - R(10), sr = R(7);
  for (let j = -sr - R(4); j <= sr + R(4); j++) for (let i = -sr - R(4); i <= sr + R(4); i++) {
    const dd = Math.sqrt(i * i + j * j);
    if (sy + j > horizon) continue;
    if (dd <= sr - u) sky.px(sx + i, sy + j, '#fff5cf');
    else if (dd <= sr) sky.px(sx + i, sy + j, '#ffe293');
    else if (dd <= sr + R(2) && (i + j) % 2 === 0) sky.px(sx + i, sy + j, '#fcd99a');
    else if (dd <= sr + R(4) && (i + j) % 4 === 0) sky.px(sx + i, sy + j, '#fbd08e');
  }
  layers.sky = sky;

  // clouds (parallax 0.06)
  const cl = new Painter(TW, horizon);
  const rc = rng(7);
  for (let n = 0; n < 7; n++) {
    const cx = rc() * TW, cy = R(10) + rc() * R(30), len = R(18) + rc() * R(40), th = Math.max(1, R(2 + rc() * 2));
    const warm = cy > R(26);
    for (let y = 0; y < th; y++) {
      const inset = Math.round((y === 0 ? 0.18 : 0) * len + y * u * 2);
      for (let x = inset; x < len - inset; x++) cl.wpx(cx + x, cy + y, y === 0 ? (warm ? '#f6b58c' : '#c77a93') : (warm ? '#e0866f' : '#8f5784'));
    }
  }
  layers.clouds = cl;

  // far headlands (0.12): a ridge on part of the tile, periodic in TW
  const hd = new Painter(TW, horizon + 1);
  const P = (x, a, f, ph) => a * Math.sin((x / TW) * Math.PI * 2 * f + ph);
  for (let i = 0; i < TW; i++) {
    const env = Math.max(0, Math.sin((i / TW) * Math.PI * 2) * 1.25 - 0.15);
    const h1 = env * (R(14) + P(i, R(4), 3, 0.4) + P(i, R(2), 9, 1.1));
    const h2 = env * (R(8) + P(i, R(3), 5, 2.0) + P(i, R(1.5), 13, 0.3));
    for (let j = 0; j < h1; j++) hd.px(i, horizon - j, j > h1 - u - 0.5 ? '#9a6283' : '#6d4d7c');
    for (let j = 0; j < h2; j++) hd.px(i, horizon - j, j > h2 - u - 0.5 ? '#7b4f74' : '#4f3a66');
  }
  layers.head = hd;

  // ocean (0.25) with wave dashes; the sun glitter is drawn per frame
  const oc = new Painter(TW, shore - horizon);
  const ro = rng(11);
  for (let j = 0; j < shore - horizon; j++) for (let i = 0; i < TW; i++) oc.px(i, j, bandColor(OCEAN, j / (shore - horizon), i, j));
  for (let n = 0; n < 60; n++) {
    const x0 = ro() * TW, y0 = 1 + Math.floor(ro() * (shore - horizon - 2)), len = R(3) + ro() * R(8);
    for (let x = 0; x < len; x++) oc.wpx(x0 + x, y0, y0 < (shore - horizon) * 0.5 ? '#5a74ad' : '#86a3cc');
  }
  layers.ocean = oc;

  // beach + palms (0.5); full height so palms rise into the sky
  const be = new Painter(TW, H);
  const rb = rng(23);
  for (let j = shore; j < walkTop; j++) for (let i = 0; i < TW; i++) {
    const foam = j === shore || (j === shore + 1 && Math.sin(i / (3 * u)) > 0.3);
    be.px(i, j, foam ? '#f6ecdf' : (j < shore + R(3) ? '#c99a74' : ((i * 7 + j * 3) % 23 === 0 ? '#f0c590' : '#e2b07c')));
  }
  const palm = (x0, base, hgt, lean) => {
    const tw = Math.max(2, R(2));
    let tx = x0, ty = base;
    for (let s = 0; s <= hgt; s++) {
      const t = s / hgt, x = x0 + lean * t * t, y = base - s;
      for (let w = 0; w < tw; w++) be.wpx(x + w, y, w === 0 ? '#5a3c2e' : ((s % R(3) === 0) ? '#5f4031' : '#86614a'));
      tx = x; ty = y;
    }
    const cxp = tx + tw / 2, cyp = ty;
    const fronds = [[-1.0, 0.9], [-0.7, 0.5], [-0.35, 0.2], [0.35, 0.2], [0.75, 0.55], [1.0, 1.0], [0.1, 0.05]];
    fronds.forEach(([dir, droop], k) => {
      const len = R(15) + (k % 3) * R(2);
      for (let s = 0; s <= len; s++) {
        const t = s / len, x = cxp + dir * s, y = cyp - R(3) * Math.sin(t * Math.PI) * (1 - droop) + droop * t * t * R(10);
        be.wpx(x, y, t > 0.75 ? '#9aa555' : (t > 0.4 ? '#4f7d48' : '#35583b'));
        if (u > 1) be.wpx(x, y + 1, '#2c4733');
        if (s % 2 === 0 && t > 0.15) be.wpx(x, y + R(1.5) + 1, '#2c4733');
      }
    });
    be.rect(Math.round(cxp - u), cyp + 1, Math.max(2, R(2)), Math.max(2, R(2)), '#3a2a22');
  };
  [[0.06, 36, 4], [0.31, 44, -5], [0.37, 33, 3], [0.62, 40, 5], [0.88, 46, -4]].forEach(([fx, hh, ln]) => palm(fx * TW, walkTop - 1, R(hh), R(ln)));
  for (let n = 0; n < 18; n++) {              // small rocks on the sand
    const x0 = rb() * TW, y0 = shore + R(4) + rb() * R(3);
    be.rect(Math.round(x0), Math.round(y0), R(3), Math.max(1, R(1.5)), '#8b6a58');
    be.rect(Math.round(x0), Math.round(y0), R(2), 1, '#a8836a');
  }
  layers.beach = be;

  // boardwalk + rope fence (1.0)
  const bw = new Painter(TW, H);
  for (let j = walkTop; j < H; j++) for (let i = 0; i < TW; i++) {
    const row = Math.floor((j - walkTop) / R(3));
    const seam = (i + row * R(17)) % R(24) === 0;
    let col = row % 2 ? '#a5734d' : '#b07d55';
    if ((j - walkTop) % R(3) === 0) col = '#7c5236';
    if (seam) col = '#6f4830';
    if (j === walkTop) col = '#c8935f';
    if (j > feet + R(3)) col = (j - feet) % 2 ? '#5d3d29' : '#664430';
    bw.px(i, j, col);
  }
  const postEvery = R(64);
  for (let p = 0; p < TW; p += postEvery) {
    bw.rect(p, walkTop - R(11), Math.max(2, R(2)), R(11), '#6b4a34');
    bw.rect(p, walkTop - R(11), 1, R(11), '#8d6446');
    for (let s = 0; s < postEvery; s++) {     // sagging rope
      const t = s / postEvery, y = walkTop - R(9) + Math.round(Math.sin(t * Math.PI) * R(3));
      bw.wpx(p + 1 + s, y, '#d9c4a0');
    }
  }
  layers.walk = bw;

  // foreground ice plant (1.3)
  const fg = new Painter(TW, H);
  const rf = rng(41);
  for (let n = 0; n < 26; n++) {
    const x0 = rf() * TW, wdt = R(10) + rf() * R(16), hh = R(4) + rf() * R(4);
    for (let i = 0; i < wdt; i++) {
      const t = i / wdt, top = H - Math.round(Math.sin(t * Math.PI) * hh) - 1;
      for (let j = top; j < H; j++) fg.wpx(x0 + i, j, j === top ? '#7fa65a' : ((i + j) % 3 ? '#4d7a43' : '#3d6538'));
      if (rf() < 0.18) { fg.wpx(x0 + i, top - 1, '#ff7ab8'); fg.wpx(x0 + i, top, '#e0559a'); }
    }
  }
  layers.fg = fg;

  // sun glitter on the water: [x, y, brightness]
  const rg = rng(5), glitter = [];
  for (let n = 0; n < 70; n++) {
    const j = horizon + 1 + Math.floor(Math.pow(rg(), 1.4) * (shore - horizon - 2));
    const spread = R(4) + (j - horizon) * 0.9;
    glitter.push([sx + (rg() - 0.5) * 2 * spread, j, rg()]);
  }
  return { W, H, layers, horizon, shore, walkTop, feet, TW, glitter };
}

function layer(ctx, img, par, y, t) {
  const off = Math.round((t * SPEED * par) % img.width);
  ctx.drawImage(img, -off, y);
  ctx.drawImage(img, img.width - off, y);
}

// Draw one frame. scene.canvases holds the layers as canvases (the engine converts them);
// env.hero(key) / env.dog(key) return { canvases, anchorX, footY } for an outfit.
export function renderBeach(ctx, t, scene, env) {
  const { W, H, canvases: c } = scene;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  layer(ctx, c.clouds, 0.06, 0, t);
  layer(ctx, c.head, 0.12, 0, t);
  layer(ctx, c.ocean, 0.25, scene.horizon + 1, t);
  const tick = Math.floor(t * 6);
  scene.glitter.forEach(([x, y, r], n) => {
    if (((n * 7 + tick) % 5) < 2) {
      ctx.fillStyle = r > 0.6 ? '#fff4c8' : '#ffd27e';
      ctx.fillRect(Math.round(x), y, r > 0.8 ? 2 : 1, 1);
    }
  });
  layer(ctx, c.beach, 0.5, 0, t);
  layer(ctx, c.walk, 1, 0, t);
  const hero = env.hero('work'), dog = env.dog('houndstooth');
  const x = Math.round(W * 0.34);
  ctx.drawImage(hero.canvases[Math.floor(t * 6) % hero.canvases.length], x - hero.anchorX, scene.feet - hero.footY);
  ctx.drawImage(dog.canvases[Math.floor(t * 9) % dog.canvases.length], x + 28 - dog.anchorX, scene.feet - dog.footY);
  layer(ctx, c.fg, 1.3, 0, t);
}

export const beach = { build: buildBeach, render: renderBeach };
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `node --test 'tests/reel/beach.test.js'`
Expected: `ℹ pass 4`, `ℹ fail 0`.

- [ ] **Step 7: Commit**

```bash
git add reel/beach.js tests/reel/beach.test.js tests/reel/fixtures/make-beach-golden.mjs tests/reel/fixtures/beach-golden.json
git commit -m "feat(reel): Port the approved California beach scene"
```

---

### Task 5: Timeline maths

**Files:**
- Create: `reel/timeline.js`
- Test: `tests/reel/timeline.test.js`

**Interfaces:**
- Consumes: nothing. A chapter is `{ name, shots }`, and a shot is `{ id, duration, caption, scene }`.
- Produces:
  - `buildTimeline(chapters) → { duration, shots: [{ shot, chapter, start, end }], chapters: [{ name, start, end }] }`.
  - `locate(tl, t) → { index, entry, local, chapter, t }`. It wraps `t` into the loop, and a boundary belongs to the next shot.
  - `chapterStart(tl, n) → number`.
  - `liveStep(chapter, stepCount) → Math.min(chapter, stepCount - 1)`.
  - `parseDebug(search) → null | { time } | { shot }`.

- [ ] **Step 1: Write the failing test**

Create `tests/reel/timeline.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline, locate, chapterStart, liveStep, parseDebug } from '../../reel/timeline.js';

const shot = (id, duration, caption) => ({ id, duration, caption });
const CH = [
  { name: 'Sheffield', shots: [shot('a', 4, 'Sheffield'), shot('b', 4, 'Europe')] },
  { name: 'New York', shots: [shot('c', 6, 'New York')] },
  { name: 'To be continued', shots: [shot('d', 2, 'To be continued…')] },
];

test('buildTimeline lays shots end to end and records chapter spans', () => {
  const tl = buildTimeline(CH);
  assert.equal(tl.duration, 16);
  assert.deepEqual(tl.shots.map(e => [e.shot.id, e.chapter, e.start, e.end]), [['a', 0, 0, 4], ['b', 0, 4, 8], ['c', 1, 8, 14], ['d', 2, 14, 16]]);
  assert.deepEqual(tl.chapters, [{ name: 'Sheffield', start: 0, end: 8 }, { name: 'New York', start: 8, end: 14 }, { name: 'To be continued', start: 14, end: 16 }]);
});

test('locate finds the shot, its local time and chapter, and wraps around the loop', () => {
  const tl = buildTimeline(CH);
  const at = (t) => { const l = locate(tl, t); return [l.entry.shot.id, l.local, l.chapter]; };
  assert.deepEqual(at(0), ['a', 0, 0]);
  assert.deepEqual(at(5.5), ['b', 1.5, 0]);
  assert.deepEqual(at(8), ['c', 0, 1], 'a boundary belongs to the next shot');
  assert.deepEqual(at(17), ['a', 1, 0], 'past the end wraps to the start');
  assert.deepEqual(at(-1), ['d', 1, 2], 'negative time wraps from the end');
});

test('chapterStart gives the jump target for each chapter button', () => {
  const tl = buildTimeline(CH);
  assert.deepEqual([0, 1, 2].map(n => chapterStart(tl, n)), [0, 8, 14]);
});

test('liveStep maps chapters onto the four About steps, holding the last', () => {
  assert.deepEqual([0, 1, 2, 3, 4].map(c => liveStep(c, 4)), [0, 1, 2, 3, 3]);
});

test('parseDebug reads ?reel= as a time or a shot id', () => {
  assert.equal(parseDebug(''), null);
  assert.equal(parseDebug('?reel='), null);
  assert.deepEqual(parseDebug('?reel=42.5'), { time: 42.5 });
  assert.deepEqual(parseDebug('?x=1&reel=ch2-michelin'), { shot: 'ch2-michelin' });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test 'tests/reel/timeline.test.js'`
Expected: FAIL, with `Cannot find module '…/reel/timeline.js'`.

- [ ] **Step 3: Write the implementation**

Create `reel/timeline.js`:

```js
// The reel's clock maths. Pure: chapters of shots in, absolute times out.
// A chapter is { name, shots }; a shot is { id, duration, caption, scene }.

export function buildTimeline(chapters) {
  const shots = [], spans = [];
  let t = 0;
  chapters.forEach((ch, chapter) => {
    const start = t;
    for (const shot of ch.shots) {
      shots.push({ shot, chapter, start: t, end: t + shot.duration });
      t += shot.duration;
    }
    spans.push({ name: ch.name, start, end: t });
  });
  return { duration: t, shots, chapters: spans };
}

// Which shot is on screen at time t (wrapped into one loop), and how far into it.
export function locate(tl, t) {
  const d = tl.duration;
  const tt = ((t % d) + d) % d;
  let index = tl.shots.findIndex(e => tt < e.end);
  if (index < 0) index = tl.shots.length - 1;
  const entry = tl.shots[index];
  return { index, entry, local: tt - entry.start, chapter: entry.chapter, t: tt };
}

export function chapterStart(tl, n) {
  return tl.chapters[n].start;
}

// The About path has one step per institution; chapter 5 ("to be continued") keeps the last lit.
export function liveStep(chapter, stepCount) {
  return Math.min(chapter, stepCount - 1);
}

// ?reel=42.5 -> { time: 42.5 } (render that moment, paused); ?reel=ch2-michelin -> { shot } (loop it).
export function parseDebug(search) {
  const v = new URLSearchParams(search).get('reel');
  if (v === null || v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? { time: n } : { shot: v };
}
```

- [ ] **Step 4: Run all unit tests**

Run: `node --test 'tests/reel/*.test.js'`
Expected: `ℹ pass 53`, `ℹ fail 0`.

- [ ] **Step 5: Commit**

```bash
git add reel/timeline.js tests/reel/timeline.test.js
git commit -m "feat(reel): Add timeline maths and the ?reel= debug parser"
```

---

### Task 6: The reel on the page

**Files:**
- Create: `tests/reel/page-check.sh`
- Modify: `index.html`, inserting after `</header>` (line 49) and before `</body>`
- Modify: `style.css`, in three places: before `/* ---------- Sections ---------- */`, after `.step-org:hover .step-deg`, and inside `@media (max-width: 720px)`
- Create: `reel/sprites.js`, `reel/story.js`, `reel/reel.js`

**Interfaces:**
- Consumes:
  - `heroSprite` (Task 2) and `dogSprite` (Task 3).
  - `beach` (Task 4).
  - `buildTimeline`, `locate`, `chapterStart`, `liveStep` and `parseDebug` (Task 5).
- Produces:
  - The markup contract: `section#reel.reel > .reel-stage > canvas.reel-canvas + .reel-grain`, and `.reel-ui > p.reel-caption + .reel-nav > button.reel-pause`. The chapter buttons `button.reel-ch` are generated before the pause button.
  - State on the section, used by the page checks: `data-state="playing|paused"`, `data-chapter="0".."4"` and `data-t="<seconds, 2 decimals>"`.
  - `.is-live` on the About `.step` that matches the chapter on screen.
  - `--reel-scale` on `.reel-stage` (2, 3 or 4). CSS sets it and `reel.js` reads it, so there is one source of truth for the breakpoints.
  - Scene definitions follow `{ build(W, H) → { layers: {name: Painter}, ... }, render(ctx, t, scene, env) }`, and shots follow `{ id, scene, caption, duration }`. Later phases add chapters in exactly these shapes.

- [ ] **Step 1: Write the failing page check**

Create `tests/reel/page-check.sh`, then make it executable with `chmod +x tests/reel/page-check.sh`:

```bash
#!/usr/bin/env bash
# Integration checks for the reel on the real page, through headless Chrome.
# Usage: tests/reel/page-check.sh            (from anywhere; serves the repo root)
set -uo pipefail
cd "$(dirname "$0")/../.."
PORT="${PORT:-8137}"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
sleep 1

fail=0
# dom WIDTHxHEIGHT PATH [extra chrome flags...]
dom() {
  local size="$1" path="$2"; shift 2
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size="$size" \
    --virtual-time-budget=3000 "$@" --dump-dom "http://127.0.0.1:$PORT/$path" 2>/dev/null
}
# expect NAME HTML REGEX...: every regex must match
expect() {
  local name="$1" html="$2"; shift 2
  for re in "$@"; do
    if ! grep -Eq -- "$re" <<<"$html"; then echo "FAIL - $name: no match for /$re/"; fail=1; return; fi
  done
  echo "ok   - $name"
}
reel() { grep -Eo '<section id="reel"[^>]*>' <<<"$1"; }
canvas() { grep -Eo '<canvas class="reel-canvas"[^>]*>' <<<"$1"; }

d=$(dom 1440,900 '?reel=1')
expect 'paused at 1s: Sheffield, chapter 1, step 1 lit' "$d" \
  'data-state="paused"' 'data-chapter="0"' 'class="reel-caption[^"]*">Sheffield<' 'class="step is-live" data-org="sheffield"'
expect 'desktop canvas is 1440/3 native px wide' "$(canvas "$d")" 'width="480"' 'height="96"'
expect 'five chapter buttons plus pause' "$d" 'aria-label="Chapter 5: To be continued"[^>]*>05<' 'class="reel-pause" aria-label="Play"'

d=$(dom 1440,900 '?reel=5');  expect 'caption switches to Europe inside chapter 1' "$d" 'data-chapter="0"' '>Europe<'
d=$(dom 1440,900 '?reel=9');  expect 'New York lights step 2' "$d" 'data-chapter="1"' '>New York<' 'class="step is-live" data-org="columbia"'
d=$(dom 1440,900 '?reel=15'); expect 'Michigan lights step 3' "$d" 'data-chapter="2"' 'class="step is-live" data-org="msu"'
d=$(dom 1440,900 '?reel=21'); expect 'California lights step 4' "$d" 'data-chapter="3"' 'class="step is-live" data-org="amazon"'
d=$(dom 1440,900 '?reel=29'); expect 'To be continued keeps step 4 lit' "$d" 'data-chapter="4"' '>To be continued…<' 'class="step is-live" data-org="amazon"'

# headless Chrome will not go narrower than 500px, so the phone check runs at 500 (still 2x)
expect 'phone-size canvas is 500/2 native px wide' "$(canvas "$(dom 500,900 '?reel=1')")" 'width="250"' 'style="[^"]*width: 500px'
expect 'wide screen switches to 4x' "$(canvas "$(dom 1920,1080 '?reel=1')")" 'width="480"' 'style="[^"]*width: 1920px'

expect 'offscreen at load: waits at t=0' "$(reel "$(dom 1440,900 '')")" 'data-state="paused"' 'data-t="0.00"'
expect 'scrolled into view: plays' "$(reel "$(dom 1440,900 '#reel')")" 'data-state="playing"' 'data-t="(0\.[0-9]*[1-9]|[1-9])'
expect 'shot loop debug plays that shot' "$(dom 1440,900 '?reel=ch1-europe')" 'data-state="playing"' '>Europe<'
expect 'reduced motion: still poster, no autoplay' "$(dom 1440,900 '#reel' --force-prefers-reduced-motion)" \
  'data-state="paused"' '>California<' 'class="step is-live" data-org="amazon"' 'aria-label="Play"'

if git rev-parse --verify -q main >/dev/null; then
  if diff <(git show main:index.html | grep -o 'href="[^"]*"' | sort) <(grep -o 'href="[^"]*"' index.html | sort) >/dev/null; then
    echo "ok   - every href in index.html is unchanged"
  else
    echo "FAIL - hrefs in index.html changed"; fail=1
  fi
fi
exit $fail
```

- [ ] **Step 2: Run it to verify it fails**

Run: `tests/reel/page-check.sh`
Expected: exit code 1, with `FAIL - …` lines; the first is `FAIL - paused at 1s: Sheffield, chapter 1, step 1 lit: no match for /data-state="paused"/`. The href check prints `ok`.

- [ ] **Step 3: Add the markup to `index.html`**

Insert this block between `</header>` and `<main>`, with one blank line on each side, so that the file reads `</header>`, blank line, this block, blank line, `<main>`:

```html
<section id="reel" class="reel" aria-label="Life reel">
  <div class="reel-stage">
    <canvas class="reel-canvas" role="img" aria-label="Pixel-art animation: a small Yimeng walks to the right through five chapters of life, from Sheffield and travels across Europe, to New York and Columbia, a PhD in Michigan, and California, with a dog alongside from 2019. To be continued."></canvas>
    <div class="reel-grain" aria-hidden="true"></div>
  </div>
  <div class="reel-ui">
    <p class="reel-caption"></p>
    <div class="reel-nav">
      <button type="button" class="reel-pause" aria-label="Pause"></button>
    </div>
  </div>
</section>
```

Then add the module script on its own line between the existing inline `</script>` and `</body>`, so the end of the file reads:

```html
})();
</script>
<script type="module" src="reel/reel.js"></script>
</body>
</html>
```

- [ ] **Step 4: Add the styles to `style.css`**

(a) Insert this block directly above the line `/* ---------- Sections ---------- */`, with one blank line between them:

```css
/* ---------- Reel ---------- */
/* Pixel canvas at native 96px tall, scaled by --reel-scale (read by reel/reel.js). Hidden
   without JS: the section only exists for the script. */
.reel { display: none; }
.js .reel { display: block; position: relative; background: var(--bg); }
.reel-stage { --reel-scale: 3; position: relative; height: calc(96px * var(--reel-scale)); overflow: hidden; }
@media (max-width: 600px) { .reel-stage { --reel-scale: 2; } }
@media (min-width: 1801px) { .reel-stage { --reel-scale: 4; } }
.reel-canvas { position: absolute; top: 0; left: 0; image-rendering: crisp-edges; image-rendering: pixelated; }
.reel-stage::before, .reel-stage::after { content: ""; position: absolute; left: 0; right: 0; z-index: 1; pointer-events: none; }
.reel-stage::before { top: 0; height: 34%; background: linear-gradient(var(--bg), rgba(11, 11, 12, 0)); }
.reel-stage::after { bottom: 0; height: 12%; background: linear-gradient(rgba(11, 11, 12, 0), var(--bg)); }
/* Same grain as the hero, a touch lighter over pixels */
.reel-grain {
  position: absolute; inset: 0; z-index: 2; pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E");
  opacity: .07; mix-blend-mode: overlay;
}
.reel-ui {
  position: absolute; z-index: 3; top: 0; left: 0; right: 0;
  max-width: calc(var(--wrap) + 2 * var(--gutter)); margin: 0 auto; padding: 18px var(--gutter) 0;
  display: flex; justify-content: space-between; align-items: center;
}
.reel-caption {
  font-family: var(--mono); font-size: 11px; letter-spacing: .28em; text-transform: uppercase;
  color: var(--accent); min-height: 1em;
}
.reel-caption.swap { animation: reel-fade .6s ease; }
@keyframes reel-fade { from { opacity: 0; } to { opacity: 1; } }
.reel-nav { display: flex; align-items: center; gap: 4px; }
.reel-nav button {
  font: 11px/1 var(--mono); letter-spacing: .12em; color: var(--muted);
  background: none; border: 0; padding: 6px 7px; cursor: pointer; transition: color .2s, border-color .2s;
}
.reel-nav button:hover, .reel-nav button[aria-current="true"] { color: var(--accent); }
.reel-nav button:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 4px; }
.reel-nav .reel-pause {
  display: grid; place-items: center; width: 28px; height: 28px; padding: 0; margin-left: 8px;
  border: 1px solid rgba(233, 230, 223, .22); border-radius: 50%; color: var(--text);
}
.reel-nav .reel-pause:hover { border-color: var(--accent); color: var(--accent); }
.reel-pause svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
```

(b) Directly after the line `.step-org:hover .step-deg { color: var(--accent); }`, add:

```css
/* The step for the reel chapter on screen lights up like its hover state. */
.step.is-live .step-logo { filter: saturate(var(--lsat, 1)) brightness(var(--lbh, 1)); }
.step.is-live .step-deg { color: var(--accent); }
```

(c) Inside `@media (max-width: 720px) {`, right after `  body { font-size: 16px; }`, add:

```css
  .reel-ui { padding: 12px 18px 0; }
  .reel-caption { font-size: 10px; letter-spacing: .2em; }
  .reel-nav button { padding: 5px 4px; font-size: 10px; }
  .reel-nav .reel-pause { width: 24px; height: 24px; margin-left: 4px; }
```

- [ ] **Step 5: Create the DOM adapter, the running order and the engine**

Create `reel/sprites.js`:

```js
// DOM side of the pixel pipeline: text grids and Painters become canvases.
import { hexToRgb } from './pixels.js';

export function gridCanvas(rows, palette) {
  const h = rows.length, w = rows[0].length;
  const img = new ImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = rows[y][x];
    if (ch === '.') continue;
    const [r, g, b] = hexToRgb(palette[ch]), k = (y * w + x) * 4;
    img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = b; img.data[k + 3] = 255;
  }
  return imageCanvas(img);
}

export function painterCanvas(p) {
  return imageCanvas(new ImageData(p.data, p.w, p.h));
}

function imageCanvas(img) {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  c.getContext('2d').putImageData(img, 0, 0);
  return c;
}

// A sprite ({ frames, palette, anchorX, footY }) as canvases, ready for drawImage.
export function spriteCanvases(sprite) {
  return { canvases: sprite.frames.map(f => gridCanvas(f, sprite.palette)), anchorX: sprite.anchorX, footY: sprite.footY };
}
```

Create `reel/story.js`:

```js
// The reel's running order. Phase 1: every chapter is a stand-in on the beach scene, so the
// controls, captions and timeline sync can be reviewed before the real chapters exist.
import { beach } from './beach.js';

const standIn = (id, caption, duration) => ({ id, scene: beach, caption, duration });

export const CHAPTERS = [
  { name: 'Sheffield', shots: [standIn('ch1-sheffield', 'Sheffield', 4), standIn('ch1-europe', 'Europe', 4)] },
  { name: 'New York', shots: [standIn('ch2-new-york', 'New York', 6)] },
  { name: 'Michigan', shots: [standIn('ch3-michigan', 'Michigan', 6)] },
  { name: 'California', shots: [standIn('ch4-california', 'California', 8)] },
  { name: 'To be continued', shots: [standIn('ch5-continued', 'To be continued…', 4)] },
];

// Shown, still, to visitors who prefer reduced motion (chapter 4 = California).
export const POSTER = { id: 'poster', scene: beach, caption: 'California', duration: 1, chapter: 3 };
```

Create `reel/reel.js`:

```js
// The life reel: mounts on <section class="reel">, plays the story on a pixel canvas,
// and keeps the caption, chapter buttons and About timeline in step with it.
import { buildTimeline, locate, chapterStart, liveStep, parseDebug } from './timeline.js';
import { heroSprite } from './hero.js';
import { dogSprite } from './dog.js';
import { painterCanvas, spriteCanvases } from './sprites.js';
import { CHAPTERS, POSTER } from './story.js';

const H = 96;                         // native height; the width follows the stage
const FRAME_MS = 1000 / 30;           // redraw cap
const ICON = {
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
};

function memo(fn) {
  const m = new Map();
  return (k) => { if (!m.has(k)) m.set(k, fn(k)); return m.get(k); };
}

export function mountReel(section, chapters, poster) {
  const stage = section.querySelector('.reel-stage');
  const canvas = section.querySelector('.reel-canvas');
  const ctx = canvas.getContext('2d');
  const caption = section.querySelector('.reel-caption');
  const nav = section.querySelector('.reel-nav');
  const pauseBtn = section.querySelector('.reel-pause');
  const steps = [...document.querySelectorAll('#about .path .step')];
  const debug = parseDebug(location.search);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const full = buildTimeline(chapters);
  let tl = full;
  let soloChapter = null;             // ?reel=<shot-id>: loop one shot, report its real chapter
  if (debug && debug.shot) {
    const hit = full.shots.find(e => e.shot.id === debug.shot);
    if (hit) { tl = buildTimeline([{ name: chapters[hit.chapter].name, shots: [hit.shot] }]); soloChapter = hit.chapter; }
  }

  let t = debug && debug.time !== undefined ? debug.time : 0;
  let userPaused = reduced || Boolean(debug && debug.time !== undefined);
  let showingPoster = reduced && !debug;
  let inView = Boolean(debug && debug.shot);
  let W = 0, scale = 0, raf = 0, last = null, lastDraw = -Infinity;
  let shownCaption = null, shownChapter = -1;

  const env = {
    hero: memo(key => spriteCanvases(heroSprite(key))),
    dog: memo(key => spriteCanvases(dogSprite(key))),
  };
  const scenes = new Map();           // scene definition -> built scene at the current width
  function sceneFor(def) {
    if (!scenes.has(def)) {
      const s = def.build(W, H);
      s.canvases = Object.fromEntries(Object.entries(s.layers).map(([k, p]) => [k, painterCanvas(p)]));
      scenes.set(def, s);
    }
    return scenes.get(def);
  }

  function setCaption(text) {
    if (text === shownCaption) return;
    shownCaption = text;
    caption.textContent = text;
    caption.classList.remove('swap');
    void caption.offsetWidth;         // restart the fade
    caption.classList.add('swap');
  }

  function setChapter(n) {
    if (n === shownChapter) return;
    shownChapter = n;
    section.dataset.chapter = String(n);
    nav.querySelectorAll('.reel-ch').forEach((b, i) => b.setAttribute('aria-current', String(i === n)));
    const live = liveStep(n, steps.length);
    steps.forEach((s, i) => s.classList.toggle('is-live', i === live));
  }

  function draw() {
    if (!W) return;
    let shot, local, chapter;
    if (showingPoster) {
      shot = poster; local = 0; chapter = poster.chapter;
    } else {
      const at = locate(tl, t);
      shot = at.entry.shot; local = at.local; chapter = soloChapter ?? at.chapter;
    }
    ctx.imageSmoothingEnabled = false;
    shot.scene.render(ctx, local, sceneFor(shot.scene), env);
    setCaption(shot.caption);
    setChapter(chapter);
    section.dataset.t = (showingPoster ? 0 : t).toFixed(2);
  }

  function layout() {
    const s = parseInt(getComputedStyle(stage).getPropertyValue('--reel-scale'), 10) || 3;
    const w = Math.ceil(stage.clientWidth / s);
    if (w === W && s === scale) return;
    W = w; scale = s;
    canvas.width = W;                 // also clears the canvas
    canvas.height = H;
    canvas.style.width = W * scale + 'px';
    canvas.style.height = H * scale + 'px';
    canvas.style.left = Math.floor((stage.clientWidth - W * scale) / 2) + 'px';
    scenes.clear();
    draw();
  }

  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (last !== null) t = (t + (now - last) / 1000) % tl.duration;
    last = now;
    if (now - lastDraw >= FRAME_MS - 1) { lastDraw = now; draw(); }
  }

  function sync() {
    const playing = !userPaused && inView && !document.hidden;
    section.dataset.state = playing ? 'playing' : 'paused';
    if (playing && !raf) { last = null; raf = requestAnimationFrame(tick); }
    if (!playing && raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  function setPaused(p) {
    userPaused = p;
    pauseBtn.setAttribute('aria-label', p ? 'Play' : 'Pause');
    pauseBtn.innerHTML = p ? ICON.play : ICON.pause;
    sync();
  }

  function jump(n) {
    tl = full; soloChapter = null; showingPoster = false;
    t = chapterStart(full, n);
    draw();
  }

  chapters.forEach((ch, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'reel-ch';
    b.textContent = String(i + 1).padStart(2, '0');
    b.setAttribute('aria-label', `Chapter ${i + 1}: ${ch.name}`);
    b.addEventListener('click', () => jump(i));
    nav.insertBefore(b, pauseBtn);
  });
  pauseBtn.addEventListener('click', () => {
    if (userPaused && showingPoster) { showingPoster = false; t = 0; draw(); }
    setPaused(!userPaused);
  });
  document.addEventListener('visibilitychange', sync);
  if (!(debug && debug.shot)) {
    new IntersectionObserver(([e]) => { inView = e.intersectionRatio >= 0.25; sync(); }, { threshold: [0, 0.25, 0.5, 1] }).observe(section);
  }
  new ResizeObserver(layout).observe(stage);
  layout();
  setPaused(userPaused);
}

const section = document.querySelector('.reel');
if (section) mountReel(section, CHAPTERS, POSTER);
```

- [ ] **Step 6: Run the unit tests and the page checks**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 53`, then 15 `ok   - …` lines (the last is `every href in index.html is unchanged`) and exit code 0.

- [ ] **Step 7: Commit**

```bash
git add index.html style.css reel/sprites.js reel/story.js reel/reel.js tests/reel/page-check.sh
git commit -m "feat(reel): Mount the life reel above About with controls and timeline sync"
```

---

### Task 7: Visual review and the phase-1 hand-off

**Files:**
- Create: `tests/reel/shoot.mjs`
- Modify: `docs/superpowers/specs/2026-10-03-life-reel-design.md`, the **Files:** bullets under "Technical design"

**Interfaces:**
- Consumes: the page from Task 6.
- Produces: `node tests/reel/shoot.mjs <url> <out.png> [--width N] [--height N] [--mobile] [--scroll SELECTOR] [--reduced-motion] [--no-js] [--wait MS]`. Later phases use it to review every shot.

- [ ] **Step 1: Create the screenshot tool**

Create `tests/reel/shoot.mjs`:

```js
// Screenshot a page through the Chrome DevTools Protocol, for reviewing the reel by eye.
// Unlike `chrome --screenshot`, it can emulate a 390px phone, scroll to an element first,
// and emulate prefers-reduced-motion.
//
//   node tests/reel/shoot.mjs <url> <out.png> [--width 1440] [--height 900] [--mobile]
//        [--scroll '#reel'] [--reduced-motion] [--no-js] [--wait 1500]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, out, ...rest] = process.argv.slice(2);
if (!url || !out) { console.error('usage: shoot.mjs <url> <out.png> [options]'); process.exit(2); }
const opt = { width: 1440, height: 900, mobile: false, scroll: null, reduced: false, noJs: false, wait: 1500 };
for (let i = 0; i < rest.length; i++) {
  const a = rest[i];
  if (a === '--width') opt.width = Number(rest[++i]);
  else if (a === '--height') opt.height = Number(rest[++i]);
  else if (a === '--mobile') opt.mobile = true;
  else if (a === '--scroll') opt.scroll = rest[++i];
  else if (a === '--reduced-motion') opt.reduced = true;
  else if (a === '--no-js') opt.noJs = true;
  else if (a === '--wait') opt.wait = Number(rest[++i]);
  else { console.error(`unknown option ${a}`); process.exit(2); }
}

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333 + Math.floor(Math.random() * 500);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'reel-shoot-'))}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

try {
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    await sleep(100);
    try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page'); } catch {}
  }
  if (!target) throw new Error('Chrome did not start');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pending = new Map(), waiters = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method) waiters.filter(w => w.method === msg.method).forEach(w => w.resolve(msg.params));
  };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const n = ++id;
    pending.set(n, (msg) => (msg.error ? rej(new Error(`${method}: ${msg.error.message}`)) : res(msg.result)));
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  const once = (method) => new Promise(resolve => waiters.push({ method, resolve }));

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: opt.width, height: opt.height, deviceScaleFactor: 1, mobile: opt.mobile });
  if (opt.reduced) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  if (opt.noJs) await send('Emulation.setScriptExecutionDisabled', { value: true });
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url });
  await loaded;
  if (opt.scroll) {
    await send('Runtime.evaluate', { expression: `document.querySelector(${JSON.stringify(opt.scroll)}).scrollIntoView({ block: 'center' })` });
  }
  await sleep(opt.wait);
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(out, Buffer.from(data, 'base64'));
  console.log(`wrote ${out}`);
  ws.close();
} finally {
  chrome.kill();
}
```

- [ ] **Step 2: Take the review screenshots**

Run from the repo root:

```bash
python3 -m http.server 8000 --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!; sleep 1
node tests/reel/shoot.mjs 'http://127.0.0.1:8000/?reel=21' /tmp/reel-desktop.png --scroll '#reel'
node tests/reel/shoot.mjs 'http://127.0.0.1:8000/?reel=21' /tmp/reel-phone.png --width 390 --height 844 --mobile --scroll '#reel'
node tests/reel/shoot.mjs 'http://127.0.0.1:8000/' /tmp/reel-reduced.png --reduced-motion --scroll '#reel'
node tests/reel/shoot.mjs 'http://127.0.0.1:8000/' /tmp/reel-nojs.png --no-js --scroll '#about'
kill $SERVER
```

Expected: four `wrote /tmp/reel-….png` lines. Open each image and confirm:
- **Desktop:** the beach banner is full width directly under the hero. The top-left caption reads `CALIFORNIA`, `04` is amber at the top right, and the round button shows a play triangle (debug time pauses playback). In the About path below, the Amazon logo is in colour and "Applied Scientist" is amber.
- **Phone (390 px):** the same banner at about 192 px tall, with the vertical About rail below it.
- **Reduced motion:** the same beach poster with `CALIFORNIA`, paused, with the play triangle.
- **No JS:** the hero is followed directly by `01 — ABOUT`, with no empty dark band.

- [ ] **Step 3: Update the spec's file list**

In `docs/superpowers/specs/2026-10-03-life-reel-design.md`, replace the whole **Files:** bullet (from `- **Files:**` through the `style.css` sub-bullet) with:

```markdown
- **Files:**
  - `reel/reel.js` is the engine. It mounts the reel, sizes it, runs the clock, renders, and handles the controls, IntersectionObserver, reduced motion, chapter navigation and timeline sync.
  - `reel/pixels.js` holds the pure pixel helpers: grids with generated outlines, Bresenham lines, recolouring, the seeded PRNG, an RGBA `Painter`, banded gradients, and (from chapter 2) a 3×5 pixel font.
  - `reel/hero.js` and `reel/dog.js` hold the cast: Yimeng's rig with every outfit, and the dog with its outfits. Sprites are composed from parts at runtime.
  - `reel/timeline.js` holds the pure clock maths: chapters of shots become absolute times, plus `locate`, chapter starts and `?reel=` parsing.
  - `reel/sprites.js` turns grids and Painters into canvases.
  - `reel/story.js` holds the running order and imports one module per chapter (`reel/ch1-sheffield.js` … `reel/ch5-continued.js`) as each is built.
  - `reel/beach.js` holds the approved beach scene, which is also the reduced-motion poster.
  - `style.css` gets a new `/* ---------- Reel ---------- */` block, plus `.step.is-live` rules.
```

- [ ] **Step 4: Commit**

```bash
git add tests/reel/shoot.mjs docs/superpowers/specs/2026-10-03-life-reel-design.md
git commit -m "test(reel): Add DevTools screenshot tool; align spec file list with phase 1"
```

- [ ] **Step 5: Hand over for review**

Start a server (`python3 -m http.server 8000 --bind 127.0.0.1` from the repo root) and give the user these links to try in their own browser:
- `http://127.0.0.1:8000/`: scroll down; the reel starts when it comes into view and pauses when it scrolls away.
- `http://127.0.0.1:8000/?reel=ch4-california`: loops the beach shot.
- `http://127.0.0.1:8000/?reel=29`: the moment the `To be continued…` stand-in is on screen.

Point out that every chapter is still a beach stand-in. The phase-1 review is about the cast, the controls, the caption, the timeline sync and the sizing on their screens. Stop there: do not merge or push. The next phase (chapter 1) gets its own plan after this review.
