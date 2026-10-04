# Life Reel — Phase 3b (Chapter 2 Revisions) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply Yimeng's chapter 2 review.
- The three stars over the restaurant door and the champagne tower go.
- The single dinner becomes one long shot through four restaurants side by side (French, Japanese, Italian, Chinese). Yimeng eats through them from left to right.
- After MoMA come three more exhibitions: the Met's Temple of Dendur, the Guggenheim's rotunda and Yayoi Kusama's Infinity Mirror Room.
- Chapter 2 grows from 11.7 s to 16.2 s.

**Architecture:** Same scene contract as before, one module per location under `reel/ch2/`. `michelin.js` is replaced by `dining.js`, a single scene with a wide set (four rooms between dark ends) and a camera that follows Yimeng only when the row is wider than the screen. Three new modules hold the museums: `met.js`, `guggenheim.js`, `kusama.js`. Each scene exports the small pure functions its tests need.

**Tech Stack:** Vanilla JS (ES modules, Canvas 2D), Node 25 `node:test`, headless Chrome review tools from Phase 2.

**Spec:** `docs/superpowers/specs/2026-10-03-life-reel-design.md`, chapter 2 storyboard (updated in Task 6). **Builds on:** `docs/superpowers/plans/2026-10-03-life-reel-phase-3.md`.

## Global Constraints

- Everything in the Phase 3 plan's Global Constraints still holds:
  - no build step, English text, deterministic scenes, golden tests untouched
  - every scene reads at native widths 195, 480 and 640
  - a sprite drawn at `x - anchorX` has its left edge at `x`, its middle 9 px right of `x`, and its face about 20 px right
  - branch `life-reel`; do not merge, do not push
- No stars, signs or counters announce the restaurants. Each room is told by its look and its dish.
- Outfits: `michelin` (burgundy blazer) in all four restaurants, seated with the `sit` pose and running with `walk`. `nyc` (camel coat) in all four exhibitions.
- Chapter 2's shots, in order: Columbia 1.8 s, night 2 s, dining 5.2 s, MoMA 1.1 s, the Met 1.1 s, the Guggenheim 1.1 s, Kusama 1.1 s, graduation 2.8 s. That makes 16.2 s in all, and the loop about 62 s.
- Run the page checks in Tasks 1, 2 and 6 only. Tasks 3–5 push chapters 3–5 later until Task 6 moves the check times.

## File structure

| File | Responsibility |
|---|---|
| `reel/ch2/columbia.js` (modify) | Yimeng stops at 1.1 s instead of 1.2 s |
| `reel/ch2/night.js` (modify) | No stars; a gilt fan over the door; tilt, stop and entry 0.4 s sooner |
| `reel/ch2/dining.js` (create) | Shot 3: the four restaurants. Exports `roomX`, `seatX`, `heroAt`, `camAt`, `billAt` |
| `reel/ch2/michelin.js` (delete) | Replaced by `dining.js` |
| `reel/ch2/moma.js` (modify) | Yimeng stops at 0.55 s instead of 0.85 s |
| `reel/ch2/met.js` (create) | Shot 5: the Temple of Dendur |
| `reel/ch2/guggenheim.js` (create) | Shot 6: the rotunda from below. Exports `rampAt` |
| `reel/ch2/kusama.js` (create) | Shot 7: the Infinity Mirror Room. Exports `lightsOn` |
| `reel/ch2/index.js` (modify) | The shot list, one change per task |
| `tests/reel/ch2-*.test.js` | One test file per shot, plus `ch2-chapter.test.js`; `ch2-michelin.test.js` is deleted |
| `tests/reel/page-check.sh` (modify) | Times shifted for the 16.2 s chapter 2 |

## How to run things

- Unit tests: `node --test 'tests/reel/*.test.js'` (quote the glob).
- Page checks: `tests/reel/page-check.sh`.
- Frame review: keep `python3 -m http.server 8000 --bind 127.0.0.1` running from the repo root. Then run `node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times …` and `python3 tests/reel/sheet.py /tmp/f /tmp/f.png 2`. For a phone, use `--width 390 --mobile`. Delete the output folder between runs.
- Shot start times once all tasks are done: Columbia 17.5, night 19.3, dining 21.3, MoMA 26.5, the Met 27.6, the Guggenheim 28.7, Kusama 29.8, graduation 30.9. Chapter 3 starts at 33.7.

---

### Task 1: A quieter, quicker way in

**Files:**
- Modify: `reel/ch2/columbia.js`, `reel/ch2/night.js`, `reel/ch2/index.js`
- Test: `tests/reel/ch2-night.test.js` (rewrite), `tests/reel/ch2-columbia.test.js`, `tests/reel/ch2-chapter.test.js`

**Interfaces:**
- Produces: the Columbia arrival lasts 1.8 s, and Yimeng stops at 1.1 s.
- Produces: `night`. It no longer exports `starsLit` and no longer exposes `sign`, and it draws no pixel art (`env.art`) at all.
  - The tilt runs from 0.25 to 1.05 s.
  - The camera slows from 0.95 s and stops at 1.3 s.
  - Yimeng's middle reaches the door at 1.55 s, and Yimeng is gone by 1.85 s. The shot lasts 2 s.

- [ ] **Step 1: Write the failing tests.** Replace `tests/reel/ch2-night.test.js` with:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { night, camAt } from '../../reel/ch2/night.js';

sceneContract('ch2 night', night, 2);

const heroAt = (t) => frameAt(night, 480, t).ctx.calls.filter(c => c[0] === 'drawImage' && String(c[1]).startsWith('nyc:walk'));

test('night: it opens on the skyline and tilts down to the street', () => {
  const streetY = (t) => frameAt(night, 480, t).ctx.draws('street')[0][1];
  assert.ok(streetY(0) >= 96, 'the street starts below the frame');
  assert.ok(streetY(0.7) > 0 && streetY(0.7) < streetY(0), 'rising into view');
  assert.equal(streetY(1.1), 0, 'then in place');
});

test('night: the camera tracks Yimeng at walking pace, then eases to a stop', () => {
  assert.equal(camAt(0.5), 13);
  assert.ok(camAt(1.25) - camAt(1.2) < 0.5, 'slowing down');
  assert.equal(camAt(1.3), camAt(2), 'stopped');
});

test('night: Yimeng walks up to the door and steps inside', () => {
  const s = night.build(480, 96), [[, , x]] = heroAt(1.55);
  assert.ok(Math.abs(x + 9 + 9 - (s.door - camAt(1.55))) <= 1, "Yimeng's middle is at the door");
  assert.equal(heroAt(1.9).length, 0, 'and has gone inside');
});

test('night: no stars over the door, only its light', () => {
  assert.equal(frameAt(night, 480, 1.8).ctx.draws('art').length, 0);
});
```

Apply to `tests/reel/ch2-columbia.test.js`:

`tests/reel/ch2-columbia.test.js`, change 1. Find:

```js
sceneContract('ch2 Columbia', columbia, 2);
```

Replace with:

```js
sceneContract('ch2 Columbia', columbia, 1.8);
```

`tests/reel/ch2-columbia.test.js`, change 2. Find:

```js
  assert.equal(x(1.5), x(1.9), 'then standing still');
```

Replace with:

```js
  assert.equal(x(1.15), x(1.7), 'then standing still');
```

Apply to `tests/reel/ch2-chapter.test.js`:

`tests/reel/ch2-chapter.test.js`, change 1. Find:

```js
test('chapter 2 opens and closes at Columbia, 11.7 s in all', () => {
```

Replace with:

```js
test('chapter 2 opens and closes at Columbia, 11.1 s in all', () => {
```

`tests/reel/ch2-chapter.test.js`, change 2. Find:

```js
  assert.equal(Math.round(CHAPTER_2.shots.reduce((a, s) => a + s.duration, 0) * 10) / 10, 11.7);
```

Replace with:

```js
  assert.equal(Math.round(CHAPTER_2.shots.reduce((a, s) => a + s.duration, 0) * 10) / 10, 11.1);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `node --test 'tests/reel/ch2-night.test.js' 'tests/reel/ch2-columbia.test.js' 'tests/reel/ch2-chapter.test.js'`
Expected: 6 failures:
- `night: it opens on the skyline …`: the street is not in place by 1.1 s.
- `night: the camera tracks Yimeng …`: it has not stopped by 1.3 s.
- `night: Yimeng walks up to the door …`: the door is where Yimeng reaches it at 1.95 s.
- `night: no stars over the door …`: the three stars are still drawn.
- `Columbia: … then stops and looks up`: Yimeng is still walking at 1.15 s.
- `chapter 2 …`: the old total, 11.7 s.

- [ ] **Step 3: Implement.** Apply to `reel/ch2/night.js`:

`reel/ch2/night.js`, change 1. Find:

```js
// to the street, where Yimeng walks up to a black-and-gold restaurant. Three stars light up above its
// door, one by one, and in Yimeng goes.
```

Replace with:

```js
// to the street, where Yimeng walks up to a black-and-gold restaurant and steps into its light.
```

`reel/ch2/night.js`, change 2. Find:

```js
import { gradient, art } from '../kit.js';
```

Replace with:

```js
import { gradient } from '../kit.js';
```

`reel/ch2/night.js`, change 3. Find:

```js
const STOP = [1.15, 1.5];                    // the camera slows over this span and stops; Yimeng walks on
const TILT = [0.3, 1.25];                    // the tilt down from the crowns to the street
```

Replace with:

```js
const STOP = [0.95, 1.3];                    // the camera slows over this span and stops; Yimeng walks on
const TILT = [0.25, 1.05];                   // the tilt down from the crowns to the street
```

`reel/ch2/night.js`, change 4. Find:

```js
const STARS_AT = [1.5, 1.66, 1.82];          // each Michelin star lights up
const ENTER = 1.95;                          // Yimeng steps into the door's light
```

Replace with:

```js
const ENTER = 1.55;                          // Yimeng steps into the door's light
```

`reel/ch2/night.js`, change 5. Find:

```js
export const starsLit = (t) => STARS_AT.filter(at => t >= at).length;
```

Replace with:

```js

```

`reel/ch2/night.js`, change 6. Find:

```js

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
```

Replace with:

```js

```

`reel/ch2/night.js`, change 7. Find:

```js
  // black marble, gold-edged; a double door full of warm light under the star sign
```

Replace with:

```js
  // black marble, gold-edged; a double door full of warm light under a gilt Art Deco fan
```

`reel/ch2/night.js`, change 8. Find:

```js
  p.rect(dx - 6, 44, 26, 11, GOLD); p.rect(dx - 5, 45, 24, 9, '#0b0b0e');        // the star sign
```

Replace with:

```js
  for (let k = 0; k < 9; k++) {                                                  // the fan over the door
    const a = Math.PI * (k + 0.5) / 9;
    for (let q = 3; q < 12; q++) p.px(Math.round(dx + 7 + Math.cos(a) * q * 1.25), Math.round(57 - Math.sin(a) * q), q > 9 ? LIT : GOLD);
  }
  for (let i = dx - 8; i < dx + 23; i++) p.px(i, 57, GOLD);
```

`reel/ch2/night.js`, change 9. Find:

```js
  return { door: dx + 7, sign: dx - 5 };
```

Replace with:

```js
  return { door: dx + 7 };
```

`reel/ch2/night.js`, change 10. Find:

```js
  const { door, sign } = restaurant(st, rx);
```

Replace with:

```js
  const { door } = restaurant(st, rx);
```

`reel/ch2/night.js`, change 11. Find:

```js
    W, H, hx, door, sign, layers: { sky: gradient(W, H, SKY), burst: sunburst(W, H), far: buildFar(W), mid: buildMid(W), street: st },
```

Replace with:

```js
    W, H, hx, door, layers: { sky: gradient(W, H, SKY), burst: sunburst(W, H), far: buildFar(W), mid: buildMid(W), street: st },
```

`reel/ch2/night.js`, change 12. Find:

```js
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
```

Replace with:

```js

```

Apply to `reel/ch2/columbia.js`:

`reel/ch2/columbia.js`, change 1. Find:

```js
  const hero = env.hero('nyc'), stopAt = 1.2;                                    // walks in, stops, looks up
```

Replace with:

```js
  const hero = env.hero('nyc'), stopAt = 1.1;                                    // walks in, stops, looks up
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
    { id: 'ch2-columbia', scene: columbia, caption: 'New York', duration: 1.8, fadeIn: 0.35, fadeOut: 0.15 },
    { id: 'ch2-night', scene: night, caption: 'New York', duration: 2, fadeIn: 0.15, fadeOut: 0.15 },
    { id: 'ch2-michelin', scene: michelin, caption: 'New York', duration: 3, fadeIn: 0.2, fadeOut: 0.2 },
    { id: 'ch2-moma', scene: moma, caption: 'New York', duration: 1.5, fadeIn: 0.2, fadeOut: 0.2 },
    { id: 'ch2-graduation', scene: graduation, caption: 'New York', duration: 2.8, fadeIn: 0.2, fadeOut: 0.3 },
  ],
};
```

- [ ] **Step 4: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 125`, `ℹ fail 0`, then 15 `ok` lines and exit 0. Chapter 2 is 11.1 s here, so the old check times still fall in the right chapters.

- [ ] **Step 5: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 19.6,20.6,21.0 && python3 tests/reel/sheet.py /tmp/f /tmp/f-night.png 2
```

Expected:
- 19.6 s: the crowns, the sunburst and the searchlights, as before.
- 20.6 s: on the street, Yimeng reaches the restaurant. The sign with the stars is gone; a gilt Art Deco fan of rays crowns the gold door instead.
- 21.0 s: Yimeng has faded into the door's light.

- [ ] **Step 6: Commit**

```bash
git add reel/ch2/columbia.js reel/ch2/night.js reel/ch2/index.js tests/reel/ch2-night.test.js tests/reel/ch2-columbia.test.js tests/reel/ch2-chapter.test.js
git commit -m "fix(reel): Drop the three stars and tighten chapter 2's way in"
```

---

### Task 2: Four restaurants, eaten from left to right

**Files:**
- Create: `reel/ch2/dining.js`
- Delete: `reel/ch2/michelin.js`, `tests/reel/ch2-michelin.test.js`
- Modify: `reel/ch2/index.js`
- Test: `tests/reel/ch2-dining.test.js`, `tests/reel/ch2-chapter.test.js`

**Interfaces:**
- Produces: `roomX(k)`, the left wall of restaurant `k` (0 French, 1 Japanese, 2 Italian, 3 Chinese) in the set's world coordinates. The rooms are 100 px wide with 4 px pillars between them, and 120 px of dark wall at each end.
- Produces: `seatX(k) = roomX(k) + 4`, Yimeng's left edge when seated there.
- Produces: `heroAt(t) → { x, seated, room }`.
  - Yimeng sits for 0.8 s at each table, starting at 0, 1.25, 2.5 and 3.75 s.
  - Between tables Yimeng runs for 0.45 s, eased.
- Produces: `camAt(t, W)`. When the row fits (`W ≥ 428`), the camera holds it centred. Otherwise it keeps Yimeng at `round(0.34 W)`, clamped to the row.
- Produces: `billAt(t) → { drop, run }`. From 4.55 s the bill unrolls over 0.45 s: 14 px down the tablecloth, then 318 px back along the floor.
- Produces: `dining` (a scene), with layers `back` (walls, decor, chairs) and `front` (the tables and counter, drawn after the seated Yimeng).

- [ ] **Step 1: Write the failing tests.** Create `tests/reel/ch2-dining.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { dining, heroAt, camAt, billAt, seatX, roomX } from '../../reel/ch2/dining.js';

sceneContract('ch2 dining', dining, 5.2);

const AT_TABLE = [0.4, 1.65, 2.9, 4.15];       // a moment at each of the four tables

test('dining: Yimeng eats in four restaurants, left to right', () => {
  const seated = AT_TABLE.map(heroAt);
  assert.deepEqual(seated.map(h => [h.room, h.seated]), [[0, true], [1, true], [2, true], [3, true]]);
  assert.ok(seated.every((h, k) => k === 0 || h.x > seated[k - 1].x), 'each one further right');
  assert.equal(heroAt(1).seated, false, 'running between tables');
});

test('dining: the whole row fits a desktop; on a phone the camera follows Yimeng', () => {
  assert.equal(camAt(0, 480), camAt(4, 480), 'held still on desktop');
  const phone = AT_TABLE.map(t => camAt(t, 195));
  assert.ok(phone.every((c, k) => k === 0 || c > phone[k - 1]), 'panning right on a phone');
  assert.equal(seatX(2) - camAt(2.9, 195), Math.round(195 * 0.34), 'with Yimeng a third of the way in');
});

test('dining: Yimeng sits behind each table, and runs in front of them', () => {
  const cam = camAt(0, 480);
  assert.deepEqual(frameAt(dining, 480, 0.4).ctx.draws('michelin:sit:1'), [[seatX(0) - cam - 9, 84 - 1 - 38]]);
  const run = frameAt(dining, 480, 1).ctx.calls.filter(c => c[0] === 'drawImage').map(c => String(c[1]));
  assert.ok(run.findIndex(n => n.startsWith('michelin:walk')) > run.indexOf('front'));
});

test('dining: after the last course the bill runs back under every restaurant', () => {
  assert.deepEqual(billAt(4.5), { drop: 0, run: 0 });
  const end = billAt(5.2);
  assert.equal(end.drop, 90 - 76, 'down the tablecloth to the floor');
  assert.ok(end.run > roomX(3) - roomX(0), 'then back past the first restaurant');
});
```

Apply to `tests/reel/ch2-chapter.test.js`:

`tests/reel/ch2-chapter.test.js`, change 1. Find:

```js
test('chapter 2 opens and closes at Columbia, 11.1 s in all', () => {
```

Replace with:

```js
test('chapter 2 opens and closes at Columbia, 13.3 s in all', () => {
```

`tests/reel/ch2-chapter.test.js`, change 2. Find:

```js
  assert.deepEqual(CHAPTER_2.shots.map(s => s.id), ['ch2-columbia', 'ch2-night', 'ch2-michelin', 'ch2-moma', 'ch2-graduation']);
```

Replace with:

```js
  assert.deepEqual(CHAPTER_2.shots.map(s => s.id), ['ch2-columbia', 'ch2-night', 'ch2-dining', 'ch2-moma', 'ch2-graduation']);
```

`tests/reel/ch2-chapter.test.js`, change 3. Find:

```js
  assert.equal(Math.round(CHAPTER_2.shots.reduce((a, s) => a + s.duration, 0) * 10) / 10, 11.1);
```

Replace with:

```js
  assert.equal(Math.round(CHAPTER_2.shots.reduce((a, s) => a + s.duration, 0) * 10) / 10, 13.3);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `node --test 'tests/reel/ch2-dining.test.js' 'tests/reel/ch2-chapter.test.js'`
Expected: the dining file fails to load (`Cannot find module …/reel/ch2/dining.js`), and the chapter test fails (still `ch2-michelin`).

- [ ] **Step 3: Implement.** Create `reel/ch2/dining.js`:

```js
// Chapter 2, shot 3: eating across New York. One long shot through four restaurants side by side,
// left to right: French, Japanese, Italian, Chinese. At each, Yimeng sits down to its signature
// moment: a cloche lifted on one tiny bite, nigiri laid down piece by piece, white truffle shaved
// over pasta, Peking duck carved at the table. Then Yimeng eats, dashes on to the next and leaves an
// empty plate behind. At the last table the bill unrolls to the floor and runs back under all four.
import { Painter, rng } from '../pixels.js';
import { art } from '../kit.js';

const FLOOR = 90, SEAT = 84, TOP = 76;        // floor, seat and table-top rows
const ROOM = 100, WALL = 4, MARGIN = 120;     // a restaurant's width, the pillars between, the dark ends
const ROW = 4 * ROOM + 5 * WALL;              // the four restaurants, wall to wall
const EAT = 0.8, DASH = 0.45, BILL = 0.45;    // seconds at each table, running to the next, unrolling the bill
const GOLD = '#d9b44a', DEEP = '#9c7c2c', CLOTH = '#f4f1ea', FOLD = '#d9d4ca';

export const roomX = (k) => MARGIN + WALL + k * (ROOM + WALL);   // a restaurant's left wall, world x
export const seatX = (k) => roomX(k) + 4;                        // where Yimeng sits in it (left edge)
const startAt = (k) => k * (EAT + DASH);                         // when Yimeng sits down there

const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : (1 - Math.cos(u * Math.PI)) / 2);

// Where Yimeng is at time t: seated at a table, or running between two.
export function heroAt(t) {
  for (let k = 0; k < 3; k++) {
    const leave = startAt(k) + EAT;
    if (t < leave) return { x: seatX(k), seated: true, room: k };
    if (t < leave + DASH) return { x: seatX(k) + (seatX(k + 1) - seatX(k)) * ease((t - leave) / DASH), seated: false, room: k };
  }
  return { x: seatX(3), seated: true, room: 3 };
}

// The camera holds still when all four fit, and otherwise keeps Yimeng a third of the way in.
export function camAt(t, W) {
  if (W >= ROW + 8) return Math.round(MARGIN + ROW / 2 - W / 2);
  const x = heroAt(t).x - Math.round(W * 0.34);
  return Math.round(Math.min(Math.max(x, MARGIN - 4), MARGIN + ROW + 4 - W));
}

// How far the bill has unrolled after the last course: down the tablecloth, then back along the
// floor under the other restaurants.
export function billAt(t) {
  const u = Math.max(0, t - startAt(3) - EAT) / BILL, len = Math.round(Math.min(1, u) * (roomX(3) + 16 - MARGIN));
  const drop = Math.min(len, FLOOR - TOP);
  return { drop, run: len - drop };
}

// ---------- the staff, all facing left towards Yimeng ----------
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
const TOQUE = `
.....WWWWWWW........
....WWWWWWWWW.......
....WWWWWWWWW.......
.....WWWWWWW........`;
const STAFF = { E: '#241c22', S: '#f0c8a4', s: '#d9a885', e: '#e0b08c', q: '#b88466', M: '#3a2a22', W: '#f6f4ee', b: '#1c1c22', K: '#1a1a20', P: '#22222a', O: '#121216', H: '#2a2026', h: '#4a3a40' };
const OUTLINE = '#141016';
const WAITER = art(STAFF_ROWS, STAFF, OUTLINE);                                      // tailcoat, moustache
const ITAMAE = art(STAFF_ROWS.replace('.HHHHHHHHHHHHHHHH...', '.BBBBBBBBBBBBBBBBBB.'),   // white coat, headband
  { ...STAFF, M: '#f0c8a4', B: '#f4f1ea', K: '#f4f1ea', W: '#f4f1ea', b: '#d8d2c4', P: '#2a2a30' }, OUTLINE);
const CAMERIERE = art(STAFF_ROWS, { ...STAFF, H: '#8a8a94', h: '#b4b4bc', M: '#8a8a94', K: '#7a1e2a' }, OUTLINE);   // grey hair, wine-red waistcoat
const CHEF = art(TOQUE + STAFF_ROWS, { ...STAFF, M: '#f0c8a4', K: '#f4f1ea', b: '#c8302a' }, OUTLINE);              // whites, a tall toque

// A sleeve from shoulder to hand, 2px thick, ending in a hand.
function arm(ctx, x0, y0, x1, y1, sleeve, hand = '#f0c8a4') {
  const n = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0));
  ctx.fillStyle = sleeve;
  for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 2, 2);
  ctx.fillStyle = hand; ctx.fillRect(x1, y1, 2, 2);
}

// ---------- props ----------
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
const DUCK = art(`
....rrrr..
..rRRRRRr.
.rRRWRRRRr
rRRRRRRRRr
.rrrrrrrr.
`, { r: '#8a3a1a', R: '#b8602a', W: '#f2c28a' }, '#3a1a0e');
const TRUFFLE = art(`
.tt.
tTTt
.tt.
`, { t: '#b8a684', T: '#d8c8a4' }, '#5a4a32');

// ---------- the set ----------
function pillar(p, x) {
  for (let y = 0; y < FLOOR + 6; y++) for (let i = 0; i < WALL; i++) p.px(x + i, y, i === 0 || i === WALL - 1 ? GOLD : '#141016');
}

function chair(p, hx, wood, cushion) {
  for (let y = 62; y < FLOOR; y++) for (let x = hx + 1; x <= hx + 3; x++) p.px(x, y, x === hx + 1 ? '#2a160e' : wood);
  for (let x = hx + 1; x <= hx + 17; x++) { p.px(x, SEAT, cushion); p.px(x, SEAT + 1, wood); }
  for (let y = SEAT + 2; y < FLOOR; y++) { p.px(hx + 2, y, '#2a160e'); p.px(hx + 16, y, '#2a160e'); }
}

function frenchRoom(p, x) {
  for (let y = 0; y < 96; y++) for (let i = x; i < x + ROOM; i++) {
    let c = ((i >> 2) + (y >> 2)) % 2 === 0 && (i + y) % 3 === 0 ? '#3a1c20' : '#2c1418';   // damask
    if (y === 12 || y === 15) c = GOLD;
    if (y === 13 || y === 14) c = i % 6 < 3 ? DEEP : '#5a4418';
    if (y >= 64 && y < 80) c = y === 64 ? GOLD : (i - x) % 25 === 0 || y === 67 || y === 77 ? DEEP : '#3a1a1e';
    if (y >= 80) c = (i + y * 2) % 12 === 0 || (i - y * 2) % 12 === 0 ? '#6a3a22' : (i + y) % 2 ? '#3a1a1e' : '#341618';
    p.px(i, y, c);
  }
  for (let y = 26; y < 58; y++) for (let i = x + 74; i < x + 94; i++) {             // a gilt mirror
    p.px(i, y, i === x + 74 || i === x + 93 || y === 26 || y === 57 ? GOLD : (i + y) % 9 === 0 ? '#5a4a4e' : '#3a2e34');
  }
  for (let k = 0; k < 6; k++) p.px(x + 78 + k * 2, 29 + k, '#6a5a60');
  for (const sx of [x + 69, x + 97]) { p.rect(sx, 40, 2, 5, GOLD); p.rect(sx - 1, 37, 4, 3, '#fff1c4'); }
  const cx = x + 38;                                                                 // the chandelier
  for (let y = 0; y < 16; y++) p.px(cx, y, DEEP);
  for (let k = -12; k <= 12; k++) { p.px(cx + k, 24, GOLD); p.px(cx + k, 25, DEEP); }
  for (const k of [-12, -6, 0, 6, 12]) {
    for (let y = 16; y < 24; y++) p.px(Math.round(cx + k * (y - 16) / 8), y, GOLD);
    p.rect(cx + k - 1, 21, 3, 3, '#f4f1ea'); p.px(cx + k, 20, '#ffe6a6');
    for (let y = 26; y < 29 + (Math.abs(k) % 3); y++) p.px(cx + k, y, y % 2 ? '#e8f2fa' : '#b8cce0');
  }
  chair(p, x + 4, '#5a3020', '#8a2438');
}

function japaneseRoom(p, x) {
  for (let y = 0; y < 96; y++) for (let i = x; i < x + ROOM; i++) {
    let c = (i - x) % 5 === 0 ? '#c4aa80' : (i + y * 3) % 17 === 0 ? '#e4cfa6' : '#d9c29a';   // hinoki slats
    if (y < 14) c = '#b89a70';
    if (y >= 64 && y < 80) c = y === 64 ? '#6a4a30' : (i - x) % 10 === 0 ? '#6a4a30' : '#8a6a48';
    if (y >= 80) c = (i - x + (y % 2) * 6) % 12 === 0 || y % 4 === 3 ? '#2a2a30' : '#3a3a42';   // slate floor
    p.px(i, y, c);
  }
  for (let y = 24; y < 50; y++) for (let i = x + 6; i < x + 32; i++) {             // a round window: bamboo and moon
    const d = Math.hypot(i - x - 18.5, (y - 37) * 1.0);
    if (d > 13) continue;
    let c = d > 12 ? '#4a3220' : '#1a2440';
    if (Math.hypot(i - x - 23, y - 31) < 3) c = '#f4e6a8';
    if (d <= 12 && ((i - x) % 7 === 2 || (i - x) % 7 === 3) && (y + i) % 5) c = '#3f6e3a';
    p.px(i, y, c);
  }
  for (let y = 30; y < 54; y++) for (let i = x + 70; i < x + 96; i++) {             // the noren, three panels and a crest
    if ((i - x - 70) % 9 === 8 && y > 34) continue;
    p.px(i, y, y < 33 ? '#1e2c4e' : '#2c3e6b');
  }
  for (let a = 0; a < Math.PI * 2; a += 0.3) p.px(Math.round(x + 83 + Math.cos(a) * 3), Math.round(42 + Math.sin(a) * 3), '#f4f1ea');
  for (let y = 20; y < 34; y++) {                                                   // a paper lantern
    const hw = Math.round(5 * Math.sin(((y - 20) / 14) * Math.PI)) + 1;
    for (let i = -hw; i <= hw; i++) p.px(x + 46 + i, y, y < 22 || y > 31 ? '#c8302a' : (y % 3 ? '#f6ecd6' : '#e8d8b8'));
  }
  for (let y = 14; y < 20; y++) p.px(x + 46, y, '#2a2a30');
  for (let y = SEAT; y < FLOOR; y++) for (let i = x + 7; i <= x + 17; i++) {       // a plain wooden stool
    if (y < SEAT + 2) p.px(i, y, y === SEAT ? '#c8a878' : '#a8885a');
    else if (i === x + 8 || i === x + 16) p.px(i, y, '#8a6a48');
  }
}

function italianRoom(p, x) {
  const r = rng(7);
  for (let y = 0; y < 96; y++) for (let i = x; i < x + ROOM; i++) {
    const v = r();
    let c = v < 0.08 ? '#d9a37a' : v < 0.14 ? '#ecc49c' : '#e3b48a';                // warm plaster
    if (y >= 64 && y < 80) c = y === 64 ? '#3a2416' : (i - x) % 20 === 0 ? '#3a2416' : '#5a3a26';
    if (y >= 80) c = (i - x) % 8 === 0 || y % 5 === 4 ? '#8a3e22' : (i + y) % 3 ? '#b8603a' : '#a8502e';   // terracotta
    p.px(i, y, c);
  }
  for (let y = 28; y < 46; y++) for (let i = x + 6; i < x + 30; i++) {             // a Tuscan landscape in a gilt frame
    const edge = i === x + 6 || i === x + 29 || y === 28 || y === 45;
    let c = y < 36 ? '#a8c8e0' : y < 40 ? '#c8b860' : '#8aa850';
    if (Math.abs(i - x - 12) < 2 - (y < 34 ? 1 : 0) && y > 31 && y < 41) c = '#2f4a2a';   // a cypress
    if (Math.abs(i - x - 22) < 2 && y > 33 && y < 41) c = '#2f4a2a';
    p.px(i, y, edge ? GOLD : c);
  }
  for (let y = 24; y < 62; y++) for (let i = x + 70; i < x + 96; i++) {             // a wine rack
    const cell = (i - x - 70) % 4 < 3 && (y - 24) % 4 < 3;
    p.px(i, y, i === x + 70 || i === x + 95 || y === 24 || y === 61 ? '#3a2416' : cell ? ((i + y) % 8 < 4 ? '#1f3a26' : '#5a1a24') : '#4a2e1c');
    if (cell && (i - x - 70) % 4 === 0 && (y - 24) % 4 === 0) p.px(i, y, '#8aa890');
  }
  for (let y = 0; y < 20; y++) p.px(x + 40, y, '#2a2a30');                         // a pendant lamp
  for (let k = 0; k < 4; k++) for (let i = -2 - k; i <= 2 + k; i++) p.px(x + 40 + i, 20 + k, k === 3 ? '#1f4a2e' : '#2f6a3e');
  p.rect(x + 39, 24, 3, 1, '#fff1c4');
  chair(p, x + 4, '#6a4428', '#c8a050');
}

function chineseRoom(p, x) {
  for (let y = 0; y < 96; y++) for (let i = x; i < x + ROOM; i++) {
    let c = (i + y * 2) % 23 === 0 ? '#8a2228' : '#7a1a1e';                          // red lacquer
    if (y === 12 || y === 14) c = GOLD;
    if (y === 13) c = DEEP;
    if (y >= 64 && y < 80) c = y === 64 ? GOLD : '#3a1a12';
    if (y >= 80) c = ((i - x) % 14 === 7 && y % 7 === 3) ? GOLD : (i + y) % 2 ? '#5a1418' : '#4a1014';
    p.px(i, y, c);
  }
  for (let y = 22; y < 62; y++) for (let i = x + 66; i < x + 96; i++) {             // a rosewood lattice screen, lit behind
    const gx = (i - x - 66) % 6, gy = (y - 22) % 6;
    const bar = gx === 0 || gy === 0 || (gx === gy && gx < 3) || (gx + gy === 6 && gx > 3);
    p.px(i, y, i === x + 66 || i === x + 95 || y === 22 || y === 61 || bar ? '#3a1a12' : '#c89a4a');
  }
  for (const lx of [x + 24, x + 56]) {                                               // two red lanterns
    for (let y = 8; y < 16; y++) p.px(lx, y, '#2a160e');
    for (let y = 16; y < 28; y++) {
      const hw = Math.round(5 * Math.sin(((y - 15) / 13) * Math.PI));
      for (let i = -hw; i <= hw; i++) p.px(lx + i, y, y === 16 || y === 27 ? GOLD : Math.abs(i) === hw ? '#9a1e1e' : (i + 9) % 3 ? '#c8302a' : '#e04a3a');
    }
    for (let y = 28; y < 33; y++) p.px(lx, y, y < 30 ? GOLD : '#e04a3a');            // the tassel
  }
  chair(p, x + 4, '#3a1a12', '#c8302a');
}

function ends(p, x0, x1) {
  for (let y = 0; y < 96; y++) for (let i = x0; i < x1; i++) {
    let c = (i % 30 === 0 || i % 30 === 1) && y < 80 ? DEEP : '#0c0c11';
    if (y === 80) c = '#2a2a30';
    p.px(i, y, c);
  }
}

// What stands in front of the seated diner: the tables and the counter.
function fronts() {
  const f = new Painter(MARGIN * 2 + ROW, 96);
  const cloth = (x0, x1) => {
    for (let y = TOP; y < FLOOR + 2; y++) for (let x = x0; x <= x1; x++) {
      f.px(x, y, y === TOP ? '#ffffff' : (x - x0) % 7 === 0 && y > TOP + 3 ? FOLD : y > FLOOR - 3 ? '#e8e4da' : CLOTH);
    }
  };
  cloth(roomX(0) + 19, roomX(0) + 61);                                               // French: white cloth to the floor
  const j = roomX(1);
  for (let y = TOP - 1; y < FLOOR + 2; y++) for (let x = j + 19; x <= j + 61; x++) { // Japanese: the hinoki counter
    f.px(x, y, y < TOP + 1 ? (y === TOP - 1 ? '#f2e2c2' : '#e8d4b0') : (x - j) % 9 === 0 ? '#a8885a' : '#c8a878');
  }
  const it = roomX(2);
  for (let x = it + 19; x <= it + 61; x++) { f.px(x, TOP, '#7a5232'); f.px(x, TOP + 1, '#4a2e1c'); }   // Italian: walnut, bare legs
  for (const lx of [it + 22, it + 58]) for (let y = TOP + 2; y < FLOOR; y++) f.px(lx, y, '#4a2e1c');
  for (let x = it + 30; x <= it + 46; x++) f.px(x, TOP, '#ece6d8');                 // a linen runner
  cloth(roomX(3) + 19, roomX(3) + 61);                                               // Chinese: a round table
  for (let x = roomX(3) + 19; x <= roomX(3) + 61; x++) f.px(x, TOP + 1, '#c8302a');
  return f;
}

export function buildDining(W, H = 96) {
  const back = new Painter(MARGIN * 2 + ROW, H);
  ends(back, 0, MARGIN); ends(back, MARGIN + ROW, MARGIN * 2 + ROW);
  [frenchRoom, japaneseRoom, italianRoom, chineseRoom].forEach((room, k) => room(back, roomX(k)));
  for (let k = 0; k <= 4; k++) pillar(back, MARGIN + k * (ROOM + WALL));
  const r = rng(11), flakes = Array.from({ length: 18 }, () => [Math.floor(r() * 9) - 4, Math.floor(r() * 3)]);
  return { W, H, flakes, layers: { back, front: fronts() } };
}

// ---------- each restaurant's moment; u is the time since Yimeng sat down there ----------
// X maps a world x to the screen.
function french(ctx, u, t, X, env) {
  const x = roomX(0), px = X(x + 37);
  ctx.fillStyle = '#b9b4aa'; ctx.fillRect(px - 12, TOP - 1, 25, 1);                   // a wide plate
  ctx.fillStyle = '#ffffff'; ctx.fillRect(px - 12, TOP - 2, 25, 1); ctx.fillRect(px - 10, TOP - 3, 21, 1);
  if (u < 0.55) { ctx.fillStyle = '#e8414b'; ctx.fillRect(px, TOP - 4, 2, 1); ctx.fillStyle = '#4f9a4a'; ctx.fillRect(px + 1, TOP - 5, 1, 1); }
  else { ctx.fillStyle = '#8a2438'; ctx.fillRect(px - 3, TOP - 3, 1, 1); ctx.fillRect(px + 2, TOP - 3, 2, 1); }   // a smear of sauce
  const wx = X(x + 47) + 8, wy = FLOOR - WAITER.h + 1 + 19;
  if (u < EAT) {                                                                      // the cloche goes up and stays up
    const lift = Math.round(ease((u - 0.05) / 0.25) * 9), cy = TOP - 2 - CLOCHE.h - lift;
    ctx.drawImage(env.art(CLOCHE), px - 6, cy);
    arm(ctx, wx, wy, px + 2, cy - 1, '#1a1a20', '#f6f4ee');
    if (u > 0.3 && u < 0.45) { ctx.fillStyle = '#ffffff'; ctx.fillRect(px - 3, cy + 2, 1, 1); ctx.fillRect(px - 4, cy + 3, 3, 1); }
  } else arm(ctx, wx, wy, wx - 3, wy + 6, '#1a1a20', '#f6f4ee');
  ctx.fillStyle = GOLD; ctx.fillRect(X(x + 23), TOP - 2, 3, 2);                        // a candle
  ctx.fillStyle = '#f4efe2'; ctx.fillRect(X(x + 24), TOP - 7, 1, 5);
  ctx.fillStyle = Math.floor(t * 12) % 2 ? '#ffd27a' : '#fff1c4'; ctx.fillRect(X(x + 24), TOP - 9, 1, 2);
}

function japanese(ctx, u, t, X) {
  const x = roomX(1), gx = X(x + 29);
  ctx.fillStyle = '#7a5232'; ctx.fillRect(gx, TOP - 2, 18, 1); ctx.fillStyle = '#5a3a22'; ctx.fillRect(gx, TOP - 1, 18, 1);   // the board
  const TOPPINGS = ['#c8303a', '#f08a4a', '#f4d8c8'];                                   // tuna, salmon, yellowtail
  let reach = null;
  for (let i = 0; i < 3; i++) {
    const at = 0.06 + i * 0.14, nx = gx + 2 + i * 5;
    if (u >= at && u < 0.44 + i * 0.12) {
      ctx.fillStyle = '#f4f1ea'; ctx.fillRect(nx, TOP - 3, 4, 1);
      ctx.fillStyle = TOPPINGS[i]; ctx.fillRect(nx, TOP - 4, 4, 1);
    }
    if (u >= at - 0.08 && u < at + 0.04) reach = nx + 1;                                // the chef's hand lays each piece down
  }
  if (u >= EAT) { ctx.fillStyle = '#f2a8b8'; ctx.fillRect(gx + 14, TOP - 3, 2, 1); }      // pickled ginger left behind
  const sx = X(x + 47) + 8, sy = FLOOR - ITAMAE.h + 1 + 19;
  arm(ctx, sx, sy, reach ?? sx - 4, reach ? TOP - 6 : sy + 5, '#f4f1ea');
}

function italian(ctx, u, t, X, env, flakes) {
  const x = roomX(2), px = X(x + 37);
  ctx.fillStyle = '#b9b4aa'; ctx.fillRect(px - 10, TOP - 1, 21, 1);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(px - 10, TOP - 2, 21, 1);
  const left = u < 0.45 ? 1 : u < 0.75 ? 1 - (u - 0.45) / 0.3 : 0;                      // how much pasta is left
  if (left > 0) {
    const w = Math.max(2, Math.round(9 * left));
    ctx.fillStyle = '#e8c060'; ctx.fillRect(px - (w >> 1), TOP - 3, w, 1);
    if (left > 0.35) { ctx.fillStyle = '#f2d27a'; ctx.fillRect(px - (w >> 1) + 1, TOP - 4, Math.max(1, w - 2), 1); }
  }
  const shaved = Math.floor(Math.max(0, Math.min(u, 0.42)) / 0.42 * flakes.length);
  ctx.fillStyle = '#e8dcc0';
  flakes.slice(0, Math.round(shaved * left)).forEach(([dx, dy]) => ctx.fillRect(px + dx, TOP - 4 - dy, 1, 1));
  const wx = X(x + 47) + 8, wy = FLOOR - CAMERIERE.h + 1 + 19;
  if (u > -0.3 && u < 0.42) {                                                         // the truffle and its slicer over the plate
    const hx = px + 4, hy = TOP - 16 + (Math.floor(t * 16) % 2);
    arm(ctx, wx, wy, hx + 3, hy + 2, '#f6f4ee');
    ctx.drawImage(env.art(TRUFFLE), hx - 3, hy - 1);
    ctx.fillStyle = '#c9ced8'; ctx.fillRect(hx - 1, hy + 3, 5, 1);
    if (u > 0) { ctx.fillStyle = '#e8dcc0'; ctx.fillRect(hx, hy + 5 + Math.floor(t * 30) % 6, 1, 1); ctx.fillRect(hx + 2, hy + 7 + Math.floor(t * 24) % 5, 1, 1); }
  } else arm(ctx, wx, wy, wx - 3, wy + 6, '#f6f4ee');
}

function chinese(ctx, u, t, X, env) {
  const x = roomX(3), cx = X(x + 40);
  ctx.fillStyle = '#c8dce6'; ctx.fillRect(cx - 15, TOP - 1, 31, 1);                      // the glass turntable
  ['#4f9a4a', '#c8302a', '#c8a050', '#f4f1ea'].forEach((col, i) => {
    const a = t * 1.6 + i * Math.PI / 2, dx = Math.round(Math.cos(a) * 12);
    if (Math.sin(a) < -0.2) return;                                                    // round the back of the turntable
    ctx.fillStyle = '#f6f4ee'; ctx.fillRect(cx + dx - 2, TOP - 3, 5, 2);
    ctx.fillStyle = col; ctx.fillRect(cx + dx - 1, TOP - 4, 3, 1);
  });
  ctx.drawImage(env.art(DUCK), X(x + 47), TOP - 7);                                    // the duck, on its board
  ctx.fillStyle = '#6a4428'; ctx.fillRect(X(x + 46), TOP - 2, 13, 1);
  const carved = u < 0 ? 0 : Math.min(6, Math.floor(Math.min(u, 0.42) / 0.07));
  const eaten = u < 0.45 ? 0 : Math.min(6, Math.floor((u - 0.45) / 0.05));
  const px = X(x + 26);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(px - 3, TOP - 2, 9, 1);
  for (let i = eaten; i < carved; i++) { ctx.fillStyle = i % 2 ? '#e8c8a0' : '#c8702a'; ctx.fillRect(px - 2 + (i % 3) * 2, TOP - 3 - Math.floor(i / 3), 2, 1); }
  const carving = u >= 0 && u < 0.42, chop = carving ? (Math.floor(t * 14) % 2) * 3 : 0;
  arm(ctx, X(x + 47) + 8, FLOOR - CHEF.h + 1 + 23, X(x + 52), TOP - 9 + chop, '#f4f1ea');
  if (carving) { ctx.fillStyle = '#c9ced8'; ctx.fillRect(X(x + 51), TOP - 12 + chop, 1, 3); }   // the knife
}

export function renderDining(ctx, t, s, env) {
  const { W, H, canvases: c } = s, cam = camAt(t, W), X = (x) => Math.round(x - cam);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.back, -cam, 0);
  const here = heroAt(t), hero = here.seated ? env.hero('michelin', 'sit') : env.hero('michelin');
  // the staff behind their tables, Yimeng seated, then the tables in front
  for (const [who, k] of [[WAITER, 0], [ITAMAE, 1], [CAMERIERE, 2], [CHEF, 3]]) ctx.drawImage(env.art(who), X(roomX(k) + 47), FLOOR - who.h + 1);
  if (here.seated) ctx.drawImage(hero.canvases[Math.floor(t * 4) % 2], X(here.x) - hero.anchorX, SEAT - 1 - hero.seatY);
  ctx.drawImage(c.front, -cam, 0);
  french(ctx, t - startAt(0), t, X, env);
  japanese(ctx, t - startAt(1), t, X);
  italian(ctx, t - startAt(2), t, X, env, s.flakes);
  chinese(ctx, t - startAt(3), t, X, env);
  // Yimeng dashing on to the next table, with speed lines
  if (!here.seated) {
    const hx = X(here.x);
    ctx.drawImage(hero.canvases[Math.floor(t * 14) % 4], hx - hero.anchorX, FLOOR - hero.footY);
    ctx.fillStyle = 'rgba(244, 241, 234, 0.7)';
    for (const [dy, len] of [[62, 6], [68, 9], [74, 5]]) ctx.fillRect(hx - len - 2, dy, len, 1);
  }
  // the bill, down to the floor and back under every restaurant
  const { drop, run } = billAt(t);
  if (drop > 0) {
    const bx = X(roomX(3) + 16);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, TOP, 5, drop);
    if (run) ctx.fillRect(bx + 5 - run, FLOOR - 1, run, 3);
    ctx.fillStyle = '#9a958c';
    for (let y = TOP + 1; y < TOP + drop; y += 2) ctx.fillRect(bx + 1, y, y % 6 ? 3 : 2, 1);
    for (let x = bx + 4 - run; x < bx; x += 3) ctx.fillRect(x, FLOOR, 2, 1);
    ctx.fillStyle = '#1a1a20'; ctx.fillRect(bx - 1, TOP - 1, 7, 2);                      // the bill folder
    if (run > 40) {                                                                    // a bead of sweat
      const top = SEAT - 1 - hero.seatY, hx = X(here.x);
      ctx.fillStyle = '#bfe3f2'; ctx.fillRect(hx + 3, top + 17, 1, 2); ctx.fillRect(hx + 2, top + 18, 1, 1);
    }
  }
}

export const dining = { build: buildDining, render: renderDining };
```

Delete the old dinner and its test:

```bash
git rm reel/ch2/michelin.js tests/reel/ch2-michelin.test.js
```

Replace `reel/ch2/index.js` with:

```js
// Chapter 2: New York, from the first day at Columbia to the cap toss.
import { columbia } from './columbia.js';
import { night } from './night.js';
import { dining } from './dining.js';
import { moma } from './moma.js';
import { graduation } from './graduation.js';

export const CHAPTER_2 = {
  name: 'New York',
  shots: [
    { id: 'ch2-columbia', scene: columbia, caption: 'New York', duration: 1.8, fadeIn: 0.35, fadeOut: 0.15 },
    { id: 'ch2-night', scene: night, caption: 'New York', duration: 2, fadeIn: 0.15, fadeOut: 0.15 },
    { id: 'ch2-dining', scene: dining, caption: 'New York', duration: 5.2, fadeIn: 0.2, fadeOut: 0.2 },
    { id: 'ch2-moma', scene: moma, caption: 'New York', duration: 1.5, fadeIn: 0.2, fadeOut: 0.2 },
    { id: 'ch2-graduation', scene: graduation, caption: 'New York', duration: 2.8, fadeIn: 0.2, fadeOut: 0.3 },
  ],
};
```

- [ ] **Step 4: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 126`, `ℹ fail 0`, then 15 `ok` lines and exit 0. Chapter 2 is 13.3 s here, still inside the old check times.

- [ ] **Step 5: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 21.7,22.4,24.0,25.4,26.2 && python3 tests/reel/sheet.py /tmp/f /tmp/f-dine.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 21.7,23.0,24.3,25.4,26.35 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-dine.png 2
```

Expected:
- On desktop, all four restaurants side by side between dark gold-lined ends:
  - French: damask, a chandelier, a gilt mirror.
  - Japanese: hinoki slats, a round window with bamboo and the moon, a paper lantern, an indigo noren.
  - Italian: warm plaster, a Tuscan landscape, a wine rack, a green pendant lamp.
  - Chinese: red lacquer, two red lanterns, a lit rosewood lattice.
- 21.7 s: in the French room, Yimeng sits in the burgundy blazer while the waiter holds the cloche up over one tiny bite.
- 22.4 s: Yimeng runs right with speed lines, leaving a smear of sauce on an empty plate.
- 24.0 s: in the Italian room, the grey-haired waiter in a wine-red waistcoat shaves truffle over the pasta. The Japanese board behind Yimeng is empty but for pickled ginger.
- 25.4 s: in the Chinese room, the chef in a toque carves the duck, slices pile on Yimeng's plate, and the lazy susan's dishes travel round.
- 26.2 s: the bill runs from the last table back along the floor under all four rooms, and Yimeng sweats.
- On the phone, the camera follows Yimeng from room to room. In the first room it is held at the row's left end.

- [ ] **Step 6: Commit**

```bash
git add reel/ch2/dining.js reel/ch2/index.js tests/reel/ch2-dining.test.js tests/reel/ch2-chapter.test.js
git commit -m "feat(reel): Eat across four restaurants, from left to right"
```

---

### Task 3: A shorter MoMA, then the Met

**Files:**
- Create: `reel/ch2/met.js`
- Modify: `reel/ch2/moma.js`, `reel/ch2/index.js`
- Test: `tests/reel/ch2-met.test.js`, `tests/reel/ch2-moma.test.js`, `tests/reel/ch2-chapter.test.js`

**Interfaces:**
- Produces: MoMA lasts 1.1 s, and Yimeng stops at 0.55 s.
- Produces: `met` (a scene), with one layer, `hall`, which is drawn twice: once as is, and once flipped and flattened into the pool.
  - The scene exposes `cx = round(0.62 W)` (the temple group) and `hx`.
  - Yimeng walks in on the floor with shoes on row 91 and stops at 0.6 s.

- [ ] **Step 1: Write the failing tests.** Create `tests/reel/ch2-met.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { met } from '../../reel/ch2/met.js';

sceneContract('ch2 Met', met, 1.1);

test('the Met: Yimeng walks in along the pool and stops before the Temple of Dendur', () => {
  const s = met.build(480, 96);
  assert.ok(s.cx > s.hx + 60, 'the temple stands ahead, to the right');
  assert.deepEqual(frameAt(met, 480, 0.9).ctx.draws('nyc:walk:1'), [[s.hx - 9, 91 - 44]]);
});

test('the Met: the temple is mirrored in the pool', () => {
  assert.equal(frameAt(met, 480, 0.5).ctx.draws('hall').length, 2, 'the hall, then its reflection');
});
```

Apply to `tests/reel/ch2-moma.test.js`:

`tests/reel/ch2-moma.test.js`, change 1. Find:

```js
sceneContract('ch2 MoMA', moma, 1.5);
```

Replace with:

```js
sceneContract('ch2 MoMA', moma, 1.1);
```

`tests/reel/ch2-moma.test.js`, change 2. Find:

```js
  const s = moma.build(480, 96), { ctx } = frameAt(moma, 480, 1.2);
```

Replace with:

```js
  const s = moma.build(480, 96), { ctx } = frameAt(moma, 480, 0.6);
```

Apply to `tests/reel/ch2-chapter.test.js`:

`tests/reel/ch2-chapter.test.js`, change 1. Find:

```js
test('chapter 2 opens and closes at Columbia, 13.3 s in all', () => {
```

Replace with:

```js
test('chapter 2 opens and closes at Columbia, 14 s in all', () => {
```

`tests/reel/ch2-chapter.test.js`, change 2. Find:

```js
  assert.deepEqual(CHAPTER_2.shots.map(s => s.id), ['ch2-columbia', 'ch2-night', 'ch2-dining', 'ch2-moma', 'ch2-graduation']);
```

Replace with:

```js
  assert.deepEqual(CHAPTER_2.shots.map(s => s.id), ['ch2-columbia', 'ch2-night', 'ch2-dining', 'ch2-moma', 'ch2-met', 'ch2-graduation']);
```

`tests/reel/ch2-chapter.test.js`, change 3. Find:

```js
  assert.equal(Math.round(CHAPTER_2.shots.reduce((a, s) => a + s.duration, 0) * 10) / 10, 13.3);
```

Replace with:

```js
  assert.equal(Math.round(CHAPTER_2.shots.reduce((a, s) => a + s.duration, 0) * 10) / 10, 14);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `node --test 'tests/reel/ch2-met.test.js' 'tests/reel/ch2-moma.test.js' 'tests/reel/ch2-chapter.test.js'`
Expected: the Met file fails to load (`Cannot find module …/reel/ch2/met.js`). MoMA's stop test fails because Yimeng is still walking at 0.6 s, and the chapter test fails.

- [ ] **Step 3: Implement.** Apply to `reel/ch2/moma.js`:

`reel/ch2/moma.js`, change 1. Find:

```js
const STOP = 0.85;                           // walking in until here, then standing still
```

Replace with:

```js
const STOP = 0.55;                           // walking in until here, then standing still
```

Create `reel/ch2/met.js`:

```js
// Chapter 2, shot 5: the Met. The Temple of Dendur in the Sackler Wing: the sandstone gateway and
// the temple with its two lotus columns on their granite platform, a reflecting pool in front, and
// Central Park through the great glass wall behind. Yimeng walks in along the pool and stops.
import { Painter } from '../pixels.js';

const FLOOR = 91;                            // the row Yimeng's shoes rest on
const STOP = 0.6;                            // walking in until here, then standing still
const POOL = 76;                             // the pool's top row; it runs ten rows down
const SAND = '#dcbc8c', SAND_LIT = '#ecd2a4', SAND_MID = '#c8a676', SAND_SH = '#a8845a', RELIEF = '#9a7a50';

// A cavetto cornice: a band that flares out as it rises, over a rounded torus moulding.
function cornice(p, x0, x1, top) {
  for (let k = 0; k < 5; k++) for (let x = x0 - (4 - k); x <= x1 + (4 - k); x++) p.px(x, top + k, k === 0 ? SAND_LIT : k === 4 ? SAND_SH : SAND_MID);
  for (let x = x0; x <= x1; x++) p.px(x, top + 5, RELIEF);
}

function reliefs(p, x0, x1, y0, y1) {
  for (let y = y0; y < y1; y += 4) for (let x = x0; x < x1; x += 3) if ((x * 7 + y) % 5 < 3) { p.px(x, y, RELIEF); p.px(x, y + 1, RELIEF); }
}

export function buildMet(W, H = 96) {
  const p = new Painter(W, H), cx = Math.round(W * 0.62), hx = Math.round(W * 0.34);
  // the glass wall: sky over Central Park's trees, behind a grid of mullions
  for (let y = 0; y < 62; y++) for (let x = 0; x < W; x++) {
    const tree = 38 + Math.sin(x * 0.11) * 3 + Math.sin(x * 0.29 + 1) * 2;
    let c = y < tree ? (y < 18 ? '#a9c1d5' : '#c3d6e5') : (x * 3 + y * 7) % 11 === 0 ? '#86a676' : (x + y) % 4 ? '#6a8a58' : '#5a7a4a';
    if (x % 24 === 0 || y % 11 === 0) c = '#59606a';
    p.px(x, y, c);
  }
  for (let y = 62; y < 66; y++) for (let x = 0; x < W; x++) p.px(x, y, y === 62 ? '#e4dccb' : '#cfc6b4');   // the wall's stone base
  for (let y = 66; y < POOL; y++) for (let x = 0; x < W; x++) p.px(x, y, y === 66 ? '#e6dfd0' : (x % 40 === 0 || y === 71) ? '#c4bcae' : '#d8d0c0');   // the hall's stone floor
  // the granite platform
  for (let y = 66; y < POOL; y++) for (let x = cx - 74; x <= cx + 74; x++) p.px(x, y, y === 66 ? '#d2ccc0' : (x - cx + 80) % 16 === 0 || y === 71 ? '#9a958a' : '#b4aea2');
  // the gateway: two jambs under a lintel and cornice, a winged sun on the lintel
  const gx = cx - 50;
  for (let y = 40; y < 66; y++) for (const x0 of [gx, gx + 16]) for (let x = x0; x < x0 + 7; x++) p.px(x, y, x === x0 ? SAND_LIT : x === x0 + 6 ? SAND_SH : SAND);
  reliefs(p, gx + 1, gx + 6, 44, 64); reliefs(p, gx + 17, gx + 22, 44, 64);
  for (let y = 36; y < 40; y++) for (let x = gx; x < gx + 23; x++) p.px(x, y, SAND);
  cornice(p, gx, gx + 22, 30);
  for (let x = gx + 5; x < gx + 18; x++) p.px(x, 37, '#b8945e');
  p.rect(gx + 10, 36, 3, 3, '#c89a50');
  // the temple: a cornice over two lotus columns in front, the sanctuary behind
  const tx = cx - 18;
  for (let y = 42; y < 66; y++) for (let x = tx + 30; x < tx + 64; x++) p.px(x, y, x === tx + 30 ? SAND_LIT : x > tx + 60 ? SAND_SH : SAND);
  reliefs(p, tx + 33, tx + 59, 46, 64);
  for (let y = 56; y < 66; y++) for (let x = tx; x < tx + 30; x++) p.px(x, y, y === 56 ? SAND_LIT : SAND_MID);   // the screen walls
  for (let y = 42; y < 56; y++) for (let x = tx + 1; x < tx + 30; x++) p.px(x, y, '#6a5034');                     // the shaded porch
  for (const colx of [tx + 6, tx + 19]) {
    for (let y = 44; y < 66; y++) for (let x = colx; x < colx + 5; x++) p.px(x, y, x === colx ? SAND_LIT : x === colx + 4 ? SAND_SH : SAND);
    for (let k = 0; k < 3; k++) for (let x = colx - 2 + k; x < colx + 7 - k; x++) p.px(x, 41 + k, k === 0 ? SAND_LIT : SAND_MID);   // lotus capital
  }
  for (let y = 38; y < 42; y++) for (let x = tx; x < tx + 64; x++) p.px(x, y, SAND);
  cornice(p, tx, tx + 63, 32);
  // the pool's stone lip, its water, and the floor
  for (let y = POOL; y < POOL + 10; y++) for (let x = 0; x < W; x++) p.px(x, y, y === POOL ? '#d8d0c0' : (x + y * 5) % 13 === 0 ? '#3e5e6a' : '#2e4a54');
  for (let y = POOL + 10; y < H; y++) for (let x = 0; x < W; x++) p.px(x, y, y === POOL + 10 ? '#e6dfd0' : (x + (y % 6 < 3 ? 0 : 20)) % 40 === 0 || y % 6 === 0 ? '#c4bcae' : '#d8d0c0');
  return { W, H, cx, hx, layers: { hall: p } };
}

export function renderMet(ctx, t, s, env) {
  const { W, H, canvases: c, hx } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.hall, 0, 0);
  // the temple upside down in the pool, flattened by the low angle, shivering with the ripples
  ctx.save();
  ctx.translate(0, POOL + 10); ctx.scale(1, -1);
  ctx.globalAlpha = 0.32;
  ctx.drawImage(c.hall, 0, 30, W, 46, Math.round(Math.sin(t * 5)), 0, W, 9);
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(216, 232, 236, 0.35)';
  for (let k = 0; k < 6; k++) ctx.fillRect(Math.round(((k * 83 + t * 10) % (W + 20)) - 10), POOL + 2 + (k % 4) * 2, 6 + (k % 3) * 3, 1);
  const hero = env.hero('nyc'), x = hx - Math.max(0, STOP - t) * 30;
  ctx.drawImage(hero.canvases[t < STOP ? Math.floor(t * 6) % 4 : 1], Math.round(x) - hero.anchorX, FLOOR - hero.footY);
}

export const met = { build: buildMet, render: renderMet };
```

Replace `reel/ch2/index.js` with:

```js
// Chapter 2: New York, from the first day at Columbia to the cap toss.
import { columbia } from './columbia.js';
import { night } from './night.js';
import { dining } from './dining.js';
import { moma } from './moma.js';
import { met } from './met.js';
import { graduation } from './graduation.js';

export const CHAPTER_2 = {
  name: 'New York',
  shots: [
    { id: 'ch2-columbia', scene: columbia, caption: 'New York', duration: 1.8, fadeIn: 0.35, fadeOut: 0.15 },
    { id: 'ch2-night', scene: night, caption: 'New York', duration: 2, fadeIn: 0.15, fadeOut: 0.15 },
    { id: 'ch2-dining', scene: dining, caption: 'New York', duration: 5.2, fadeIn: 0.2, fadeOut: 0.2 },
    { id: 'ch2-moma', scene: moma, caption: 'New York', duration: 1.1, fadeIn: 0.15, fadeOut: 0.1 },
    { id: 'ch2-met', scene: met, caption: 'New York', duration: 1.1, fadeIn: 0.1, fadeOut: 0.1 },
    { id: 'ch2-graduation', scene: graduation, caption: 'New York', duration: 2.8, fadeIn: 0.2, fadeOut: 0.3 },
  ],
};
```

- [ ] **Step 4: Run the unit tests**

Run: `node --test 'tests/reel/*.test.js'`
Expected: `ℹ pass 130`, `ℹ fail 0`.

- [ ] **Step 5: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 26.9,28.2 && python3 tests/reel/sheet.py /tmp/f /tmp/f-met.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 28.2 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-met.png 3
```

Expected:
- 26.9 s: MoMA as before. Yimeng has already stopped by *The Starry Night*.
- 28.2 s: the Sackler Wing.
  - The great glass wall: a grid of mullions over sky and the trees of Central Park.
  - On a granite platform, the sandstone gateway (two jambs, a lintel with a winged sun, a flared cornice) and the temple: a shaded porch behind two lotus columns, a carved sanctuary.
  - Both are faintly mirrored, upside down, in the pool before them.
  - Yimeng stands on the stone floor in front.

- [ ] **Step 6: Commit**

```bash
git add reel/ch2/met.js reel/ch2/moma.js reel/ch2/index.js tests/reel/ch2-met.test.js tests/reel/ch2-moma.test.js tests/reel/ch2-chapter.test.js
git commit -m "feat(reel): Add the Met's Temple of Dendur after a shorter MoMA"
```

---

### Task 4: The Guggenheim, looking up

**Files:**
- Create: `reel/ch2/guggenheim.js`
- Modify: `reel/ch2/index.js`
- Test: `tests/reel/ch2-guggenheim.test.js`, `tests/reel/ch2-chapter.test.js`

**Interfaces:**
- Produces: `rampAt(scene, x) = round(92 - (x - hx) × 0.07)`, the row of the near ramp's floor at screen column `x`.
- Produces: `guggenheim` (a scene), with layers `back` (the skylight, seven ring-shaped turns of the ramp with paintings) and `front` (the near ramp's wall, drawn after Yimeng). It also exposes `visitors`, the small figures that walk round the turns.
  - Yimeng walks at 26 px/s from `hx - 14`, rising with the ramp.

- [ ] **Step 1: Write the failing tests.** Create `tests/reel/ch2-guggenheim.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { guggenheim } from '../../reel/ch2/guggenheim.js';

sceneContract('ch2 Guggenheim', guggenheim, 1.1);

const heroAt = (t) => frameAt(guggenheim, 480, t).ctx.calls.find(c => String(c[1]).startsWith('nyc:walk'));

test('the Guggenheim: Yimeng walks up the ramp, rising as it climbs', () => {
  const a = heroAt(0.1), b = heroAt(1);
  assert.ok(b[2] > a[2], 'walking right');
  assert.ok(b[3] < a[3], 'and up');
});

test("the Guggenheim: the ramp's wall passes in front of Yimeng", () => {
  const order = frameAt(guggenheim, 480, 0.5).ctx.calls.filter(c => c[0] === 'drawImage').map(c => String(c[1]));
  assert.ok(order.indexOf('front') > order.findIndex(n => n.startsWith('nyc:walk')));
});
```

Apply to `tests/reel/ch2-chapter.test.js`:

`tests/reel/ch2-chapter.test.js`, change 1. Find:

```js
test('chapter 2 opens and closes at Columbia, 14 s in all', () => {
```

Replace with:

```js
test('chapter 2 opens and closes at Columbia, 15.1 s in all', () => {
```

`tests/reel/ch2-chapter.test.js`, change 2. Find:

```js
  assert.deepEqual(CHAPTER_2.shots.map(s => s.id), ['ch2-columbia', 'ch2-night', 'ch2-dining', 'ch2-moma', 'ch2-met', 'ch2-graduation']);
```

Replace with:

```js
  assert.deepEqual(CHAPTER_2.shots.map(s => s.id), ['ch2-columbia', 'ch2-night', 'ch2-dining', 'ch2-moma', 'ch2-met', 'ch2-guggenheim', 'ch2-graduation']);
```

`tests/reel/ch2-chapter.test.js`, change 3. Find:

```js
  assert.equal(Math.round(CHAPTER_2.shots.reduce((a, s) => a + s.duration, 0) * 10) / 10, 14);
```

Replace with:

```js
  assert.equal(Math.round(CHAPTER_2.shots.reduce((a, s) => a + s.duration, 0) * 10) / 10, 15.1);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `node --test 'tests/reel/ch2-guggenheim.test.js' 'tests/reel/ch2-chapter.test.js'`
Expected: the Guggenheim file fails to load (`Cannot find module …/reel/ch2/guggenheim.js`), and the chapter test fails.

- [ ] **Step 3: Implement.** Create `reel/ch2/guggenheim.js`:

```js
// Chapter 2, shot 6: the Guggenheim, looking up inside Frank Lloyd Wright's rotunda. Each turn of the
// white spiral ramp curves round the skylight as a ring, with paintings and small visitors on every
// level. Yimeng walks up the lowest turn, seen from the waist up over its wall.
import { Painter, rng } from '../pixels.js';

const RINGS = 7;                             // turns of the ramp, from the skylight outwards
const SKY_Y = 8;                             // the skylight's centre row
const STEP = 26;                             // walk speed, px/s
const RISE = 0.07;                           // the near ramp climbs 1px for every ~14px
const PAINTING = ['#c8302a', '#2c5aa0', '#f2c21e', '#3a3a40', '#4f9a4a', '#e8a0b0', '#7b3fa0', '#f4f1ea'];

// The near ramp's floor, under Yimeng's shoes, at screen column x.
export const rampAt = (s, x) => Math.round(92 - (x - s.hx) * RISE);

// Turn k of the ramp as seen from below: the lower half of an ellipse round the skylight.
function ring(W, k) { return { rx: W * (0.1 + k * 0.085), ry: 9 + k * 10.5 }; }
function ringY(W, cx, k, x) {
  const { rx, ry } = ring(W, k), u = (x - cx) / rx;
  return Math.abs(u) > 1 ? null : Math.round(SKY_Y + ry * Math.sqrt(1 - u * u));
}

export function buildGuggenheim(W, H = 96) {
  const cx = Math.round(W * 0.56), hx = Math.round(W * 0.34), r = rng(59);
  const back = new Painter(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) back.px(x, y, (x + y) % 2 && Math.abs(x - cx) > W * 0.5 ? '#d8d2c6' : '#e2ddd2');
  for (let y = 0; y < 20; y++) for (let x = 0; x < W; x++) {                        // the skylight, ribbed like a wheel
    const { rx, ry } = ring(W, 0), d = Math.hypot((x - cx) / rx, (y - SKY_Y) / ry);
    if (d > 1) continue;
    back.px(x, y, Math.round(Math.atan2(y - SKY_Y, x - cx) * 9) % 2 ? '#f6f8fa' : '#d4dae2');
  }
  const visitors = [];
  for (let k = 0; k < RINGS; k++) {
    for (let x = 0; x < W; x++) {                                                   // the white parapet, its lip in shadow
      const y = ringY(W, cx, k, x);
      if (y === null) continue;
      for (let j = 0; j < 4; j++) back.px(x, y + j, j === 0 ? '#ffffff' : j === 3 ? '#c4beb2' : '#f2efe8');
      for (let j = 4; j < 6; j++) back.px(x, y + j, '#b4aea2');
    }
    if (k === 0) continue;
    for (let x = 4 + Math.floor(r() * 10); x < W - 4; x += 12 + Math.floor(r() * 14)) {   // paintings on the wall above each turn
      const y = ringY(W, cx, k, x);
      if (y === null || y - 6 < 0) continue;
      back.rect(x, y - 6, 3, 4, PAINTING[Math.floor(r() * PAINTING.length)]);
    }
    for (let n = 0; n < Math.round(W / 70) + 1; n++) visitors.push({ k, x: cx + (r() * 2 - 1) * ring(W, k).rx * 0.9, v: (k % 2 ? -1 : 1) * (3 + r() * 4), col: ['#3a3a40', '#5a2a2a', '#2a3a5a', '#4a4a3a'][Math.floor(r() * 4)] });
  }
  const front = new Painter(W, H), s = { hx };                                     // the near ramp's wall, in front of Yimeng
  for (let x = 0; x < W; x++) {
    const top = rampAt(s, x) - 8;
    for (let y = top; y < H; y++) front.px(x, y, y === top ? '#ffffff' : y < top + 3 ? '#f4f1ea' : y === top + 3 ? '#d4cec2' : '#ece8e0');
  }
  return { W, H, cx, hx, visitors, layers: { back, front } };
}

export function renderGuggenheim(ctx, t, s, env) {
  const { W, H, canvases: c, hx, cx } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.back, 0, 0);
  for (const v of s.visitors) {                                                     // people strolling round the turns
    const { rx } = ring(W, v.k), x = cx + ((v.x - cx + t * v.v + rx * 3) % (rx * 2)) - rx, y = ringY(W, cx, v.k, x);
    if (y === null) continue;
    ctx.fillStyle = v.col; ctx.fillRect(Math.round(x), y - 4, 2, 4);
    ctx.fillStyle = '#e0b08c'; ctx.fillRect(Math.round(x), y - 5, 2, 1);
  }
  const hero = env.hero('nyc'), x = hx - 14 + t * STEP;
  ctx.drawImage(hero.canvases[Math.floor(t * 6) % 4], Math.round(x) - hero.anchorX, rampAt(s, Math.round(x) + 9) - hero.footY);
  ctx.drawImage(c.front, 0, 0);
}

export const guggenheim = { build: buildGuggenheim, render: renderGuggenheim };
```

Replace `reel/ch2/index.js` with:

```js
// Chapter 2: New York, from the first day at Columbia to the cap toss.
import { columbia } from './columbia.js';
import { night } from './night.js';
import { dining } from './dining.js';
import { moma } from './moma.js';
import { met } from './met.js';
import { guggenheim } from './guggenheim.js';
import { graduation } from './graduation.js';

export const CHAPTER_2 = {
  name: 'New York',
  shots: [
    { id: 'ch2-columbia', scene: columbia, caption: 'New York', duration: 1.8, fadeIn: 0.35, fadeOut: 0.15 },
    { id: 'ch2-night', scene: night, caption: 'New York', duration: 2, fadeIn: 0.15, fadeOut: 0.15 },
    { id: 'ch2-dining', scene: dining, caption: 'New York', duration: 5.2, fadeIn: 0.2, fadeOut: 0.2 },
    { id: 'ch2-moma', scene: moma, caption: 'New York', duration: 1.1, fadeIn: 0.15, fadeOut: 0.1 },
    { id: 'ch2-met', scene: met, caption: 'New York', duration: 1.1, fadeIn: 0.1, fadeOut: 0.1 },
    { id: 'ch2-guggenheim', scene: guggenheim, caption: 'New York', duration: 1.1, fadeIn: 0.1, fadeOut: 0.1 },
    { id: 'ch2-graduation', scene: graduation, caption: 'New York', duration: 2.8, fadeIn: 0.2, fadeOut: 0.3 },
  ],
};
```

- [ ] **Step 4: Run the unit tests**

Run: `node --test 'tests/reel/*.test.js'`
Expected: `ℹ pass 134`, `ℹ fail 0`.

- [ ] **Step 5: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 29.2 && python3 tests/reel/sheet.py /tmp/f /tmp/f-gug.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 29.2 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-gug.png 3
```

Expected:
- The rotunda from below: a ribbed skylight at the top centre, and seven white turns of the ramp nested around it as widening curves.
- Small paintings in many colours hang above each turn, and tiny visitors stroll along them.
- In front, Yimeng walks up the lowest turn, seen from the waist up over its white wall, which climbs gently to the right.

- [ ] **Step 6: Commit**

```bash
git add reel/ch2/guggenheim.js reel/ch2/index.js tests/reel/ch2-guggenheim.test.js tests/reel/ch2-chapter.test.js
git commit -m "feat(reel): Walk up the Guggenheim's spiral"
```

---

### Task 5: Kusama's Infinity Mirror Room

**Files:**
- Create: `reel/ch2/kusama.js`
- Modify: `reel/ch2/index.js`
- Test: `tests/reel/ch2-kusama.test.js`, `tests/reel/ch2-chapter.test.js`

**Interfaces:**
- Produces: `lightsOn(t) = clamp(t / 0.3, 0, 1)`.
- Produces: `kusama` (a scene), with one layer, `room` (black, the walkway, and the strings of the nearest lamps), plus `lamps`, about `0.75 W` of them.
  - Yimeng stands at `hx` on the walkway (row 88), drawn once upright and once mirrored.
  - The nearest lamps hang in front of Yimeng.
- Produces: `CHAPTER_2` complete, 16.2 s.

- [ ] **Step 1: Write the failing tests.** Create `tests/reel/ch2-kusama.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { kusama, lightsOn } from '../../reel/ch2/kusama.js';

sceneContract('ch2 Kusama', kusama, 1.1);

test('Kusama: the lights come up out of the dark', () => {
  assert.deepEqual([lightsOn(0), lightsOn(0.5)], [0, 1]);
  assert.ok(lightsOn(0.15) > 0 && lightsOn(0.15) < 1);
  const lamps = (t) => frameAt(kusama, 480, t).ctx.calls.filter(c => c[0] === 'fillRect').length;
  assert.equal(lamps(0), 0);
  assert.ok(lamps(0.6) > 200, 'hundreds of lamps');
});

test('Kusama: Yimeng stands among the lamps, mirrored on the walkway', () => {
  const s = kusama.build(480, 96);
  assert.deepEqual(frameAt(kusama, 480, 0.6).ctx.draws('nyc:walk:1'), [[s.hx - 9, 88 - 44], [s.hx - 9, 88 - 44]]);
});
```

Apply to `tests/reel/ch2-chapter.test.js`:

`tests/reel/ch2-chapter.test.js`, change 1. Find:

```js
test('chapter 2 opens and closes at Columbia, 15.1 s in all', () => {
```

Replace with:

```js
test('chapter 2 opens and closes at Columbia, 16.2 s in all', () => {
```

`tests/reel/ch2-chapter.test.js`, change 2. Find:

```js
  assert.deepEqual(CHAPTER_2.shots.map(s => s.id), ['ch2-columbia', 'ch2-night', 'ch2-dining', 'ch2-moma', 'ch2-met', 'ch2-guggenheim', 'ch2-graduation']);
```

Replace with:

```js
  assert.deepEqual(CHAPTER_2.shots.map(s => s.id), ['ch2-columbia', 'ch2-night', 'ch2-dining', 'ch2-moma', 'ch2-met', 'ch2-guggenheim', 'ch2-kusama', 'ch2-graduation']);
```

`tests/reel/ch2-chapter.test.js`, change 3. Find:

```js
  assert.equal(Math.round(CHAPTER_2.shots.reduce((a, s) => a + s.duration, 0) * 10) / 10, 15.1);
```

Replace with:

```js
  assert.equal(Math.round(CHAPTER_2.shots.reduce((a, s) => a + s.duration, 0) * 10) / 10, 16.2);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `node --test 'tests/reel/ch2-kusama.test.js' 'tests/reel/ch2-chapter.test.js'`
Expected: the Kusama file fails to load (`Cannot find module …/reel/ch2/kusama.js`), and the chapter test fails.

- [ ] **Step 3: Implement.** Create `reel/ch2/kusama.js`:

```js
// Chapter 2, shot 7: Yayoi Kusama's Infinity Mirror Room. In the dark the lights come on: lamps hang
// on strings at every depth, glowing and slowly changing colour, doubled in the black pool on the
// floor. Yimeng stands among them on the walkway.
import { Painter, rng } from '../pixels.js';

const FLOOR = 88;                            // the walkway's row, where Yimeng's shoes rest
const POOL = 72;                             // the mirror pool's surface row
const COLOURS = ['#ff5a8a', '#ffd23a', '#4ad2ff', '#7cff6a', '#ffffff', '#c47aff'];

// How far the lights have come up: 0 in the dark, 1 from 0.3 s on.
export const lightsOn = (t) => Math.min(1, Math.max(0, t / 0.3));

export function buildKusama(W, H = 96) {
  const r = rng(1929), lamps = [];
  for (let n = 0; n < Math.round(W * 0.75); n++) {                                  // lamps on strings at every depth
    const z = 1 + Math.pow(r(), 0.6) * 4;
    lamps.push({ x: Math.floor(r() * W), y: 4 + Math.floor(r() * (POOL - 6)), size: z < 1.7 ? 3 : z < 3 ? 2 : 1, glow: Math.min(1, 1.5 / z), c: Math.floor(r() * COLOURS.length), ph: r() * 6 });
  }
  const room = new Painter(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) room.px(x, y, y >= FLOOR ? (y === FLOOR ? '#1c1c26' : '#101018') : '#050508');
  for (const l of lamps) if (l.size === 3) for (let y = 0; y < l.y; y++) room.px(l.x + 1, y, '#121219');   // the near lamps' strings
  return { W, H, hx: Math.round(W * 0.34), lamps, layers: { room } };
}

function lamp(ctx, l, t, on, y = l.y, fade = 1) {
  const a = l.glow * on * fade * (0.65 + 0.35 * Math.sin(t * 3 + l.ph));
  if (a <= 0.02) return;
  ctx.fillStyle = COLOURS[(l.c + Math.floor(t * 1.5 + l.ph)) % COLOURS.length];
  if (l.size === 3) { ctx.globalAlpha = Math.min(1, a) * 0.3; ctx.fillRect(l.x - 1, y - 1, 5, 5); }   // a soft halo round the nearest
  ctx.globalAlpha = Math.min(1, a);
  ctx.fillRect(l.x, y, l.size, l.size);
}

export function renderKusama(ctx, t, s, env) {
  const { W, H, canvases: c, hx } = s, on = lightsOn(t);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.room, 0, 0);
  for (const l of s.lamps) {
    if (l.size === 3) continue;                                                     // the nearest lamps hang in front of Yimeng
    lamp(ctx, l, t, on);
    const ry = 2 * POOL - l.y + Math.round(Math.sin(t * 4 + l.x) * 0.6);            // and every lamp again in the pool
    if (ry > POOL && ry < FLOOR) lamp(ctx, l, t, on, ry, 0.4);
  }
  ctx.globalAlpha = 1;
  const hero = env.hero('nyc');
  ctx.drawImage(hero.canvases[1], hx - hero.anchorX, FLOOR - hero.footY);
  ctx.save();                                                                       // Yimeng's reflection on the walkway
  ctx.translate(0, 2 * FLOOR); ctx.scale(1, -1);
  ctx.globalAlpha = 0.18;
  ctx.drawImage(hero.canvases[1], hx - hero.anchorX, FLOOR - hero.footY);
  ctx.restore();
  for (const l of s.lamps) if (l.size === 3) lamp(ctx, l, t, on);
  ctx.globalAlpha = 1;
}

export const kusama = { build: buildKusama, render: renderKusama };
```

Replace `reel/ch2/index.js` with:

```js
// Chapter 2: New York, from the first day at Columbia to the cap toss.
import { columbia } from './columbia.js';
import { night } from './night.js';
import { dining } from './dining.js';
import { moma } from './moma.js';
import { met } from './met.js';
import { guggenheim } from './guggenheim.js';
import { kusama } from './kusama.js';
import { graduation } from './graduation.js';

export const CHAPTER_2 = {
  name: 'New York',
  shots: [
    { id: 'ch2-columbia', scene: columbia, caption: 'New York', duration: 1.8, fadeIn: 0.35, fadeOut: 0.15 },
    { id: 'ch2-night', scene: night, caption: 'New York', duration: 2, fadeIn: 0.15, fadeOut: 0.15 },
    { id: 'ch2-dining', scene: dining, caption: 'New York', duration: 5.2, fadeIn: 0.2, fadeOut: 0.2 },
    { id: 'ch2-moma', scene: moma, caption: 'New York', duration: 1.1, fadeIn: 0.15, fadeOut: 0.1 },
    { id: 'ch2-met', scene: met, caption: 'New York', duration: 1.1, fadeIn: 0.1, fadeOut: 0.1 },
    { id: 'ch2-guggenheim', scene: guggenheim, caption: 'New York', duration: 1.1, fadeIn: 0.1, fadeOut: 0.1 },
    { id: 'ch2-kusama', scene: kusama, caption: 'New York', duration: 1.1, fadeIn: 0.1, fadeOut: 0.15 },
    { id: 'ch2-graduation', scene: graduation, caption: 'New York', duration: 2.8, fadeIn: 0.2, fadeOut: 0.3 },
  ],
};
```

- [ ] **Step 4: Run the unit tests**

Run: `node --test 'tests/reel/*.test.js'`
Expected: `ℹ pass 138`, `ℹ fail 0`.

- [ ] **Step 5: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 29.85,30.4,30.8 && python3 tests/reel/sheet.py /tmp/f /tmp/f-kus.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 30.4 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-kus.png 3
```

Expected:
- 29.85 s: a dark room, the lights just coming up.
- 30.4 s: hundreds of lamps at every depth in pink, yellow, cyan, green, white and violet. The nearest are bigger, with soft halos and strings rising to the ceiling.
- Their reflections shimmer in the black pool below the horizon. Yimeng stands on the walkway, faintly mirrored at the feet.
- 30.8 s: the colours have shifted.

- [ ] **Step 6: Commit**

```bash
git add reel/ch2/kusama.js reel/ch2/index.js tests/reel/ch2-kusama.test.js tests/reel/ch2-chapter.test.js
git commit -m "feat(reel): Stand in Kusama's Infinity Mirror Room"
```

---

### Task 6: Page checks, spec and hand-off

**Files:**
- Modify: `tests/reel/page-check.sh`, `docs/superpowers/specs/2026-10-03-life-reel-design.md`

- [ ] **Step 1: See the page checks fail.** Chapter 2 now ends at 33.7 s.

Run: `tests/reel/page-check.sh`
Expected:
- `FAIL - Michigan lights step 3`, because 31 s is still New York.
- `FAIL` for the California and To be continued checks too.
- Exit 1.

- [ ] **Step 2: Move the times.** The chapter spans are now:
  - New York 17.5–33.7
  - Michigan 33.7–39.7
  - California 39.7–47.7
  - To be continued 47.7–51.7

Apply to `tests/reel/page-check.sh`:

`tests/reel/page-check.sh`, change 1. Find:

```bash
d=$(dom 1440,900 '?reel=31'); expect 'Michigan lights step 3' "$d" 'data-chapter="2"' 'class="step is-live" data-org="msu"'
d=$(dom 1440,900 '?reel=39'); expect 'California lights step 4' "$d" 'data-chapter="3"' 'class="step is-live" data-org="amazon"'
d=$(dom 1440,900 '?reel=45'); expect 'To be continued keeps step 4 lit' "$d" 'data-chapter="4"' '>To be continued…<' 'class="step is-live" data-org="amazon"'
```

Replace with:

```bash
d=$(dom 1440,900 '?reel=35'); expect 'Michigan lights step 3' "$d" 'data-chapter="2"' 'class="step is-live" data-org="msu"'
d=$(dom 1440,900 '?reel=43'); expect 'California lights step 4' "$d" 'data-chapter="3"' 'class="step is-live" data-org="amazon"'
d=$(dom 1440,900 '?reel=50'); expect 'To be continued keeps step 4 lit' "$d" 'data-chapter="4"' '>To be continued…<' 'class="step is-live" data-org="amazon"'
```

- [ ] **Step 3: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 138`, then 15 `ok` lines and exit 0.

- [ ] **Step 4: Update the spec.** Apply to `docs/superpowers/specs/2026-10-03-life-reel-design.md`:

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 1. Find:

```markdown
| 2 | New York, day to day (Columbia, night walk, MoMA) | Camel long coat, scarf |
| 2 | Michelin dinner | Burgundy blazer and black tee (the hero outfit) |
```

Replace with:

```markdown
| 2 | New York, day to day (Columbia, night walk, museums) | Camel long coat, scarf |
| 2 | Fine dining (four restaurants) | Burgundy blazer and black tee (the hero outfit) |
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 2. Find:

```markdown
The two dive outfits use swimming poses in the reel. The other outfits walk. Yimeng also sits (on the train, at Trolltunga and at dinner), and at the cap toss cheers bareheaded in the gown.
```

Replace with:

```markdown
The two dive outfits use swimming poses in the reel. The other outfits walk. Yimeng also sits (on the train, at Trolltunga and in the restaurants), and at the cap toss cheers bareheaded in the gown.
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 3. Find:

```markdown
The full loop runs about 57 s, and the timings below are targets. The caption is the place name and fades in at the top left whenever it changes.
```

Replace with:

```markdown
The full loop runs about 62 s, and the timings below are targets. The caption is the place name and fades in at the top left whenever it changes.
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 4. Find:

```markdown
### 2 · New York (~11.7 s). Caption: `New York`. The chapter opens and closes at Columbia.
```

Replace with:

```markdown
### 2 · New York (~16 s). Caption: `New York`. The chapter opens and closes at Columbia.
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 5. Find:

```markdown
2. Night in Manhattan, in black and gold with Art Deco styling. The shot opens on the lit crowns of the Chrysler and Empire State buildings, with a gold sunburst behind the skyline and searchlights sweeping. Then it tilts down to the street, where Yimeng walks up to a black-and-gold restaurant. Three stars light up above the door one by one, and Yimeng steps into its light.
3. Michelin dinner, in a gold-and-burgundy room with the skyline in its windows: white tablecloths, candles and a crystal chandelier. Yimeng sits at the table. A waiter lifts a silver cloche to reveal one tiny bite on a huge plate. A course counter runs from `1/12` to `12/12` as the candle burns down. Then the sommelier fills a champagne tower, and the bill unrolls down to the floor and across it.
4. MoMA: past Warhol's soup cans, Yimeng stops in front of *The Starry Night*, whose sky slowly turns. On wide screens Monet's *Water Lilies* hang further along.
```

Replace with:

```markdown
2. Night in Manhattan, in black and gold with Art Deco styling. The shot opens on the lit crowns of the Chrysler and Empire State buildings, with a gold sunburst behind the skyline and searchlights sweeping. Then it tilts down to the street, where Yimeng walks up to a black-and-gold restaurant with a gilt fan over its door, and steps into its light.
3. Fine dining, eaten from left to right: one long shot through four restaurants side by side, each in its own style. Yimeng sits down at each, eats its signature dish, and dashes on to the next, leaving an empty plate behind. On a desktop all four are in view at once; on a phone the camera follows Yimeng.
   - French, in gold and burgundy under a crystal chandelier: the waiter lifts a silver cloche on one tiny bite in the middle of a huge plate.
   - Japanese omakase, at a hinoki counter under a paper lantern, with a noren and a round window: the itamae lays three nigiri on the board one by one.
   - Italian, among warm plaster and a wine rack: the waiter shaves white truffle over a nest of tagliolini.
   - Chinese, in red lacquer under red lanterns: the chef carves Peking duck while the lazy susan turns.
   - After the last course the bill unrolls down to the floor and runs back under all four restaurants.
4. Four exhibitions, one short shot each:
   - MoMA: past Warhol's soup cans, Yimeng stops in front of *The Starry Night*, whose sky slowly turns. On wide screens Monet's *Water Lilies* hang further along.
   - The Met: the Temple of Dendur and its gateway on their platform in the Sackler Wing, mirrored in the pool, with Central Park through the glass wall behind.
   - The Guggenheim, looking up the rotunda: the white turns of the ramp ring the skylight, with paintings and visitors on every level, while Yimeng walks up the lowest turn.
   - Yayoi Kusama's Infinity Mirror Room: in the dark, lamps come on at every depth and slowly change colour, doubled in the black pool on the floor.
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 6. Find:

```markdown
- **Debug hooks:** the URL parameter `?reel=` takes either a number or a shot id. A number such as `?reel=42.5` renders that moment paused. A shot id such as `?reel=ch2-michelin` loops that one shot. Headless screenshots for review rely on these. They have no effect on normal visits.
```

Replace with:

```markdown
- **Debug hooks:** the URL parameter `?reel=` takes either a number or a shot id. A number such as `?reel=42.5` renders that moment paused. A shot id such as `?reel=ch2-dining` loops that one shot. Headless screenshots for review rely on these. They have no effect on normal visits.
```

- [ ] **Step 5: Commit**

```bash
git add tests/reel/page-check.sh docs/superpowers/specs/2026-10-03-life-reel-design.md
git commit -m "docs: Describe the revised chapter 2; move the page checks past it"
```

- [ ] **Step 6: Hand over for review.** Give the user:
  - `http://127.0.0.1:8000/?reel=ch2-night`
  - `?reel=ch2-dining`
  - `?reel=ch2-met`
  - `?reel=ch2-guggenheim`
  - `?reel=ch2-kusama`
  - `http://127.0.0.1:8000/` with the `02` button for the whole chapter

Stop there. Chapter 3 gets its own plan after this review.
