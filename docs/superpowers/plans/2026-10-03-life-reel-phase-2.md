# Life Reel — Phase 2 (Chapter 1: Sheffield → Europe) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace chapter 1's beach stand-in with the real chapter: seven shots, about 17 s in all. Yimeng walks Sheffield in drizzle, sits by a train window as Paris, Rome, Barcelona and the Alps stream past, rides Lisbon's 28 tram up a hill, laps the Nürburgring in the Golf GTI, sits at the tip of Trolltunga, stands under the aurora at Vestrahorn, and flies out.

**Architecture:** The engine gains three things: shot fades (`fadeAlpha`), an `env` that serves scene pixel art and hero poses, and sprite placement metadata. The cast gains a sit pose, and pixels gain a 3×5 font. A small `kit.js` holds what every scene shares. Each shot is a pure scene module, `{ build(W, H) → { layers: Painters, … }, render(ctx, t, scene, env) }`, under `reel/ch1/`. Each module comes with a Node test against a recording fake canvas, plus a visual check of real frames.

**Tech Stack:** Vanilla JS (ES modules, Canvas 2D), Node 25 `node:test`, headless Chrome through the DevTools protocol for frame grabs, Python 3 with Pillow for contact sheets.

**Spec:** `docs/superpowers/specs/2026-10-03-life-reel-design.md`, chapter 1 storyboard. **Builds on:** `docs/superpowers/plans/2026-10-03-life-reel-phase-1.md`.

## Global Constraints

- No framework, no build step, no npm dependencies; GitHub Pages serves files as they are.
- On-screen text is English. Chapter 1 captions: `Sheffield` for the first shot, `Europe` for every shot after it.
- Native canvas height is 96 px, scaled 2×/3×/4× at ≤600 px, ≤1800 px and wider viewports. Every scene must read at native widths 195 (phone), 480 (desktop) and 640 (wide).
- Yimeng's outfits come from the approved wardrobe: `sheffield` (Sheffield), `travel` (train, Lisbon, Nürburgring), `trolltunga`, `iceland`. The dog does not appear before chapter 2.
- The Nürburgring car is Yimeng's modified VW Golf GTI in Tornado Red: lowered, aftermarket wheels, red grille stripe.
- Ranch, hunting and every later chapter are out of scope here. Chapters 2–5 stay beach stand-ins.
- Every scene is deterministic, with a seeded PRNG and no `Math.random`, so every play looks the same.
- The existing golden tests (the 19 walking outfits, the dog, the beach) must keep passing untouched.
- All work is on branch `life-reel`. Do not merge, and do not push.

## File structure

| File | Responsibility |
|---|---|
| `reel/timeline.js` (modify) | + `fadeAlpha(shot, t)` |
| `reel/reel.js` (modify) | Applies shot fades; `env.hero(key, pose)` and `env.art(pixelArt)`; passes `shot` to `render` |
| `reel/sprites.js` (modify) | `spriteCanvases` keeps every placement field (`seatY` as well) |
| `reel/pixels.js` (modify) | + `textRows(str)`, a 3×5 pixel font |
| `reel/hero.js` (modify) | + the `sit` pose (2 frames) and `SEAT_Y`; `heroSprite(key, pose = 'walk')` |
| `reel/kit.js` | Shared scene helpers: `tile`, `gradient`, `art`, `label`, `ridge`, `drawHero` |
| `reel/ch1/sheffield.js` … `reel/ch1/iceland.js` | One module per location; `iceland.js` holds both the Vestrahorn shot and the takeoff |
| `reel/ch1/index.js` | `CHAPTER_1`: the seven shots with durations, captions and fades |
| `reel/story.js` (modify) | Chapter 1 becomes `CHAPTER_1` |
| `tests/reel/fake-canvas.js` | `Recorder` (a recording 2D context), `fakeCanvases`, `fakeEnv`, `sceneContract`, `frameAt` |
| `tests/reel/kit.test.js`, `tests/reel/ch1-*.test.js` | Unit tests |
| `tests/reel/frames.mjs`, `tests/reel/sheet.py` | Review tools: grab native frames at given times, and lay them out as a contact sheet |
| `tests/reel/page-check.sh` (modify) | Times shifted for the 17 s chapter 1; the shot-loop check uses `ch1-trolltunga` |

## How to run things

- Unit tests: `node --test 'tests/reel/*.test.js'` (quote the glob).
- Page checks: `tests/reel/page-check.sh`. Tasks 5–10 lengthen chapter 1 one shot at a time, so the time-based page checks only line up again in Task 11. Run them in Tasks 1–4 and 11 only.
- Frame review: start `python3 -m http.server 8000 --bind 127.0.0.1` from the repo root (and leave it running), then `node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 1.5,2.5 && python3 tests/reel/sheet.py /tmp/f /tmp/f.png 2`. For a phone, use `--width 390 --mobile`. Delete the output folder between runs (`rm -rf /tmp/f`), because the sheet includes every frame in it.

---

### Task 1: Shot fades and a richer render env

**Files:**
- Modify: `reel/timeline.js`, `reel/reel.js`, `reel/sprites.js`
- Test: `tests/reel/timeline.test.js` (append)

**Interfaces:**
- Consumes: Phase 1's `timeline.js`, `reel.js` and `sprites.js`.
- Produces:
  - `fadeAlpha(shot, t) → 0..1`. It is 1 at `t = 0` when `shot.fadeIn > 0` and ramps to 0 over `fadeIn`; it ramps back up to 1 over the last `fadeOut` seconds. The engine paints `#0b0b0c` at that alpha over the frame (never over the poster).
  - `env.hero(key, pose = 'walk')` and `env.art({ rows, palette })` (canvas, cached per object).
  - `render(ctx, t, scene, env, shot)`. The fifth argument is new.
  - `spriteCanvases(sprite)` keeps every field except `frames`/`palette`, so `seatY` reaches scenes.

- [ ] **Step 1: Write the failing test.** Append to `tests/reel/timeline.test.js`:

```js
test('fadeAlpha darkens the start and end of shots that ask for it', async () => {
  const { fadeAlpha } = await import('../../reel/timeline.js');
  const s = { duration: 4, fadeIn: 0.5, fadeOut: 1 };
  assert.equal(fadeAlpha(s, 0), 1);
  assert.equal(fadeAlpha(s, 0.25), 0.5);
  assert.equal(fadeAlpha(s, 2), 0);
  assert.equal(fadeAlpha(s, 3.5), 0.5);
  assert.equal(fadeAlpha({ duration: 4 }, 0), 0, 'no fade unless the shot sets one');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test 'tests/reel/timeline.test.js'`
Expected: 1 failure in `fadeAlpha darkens …` (`TypeError: fadeAlpha is not a function`).

- [ ] **Step 3: Implement.** Apply these replacements. Each "find" text occurs exactly once in its file.

`reel/timeline.js`, change 1. Find:

```js

export function chapterStart(tl, n) {
```

Replace with:

```js

// How much of the page background covers a shot at local time t: 1 = fully dark, 0 = clear.
// Shots opt in with fadeIn / fadeOut (seconds).
export function fadeAlpha(shot, t) {
  const fin = shot.fadeIn || 0, fout = shot.fadeOut || 0;
  let a = 0;
  if (fin > 0 && t < fin) a = 1 - t / fin;
  if (fout > 0 && t > shot.duration - fout) a = Math.max(a, 1 - (shot.duration - t) / fout);
  return Math.min(1, Math.max(0, a));
}

export function chapterStart(tl, n) {
```

`reel/reel.js`, change 1. Find:

```js
import { buildTimeline, locate, chapterStart, liveStep, parseDebug } from './timeline.js';
```

Replace with:

```js
import { buildTimeline, locate, chapterStart, liveStep, parseDebug, fadeAlpha } from './timeline.js';
```

`reel/reel.js`, change 2. Find:

```js
import { painterCanvas, spriteCanvases } from './sprites.js';
```

Replace with:

```js
import { painterCanvas, spriteCanvases, gridCanvas } from './sprites.js';
```

`reel/reel.js`, change 3. Find:

```js

  const env = {
```

Replace with:

```js

  const heroFrames = memo(id => { const [key, pose] = id.split(':'); return spriteCanvases(heroSprite(key, pose)); });
  const artCanvases = new WeakMap();
  const env = {
```

`reel/reel.js`, change 4. Find:

```js
    hero: memo(key => spriteCanvases(heroSprite(key))),
```

Replace with:

```js
    hero: (key, pose = 'walk') => heroFrames(key + ':' + pose),
```

`reel/reel.js`, change 5. Find:

```js
    dog: memo(key => spriteCanvases(dogSprite(key))),
  };
```

Replace with:

```js
    dog: memo(key => spriteCanvases(dogSprite(key))),
    // A scene's own pixel art ({ rows, palette }) as a canvas, built once per object.
    art: (a) => { if (!artCanvases.has(a)) artCanvases.set(a, gridCanvas(a.rows, a.palette)); return artCanvases.get(a); },
  };
```

`reel/reel.js`, change 6. Find:

```js
    shot.scene.render(ctx, local, sceneFor(shot.scene), env);
```

Replace with:

```js
    shot.scene.render(ctx, local, sceneFor(shot.scene), env, shot);
    const fade = showingPoster ? 0 : fadeAlpha(shot, local);
    if (fade > 0) {
      ctx.globalAlpha = fade;
      ctx.fillStyle = '#0b0b0c';
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
```

`reel/sprites.js`, change 1. Find:

```js
// A sprite ({ frames, palette, anchorX, footY }) as canvases, ready for drawImage.
```

Replace with:

```js
// A sprite ({ frames, palette, ...placement such as anchorX, footY, seatY }) as canvases.
```

`reel/sprites.js`, change 2. Find:

```js
  return { canvases: sprite.frames.map(f => gridCanvas(f, sprite.palette)), anchorX: sprite.anchorX, footY: sprite.footY };
```

Replace with:

```js
  const { frames, palette, ...placement } = sprite;
  return { ...placement, canvases: frames.map(f => gridCanvas(f, palette)) };
```

- [ ] **Step 4: Run the unit tests and the page checks**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 54`, `ℹ fail 0`, then 15 `ok` lines and exit 0. Phase 1 behaviour is unchanged.

- [ ] **Step 5: Commit**

```bash
git add reel/timeline.js reel/reel.js reel/sprites.js tests/reel/timeline.test.js
git commit -m "feat(reel): Add shot fades and serve scene art and poses to renderers"
```

---

### Task 2: A 3×5 pixel font

**Files:**
- Modify: `reel/pixels.js` (append)
- Test: `tests/reel/pixels.test.js` (append)

**Interfaces:**
- Produces: `textRows(str) → string[5]`, rows of `'#'` (ink) and `'.'` with 1 px between glyphs. It covers A–Z, 0–9 and `: . / - '` plus space; other characters render blank, and the input is upper-cased.

- [ ] **Step 1: Write the failing test.** Append to `tests/reel/pixels.test.js`:

```js
test('textRows draws 3x5 glyphs with 1px gaps, upper-casing input', async () => {
  const { textRows } = await import('../../reel/pixels.js');
  assert.deepEqual(textRows('i1'), ['###..#.', '.#..##.', '.#...#.', '.#...#.', '###.###']);
  assert.deepEqual(textRows('?'), ['...', '...', '...', '...', '...'], 'unknown characters are blank');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test 'tests/reel/pixels.test.js'`
Expected: 1 failure (`TypeError: textRows is not a function`).

- [ ] **Step 3: Implement.** Append to the end of `reel/pixels.js`:

```js
// 3x5 pixel font for in-world text: stamps, counters, signs. Unknown characters render blank.
const GLYPHS = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'], K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#.#', '###', '###', '#.#', '#.#'], N: ['##.', '#.#', '#.#', '#.#', '#.#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'], Q: ['.#.', '#.#', '#.#', '##.', '.##'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'], U: ['#.#', '#.#', '#.#', '#.#', '###'],
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'], W: ['#.#', '#.#', '###', '###', '#.#'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
  0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'],
  3: ['##.', '..#', '.#.', '..#', '##.'], 4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'],
  6: ['.##', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'], 8: ['###', '#.#', '###', '#.#', '###'],
  9: ['###', '#.#', '###', '..#', '##.'],
  ':': ['...', '.#.', '...', '.#.', '...'], '.': ['...', '...', '...', '...', '.#.'], '/': ['..#', '..#', '.#.', '#..', '#..'],
  '-': ['...', '...', '###', '...', '...'], "'": ['.#.', '.#.', '...', '...', '...'], ' ': ['...', '...', '...', '...', '...'],
};

// Text as 5 rows of '#' (ink) and '.', with 1px between letters. Lower case is drawn as upper.
export function textRows(str) {
  const rows = ['', '', '', '', ''];
  [...str.toUpperCase()].forEach((ch, i) => {
    const g = GLYPHS[ch] || GLYPHS[' '];
    for (let y = 0; y < 5; y++) rows[y] += (i ? '.' : '') + g[y];
  });
  return rows;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test 'tests/reel/pixels.test.js'`
Expected: `ℹ pass 12`, `ℹ fail 0`.

- [ ] **Step 5: Commit**

```bash
git add reel/pixels.js tests/reel/pixels.test.js
git commit -m "feat(reel): Add a 3x5 pixel font for in-world text"
```

---

### Task 3: The sit pose

**Files:**
- Modify: `reel/hero.js`
- Test: `tests/reel/hero.test.js` (append)

**Interfaces:**
- Produces: `heroSprite(key, pose = 'walk')`. `'walk'` returns the same 4 frames as before; `'sit'` returns 2 frames whose shins swing. Both carry `seatY: 38` (`SEAT_Y`): the outline row under the thighs, which rests on the ledge, so a scene draws at `y = surfaceRow - 1 - seatY`. Unknown poses throw `unknown pose: <pose>`.

- [ ] **Step 1: Write the failing test.** Append to `tests/reel/hero.test.js`:

```js
test('the sit pose has two swinging frames and a seat row', () => {
  const s = heroSprite('trolltunga', 'sit');
  assert.equal(s.frames.length, 2);
  assert.equal(s.seatY, 38);
  assert.notDeepEqual(s.frames[0], s.frames[1]);
  assert.deepEqual([s.width, s.height, s.anchorX], [42, 50, 9]);
  // below the seat row only the dangling shins and shoes remain
  const below = s.frames[0].slice(s.seatY + 1).join('');
  assert.match(below, /O/, 'the shoes hang below the seat');
  assert.doesNotMatch(below, /[BbrTSsH]/, 'nothing but legs below the seat');
});

test('unknown poses fail loudly', () => {
  assert.throws(() => heroSprite('work', 'cartwheel'), /unknown pose: cartwheel/);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test 'tests/reel/hero.test.js'`
Expected: 2 failures (the sit pose returns 4 walk frames; `cartwheel` does not throw).

- [ ] **Step 3: Implement.** Apply these replacements to `reel/hero.js`:

`reel/hero.js`, change 1. Find:

```js
...OOOO......OOOOO..
`,
```

Replace with:

```js
...OOOO......OOOOO..
`,
  // seated on a ledge, legs dangling over its edge; two frames swing the shins
  sitA: `
......ppPPPPPPPP....
......ppPPPPPPPl....
............pPPl....
............pPPl....
............pPPl....
...........OOOnO....
...........OOOOOO...
`,
  sitB: `
......ppPPPPPPPP....
......ppPPPPPPPl....
............pPPl....
.............pPPl...
.............pPPl...
............OOOnO...
............OOOOOO..
`,
```

`reel/hero.js`, change 2. Find:

```js
// The walk cycle: [legs, arm, bob]. Contact frames sit 1px lower.
const WALK = [['near', 'back', 1], ['pass', 'mid', 0], ['far', 'fwd', 1], ['pass', 'mid', 0]];
```

Replace with:

```js
// Poses as frame lists of [legs, arm, bob]. Walk contact frames sit 1px lower.
const POSES = {
  walk: [['near', 'back', 1], ['pass', 'mid', 0], ['far', 'fwd', 1], ['pass', 'mid', 0]],
  sit: [['sitA', 'mid', 0], ['sitB', 'mid', 0]],
};
export const SEAT_Y = 38;             // sit pose: the outline row under the thighs rests on the ledge
```

`reel/hero.js`, change 3. Find:

```js
// The 4-frame walk cycle for one outfit, plus what the engine needs to place it.
export function heroSprite(key) {
```

Replace with:

```js
// One outfit in one pose ('walk': 4 frames, 'sit': 2), plus what the engine needs to place it.
export function heroSprite(key, pose = 'walk') {
```

`reel/hero.js`, change 4. Find:

```js
  return { frames: WALK.map(pose => frame(o, pose)), palette: palette(o), width: SPRITE_W, height: SPRITE_H, anchorX: ANCHOR_X, footY: FOOT_Y };
```

Replace with:

```js
  if (!POSES[pose]) throw new Error(`unknown pose: ${pose}`);
  return { frames: POSES[pose].map(p => frame(o, p)), palette: palette(o), width: SPRITE_W, height: SPRITE_H, anchorX: ANCHOR_X, footY: FOOT_Y, seatY: SEAT_Y };
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test 'tests/reel/hero.test.js'`
Expected: `ℹ pass 24`, `ℹ fail 0`. All 19 walking goldens are still pixel-identical.

- [ ] **Step 5: Commit**

```bash
git add reel/hero.js tests/reel/hero.test.js
git commit -m "feat(reel): Add a sit pose with dangling legs"
```

---

### Task 4: Scene kit and canvas test doubles

**Files:**
- Create: `reel/kit.js`, `tests/reel/fake-canvas.js`
- Test: `tests/reel/kit.test.js`

**Interfaces:**
- Consumes: `Painter`, `Grid`, `parseRows`, `bandColor` and `textRows` from `pixels.js`.
- Produces:
  - `tile(ctx, img, off, y = 0)`: a horizontally wrapping layer, scrolled left by `off`, drawn twice.
  - `gradient(w, h, stops) → Painter`.
  - `art(grid, palette, outlineHex = null) → { rows, palette, w, h }`. The `k` character is reserved for the generated outline.
  - `label(str, ink) → { rows, palette: { '#': ink }, w, h: 5 }`.
  - `ridge(TW, base, [[amp, wholeFreq, phase]…]) → number[TW]`, seamless across `TW`.
  - `drawHero(ctx, hero, frame, x, groundY)`.
  - Test doubles:
    - `Recorder`, a 2D context that records `drawImage` as `[name, dx, dy]`; read them back with `.draws(name)`.
    - `fakeCanvases(scene)`.
    - `fakeEnv()`, whose sprites are named `"<key>:<pose>:<frame>"` and whose art is named `'art'`.
    - `sceneContract(name, scene, duration)`, which registers two tests: the layers are deterministic `Painter`s at widths 195, 480 and 640, and `render` runs every 0.1 s without throwing.
    - `frameAt(scene, W, t) → { ctx, s }`.

- [ ] **Step 1: Create the test doubles.** Create `tests/reel/fake-canvas.js`:

```js
// Test doubles for the DOM side of rendering: a recording 2D context, named fake canvases,
// and the contract every scene keeps.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Painter } from '../../reel/pixels.js';

export class Recorder {
  constructor() { this.calls = []; this.fillStyle = null; this.globalAlpha = 1; }
  drawImage(img, ...a) {
    const [dx, dy] = a.length >= 8 ? [a[4], a[5]] : [a[0], a[1]];   // 3-, 5- or 9-argument form
    this.calls.push(['drawImage', img.name, dx, dy]);
  }
  fillRect(...a) { this.calls.push(['fillRect', ...a]); }
  clearRect() {}
  save() {} restore() {} beginPath() {} rect() {} clip() {} translate() {} scale() {}
  draws(name) { return this.calls.filter(c => c[0] === 'drawImage' && c[1] === name).map(c => [c[2], c[3]]); }
}

// Turn a scene's Painter layers into fake canvases that keep their name and size.
export function fakeCanvases(scene) {
  scene.canvases = Object.fromEntries(Object.entries(scene.layers).map(([k, p]) => [k, { name: k, width: p.w, height: p.h }]));
  return scene;
}

// An env whose sprites are named "<key>:<pose>:<frame>" so tests can see what was drawn.
export function fakeEnv() {
  const sprite = (id, n, extra) => ({ canvases: Array.from({ length: n }, (_, i) => ({ name: `${id}:${i}`, width: 42, height: 50 })), ...extra });
  return {
    hero: (key, pose = 'walk') => sprite(`${key}:${pose}`, pose === 'sit' ? 2 : 4, { anchorX: 9, footY: 44, seatY: 38 }),
    dog: (key) => sprite(`dog:${key}`, 4, { anchorX: 0, footY: 15 }),
    art: (a) => ({ name: 'art', width: a.w, height: a.h }),
  };
}

// The contract every scene keeps: deterministic Painter layers at phone, desktop and wide widths,
// and a render that runs for the whole shot without throwing.

const WIDTHS = [195, 480, 640];
const sha = (d) => createHash('sha256').update(d).digest('hex');

export function sceneContract(name, scene, duration) {
  test(`${name} builds the same Painter layers every time, at every width`, () => {
    for (const W of WIDTHS) {
      const a = scene.build(W, 96), b = scene.build(W, 96);
      assert.ok(Object.keys(a.layers).length > 0);
      for (const [k, p] of Object.entries(a.layers)) {
        assert.ok(p instanceof Painter, `${k} is a Painter`);
        assert.equal(sha(p.data), sha(b.layers[k].data), `${k} is deterministic at W=${W}`);
      }
    }
  });
  test(`${name} renders through the whole shot without throwing`, () => {
    for (const W of WIDTHS) {
      const s = fakeCanvases(scene.build(W, 96)), env = fakeEnv();
      for (let t = 0; t < duration; t += 0.1) {
        const ctx = new Recorder();
        scene.render(ctx, t, s, env);
        assert.ok(ctx.calls.length > 0);
      }
    }
  });
}

// Render one frame of a scene into a Recorder.
export function frameAt(scene, W, t) {
  const s = fakeCanvases(scene.build(W, 96)), ctx = new Recorder();
  scene.render(ctx, t, s, fakeEnv());
  return { ctx, s };
}
```

- [ ] **Step 2: Write the failing test.** Create `tests/reel/kit.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tile, gradient, art, label, ridge, drawHero } from '../../reel/kit.js';
import { Recorder } from './fake-canvas.js';

test('tile draws a wrapped layer twice so it always covers the view', () => {
  const img = { name: 'L', width: 100 };
  const a = new Recorder();
  tile(a, img, 130, 5);
  assert.deepEqual(a.draws('L'), [[-30, 5], [70, 5]]);
  const b = new Recorder();
  tile(b, img, -10);
  assert.deepEqual(b.draws('L'), [[-90, 0], [10, 0]], 'negative offsets wrap too');
});

test('gradient paints every pixel opaque, top band first', () => {
  const p = gradient(4, 10, [['#000000', 0], ['#ffffff', 0.5]]);
  assert.equal(p.w, 4); assert.equal(p.h, 10);
  assert.ok([...p.data].filter((_, i) => i % 4 === 3).every(a => a === 255));
  assert.deepEqual([...p.data.slice(0, 3)], [0, 0, 0]);
});

test('art adds a generated outline ring and its colour', () => {
  const a = art('A', { A: '#111111' }, '#222222');
  assert.deepEqual(a.rows, ['.k.', 'kAk', '.k.']);
  assert.equal(a.palette.k, '#222222');
  assert.deepEqual([a.w, a.h], [3, 3]);
});

test('label renders 3x5 text in one ink', () => {
  const l = label('HI', '#ffffff');
  assert.equal(l.h, 5); assert.equal(l.w, 7);
  assert.equal(l.palette['#'], '#ffffff');
});

test('ridge is seamless across its tile width', () => {
  const r = ridge(200, 10, [[3, 2, 0.4], [1, 5, 1.1]]);
  assert.equal(r.length, 200);
  assert.ok(Math.abs(r[0] - (10 + 3 * Math.sin(0.4) + Math.sin(1.1))) < 1e-9);
  const next = 10 + 3 * Math.sin(2 * Math.PI * 2 + 0.4) + Math.sin(2 * Math.PI * 5 + 1.1);   // x = 200 wraps to x = 0
  assert.ok(Math.abs(next - r[0]) < 1e-9);
});

test('drawHero places the character by its left edge and ground row', () => {
  const ctx = new Recorder();
  drawHero(ctx, { canvases: [{ name: 'f0' }, { name: 'f1' }], anchorX: 9, footY: 44 }, 3, 100.4, 88);
  assert.deepEqual(ctx.draws('f1'), [[91, 44]]);
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `node --test 'tests/reel/kit.test.js'`
Expected: FAIL, with `Cannot find module '…/reel/kit.js'`.

- [ ] **Step 4: Implement.** Create `reel/kit.js`:

```js
// Small helpers every scene uses. Pure, except tile(), which only calls ctx.drawImage.
import { Painter, Grid, parseRows, bandColor, textRows } from './pixels.js';

// Draw a horizontally tiling layer (at least as wide as the view), scrolled left by `off` px.
export function tile(ctx, img, off, y = 0) {
  const w = img.width, o = ((Math.round(off) % w) + w) % w;
  ctx.drawImage(img, -o, y);
  ctx.drawImage(img, w - o, y);
}

// A w x h vertical banded gradient, dithered at each boundary.
export function gradient(w, h, stops) {
  const p = new Painter(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, bandColor(stops, j / Math.max(1, h - 1), i, j));
  return p;
}

// Scene pixel art: a fill-only grid plus palette, optionally with a generated 1px outline.
// Returns { rows, palette, w, h }; env.art() turns it into a canvas.
export function art(grid, palette, outline = null) {
  const rows = parseRows(grid), pad = outline ? 1 : 0;
  const g = new Grid(rows[0].length + 2 * pad, rows.length + 2 * pad);
  g.stamp(rows, pad, pad, outline ? { outline: 'k' } : {});
  return { rows: g.rows(), palette: outline ? { ...palette, k: outline } : palette, w: g.w, h: g.h };
}

// One line of 3x5 text as pixel art in a single ink colour.
export function label(str, ink) {
  const rows = textRows(str);
  return { rows, palette: { '#': ink }, w: rows[0].length, h: 5 };
}

// Seamless ridge profile over a tile width: base + sum of sines whose frequencies are whole numbers.
export function ridge(TW, base, waves) {
  return Array.from({ length: TW }, (_, x) => base + waves.reduce((s, [a, f, ph]) => s + a * Math.sin((x / TW) * Math.PI * 2 * f + ph), 0));
}

// Where a walking hero stands: x is the character's left edge, groundY the row its shoes rest on.
export function drawHero(ctx, hero, frame, x, groundY) {
  ctx.drawImage(hero.canvases[frame % hero.canvases.length], Math.round(x) - hero.anchorX, Math.round(groundY) - hero.footY);
}
```

- [ ] **Step 5: Run the unit tests and the page checks**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 63`, `ℹ fail 0`, 15 `ok` lines, exit 0.

- [ ] **Step 6: Commit**

```bash
git add reel/kit.js tests/reel/fake-canvas.js tests/reel/kit.test.js
git commit -m "feat(reel): Add the scene kit and canvas test doubles"
```

---

### Task 5: Sheffield, and chapter 1 goes live

**Files:**
- Create: `reel/ch1/sheffield.js`, `reel/ch1/index.js`, `tests/reel/frames.mjs`, `tests/reel/sheet.py`
- Modify: `reel/story.js`
- Test: `tests/reel/ch1-sheffield.test.js`

**Interfaces:**
- Consumes:
  - From `kit.js`: `tile`, `gradient`, `ridge`, `drawHero` and `art`.
  - From `pixels.js`: `Painter` and `rng`.
  - `env.hero('sheffield')` and `env.art`.
- Produces:
  - `sheffield` (a scene); its built scene exposes `phoneX` and `lampEvery`.
  - `CHAPTER_1 = { name: 'Sheffield', shots: [...] }`; later tasks append shots.
  - Yimeng walks at x = `round(0.34 W)` with shoes on row 88.

- [ ] **Step 1: Write the failing test.** Create `tests/reel/ch1-sheffield.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { sheffield } from '../../reel/ch1/sheffield.js';

sceneContract('ch1 Sheffield', sheffield, 3);

test('Sheffield: Yimeng walks under the umbrella at a third of the width', () => {
  assert.deepEqual(frameAt(sheffield, 480, 1).ctx.draws('sheffield:walk:2'), [[163 - 9, 88 - 44]]);
});

test('Sheffield: the red phone box and Firth Court come into view ahead', () => {
  const { ctx, s } = frameAt(sheffield, 480, 0);
  assert.ok(s.phoneX > 163, 'the phone box starts ahead of Yimeng');
  assert.equal(ctx.draws('art').length > 0, true, 'lamps and the phone box are drawn');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test 'tests/reel/ch1-sheffield.test.js'`
Expected: FAIL, with `Cannot find module '…/reel/ch1/sheffield.js'`.

- [ ] **Step 3: Implement the shot.** Create `reel/ch1/sheffield.js`:

```js
// Chapter 1, shot 1: Sheffield in drizzle. Red-brick terraces, Firth Court, a red phone box,
// Victorian street lamps, wet pavement; Yimeng walks under an umbrella.
import { Painter, rng } from '../pixels.js';
import { tile, gradient, ridge, drawHero, art } from '../kit.js';

const SPEED = 26;                      // walk speed at parallax 1, px/s
const GROUND = 88;                     // the row Yimeng's shoes rest on

const SKY = [['#56617a', 0], ['#66718a', 0.22], ['#7a8599', 0.45], ['#8e98a9', 0.68], ['#a3acb9', 0.88]];

const PHONE_BOX = art(`
..RRRRRR..
.RRRRRRRR.
RRrrrrrrRR
RRCCCCCCRR
RRRRRRRRRR
RGWGWGWGWR
RGWGWGWGWR
RGGGGGGGGR
RGWGWGWGWR
RGWGWGWGWR
RGGGGGGGGR
RGWGWGWGWR
RGWGWGWGWR
RGGGGGGGGR
RGWGWGWGWR
RGWGWGWGWR
RRRRRRRRRR
RRRRRRRRRR
RRRRRRRRRR
RRRRRRRRRR
dddddddddd
`, { R: '#c4202c', r: '#e8414b', C: '#f2efe6', G: '#8f1820', W: '#3a4352', d: '#5a1218' }, '#2a1f2d');

const LAMP = art(`
.KK.
KYYK
KYYK
.KK.
..K.
..K.
..K.
..K.
..K.
..K.
..K.
..K.
..K.
..K.
..K.
..K.
..K.
..K.
..K.
..K.
.KKK
KKKK
`, { K: '#2e3a34', Y: '#f4d08a' });

function terraces(p, x0, x1, base) {
  // two-up two-down terraced houses, 22 px wide, alternating brick tones and door colours
  const DOORS = ['#2f4f3e', '#26365e', '#6b1f2a', '#2a2a30'];
  for (let n = 0, x = x0; x < x1; n++, x += 22) {
    const brick = n % 2 ? '#94473a' : '#9c4d3e', mortar = '#7d3a30';
    const top = base - 29;
    for (let j = top; j < base; j++) for (let i = x; i < x + 22; i++) p.wpx(i, j, (j - top) % 3 === 0 && (i + (j >> 1)) % 4 === 0 ? mortar : brick);
    for (let i = x - 1; i < x + 23; i++) p.wpx(i, top - 1, '#3e4250');          // slate roof edge
    for (let k = 0; k < 6; k++) for (let i = x + k; i < x + 22 - k; i++) p.wpx(i, top - 2 - k, k % 2 ? '#4a4f5c' : '#535866');
    p.rect(x + 16, top - 11, 3, 6, '#7a3d32'); p.rect(x + 16, top - 12, 1, 1, '#b46a4a'); p.rect(x + 18, top - 12, 1, 1, '#b46a4a');
    for (const [wx, wy] of [[x + 3, top + 4], [x + 13, top + 4], [x + 13, top + 16]]) {
      p.rect(wx - 1, wy - 1, 7, 9, '#e8e4dc');                                    // sash frame
      p.rect(wx, wy, 5, 7, '#2f3646');
      p.rect(wx, wy + 3, 5, 1, '#e8e4dc');
      p.wpx(wx + 1, wy + 1, '#59637a');
    }
    p.rect(x + 3, top + 15, 6, 14, '#e8e4dc'); p.rect(x + 4, top + 16, 4, 13, DOORS[n % 4]);
    p.wpx(x + 7, top + 23, '#d9b45a');
  }
}

function tree(p, cx, base, r) {
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
    const d = i * i + j * j * 1.3;
    if (d <= r * r) p.wpx(cx + i, base - 9 - r + j, d > (r - 1.5) * (r - 1.5) && j > 0 ? '#3f5a3a' : ((i + j) % 3 === 0 ? '#5d7d4e' : '#4e6b44'));
  }
  p.rect(cx - 1, base - 9, 2, 9, '#4a3a2c');
}

function firthCourt(p, x, base) {
  // the University of Sheffield's Firth Court: red brick, stone bands, arched windows, clock tower
  const W = 66, top = base - 40;
  for (let j = top; j < base; j++) for (let i = x; i < x + W; i++) p.wpx(i, j, (j - top) % 3 === 0 && (i + (j >> 1)) % 4 === 0 ? '#86392d' : '#a5483a');
  for (const y of [top, top + 13, top + 26]) p.rect(x, y, W, 1, '#d9cdb5');           // stone string courses
  for (let k = 0; k < 7; k++) for (let i = x - 1 + k; i < x + W + 1 - k; i++) p.wpx(i, top - 1 - k, k % 2 ? '#4a4f5c' : '#535866');
  for (let col = 0; col < 10; col++) {                                                 // arched windows, three floors
    const wx = x + 3 + col * 6 + (col >= 5 ? 4 : 0);
    if (col === 4 || col === 5) continue;                                              // tower bay
    for (const wy of [top + 3, top + 16, top + 29]) {
      p.rect(wx, wy + 1, 3, 7, '#2f3646'); p.wpx(wx + 1, wy, '#2f3646');
      p.rect(wx - 1, wy + 8, 5, 1, '#d9cdb5'); p.wpx(wx + 1, wy + 2, '#59637a');
    }
  }
  const tx = x + 27, tw = 12, ttop = top - 20;                                         // tower
  for (let j = ttop; j < base; j++) for (let i = tx; i < tx + tw; i++) p.wpx(i, j, (j - ttop) % 3 === 0 && i % 4 === 0 ? '#86392d' : '#a5483a');
  p.rect(tx - 1, ttop, tw + 2, 2, '#d9cdb5'); p.rect(tx - 1, top - 8, tw + 2, 1, '#d9cdb5');
  for (let k = 0; k < 9; k++) for (let i = tx - 1 + Math.ceil(k * 0.75); i < tx + tw + 1 - Math.ceil(k * 0.75); i++) p.wpx(i, ttop - 1 - k, k % 2 ? '#3e4250' : '#4a4f5c');
  p.wpx(tx + 6, ttop - 11, '#c9a14a'); p.wpx(tx + 6, ttop - 12, '#c9a14a');
  for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (i * i + j * j <= 5) p.wpx(tx + 6 + i, ttop + 6 + j, '#efe8d6');
  p.wpx(tx + 6, ttop + 5, '#2a2a30'); p.wpx(tx + 6, ttop + 6, '#2a2a30'); p.wpx(tx + 7, ttop + 6, '#2a2a30');
  p.rect(tx + 4, ttop + 11, 4, 8, '#2f3646'); p.wpx(tx + 5, ttop + 10, '#2f3646'); p.wpx(tx + 6, ttop + 10, '#2f3646');
  p.rect(tx + 3, base - 12, 6, 12, '#d9cdb5'); p.rect(tx + 4, base - 11, 4, 11, '#3a2a22');  // stone doorway
}

export function buildSheffield(W, H = 96) {
  const TW = W * 2, layers = {};
  layers.sky = gradient(W, 80, SKY);

  const cl = new Painter(TW, 60);                                       // low rain clouds (0.04)
  const rc = rng(31);
  for (let n = 0; n < 14; n++) {
    const cx = rc() * TW, cy = 4 + rc() * 34, len = 30 + rc() * 70;
    for (let x = 0; x < len; x++) cl.wpx(cx + x, cy, rc() < 0.5 ? '#5f6a80' : '#68738a');
    for (let x = 6; x < len - 6; x++) cl.wpx(cx + x, cy + 1, '#a0a9b6');
  }
  layers.clouds = cl;

  const hills = new Painter(TW, 80);                                    // Peak District moors (0.12)
  const h1 = ridge(TW, 14, [[4, 2, 0.3], [2, 5, 1.2], [1, 11, 0.4]]);
  const h2 = ridge(TW, 8, [[3, 3, 2.1], [1.5, 7, 0.2]]);
  for (let i = 0; i < TW; i++) {
    for (let j = 0; j < h1[i] + 30; j++) hills.px(i, 79 - j, j > h1[i] + 28.5 ? '#8a947f' : '#727c6a');
    for (let j = 0; j < h2[i] + 26; j++) hills.px(i, 79 - j, j > h2[i] + 24.5 ? '#6f7766' : '#5f6858');
  }
  layers.hills = hills;

  const st = new Painter(TW, H);                                        // street front (0.5)
  const fc = Math.round(W * 0.45);
  terraces(st, fc + 80, fc + TW - 14, 79);
  tree(st, fc - 7, 79, 7);
  firthCourt(st, fc, 79);
  tree(st, fc + 73, 79, 7);
  layers.street = st;

  const pv = new Painter(TW, H);                                        // pavement and road (1.0)
  for (let j = 79; j < H; j++) for (let i = 0; i < TW; i++) {
    let c = j < 82 ? '#8a8f98' : j < 89 ? ((i + (j - 82) * 0) % 14 === 0 ? '#6f747d' : '#7d828c') : j < 91 ? '#5d626b' : '#3e434d';
    if (j === 79) c = '#9aa0a9';
    if (j >= 82 && j < 89 && (j - 82) % 4 === 3) c = '#6f747d';
    if (j >= 91 && (i * 13 + j * 7) % 29 === 0) c = '#6b7280';           // wet road glints
    pv.px(i, j, c);
  }
  const rp = rng(9);
  for (let n = 0; n < 9; n++) {                                         // puddles on the pavement
    const x = rp() * TW, y = 84 + Math.floor(rp() * 4), len = 6 + rp() * 10;
    for (let k = 0; k < len; k++) pv.wpx(x + k, y, k % 3 ? '#9ba6b8' : '#b9c3d1');
  }
  layers.pavement = pv;
  return { W, H, TW, layers, phoneX: Math.round(W * 0.34) + 74, lampEvery: 96 };
}

export function renderSheffield(ctx, t, s, env) {
  const { W, H, canvases: c } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  tile(ctx, c.clouds, t * SPEED * 0.04, 0);
  tile(ctx, c.hills, t * SPEED * 0.12, 0);
  tile(ctx, c.street, t * SPEED * 0.5, 0);
  const off = t * SPEED;
  tile(ctx, c.pavement, off, 0);
  const lamp = env.art(LAMP);
  for (let x = 20 - (off % s.lampEvery); x < W + 10; x += s.lampEvery) ctx.drawImage(lamp, Math.round(x), 80 - lamp.height);
  const box = env.art(PHONE_BOX);
  ctx.drawImage(box, Math.round(s.phoneX - off), 81 - box.height);
  drawHero(ctx, env.hero('sheffield'), Math.floor(t * 6), Math.round(W * 0.34), GROUND);
  // drizzle: thin streaks slanting left, in front of everything
  ctx.fillStyle = 'rgba(205, 216, 230, 0.45)';
  const rr = rng(77);
  for (let n = 0; n < 90; n++) {
    const x0 = rr() * (W + 40), y0 = rr() * H, v = 150 + rr() * 60;
    const y = (y0 + t * v) % (H + 6) - 6, x = ((x0 - t * (SPEED + 30) - y * 0.35) % (W + 40) + W + 40) % (W + 40) - 20;
    ctx.fillRect(Math.round(x), Math.round(y), 1, 3);
  }
}

export const sheffield = { build: buildSheffield, render: renderSheffield };
```

- [ ] **Step 4: Start the chapter.** Create `reel/ch1/index.js`:

```js
// Chapter 1: Sheffield, then a whirlwind through Europe.
import { sheffield } from './sheffield.js';

export const CHAPTER_1 = {
  name: 'Sheffield',
  shots: [
    { id: 'ch1-sheffield', scene: sheffield, caption: 'Sheffield', duration: 3, fadeIn: 0.4, fadeOut: 0.25 },
  ],
};
```

Then apply these replacements to `reel/story.js`:

`reel/story.js`, change 1. Find:

```js
import { beach } from './beach.js';
```

Replace with:

```js
import { beach } from './beach.js';
import { CHAPTER_1 } from './ch1/index.js';
```

`reel/story.js`, change 2. Find:

```js
  { name: 'Sheffield', shots: [standIn('ch1-sheffield', 'Sheffield', 4), standIn('ch1-europe', 'Europe', 4)] },
```

Replace with:

```js
  CHAPTER_1,
```

- [ ] **Step 5: Run the unit tests**

Run: `node --test 'tests/reel/*.test.js'`
Expected: `ℹ pass 67`, `ℹ fail 0`. Do not run `page-check.sh` yet: chapter 1 is 3 s long for now, so its time-based checks are off until Task 11.

- [ ] **Step 6: Add the review tools.** Create `tests/reel/frames.mjs`:

```js
// Grab the reel canvas at native resolution for a list of times (dev review tool).
//   node tests/reel/frames.mjs <page-url> <out-dir> --width 1440 --times 0.5,1.5 [--mobile]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [base, outDir, ...rest] = process.argv.slice(2);
const opt = { width: 1440, height: 900, times: [0], mobile: false };
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === '--width') opt.width = Number(rest[++i]);
  else if (rest[i] === '--times') opt.times = rest[++i].split(',').map(Number);
  else if (rest[i] === '--mobile') opt.mobile = true;
}
mkdirSync(outDir, { recursive: true });
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9900 + Math.floor(Math.random() * 90);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'reel-frames-'))}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
try {
  let target;
  for (let i = 0; i < 50 && !target; i++) { await sleep(100); try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page'); } catch {} }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });
  let id = 0; const pending = new Map(), waiters = [];
  ws.onmessage = (m) => { const msg = JSON.parse(m.data); if (msg.id) pending.get(msg.id)?.(msg); if (msg.method) waiters.filter(w => w.method === msg.method).forEach(w => w.res(msg.params)); };
  const send = (method, params = {}) => new Promise(res => { const n = ++id; pending.set(n, m => res(m.result)); ws.send(JSON.stringify({ id: n, method, params })); });
  const once = (method) => new Promise(res => waiters.push({ method, res }));
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: opt.width, height: opt.height, deviceScaleFactor: 1, mobile: opt.mobile });
  for (const t of opt.times) {
    const loaded = once('Page.loadEventFired');
    await send('Page.navigate', { url: `${base}?reel=${t}` });
    await loaded; await sleep(250);
    const r = await send('Runtime.evaluate', { expression: "document.querySelector('.reel-canvas').toDataURL()", returnByValue: true });
    const png = r.result.value.split(',')[1];
    writeFileSync(join(outDir, `t${t.toFixed(2)}.png`), Buffer.from(png, 'base64'));
  }
  console.log(`wrote ${opt.times.length} frames to ${outDir}`);
  ws.close();
} finally { chrome.kill(); }
```

Create `tests/reel/sheet.py`:

```python
"""Compose frames from frames.mjs into an enlarged contact sheet (dev review tool).

    python3 tests/reel/sheet.py <frames-dir> <out.png> [scale]
"""
import sys, glob, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
scale = int(sys.argv[3]) if len(sys.argv) > 3 else 2
files = sorted(glob.glob(os.path.join(d, 't*.png')), key=lambda f: float(os.path.basename(f)[1:-4]))
ims = [Image.open(f).convert('RGB') for f in files]
w = max(i.width for i in ims) * scale; h = ims[0].height * scale
sheet = Image.new('RGB', (w, (h + 18) * len(ims)), (20, 20, 24))
dr = ImageDraw.Draw(sheet)
for n, (f, im) in enumerate(zip(files, ims)):
    sheet.paste(im.resize((im.width * scale, im.height * scale), Image.NEAREST), (0, n * (h + 18) + 18))
    dr.text((4, n * (h + 18) + 3), os.path.basename(f)[1:-4] + 's', fill=(217, 163, 91))
sheet.save(out); print(out, sheet.size)
```

- [ ] **Step 7: Look at it.** With the server running (see "How to run things"):

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 0.6,1.5,2.8 && python3 tests/reel/sheet.py /tmp/f /tmp/f-sheffield.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 0.6,2.8 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-sheffield.png 3
```

Expected (open both PNGs):
- An overcast blue-grey sky and green-grey moors over a row of red-brick terraces.
- Firth Court, the University's red-brick building with three floors of arched windows and a clock tower with a slate spire, framed by two trees.
- A red phone box and Victorian lamps on the wet pavement.
- Slanting drizzle.
- Yimeng in the purple hoodie walking under a navy umbrella at a third of the width. On the phone, Firth Court fills most of the view.
- The first frame starts darkened (the loop fades in).

- [ ] **Step 8: Commit**

```bash
git add reel/ch1/sheffield.js reel/ch1/index.js reel/story.js tests/reel/ch1-sheffield.test.js tests/reel/frames.mjs tests/reel/sheet.py
git commit -m "feat(reel): Chapter 1 opens on Sheffield in the rain"
```

---

### Task 6: Across Europe by train

**Files:**
- Create: `reel/ch1/train.js`
- Modify: `reel/ch1/index.js`
- Test: `tests/reel/ch1-train.test.js`

**Interfaces:**
- Consumes:
  - From `kit.js`: `tile`, `gradient`, `ridge` and `label`.
  - From `pixels.js`: `Painter` and `rng`.
  - `env.hero('travel', 'sit')` (Task 3) and `env.art`.
- Produces:
  - `train` (a scene). The four cities run 1 s each, in the order Paris, Rome, Barcelona, Alps.
  - The landmark layers are `lm0` to `lm3`. The carriage is a layer with transparent window panes.
  - Nine passport stamps appear on a schedule.

- [ ] **Step 1: Write the failing test.** Create `tests/reel/ch1-train.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { train } from '../../reel/ch1/train.js';

sceneContract('ch1 train', train, 4);

test('the train: Yimeng sits by the window, rocking with the carriage', () => {
  const bob = Math.floor(0.2 * 7) % 2;
  assert.deepEqual(frameAt(train, 480, 0.2).ctx.draws('travel:sit:0'), [[163 - 9, 81 - 1 - 38 + bob]]);
});

test('the train: each second shows the next city and its landmark', () => {
  ['lm0', 'lm1', 'lm2', 'lm3'].forEach((lm, i) => assert.equal(frameAt(train, 480, i + 0.5).ctx.draws(lm).length, 1, `${lm} at ${i + 0.5}s`));
});

test('the train: passport stamps pile up, faster at the end', () => {
  const stamps = (t) => frameAt(train, 480, t).ctx.draws('art').length;
  assert.equal(stamps(0.05), 0);
  assert.equal(stamps(2.5), 3);
  assert.equal(stamps(3.9), 9);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test 'tests/reel/ch1-train.test.js'`
Expected: FAIL, with `Cannot find module '…/reel/ch1/train.js'`.

- [ ] **Step 3: Implement.** Create `reel/ch1/train.js`:

```js
// Chapter 1, shot 2: a train across Europe, seen from inside the carriage. Yimeng sits by the
// window while Paris, Rome, Barcelona and the Alps stream past behind, cut together by tunnels.
// Passport stamps pile up on the wall.
import { Painter, rng } from '../pixels.js';
import { tile, gradient, ridge, label } from '../kit.js';

const LEG = 1;                               // seconds per city
const WIN_TOP = 24, WIN_BOT = 63;            // window glass rows (outside shows through)
const SEAT = 81;                             // the seat cushion's top row
const CITIES = ['paris', 'rome', 'bcn', 'alps'];

const SKIES = {
  paris: [['#8fa7c4', 0], ['#a6bbd3', 0.35], ['#c3d2e2', 0.7], ['#dbe4ee', 0.92]],
  rome: [['#d9a978', 0], ['#e6bc8b', 0.35], ['#f0cf9f', 0.7], ['#f8e2bb', 0.92]],
  bcn: [['#4f97d6', 0], ['#6dabe0', 0.35], ['#93c3ea', 0.7], ['#bfdcf3', 0.92]],
  alps: [['#3f80cf', 0], ['#5b97da', 0.35], ['#86b4e6', 0.7], ['#c4dcf3', 0.92]],
};

// ---------- landmarks, each its own transparent Painter ----------
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

function colosseum() {
  const W = 64, H = 24, p = new Painter(W, H);
  const S = '#dcc7a2', d = '#b39a76', A = '#6e5c46';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ruin = x > 46 ? Math.min(12, (x - 46) * 0.9) : 0;             // the broken outer ring on the right
    if (y < ruin) continue;
    p.px(x, y, (y === 4 || y === 10 || y === 16) ? d : S);
  }
  for (let tier = 0; tier < 3; tier++) {                                // three tiers of arches
    const y0 = 5 + tier * 6;
    for (let x = 2; x < W - 2; x += 5) {
      const ruin = x > 46 ? Math.min(12, (x - 46) * 0.9) : 0;
      if (y0 < ruin) continue;
      for (let y = y0 + 1; y < y0 + 5; y++) for (let k = 0; k < 3; k++) if (!(y === y0 + 1 && k !== 1)) p.px(x + k, y, A);
    }
  }
  for (let x = 3; x < 44; x += 5) p.px(x, 2, A);                         // attic windows
  return p;
}

function sagrada() {
  const W = 44, H = 40, p = new Painter(W, H);
  const S = '#cfac7c', d = '#9c7c56', tips = ['#e8c23a', '#c8402e', '#4f9a4a', '#e8c23a'];
  for (let y = 22; y < H; y++) for (let x = 2; x < 30; x++) p.px(x, y, (x + y) % 4 === 0 ? d : S);   // nave
  [[4, 6], [10, 1], [16, 3], [22, 8]].forEach(([x0, top], i) => {     // four bell towers, tapering
    for (let y = top; y < 24; y++) {
      const w = 1 + (y - top) * 0.16;
      for (let x = Math.round(x0 + 2 - w); x <= Math.round(x0 + 2 + w); x++) p.px(x, y, (y % 3 === 0 && x === x0 + 2) ? d : S);
    }
    p.px(x0 + 2, top - 1, tips[i]); p.px(x0 + 2, top - 2, tips[i]);
  });
  for (let y = 4; y < H; y++) p.px(37, y, '#e0b020');                   // the ever-present crane
  for (let x = 30; x < 44; x++) p.px(x, 4, '#e0b020');
  p.px(31, 5, '#e0b020'); p.px(31, 6, '#555'); p.px(31, 7, '#555');
  return p;
}

function matterhorn() {
  const W = 70, H = 46, p = new Painter(W, H);
  for (let y = 0; y < H; y++) {
    const l = 30 - y * 0.75, r = 34 + y * 0.62 + (y > 20 ? (y - 20) * 0.3 : 0);
    for (let x = Math.max(0, Math.round(l)); x <= Math.min(W - 1, Math.round(r)); x++) {
      const snow = y < 14 || (y < 30 && (x * 3 + y * 5) % 7 < 3 - (y - 14) / 8);
      p.px(x, y, snow ? (x < 32 ? '#f4f7fa' : '#d4dde6') : (x < 32 ? '#6f7f93' : '#5a6a7e'));
    }
  }
  return p;
}

function chalet() {
  const p = new Painter(16, 14);
  for (let y = 0; y < 5; y++) for (let x = 7 - y * 1.6; x <= 8 + y * 1.6; x++) p.px(x, y, '#7a3a28');
  for (let y = 5; y < 14; y++) for (let x = 1; x < 15; x++) p.px(x, y, (y === 5) ? '#5a2c1c' : '#b8875a');
  for (const [x, y] of [[3, 7], [10, 7]]) p.rect(x, y, 3, 3, '#e9e2cf');
  p.rect(7, 9, 2, 5, '#4a2c1c');
  return p;
}

function swissFlag() {
  const p = new Painter(9, 14);
  for (let y = 0; y < 14; y++) p.px(0, y, '#4a4a50');
  for (let y = 0; y < 6; y++) for (let x = 1; x < 8; x++) p.px(x, y, '#d7262e');
  for (const [x, y] of [[4, 1], [4, 2], [4, 3], [4, 4], [2, 2.5], [3, 2.5], [5, 2.5], [6, 2.5]]) p.px(x, Math.round(y), '#ffffff');
  return p;
}

// ---------- the view out of the window, per city ----------
function cityFar(W, kind) {
  const TW = W * 2, far = new Painter(TW, 66), r = rng(kind.length * 17), base = 64;
  if (kind === 'paris') {
    for (let x = 0; x < TW; x += 19) {
      const h = 14 + Math.floor(r() * 5), top = base - h;
      far.rect(x, top, 18, h, '#e3d8c2');
      for (let k = 0; k < 4; k++) far.rect(x - 1 + k, top - 4 + k, 20 - 2 * k, 1, '#8a929c');
      for (let fy = top + 2; fy < base - 1; fy += 4) for (let fx = x + 2; fx < x + 17; fx += 4) { far.rect(fx, fy, 2, 2, '#5e6672'); far.rect(fx - 1, fy + 2, 4, 1, '#2a2a2e'); }
    }
  } else if (kind === 'rome') {
    for (let x = 0; x < TW; x += 16) {
      const h = 10 + Math.floor(r() * 6), top = base - h, col = r() < 0.5 ? '#d9965a' : '#c97b4f';
      far.rect(x, top, 15, h, col); far.rect(x - 1, top - 1, 17, 1, '#a4532f');
      for (let fy = top + 2; fy < base - 1; fy += 4) for (let fx = x + 2; fx < x + 13; fx += 4) far.rect(fx, fy, 2, 2, '#6e4b33');
    }
    for (let x = 6; x < TW; x += 41) {
      far.rect(x + 7, base - 16, 2, 16, '#5a4030');
      for (let j = 0; j < 5; j++) for (let i = -10 + j; i <= 10 - j; i++) far.wpx(x + 8 + i, base - 20 + j, j === 4 ? '#2f4a2a' : '#3e6234');
    }
  } else if (kind === 'bcn') {
    for (let x = 0; x < TW; x += 20) {
      const h = 11 + Math.floor(r() * 5), top = base - h;
      far.rect(x, top, 19, h, r() < 0.5 ? '#e8d2b0' : '#ddc3a0');
      for (let fy = top + 2; fy < base - 1; fy += 4) for (let fx = x + 2; fx < x + 18; fx += 4) far.rect(fx, fy, 2, 2, '#7a6a58');
    }
    for (let x = 0; x < TW; x += 29) {
      far.rect(x + 8, base - 22, 1, 22, '#6b5a40');
      for (const [dx, dy] of [[-6, 2], [-4, 0], [-2, -1], [0, -1], [2, -1], [4, 0], [6, 2], [-5, 3], [5, 3]]) far.wpx(x + 8 + dx, base - 23 + dy, '#3f7a3a');
    }
  } else {
    const peaks = ridge(TW, 26, [[8, 2, 0.4], [5, 5, 1.7], [2.5, 11, 0.2]]);
    for (let i = 0; i < TW; i++) for (let j = 0; j < peaks[i]; j++) far.px(i, base - j, j > peaks[i] - 6 ? '#eef2f6' : j > peaks[i] - 8 ? '#c9d4df' : '#7d8ea3');
    const meadow = ridge(TW, 8, [[2, 3, 1.1], [1, 9, 0.5]]);
    for (let i = 0; i < TW; i++) for (let j = 0; j < meadow[i]; j++) far.px(i, base - j, j > meadow[i] - 1.5 ? '#86b85e' : '#6c9f4c');
    for (let x = 4; x < TW; x += 19) for (let j = 0; j < 9; j++) for (let i = -Math.floor(j / 2); i <= Math.floor(j / 2); i++) far.wpx(x + i, base - 12 + j, '#2f5a3a');
  }
  return far;
}

function cityNear(W, kind) {
  // foreground scrub along the line, smeared by speed
  const TW = W * 2, p = new Painter(TW, 66), r = rng(kind.length * 5 + 3);
  const col = { paris: '#3f5a3a', rome: '#4a5f34', bcn: '#55703c', alps: '#2f5a3a' }[kind];
  for (let x = 0; x < TW; x++) {
    const h = 3 + Math.floor((Math.sin(x / 7) + 1) * 2 + r() * 2);
    for (let j = 0; j < h; j++) p.px(x, 65 - j, j === h - 1 ? '#6f8a55' : col);
  }
  return p;
}

// ---------- the carriage, with the windows cut out ----------
function carriage(W, H) {
  const p = new Painter(W, H), seatX = Math.round(W * 0.34);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = y < 20 ? '#e8e4da' : y < 66 ? '#d6d0c3' : y < 88 ? '#cbc4b5' : '#4a4f5c';
    if (y === 20 || y === 66) c = '#a9a294';
    if (y >= 88 && y === 88) c = '#6a707d';
    p.px(x, y, c);
  }
  for (let x = 0; x < W; x += 34) p.rect(x + 12, 8, 10, 2, '#fff6dc');      // ceiling lights
  const paneW = 58, pillar = 6;                                            // window panes
  for (let x0 = 4; x0 < W; x0 += paneW + pillar) {
    for (let y = WIN_TOP - 1; y <= WIN_BOT; y++) for (let x = x0 - 1; x <= x0 + paneW; x++) {
      const inside = y >= WIN_TOP && y < WIN_BOT && x >= x0 && x < x0 + paneW;
      if (x < 0 || x >= W) continue;
      if (inside) { const k = (y * W + x) * 4; p.data[k + 3] = 0; }
      else p.px(x, y, '#3a3a40');                                           // rubber frame
    }
  }
  for (let x = 0; x < W; x++) { p.px(x, WIN_BOT + 1, '#8a8f99'); p.px(x, WIN_BOT + 2, '#757a84'); }  // ledge
  for (let x = seatX + 2 - 52 * Math.ceil((seatX + 60) / 52); x < W + 60; x += 52) {   // seats, side on, one under Yimeng
    if (x + 18 < 0) continue;
    for (let y = 64; y < 88; y++) for (let k = 0; k < 6; k++) p.px(x - 6 + k, y, k === 0 ? '#20345e' : '#2f4f8f');   // backrest
    for (let y = SEAT; y < SEAT + 4; y++) for (let k = 0; k < 18; k++) p.px(x + k, y, y === SEAT ? '#4a6fb5' : '#2f4f8f');
    for (let y = SEAT + 4; y < 88; y++) p.px(x + 8, y, '#3a3f4a');
    for (let k = -3; k < 0; k++) p.px(x + k, 63, '#f4f1ea');               // headrest cover
  }
  return p;
}

// ---------- passport stamps ----------
const STAMPS = [
  ['PARIS', '#c0392b', 0.1], ['ROMA', '#2c5aa0', 1.1], ['BCN', '#7b3fa0', 2.1], ['ALPEN', '#2e8b57', 3.05],
  ['PRAHA', '#b0482c', 3.35], ['WIEN', '#2c6aa0', 3.48], ['AMS', '#a0522d', 3.58], ['MUC', '#3a7a3a', 3.66], ['BUD', '#8b3a6a', 3.73],
];
function stampArt(str, ink) {
  const t = label(str, ink), w = t.w + 6, h = 11;
  const rows = [];
  for (let y = 0; y < h; y++) {
    let r = '';
    for (let x = 0; x < w; x++) {
      const corner = (x === 0 || x === w - 1) && (y === 0 || y === h - 1);
      const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      const text = y >= 3 && y < 8 && x >= 3 && x < 3 + t.w && t.rows[y - 3][x - 3] === '#';
      r += corner ? '.' : edge || text ? '#' : '.';
    }
    rows.push(r);
  }
  return { rows, palette: { '#': ink }, w, h };
}
const STAMP_ART = STAMPS.map(([s, ink]) => stampArt(s, ink));

export function buildTrain(W, H = 96) {
  const layers = { carriage: carriage(W, H) };
  CITIES.forEach((k, i) => {
    layers[`sky${i}`] = gradient(W, 66, SKIES[k]);
    layers[`far${i}`] = cityFar(W, k);
    layers[`near${i}`] = cityNear(W, k);
  });
  Object.assign(layers, { lm0: eiffel(), lm1: colosseum(), lm2: sagrada(), lm3: matterhorn(), chalet: chalet(), flag: swissFlag() });
  return { W, H, layers };
}

export function renderTrain(ctx, t, s, env) {
  const { W, H, canvases: c } = s;
  const leg = Math.min(3, Math.floor(t / LEG)), lt = t - leg * LEG;
  ctx.clearRect(0, 0, W, H);
  // outside
  ctx.drawImage(c[`sky${leg}`], 0, 0);
  tile(ctx, c[`far${leg}`], lt * 70, 0);
  const lm = c[`lm${leg}`], lx = Math.round(W * 0.58 - lt * 46);
  ctx.drawImage(lm, lx, 64 - lm.height);
  if (leg === 3) { ctx.drawImage(c.chalet, lx + 52, 64 - c.chalet.height); ctx.drawImage(c.flag, lx + 46, 64 - c.flag.height); }
  tile(ctx, c[`near${leg}`], t * 380, 0);
  ctx.fillStyle = '#2a2d33';                                              // poles flicking past
  for (let x = W - ((t * 560) % 170); x > -4; x -= 170) ctx.fillRect(Math.round(x), WIN_TOP, 2, WIN_BOT - WIN_TOP);
  // tunnels between cities: the window goes black for a beat
  for (let k = 1; k <= 3; k++) {
    const a = Math.max(0, 1 - Math.abs(t - k * LEG) / 0.1);
    if (a > 0) { ctx.globalAlpha = a; ctx.fillStyle = '#0b0b0c'; ctx.fillRect(0, WIN_TOP, W, WIN_BOT - WIN_TOP); ctx.globalAlpha = 1; }
  }
  // inside: the carriage rocks on the rail joints
  const bob = Math.floor(t * 7) % 2;
  ctx.drawImage(c.carriage, 0, bob);
  const hero = env.hero('travel', 'sit');
  ctx.drawImage(hero.canvases[0], Math.round(W * 0.34) - hero.anchorX, SEAT - 1 - hero.seatY + bob);
  // passport stamps collect on the wall to the right
  STAMPS.forEach(([, , at], i) => {
    if (t < at) return;
    const col = i % 3, row = Math.floor(i / 3);
    ctx.globalAlpha = 0.88;
    ctx.drawImage(env.art(STAMP_ART[i]), W - 88 + col * 27 + (row % 2) * 5, 67 + row * 7 + (i % 2) + bob);
    ctx.globalAlpha = 1;
  });
}

export const train = { build: buildTrain, render: renderTrain };
```

- [ ] **Step 4: Add the shot.** Replace `reel/ch1/index.js` with:

```js
// Chapter 1: Sheffield, then a whirlwind through Europe.
import { sheffield } from './sheffield.js';
import { train } from './train.js';

export const CHAPTER_1 = {
  name: 'Sheffield',
  shots: [
    { id: 'ch1-sheffield', scene: sheffield, caption: 'Sheffield', duration: 3, fadeIn: 0.4, fadeOut: 0.25 },
    { id: 'ch1-train', scene: train, caption: 'Europe', duration: 4, fadeIn: 0.2, fadeOut: 0.2 },
  ],
};
```

- [ ] **Step 5: Run the unit tests**

Run: `node --test 'tests/reel/*.test.js'`
Expected: `ℹ pass 72`, `ℹ fail 0`.

- [ ] **Step 6: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 3.5,4.5,5.5,6.8 && python3 tests/reel/sheet.py /tmp/f /tmp/f-train.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 4.5,6.8 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-train.png 3
```

Expected:
- The inside of a carriage: cream wall, a row of window panes, blue seats side on.
- Yimeng in the denim jacket sits on the seat at a third of the width, head against the window.
- The window shows the cities in turn, each about a second, with a black tunnel flash between them:
  - Paris: zinc roofs and the Eiffel Tower.
  - Rome: ochre houses, umbrella pines and the Colosseum.
  - Barcelona: blocks, palms, the Sagrada Família and its yellow crane.
  - The Alps: snowy ridges, the Matterhorn, a chalet with a Swiss flag.
- Ink stamps collect on the wall at the right: PARIS, ROMA, BCN, then a rapid burst at the end.

- [ ] **Step 7: Commit**

```bash
git add reel/ch1/train.js reel/ch1/index.js tests/reel/ch1-train.test.js
git commit -m "feat(reel): Ride a train past Paris, Rome, Barcelona and the Alps"
```

---

### Task 7: Lisbon's 28 tram

**Files:**
- Create: `reel/ch1/lisbon.js`
- Modify: `reel/ch1/index.js`
- Test: `tests/reel/ch1-lisbon.test.js`

**Interfaces:**
- Consumes:
  - From `kit.js`: `gradient` and `label`.
  - From `pixels.js`: `Painter` and `rng`.
  - `env.hero('travel')`.
- Produces:
  - `lisbon` (a scene). The street is one world strip that the camera climbs at slope 0.2, 34 px/s.
  - The tram is drawn column by column, sheared onto the slope, with Yimeng's window left open.

- [ ] **Step 1: Write the failing test.** Create `tests/reel/ch1-lisbon.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { lisbon } from '../../reel/ch1/lisbon.js';

sceneContract('ch1 Lisbon', lisbon, 2);

test('Lisbon: Yimeng rides in the tram window while the street slides down the hill', () => {
  assert.equal(frameAt(lisbon, 480, 1).ctx.draws('travel:walk:1').length, 1);
  const y = (t) => frameAt(lisbon, 480, t).ctx.draws('street')[0][1];
  assert.ok(y(1.5) > y(0.5), 'the camera climbs, so the street layer moves down');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test 'tests/reel/ch1-lisbon.test.js'`
Expected: FAIL, with `Cannot find module '…/reel/ch1/lisbon.js'`.

- [ ] **Step 3: Implement.** Create `reel/ch1/lisbon.js`:

```js
// Chapter 1, shot 3: Lisbon. The yellow 28 tram grinds up a steep street of tiled facades with
// laundry overhead; the red 25 de Abril bridge spans the Tagus far below. The camera climbs with it.
import { Painter, rng } from '../pixels.js';
import { gradient, label } from '../kit.js';

const SLOPE = 0.2;                       // the street rises 1 px for every 5 px
const V = 34;                            // tram speed along x, px/s
const RAIL = 84;                         // screen row of the rail under the tram at t = 0

const FACADES = ['#e9a3a0', '#ecc76a', '#8fb9d6', '#a8d5b5', '#efe9dd', '#e7b48c'];
const LAUNDRY = ['#e8414b', '#f4f1ea', '#3f6fb5', '#f2c22e', '#4f9a4a'];

function tramArt() {
  const W = 50, H = 30, p = new Painter(W, H);
  const Y = '#f2c22e', y = '#d4a41f', C = '#f4efe2', K = '#2a2a2e', G = '#2c3a4a';
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const front = i > W - 6 ? (i - (W - 6)) : 0;               // rounded front end
    if (j < front - 2 || j > H - 1) continue;
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

function bridgeFar(W) {
  // the Tagus with the 25 de Abril bridge, very far off
  const p = new Painter(W, 60);
  for (let j = 38; j < 60; j++) for (let i = 0; i < W; i++) p.px(i, j, j < 40 ? '#9cc4dc' : (i + j) % 9 === 0 ? '#8fb6d0' : '#6f9fc2');
  for (let i = 0; i < W; i++) for (let j = 34; j < 38; j++) p.px(i, j, '#9fb59a');      // far bank
  const bx = Math.round(W * 0.15), span = Math.round(W * 0.7);
  for (let i = bx - 20; i < bx + span + 20; i++) p.px(i, 33, '#b8402e');               // deck
  for (const tx of [bx, bx + span]) for (let j = 18; j < 34; j++) { p.px(tx, j, '#c8462f'); p.px(tx + 1, j, '#a83a28'); }
  for (let i = 0; i <= span; i++) {
    const sag = 18 + Math.round(13 * (1 - Math.pow((i / span) * 2 - 1, 2)));
    p.px(bx + i, sag, '#c8462f');
    if (i % 6 === 0) for (let j = sag + 1; j < 33; j++) p.px(bx + i, j, '#d47a62');
  }
  return p;
}

export function buildLisbon(W, H = 96) {
  const hx = Math.round(W * 0.34);
  const run = W + V * 2 + 60;                                   // how far the street must extend
  const top = Math.floor(RAIL - SLOPE * (run - hx)) - 70;         // highest row any building reaches
  const LH = H + 20 - top;
  const street = new Painter(run, LH);                           // world strip, row 0 = screen row `top`
  const sy = (x) => RAIL - SLOPE * (x - hx) - top;                // street surface row in the strip
  const r = rng(28);
  for (let bx = -10, n = 0; bx < run; bx += 22, n++) {          // houses climbing the hill
    const base = Math.round(sy(bx + 11)) + 2, h = 34 + Math.floor(r() * 12), col = FACADES[n % FACADES.length];
    const tiled = n % 3 === 1;
    for (let j = base - h; j < base; j++) for (let i = bx; i < bx + 21; i++) {
      const tile = tiled && ((i >> 1) + (j >> 1)) % 2 === 0;
      street.px(i, j, tile ? '#3f6fb5' : (tiled ? '#e8eef6' : col));
    }
    for (let i = bx - 1; i < bx + 22; i++) { street.px(i, base - h - 1, '#c0603e'); street.px(i, base - h - 2, '#a84f32'); }
    for (let fy = base - h + 4; fy < base - 6; fy += 9) for (const fx of [bx + 3, bx + 12]) {
      street.rect(fx, fy, 5, 6, '#2f3646'); street.rect(fx - 1, fy, 1, 6, '#3d7a4a'); street.rect(fx + 5, fy, 1, 6, '#3d7a4a');
      street.rect(fx - 1, fy + 6, 7, 1, '#2a2a2e');                // iron balcony
    }
    if (n % 2 === 0) {                                          // laundry strung between windows
      const ly = base - h + 12;
      for (let i = bx + 2; i < bx + 20; i++) street.px(i, ly, '#5a5a60');
      for (let k = 0; k < 5; k++) street.rect(bx + 3 + k * 3, ly + 1, 2, 3, LAUNDRY[(n + k) % LAUNDRY.length]);
    }
  }
  for (let x = 0; x < run; x++) {                               // cobbles, kerb and the rail
    const s = Math.round(sy(x));
    for (let j = s; j < LH; j++) street.px(x, j, j === s ? '#8a8378' : ((x + j * 3) % 5 === 0 ? '#bdb5a3' : '#d9d3c4'));
    street.px(x, s + 3, '#5a5550'); street.px(x, s + 7, '#5a5550');
  }
  return { W, H, hx, top, layers: { sky: gradient(W, H, [['#6fa9e0', 0], ['#86b9e6', 0.3], ['#a8cdee', 0.6], ['#cfe4f5', 0.9]]), far: bridgeFar(W), street, tram: tramArt() } };
}

export function renderLisbon(ctx, t, s, env) {
  const { W, H, canvases: c } = s;
  const cx = t * V, cy = -SLOPE * t * V;                          // the camera climbs with the tram
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  ctx.drawImage(c.far, 0, Math.round(-cy * 0.15) - 6);
  ctx.drawImage(c.street, -Math.round(cx), Math.round(s.top - cy));
  // the overhead wire, parallel to the street
  ctx.fillStyle = '#2a2a2e';
  for (let x = 0; x < W; x++) ctx.fillRect(x, Math.round(RAIL - 40 - SLOPE * (x - s.hx)), 1, 1);
  // Yimeng at the tram's front window, then the tram body sheared onto the slope
  const tx = s.hx - 8, ty = RAIL - 27;
  const hero = env.hero('travel'), bob = Math.floor(t * 6) % 2;
  ctx.save();
  ctx.beginPath(); ctx.rect(tx + 35, ty - 1 + bob, 6, 8); ctx.clip();         // the fifth window, after the shear
  ctx.fillStyle = '#4a3a30'; ctx.fillRect(tx + 35, ty - 1 + bob, 6, 8);
  ctx.drawImage(hero.canvases[1], tx + 14, ty - 20 + bob);
  ctx.restore();
  for (let i = 0; i < c.tram.width; i++) {
    // leave Yimeng's window open: skip the glass rows of that column
    const winCol = i >= 35 && i <= 40;
    if (winCol) {
      ctx.drawImage(c.tram, i, 0, 1, 6, tx + i, ty - Math.round(SLOPE * i) + bob, 1, 6);
      ctx.drawImage(c.tram, i, 14, 1, c.tram.height - 14, tx + i, ty + 14 - Math.round(SLOPE * i) + bob, 1, c.tram.height - 14);
    } else ctx.drawImage(c.tram, i, 0, 1, c.tram.height, tx + i, ty - Math.round(SLOPE * i) + bob, 1, c.tram.height);
  }
  // trolley pole up to the wire
  ctx.fillStyle = '#2a2a2e';
  for (let k = 0; k < 14; k++) ctx.fillRect(tx + 22 + k, ty - 1 - Math.round(SLOPE * 22) - k + bob, 1, 1);
}

export const lisbon = { build: buildLisbon, render: renderLisbon };
```

- [ ] **Step 4: Add the shot.** Replace `reel/ch1/index.js` with:

```js
// Chapter 1: Sheffield, then a whirlwind through Europe.
import { sheffield } from './sheffield.js';
import { train } from './train.js';
import { lisbon } from './lisbon.js';

export const CHAPTER_1 = {
  name: 'Sheffield',
  shots: [
    { id: 'ch1-sheffield', scene: sheffield, caption: 'Sheffield', duration: 3, fadeIn: 0.4, fadeOut: 0.25 },
    { id: 'ch1-train', scene: train, caption: 'Europe', duration: 4, fadeIn: 0.2, fadeOut: 0.2 },
    { id: 'ch1-lisbon', scene: lisbon, caption: 'Europe', duration: 2, fadeIn: 0.2, fadeOut: 0.2 },
  ],
};
```

- [ ] **Step 5: Run the unit tests**

Run: `node --test 'tests/reel/*.test.js'`
Expected: `ℹ pass 75`, `ℹ fail 0`.

- [ ] **Step 6: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 7.3,8.6 && python3 tests/reel/sheet.py /tmp/f /tmp/f-lisbon.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 8.0 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-lisbon.png 3
```

Expected:
- A steep cobbled street running diagonally up to the right.
- Houses climbing it: pastel facades, blue-and-white azulejo fronts, green shutters, iron balconies, laundry lines, terracotta roofs.
- Far off, a blue river with the red 25 de Abril suspension bridge.
- The yellow tram on the slope, with its white roof, trolley pole to the wire and a black `28` board, and Yimeng's face in a front window.
- The houses and cobbles slide down and left as the camera climbs.

- [ ] **Step 7: Commit**

```bash
git add reel/ch1/lisbon.js reel/ch1/index.js tests/reel/ch1-lisbon.test.js
git commit -m "feat(reel): Climb a Lisbon hill on the 28 tram"
```

---

### Task 8: The Nürburgring in the Golf GTI

**Files:**
- Create: `reel/ch1/ring.js`
- Modify: `reel/ch1/index.js`
- Test: `tests/reel/ch1-ring.test.js`

**Interfaces:**
- Consumes:
  - From `kit.js`: `tile`, `gradient`, `ridge` and `label`.
  - From `pixels.js`: `Painter` and `rng`.
  - `env.hero('travel')` and `env.art`.
- Produces:
  - `ring` (a scene). The world streams past at 300 px/s.
  - The car is the layer `car`.
  - The lap timer runs from 7:54 at 4× speed.

- [ ] **Step 1: Write the failing test.** Create `tests/reel/ch1-ring.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { ring } from '../../reel/ch1/ring.js';

sceneContract('ch1 Nürburgring', ring, 2);

test('the Nürburgring: Yimeng drives the Golf while the timer ticks past 8:00', () => {
  const { ctx } = frameAt(ring, 480, 1);
  assert.equal(ctx.draws('travel:walk:1').length, 1);
  assert.equal(ctx.draws('car').length, 1);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test 'tests/reel/ch1-ring.test.js'`
Expected: FAIL, with `Cannot find module '…/reel/ch1/ring.js'`.

- [ ] **Step 3: Implement.** Create `reel/ch1/ring.js`:

```js
// Chapter 1, shot 4: the Nürburgring Nordschleife. Yimeng's modified Golf GTI (Tornado Red)
// flies through the Eifel forest past Armco and red-white kerbs; a lap timer runs in the corner.
import { Painter, rng } from '../pixels.js';
import { tile, gradient, ridge, label } from '../kit.js';

const V = 300;                          // the world streams past at this many px/s
const ROAD = 85;                        // asphalt top row; the tyres sit on it

function golf() {
  // side view, facing right: rear hatch on the left, bonnet on the right; glass left transparent
  const W = 64, H = 25, p = new Painter(W, H);
  const R = '#c8102e', r = '#9a0c22', h = '#e8414b', K = '#1c1c22', G = '#27303d';
  const body = (x, y) => {
    if (y < 2) return x >= 19 && x <= 45;                                    // roof
    if (y <= 10) {                                                             // greenhouse
      const back = 18 - (y - 1) * 0.85, front = 46 + (y - 1) * 0.95;
      return x >= back && x <= front;
    }
    if (y <= 19) return x >= 3 && x <= 62 - (y < 12 ? (12 - y) * 3 : 0);
    return false;
  };
  for (let y = 0; y < 20; y++) for (let x = 0; x < W; x++) {
    if (!body(x, y)) continue;
    let c = R;
    if (y >= 2 && y <= 10) {
      const pillarB = x >= 31 && x <= 32, edge = !body(x - 1, y) || !body(x + 1, y);
      c = edge || pillarB ? K : null;                                          // glass stays transparent
      if (c === null) continue;
    }
    if (y === 11) c = h;                                                       // shoulder highlight
    if (y >= 17) c = y >= 18 ? K : r;                                          // sill and skirt
    p.px(x, y, c);
  }
  for (let x = 19; x <= 45; x++) p.px(x, 0, '#e8414b');
  for (const [cx, cy] of [[15, 19], [50, 19]]) {                              // wheel arches, wheels, calipers
    for (let j = -7; j <= 0; j++) for (let i = -7; i <= 7; i++) if (i * i + j * j <= 49) p.px(cx + i, cy + j, '#14141a');
    for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) {
      const d = i * i + j * j;
      if (d > 30) continue;
      p.px(cx + i, cy + j, d > 20 ? '#1c1c22' : d < 3 ? '#8a8f98' : ((Math.atan2(j, i) * 5 / Math.PI + 10) % 2 < 1 ? '#3a3d45' : '#5a5f6a'));
    }
    p.px(cx + 2, cy - 3, '#e8414b'); p.px(cx + 3, cy - 2, '#e8414b');
  }
  p.rect(59, 12, 3, 2, '#f4f1e6');                                             // headlight
  p.rect(62, 14, 2, 1, '#e8414b');                                             // the red grille stripe
  p.rect(3, 12, 3, 2, '#7a0a18');                                              // tail light
  p.rect(53, 14, 3, 1, '#d9d9df');                                             // GTI badge glint
  return p;
}

const SIGN = (() => {
  const t = label('NORDSCHLEIFE', '#f4f1e6');
  const w = t.w + 6, rows = [];
  for (let y = 0; y < 9; y++) {
    let row = '';
    for (let x = 0; x < w; x++) row += (y >= 2 && y < 7 && x >= 3 && x < 3 + t.w && t.rows[y - 2][x - 3] === '#') ? 'w' : 'g';
    rows.push(row);
  }
  for (let y = 0; y < 8; y++) rows.push('.'.repeat(4) + 'p' + '.'.repeat(w - 10) + 'p' + '.'.repeat(4));
  return { rows, palette: { g: '#1f6b3a', w: '#f4f1e6', p: '#6a6f78' }, w, h: rows.length };
})();

export function buildRing(W, H = 96) {
  const TW = W * 2, layers = {};
  layers.sky = gradient(W, 70, [['#9fb2c6', 0], ['#b6c5d4', 0.4], ['#cfd9e2', 0.8]]);
  const forest = (base, hgt, step, cols, seed) => {                           // conifer band, seamless
    const p = new Painter(TW, H), r = rng(seed);
    const fill = ridge(TW, base - 4, [[2, 3, seed], [1, 7, seed * 2]]);
    for (let i = 0; i < TW; i++) for (let j = Math.round(fill[i]); j < base + 2; j++) p.px(i, j, cols[1]);
    for (let x = 0; x < TW; x += step) {
      const h = hgt * (0.7 + r() * 0.5), cx = x + r() * step;
      for (let j = 0; j < h; j++) {
        const w = (j / h) * (h * 0.32);
        for (let i = -Math.round(w); i <= Math.round(w); i++) p.wpx(cx + i, base - h + j, (j % 4 === 3 && i < 0) ? cols[1] : cols[0]);
      }
    }
    return p;
  };
  layers.hills = forest(62, 16, 7, ['#4c6a5c', '#5a7868'], 3);
  layers.mid = forest(72, 24, 9, ['#2f5240', '#3a5f4a'], 5);
  const track = new Painter(TW, H);                                            // Armco, asphalt, kerbs, grass
  for (let i = 0; i < TW; i++) {
    for (let y = 72; y < 85; y++) track.px(i, y, y < 78 ? '#2a4535' : '#33503d');      // verge behind the barrier
    for (const y of [74, 77]) { track.px(i, y, '#c9ced6'); track.px(i, y + 1, '#8a909a'); }
    if (i % 16 === 0) for (let y = 74; y < 82; y++) track.px(i, y, '#6a6f78');
    for (let y = ROAD; y < 93; y++) track.px(i, y, y === ROAD ? '#f4f1e6' : (i * 7 + y * 3) % 13 === 0 ? '#4a4e56' : '#3a3d44');
    for (let y = 93; y < 96; y++) track.px(i, y, y < 95 ? (Math.floor(i / 8) % 2 ? '#e8414b' : '#f4f1e6') : '#3f6a3a');
  }
  layers.track = track;
  const near = new Painter(TW, H), rn = rng(9);                              // trunks flicking past, low grass
  for (let x = 0; x < TW; x += 150 + Math.floor(rn() * 120)) for (let y = 0; y < H; y++) for (let k = 0; k < 4; k++) near.wpx(x + k, y, k === 0 ? '#16281e' : '#1e3a2a');
  for (let x = 0; x < TW; x++) for (let y = 95; y < H; y++) near.px(x, y, '#2f5236');
  layers.near = near;
  layers.car = golf();
  return { W, H, layers, signX: Math.round(W * 0.9) };
}

const labels = new Map();                // text -> pixel art, so the timer does not churn objects
function text(str, ink) {
  const k = str + ink;
  if (!labels.has(k)) labels.set(k, label(str, ink));
  return labels.get(k);
}

export function renderRing(ctx, t, s, env) {
  const { W, H, canvases: c } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  tile(ctx, c.hills, t * V * 0.06, 0);
  tile(ctx, c.mid, t * V * 0.25, 0);
  tile(ctx, c.track, t * V, 0);
  const sign = env.art(SIGN);                                                    // the sign whips past behind the barrier
  ctx.drawImage(sign, Math.round(s.signX - t * V * 0.55), 54);
  // the car: Yimeng behind the driver's window, then the body
  const cx = Math.round(W * 0.34) - 22, bob = Math.floor(t * 10) % 2, cy = ROAD - 24 + bob;
  const hero = env.hero('travel');
  ctx.save();
  ctx.beginPath(); ctx.rect(cx + 33, cy + 2, 14, 9); ctx.clip();
  ctx.fillStyle = '#27303d'; ctx.fillRect(cx + 20, cy, 30, 12);
  ctx.drawImage(hero.canvases[1], cx + 22, cy - 13);
  ctx.fillStyle = 'rgba(150, 175, 205, 0.22)'; ctx.fillRect(cx + 20, cy, 30, 12);
  ctx.restore();
  ctx.fillStyle = '#27303d'; ctx.fillRect(cx + 15, cy + 2, 16, 9);           // rear glass, tinted
  ctx.drawImage(c.car, cx, cy);
  // tyre smoke through the corner
  if (t > 0.7 && t < 1.5) {
    ctx.fillStyle = 'rgba(220, 222, 226, 0.55)';
    for (let k = 0; k < 6; k++) {
      const age = (t * 9 + k * 0.37) % 1, px = cx + 10 - age * 40, py = ROAD - 4 - age * 8;
      ctx.fillRect(Math.round(px), Math.round(py), 4 + Math.round(age * 4), 3);
    }
  }
  tile(ctx, c.near, t * V * 1.6, 0);
  // speed streaks
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  const rs = rng(4);
  for (let n = 0; n < 10; n++) {
    const y = 30 + Math.floor(rs() * 50), len = 10 + rs() * 30, x = ((rs() * W * 3 - t * V * 2.2) % (W + 60) + W + 60) % (W + 60) - 30;
    ctx.fillRect(Math.round(x), y, Math.round(len), 1);
  }
  // lap timer under the controls, running fast
  const secs = 474 + t * 4, m = Math.floor(secs / 60), sec = secs - m * 60;
  const txt = `${m}:${sec.toFixed(2).padStart(5, '0')}`;
  const lbl = env.art(text(txt, '#f4f1e6')), lap = env.art(text('LAP', '#e8b923'));
  const bx = W - lbl.width - lap.width - 14;
  ctx.fillStyle = 'rgba(11, 11, 12, 0.7)'; ctx.fillRect(bx, 20, lbl.width + lap.width + 10, 9);
  ctx.drawImage(lap, bx + 3, 22); ctx.drawImage(lbl, bx + lap.width + 7, 22);
}

export const ring = { build: buildRing, render: renderRing };
```

- [ ] **Step 4: Add the shot.** Replace `reel/ch1/index.js` with:

```js
// Chapter 1: Sheffield, then a whirlwind through Europe.
import { sheffield } from './sheffield.js';
import { train } from './train.js';
import { lisbon } from './lisbon.js';
import { ring } from './ring.js';

export const CHAPTER_1 = {
  name: 'Sheffield',
  shots: [
    { id: 'ch1-sheffield', scene: sheffield, caption: 'Sheffield', duration: 3, fadeIn: 0.4, fadeOut: 0.25 },
    { id: 'ch1-train', scene: train, caption: 'Europe', duration: 4, fadeIn: 0.2, fadeOut: 0.2 },
    { id: 'ch1-lisbon', scene: lisbon, caption: 'Europe', duration: 2, fadeIn: 0.2, fadeOut: 0.2 },
    { id: 'ch1-ring', scene: ring, caption: 'Europe', duration: 2, fadeIn: 0.15, fadeOut: 0.2 },
  ],
};
```

- [ ] **Step 5: Run the unit tests**

Run: `node --test 'tests/reel/*.test.js'`
Expected: `ℹ pass 78`, `ℹ fail 0`.

- [ ] **Step 6: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 9.4,10.1 && python3 tests/reel/sheet.py /tmp/f /tmp/f-ring.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 10.1 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-ring.png 3
```

Expected:
- The Eifel forest in layered conifers under a grey sky.
- A silver Armco barrier, dark asphalt with a white edge line, red/white kerbs along the bottom.
- The red Golf GTI, lowered, with dark multi-spoke wheels and red calipers, and Yimeng visible through the driver's window.
- A green `NORDSCHLEIFE` sign whips past, with speed streaks, tyre smoke mid-shot, and occasional trunks flicking by in front.
- A `LAP 7:5x.xx` box sits at the top right, just under the controls.

- [ ] **Step 7: Commit**

```bash
git add reel/ch1/ring.js reel/ch1/index.js tests/reel/ch1-ring.test.js
git commit -m "feat(reel): Lap the Nordschleife in the Golf GTI"
```

---

### Task 9: Sitting on Trolltunga

**Files:**
- Create: `reel/ch1/trolltunga.js`
- Modify: `reel/ch1/index.js`
- Test: `tests/reel/ch1-trolltunga.test.js`

**Interfaces:**
- Consumes:
  - From `kit.js`: `gradient` and `ridge`.
  - From `pixels.js`: `Painter` and `rng`.
  - `env.hero('trolltunga')`, plus `env.hero('trolltunga', 'sit')` from Task 3.
- Produces:
  - `trolltunga` (a scene); its built scene exposes `tip = round(0.6 W)`.
  - Yimeng walks on row 58 until 1.15 s, then sits with the knees over the tip at x = `tip - 12`.

- [ ] **Step 1: Write the failing test.** Create `tests/reel/ch1-trolltunga.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { trolltunga } from '../../reel/ch1/trolltunga.js';

sceneContract('ch1 Trolltunga', trolltunga, 3);

test('Trolltunga: walks out along the tongue, then sits at the tip', () => {
  const walking = frameAt(trolltunga, 480, 0.5).ctx.calls.filter(c => String(c[1]).startsWith('trolltunga:walk'));
  assert.equal(walking.length, 1);
  assert.equal(walking[0][3], 58 - 44);
  const { ctx, s } = frameAt(trolltunga, 480, 2);
  const sitting = ctx.calls.filter(c => String(c[1]).startsWith('trolltunga:sit'));
  assert.deepEqual(sitting.map(c => [c[2], c[3]]), [[s.tip - 12 - 9, 58 - 1 - 38]]);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test 'tests/reel/ch1-trolltunga.test.js'`
Expected: FAIL, with `Cannot find module '…/reel/ch1/trolltunga.js'`.

- [ ] **Step 3: Implement.** Create `reel/ch1/trolltunga.js`:

```js
// Chapter 1, shot 5: Trolltunga. Yimeng walks out along the rock tongue, sits at the tip with legs
// dangling over the lake 700 m below, and the camera simply holds. The stillest moment in the film.
import { Painter, rng } from '../pixels.js';
import { gradient, ridge } from '../kit.js';

const TOP = 58;                          // the tongue's walking surface (row the shoes rest on)
const WALK_END = 1.15;                   // seconds of walking before sitting down
const STEP = 26;                         // walk speed, px/s

function range(p, W, base, amp, waves, cols, snowFrac) {
  // a mountain range: lit faces left of each crest, shaded right, snow fields near the tops
  const h = ridge(W * 2, amp, waves);
  for (let i = 0; i < W; i++) {
    const slope = h[i + 1] - h[i];
    for (let j = 0; j < h[i]; j++) {
      const y = base - j, fromTop = h[i] - j;
      let c = slope > 0 ? cols.lit : cols.shade;
      const cap = h[i] * snowFrac;
      if (fromTop < cap * 0.6 || (fromTop < cap && (i + y) % 2 === 0)) c = slope > 0 ? cols.snow : cols.snowShade;
      p.px(i, y, c);
    }
  }
}

export function buildTrolltunga(W, H = 96) {
  const layers = {}, tip = Math.round(W * 0.6);
  layers.sky = gradient(W, H, [['#4f88c8', 0], ['#6a9fd6', 0.3], ['#93bce4', 0.6], ['#c3dbf0', 0.9]]);
  const cl = new Painter(W * 2, 50), rc = rng(21);                        // a few soft clouds
  for (let n = 0; n < 6; n++) {
    const cx = rc() * W * 2, cy = 14 + rc() * 22, len = 16 + rc() * 30;
    for (let y = 0; y < 3; y++) for (let x = y * 3; x < len - y * 3; x++) if (y < 2 || (x + y) % 2) cl.wpx(cx + x, cy + y, y === 0 ? '#f4f8fc' : '#dfe9f4');
  }
  layers.clouds = cl;

  const mts = new Painter(W, H);
  range(mts, W, 74, 44, [[10, 2, 0.3], [6, 5, 1.1], [2.5, 13, 0.6]], { lit: '#a3b4c8', shade: '#8a9cb2', snow: '#f2f6fa', snowShade: '#d3dde8' }, 0.3, 1);
  range(mts, W, 84, 34, [[9, 3, 2.2], [4, 7, 0.4], [2, 17, 1.0]], { lit: '#7488a0', shade: '#5f7189', snow: '#e8eef5', snowShade: '#c3cfdc' }, 0.14, 2);
  for (let j = 70; j < H; j++) for (let i = 0; i < W; i++) {                // valley walls down to the water
    const right = W * 0.82 + Math.sin(j * 0.5) * 2 - (j - 70) * 0.9;
    const left = W * 0.34 + (j - 70) * 0.35 + Math.sin(j * 0.7) * 1.5;
    if (i > right || i < left) mts.px(i, j, (i * 3 + j * 5) % 7 === 0 ? '#3e4d45' : (i > right ? '#4c5d55' : '#55665d'));
  }
  for (let j = 84; j < H; j++) for (let i = 0; i < W; i++) {                // Ringedalsvatnet, far below
    const right = W * 0.82 - (j - 70) * 0.9, left = W * 0.34 + (j - 70) * 0.35;
    if (i >= left && i <= right) mts.px(i, j, j === 84 ? '#a6d6dc' : (i * 3 + j) % 11 === 0 ? '#5fb0b8' : '#3f8f9c');
  }
  layers.mts = mts;

  const rock = new Painter(W, H), rr = rng(12);                           // the cliff and its tongue
  const cliffEdge = Math.round(W * 0.3);
  for (let i = 0; i <= tip; i++) {
    const lift = i > tip - 20 ? (i - (tip - 20)) * 0.09 : 0;               // the tip curls up a little
    const top = TOP - Math.round(lift) + (i < cliffEdge ? Math.round(Math.sin(i * 0.31) + Math.sin(i * 0.13)) - 1 : 0);
    const thick = i < cliffEdge ? H : Math.round(10 - (i - cliffEdge) / (tip - cliffEdge) * 4 + Math.sin(i * 0.9) * 1.2 + (rr() < 0.15 ? 1 : 0));
    const bottom = i < cliffEdge ? H : TOP - Math.round(lift) + thick;
    for (let j = top; j < bottom; j++) {
      const depth = j - top;
      let c = depth === 0 ? '#b3aa9c' : depth < 2 ? '#9a9286' : (i * 5 + j * 3) % 9 === 0 ? '#5a554f' : '#77716a';
      if (i < cliffEdge && i > cliffEdge - 8 && depth > 6) c = (i + j) % 3 ? '#5f5a54' : '#4f4a45';   // the cliff face in shade
      if (i >= cliffEdge && j >= bottom - 2) c = '#4f4a45';                  // rough underside
      rock.px(i, j, c);
    }
  }
  for (let n = 0; n < 60; n++) rock.px(Math.floor(rr() * (cliffEdge - 8)), TOP + 6 + Math.floor(rr() * 34), rr() < 0.5 ? '#8f877c' : '#4f4a45');
  layers.rock = rock;

  const mist = new Painter(W, H);                                          // haze between the tongue and the lake
  for (let j = 72; j < 84; j++) for (let i = 0; i < W; i++) if ((i + j * 2) % (j < 78 ? 3 : 2) === 0) mist.px(i, j, '#e6eef5');
  layers.mist = mist;
  return { W, H, layers, tip };
}

export function renderTrolltunga(ctx, t, s, env) {
  const { W, H, canvases: c } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  ctx.drawImage(c.clouds, Math.round(-t * 3), 0);
  ctx.drawImage(c.mts, 0, 0);
  ctx.globalAlpha = 0.35; ctx.drawImage(c.mist, Math.round(-t * 2), 0); ctx.globalAlpha = 1;
  ctx.drawImage(c.rock, 0, 0);
  const sitX = s.tip - 12;                          // with the knees over the edge
  if (t < WALK_END) {
    const hero = env.hero('trolltunga');
    const x = sitX - (WALK_END - t) * STEP;
    ctx.drawImage(hero.canvases[Math.floor(t * 6) % 4], Math.round(x) - hero.anchorX, TOP - hero.footY);
  } else {
    const hero = env.hero('trolltunga', 'sit');
    ctx.drawImage(hero.canvases[Math.floor((t - WALK_END) * 2) % 2], sitX - hero.anchorX, TOP - 1 - hero.seatY);
  }
}

export const trolltunga = { build: buildTrolltunga, render: renderTrolltunga };
```

- [ ] **Step 4: Add the shot.** Replace `reel/ch1/index.js` with:

```js
// Chapter 1: Sheffield, then a whirlwind through Europe.
import { sheffield } from './sheffield.js';
import { train } from './train.js';
import { lisbon } from './lisbon.js';
import { ring } from './ring.js';
import { trolltunga } from './trolltunga.js';

export const CHAPTER_1 = {
  name: 'Sheffield',
  shots: [
    { id: 'ch1-sheffield', scene: sheffield, caption: 'Sheffield', duration: 3, fadeIn: 0.4, fadeOut: 0.25 },
    { id: 'ch1-train', scene: train, caption: 'Europe', duration: 4, fadeIn: 0.2, fadeOut: 0.2 },
    { id: 'ch1-lisbon', scene: lisbon, caption: 'Europe', duration: 2, fadeIn: 0.2, fadeOut: 0.2 },
    { id: 'ch1-ring', scene: ring, caption: 'Europe', duration: 2, fadeIn: 0.15, fadeOut: 0.2 },
    { id: 'ch1-trolltunga', scene: trolltunga, caption: 'Europe', duration: 3, fadeIn: 0.3, fadeOut: 0.3 },
  ],
};
```

- [ ] **Step 5: Run the unit tests**

Run: `node --test 'tests/reel/*.test.js'`
Expected: `ℹ pass 81`, `ℹ fail 0`.

- [ ] **Step 6: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 11.5,13.6 && python3 tests/reel/sheet.py /tmp/f /tmp/f-troll.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 13.6 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-troll.png 3
```

Expected:
- A clear Nordic sky with a few clouds, and two mountain ranges with clean snow caps and lit and shaded faces.
- Dark valley walls dropping to a turquoise lake far below, with a band of haze between.
- On the left, a jagged grey cliff whose tongue juts out to the right with a rough underside.
- At 11.5 s Yimeng (red shell, big pack) walks out along it. By 13.6 s Yimeng sits at the tip with the legs dangling over the drop.
- The camera does not move. On the phone the tip sits just right of centre.

- [ ] **Step 7: Commit**

```bash
git add reel/ch1/trolltunga.js reel/ch1/index.js tests/reel/ch1-trolltunga.test.js
git commit -m "feat(reel): Sit at the tip of Trolltunga"
```

---

### Task 10: Vestrahorn under the aurora, then the takeoff

**Files:**
- Create: `reel/ch1/iceland.js`
- Modify: `reel/ch1/index.js`
- Test: `tests/reel/ch1-iceland.test.js`

**Interfaces:**
- Consumes:
  - From `kit.js`: `gradient` and `ridge`.
  - From `pixels.js`: `Painter` and `rng`.
  - `env.hero('iceland')`.
- Produces:
  - `iceland` (a scene). Yimeng walks in, stops at 1.1 s at x = `round(0.34 W)`, and stands with shoes on row 90.
  - `takeoff` (a scene). The plane is the layer `plane`: it rolls, lifts off at 0.35 s and climbs out to the top right.
  - The aurora is drawn per frame and moves with time.

- [ ] **Step 1: Write the failing test.** Create `tests/reel/ch1-iceland.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { iceland, takeoff } from '../../reel/ch1/iceland.js';

sceneContract('ch1 Iceland', iceland, 2);
sceneContract('ch1 takeoff', takeoff, 1);

test('Iceland: walks in, then stands still under the aurora', () => {
  assert.deepEqual(frameAt(iceland, 480, 1.5).ctx.draws('iceland:walk:1'), [[163 - 9, 90 - 44]]);
});

test('the takeoff climbs out to the top right', () => {
  const at = (t) => frameAt(takeoff, 480, t).ctx.draws('plane')[0];
  assert.ok(at(0.9)[0] > at(0.1)[0], 'moves right');
  assert.ok(at(0.9)[1] < at(0.1)[1], 'climbs');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test 'tests/reel/ch1-iceland.test.js'`
Expected: FAIL, with `Cannot find module '…/reel/ch1/iceland.js'`.

- [ ] **Step 3: Implement.** Create `reel/ch1/iceland.js`:

```js
// Chapter 1, shots 6 and 7: Iceland. Vestrahorn ("Batman Mountain") over black sand dunes under a
// moving aurora; then a plane climbs out under the same sky, west towards New York.
import { Painter, rng } from '../pixels.js';
import { gradient, ridge } from '../kit.js';

const NIGHT = [['#0c1530', 0], ['#13204a', 0.3], ['#1c2c58', 0.6], ['#2a3d68', 0.85]];

function stars(W, seed) {
  const r = rng(seed), out = [];
  for (let n = 0; n < Math.round(W / 4); n++) out.push([Math.floor(r() * W), Math.floor(r() * 60), r()]);
  return out;
}

// The aurora: a wavy curtain of green rays with a violet fringe, alive with time.
function aurora(ctx, W, t, yBase) {
  for (let x = 0; x < W; x++) {
    const yc = yBase + 6 * Math.sin(x * 0.028 + t * 0.7) + 3 * Math.sin(x * 0.071 - t * 1.2);
    const ray = 0.5 + 0.5 * Math.sin(x * 0.33 + t * 2.1) * Math.sin(x * 0.11 - t * 0.9);
    const len = 8 + Math.round(10 * ray);
    ctx.globalAlpha = 0.18 + 0.32 * ray; ctx.fillStyle = '#a77ae0'; ctx.fillRect(x, Math.round(yc) - 3, 1, 3);
    ctx.globalAlpha = 0.25 + 0.5 * ray; ctx.fillStyle = '#3fe08a'; ctx.fillRect(x, Math.round(yc), 1, len);
    ctx.globalAlpha = 0.15 + 0.3 * ray; ctx.fillStyle = '#9af5c8'; ctx.fillRect(x, Math.round(yc), 1, 2);
  }
  ctx.globalAlpha = 1;
}

function drawStars(ctx, list, t) {
  for (const [x, y, b] of list) {
    if (Math.sin(t * 3 + b * 40) < -0.6) continue;               // twinkle
    ctx.fillStyle = b > 0.85 ? '#ffffff' : b > 0.5 ? '#c9d6f2' : '#7f90c0';
    ctx.fillRect(x, y, 1, 1);
  }
}

export function buildIceland(W, H = 96) {
  const layers = {};
  layers.sky = gradient(W, H, NIGHT);
  const mtn = new Painter(W, H);                                     // Vestrahorn: a black massif of sharp spires
  const massif = (x) => {
    const u = x / W;                                                 // 0..1 across the view
    const body = 4 + 30 * Math.exp(-Math.pow((u - 0.45) / 0.2, 2));
    let spikes = 0;
    for (const [c, h, w] of [[0.22, 30, 0.035], [0.3, 40, 0.03], [0.36, 48, 0.028], [0.42, 43, 0.022], [0.48, 50, 0.03], [0.55, 41, 0.026], [0.62, 33, 0.03], [0.7, 23, 0.035]]) {
      spikes = Math.max(spikes, h * Math.max(0, 1 - Math.abs(u - c) / w));
    }
    return Math.round(Math.max(body, spikes));
  };
  for (let i = 0; i < W; i++) {
    const h = massif(i), lit = massif(i + 1) > h;                    // the side facing the aurora catches light
    for (let j = 0; j < h; j++) mtn.px(i, 71 - j, j > h - 2 ? (lit ? '#6d8bc0' : '#3a4f78') : j > h - 5 && lit ? '#23304a' : '#0a0e16');
  }
  layers.mtn = mtn;
  const dunes = new Painter(W * 2, H), rd = rng(44);                 // black sand dunes and grass tufts
  const hump = ridge(W * 2, 10, [[4, 3, 0.4], [2, 9, 1.3]]);
  for (let i = 0; i < W * 2; i++) for (let j = 0; j < hump[i]; j++) dunes.px(i, 95 - j, j > hump[i] - 1.5 ? '#2a2c34' : '#17181e');
  for (let n = 0; n < W / 3; n++) {
    const x = Math.floor(rd() * W * 2), base = 95 - Math.round(hump[x]) + 1;
    for (let k = 0; k < 3; k++) dunes.px(x + k - 1, base - 1 - (k === 1 ? 2 : 1), k === 1 ? '#b8b25a' : '#7d8240');
  }
  layers.dunes = dunes;
  return { W, H, layers, stars: stars(W, 3) };
}

export function renderIceland(ctx, t, s, env) {
  const { W, H, canvases: c } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  drawStars(ctx, s.stars, t);
  aurora(ctx, W, t, 22);
  ctx.drawImage(c.mtn, 0, 0);
  // the wet sand mirrors the mountain and the aurora
  ctx.fillStyle = '#121a2e'; ctx.fillRect(0, 71, W, H - 71);         // wet sand
  ctx.save();
  ctx.translate(0, 142); ctx.scale(1, -1);
  ctx.globalAlpha = 0.5; ctx.drawImage(c.mtn, 0, 0, W, 71, 0, 0, W, 71);
  ctx.restore();
  ctx.globalAlpha = 0.14; ctx.fillStyle = '#3fe08a'; ctx.fillRect(0, 80, W, 4); ctx.globalAlpha = 1;   // the aurora, mirrored
  ctx.fillStyle = 'rgba(10, 14, 22, 0.55)';
  for (let y = 74; y < 90; y += 4) for (let x = (y * 7) % 23; x < W; x += 23) ctx.fillRect(x, y, 14, 1);   // broken ripples
  ctx.drawImage(c.dunes, Math.round(-t * 8), 0);
  // Yimeng walks in, stops, looks up
  const hero = env.hero('iceland'), stopAt = 1.1;
  const x = Math.round(W * 0.34) - Math.max(0, stopAt - t) * 22;
  const frame = t < stopAt ? Math.floor(t * 6) % 4 : 1;
  ctx.drawImage(hero.canvases[frame], Math.round(x) - hero.anchorX, 90 - hero.footY);
}

export const iceland = { build: buildIceland, render: renderIceland };

// ---------- the takeoff ----------
function plane() {
  const W = 58, H = 18, p = new Painter(W, H);
  const B = '#f2f3f6', b = '#c9ccd3', D = '#25427a', Y = '#e8b923', K = '#2a2d33';
  for (let y = 7; y < 14; y++) for (let x = 6; x < 56; x++) {           // fuselage, rounded nose
    const nose = x > 50 ? (x - 50) * 0.9 : 0, tail = x < 12 ? (12 - x) * 0.5 : 0;
    if (y < 7 + nose * 0.6 + tail * 0.8 || y > 13 - nose * 0.4) continue;
    p.px(x, y, y > 11 ? b : B);
  }
  for (let y = 0; y < 9; y++) for (let x = 7 + Math.round(y * 0.4); x < 12 + y; x++) p.px(x, y, y < 3 ? Y : D);   // tail fin, swept back
  for (let x = 2; x < 13; x++) p.px(x, 9, D);                           // tailplane
  for (let x = 14; x < 52; x += 3) p.px(x, 9, '#5a6f96');               // windows
  p.rect(50, 8, 3, 2, '#2a3a5a');                                       // cockpit
  for (let k = 0; k < 9; k++) for (let x = 24 + k; x < 36 + k; x++) p.px(x, 13 + Math.floor(k / 2), k < 2 ? b : '#9aa0aa');   // wing
  for (let y = 14; y < 17; y++) for (let x = 30; x < 37; x++) p.px(x, y, K);                   // engine
  p.px(37, 15, '#5a5f6a');
  return p;
}

function gear(ctx, x, y) {
  ctx.fillStyle = '#2a2d33';
  for (const dx of [16, 33, 34]) { ctx.fillRect(x + dx, y + 14, 1, 3); ctx.fillRect(x + dx - 1, y + 17, 3, 1); }
}

export function buildTakeoff(W, H = 96) {
  const layers = { sky: gradient(W, H, NIGHT), plane: plane() };
  const rw = new Painter(W * 2, H);                                     // runway with edge lights
  for (let i = 0; i < W * 2; i++) {
    for (let y = 80; y < H; y++) rw.px(i, y, y < 82 ? '#20232b' : y < 88 ? '#2c3038' : '#15171c');
    if (i % 12 < 6) rw.px(i, 85, '#d9dde4');
    if (i % 20 === 0) { rw.px(i, 81, '#5aa0ff'); rw.px(i, 88, '#5aa0ff'); }
  }
  for (let i = 0; i < W * 2; i++) for (let y = 74; y < 80; y++) rw.px(i, y, y === 79 && i % 9 === 0 ? '#e8b923' : '#0f1219');
  layers.runway = rw;
  return { W, H, layers, stars: stars(W, 8) };
}

export function renderTakeoff(ctx, t, s) {
  const { W, H, canvases: c } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  drawStars(ctx, s.stars, t + 2);
  aurora(ctx, W, t + 2, 22);
  ctx.drawImage(c.runway, Math.round(-t * 60), 0);
  // roll, rotate, climb out to the top right
  const roll = Math.min(t, 0.35), climb = Math.max(0, t - 0.35);
  const x = W * 0.2 + roll * 160 + climb * 260, y = 80 - c.plane.height - 1 - climb * climb * 120 - climb * 30;
  ctx.drawImage(c.plane, Math.round(x), Math.round(y));
  if (t < 0.6) gear(ctx, Math.round(x), Math.round(y));
  if (Math.floor(t * 6) % 2 === 0) { ctx.fillStyle = '#ff4a4a'; ctx.fillRect(Math.round(x) + 24, Math.round(y) + 6, 1, 1); }   // beacon
}

export const takeoff = { build: buildTakeoff, render: renderTakeoff };
```

- [ ] **Step 4: Add both shots.** Replace `reel/ch1/index.js` with:

```js
// Chapter 1: Sheffield, then a whirlwind through Europe.
import { sheffield } from './sheffield.js';
import { train } from './train.js';
import { lisbon } from './lisbon.js';
import { ring } from './ring.js';
import { trolltunga } from './trolltunga.js';
import { iceland, takeoff } from './iceland.js';

export const CHAPTER_1 = {
  name: 'Sheffield',
  shots: [
    { id: 'ch1-sheffield', scene: sheffield, caption: 'Sheffield', duration: 3, fadeIn: 0.4, fadeOut: 0.25 },
    { id: 'ch1-train', scene: train, caption: 'Europe', duration: 4, fadeIn: 0.2, fadeOut: 0.2 },
    { id: 'ch1-lisbon', scene: lisbon, caption: 'Europe', duration: 2, fadeIn: 0.2, fadeOut: 0.2 },
    { id: 'ch1-ring', scene: ring, caption: 'Europe', duration: 2, fadeIn: 0.15, fadeOut: 0.2 },
    { id: 'ch1-trolltunga', scene: trolltunga, caption: 'Europe', duration: 3, fadeIn: 0.3, fadeOut: 0.3 },
    { id: 'ch1-iceland', scene: iceland, caption: 'Europe', duration: 2, fadeIn: 0.3 },
    { id: 'ch1-takeoff', scene: takeoff, caption: 'Europe', duration: 1, fadeOut: 0.35 },
  ],
};
```

- [ ] **Step 5: Run the unit tests**

Run: `node --test 'tests/reel/*.test.js'`
Expected: `ℹ pass 87`, `ℹ fail 0`.

- [ ] **Step 6: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 14.6,15.6,16.2,16.6 && python3 tests/reel/sheet.py /tmp/f /tmp/f-ice.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 15.6,16.4 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-ice.png 3
```

Expected:
- A navy night sky with twinkling stars, and a green aurora curtain with a violet fringe that moves between frames.
- Vestrahorn as a black massif of sharp spires reaching into the aurora, lit along the faces that catch its light, and mirrored faintly in wet black sand broken by ripples.
- Dunes with yellow-green grass tufts in front.
- Yimeng (navy puffer, mustard beanie) walks in, then stands still.
- In the takeoff, under the same sky, a white jet with a blue and yellow tail rolls along a runway lit with blue edge lights, lifts off and climbs out to the top right. The last shot fades to black.

- [ ] **Step 7: Commit**

```bash
git add reel/ch1/iceland.js reel/ch1/index.js tests/reel/ch1-iceland.test.js
git commit -m "feat(reel): Stand under the aurora at Vestrahorn, then fly out"
```

---

### Task 11: Chapter 1 complete: checks, spec, hand-off

**Files:**
- Test: `tests/reel/ch1-chapter.test.js`
- Modify: `tests/reel/page-check.sh`, `docs/superpowers/specs/2026-10-03-life-reel-design.md`

**Interfaces:**
- Consumes: `CHAPTER_1` (Task 10).
- Produces: a chapter 1 of 17 s, so the stand-ins move. New York now starts at 17 s, Michigan at 23 s, California at 29 s and "To be continued" at 37 s; the loop is 41 s.

- [ ] **Step 1: Write the chapter test.** Create `tests/reel/ch1-chapter.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTER_1 } from '../../reel/ch1/index.js';

test('chapter 1 runs Sheffield, then six Europe shots, 17 s in all', () => {
  assert.equal(CHAPTER_1.name, 'Sheffield');
  assert.deepEqual(CHAPTER_1.shots.map(s => s.id), ['ch1-sheffield', 'ch1-train', 'ch1-lisbon', 'ch1-ring', 'ch1-trolltunga', 'ch1-iceland', 'ch1-takeoff']);
  assert.deepEqual(CHAPTER_1.shots.map(s => s.caption), ['Sheffield', 'Europe', 'Europe', 'Europe', 'Europe', 'Europe', 'Europe']);
  assert.equal(CHAPTER_1.shots.reduce((a, s) => a + s.duration, 0), 17);
  assert.ok(CHAPTER_1.shots[0].fadeIn > 0, 'the loop fades in');
  assert.ok(CHAPTER_1.shots.at(-1).fadeOut > 0, 'the chapter fades out');
});
```

- [ ] **Step 2: Run it**

Run: `node --test 'tests/reel/*.test.js'`
Expected: `ℹ pass 88`, `ℹ fail 0`.

- [ ] **Step 3: Shift the page checks.** Apply these replacements to `tests/reel/page-check.sh`:

`tests/reel/page-check.sh`, change 1. Find:

```bash
d=$(dom 1440,900 '?reel=9');  expect 'New York lights step 2' "$d" 'data-chapter="1"' '>New York<' 'class="step is-live" data-org="columbia"'
d=$(dom 1440,900 '?reel=15'); expect 'Michigan lights step 3' "$d" 'data-chapter="2"' 'class="step is-live" data-org="msu"'
d=$(dom 1440,900 '?reel=21'); expect 'California lights step 4' "$d" 'data-chapter="3"' 'class="step is-live" data-org="amazon"'
d=$(dom 1440,900 '?reel=29'); expect 'To be continued keeps step 4 lit' "$d" 'data-chapter="4"' '>To be continued…<' 'class="step is-live" data-org="amazon"'
```

Replace with:

```bash
d=$(dom 1440,900 '?reel=19'); expect 'New York lights step 2' "$d" 'data-chapter="1"' '>New York<' 'class="step is-live" data-org="columbia"'
d=$(dom 1440,900 '?reel=25'); expect 'Michigan lights step 3' "$d" 'data-chapter="2"' 'class="step is-live" data-org="msu"'
d=$(dom 1440,900 '?reel=31'); expect 'California lights step 4' "$d" 'data-chapter="3"' 'class="step is-live" data-org="amazon"'
d=$(dom 1440,900 '?reel=39'); expect 'To be continued keeps step 4 lit' "$d" 'data-chapter="4"' '>To be continued…<' 'class="step is-live" data-org="amazon"'
```

`tests/reel/page-check.sh`, change 2. Find:

```bash
expect 'shot loop debug plays that shot' "$(dom 1440,900 '?reel=ch1-europe')" 'data-state="playing"' '>Europe<'
```

Replace with:

```bash
expect 'shot loop debug plays that shot' "$(dom 1440,900 '?reel=ch1-trolltunga')" 'data-state="playing"' '>Europe<'
```

- [ ] **Step 4: Run the page checks**

Run: `tests/reel/page-check.sh`
Expected: 15 `ok` lines (including `caption switches to Europe inside chapter 1` and `shot loop debug plays that shot`) and exit 0.

- [ ] **Step 5: Bring the spec in line with what was built.** Apply these replacements to `docs/superpowers/specs/2026-10-03-life-reel-design.md`:

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 1. Find:

```markdown
The full loop runs about 55 s, and the timings below are targets. The caption is the place name and fades in at the top left whenever it changes.
```

Replace with:

```markdown
The full loop runs about 56 s, and the timings below are targets. The caption is the place name and fades in at the top left whenever it changes.
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 2. Find:

```markdown
### 1 · Sheffield → Europe (~16 s). Caption: `Sheffield`, switching to `Europe` when the train leaves
```

Replace with:

```markdown
### 1 · Sheffield → Europe (~17 s). Caption: `Sheffield`, switching to `Europe` when the train leaves
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 3. Find:

```markdown
2. A train. Paris, Rome, Barcelona and the Alps flash past the window, about 1 s each. Passport stamps land in a corner of the frame faster and faster.
```

Replace with:

```markdown
2. Inside a train carriage: Yimeng sits by the window while Paris, Rome, Barcelona and the Alps stream past, about 1 s each, with a tunnel between cities. Passport stamps pile up on the carriage wall, faster and faster.
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 4. Find:

```markdown
7. A plane takes off west.
```

Replace with:

```markdown
7. A plane climbs out under the same aurora, bound for New York.
```

- [ ] **Step 6: Review on the real page.** With the server running:

```bash
node tests/reel/shoot.mjs 'http://127.0.0.1:8000/?reel=4.6' /tmp/page-train.png --scroll '#reel'
node tests/reel/shoot.mjs 'http://127.0.0.1:8000/?reel=13.4' /tmp/page-troll.png --width 390 --height 844 --mobile --scroll '#reel'
```

Expected:
- **Desktop:** the train interior under the dark top fade, with the caption `EUROPE` and `01` amber.
- **Phone:** Trolltunga with the caption `EUROPE`.

- [ ] **Step 7: Commit**

```bash
git add tests/reel/ch1-chapter.test.js tests/reel/page-check.sh docs/superpowers/specs/2026-10-03-life-reel-design.md
git commit -m "test(reel): Lock chapter 1 running order; shift page checks; update spec"
```

- [ ] **Step 8: Hand over for review.** Give the user these links (server on port 8000):
- `http://127.0.0.1:8000/`: scroll to the reel; chapter 1 plays first.
- `http://127.0.0.1:8000/?reel=ch1-train`, `?reel=ch1-lisbon`, `?reel=ch1-ring`, `?reel=ch1-trolltunga`, `?reel=ch1-iceland`: each loops one shot.

Ask in particular whether the Golf's colour should change (Tornado Red is the default), and whether the train shot, which became an interior view, works. Stop there: chapter 2 gets its own plan after this review.
