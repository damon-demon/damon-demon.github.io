# Life Reel — Phase 3 (Chapter 2: New York) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace chapter 2's beach stand-in with the real chapter: five shots, 11.7 s in all. Yimeng arrives at Low Library in autumn, then walks through Art Deco Manhattan at night to a three-star restaurant. Next come dinner (one tiny bite per course, twelve courses, a champagne tower and a bill down to the floor) and *The Starry Night* at MoMA. The chapter ends back on the Low Steps for the 2019 cap toss, where Yimeng's cap lands on a puppy and the falling caps turn into snow.

**Architecture:** Same scene contract as Phase 2: `{ build(W, H) → { layers: Painters, … }, render(ctx, t, scene, env) }`, one module per location under `reel/ch2/`, collected in `reel/ch2/index.js` as `CHAPTER_2`. The Low Library set is built once in `columbia.js` and reused, in spring, by `graduation.js`. The cast gains one pose, `cheer`: the gown, bareheaded and bouncing, for the cap toss. Each scene exports the small pure functions its tests need: `camAt`, `starsLit`, `courseAt`, `billAt` and `capPath`.

**Tech Stack:** Vanilla JS (ES modules, Canvas 2D), Node 25 `node:test`, headless Chrome review tools from Phase 2.

**Spec:** `docs/superpowers/specs/2026-10-03-life-reel-design.md`, chapter 2 storyboard. **Builds on:** `docs/superpowers/plans/2026-10-03-life-reel-phase-2.md` and its revisions 2b–2d.

## Global Constraints

- Everything in the Phase 2 plan's Global Constraints still holds:
  - no framework, no build step, no npm dependencies
  - English on-screen text
  - native height 96 px; every scene must read at native widths 195, 480 and 640
  - deterministic scenes: a seeded PRNG, never `Math.random`
  - the existing golden tests keep passing untouched
  - branch `life-reel`; do not merge, do not push
- Every chapter 2 shot is captioned `New York`, and the chapter is named `New York`.
- Outfits:
  - `nyc` (camel coat, scarf): the Columbia arrival, the night walk and MoMA
  - `michelin` (burgundy blazer, black tee): dinner, seated (`sit` pose)
  - `columbia` (gown and mortarboard): the graduation, `cheer` pose once the cap is thrown
- The dog first appears in the graduation, as the `pup` (the puppy in its Columbia-blue bandana).
- Sprite placement: a hero sprite drawn at `x - anchorX` puts the character's left edge at `x`. The body's middle is 9 px right of `x`, and the face reaches about 20 px right of it. Tables, doors and paintings are placed against those numbers.
- Chapter 2 lasts 11.7 s, so chapters 3–5 start later. The page checks move to 19 / 31 / 39 / 45 s in Task 7.

## File structure

| File | Responsibility |
|---|---|
| `reel/hero.js` (modify) | + the `cheer` pose: 2 frames, `stand` legs, bouncing, hats left off |
| `tests/reel/fake-canvas.js` (modify) | `fakeEnv` gives every pose except `walk` 2 frames, as the real cast does |
| `reel/ch2/columbia.js` | The Low Library set (`buildSet`, `drawAlmaMater`, `WALK`) and shot 1, the autumn arrival |
| `reel/ch2/night.js` | Shot 2: the skyline, the tilt down, the starred door. Exports `camAt`, `starsLit` |
| `reel/ch2/michelin.js` | Shot 3: the dinner. Exports `courseAt`, `billAt` |
| `reel/ch2/moma.js` | Shot 4: the gallery and *The Starry Night* (4 swirl frames) |
| `reel/ch2/graduation.js` | Shot 5: the cap toss, the puppy, caps into snow. Exports `capPath` |
| `reel/ch2/index.js` | `CHAPTER_2`: the shots with durations, captions and fades |
| `reel/story.js` (modify) | Chapter 2 becomes `CHAPTER_2` |
| `tests/reel/ch2-*.test.js` | One test file per shot, plus `ch2-chapter.test.js` |
| `tests/reel/page-check.sh` (modify) | Times shifted for the 11.7 s chapter 2 |

## How to run things

- Unit tests: `node --test 'tests/reel/*.test.js'` (quote the glob).
- Page checks: `tests/reel/page-check.sh`. Tasks 2–6 change chapter 2's length one shot at a time, so the time-based page checks only line up again in Task 7. Run them in Tasks 1 and 7 only.
- Frame review: keep `python3 -m http.server 8000 --bind 127.0.0.1` running from the repo root. Then run `node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times …` and `python3 tests/reel/sheet.py /tmp/f /tmp/f.png 2`. For a phone, use `--width 390 --mobile`. Delete the output folder between runs (`rm -rf /tmp/f`).
- Chapter 2 starts at 17.5 s. Shot start times: Columbia 17.5, night 19.5, Michelin 21.9, MoMA 24.9, graduation 26.4.

---

### Task 1: The cheer pose

**Files:**
- Modify: `reel/hero.js`, `tests/reel/fake-canvas.js`
- Test: `tests/reel/hero.test.js` (append)

**Interfaces:**
- Produces: `heroSprite(key, 'cheer')`. It has 2 frames, 42×50, `anchorX` 9 and `footY` 44. Both feet are planted (`stand` legs), the arm swings forward then back with a 1 px bounce, and hats, pompom and tassel are left off. A pose frame is now `[legs, arm, bob, bare]`.
- Produces: `fakeEnv().hero(key, pose)` returns 4 frames for `walk` and 2 for every other pose.

- [ ] **Step 1: Write the failing test.** Append to `tests/reel/hero.test.js`:

```js
test('the cheer pose throws the cap: two bouncing frames, bareheaded', () => {
  const cheer = heroSprite('columbia', 'cheer'), worn = heroSprite('columbia');
  const capPixels = (f) => f.join('').replace(/[^Jj]/g, '').length;          // the mortarboard's colours
  assert.equal(cheer.frames.length, 2);
  assert.ok(capPixels(worn.frames[1]) > 20, 'the walking gown wears the mortarboard');
  assert.deepEqual(cheer.frames.map(capPixels), [0, 0]);
  assert.notDeepEqual(cheer.frames[0], cheer.frames[1]);
  assert.deepEqual([cheer.width, cheer.height, cheer.anchorX, cheer.footY], [42, 50, 9, 44]);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test 'tests/reel/hero.test.js'`
Expected: 1 failure in `the cheer pose throws the cap …` (`unknown pose: cheer`).

- [ ] **Step 3: Implement.** Apply these replacements. Each "find" text occurs exactly once in its file.

`reel/hero.js`, change 1. Find:

```js
// Poses as frame lists of [legs, arm, bob]. Walk contact frames sit 1px lower.
```

Replace with:

```js
// Poses as frame lists of [legs, arm, bob, bare]. Walk contact frames sit 1px lower. `cheer` is
// the cap toss: feet planted, bouncing, and bareheaded, because the hat is in the air.
```

`reel/hero.js`, change 2. Find:

```js
  sit: [['sitA', 'mid', 0], ['sitB', 'mid', 0]],
};
```

Replace with:

```js
  sit: [['sitA', 'mid', 0], ['sitB', 'mid', 0]],
  cheer: [['stand', 'fwd', 1, true], ['stand', 'mid', 0, true]],
};
```

`reel/hero.js`, change 3. Find:

```js
function frame(o, [legsKey, armKey, bob]) {
```

Replace with:

```js
function frame(o, [legsKey, armKey, bob, bare = false]) {
```

`reel/hero.js`, change 4. Find:

```js
  for (const hat of o.hats || []) stampHat(c, HAT[hat], X, Y + bob - (hat === 'mortar' || hat === 'tam' ? 1 : 0));
  if (o.pom) c.stamp(POM, X, Y - 2 + bob);
  if (o.tassel) for (let y = 0; y < 6; y++) c.set(X + 16, Y + y + bob, o.tassel);
```

Replace with:

```js
  if (!bare) {
    for (const hat of o.hats || []) stampHat(c, HAT[hat], X, Y + bob - (hat === 'mortar' || hat === 'tam' ? 1 : 0));
    if (o.pom) c.stamp(POM, X, Y - 2 + bob);
    if (o.tassel) for (let y = 0; y < 6; y++) c.set(X + 16, Y + y + bob, o.tassel);
  }
```

`reel/hero.js`, change 5. Find:

```js
// One outfit in one pose ('walk': 4 frames, 'sit': 2), plus what the engine needs to place it.
```

Replace with:

```js
// One outfit in one pose ('walk': 4 frames, 'sit' and 'cheer': 2), plus what the engine needs to place it.
```

`tests/reel/fake-canvas.js`, change 1. Find:

```js
    hero: (key, pose = 'walk') => sprite(`${key}:${pose}`, pose === 'sit' ? 2 : 4, { anchorX: 9, footY: 44, seatY: 38 }),
```

Replace with:

```js
    hero: (key, pose = 'walk') => sprite(`${key}:${pose}`, pose === 'walk' ? 4 : 2, { anchorX: 9, footY: 44, seatY: 38 }),
```

- [ ] **Step 4: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 99`, `ℹ fail 0`, then 15 `ok` lines and exit 0. The 19 golden walking outfits are unchanged, because only a new pose was added.

- [ ] **Step 5: Commit**

```bash
git add reel/hero.js tests/reel/fake-canvas.js tests/reel/hero.test.js
git commit -m "feat(reel): Add a bareheaded cheer pose for the cap toss"
```

---

### Task 2: Low Library, and the arrival in autumn

**Files:**
- Create: `reel/ch2/columbia.js`, `reel/ch2/index.js`
- Modify: `reel/story.js`
- Test: `tests/reel/ch2-columbia.test.js`

**Interfaces:**
- Produces:
  - `buildSet(W, H, season) → { set: Painter, cx }`, where `season` is `'autumn'` or `'spring'` and Low Library is centred at `cx = round(0.6 W)`.
  - `drawAlmaMater(ctx, env, cx)`.
  - `WALK = 90`, College Walk's row.
  - `columbia` (a scene). It exposes `cx` and `hx = round(0.34 W)`. Yimeng walks in to `hx`, stops at 1.2 s and stands with walk frame 1.
- Produces: `CHAPTER_2 = { name: 'New York', shots: […] }` in `reel/ch2/index.js`. Tasks 3–6 each add one shot.

- [ ] **Step 1: Write the failing test.** Create `tests/reel/ch2-columbia.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { columbia } from '../../reel/ch2/columbia.js';

sceneContract('ch2 Columbia', columbia, 2);

test('Columbia: Low Library and Alma Mater stand ahead of Yimeng', () => {
  const s = columbia.build(480, 96);
  assert.ok(s.cx > s.hx + 60, 'the library is centred well to the right');
  assert.equal(frameAt(columbia, 480, 0.5).ctx.draws('art').length, 1, 'Alma Mater on her pedestal');
});

test('Columbia: Yimeng walks in along College Walk, then stops and looks up', () => {
  const s = columbia.build(480, 96);
  assert.deepEqual(frameAt(columbia, 480, 1.6).ctx.draws('nyc:walk:1'), [[s.hx - 9, 90 - 44]]);
  const x = (t) => frameAt(columbia, 480, t).ctx.calls.find(c => String(c[1]).startsWith('nyc:walk'))[2];
  assert.ok(x(0.2) < x(1), 'walking right');
  assert.equal(x(1.5), x(1.9), 'then standing still');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test 'tests/reel/ch2-columbia.test.js'`
Expected: the file fails to load (`Cannot find module …/reel/ch2/columbia.js`).

- [ ] **Step 3: Implement.** Create `reel/ch2/columbia.js`:

```js
// Chapter 2, shot 1: Columbia. Low Memorial Library with Alma Mater on its steps, seen from College
// Walk in autumn. Yimeng arrives in the camel coat under falling leaves, stops and looks up. The set
// comes back in spring for the graduation (graduation.js).
import { Painter, rng } from '../pixels.js';
import { gradient, art } from '../kit.js';

export const WALK = 90;                        // College Walk: the row Yimeng's shoes rest on
const SEASONS = {
  autumn: { sky: [['#5d8fc8', 0], ['#7aa6d6', 0.3], ['#9cbfe2', 0.6], ['#c4dbef', 0.9]],
    leaf: ['#e8a832', '#cf6e2a', '#f2c862', '#b04a2a', '#8f3c22'] },
  spring: { sky: [['#4f8fd6', 0], ['#6fa6e0', 0.3], ['#95c0ea', 0.6], ['#c6def4', 0.9]],
    leaf: ['#5f9a46', '#4e8a3e', '#8fc060', '#3d6e34', '#2f5a2c'] },
};

// Alma Mater, seen from the front: a laurel wreath, arms held out in welcome, the sceptre in her
// right hand rising above her head, the open book on her lap, a throne under her.
const ALMA = art(`
..c................
.ccc...............
..c......www.......
..c.....wHHHw......
..c.....HfffH......
..c.....HfffH......
..c......HfH.......
..cb......H.....b..
..cBB...BBBBB..bB..
..c.BBBBBBBBBBBB...
..c....BBhBBBB.....
..c....BBhBBBB.....
..c...BBBhBBBBB....
..c...BwwwwwwwB....
..c..BBBBBBBBBBB...
..c..BBhBBBBhBBB...
....BBBhBBBBBhBBB..
...TTTTTTTTTTTTTTT.
...TtTTTTTTTTTTtTT.
`, { c: '#e2bf55', w: '#d7b44c', H: '#5f634e', f: '#8f9474', B: '#43463a', h: '#666a53', b: '#737860', T: '#2f3127', t: '#4a4c3e' }, '#1c1d16');

function library(p, cx) {
  const L = '#f0e9da', M = '#ddd3bd', S = '#c2b69b', D = '#a69a80', K = '#655b48';
  // the dome: the top of an ellipse whose centre sits below the drum, so it reads shallow
  for (let y = 20; y <= 33; y++) {
    const hw = 34 * Math.sqrt(Math.max(0, 1 - Math.pow((39 - y) / 19.5, 2)));
    for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) {
      const u = (x - cx) / hw;
      p.px(x, y, u < -0.45 && u > -0.85 ? '#e6e4dd' : u > 0.4 ? '#9d9a92' : (x + y) % 7 === 0 ? '#bdbab3' : '#c4c1ba');
    }
  }
  for (let x = cx - 36; x <= cx + 36; x++) { p.px(x, 32, '#a9a69e'); p.px(x, 33, '#d4d1ca'); }   // stepped rings
  for (let y = 34; y < 40; y++) for (let x = cx - 38; x <= cx + 38; x++) p.px(x, y, y === 34 ? L : y === 39 ? S : (x - cx + 60) % 6 === 0 ? S : M);   // drum
  // the attic over the portico, then the wings either side
  for (let y = 40; y < 45; y++) for (let x = cx - 58; x <= cx + 58; x++) p.px(x, y, y === 40 ? L : y === 44 ? S : M);
  for (const side of [-1, 1]) {
    for (let y = 44; y < 67; y++) for (let k = 51; k <= 100; k++) {
      const x = cx + side * k;
      let c = y === 44 ? L : y === 45 ? S : (k > 97 ? L : M);
      if (y > 60 && (y - 61) % 3 === 0) c = S;                                   // rusticated base
      p.px(x, y, c);
    }
    for (let k = 57; k <= 93; k += 9) {                                          // tall windows with lintels
      const x0 = side < 0 ? cx - k - 3 : cx + k;
      p.rect(x0 - 1, 49, 5, 1, L); p.rect(x0 - 1, 50, 5, 1, S);
      p.rect(x0, 51, 3, 9, K);
      p.px(x0, 52, '#8a96a8'); p.px(x0 + 1, 53, '#7a8698');
    }
  }
  // entablature: cornice with a shadow under it, the inscribed frieze, architrave
  for (let x = cx - 52; x <= cx + 52; x++) {
    p.px(x, 45, L); p.px(x, 46, D);
    for (const y of [47, 48]) p.px(x, y, M);
    if ((x - cx + 90) % 3 !== 0 && Math.abs(x - cx) < 46) p.px(x, 47, '#a89d85');   // the inscription
    p.px(x, 49, L); p.px(x, 50, S);
  }
  // the portico in shade behind the columns, with bronze doors
  for (let y = 51; y < 67; y++) for (let x = cx - 50; x <= cx + 50; x++) p.px(x, y, y < 53 ? K : D);
  for (const [dx, w, top] of [[0, 9, 55], [-30, 5, 58], [30, 5, 58]]) {
    p.rect(cx + dx - Math.floor(w / 2) - 1, top - 1, w + 2, 67 - top + 1, '#c09a48');
    p.rect(cx + dx - Math.floor(w / 2), top, w, 67 - top, '#4a3c2a');
  }
  // ten Ionic columns
  for (let i = 0; i < 10; i++) {
    const x = cx - 45 + i * 10;
    p.rect(x - 2, 51, 5, 1, L); p.px(x - 2, 52, S); p.px(x + 2, 52, S);          // capital with volutes
    for (let y = 52; y < 66; y++) { p.px(x - 1, y, L); p.px(x, y, M); p.px(x + 1, y, S); }
    p.rect(x - 2, 66, 5, 1, L);
  }
  // podium and the Low Steps, widening towards College Walk
  for (let x = cx - 104; x <= cx + 104; x++) { p.px(x, 67, L); p.px(x, 68, M); }
  for (let y = 69; y < 87; y++) {
    const hw = 104 + (y - 69) * 2.4, tread = (y - 69) % 2 === 0 || (y >= 76 && y <= 78);
    for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) p.px(x, y, tread ? '#e2dfd8' : '#bab6ae');
  }
  // Alma Mater's granite pedestal on the landing
  for (let y = 71; y < 82; y++) for (let x = cx - 9; x <= cx + 9; x++) p.px(x, y, y === 71 ? '#d1cec7' : y === 72 ? '#8f8b82' : x > cx + 6 ? '#8f8b82' : '#a9a59c');
}

function clouds(p, W, seed) {
  const r = rng(seed);
  for (let n = 0; n < Math.round(W / 120) + 1; n++) {
    const cx = r() * W, cy = 18 + r() * 14, len = 26 + r() * 30;
    for (let k = 0; k < 4; k++) {
      const w = len - k * 7, x0 = cx + k * 3.5 - len / 2;
      for (let i = 0; i < w; i++) p.px(x0 + i, cy - k, k === 0 ? '#c9d9ea' : '#f4f8fb');
    }
  }
}

function tree(p, x, base, r, leaf, seed) {
  const rr = rng(seed);
  for (let y = base - 16; y < base; y++) for (let k = 0; k < 3; k++) p.px(x - 1 + k, y, k === 2 ? '#3e2e22' : '#5a4232');
  p.px(x - 2, base - 1, '#5a4232'); p.px(x + 2, base - 1, '#3e2e22');
  for (const [ox, oy, rad] of [[0, -r - 12, r], [-r * 0.7, -r - 8, r * 0.75], [r * 0.7, -r - 7, r * 0.8], [0, -r * 1.6 - 12, r * 0.7]]) {
    for (let j = -rad; j <= rad; j++) for (let i = -rad; i <= rad; i++) {
      if (i * i + j * j > rad * rad) continue;
      const shade = i + j > rad * 0.6 ? 3 : i + j < -rad * 0.5 ? 2 : rr() < 0.25 ? 1 : 0;
      p.px(x + ox + i, base + oy + j, leaf[shade]);
    }
  }
}

function lamp(p, x, base) {
  for (let y = base - 15; y < base; y++) p.px(x, y, '#23302a');
  p.rect(x - 1, base - 2, 3, 2, '#23302a');
  p.rect(x - 1, base - 18, 3, 3, '#f6f4ec'); p.px(x - 1, base - 18, '#d9d6cc');
  p.px(x, base - 19, '#23302a');
  p.rect(x + 1, base - 13, 3, 6, '#9cc7ea'); p.px(x + 3, base - 13, '#6f9fca'); p.px(x + 2, base - 11, '#f4f1ea');   // Columbia banner
}

// The whole set: sky, Low Library, trees and lamps along College Walk, the brick walk itself.
// season: 'autumn' or 'spring'. Low Library is centred at cx.
export function buildSet(W, H, season) {
  const S = SEASONS[season], cx = Math.round(W * 0.6), p = new Painter(W, H);
  const sky = gradient(W, H, S.sky);
  p.data.set(sky.data);
  clouds(p, W, 5);
  library(p, cx);
  for (let k = -3; k <= 3; k++) {
    if (k === 0) continue;
    const x = cx + k * 66 + (k < 0 ? -58 : 58);
    if (x > -20 && x < W + 20) tree(p, x, 86, 10, S.leaf, 40 + k);
  }
  for (let y = 86; y < H; y++) for (let x = 0; x < W; x++) {                     // College Walk: granite kerb, brick
    const row = y - 87, brick = (x + (row % 2) * 3) % 6 === 0 || row % 3 === 2;
    p.px(x, y, y === 86 ? '#d6d3cc' : y === 87 ? '#a9a59c' : brick ? '#7e3b2e' : (x * 7 + y) % 11 === 0 ? '#b8604a' : '#a2503e');
  }
  for (let x = ((cx - 120) % 72 + 72) % 72; x < W; x += 72) lamp(p, x, 87);
  return { set: p, cx };
}

// Alma Mater on her pedestal, in front of the library centred at cx.
export function drawAlmaMater(ctx, env, cx) {
  ctx.drawImage(env.art(ALMA), cx - Math.floor(ALMA.w / 2), 72 - ALMA.h);
}

export function buildColumbia(W, H = 96) {
  const { set, cx } = buildSet(W, H, 'autumn');
  const r = rng(17), leaves = [];
  for (let n = 0; n < Math.round(W / 12); n++) {
    leaves.push({ x: r() * W, y: r() * 86, v: 10 + r() * 9, sway: 2 + r() * 3, ph: r() * 6, c: SEASONS.autumn.leaf[Math.floor(r() * 4)] });
  }
  return { W, H, cx, hx: Math.round(W * 0.34), leaves, layers: { set } };
}

export function renderColumbia(ctx, t, s, env) {
  const { W, H, canvases: c } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.set, 0, 0);
  drawAlmaMater(ctx, env, s.cx);
  for (const l of s.leaves) {                                                    // leaves drifting down
    const y = (l.y + t * l.v) % 92, x = l.x + Math.sin(t * 2 + l.ph) * l.sway - t * 4;
    const lx = Math.round(((x % W) + W) % W), ly = Math.round(y), flip = Math.floor(t * 5 + l.ph) % 2;
    ctx.fillStyle = l.c;
    ctx.fillRect(lx, ly, 2, 1); ctx.fillRect(lx + (flip ? 1 : 0), ly + 1, 1, 1);
  }
  const hero = env.hero('nyc'), stopAt = 1.2;                                    // walks in, stops, looks up
  const x = s.hx - Math.max(0, stopAt - t) * 26;
  ctx.drawImage(hero.canvases[t < stopAt ? Math.floor(t * 6) % 4 : 1], Math.round(x) - hero.anchorX, WALK - hero.footY);
}

export const columbia = { build: buildColumbia, render: renderColumbia };
```

Create `reel/ch2/index.js`:

```js
// Chapter 2: New York, from the first day at Columbia to the cap toss.
import { columbia } from './columbia.js';

export const CHAPTER_2 = {
  name: 'New York',
  shots: [
    { id: 'ch2-columbia', scene: columbia, caption: 'New York', duration: 2, fadeIn: 0.35, fadeOut: 0.15 },
  ],
};
```

Apply to `reel/story.js`:

`reel/story.js`, change 1. Find:

```js
// The reel's running order. Phase 1: every chapter is a stand-in on the beach scene, so the
// controls, captions and timeline sync can be reviewed before the real chapters exist.
```

Replace with:

```js
// The reel's running order. Chapters that are not built yet are stand-ins on the beach scene, so the
// controls, captions and timeline sync work end to end in the meantime.
```

`reel/story.js`, change 2. Find:

```js
import { CHAPTER_1 } from './ch1/index.js';
```

Replace with:

```js
import { CHAPTER_1 } from './ch1/index.js';
import { CHAPTER_2 } from './ch2/index.js';
```

`reel/story.js`, change 3. Find:

```js
  { name: 'New York', shots: [standIn('ch2-new-york', 'New York', 6)] },
```

Replace with:

```js
  CHAPTER_2,
```

- [ ] **Step 4: Run the unit tests**

Run: `node --test 'tests/reel/*.test.js'`
Expected: `ℹ pass 103`, `ℹ fail 0`.

- [ ] **Step 5: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 18.2,19.2 && python3 tests/reel/sheet.py /tmp/f /tmp/f-col.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 19.2 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-col.png 3
```

Expected:
- Low Library on a clear autumn day: a shallow grey dome on its drum, an attic, ten Ionic columns before a shaded portico with bronze doors, wings with tall windows, and the broad Low Steps.
- Alma Mater on her granite pedestal, with her gold sceptre, wreath and book.
- Gold and red trees and lamp posts with Columbia-blue banners along a brick College Walk, and leaves drifting down.
- Yimeng in the camel coat and scarf walks in from the left and stops before the steps.

- [ ] **Step 6: Commit**

```bash
git add reel/ch2/columbia.js reel/ch2/index.js reel/story.js tests/reel/ch2-columbia.test.js
git commit -m "feat(reel): Open chapter 2 at Low Library in autumn"
```

---

### Task 3: Manhattan by night, in black and gold

**Files:**
- Create: `reel/ch2/night.js`
- Modify: `reel/ch2/index.js`
- Test: `tests/reel/ch2-night.test.js`

**Interfaces:**
- Produces: `camAt(t)`. The camera tracks at 26 px/s, eases to a stop between 1.15 and 1.5 s, and stays at about 34.5 px.
- Produces: `starsLit(t) → 0..3`, with the stars lighting at 1.5, 1.66 and 1.82 s.
- Produces: `night` (a scene). It exposes `door` (the world x of the door's centre) and `sign`.
  - Its `street` layer starts 118 rows down and is in place from 1.25 s.
  - Yimeng's middle reaches the door at 1.95 s, and Yimeng fades out into its light by 2.25 s.

- [ ] **Step 1: Write the failing test.** Create `tests/reel/ch2-night.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { night, camAt, starsLit } from '../../reel/ch2/night.js';

sceneContract('ch2 night', night, 2.4);

const heroAt = (t) => frameAt(night, 480, t).ctx.calls.filter(c => c[0] === 'drawImage' && String(c[1]).startsWith('nyc:walk'));

test('night: it opens on the skyline and tilts down to the street', () => {
  const streetY = (t) => frameAt(night, 480, t).ctx.draws('street')[0][1];
  assert.ok(streetY(0) >= 96, 'the street starts below the frame');
  assert.ok(streetY(0.8) > 0 && streetY(0.8) < streetY(0), 'rising into view');
  assert.equal(streetY(1.4), 0, 'then in place');
});

test('night: the camera tracks Yimeng at walking pace, then eases to a stop', () => {
  assert.equal(camAt(0.5), 13);
  assert.ok(camAt(1.45) - camAt(1.4) < 0.5, 'slowing down');
  assert.equal(camAt(1.6), camAt(2.4), 'stopped');
});

test('night: three stars light up over the door, one by one', () => {
  assert.deepEqual([1.4, 1.55, 1.7, 1.9].map(starsLit), [0, 1, 2, 3]);
});

test('night: Yimeng reaches the door as the third star is lit, and goes in', () => {
  const s = night.build(480, 96), [[, , x]] = heroAt(1.95);
  assert.ok(Math.abs(x + 9 + 9 - (s.door - camAt(1.95))) <= 1, "Yimeng's middle is at the door");
  assert.equal(heroAt(2.3).length, 0, 'and has gone inside');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test 'tests/reel/ch2-night.test.js'`
Expected: the file fails to load (`Cannot find module …/reel/ch2/night.js`).

- [ ] **Step 3: Implement.** Create `reel/ch2/night.js`:

```js
// Chapter 2, shot 2: Manhattan by night, in black and gold. The camera opens on the Art Deco crowns
// of the Chrysler and Empire State buildings, a sunburst and sweeping searchlights, then tilts down
// to the street, where Yimeng walks up to a black-and-gold restaurant. Three stars light up above its
// door, one by one, and in Yimeng goes.
import { Painter, rng } from '../pixels.js';
import { gradient, art } from '../kit.js';

const V = 26;                                // walk speed, px/s
const STOP = [1.15, 1.5];                    // the camera slows over this span and stops; Yimeng walks on
const TILT = [0.3, 1.25];                    // the tilt down from the crowns to the street
const SIDEWALK = 87;                         // the row Yimeng's shoes rest on
const STARS_AT = [1.5, 1.66, 1.82];          // each Michelin star lights up
const ENTER = 1.95;                          // Yimeng steps into the door's light

const SKY = [['#060609', 0], ['#0a0b12', 0.3], ['#10121d', 0.6], ['#1a1a24', 0.85], ['#262218', 0.97]];
const GOLD = '#d9b44a', DEEP = '#9c7c2c', LIT = '#f2d27a', WARM = '#ffe6a6', BLACK = '#0c0c11';

const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : (1 - Math.cos(u * Math.PI)) / 2);
export const starsLit = (t) => STARS_AT.filter(at => t >= at).length;
const tiltAt = (t) => ease((t - TILT[0]) / (TILT[1] - TILT[0]));

// How far the camera has tracked Yimeng: walking pace, then easing to a stop.
export function camAt(t) {
  const [a, b] = STOP, u = Math.min(Math.max(t, a), b) - a;
  return V * Math.min(t, a) + V * (u - (u * u) / (2 * (b - a)));
}

const STAR = art(`
...#...
..###..
#######
.#####.
..###..
.##.##.
.#...#.
`, { '#': '#ffd75e' });
const STAR_OFF = { ...STAR, palette: { '#': '#3b3322' } };

// ---------- the skyline ----------
// Every tall layer is drawn in street-view coordinates: row 0 of a Painter sits `top` rows above
// the view, and the tilt starts with each layer pushed down by its own `range`.
const MID = { top: 64, range: 84 }, FAR = { top: 26, range: 46 }, STREET = { top: 0, range: 118 };

function windows(p, x0, x1, y0, y1, r, far) {
  // Deco towers light in vertical runs, not confetti: each column of windows is on or off in stretches
  for (let x = x0; x <= x1; x += 2) {
    let on = r() < 0.35;
    for (let y = y0; y <= y1; y += 2) {
      if (r() < 0.18) on = !on;
      if (on) p.px(x, y, far ? (r() < 0.2 ? '#5e4c26' : '#3c3320') : r() < 0.12 ? WARM : r() < 0.5 ? '#c9a24a' : '#8a6e30');
    }
  }
}

function decoTower(p, x, w, top, base, r, far) {
  const body = far ? '#13141c' : BLACK;
  const steps = [[0, 0], [Math.round((base - top) * 0.12), 2], [Math.round((base - top) * 0.26), 3]];
  for (const [dy, inset] of [...steps].reverse()) {
    for (let y = top + dy; y < base; y++) for (let i = x + inset; i < x + w - inset; i++) p.px(i, y, body);
  }
  steps.forEach(([dy, inset], k) => {
    if (far) return;
    for (let i = x + inset; i < x + w - inset; i++) p.px(i, top + dy, k === 0 ? LIT : GOLD);       // gold setback lines
  });
  windows(p, x + 2, x + w - 3, top + 4, base - 2, r, far);
}

function chrysler(p, x, top, base) {
  for (let y = top; y < top + 13; y++) p.px(x, y, y < top + 5 ? '#f4f1e6' : '#c8ccd4');          // the spire
  const arches = [[10, top + 38], [8.2, top + 31], [6.4, top + 24.5], [4.6, top + 18.5]];          // [radius, centre row]
  for (const [rad, cy] of arches) {
    for (let y = Math.round(cy - rad * 1.35); y <= cy; y++) for (let i = -rad; i <= rad; i++) {    // fill the terrace
      if ((i * i) / (rad * rad) + Math.pow((cy - y) / (rad * 1.35), 2) <= 1) p.px(x + i, y, '#16171e');
    }
    for (let a = 0; a <= Math.PI + 0.01; a += 0.03) p.px(Math.round(x + Math.cos(a) * rad), Math.round(cy - Math.sin(a) * rad * 1.35), '#e6e9ee');
    for (let a = 0.3; a < Math.PI - 0.15; a += 0.48) {                                            // triangular windows, lit
      const wx = Math.round(x + Math.cos(a) * (rad - 1.8)), wy = Math.round(cy - Math.sin(a) * (rad - 1.8) * 1.35);
      p.px(wx, wy, WARM); p.px(wx, wy + 1, LIT); p.px(wx - 1, wy + 1, GOLD); p.px(wx + 1, wy + 1, GOLD);
    }
  }
  for (let y = top + 38; y < base; y++) for (let i = -11; i <= 11; i++) p.px(x + i, y, Math.abs(i) === 11 ? '#2a2b33' : BLACK);
  for (let i = -12; i <= 12; i++) { p.px(x + i, top + 39, '#c8ccd4'); p.px(x + i, top + 50, GOLD); }   // the eagles' ledge
  p.px(x - 12, top + 40, '#c8ccd4'); p.px(x + 12, top + 40, '#c8ccd4');
  for (let y = top + 42; y < base; y += 2) for (let i = -9; i <= 9; i += 2) if ((i * 7 + y) % 5) p.px(x + i, y, (i + y) % 3 ? '#a8862a' : '#5a4a26');
}

function empire(p, x, top, base) {
  for (let y = top; y < top + 12; y++) p.px(x, y, y === top ? '#ff4a4a' : '#9aa0aa');               // the mast, red light on top
  for (let y = top + 12; y < top + 20; y++) for (let i = -2; i <= 2; i++) p.px(x + i, y, (y + i) % 2 ? '#ffe9b0' : '#e8c070');   // floodlit lantern
  for (const [y0, hw] of [[top + 20, 4], [top + 25, 6], [top + 33, 8], [top + 44, 11]]) {
    for (let y = y0; y < base; y++) for (let i = -hw; i <= hw; i++) p.px(x + i, y, Math.abs(i) === hw ? '#2a2b33' : BLACK);
    for (let i = -hw; i <= hw; i++) p.px(x + i, y0, y0 < top + 30 ? WARM : GOLD);
  }
  for (let y = top + 22; y < base; y += 2) for (let i = -9; i <= 9; i += 2) if (Math.abs(i) < (y < top + 33 ? 5 : y < top + 44 ? 7 : 10) && (i * 5 + y) % 7) p.px(x + i, y, (i + y) % 4 ? '#c9a24a' : '#f2d27a');
}

// A faint Art Deco sunburst fanning out behind the skyline, like a 1930s poster.
function sunburst(W, H) {
  const p = new Painter(W, H), ox = W / 2, oy = 92;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const a = Math.atan2(oy - y, x - ox), ray = Math.floor((a / Math.PI) * 26) % 2 === 0;
    const d = Math.hypot(x - ox, (oy - y) * 1.6);
    if (ray && d > 30 && (x + y) % 2 === 0) p.px(x, y, d < 120 ? '#2a2414' : '#1c1a14');
  }
  return p;
}

function buildMid(W) {
  const LH = MID.top + 60, p = new Painter(W + 80, LH), r = rng(7);
  for (let x = -6; x < W + 80; x += 18 + Math.floor(r() * 10)) {
    const w = 14 + Math.floor(r() * 10), top = 40 + Math.floor(r() * 40);
    decoTower(p, x, w, top, LH, r, false);
  }
  chrysler(p, Math.round(W * 0.26) + 20, 0, LH);
  empire(p, Math.round(W * 0.72) + 20, 12, LH);
  return p;
}

function buildFar(W) {
  const LH = FAR.top + 60, p = new Painter(W + 40, LH), r = rng(13);
  for (let x = -4; x < W + 40; x += 10 + Math.floor(r() * 9)) decoTower(p, x, 12 + Math.floor(r() * 9), 6 + Math.floor(r() * 34), LH, r, true);
  return p;
}

// ---------- the street ----------
function facade(p, x, w, top, r, kind) {
  for (let y = top; y < 84; y++) for (let i = x; i < x + w; i++) p.px(i, y, BLACK);
  for (let i = x; i < x + w; i++) { p.px(i, top, GOLD); p.px(i, top + 2, DEEP); }
  for (let i = x + 1; i < x + w - 1; i++) if ((i - x) % 4 < 2) p.px(i, top + 1, GOLD); else p.px(i, top + 3, GOLD);   // chevron frieze
  const sx = x + Math.round(w / 2);
  if (kind === 0) {                                                            // a shop window under a sunburst
    for (let i = x + 5; i < x + w - 5; i += 6) for (let y = top + 7; y < 62; y += 5) if (r() < 0.55) p.rect(i, y, 3, 3, r() < 0.3 ? WARM : '#c9a24a');
    p.rect(sx - 9, 70, 18, 13, '#2a2010'); p.rect(sx - 8, 71, 16, 11, '#e2b860'); p.rect(sx - 8, 78, 16, 1, '#b8903a');
    for (let k = 0; k < 7; k++) {
      const a = Math.PI * (k + 0.5) / 7;
      for (let q = 2; q < 6; q++) p.px(Math.round(sx + Math.cos(a) * q * 1.6), Math.round(69 - Math.sin(a) * q), GOLD);
    }
  } else if (kind === 1) {                                                     // tall fluted piers, a gold canopy over the entrance
    for (let i = x + 3; i < x + w - 3; i += 4) for (let y = top + 6; y < 84; y++) p.px(i, y, (y + i) % 9 ? '#1e1b12' : '#3a3018');
    for (let i = x + 5; i < x + w - 5; i += 4) for (let y = top + 8; y < 66; y += 3) if (r() < 0.4) p.rect(i, y, 2, 2, '#c9a24a');
    p.rect(sx - 8, 69, 16, 2, GOLD); p.rect(sx - 7, 71, 14, 1, DEEP);
    p.rect(sx - 4, 72, 8, 12, '#3a2c14'); p.rect(sx - 3, 73, 6, 11, '#d9b060'); p.rect(sx, 73, 1, 11, DEEP);
  } else {                                                                     // an apartment block, a few windows lit
    for (let i = x + 4; i < x + w - 4; i += 5) for (let y = top + 7; y < 80; y += 6) {
      const v = r();
      p.rect(i, y, 3, 4, v < 0.3 ? '#e2b860' : v < 0.45 ? WARM : '#1a1a22');
      p.rect(i - 1, y + 4, 5, 1, '#2a2618');
    }
  }
}

function restaurant(p, x) {
  // black marble, gold-edged; a double door full of warm light under the star sign
  const w = 64, top = 40;
  for (let y = top; y < 84; y++) for (let i = x; i < x + w; i++) p.px(i, y, (i * 3 + y * 7) % 23 === 0 ? '#24242c' : '#101014');
  for (let i = x; i < x + w; i++) { p.px(i, top, GOLD); p.px(i, top + 1, DEEP); }
  for (let y = top; y < 84; y++) { p.px(x, y, GOLD); p.px(x + w - 1, y, GOLD); }
  const dx = x + 25;
  p.rect(dx - 2, 58, 18, 26, GOLD); p.rect(dx - 1, 59, 16, 25, '#3a2c14');      // door frame
  p.rect(dx, 60, 6, 24, WARM); p.rect(dx + 8, 60, 6, 24, WARM);                  // glass doors
  for (const gx of [dx + 6, dx + 7]) for (let y = 60; y < 84; y++) p.px(gx, y, DEEP);
  for (const [i, y] of [[dx + 4, 71], [dx + 9, 71]]) p.rect(i, y, 1, 3, DEEP);   // handles
  p.rect(dx - 6, 44, 26, 11, GOLD); p.rect(dx - 5, 45, 24, 9, '#0b0b0e');        // the star sign
  for (const tx of [x + 6, x + w - 12]) {                                        // topiaries in gold planters
    p.rect(tx, 77, 6, 7, GOLD); p.rect(tx + 1, 78, 4, 6, DEEP);
    for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (i * i + j * j <= 16) p.px(tx + 3 + i, 71 + j, (i + j) % 3 ? '#1f3a26' : '#2e5236');
  }
  for (let i = dx - 4; i < dx + 18; i++) for (let y = 84; y < 88; y++) p.px(i, y, y === 84 ? '#a8203a' : '#8a1830');   // red carpet
  return { door: dx + 7, sign: dx - 5 };
}

export function buildNight(W, H = 96) {
  const hx = Math.round(W * 0.34), run = W + 90;
  const st = new Painter(run, H), r = rng(21);
  const rx = Math.round(hx + V * ENTER + 9) - 32;                                // so the door's centre is where Yimeng's middle is at ENTER
  let x = -8;
  for (let n = 0; x < rx - 4; n++) { const w = Math.min(46 + Math.floor(r() * 20), rx - 4 - x); if (w > 20) facade(st, x, w, 46 + Math.floor(r() * 8), r, n % 3); x += w + 4; }
  const { door, sign } = restaurant(st, rx);
  x = rx + 68;
  for (let n = 1; x < run; n++) { facade(st, x, 50, 44 + (n % 2) * 6, r, n % 3); x += 54; }
  for (let lx = 30; lx < run; lx += 86) {                                         // Art Deco lamp posts
    if (Math.abs(lx - rx - 32) < 40) continue;
    for (let y = 64; y < 85; y++) st.px(lx, y, '#1a1a20');
    st.rect(lx - 2, 60, 5, 5, GOLD); st.rect(lx - 1, 61, 3, 3, WARM); st.rect(lx - 1, 84, 3, 1, GOLD);
  }
  for (let y = 84; y < H; y++) for (let i = 0; i < run; i++) {                   // sidewalk, kerb, street
    if (st.data[(y * run + i) * 4 + 3] && y < 88) continue;
    let c = y < 88 ? ((i + y * 3) % 9 === 0 ? '#26262e' : '#1c1c22') : y === 88 ? '#3a3a42' : '#101014';
    if (y > 89 && (i * 7 + y * 13) % 41 === 0) c = '#5a4a26';                     // gold reflections in the wet street
    st.px(i, y, c);
  }
  return {
    W, H, hx, door, sign, layers: { sky: gradient(W, H, SKY), burst: sunburst(W, H), far: buildFar(W), mid: buildMid(W), street: st },
    manhole: rx - 40,
  };
}

function beam(ctx, ox, oy, a, alpha) {
  ctx.fillStyle = `rgba(242, 210, 122, ${alpha})`;
  for (let y = oy; y >= 0; y--) {
    const d = oy - y, w = 2 + d * 0.09;
    ctx.fillRect(Math.round(ox + d * Math.tan(a) - w / 2), y, Math.round(w), 1);
  }
}

export function renderNight(ctx, t, s, env) {
  const { W, H, canvases: c } = s;
  const up = 1 - tiltAt(t), cam = camAt(t);                                      // up: 1 while the camera looks up at the crowns
  const yMid = -MID.top + up * MID.range, yFar = -FAR.top + up * FAR.range, yStreet = up * STREET.range;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  ctx.drawImage(c.burst, 0, Math.round(up * 30) - 30);
  beam(ctx, W * 0.18 - cam * 0.2, yFar + FAR.top + 40, -0.55 + Math.sin(t * 1.3) * 0.35, 0.2);   // searchlights
  beam(ctx, W * 0.82 - cam * 0.2, yFar + FAR.top + 40, 0.5 + Math.sin(t * 1.1 + 2) * 0.35, 0.17);
  ctx.drawImage(c.far, Math.round(-cam * 0.2), Math.round(yFar));
  ctx.drawImage(c.mid, Math.round(-cam * 0.45) - 20, Math.round(yMid));
  ctx.drawImage(c.street, -Math.round(cam), Math.round(yStreet));
  const sx = (x) => Math.round(x - cam), sy = (y) => Math.round(y + yStreet);
  // the three stars over the door
  STARS_AT.forEach((at, i) => {
    const on = i < starsLit(t), x = sx(s.sign + 1 + i * 8), y = sy(46);
    ctx.drawImage(env.art(on ? STAR : STAR_OFF), x, y);
    const flash = 1 - (t - at) / 0.2;
    if (on && flash > 0) {
      ctx.globalAlpha = flash; ctx.fillStyle = '#fff6d8';
      ctx.fillRect(x + 3, y - 3, 1, 13); ctx.fillRect(x - 3, y + 3, 13, 1);
      ctx.globalAlpha = 1;
    }
  });
  // steam rising from a manhole
  for (let k = 0; k < 5; k++) {
    const age = (t * 0.9 + k / 5) % 1, rad = 3 + age * 7;
    ctx.globalAlpha = 0.4 * (1 - age); ctx.fillStyle = '#d8d4cc';
    ctx.fillRect(sx(s.manhole + Math.sin(k * 2.1 + t) * 2) - rad, sy(90 - age * 26) - rad / 2, rad * 2, rad);
  }
  ctx.globalAlpha = 1;
  // Yimeng: tracked by the camera, then walking on into the restaurant's light
  const hero = env.hero('nyc'), wx = s.hx + V * t;
  if (t < ENTER + 0.3) {
    ctx.globalAlpha = Math.max(0, Math.min(1, 1 - (t - ENTER) / 0.3));
    ctx.drawImage(hero.canvases[Math.floor(t * 6) % 4], Math.round(wx - cam) - hero.anchorX, sy(SIDEWALK) - hero.footY);
    ctx.globalAlpha = 1;
  }
}

export const night = { build: buildNight, render: renderNight };
```

Replace `reel/ch2/index.js` with:

```js
// Chapter 2: New York, from the first day at Columbia to the cap toss.
import { columbia } from './columbia.js';
import { night } from './night.js';

export const CHAPTER_2 = {
  name: 'New York',
  shots: [
    { id: 'ch2-columbia', scene: columbia, caption: 'New York', duration: 2, fadeIn: 0.35, fadeOut: 0.15 },
    { id: 'ch2-night', scene: night, caption: 'New York', duration: 2.4, fadeIn: 0.15, fadeOut: 0.15 },
  ],
};
```

- [ ] **Step 4: Run the unit tests**

Run: `node --test 'tests/reel/*.test.js'`
Expected: `ℹ pass 109`, `ℹ fail 0`.

- [ ] **Step 5: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 19.8,20.5,21.3,21.65 && python3 tests/reel/sheet.py /tmp/f /tmp/f-night.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 19.8,21.4 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-night.png 3
```

Expected:
- 19.8 s:
  - A black sky with a faint gold sunburst fanning out behind the skyline, and two searchlights sweeping.
  - The Chrysler Building's crown of lit arches and its spire, and the Empire State Building's floodlit top with its red-tipped mast.
  - Black towers with gold setback lines and windows lit in vertical runs.
- 20.5 s: the camera has tilted down to the street. Black Art Deco facades with chevron friezes, sunbursts over shop windows, gold canopies and lamp posts. Yimeng walks towards a black marble restaurant with a gold door.
- 21.3 s: the camera has stopped. Two of the three stars over the door are lit, and steam rises from a manhole.
- 21.65 s: all three stars are lit, and Yimeng fades into the door's warm light.

- [ ] **Step 6: Commit**

```bash
git add reel/ch2/night.js reel/ch2/index.js tests/reel/ch2-night.test.js
git commit -m "feat(reel): Walk through Art Deco Manhattan to a three-star door"
```

---

### Task 4: Dinner at three stars

**Files:**
- Create: `reel/ch2/michelin.js`
- Modify: `reel/ch2/index.js`
- Test: `tests/reel/ch2-michelin.test.js`

**Interfaces:**
- Produces: `courseAt(t)`. It is 0 before 0.25 s, 1 while the cloche lifts, then 2 … 12 ticking evenly between 0.7 and 1.75 s.
- Produces: `billAt(scene, t) → { drop, run }`, the bill's length in px down the tablecloth (up to 14) and then along the floor. It unrolls between 2.35 and 2.95 s.
- Produces: `michelin` (a scene). It exposes `hx`, `plate` (`hx + 33`) and `tower` (`hx + 81`).
  - Yimeng sits with `michelin:sit:0` at `(hx - 9, 84 - 1 - seatY)`.
  - The table runs from `hx + 15` to `hx + 57`, and its top is row 76.

- [ ] **Step 1: Write the failing test.** Create `tests/reel/ch2-michelin.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { michelin, courseAt, billAt } from '../../reel/ch2/michelin.js';

sceneContract('ch2 Michelin', michelin, 3);

test('Michelin: Yimeng sits at the table in the burgundy blazer', () => {
  const s = michelin.build(480, 96);
  assert.deepEqual(frameAt(michelin, 480, 1).ctx.draws('michelin:sit:0'), [[s.hx - 9, 84 - 1 - 38]]);
});

test('Michelin: the course counter runs from 1/12 to 12/12, never backwards', () => {
  assert.equal(courseAt(0.1), 0, 'nothing is served before the cloche lifts');
  assert.equal(courseAt(0.5), 1);
  const seq = Array.from({ length: 300 }, (_, i) => courseAt(i * 0.01));
  assert.ok(seq.every((n, i) => i === 0 || n >= seq[i - 1]));
  assert.deepEqual([...new Set(seq.filter(n => n > 0))], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  assert.equal(courseAt(1.8), 12);
});

test('Michelin: the bill unrolls down to the floor and on along it', () => {
  const s = michelin.build(480, 96);
  assert.deepEqual(billAt(s, 2.3), { drop: 0, run: 0 });
  assert.equal(billAt(s, 3).drop, 90 - 76, 'from the table top to the floor');
  assert.ok(billAt(s, 3).run > s.hx, 'then most of the way across the floor');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test 'tests/reel/ch2-michelin.test.js'`
Expected: the file fails to load (`Cannot find module …/reel/ch2/michelin.js`).

- [ ] **Step 3: Implement.** Create `reel/ch2/michelin.js`:

```js
// Chapter 2, shot 3: dinner at a three-star restaurant. A gold-and-burgundy room under a crystal
// chandelier, the skyline in the windows. Yimeng, in the burgundy blazer, sits at a white table; the
// waiter lifts a silver cloche on one tiny bite in the middle of a huge plate. The courses run from
// 1/12 to 12/12 as the candle burns down, the sommelier fills a champagne tower, and the bill
// unrolls all the way down to the floor.
import { Painter, rng } from '../pixels.js';
import { art, label } from '../kit.js';

const FLOOR = 90, SEAT = 84, TOP = 76;        // floor, chair cushion and table-top rows
const LIFT = [0.25, 0.7];                     // the waiter lifts the cloche
const COURSES = [0.7, 1.75];                  // course 1 shows at LIFT; 2..12 tick by over this span
const POUR = [1.75, 2.35];                    // the champagne tower fills, top glass first
const BILL = [2.35, 2.95];                    // the bill drops to the floor and runs along it
const GOLD = '#d9b44a', DEEP = '#9c7c2c', CLOTH = '#f4f1ea', FOLD = '#d9d4ca';

// The waiter, facing left: slicked hair, a thin moustache, tailcoat and bow tie. The sommelier wears
// the same coat with grey hair.
const STAFF_ROWS = `
......HHH...........
....HHHHHHHHH.......
...HhhHHHHHHHHH.....
..HHHHHHHHHHHHHH....
.HHHHHHHHHHHHHHHH...
.HHHHHHHHHHHHHHHH...
.SHHHHHHHHHHHHHHHH..
.SSSSHHHHHHHHHHHHH..
.SSSSSSSSHHHHHHHHH..
.SSESSSSSSSSeeHHHH..
SSSSSSSSSSSSeqeHHH..
.SSSSSSSSSSSSeHHHH..
.sMMSSSSSSSSSSHHH...
..sSSSSSSSSSSSHH....
...ssSSSSSSSSs......
........SSS.........
......WbWKKKK.......
......WWWKKKKK......
......KWWKKKKK......
......KWWKKKKK......
......KKWKKKKKK.....
......KKKKKKKKKK....
......KKKKKKKKKKK...
.......PPPPPPKKKK...
.......PPP..PPP.....
.......PPP..PPP.....
.......PPP..PPP.....
.......PPP..PPP.....
.......PPP..PPP.....
.......PPP..PPP.....
.......PPP..PPP.....
.......PPP..PPP.....
.......PPP..PPP.....
.......PPP..PPP.....
......OOOO.OOOO.....
`;
const STAFF = { E: '#241c22', S: '#f0c8a4', s: '#d9a885', e: '#e0b08c', q: '#b88466', M: '#3a2a22', W: '#f6f4ee', b: '#1c1c22', K: '#1a1a20', P: '#22222a', O: '#121216' };
const WAITER = art(STAFF_ROWS, { ...STAFF, H: '#2a2026', h: '#4a3a40' }, '#141016');
const SOMMELIER = art(STAFF_ROWS, { ...STAFF, H: '#9a9aa4', h: '#c4c4cc', M: '#9a9aa4' }, '#141016');

const CLOCHE = art(`
......kk......
....SSSSSS....
..SSSSSSSSSS..
.SWSSSSSSSSSS.
.SWSSSSSSSSSs.
SWSSSSSSSSSSss
SSSSSSSSSSSSss
dddddddddddddd
`, { k: '#e6e8ee', S: '#c9ced8', W: '#ffffff', s: '#9aa0ac', d: '#7f8590' }, '#3a3d46');

const COUPE = art(`
#####
.###.
..#..
.###.
`, { '#': '#c8dce6' });
const COUPE_FULL = art(`
fffff
.fff.
..#..
.###.
`, { '#': '#c8dce6', f: '#f2d27a' });

const BOTTLE = art(`
.....GGG.
....GGGGG
...GGGGGG
..GGGGGG.
..GGGG...
.gGG.....
ggg......
gg.......
`, { g: '#e2bf55', G: '#1f3a2a' }, '#0e140f');

// one bite per course: a dab of colour in the middle of the plate
const BITES = ['#e8414b', '#f2c21e', '#4f9a4a', '#f4f1ea', '#c86a28', '#7b3fa0', '#2c5aa0', '#e8a0b0', '#3a2a22', '#a8d070', '#ffd75e', '#d63c8a'];

function room(W, H, hx) {
  const p = new Painter(W, H), r = rng(31), lx = hx + 36;                       // lx: the light pool's centre
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot((x - lx) / 1.7, (y - 72) * 1.1), warm = d < 30 || (d < 40 && (x + y) % 2 === 0) || (d < 48 && (x + y) % 4 === 0);   // candlelight warms the wall near the table
    let c = ((x >> 2) + (y >> 2)) % 2 === 0 && (x + y) % 3 === 0 ? (warm ? '#3a1c20' : '#24121a') : (warm ? '#2c1418' : '#1a0d12');   // damask
    if (y === 12 || y === 15) c = GOLD;
    if (y === 13 || y === 14) c = (x % 6 < 3) ? DEEP : '#5a4418';                // crown moulding
    if (y >= 64 && y < 80) c = (x % 26 === 0 || x % 26 === 25 || y === 67 || y === 77) && y > 66 ? DEEP : warm ? '#3a1a1e' : '#2a1418';
    if (y === 64) c = GOLD;
    if (y === 65) c = DEEP;
    if (y >= 80) c = ((x + y * 2) % 12 === 0 || (x - y * 2) % 12 === 0) ? '#6a3a22' : (x + y) % 2 ? '#3a1a1e' : '#341618';   // carpet
    p.px(x, y, c);
  }
  const windowAt = (x0) => {                                                    // a tall arched window on the skyline
    for (let y = 22; y < 62; y++) for (let x = x0; x < x0 + 34; x++) {
      const arch = y < 30 && Math.hypot(x - x0 - 16.5, (y - 30) * 2.1) > 17;
      if (arch) continue;
      let c = y < 38 ? '#0a0b16' : '#0e1022';
      if (y > 40 && ((x * 3 + y * 5) % 11 === 0 || (x % 4 === 0 && y % 3 === 0 && r() < 0.5))) c = r() < 0.5 ? '#c9a24a' : '#8a6e30';
      if (y > 52 && (x + y) % 3 === 0) c = '#14141c';
      p.px(x, y, c);
    }
    for (let y = 22; y < 62; y++) { p.px(x0 + 16, y, '#3a2a14'); p.px(x0 + 17, y, '#3a2a14'); }
    for (let x = x0 - 1; x <= x0 + 34; x++) p.px(x, 62, GOLD);
    for (const side of [0, 1]) for (let y = 17; y < 64; y++) for (let k = 0; k < 8; k++) {     // swagged curtains
      const x = side ? x0 + 34 - k + 4 : x0 + k - 4, tie = y > 48 && y < 51;
      p.px(x, y, tie ? GOLD : (k + Math.floor(y / 3)) % 3 === 0 ? '#4a1020' : '#7a1e30');
    }
  };
  const mirrorAt = (x0) => {                                                    // a gilt mirror between two sconces
    for (let y = 26; y < 58; y++) for (let x = x0; x < x0 + 20; x++) {
      const edge = x === x0 || x === x0 + 19 || y === 26 || y === 57;
      p.px(x, y, edge ? GOLD : (x + y) % 9 === 0 ? '#5a4a4e' : '#3a2e34');
    }
    for (let k = 0; k < 6; k++) p.px(x0 + 4 + k * 2, 29 + k, '#6a5a60');         // a streak of reflection
    for (const sx of [x0 - 7, x0 + 26]) {
      p.rect(sx, 40, 2, 5, GOLD); p.rect(sx - 1, 37, 4, 3, '#fff1c4'); p.px(sx, 36, '#ffd27a');
    }
  };
  windowAt(hx - 128); windowAt(hx + 132);
  if (W > 420) windowAt(hx + 262);
  mirrorAt(hx - 58); mirrorAt(hx + 196);
  for (let x = hx + 236; x < W; x += 400) {                                     // a tall arrangement of white and pink flowers
    p.rect(x - 2, 50, 5, 14, GOLD); p.rect(x - 1, 51, 3, 13, DEEP);
    for (let n = 0; n < 60; n++) {
      const a = r() * Math.PI, d = r() * 11;
      p.px(Math.round(x + Math.cos(a) * d * 1.3), Math.round(50 - Math.sin(a) * d), r() < 0.3 ? '#3d6e34' : r() < 0.5 ? '#f4c0d0' : '#fbf6ee');
    }
  }
  // other tables further back, each with a candle and two diners in silhouette
  for (let x = hx - 92; x < W + 30; x += 74) {
    if (x > hx - 30 && x < hx + 120) continue;
    for (let y = 72; y < 82; y++) for (let k = -9; k <= 9; k++) p.px(x + k, y, y === 72 ? '#d8d2c4' : (k + y) % 4 ? '#b9b2a4' : '#a39c8e');
    p.rect(x - 1, 68, 2, 4, '#e8e2d2'); p.px(x - 1, 67, '#ffd27a');
    for (const dx of [-15, 11]) {
      for (let y = 63; y < 82; y++) for (let k = 0; k < 5; k++) p.px(x + dx + k, y, y < 68 ? '#3a2a2a' : '#2a1e22');
      p.rect(x + dx, 58, 5, 5, '#3a2a2a');
    }
  }
  return p;
}

function table(W, H, hx) {
  const p = new Painter(W, H);
  for (let y = TOP; y < FLOOR + 2; y++) for (let x = hx + 15; x <= hx + 57; x++) {
    let c = y === TOP ? '#ffffff' : (x - hx) % 7 === 0 && y > TOP + 3 ? FOLD : CLOTH;
    if (y > FLOOR - 3) c = (x - hx) % 7 === 0 ? FOLD : '#e8e4da';
    p.px(x, y, c);
  }
  for (const [x0, x1] of [[hx + 22, hx + 23], [hx + 44, hx + 46]]) for (let x = x0; x <= x1; x++) p.px(x, TOP, '#aab0bc');   // cutlery glints
  return p;
}

function chair(W, H, hx) {
  const p = new Painter(W, H);
  for (let y = 62; y < FLOOR; y++) for (let x = hx + 1; x <= hx + 3; x++) p.px(x, y, x === hx + 1 ? '#3a1e12' : '#5a3020');
  for (let y = 61; y < 63; y++) for (let x = hx; x <= hx + 4; x++) p.px(x, y, GOLD);
  for (let x = hx + 1; x <= hx + 17; x++) { p.px(x, SEAT, '#8a2438'); p.px(x, SEAT + 1, '#5e1727'); p.px(x, SEAT + 2, '#3a1e12'); }
  for (let y = SEAT + 3; y < FLOOR; y++) { p.px(hx + 2, y, '#3a1e12'); p.px(hx + 16, y, '#3a1e12'); }
  return p;
}

function chandelier(W, H, cx) {
  const p = new Painter(W, 44);
  for (let y = 0; y < 16; y++) p.px(cx, y, DEEP);
  for (const [ry, hw] of [[21, 10], [27, 18]]) {                                 // two gilt rings
    for (let k = -hw; k <= hw; k++) { p.px(cx + k, ry, GOLD); p.px(cx + k, ry + 1, DEEP); }
    for (let k = -hw; k <= hw; k += Math.round(hw / 2.5)) {
      for (let y = 16; y < ry; y++) p.px(Math.round(cx + k * (y - 16) / (ry - 16)), y, GOLD);   // arms
      p.rect(cx + k - 1, ry - 3, 3, 3, '#f4f1ea'); p.px(cx + k, ry - 4, '#ffe6a6');   // candle bulbs
      for (let y = ry + 2; y < ry + 5 + (Math.abs(k) % 3); y++) p.px(cx + k, y, y % 2 ? '#e8f2fa' : '#b8cce0');   // crystal drops
    }
  }
  for (let k = -16; k <= 16; k += 2) p.px(cx + k, 30, (k / 2) % 2 ? '#dfeaf4' : '#b8cce0');   // a fringe of crystals
  for (let y = 31; y < 37; y++) p.px(cx, y, y % 2 ? '#e8f2fa' : '#b8cce0');
  return p;
}

export function buildMichelin(W, H = 96) {
  const hx = Math.round(W * 0.34);
  return {
    W, H, hx, plate: hx + 33, tower: hx + 81,
    layers: { room: room(W, H, hx), chair: chair(W, H, hx), table: table(W, H, hx), chandelier: chandelier(W, H, hx + 36) },
    sparkle: Array.from({ length: 13 }, (_, i) => [hx + 36 - 18 + i * 3, 24 + (i % 3) * 3]),
  };
}

const labels = new Map();
function text(str, ink) {
  if (!labels.has(str + ink)) labels.set(str + ink, label(str, ink));
  return labels.get(str + ink);
}

const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : 1 - (1 - u) * (1 - u));

// Which course is on the plate at time t: none before the cloche lifts, then 1 to 12.
export function courseAt(t) {
  if (t < LIFT[0]) return 0;
  if (t < COURSES[0]) return 1;
  return Math.min(12, 2 + Math.floor((t - COURSES[0]) / ((COURSES[1] - COURSES[0]) / 11)));
}

// A sleeve from shoulder to hand, 2px thick, ending in a white glove.
function arm(ctx, x0, y0, x1, y1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  ctx.fillStyle = '#1a1a20';
  for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 2, 2);
  ctx.fillStyle = '#f6f4ee'; ctx.fillRect(x1, y1, 2, 2);
}

// How much of the bill has unrolled: `drop` px down the tablecloth, then `run` px along the floor.
export function billAt(s, t) {
  const u = Math.min(1, Math.max(0, (t - BILL[0]) / (BILL[1] - BILL[0]))), len = Math.round(u * (s.hx + 30));
  const drop = Math.min(len, FLOOR - TOP);
  return { drop, run: len - drop };
}

function glow(ctx, x, y, r, a) {
  ctx.fillStyle = `rgba(255, 207, 122, ${a})`;
  for (let k = r; k > 0; k -= 2) ctx.fillRect(Math.round(x - k), Math.round(y - k / 2), k * 2, k);
}

export function renderMichelin(ctx, t, s, env) {
  const { W, H, canvases: c, hx, plate, tower } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.room, 0, 0);
  ctx.drawImage(c.chandelier, 0, 0);
  s.sparkle.forEach(([x, y], i) => {                                            // crystal glints
    if ((Math.floor(t * 10) + i * 3) % 5 === 0) { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(x), y, 1, 1); }
  });
  glow(ctx, hx + 36, 24, 22, 0.05);
  for (let k = 0; k < 14; k++) {                                                // gold dust drifting in the light
    const x = (hx - 40 + k * 37 + t * (6 + (k % 3) * 3)) % (W + 20) - 10, y = 20 + ((k * 23 + t * 5) % 50);
    if ((Math.floor(t * 8) + k) % 3) { ctx.fillStyle = k % 2 ? '#f2d27a' : '#fff1c4'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
  }
  ctx.drawImage(c.chair, 0, 0);
  const hero = env.hero('michelin', 'sit');
  ctx.drawImage(hero.canvases[0], hx - hero.anchorX, SEAT - 1 - hero.seatY);
  // the waiter behind the table, and the sommelier beside the champagne tower
  const lift = ease((t - LIFT[0]) / (LIFT[1] - LIFT[0])) * 9, course = courseAt(t);
  const waiter = env.art(WAITER), wx = plate + 10, wy = FLOOR - waiter.height + 1;
  ctx.drawImage(waiter, wx, wy);
  const somm = env.art(SOMMELIER), sx = tower + 16;
  ctx.drawImage(somm, sx, FLOOR - somm.height + 1);
  ctx.drawImage(c.table, 0, 0);
  // the huge plate and its one tiny bite
  ctx.fillStyle = '#b9b4aa'; ctx.fillRect(plate - 12, TOP - 1, 25, 1);           // a wide plate: rim, well, rim
  ctx.fillStyle = '#ffffff'; ctx.fillRect(plate - 12, TOP - 2, 25, 1); ctx.fillRect(plate - 10, TOP - 3, 21, 1);
  ctx.fillStyle = '#e9e6df'; ctx.fillRect(plate - 6, TOP - 2, 13, 1);
  if (course > 0) {
    ctx.fillStyle = BITES[course - 1]; ctx.fillRect(plate, TOP - 4, 2, 1);
    ctx.fillStyle = '#4f9a4a'; ctx.fillRect(plate + 1, TOP - 5, 1, 1);
    ctx.fillStyle = '#8a2438'; ctx.fillRect(plate - 3, TOP - 3, 1, 1); ctx.fillRect(plate + 4, TOP - 3, 1, 1);   // two dots of sauce
  }
  // the cloche, raised by the waiter's hand
  const cl = env.art(CLOCHE), cy = Math.round(TOP - 2 - cl.height - lift);
  ctx.drawImage(cl, plate - Math.floor(cl.width / 2) + 1, cy);
  arm(ctx, wx + 8, wy + 19, plate + 2, cy - 1);
  if (t > LIFT[1] && t < LIFT[1] + 0.25) {                                       // a glint as it comes up
    ctx.fillStyle = '#ffffff'; ctx.fillRect(plate - 3, cy + 2, 1, 1); ctx.fillRect(plate - 4, cy + 3, 3, 1);
  }
  // the candle burns down as the courses go by
  const wax = Math.max(2, 7 - Math.floor(course / 2.4)), fx = hx + 19;
  ctx.fillStyle = GOLD; ctx.fillRect(fx - 1, TOP - 2, 3, 2);
  ctx.fillStyle = '#f4efe2'; ctx.fillRect(fx, TOP - 2 - wax, 1, wax);
  ctx.fillStyle = Math.floor(t * 12) % 2 ? '#ffd27a' : '#fff1c4'; ctx.fillRect(fx, TOP - 4 - wax, 1, 2);
  glow(ctx, fx, TOP - 4 - wax, 10, 0.07);
  // the champagne tower: fifteen coupes on a side table, filled top first
  ctx.fillStyle = CLOTH; ctx.fillRect(tower - 17, TOP + 2, 35, FLOOR - TOP - 1);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(tower - 17, TOP + 2, 35, 1);
  const filled = (row) => t >= POUR[0] + (row + 1) * ((POUR[1] - POUR[0]) / 5);
  for (let row = 0; row < 5; row++) for (let k = 0; k <= row; k++) {
    const gx = tower - 2 - row * 3 + k * 6, gy = TOP + 2 - 4 - (4 - row) * 4;
    ctx.drawImage(env.art(filled(row) ? COUPE_FULL : COUPE), gx, gy);
  }
  const pouring = t >= POUR[0] && t < POUR[1] + 0.2, by = TOP - 30;
  if (pouring) {
    const b = env.art(BOTTLE);
    ctx.drawImage(b, tower - 1, by);
    ctx.fillStyle = '#f2d27a';
    for (let y = by + 9; y < TOP - 18; y++) if ((y + Math.floor(t * 20)) % 3) ctx.fillRect(tower, y, 1, 1);   // the pour
    for (let k = 0; k < 6; k++) {                                                 // spill running down the sides
      const y = TOP - 18 + ((t * 30 + k * 4) % 20), spread = Math.floor((y - (TOP - 18)) / 4) * 3 + 3;
      ctx.fillRect(tower + (k % 2 ? spread : -spread), Math.round(y), 1, 1);
    }
  }
  arm(ctx, sx + 7, FLOOR - somm.height + 20, pouring ? tower + 6 : sx + 2, pouring ? by + 3 : FLOOR - somm.height + 24);
  // the bill: down the tablecloth to the floor, then along it under the chair
  if (t >= BILL[0]) {
    const { drop, run } = billAt(s, t), bx = hx + 13;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, TOP, 5, drop);
    if (run) ctx.fillRect(bx + 5 - run, FLOOR - 1, run, 3);
    ctx.fillStyle = '#9a958c';
    for (let y = TOP + 1; y < TOP + drop; y += 2) ctx.fillRect(bx + 1, y, (y % 6) ? 3 : 2, 1);
    for (let x = bx + 4 - run; x < bx; x += 3) ctx.fillRect(x, FLOOR, 2, 1);
    ctx.fillStyle = '#1a1a20'; ctx.fillRect(bx - 1, TOP - 1, 7, 2);              // the bill folder
    if (drop + run > 30) {                                                        // a bead of sweat
      const top = SEAT - 1 - hero.seatY;
      ctx.fillStyle = '#bfe3f2'; ctx.fillRect(hx + 3, top + 17, 1, 2); ctx.fillRect(hx + 2, top + 18, 1, 1);
    }
  }
  // the course counter
  if (course > 0) {
    const n = env.art(text(`${course}/12`, '#f4f1e6')), k = env.art(text('COURSE', GOLD));
    const bw = k.width + n.width + 11, bx = W - bw - 6;
    ctx.fillStyle = 'rgba(11, 11, 12, 0.75)'; ctx.fillRect(bx, 20, bw, 9);
    ctx.fillStyle = GOLD; ctx.fillRect(bx, 20, 1, 9);
    ctx.drawImage(k, bx + 4, 22); ctx.drawImage(n, bx + k.width + 8, 22);
  }
}

export const michelin = { build: buildMichelin, render: renderMichelin };
```

Replace `reel/ch2/index.js` with:

```js
// Chapter 2: New York, from the first day at Columbia to the cap toss.
import { columbia } from './columbia.js';
import { night } from './night.js';
import { michelin } from './michelin.js';

export const CHAPTER_2 = {
  name: 'New York',
  shots: [
    { id: 'ch2-columbia', scene: columbia, caption: 'New York', duration: 2, fadeIn: 0.35, fadeOut: 0.15 },
    { id: 'ch2-night', scene: night, caption: 'New York', duration: 2.4, fadeIn: 0.15, fadeOut: 0.15 },
    { id: 'ch2-michelin', scene: michelin, caption: 'New York', duration: 3, fadeIn: 0.2, fadeOut: 0.2 },
  ],
};
```

- [ ] **Step 4: Run the unit tests**

Run: `node --test 'tests/reel/*.test.js'`
Expected: `ℹ pass 114`, `ℹ fail 0`.

- [ ] **Step 5: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 22.5,23.3,24.2,24.75 && python3 tests/reel/sheet.py /tmp/f /tmp/f-mich.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 24.3 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-mich.png 3
```

Expected:
- The room: damask walls warmed by candlelight near the table, gold mouldings, and arched windows on the skyline between swagged burgundy curtains. Gilt mirrors with sconces, a crystal chandelier with gold dust drifting under it, and candlelit tables of diners in silhouette.
- Yimeng in the burgundy blazer, seated on a gilt chair at a white table with a candle.
- The waiter, black-haired with a moustache, stands behind the table and holds a silver cloche high over one tiny bite on a wide plate.
- 22.5 s: `COURSE 1/12` at the top right.
- 23.3 s: about `9/12`, and the bite has changed colour.
- 24.2 s: the grey-haired sommelier pours into a five-tier champagne tower that fills gold from the top.
- 24.75 s: the bill runs down the tablecloth and far along the floor, and a bead of sweat appears on Yimeng's head.

- [ ] **Step 6: Commit**

```bash
git add reel/ch2/michelin.js reel/ch2/index.js tests/reel/ch2-michelin.test.js
git commit -m "feat(reel): Serve a twelve-course dinner at three stars"
```

---

### Task 5: The Starry Night at MoMA

**Files:**
- Create: `reel/ch2/moma.js`
- Modify: `reel/ch2/index.js`
- Test: `tests/reel/ch2-moma.test.js`

**Interfaces:**
- Produces: `moma` (a scene), with layers `gallery` and `starry0` … `starry3` (40×32, the sky's swirl at four phases, cycled at 5 fps).
  - The painting hangs with its left edge at `hx + 28`, rows 28–59.
  - Yimeng walks in and stops at `hx` at 0.85 s.

- [ ] **Step 1: Write the failing test.** Create `tests/reel/ch2-moma.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { sceneContract, frameAt } from './fake-canvas.js';
import { moma } from '../../reel/ch2/moma.js';

sceneContract('ch2 MoMA', moma, 1.5);

test('MoMA: Yimeng walks in and stops just left of The Starry Night', () => {
  const s = moma.build(480, 96), { ctx } = frameAt(moma, 480, 1.2);
  assert.deepEqual(ctx.draws('nyc:walk:1'), [[s.hx - 9, 88 - 44]]);
  const [[px]] = ctx.calls.filter(c => /^starry\d$/.test(c[1])).map(c => [c[2]]);
  assert.ok(px > s.hx + 20, "the painting hangs just past Yimeng's face");
});

test("MoMA: The Starry Night's sky turns while Yimeng looks", () => {
  const shown = [0, 0.2, 0.4, 0.6].map(t => frameAt(moma, 480, t).ctx.calls.find(c => /^starry\d$/.test(c[1]))[1]);
  assert.deepEqual(shown, ['starry0', 'starry1', 'starry2', 'starry3']);
  const s = moma.build(480, 96), sha = (p) => createHash('sha256').update(p.data).digest('hex');
  assert.equal(new Set([0, 1, 2, 3].map(k => sha(s.layers[`starry${k}`]))).size, 4, 'four different frames');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test 'tests/reel/ch2-moma.test.js'`
Expected: the file fails to load (`Cannot find module …/reel/ch2/moma.js`).

- [ ] **Step 3: Implement.** Create `reel/ch2/moma.js`:

```js
// Chapter 2, shot 4: MoMA. A white gallery: Warhol's soup cans, then The Starry Night, where Yimeng
// stops and looks while its sky slowly turns; Monet's Water Lilies beyond, on wide screens.
import { Painter, rng, textRows } from '../pixels.js';

const FLOOR = 88;                            // the row Yimeng's shoes rest on
const STOP = 0.85;                           // walking in until here, then standing still
const STARRY = { w: 40, h: 32, x: 28, y: 28 };   // the painting; x is its left edge relative to Yimeng's stop
const FRAMES = 4;                            // the sky's swirl, cycled

const WALL = '#f1efe9', FRAME = '#8a6a3a', FRAME_LIT = '#b8925a';

// The Starry Night in 40x32, its sky drawn at phase k of FRAMES: brush strokes run around the
// big swirl and the stars' halos, and shift along as k advances.
function starryNight(k) {
  const { w, h } = STARRY, p = new Painter(w, h), r = rng(19);
  const swirls = [[17, 10, 9], [27, 13, 5]];                                    // [x, y, radius]: the big S-swirl
  const stars = [[4, 5, 2.2], [11, 3, 2], [22, 4, 2.2], [31, 7, 2.4], [8, 13, 2], [26, 17, 1.8], [14, 18, 1.7]];
  const moon = [35, 4, 3.2];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let c, best = null;                                                         // best: the nearest star, as [distance/radius, angle, isMoon]
    for (const [sx, sy, rad] of [...stars, moon]) {
      const d = Math.hypot(x - sx, (y - sy) * 1.1);
      if (d < rad * 2.4 && (!best || d / rad < best[0])) best = [d / rad, Math.atan2(y - sy, x - sx), sx === moon[0]];
    }
    if (best && best[0] < 1) c = best[2] ? (best[0] < 0.75 ? '#f8e9a1' : '#f4d03f') : best[0] < 0.55 ? '#fffbe0' : '#f4d03f';
    else if (best && best[0] < 2.4) {
      const ring = Math.floor(best[0] * 2 + best[1] * 0.6 + k * 0.5) % 3;     // halos of yellow and pale blue
      c = ring === 0 ? '#e8c94a' : ring === 1 ? '#8fb0e0' : '#c9d97a';
    } else {
      let a = Math.atan2(y - 12, x - 20) * 2 + Math.hypot(x - 20, y - 12) * 0.35;
      for (const [sx, sy, rad] of swirls) {
        const d = Math.hypot(x - sx, y - sy);
        if (d < rad) a = Math.atan2(y - sy, x - sx) * 3 + d * 0.9;               // tighter turns inside the swirl
      }
      const band = Math.floor(a + k * (Math.PI / 2)) % 4;
      c = band === 0 ? '#1d3570' : band === 1 ? '#3d5fae' : band === 2 ? '#26407e' : '#6c8fd6';
      if (y > 9 && y < 15 && x > 6 && x < 30 && (x + y + k) % 5 === 0) c = '#a7c0e8';   // the pale swirl's crest
    }
    p.px(x, y, c);
  }
  for (let x = 0; x < w; x++) {                                                 // hills, then the village
    const hill = 21 + Math.round(Math.sin(x * 0.18) * 1.5 + Math.sin(x * 0.07 + 1) * 2);
    for (let y = hill; y < h; y++) p.px(x, y, y === hill ? '#4a6aa0' : (x + y) % 4 ? '#22365e' : '#1a2a4a');
  }
  for (let n = 0; n < 12; n++) {
    const x = 12 + Math.floor(r() * 26), y = 25 + Math.floor(r() * 5);
    p.rect(x, y, 3, 2, '#2e4470'); p.px(x + 1, y, '#f4d03f');
  }
  for (let y = 16; y < 27; y++) p.px(25, y, '#1a2236');                         // the church spire
  for (let y = 22; y < 27; y++) { p.px(24, y, '#1a2236'); p.px(26, y, '#1a2236'); }
  for (let y = 1; y < h; y++) {                                                  // the cypress, a dark flame on the left
    const half = Math.max(0.5, (y / h) * 4.5 + Math.sin(y * 0.9) * 0.8);
    for (let x = Math.round(6 - half); x <= Math.round(6 + half); x++) p.px(x, y, (x + y) % 3 ? '#1f2a1a' : '#3a4a2a');
  }
  return p;
}

function soupCans() {
  const p = new Painter(38, 16);
  for (let row = 0; row < 2; row++) for (let col = 0; col < 6; col++) {
    const x = col * 6 + 2, y = row * 8 + 1;
    p.rect(x, y, 4, 6, '#f4f1ea');
    p.rect(x, y, 4, 2, '#d0242e'); p.rect(x, y + 5, 4, 1, '#c9c4ba');
    p.px(x + 1, y + 3, '#e2b84a'); p.px(x + 2, y + 3, '#e2b84a');
  }
  return p;
}

function waterLilies() {
  const p = new Painter(84, 18), r = rng(5);
  for (let y = 0; y < 18; y++) for (let x = 0; x < 84; x++) {
    const v = Math.sin(x * 0.21 + y * 0.6) + Math.sin(x * 0.07 - y * 0.3);
    p.px(x, y, v > 0.8 ? '#a7b8d8' : v > 0 ? '#6f8fb8' : v > -0.8 ? '#4f6f9a' : '#5a7a6a');
  }
  for (let n = 0; n < 26; n++) {
    const x = Math.floor(r() * 80), y = 4 + Math.floor(r() * 12);
    p.rect(x, y, 4, 1, '#4f8a5a'); p.px(x + 1, y - 1, r() < 0.4 ? '#f2b8c8' : '#4f8a5a');
  }
  return p;
}

// Black wall lettering at twice the font's size.
function sign(str) {
  const rows = textRows(str), p = new Painter(rows[0].length * 2, 10);
  rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === '#') p.rect(x * 2, y * 2, 2, 2, '#16161a'); });
  return p;
}

// Copy a Painter's opaque pixels into another at (x0, y0).
function blit(p, src, x0, y0) {
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const k = (y * src.w + x) * 4, X = x0 + x, Y = y0 + y;
    if (!src.data[k + 3] || X < 0 || Y < 0 || X >= p.w || Y >= p.h) continue;
    p.data.set(src.data.subarray(k, k + 4), (Y * p.w + X) * 4);
  }
}

function gallery(W, H, hx) {
  const p = new Painter(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = y < 22 ? '#e2dfd8' : WALL;
    if (y === 22) c = '#d4d0c8';
    if (y >= 82) c = y === 82 ? '#d8d4cc' : y === 83 ? '#bdb7ab' : ((x + (y % 3) * 31) % 40 === 0 ? '#a8885c' : (x + y) % 9 === 0 ? '#c4a272' : '#cfae7c');
    p.px(x, y, c);
  }
  for (let x = 0; x < W; x += 30) p.rect(x, 21, 6, 2, '#3a3a40');                // track lights
  // pools of light on the wall under the spots
  const pool = (cx, top, w, h) => {
    for (let y = top; y < top + h; y++) for (let x = cx - w; x <= cx + w; x++) if ((x + y) % 2 === 0 && Math.abs(x - cx) < w * (0.6 + 0.4 * (y - top) / h)) p.px(x, y, '#f7f5f0');
  };
  const sx = hx + STARRY.x + STARRY.w / 2;
  pool(sx, 23, 28, 46);
  const frame = (x0, y0, w, h) => {
    for (let y = y0 - 2; y < y0 + h + 2; y++) for (let x = x0 - 2; x < x0 + w + 2; x++) p.px(x, y, y < y0 - 1 || x < x0 - 1 ? FRAME_LIT : FRAME);
  };
  frame(hx + STARRY.x, STARRY.y, STARRY.w, STARRY.h);
  p.rect(hx + STARRY.x + STARRY.w + 6, 50, 7, 5, '#ffffff');                    // the wall label
  for (const y of [51, 53]) p.rect(hx + STARRY.x + STARRY.w + 7, y, 5, 1, '#9a958c');
  const sx0 = Math.max(4, hx - 120), cans = soupCans(), cx0 = Math.max(hx - 64, sx0 + 36);
  frame(cx0, 34, cans.w, cans.h);
  blit(p, cans, cx0, 34);
  const lilies = waterLilies(), lx0 = hx + 112;
  if (lx0 < W) {
    frame(lx0, 38, lilies.w, lilies.h);
    blit(p, lilies, lx0, 38);
    for (let x = lx0 + 18; x < lx0 + 66; x++) { p.px(x, 74, '#1e1e24'); p.px(x, 75, '#2e2e36'); }   // a bench before it
    for (const bx of [lx0 + 20, lx0 + 63]) for (let y = 76; y < FLOOR; y++) p.px(bx, y, '#9aa0aa');
  }
  blit(p, sign('MOMA'), sx0, 30);
  return p;
}

export function buildMoma(W, H = 96) {
  const hx = Math.round(W * 0.34), layers = { gallery: gallery(W, H, hx) };
  for (let k = 0; k < FRAMES; k++) layers[`starry${k}`] = starryNight(k);
  return { W, H, hx, layers };
}

export function renderMoma(ctx, t, s, env) {
  const { W, H, canvases: c, hx } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.gallery, 0, 0);
  ctx.drawImage(c[`starry${Math.floor(t * 5) % FRAMES}`], hx + STARRY.x, STARRY.y);
  const hero = env.hero('nyc'), x = hx - Math.max(0, STOP - t) * 30;
  ctx.drawImage(hero.canvases[t < STOP ? Math.floor(t * 6) % 4 : 1], Math.round(x) - hero.anchorX, FLOOR - hero.footY);
}

export const moma = { build: buildMoma, render: renderMoma };
```

Replace `reel/ch2/index.js` with:

```js
// Chapter 2: New York, from the first day at Columbia to the cap toss.
import { columbia } from './columbia.js';
import { night } from './night.js';
import { michelin } from './michelin.js';
import { moma } from './moma.js';

export const CHAPTER_2 = {
  name: 'New York',
  shots: [
    { id: 'ch2-columbia', scene: columbia, caption: 'New York', duration: 2, fadeIn: 0.35, fadeOut: 0.15 },
    { id: 'ch2-night', scene: night, caption: 'New York', duration: 2.4, fadeIn: 0.15, fadeOut: 0.15 },
    { id: 'ch2-michelin', scene: michelin, caption: 'New York', duration: 3, fadeIn: 0.2, fadeOut: 0.2 },
    { id: 'ch2-moma', scene: moma, caption: 'New York', duration: 1.5, fadeIn: 0.2, fadeOut: 0.2 },
  ],
};
```

- [ ] **Step 4: Run the unit tests**

Run: `node --test 'tests/reel/*.test.js'`
Expected: `ℹ pass 118`, `ℹ fail 0`.

- [ ] **Step 5: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 25.3,26.1 && python3 tests/reel/sheet.py /tmp/f /tmp/f-moma.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 26.0 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-moma.png 3
```

Expected:
- A white gallery with track lights and a light wood floor, and black `MOMA` lettering on the wall. On phones the lettering stays clear of the soup cans.
- Warhol's soup cans: two rows of red-and-white cans.
- *The Starry Night* in a gold frame under a pool of light. It shows the swirling blue sky, haloed yellow stars and the moon, the dark flame of the cypress, the hills, the village and the church spire. A wall label hangs beside it.
- On desktop, Monet's *Water Lilies* with a bench before it.
- Yimeng in the camel coat walks in and stops just left of the painting. Between frames, the sky's strokes have shifted.

- [ ] **Step 6: Commit**

```bash
git add reel/ch2/moma.js reel/ch2/index.js tests/reel/ch2-moma.test.js
git commit -m "feat(reel): Stop before The Starry Night at MoMA"
```

---

### Task 6: The cap toss, the puppy, and snow

**Files:**
- Create: `reel/ch2/graduation.js`
- Modify: `reel/ch2/index.js`
- Test: `tests/reel/ch2-graduation.test.js`, `tests/reel/ch2-chapter.test.js`

**Interfaces:**
- Consumes: `buildSet`, `drawAlmaMater` and `WALK` from `reel/ch2/columbia.js` (Task 2), and the `cheer` pose (Task 1).
- Produces: `capPath(scene, t, dogFootY) → { x, y, landed } | null`. It is null before the toss at 0.55 s. Then it arcs high and lands at 1.85 s on the puppy's head, at `(dogStop + 4, 90 - dogFootY - 2)`.
- Produces: `graduation` (a scene). It exposes `cx`, `hx`, `crowd` (each graduate keeps 13 px or more from Alma Mater's axis) and `dogStop = hx + 24`.
  - The puppy trots in and stops at `dogStop` at 1.45 s.
  - The snow starts at 1.6 s and thickens until 2.8 s.
- Produces: `CHAPTER_2` complete. Its shots run 2 + 2.4 + 3 + 1.5 + 2.8 = 11.7 s.

- [ ] **Step 1: Write the failing tests.** Create `tests/reel/ch2-graduation.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { graduation, capPath } from '../../reel/ch2/graduation.js';

sceneContract('ch2 graduation', graduation, 2.8);

test('graduation: the class stands on the steps, leaving Alma Mater in view', () => {
  const s = graduation.build(480, 96);
  assert.ok(s.crowd.length >= 10);
  assert.ok(s.crowd.every(g => Math.abs(g.x + 4 - s.cx) >= 13));
});

test('graduation: Yimeng throws the cap and goes on bareheaded', () => {
  assert.equal(frameAt(graduation, 480, 0.3).ctx.draws('columbia:walk:1').length, 1);
  const after = frameAt(graduation, 480, 1.2).ctx;
  assert.equal(after.draws('columbia:walk:1').length, 0);
  assert.equal(after.draws('columbia:cheer:0').length + after.draws('columbia:cheer:1').length, 1);
});

test("graduation: Yimeng's cap flies up and comes down on the puppy's head", () => {
  const s = graduation.build(480, 96);
  assert.equal(capPath(s, 0.5, 12), null, 'still worn before the toss');
  assert.ok(capPath(s, 1.1, 12).y < 30, 'high in the air');
  assert.deepEqual(capPath(s, 2.5, 12), { x: s.dogStop + 4, y: 90 - 12 - 2, landed: true });
});

test('graduation: the puppy trots in and stays by Yimeng', () => {
  const s = graduation.build(480, 96);
  const dogX = (t) => frameAt(graduation, 480, t).ctx.calls.find(c => String(c[1]).startsWith('dog:pup'))[2];
  assert.ok(dogX(0.5) < dogX(1.2), 'trotting right');
  assert.deepEqual(frameAt(graduation, 480, 2.4).ctx.draws('dog:pup:0'), [[s.dogStop, 90 - 15]]);
});
```

Create `tests/reel/ch2-chapter.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTER_2 } from '../../reel/ch2/index.js';

test('chapter 2 opens and closes at Columbia, 11.7 s in all', () => {
  assert.equal(CHAPTER_2.name, 'New York');
  assert.deepEqual(CHAPTER_2.shots.map(s => s.id), ['ch2-columbia', 'ch2-night', 'ch2-michelin', 'ch2-moma', 'ch2-graduation']);
  assert.ok(CHAPTER_2.shots.every(s => s.caption === 'New York'));
  assert.equal(Math.round(CHAPTER_2.shots.reduce((a, s) => a + s.duration, 0) * 10) / 10, 11.7);
  assert.ok(CHAPTER_2.shots[0].fadeIn > 0, 'it fades in from the takeoff');
  assert.ok(CHAPTER_2.shots.at(-1).fadeOut > 0, 'and out after the snow');
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `node --test 'tests/reel/ch2-graduation.test.js' 'tests/reel/ch2-chapter.test.js'`
Expected: the graduation file fails to load (`Cannot find module …/reel/ch2/graduation.js`), and the chapter test fails because there are still four shots, 8.9 s in all.

- [ ] **Step 3: Implement.** Create `reel/ch2/graduation.js`:

```js
// Chapter 2, shot 5: the class of 2019 on the Low Steps in spring. Everyone hops and throws their
// caps; a puppy trots along College Walk, and the cap Yimeng threw comes down on its head. From here
// on the dog walks along. Then the falling caps turn into snowflakes, and the snow takes over.
import { rng } from '../pixels.js';
import { art } from '../kit.js';
import { buildSet, drawAlmaMater, WALK } from './columbia.js';

const TOSS = 0.55;                             // everyone throws their caps
const G = 230;                                 // gravity for the caps, px/s^2
const DOG_STOP = 1.45, LAND = 1.85;            // the puppy trots in; Yimeng's cap comes down on it
const SNOW = [1.6, 2.8];                       // the caps turn to snow, which thickens towards white

// A graduate seen from the front, in the Columbia-blue gown; the cap is drawn on its own.
function graduate(hair, skin) {
  return art(`
..HHHHH..
.HHHHHHH.
HHHHHHHHH
HSSSSSSSH
HSESSSESH
HSSSSSSSH
.SSSSSSS.
..SSSSS..
...SSS...
.BBBBBBB.
BBBBBBBBB
BBBBBBBBB
SBBBBBBBS
.BBBBBBB.
.BBBBBBB.
.bbbbbbb.
..K...K..
`, { H: hair, S: skin, E: '#241c22', B: '#9cc7ea', b: '#6f9fca', K: '#1a1416' }, '#2a1f2d');
}
// The mortarboard as it spins: square on, tilted, seen from above.
const CAP_PALETTE = { J: '#9cc7ea', j: '#6f9fca', V: '#f4f1ea' };
const CAPS = [
  art(`
.JJJJJJJJJ.
JJJJJJJJJJJ
..jjjjjjjV.
...jjjjj.V.
`, CAP_PALETTE, '#2a1f2d'),
  art(`
JJJ......
.JJJJJ...
..JJJJJJ.
...jjjjJJ
....jjj.V
`, CAP_PALETTE, '#2a1f2d'),
  art(`
...JJJ...
.JJJJJJJ.
JJJJVJJJJ
.JJJJJJJ.
...JJJ...
`, CAP_PALETTE, '#2a1f2d'),
];
const HEART = art(`
.##.##.
#######
.#####.
..###..
...#...
`, { '#': '#e8607a' }, '#7a1e30');

const HAIR = ['#1e1a1e', '#3a2a20', '#6a4a30', '#c8a050', '#7a3a22', '#2a2026'];
const SKIN = ['#f4cfae', '#e0a985', '#c98d6e', '#8d5a3e', '#f0c8a4'];

export function buildGraduation(W, H = 96) {
  const { set, cx } = buildSet(W, H, 'spring'), hx = Math.round(W * 0.34), r = rng(2019);
  const crowd = [];
  for (const [feet, gap, skip, off] of [[77, 24, 18, 6], [86, 20, 13, 0]]) {     // two rows on the Low Steps
    for (let x = cx - 112 + off; x < cx + 104; x += gap + Math.floor(r() * 5)) {
      if (x < -4 || x > W - 6) continue;
      if (Math.abs(x + 4 - cx) < skip) continue;                                  // keep Alma Mater in view
      if (feet === 86 && x > hx - 12 && x < hx + 46) continue;                    // room for Yimeng and the puppy
      const fig = graduate(HAIR[Math.floor(r() * HAIR.length)], SKIN[Math.floor(r() * SKIN.length)]);
      crowd.push({ x, y: feet - fig.h + 1, fig, delay: r() * 0.08, vy: -(165 + r() * 45), vx: (r() - 0.5) * 50, morph: SNOW[0] + 0.1 + r() * 0.6, spin: r() * 3 });
    }
  }
  const flakes = [];
  for (let n = 0; n < Math.round(W / 5); n++) flakes.push({ x: r() * W, y: r() * (H + 8), v: 14 + r() * 12, sway: 1 + r() * 2.5, ph: r() * 6, big: r() < 0.3, k: r() });
  return { W, H, cx, hx, crowd, flakes, dogStop: hx + 24, layers: { set } };
}

// Where Yimeng's cap is at time t: thrown from Yimeng's head at the toss, it arcs over and lands on
// the puppy's head (dogFootY: the puppy sprite's foot row). Null while it is still being worn.
export function capPath(s, t, dogFootY) {
  if (t < TOSS) return null;
  const x0 = s.hx + 6, y0 = WALK - 36, x1 = s.dogStop + 4, y1 = WALK - dogFootY - 2;
  const T = LAND - TOSS, u = Math.min(t - TOSS, T), vy = (y1 - y0 - 0.5 * G * T * T) / T;
  return { x: Math.round(x0 + (x1 - x0) * (u / T)), y: Math.round(y0 + vy * u + 0.5 * G * u * u), landed: t >= LAND };
}

function flake(ctx, x, y, big) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  if (big) { ctx.fillRect(Math.round(x) - 1, Math.round(y), 3, 1); ctx.fillRect(Math.round(x), Math.round(y) - 1, 1, 3); }
}

// Everyone crouches just before the toss and springs up 3px with it.
const hop = (t, delay) => {
  const u = t - TOSS - delay;
  return u < -0.12 ? 0 : u < 0 ? 1 : u < 0.3 ? -Math.round(Math.sin((u / 0.3) * Math.PI) * 3) : 0;
};

export function renderGraduation(ctx, t, s, env) {
  const { W, H, canvases: c, hx } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.set, 0, 0);
  drawAlmaMater(ctx, env, s.cx);
  // the class on the steps: hop, throw, and watch the caps go
  for (const g of s.crowd) {
    const dy = hop(t, g.delay);
    ctx.drawImage(env.art(g.fig), g.x, g.y + dy);
    const u = t - TOSS - g.delay;
    if (u < 0) { ctx.drawImage(env.art(CAPS[0]), g.x - 1, g.y - 3 + dy); continue; }
    const m = g.morph - TOSS - g.delay, k = Math.min(u, m);
    const x = g.x - 1 + g.vx * k, y = g.y - 3 + g.vy * k + 0.5 * G * k * k;
    if (u < m) ctx.drawImage(env.art(CAPS[Math.floor(u * 10 + g.spin) % 3]), Math.round(x), Math.round(y));
    else flake(ctx, x + 5 + Math.sin(t * 2 + g.spin) * 2, y + (u - m) * 16, true);   // a cap no more: a snowflake
  }
  // Yimeng in the gown: cap on, then thrown, bouncing bareheaded
  const hero = t < TOSS ? env.hero('columbia') : env.hero('columbia', 'cheer');
  const frame = t < TOSS ? 1 : Math.floor((t - TOSS) * 4) % 2;
  ctx.drawImage(hero.canvases[frame], hx - hero.anchorX, WALK - hero.footY + hop(t, 0));
  // the puppy trots in along College Walk and stops by Yimeng; it ducks as the cap lands
  const dog = env.dog('pup'), dx = s.dogStop - Math.max(0, DOG_STOP - t) * 60;
  const bump = t >= LAND && t < LAND + 0.12 ? 1 : 0;
  ctx.drawImage(dog.canvases[t < DOG_STOP ? Math.floor(t * 9) % 4 : 0], Math.round(dx), WALK - dog.footY + bump);
  const cap = capPath(s, t, dog.footY);
  if (cap) ctx.drawImage(env.art(CAPS[cap.landed ? 0 : Math.floor((t - TOSS) * 10) % 3]), cap.x, cap.y + bump);
  if (t > LAND + 0.1) {                                                           // a heart: this is the dog
    const u = (t - LAND - 0.1) / 0.8;
    if (u < 1) { ctx.globalAlpha = 1 - u * u; ctx.drawImage(env.art(HEART), hx + 22, Math.round(64 - u * 12)); ctx.globalAlpha = 1; }
  }
  // the snow takes over: more and more flakes, and the scene whitens
  if (t > SNOW[0]) {
    const u = Math.min(1, (t - SNOW[0]) / (SNOW[1] - SNOW[0]));
    for (const f of s.flakes) {
      if (f.k > u * 1.2) continue;
      const y = ((f.y + (t - SNOW[0]) * f.v) % (H + 8)) - 4;
      flake(ctx, f.x + Math.sin(t * 2 + f.ph) * f.sway, y, f.big);
    }
    ctx.globalAlpha = 0.45 * u * u; ctx.fillStyle = '#dfe6ee'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
  }
}

export const graduation = { build: buildGraduation, render: renderGraduation };
```

Replace `reel/ch2/index.js` with:

```js
// Chapter 2: New York, from the first day at Columbia to the cap toss.
import { columbia } from './columbia.js';
import { night } from './night.js';
import { michelin } from './michelin.js';
import { moma } from './moma.js';
import { graduation } from './graduation.js';

export const CHAPTER_2 = {
  name: 'New York',
  shots: [
    { id: 'ch2-columbia', scene: columbia, caption: 'New York', duration: 2, fadeIn: 0.35, fadeOut: 0.15 },
    { id: 'ch2-night', scene: night, caption: 'New York', duration: 2.4, fadeIn: 0.15, fadeOut: 0.15 },
    { id: 'ch2-michelin', scene: michelin, caption: 'New York', duration: 3, fadeIn: 0.2, fadeOut: 0.2 },
    { id: 'ch2-moma', scene: moma, caption: 'New York', duration: 1.5, fadeIn: 0.2, fadeOut: 0.2 },
    { id: 'ch2-graduation', scene: graduation, caption: 'New York', duration: 2.8, fadeIn: 0.2, fadeOut: 0.3 },
  ],
};
```

- [ ] **Step 4: Run the unit tests**

Run: `node --test 'tests/reel/*.test.js'`
Expected: `ℹ pass 125`, `ℹ fail 0`.

- [ ] **Step 5: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 26.8,27.5,28.4,29.0 && python3 tests/reel/sheet.py /tmp/f /tmp/f-grad.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 27.4,28.6 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-grad.png 3
```

Expected:
- 26.8 s: Low Library in spring, with green trees. Two rows of graduates in Columbia blue, with varied hair and skin, stand on the steps in their caps, leaving Alma Mater clear. Yimeng stands at the front in the gown and mortarboard, and the puppy trots in along College Walk.
- 27.5 s: everyone has hopped and thrown, and caps spin high across the sky. Yimeng is bareheaded and the puppy stops beside Yimeng.
- 28.4 s: Yimeng's cap sits on the puppy's head, a pink heart rises between them, and the first caps have turned into snowflakes.
- 29.0 s: snow everywhere, the scene whitening, then fading out.

- [ ] **Step 6: Commit**

```bash
git add reel/ch2/graduation.js reel/ch2/index.js tests/reel/ch2-graduation.test.js tests/reel/ch2-chapter.test.js
git commit -m "feat(reel): End chapter 2 with the cap toss, the puppy, and snow"
```

---

### Task 7: Page checks, spec and hand-off

**Files:**
- Modify: `tests/reel/page-check.sh`, `docs/superpowers/specs/2026-10-03-life-reel-design.md`

- [ ] **Step 1: See the page checks fail.** Chapter 2 now ends at 29.2 s, so the old times fall in the wrong chapters.

Run: `tests/reel/page-check.sh`
Expected: `FAIL - Michigan lights step 3` (25 s is still New York), plus the California and To be continued checks. The script exits 1.

- [ ] **Step 2: Move the times.** The new chapter spans are: New York 17.5–29.2, Michigan 29.2–35.2, California 35.2–43.2, To be continued 43.2–47.2. Apply to `tests/reel/page-check.sh`:

`tests/reel/page-check.sh`, change 1. Find:

```bash
d=$(dom 1440,900 '?reel=25'); expect 'Michigan lights step 3' "$d" 'data-chapter="2"' 'class="step is-live" data-org="msu"'
d=$(dom 1440,900 '?reel=31'); expect 'California lights step 4' "$d" 'data-chapter="3"' 'class="step is-live" data-org="amazon"'
d=$(dom 1440,900 '?reel=39'); expect 'To be continued keeps step 4 lit' "$d" 'data-chapter="4"' '>To be continued…<' 'class="step is-live" data-org="amazon"'
```

Replace with:

```bash
d=$(dom 1440,900 '?reel=31'); expect 'Michigan lights step 3' "$d" 'data-chapter="2"' 'class="step is-live" data-org="msu"'
d=$(dom 1440,900 '?reel=39'); expect 'California lights step 4' "$d" 'data-chapter="3"' 'class="step is-live" data-org="amazon"'
d=$(dom 1440,900 '?reel=45'); expect 'To be continued keeps step 4 lit' "$d" 'data-chapter="4"' '>To be continued…<' 'class="step is-live" data-org="amazon"'
```

- [ ] **Step 3: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 125`, then 15 `ok` lines and exit 0.

- [ ] **Step 4: Update the spec.** Apply to `docs/superpowers/specs/2026-10-03-life-reel-design.md`:

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 1. Find:

```markdown
The two dive outfits use swimming poses in the reel. The other outfits walk.
```

Replace with:

```markdown
The two dive outfits use swimming poses in the reel. The other outfits walk. Yimeng also sits (on the train, at Trolltunga and at dinner), and at the cap toss cheers bareheaded in the gown.
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 2. Find:

```markdown
### 2 · New York (~11 s). Caption: `New York`. The chapter opens and closes at Columbia.
```

Replace with:

```markdown
### 2 · New York (~11.7 s). Caption: `New York`. The chapter opens and closes at Columbia.
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 3. Find:

```markdown
1. Arriving at Low Library and the Alma Mater statue.
2. Night in Manhattan, in black and gold with Art Deco styling.
3. Michelin dinner: three stars light up above the door. Inside are white tablecloths, candles and a chandelier. A waiter lifts a silver cloche to reveal one tiny bite on a huge plate. A course counter runs from `1/12` to `12/12`, then comes a champagne tower, and the bill unrolls down to the floor.
4. MoMA: Yimeng stops in front of *The Starry Night*.
5. Back on the Low Library steps in the Columbia-blue gown. Everyone throws their caps. Yimeng's cap comes down on a puppy's head, and from here on the dog walks along.
6. Transition: the caps falling from the sky turn into snowflakes.
```

Replace with:

```markdown
1. Arriving at Low Library on an autumn day: the dome, ten Ionic columns and the Low Steps, with Alma Mater on her pedestal. Leaves drift down over College Walk, whose lamp posts fly Columbia-blue banners. Yimeng walks in and stops to look up.
2. Night in Manhattan, in black and gold with Art Deco styling. The shot opens on the lit crowns of the Chrysler and Empire State buildings, with a gold sunburst behind the skyline and searchlights sweeping. Then it tilts down to the street, where Yimeng walks up to a black-and-gold restaurant. Three stars light up above the door one by one, and Yimeng steps into its light.
3. Michelin dinner, in a gold-and-burgundy room with the skyline in its windows: white tablecloths, candles and a crystal chandelier. Yimeng sits at the table. A waiter lifts a silver cloche to reveal one tiny bite on a huge plate. A course counter runs from `1/12` to `12/12` as the candle burns down. Then the sommelier fills a champagne tower, and the bill unrolls down to the floor and across it.
4. MoMA: past Warhol's soup cans, Yimeng stops in front of *The Starry Night*, whose sky slowly turns. On wide screens Monet's *Water Lilies* hang further along.
5. Back on the Low Library steps in spring, in the Columbia-blue gown. Everyone hops and throws their caps. A puppy trots along College Walk, Yimeng's cap comes down on its head, and a heart pops up. From here on the dog walks along.
6. Transition: the caps falling from the sky turn into snowflakes, and the snow thickens towards white.
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 4. Find:

```markdown
  - `reel/story.js` holds the running order and imports one module per chapter (`reel/ch1-sheffield.js` … `reel/ch5-continued.js`) as each is built.
```

Replace with:

```markdown
  - `reel/story.js` holds the running order and imports one folder per chapter (`reel/ch1/` … `reel/ch5/`) as each is built: an `index.js` with the chapter's shots, and one module per location.
```

- [ ] **Step 5: Commit**

```bash
git add tests/reel/page-check.sh docs/superpowers/specs/2026-10-03-life-reel-design.md
git commit -m "docs: Describe chapter 2 as built; move the page checks past it"
```

- [ ] **Step 6: Hand over for review.** Give the user:
  - `http://127.0.0.1:8000/?reel=ch2-columbia`
  - `?reel=ch2-night`
  - `?reel=ch2-michelin`
  - `?reel=ch2-moma`
  - `?reel=ch2-graduation`
  - `http://127.0.0.1:8000/` to see the whole loop; the `02` button jumps to chapter 2.

Stop there. Chapter 3 gets its own plan after this review.
