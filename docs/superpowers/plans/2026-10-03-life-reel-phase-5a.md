# Life Reel — Phase 5a (Road Trip and California, First Batch) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace chapter 3's door with the Graduation Road Trip on a map, then build chapter 4's first three shots: the arrival, the office and the ranch.
- The road trip follows Yimeng's real route: a loop round the East first, in Michigan's grey, then west to California, the colour spreading out from the car.
- The arrival: Yimeng's silver-grey Mercedes-AMG GLC 63 pulls up with the dog standing at the wheel, as in the hero photo.
- The office: a stock chart climbs on Yimeng's phone.
- The ranch: an ATV chase, then Yimeng gets off, raises the rifle, and in the scope the deer looks back. No shot is fired.

**Architecture:**
- `reel/ch3/roadtrip.js` paints the map once in full colour from a few hand-placed polygons and polylines (coasts, Great Lakes, rivers, borders, mountain ranges), and once more as a greyed copy. Each frame draws the grey map, then the colour map clipped to a circle round the car, which only starts to grow when the car turns west.
- `reel/ch4/` gets one module per shot and an `index.js`, and `reel/story.js` swaps its California stand-in for `CHAPTER_4`.
- The cast gains one pose, `aim`.

**Tech Stack:** Vanilla JS (ES modules, Canvas 2D), Node 25 `node:test`, headless Chrome review tools from Phase 2.

**Spec:** `docs/superpowers/specs/2026-10-03-life-reel-design.md`, chapter 3 shot 4 and chapter 4 shots 1–3 (updated in Tasks 2 and 6). **Builds on:** `docs/superpowers/plans/2026-10-03-life-reel-phase-4b.md`.

## Global Constraints

- Everything in the earlier plans' Global Constraints still holds:
  - native widths 195, 480 and 640 must all read well
  - branch `life-reel`; no merge, no push
- The road trip is chapter 3's last shot, in place of the door. It lasts 5 s and keeps chapter 3's MSU step lit.
  - Its caption is `Graduation Road Trip` for both legs, never `Michigan` or `California`.
  - The East loop: East Lansing, Detroit, London (Ontario), Niagara Falls, Rochester, Syracuse, the Adirondacks, Burlington, the White Mountains, Portland (Maine), Boston, Providence, New Haven, New York, Philadelphia, Baltimore, Washington, Richmond, Greensboro, Asheville, Knoxville, Lexington, Cincinnati, Dayton, Toledo, East Lansing. It is drawn all in grey.
  - The West leg: East Lansing, Kalamazoo, Chicago, the Quad Cities, Des Moines, Kansas City, Topeka, Salina, Hays, Denver, Vail, Grand Junction, Green River, Richfield, Cedar City, St George, Las Vegas, Barstow, Bakersfield, Fresno, Gilroy, Santa Clara. The colour spreads out from the car, slowly at first, and the map is all colour by Santa Clara.
- Yimeng's car is a silver-grey Mercedes-AMG GLC 63, an SUV.
- At the ranch, no shot is fired, and Yimeng only raises the rifle on foot, never from the vehicle.
- Chapter 4 is built in two batches. This plan builds the first:
  - arrive 1.8 s, office 1.6 s, ranch 3 s, so 6.4 s in all
  - the coast (spec shots 4–8) comes in Phase 5b
  - until then, chapter 5's stand-in follows the ranch
- The timeline after this phase:

  | Shot | Start (s) | End (s) |
  |---|---|---|
  | Chapter 3 | 33.7 | 47.2 |
  | Road trip | 42.2 | 47.2 |
  | Chapter 4 | 47.2 | 53.6 |
  | Arrival | 47.2 | 49.0 |
  | Office | 49.0 | 50.6 |
  | Ranch | 50.6 | 53.6 |
  | Chapter 5 | 53.6 | 57.6 |

- The page checks move to 45 s (road trip), 50 s (California) and 56 s (To be continued). Those times hold both before and after Task 6 wires chapter 4 in.

## How to run things

- Unit tests: `node --test 'tests/reel/*.test.js'`. Page checks: `tests/reel/page-check.sh`.
- Frame review: keep `python3 -m http.server 8000 --bind 127.0.0.1` running from the repo root. Then run `node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times …` and `python3 tests/reel/sheet.py /tmp/f /tmp/f.png 2`.

---

### Task 1: The aim pose

**Files:**
- Modify: `reel/hero.js`
- Test: `tests/reel/hero.test.js` (append)

**Interfaces:**
- Produces: `heroSprite(key, 'aim')`. It has 2 frames, standing, with the `hold` arm and a 1 px breath on the second frame. Its `hands` are `[[20, 31], [20, 32]]`, where the scene puts the rifle.

- [ ] **Step 1: Write the failing test.** Append to `tests/reel/hero.test.js`:

```js
test('the aim pose stands holding a rifle to the shoulder, breathing', () => {
  const aim = heroSprite('hunt', 'aim');
  assert.equal(aim.frames.length, 2);
  assert.notDeepEqual(aim.frames[0], aim.frames[1]);
  assert.deepEqual(aim.hands, [[20, 31], [20, 32]], 'the hands forward at the chest, rising and falling');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test 'tests/reel/hero.test.js'`
Expected: 1 failure in `the aim pose …` (`unknown pose: aim`).

- [ ] **Step 3: Implement.** Apply these replacements. Each "find" text occurs exactly once in its file.

`reel/hero.js`, change 1. Find:

```js
// behind the head; its hand is the shoulder, where those arms start.
```

Replace with:

```js
// behind the head; its hand is the shoulder, where those arms start. `aim` stands holding a rifle
// to the shoulder, breathing; the scene draws the rifle from the hand.
```

`reel/hero.js`, change 2. Find:

```js
  hang: [['stand', 'none', 0], ['pass', 'none', 0]],
};
```

Replace with:

```js
  hang: [['stand', 'none', 0], ['pass', 'none', 0]],
  aim: [['stand', 'hold', 0], ['stand', 'hold', 1]],
};
```

- [ ] **Step 4: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 164`, `ℹ fail 0`, then 15 `ok` lines and exit 0.

- [ ] **Step 5: Commit**

```bash
git add reel/hero.js tests/reel/hero.test.js
git commit -m "feat(reel): Add an aim pose for the ranch"
```

---

### Task 2: The Graduation Road Trip

**Files:**
- Create: `reel/ch3/roadtrip.js`
- Modify: `reel/ch3/index.js`, `reel/ch3/hooding.js`, `tests/reel/page-check.sh`, `docs/superpowers/specs/2026-10-03-life-reel-design.md`
- Delete: `reel/ch3/door.js`, `tests/reel/ch3-door.test.js`
- Test: `tests/reel/ch3-roadtrip.test.js` (new), `tests/reel/ch3-chapter.test.js`

**Interfaces:**
- Consumes: `Painter`, `rng`, `hexToRgb` from `reel/pixels.js`; `art`, `label` from `reel/kit.js`.
- Produces: `toMap([lon, lat]) → [x, y]`, in map pixels: 8 px per degree of latitude, and 8 cos 38° per degree of longitude.
- Produces: `LEGS = { east: [0.15, 2.45], west: [2.55, 4.6] }`, when the car drives each leg (s into the shot).
- Produces: `tripAt(t) → { leg: 'east' | 'west', x, y, dir: 1 | -1, colour }`.
  - `x` and `y` are the car on the map, and `dir` is the way it faces.
  - `colour` is the radius in map pixels of the colour circle round the car. It is 0 until the car turns west, then grows to the map's width, and once the car has arrived it is past 2000.
- Produces: `roadtrip`, a scene with layers `colour` and `grey`.
  - From 480 native px up, the camera keeps the route's whole width in view and only follows the car up and down. Narrower, it follows the car both ways.
- `drawHood` in `hooding.js` was exported for the door. It becomes private.

- [ ] **Step 1: Write the failing tests.** Create `tests/reel/ch3-roadtrip.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { roadtrip, tripAt, toMap, LEGS } from '../../reel/ch3/roadtrip.js';

sceneContract('ch3 roadtrip', roadtrip, 5);

// When, on one leg, the car comes closest to a place, and how close it gets (px on the map).
function passes(leg, lonLat) {
  const [px, py] = toMap(lonLat), [a, b] = LEGS[leg];
  let best = { t: a, d: Infinity };
  for (let t = a; t <= b; t += 0.005) {
    const p = tripAt(t), d = Math.hypot(p.x - px, p.y - py);
    if (d < best.d) best = { t, d };
  }
  return best;
}
const gap = (p, lonLat) => { const [x, y] = toMap(lonLat); return Math.hypot(p.x - x, p.y - y); };
const inOrder = (stops) => stops.every((s, i) => !i || s.t > stops[i - 1].t);

test('road trip: the car loops round the East from East Lansing, by Niagara, Maine, New York and Washington, and home', () => {
  const stops = [[-79.07, 43.09], [-70.26, 43.66], [-74.0, 40.71], [-77.04, 38.91]].map(p => passes('east', p));
  assert.ok(stops.every(s => s.d < 2), 'it goes through each');
  assert.ok(inOrder(stops), 'in that order');
  assert.ok(gap(tripAt(0), [-84.48, 42.73]) < 1 && gap(tripAt(LEGS.east[1]), [-84.48, 42.73]) < 1, 'from East Lansing and back');
});

test('road trip: then it turns west, by Chicago, Denver and Las Vegas to Santa Clara', () => {
  const stops = [[-87.63, 41.88], [-104.99, 39.74], [-115.14, 36.17]].map(p => passes('west', p));
  assert.ok(stops.every(s => s.d < 2));
  assert.ok(inOrder(stops));
  assert.ok(gap(tripAt(5), [-121.95, 37.35]) < 1);
  assert.equal(tripAt(3.5).dir, -1, 'facing west');
});

test('road trip: the East loop stays grey; once the car turns west the colour spreads out from it until the map is all colour', () => {
  assert.equal(tripAt(LEGS.east[1]).colour, 0);
  assert.equal(tripAt(LEGS.west[0]).colour, 0);
  const r = [3, 3.6, 4.2].map(t => tripAt(t).colour);
  assert.ok(r[0] > 0 && r[1] > r[0] && r[2] > r[1]);
  assert.ok(tripAt(4.8).colour > 2000, 'all colour once it has arrived');
});

test('road trip: the grey map alone on the East loop, the colour map over it once the car turns west', () => {
  const east = frameAt(roadtrip, 480, 1.5).ctx, west = frameAt(roadtrip, 480, 3.5).ctx;
  assert.deepEqual([east.draws('grey').length, east.draws('colour').length], [1, 0]);
  assert.deepEqual([west.draws('grey').length, west.draws('colour').length], [1, 1]);
});

test('road trip: on a desktop the map holds still; on a phone the camera follows the car', () => {
  const mapX = (W, t) => frameAt(roadtrip, W, t).ctx.draws('grey')[0][0];
  assert.equal(mapX(480, 0.5), mapX(480, 4.5));
  assert.ok(mapX(195, 4.5) > mapX(195, 0.5), 'the map slides right as the car drives west');
});
```

Then apply to `tests/reel/ch3-chapter.test.js`:

`tests/reel/ch3-chapter.test.js`, change 1. Find:

```js
test('chapter 3 runs from the snow to the door, 10 s in all', () => {
```

Replace with:

```js
test('chapter 3 runs from the snow to the Graduation Road Trip, 13.5 s in all', () => {
```

`tests/reel/ch3-chapter.test.js`, change 2. Find:

```js
  assert.deepEqual(CHAPTER_3.shots.map(s => s.id), ['ch3-snow', 'ch3-timelapse', 'ch3-hooding', 'ch3-door']);
  assert.ok(CHAPTER_3.shots.every(s => s.caption === 'Michigan'));
  assert.equal(Math.round(CHAPTER_3.shots.reduce((a, s) => a + s.duration, 0) * 10) / 10, 10);
```

Replace with:

```js
  assert.deepEqual(CHAPTER_3.shots.map(s => s.id), ['ch3-snow', 'ch3-timelapse', 'ch3-hooding', 'ch3-roadtrip']);
  assert.deepEqual(CHAPTER_3.shots.map(s => s.caption), ['Michigan', 'Michigan', 'Michigan', 'Graduation Road Trip']);
  assert.equal(Math.round(CHAPTER_3.shots.reduce((a, s) => a + s.duration, 0) * 10) / 10, 13.5);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `node --test tests/reel/ch3-roadtrip.test.js tests/reel/ch3-chapter.test.js`
Expected: `ℹ fail 2`:
- `ch3-roadtrip.test.js` fails to load (`Cannot find module …/reel/ch3/roadtrip.js`).
- `chapter 3 runs from the snow to the Graduation Road Trip, 13.5 s in all` fails on the shot ids.

- [ ] **Step 3: Implement the map.** Create `reel/ch3/roadtrip.js`:

```js
// Chapter 3, shot 4: the Graduation Road Trip, on a map. From East Lansing the car loops round the
// East: through Ontario to Niagara, across New York to Vermont and the Maine coast, down by Boston,
// New York and Washington to the Carolinas, and home through Tennessee, Kentucky and Ohio, all in
// Michigan's grey. Then it turns west, by Chicago, Kansas City, Denver and the Rockies, Utah and
// Las Vegas, to Santa Clara, and the colour spreads out from the car until the map is all colour.
import { Painter, rng, hexToRgb } from '../pixels.js';
import { art, label } from '../kit.js';

const S = 8, LON0 = -160, LAT0 = 51, KX = Math.cos(38 * Math.PI / 180) * S;      // px per degree of latitude, of longitude
export const toMap = ([lon, lat]) => [(lon - LON0) * KX, (LAT0 - lat) * S];
const MAP_W = Math.round((-40 - LON0) * KX), MAP_H = Math.round((LAT0 - 26) * S);
export const LEGS = { east: [0.15, 2.45], west: [2.55, 4.6] };       // when the car drives each loop

// The drive, as [lon, lat] waypoints along the roads it took.
const EAST = [[-84.48, 42.73], [-83.05, 42.33], [-81.25, 42.98], [-79.07, 43.09], [-77.6, 43.16], [-76.15, 43.05],
  [-74.9, 43.9], [-73.21, 44.48], [-71.3, 44.27], [-70.26, 43.66], [-70.9, 42.85], [-71.06, 42.36], [-71.41, 41.82],
  [-72.93, 41.31], [-74.0, 40.71], [-75.17, 39.95], [-76.61, 39.29], [-77.04, 38.91], [-77.44, 37.54], [-79.8, 36.07],
  [-82.55, 35.6], [-83.92, 35.96], [-84.5, 38.04], [-84.51, 39.1], [-84.19, 39.76], [-83.54, 41.66], [-84.48, 42.73]];
const WEST = [[-84.48, 42.73], [-85.59, 42.29], [-87.63, 41.88], [-90.58, 41.52], [-93.61, 41.59], [-94.58, 39.1],
  [-95.69, 39.05], [-97.61, 38.84], [-99.33, 38.88], [-102.0, 39.3], [-104.99, 39.74], [-106.37, 39.64], [-108.55, 39.06],
  [-110.16, 38.99], [-112.08, 38.77], [-113.06, 37.68], [-113.58, 37.1], [-115.14, 36.17], [-117.02, 34.9], [-119.02, 35.37],
  [-119.79, 36.74], [-121.57, 37.0], [-121.95, 37.35]];

// ---------- the map ----------
const PACIFIC = [[-170, 52], [-124.7, 48.4], [-124.0, 46.3], [-124.1, 44.0], [-124.5, 42.8], [-124.2, 41.0], [-124.4, 40.4],
  [-123.7, 38.9], [-123.0, 38.0], [-122.5, 37.8], [-122.5, 37.5], [-122.0, 36.95], [-121.9, 36.6], [-121.3, 35.6], [-120.6, 34.6],
  [-119.2, 34.2], [-118.5, 34.0], [-118.0, 33.6], [-117.2, 32.7], [-116.6, 31.4], [-115.6, 29.5], [-170, 24]];
const BAY = [[-122.5, 37.8], [-122.4, 37.95], [-122.3, 38.1], [-122.1, 38.05], [-122.05, 37.7], [-121.95, 37.42], [-122.15, 37.5], [-122.35, 37.65]];
const ATLANTIC = [[-30, 52], [-55, 52], [-64.5, 47.5], [-66.9, 44.8], [-68.2, 44.3], [-69.8, 43.7], [-70.2, 43.6], [-70.6, 42.9],
  [-70.8, 42.3], [-70.0, 41.9], [-69.95, 41.7], [-70.5, 41.5], [-71.4, 41.4], [-72.9, 41.2], [-73.8, 40.9], [-73.95, 40.6],
  [-74.0, 40.4], [-74.1, 39.7], [-74.9, 38.95], [-75.1, 38.4], [-75.4, 37.9], [-76.0, 37.0], [-75.6, 36.0], [-75.5, 35.25],
  [-76.5, 34.7], [-77.9, 33.9], [-79.0, 33.2], [-79.9, 32.8], [-80.9, 32.0], [-81.4, 30.4], [-81.0, 29.2], [-80.6, 28.4],
  [-80.0, 26.7], [-80.1, 25.4], [-81.1, 25.1], [-81.8, 26.2], [-82.7, 27.6], [-82.8, 28.9], [-83.7, 29.9], [-84.9, 29.7],
  [-86.5, 30.4], [-88.0, 30.5], [-89.4, 30.3], [-89.2, 29.2], [-90.5, 29.1], [-92.0, 29.6], [-93.8, 29.7], [-95.0, 29.3],
  [-96.6, 28.3], [-97.3, 27.3], [-97.4, 26.0], [-97.6, 24.0], [-30, 24]];
const CHESAPEAKE = [[-76.0, 37.0], [-76.3, 37.3], [-76.4, 38.0], [-76.5, 38.9], [-76.1, 39.5], [-76.0, 38.5], [-75.9, 37.6]];
const LAKES = [
  [[-92.1, 46.75], [-89.2, 48.35], [-87.0, 48.75], [-85.6, 47.9], [-84.9, 47.0], [-84.6, 46.5], [-85.9, 46.65], [-87.4, 46.5],
    [-88.0, 47.45], [-88.6, 46.95], [-89.9, 46.75], [-91.2, 46.85]],                                                       // Superior
  [[-87.65, 41.65], [-87.55, 42.6], [-87.9, 43.3], [-87.6, 44.2], [-87.4, 44.8], [-87.0, 45.2], [-86.6, 45.85], [-85.6, 45.9],
    [-84.8, 45.8], [-85.4, 45.2], [-85.6, 44.6], [-86.2, 44.1], [-86.4, 43.4], [-86.25, 42.6], [-86.6, 42.0], [-87.2, 41.6]],   // Michigan
  [[-84.7, 45.85], [-83.3, 46.05], [-81.9, 45.6], [-81.6, 45.15], [-81.3, 44.3], [-81.7, 43.5], [-82.4, 43.0], [-82.6, 43.6],
    [-83.4, 43.9], [-83.3, 44.6], [-83.5, 45.1], [-84.2, 45.6]],                                                            // Huron
  [[-81.6, 45.2], [-80.2, 45.8], [-79.9, 44.8], [-80.6, 44.5], [-81.2, 44.9]],                                              // Georgian Bay
  [[-83.4, 41.75], [-82.7, 41.45], [-81.7, 41.5], [-80.5, 41.95], [-79.1, 42.6], [-78.9, 42.9], [-79.6, 42.85], [-80.4, 42.6],
    [-81.5, 42.6], [-82.5, 42.05], [-83.1, 42.0]],                                                                          // Erie
  [[-79.8, 43.3], [-79.1, 43.2], [-77.6, 43.25], [-76.3, 43.5], [-76.2, 44.1], [-77.2, 44.0], [-78.3, 43.95], [-79.4, 43.65]],   // Ontario
];
const RIVERS = [
  [[-95.2, 47.5], [-93.3, 45.0], [-91.2, 43.5], [-90.6, 41.5], [-91.4, 40.0], [-90.2, 38.6], [-89.2, 37.0], [-90.2, 35.0], [-91.1, 33.0], [-91.3, 31.0], [-90.1, 29.9], [-89.4, 29.2]],   // Mississippi
  [[-111.5, 47.5], [-104.0, 47.9], [-100.4, 46.8], [-96.5, 42.5], [-95.9, 41.3], [-94.6, 39.1], [-92.2, 38.6], [-90.2, 38.8]],   // Missouri
  [[-80.0, 40.4], [-81.6, 39.3], [-82.9, 38.7], [-84.5, 39.1], [-85.8, 38.2], [-87.6, 37.9], [-89.2, 37.0]],                    // Ohio
  [[-106.0, 40.1], [-108.5, 39.1], [-109.9, 38.2], [-111.4, 36.9], [-112.1, 36.1], [-114.0, 36.1], [-114.7, 35.0], [-114.6, 32.7]],   // Colorado
  [[-76.4, 44.1], [-75.0, 45.0], [-73.5, 45.6], [-71.2, 46.8], [-68.5, 48.6], [-64.5, 49.2]],                                  // St Lawrence
];
// The US-Canada border, as the latitude where Canada starts at each longitude (west to east).
const CANADA = [[-125, 49], [-95.2, 49], [-89.6, 48.0], [-84.6, 46.5], [-82.4, 45.3], [-82.5, 43.0], [-79.0, 43.3], [-76.4, 44.1], [-74.7, 45.0], [-71.5, 45.0], [-70.0, 46.7], [-67.8, 47.1], [-67.0, 45.0], [-60, 45]];
const MEXICO = [[-125, 32.5], [-117.1, 32.5], [-114.7, 32.7], [-111.1, 31.3], [-108.2, 31.3], [-108.2, 31.8], [-106.5, 31.8], [-104.5, 29.6], [-103.0, 29.0], [-101.4, 29.8], [-99.5, 27.5], [-97.4, 25.9], [-90, 24]];
const RANGES = [[[-112, 48.5], [-109, 45], [-106.5, 40.5], [-105.5, 37.5], [-106, 35]],                          // the Rockies
  [[-120.8, 40.3], [-120, 38.8], [-118.6, 37], [-118.2, 35.6]],                                                       // the Sierra Nevada
  [[-121.8, 48.8], [-121.7, 46.8], [-121.8, 44.2], [-122.2, 42.3]],                                                   // the Cascades
  [[-84.8, 34.6], [-82.6, 35.6], [-80.5, 37.4], [-78.6, 39.2], [-76.4, 41.2], [-74.6, 42.4], [-73.0, 44.0], [-71.3, 44.3]]];   // the Appalachians
const STATE_LINES = [[[-124.2, 42], [-111.05, 42]], [[-120, 42], [-120, 39], [-114.6, 35]], [[-114.05, 42], [-114.05, 37]], [[-114.05, 37], [-94.6, 37]],
  [[-109.05, 41], [-109.05, 37]], [[-102.05, 41], [-102.05, 37]], [[-111.05, 41], [-102.05, 41]], [[-102.05, 40], [-95.3, 40]],
  [[-94.6, 36.5], [-81.7, 36.5]], [[-80.5, 39.7], [-75.8, 39.7]], [[-79.8, 42], [-75.4, 42]], [[-84.8, 39.1], [-84.8, 41.7]],
  [[-87.5, 38], [-87.5, 41.7]], [[-87.5, 41.7], [-82.7, 41.7]], [[-94.6, 40.6], [-94.6, 36.5]], [[-104.05, 49], [-104.05, 41]]];

// The land's colour by longitude: forest green in the East, farmland, the plains' yellow-green, the
// browns of the Rockies and the plateau, desert tan, and California's dry gold.
const TINTS = [[-125, '#a8ac68'], [-119, '#c4a870'], [-112, '#caa66e'], [-106, '#a88e66'], [-101, '#b8b46a'], [-95, '#9cb064'], [-88, '#86a660'], [-80, '#78985c'], [-66, '#6e8e58']];
const mix = (a, b, u) => '#' + hexToRgb(a).map((v, i) => Math.round(v + (hexToRgb(b)[i] - v) * u).toString(16).padStart(2, '0')).join('');
function landTint(lon) {
  if (lon <= TINTS[0][0]) return TINTS[0][1];
  for (let i = 1; i < TINTS.length; i++) if (lon <= TINTS[i][0]) return mix(TINTS[i - 1][1], TINTS[i][1], (lon - TINTS[i - 1][0]) / (TINTS[i][0] - TINTS[i - 1][0]));
  return TINTS.at(-1)[1];
}

// Interpolate a [lon, lat] polyline's latitude at a longitude.
function latAt(line, lon) {
  for (let i = 1; i < line.length; i++) {
    const [a, b] = [line[i - 1], line[i]];
    if (lon >= a[0] && lon <= b[0]) return a[1] + (b[1] - a[1]) * (lon - a[0]) / (b[0] - a[0] || 1);
  }
  return lon < line[0][0] ? line[0][1] : line.at(-1)[1];
}

function fillPoly(mask, pts, value) {
  const m = pts.map(toMap);
  for (let y = 0; y < MAP_H; y++) {
    const yc = y + 0.5, xs = [];
    for (let i = 0; i < m.length; i++) {
      const [x0, y0] = m[i], [x1, y1] = m[(i + 1) % m.length];
      if ((y0 <= yc) !== (y1 <= yc)) xs.push(x0 + (yc - y0) * (x1 - x0) / (y1 - y0));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.max(0, Math.ceil(xs[k])); x < Math.min(MAP_W, xs[k + 1]); x++) mask[y * MAP_W + x] = value;
  }
}

function polyline(p, pts, col, dash = 0) {
  const m = pts.map(toMap);
  let n = 0;
  for (let i = 1; i < m.length; i++) {
    const [x0, y0] = m[i - 1], [x1, y1] = m[i], steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    for (let s = 0; s < steps; s++, n++) if (!dash || n % dash < dash / 2) p.px(x0 + (x1 - x0) * s / steps, y0 + (y1 - y0) * s / steps, col);
  }
}

// The map in full colour: sea, the land tinted by region (Canada and Mexico paler), mountains with
// snow on the Rockies, the Great Lakes and rivers, borders and a few state lines.
function colourMap() {
  const p = new Painter(MAP_W, MAP_H), water = new Uint8Array(MAP_W * MAP_H), r = rng(54);
  fillPoly(water, PACIFIC, 1); fillPoly(water, ATLANTIC, 1);
  for (const lake of [...LAKES, BAY, CHESAPEAKE]) fillPoly(water, lake, 1);
  const ranges = RANGES.map(line => line.map(toMap));
  const nearRange = (x, y) => {
    let best = 99;
    for (const line of ranges) for (let i = 1; i < line.length; i++) {
      const [ax, ay] = line[i - 1], [bx, by] = line[i], dx = bx - ax, dy = by - ay;
      const u = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
      best = Math.min(best, Math.hypot(x - ax - u * dx, y - ay - u * dy));
    }
    return best;
  };
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    const lon = x / KX + LON0, lat = LAT0 - y / S, v = r();
    if (water[y * MAP_W + x]) { p.px(x, y, (x * 7 + y * 3) % 23 === 0 ? '#4a8ac8' : '#3a76b8'); continue; }
    let c = landTint(lon + (r() - 0.5) * 3);                                       // dithered from region to region
    if (lat > latAt(CANADA, lon)) c = mix(c, '#c4d0b0', 0.35);
    if (lat < latAt(MEXICO, lon)) c = mix(c, '#e0c89a', 0.4);
    const d = nearRange(x, y);
    if (lon > -86 && d < 3) c = v < 0.5 ? '#5e7e4a' : '#6a8a54';                  // the green Appalachians
    else if (lon < -100 && d < 3.5) c = d < 1.6 && v < 0.3 ? '#efefe9' : v < 0.5 ? '#8e765a' : '#9a8262';   // the western ranges, snow on the crest
    else if (v < 0.05) c = mix(c, '#000000', 0.12);
    p.px(x, y, c);
  }
  for (const line of RIVERS) polyline(p, line, '#4a86c4');
  polyline(p, CANADA, '#4a4a40', 4); polyline(p, MEXICO, '#4a4a40', 4);
  for (const line of STATE_LINES) polyline(p, line, '#6a6450', 3);
  for (let y = 0; y < MAP_H; y++) for (let x = 1; x < MAP_W; x++) {               // a light rim where land meets the sea
    if (water[y * MAP_W + x] !== water[y * MAP_W + x - 1]) p.px(water[y * MAP_W + x] ? x : x - 1, y, '#d8e4ea');
  }
  return p;
}

// The same map in Michigan's grey: every pixel pulled 80% of the way to its own luminance.
function greyed(p) {
  const g = new Painter(p.w, p.h);
  for (let k = 0; k < p.data.length; k += 4) {
    const [r, gg, b] = [p.data[k], p.data[k + 1], p.data[k + 2]], l = 0.3 * r + 0.59 * gg + 0.11 * b;
    g.data[k] = r + (l - r) * 0.8; g.data[k + 1] = gg + (l - gg) * 0.8; g.data[k + 2] = b + (l - b) * 0.8; g.data[k + 3] = p.data[k + 3];
  }
  return g;
}

// ---------- the car, the route, the places ----------
const CAR = art(`
...SSSS....
..SaaSaaS..
.SSSSSSSSS.
SSSSSSSSSSS
.OO.....OO.
`, { S: '#b4b9c0', a: '#2a3542', O: '#16161a' }, '#2a2d33');
const ICONS = {
  nyc: { at: [-74.0, 40.71], dx: 3, dy: -12, art: art(`
....s......
....s...s..
...ss...s..
..sss..sss.
.ssss.ssss.
sssssssssss
`, { s: '#5a6a80' }, '#2a2d38') },
  dc: { at: [-77.04, 38.91], dx: -14, dy: -8, art: art(`
.....w.....
.....w.....
.....w.....
..www.w....
.wwwwwww...
wwwwwwwww..
`, { w: '#e8e4da' }, '#4a4a48') },
  maine: { at: [-70.26, 43.66], dx: 3, dy: -10, art: art(`
.y.
rrr
www
rrr
www
`, { y: '#ffd75e', r: '#c8302a', w: '#f4f1ea' }, '#2a2a30') },
  chicago: { at: [-87.63, 41.88], dx: -6, dy: -13, art: art(`
..s.s.....
..sss.....
..sss.s...
.ssss.ss..
.sssssss..
ssssssss..
`, { s: '#4a5262' }, '#22242a') },
  arch: { at: [-109.6, 38.6], dx: -4, dy: -9, art: art(`
.rrrrr.
rr...rr
r.....r
r.....r
`, { r: '#c8603a' }, '#5a2a1a') },
  vegas: { at: [-115.14, 36.17], dx: 3, dy: -9, art: art(`
.ppppp.
pyyyyyp
pyyyyyp
.ppppp.
...p...
`, { p: '#e84a8a', y: '#ffe08a' }, '#3a1a2a') },
  bridge: { at: [-122.48, 37.82], dx: -12, dy: -9, art: art(`
r.....r
r.....r
rrrrrrr
r.r.r.r
`, { r: '#d8402a' }, '#4a1a12') },
};
const PLACES = [['EAST LANSING', [-84.48, 42.73], 0], ['NEW YORK', [-74.0, 40.71], 0], ['WASHINGTON', [-77.04, 38.91], 0],
  ['CHICAGO', [-87.63, 41.88], 1], ['DENVER', [-104.99, 39.74], 1], ['LAS VEGAS', [-115.14, 36.17], 1], ['SANTA CLARA', [-121.95, 37.35], 1]];

// Lengths along a leg, so the car keeps an even pace; and how far along its leg the car is when it
// reaches each landmark and place.
function route(pts) {
  const m = pts.map(toMap), acc = [0];
  for (let i = 1; i < m.length; i++) acc.push(acc[i - 1] + Math.hypot(m[i][0] - m[i - 1][0], m[i][1] - m[i - 1][1]));
  return { m, acc, len: acc.at(-1) };
}
function along(rt, d) {
  let i = 1;
  while (i < rt.m.length - 1 && rt.acc[i] < d) i++;
  const u = Math.max(0, Math.min(1, (d - rt.acc[i - 1]) / (rt.acc[i] - rt.acc[i - 1] || 1)));
  const [x0, y0] = rt.m[i - 1], [x1, y1] = rt.m[i];
  return { x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u, dir: Math.sign(x1 - x0) || 1 };
}
const legU = ([a, b], t) => Math.max(0, Math.min(1, (t - a) / (b - a)));

// Where the car is at time t, on which leg, and how far the colour has spread (0 until it turns west).
export function tripAt(t) {
  const e = legU(LEGS.east, t), w = legU(LEGS.west, t);
  const leg = t < LEGS.west[0] ? 'east' : 'west', rt = leg === 'east' ? R_EAST : R_WEST;
  const pos = along(rt, (leg === 'east' ? e : w) * rt.len);
  return { leg, ...pos, colour: leg === 'west' ? Math.pow(w, 1.6) * (MAP_W + 100) + (t > LEGS.west[1] ? 2000 : 0) : 0 };
}
const R_EAST = route(EAST), R_WEST = route(WEST);
function reachAt(pt, leg) {
  const rt = leg ? R_WEST : R_EAST, [px, py] = toMap(pt);
  let best = 0, bestD = Infinity;
  for (let d = 0; d <= rt.len; d += 1) { const q = along(rt, d), dd = Math.hypot(q.x - px, q.y - py); if (dd < bestD) { bestD = dd; best = d; } }
  return best;
}
const WEST_KEYS = new Set(['chicago', 'arch', 'vegas', 'bridge']);
for (const [key, icon] of Object.entries(ICONS)) { icon.leg = WEST_KEYS.has(key) ? 1 : 0; icon.d = reachAt(icon.at, icon.leg); }
const SPOTS = PLACES.map(([name, pt, leg]) => ({ name, pt, leg, d: name === 'EAST LANSING' ? -1 : reachAt(pt, leg) }));

export function buildRoadtrip(W, H = 96) {
  const colour = colourMap();
  return { W, H, layers: { colour, grey: greyed(colour) }, mapW: MAP_W, mapH: MAP_H };
}

const labels = new Map();
function text(str, ink) {
  if (!labels.has(str + ink)) labels.set(str + ink, label(str, ink));
  return labels.get(str + ink);
}

function trail(ctx, rt, upTo, X, Y) {
  ctx.fillStyle = '#f0dc8c';
  let n = 0;
  for (let i = 1; i < rt.m.length; i++) {
    const [x0, y0] = rt.m[i - 1], [x1, y1] = rt.m[i], seg = rt.acc[i] - rt.acc[i - 1];
    for (let s = 0; s < seg; s += 1, n++) {
      if (rt.acc[i - 1] + s > upTo) return;
      if (n % 3 < 2) ctx.fillRect(X(x0 + (x1 - x0) * s / seg), Y(y0 + (y1 - y0) * s / seg), 1, 1);
    }
  }
}

function layerAt(ctx, img, t, s, env, cam) {
  // one full drawing of the map: the base, the trails driven so far, places and landmarks reached
  const { x: camX, y: camY } = cam, X = (x) => Math.round(x - camX), Y = (y) => Math.round(y - camY);
  ctx.drawImage(img, -Math.round(camX), -Math.round(camY));
  const e = legU(LEGS.east, t), w = legU(LEGS.west, t);
  trail(ctx, R_EAST, e * R_EAST.len, X, Y);
  if (w > 0) trail(ctx, R_WEST, w * R_WEST.len, X, Y);
  const reached = (leg, d) => (leg ? w * R_WEST.len : e * R_EAST.len) >= d;     // has the car got this far along the leg?
  for (const icon of Object.values(ICONS)) {
    if (!reached(icon.leg, icon.d)) continue;
    const [mx, my] = toMap(icon.at);
    ctx.drawImage(env.art(icon.art), X(mx + icon.dx), Y(my + icon.dy));
  }
  for (const { name, pt, leg, d } of SPOTS) {
    if (!reached(leg, d)) continue;
    const [mx, my] = toMap(pt), fg = env.art(text(name, '#f4f1ea')), bg = env.art(text(name, '#141418'));
    ctx.fillStyle = '#141418'; ctx.fillRect(X(mx) - 1, Y(my) - 1, 3, 3);
    ctx.fillStyle = '#f4f1ea'; ctx.fillRect(X(mx), Y(my), 1, 1);
    const lx = X(mx) - (name === 'SANTA CLARA' ? -4 : fg.width / 2), ly = Y(my) + (name === 'NEW YORK' || name === 'WASHINGTON' ? 4 : -9);
    ctx.drawImage(bg, lx + 1, ly + 1); ctx.drawImage(fg, lx, ly);
  }
}

export function renderRoadtrip(ctx, t, s, env) {
  const { W, H, canvases: c } = s, trip = tripAt(t);
  const camX = W >= MAP_W * 0.62 ? toMap([-96.5, 0])[0] - W / 2 : Math.min(Math.max(trip.x - W * 0.5, 0), MAP_W - W);
  const cam = { x: camX, y: Math.min(Math.max(trip.y - 56, 0), MAP_H - H) };
  ctx.clearRect(0, 0, W, H);
  layerAt(ctx, c.grey, t, s, env, cam);
  if (trip.colour > 0) {                                                            // the colour spreads out from the car
    const cx = trip.x - cam.x, cy = trip.y - cam.y, r = trip.colour;
    ctx.save(); ctx.beginPath();
    for (let y = 0; y < H; y++) { const d = r * r - (y - cy) * (y - cy); if (d > 0) { const hw = Math.sqrt(d); ctx.rect(Math.round(cx - hw), y, Math.round(2 * hw), 1); } }
    ctx.clip();
    layerAt(ctx, c.colour, t, s, env, cam);
    ctx.restore();
    if (r < W * 2) {
      ctx.fillStyle = '#fff6d0';
      for (let a = 0; a < Math.PI * 2; a += 2 / Math.max(8, r)) if ((Math.floor(a * r) + Math.floor(t * 30)) % 3) ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1);
    }
  }
  const car = env.art(CAR), x = Math.round(trip.x - cam.x), y = Math.round(trip.y - cam.y);   // the car, facing the way it drives
  const bob = t < LEGS.west[1] && Math.floor(t * 10) % 2 ? 1 : 0;
  ctx.save();
  if (trip.dir < 0) { ctx.translate(x * 2, 0); ctx.scale(-1, 1); }
  ctx.drawImage(car, x - 6, y - 6 - bob);
  ctx.restore();
}

export const roadtrip = { build: buildRoadtrip, render: renderRoadtrip };
```

- [ ] **Step 4: Put it in place of the door.** Replace `reel/ch3/index.js` with:

```js
// Chapter 3: Michigan, five grey years from the first snow to the hooding, then the Graduation Road Trip.
import { snow } from './snow.js';
import { timelapse } from './timelapse.js';
import { hooding } from './hooding.js';
import { roadtrip } from './roadtrip.js';

export const CHAPTER_3 = {
  name: 'Michigan',
  shots: [
    { id: 'ch3-snow', scene: snow, caption: 'Michigan', duration: 2 },
    { id: 'ch3-timelapse', scene: timelapse, caption: 'Michigan', duration: 4.5, fadeIn: 0.1 },
    { id: 'ch3-hooding', scene: hooding, caption: 'Michigan', duration: 2, fadeIn: 0.15, fadeOut: 0.15 },
    { id: 'ch3-roadtrip', scene: roadtrip, caption: 'Graduation Road Trip', duration: 5, fadeIn: 0.2 },
  ],
};
```

Delete the door and its test:

```bash
git rm -q reel/ch3/door.js tests/reel/ch3-door.test.js
```

Apply to `reel/ch3/hooding.js`:

`reel/ch3/hooding.js`, change 1. Find:

```js
// where x is the sprite's left edge and bob the frame's 1px dip. Used by the door shot too.
export function drawHood(ctx, x, y, bob = 0) {
  const sx = x + 9, top = y + 11 + 17 + bob;                                        // the character's left edge; the shoulder row
```

Replace with:

```js
// where x is the sprite's left edge.
function drawHood(ctx, x, y) {
  const sx = x + 9, top = y + 11 + 17;                                              // the character's left edge; the shoulder row
```

The road trip makes chapter 3 3.5 s longer, so California and chapter 5 start later. Move the page checks. Apply to `tests/reel/page-check.sh`:

`tests/reel/page-check.sh`, change 1. Find:

```bash
d=$(dom 1440,900 '?reel=47'); expect 'California lights step 4' "$d" 'data-chapter="3"' 'class="step is-live" data-org="amazon"'
d=$(dom 1440,900 '?reel=53'); expect 'To be continued keeps step 4 lit' "$d" 'data-chapter="4"' '>To be continued…<' 'class="step is-live" data-org="amazon"'
```

Replace with:

```bash
d=$(dom 1440,900 '?reel=45'); expect 'the Graduation Road Trip keeps step 3 lit' "$d" 'data-chapter="2"' '>Graduation Road Trip<' 'class="step is-live" data-org="msu"'
d=$(dom 1440,900 '?reel=50'); expect 'California lights step 4' "$d" 'data-chapter="3"' '>California<' 'class="step is-live" data-org="amazon"'
d=$(dom 1440,900 '?reel=56'); expect 'To be continued keeps step 4 lit' "$d" 'data-chapter="4"' '>To be continued…<' 'class="step is-live" data-org="amazon"'
```

- [ ] **Step 5: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 167`, `ℹ fail 0`, then 16 `ok` lines, including `the Graduation Road Trip keeps step 3 lit`, and exit 0.

- [ ] **Step 6: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 42.3,43.2,43.9,44.6,45.4,46.2,46.9 && python3 tests/reel/sheet.py /tmp/f /tmp/f-trip.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 43.4,45.2,46.9 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-trip.png 3
```

Expected:
- 42.3 s: the grey map of the United States, with the Great Lakes, the coasts, rivers, the Canadian and Mexican borders and a few state lines. A small silver car sits at `EAST LANSING`.
- 43.2 s: the car has crossed Ontario and New York State to New England, trailing a dotted yellow line, and the Maine lighthouse has popped up.
- 43.9 s: down the coast, past `NEW YORK` (a skyline) and `WASHINGTON` (the Capitol).
- 44.6 s: the loop closes through Tennessee, Kentucky and Ohio, and the car is back in Michigan, still all grey.
- 45.4 s: heading west, past `CHICAGO`, the car faces left, and a ring of colour has opened round it.
- 46.2 s: past `DENVER` and the snow-capped Rockies, at a Utah arch, and nearly all the map is in colour.
- 46.9 s: at `SANTA CLARA`, past `LAS VEGAS`, and the whole map is in colour: the Golden Gate, California's gold, the forest-green East.
- On the phone, the camera follows the car along the East coast, then west through the colour, to the Bay.

- [ ] **Step 7: Update the spec.** Apply to `docs/superpowers/specs/2026-10-03-life-reel-design.md`:

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 1. Find:

```markdown
The full loop runs about 63 s, and the timings below are targets. The caption is the place name and fades in at the top left whenever it changes.
```

Replace with:

```markdown
The full loop runs about 66 s, and the timings below are targets. The caption is the place name and fades in at the top left whenever it changes.
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 2. Find:

```markdown
### 3 · Michigan (~10 s). Caption: `Michigan`. Grey, low-saturation palette: the sets are painted in muted colours, and Yimeng and the dog are drawn in a muted version of their palettes.
```

Replace with:

```markdown
### 3 · Michigan (~13.5 s). Caption: `Michigan`, then `Graduation Road Trip` for the drive. Grey, low-saturation palette: the sets are painted in muted colours, and Yimeng and the dog are drawn in a muted version of their palettes.
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 3. Find:

```markdown
4. Transition: in a grey corridor, Yimeng, hooded, walks with the dog to a door. It swings open on California in full colour, and the colour floods out from the doorway, as in *The Wizard of Oz*. Whatever it reaches turns to colour, Yimeng and the dog included, until it fills the frame.
```

Replace with:

```markdown
4. Transition: the Graduation Road Trip, on a map of the United States, captioned `Graduation Road Trip` the whole way. A small silver car leaves East Lansing and loops round the East first, still in Michigan's grey: through Ontario to Niagara Falls, across New York State to Vermont and the Maine coast, down by Boston, New York City and Washington to the Carolinas, and home through Tennessee, Kentucky and Ohio. Then it turns west, by Chicago, Kansas City, Denver and the Rockies, Utah and Las Vegas, to Santa Clara.
   - Places are labelled as the car reaches them, and landmarks pop up: the Maine lighthouse, the Manhattan skyline, the Capitol, the Chicago skyline, a Utah arch, the Las Vegas sign and the Golden Gate Bridge.
   - Once the car heads west, the colour spreads out from it, slowly at first, until the whole map is in full colour as it reaches California.
   - A desktop shows the whole route from a still camera. On a phone, the camera follows the car.
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 4. Find:

```markdown
- **Shots:** each chapter exports a list of shots. A shot has a duration and the layers it uses, each with a parallax factor. It has a camera speed, which can be 0 for staged moments, and actor tracks for Yimeng and the dog: outfit, action (walk, sit, ride, eat, swim and so on), screen position and props. It can also have timed events (counters, stamps, cuts) and a transition into the next shot (cut, crossfade, or a special one: caps → snow, door → colour, the pencil sketch). The engine concatenates all shots into one timeline and derives chapter boundaries from it for the caption, the buttons and the sync.
- **Rendering:** layers are pre-rendered once into offscreen canvases that tile seamlessly. They are built lazily just before a shot starts and released after it ends. Each frame composes the layers and actors onto one canvas at native resolution, about 480×96 on desktop, which the browser scales. The grey Michigan palette and the door → colour transition use palette-derived muted variants of the cast (`env.hero(key, pose, 'muted')`) and a clip that grows from the doorway, not `ctx.filter`, which Safari lacks. All layouts use a seeded PRNG, so every play looks the same.
```

Replace with:

```markdown
- **Shots:** each chapter exports a list of shots. A shot has a duration and the layers it uses, each with a parallax factor. It has a camera speed, which can be 0 for staged moments, and actor tracks for Yimeng and the dog: outfit, action (walk, sit, ride, eat, swim and so on), screen position and props. It can also have timed events (counters, stamps, cuts) and a transition into the next shot (cut, crossfade, or a special one: caps → snow, the road trip's spreading colour, the pencil sketch). The engine concatenates all shots into one timeline and derives chapter boundaries from it for the caption, the buttons and the sync.
- **Rendering:** layers are pre-rendered once into offscreen canvases that tile seamlessly. They are built lazily just before a shot starts and released after it ends. Each frame composes the layers and actors onto one canvas at native resolution, about 480×96 on desktop, which the browser scales. The grey Michigan palette uses palette-derived muted variants of the cast (`env.hero(key, pose, 'muted')`), and the road trip draws a pre-greyed copy of the map under the coloured one, clipped to a circle that grows from the car. Neither uses `ctx.filter`, which Safari lacks. All layouts use a seeded PRNG, so every play looks the same.
```

- [ ] **Step 8: Commit**

```bash
git add reel/ch3/roadtrip.js reel/ch3/index.js reel/ch3/hooding.js tests/reel/ch3-roadtrip.test.js tests/reel/ch3-chapter.test.js tests/reel/page-check.sh docs/superpowers/specs/2026-10-03-life-reel-design.md
git commit -m "feat(reel): Drive the Graduation Road Trip on a map in place of the door"
```

---

### Task 3: The arrival

**Files:**
- Create: `reel/ch4/arrive.js`
- Test: `tests/reel/ch4-arrive.test.js` (new)

**Interfaces:**
- Consumes: `Painter`, `rng`; `gradient`, `ridge`, `art`; the hero's `work` outfit in the `sit` pose.
- Produces: `CAR_W = 112`, `CAR_H = 46`, and `carAt(s, t) → x`, the car's left edge. It rolls in from off the left until 1.2 s, easing out, and stops at `s.stopX`.
- Produces: `arrive`, a scene with layers `sky`, `street` and `car`, exposing `stopX = round(W/2 - CAR_W/2)`.
  - The wheels turn with the car and are drawn on their own.
  - Yimeng and the dog are drawn after the car, clipped to the front window, under a light glass tint. The dog is an `art` sprite at `(x + 63, y + 9)`, where `(x, y)` is the car's top left. It has its ears back while driving and pricked once parked.

- [ ] **Step 1: Write the failing test.** Create `tests/reel/ch4-arrive.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { arrive, carAt, CAR_W } from '../../reel/ch4/arrive.js';

sceneContract('ch4 arrive', arrive, 1.8);

test('arrive: the GLC rolls in from off the left and eases to a stop mid-street', () => {
  const s = arrive.build(480, 96), x = [0, 0.3, 0.6, 0.9, 1.2, 1.7].map(t => carAt(s, t));
  assert.ok(x[0] + CAR_W <= 0, 'off screen at first');
  assert.ok(x[1] - x[0] > x[3] - x[2], 'slowing down');
  assert.deepEqual(x.slice(4), [s.stopX, s.stopX]);
  assert.equal(s.stopX + CAR_W / 2, 240, 'stopped in the middle');
});

test('arrive: through the window, Yimeng in the passenger seat and the dog standing at the wheel', () => {
  const { ctx, s } = frameAt(arrive, 480, 1.5), [[x, y]] = ctx.draws('car');
  assert.deepEqual([x, y], [s.stopX, 47]);
  assert.deepEqual(ctx.draws('work:sit:0'), [[x + 37, y - 6]]);
  assert.ok(ctx.draws('art').some(([ax, ay]) => ax === x + 63 && ay === y + 9), 'the dog, at the wheel');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/reel/ch4-arrive.test.js`
Expected: the file fails to load (`Cannot find module …/reel/ch4/arrive.js`).

- [ ] **Step 3: Implement.** Create `reel/ch4/arrive.js`:

```js
// Chapter 4, shot 1: California. A bright morning on a palm-lined street of white stucco and red
// tile, golden hills behind. The silver-grey Mercedes-AMG GLC 63 rolls in and stops, the dog standing
// at the wheel in its houndstooth turtleneck, as in the photo at the top of the page, Yimeng beside it.
import { Painter, rng } from '../pixels.js';
import { gradient, ridge, art } from '../kit.js';

const ROAD = 92;                             // the row under the tyres
const ARRIVE = 1.2;                          // the car rolls in until here, then stops
export const CAR_W = 112, CAR_H = 46;
const WHEELS = [24, 90], AXLE = 35, WHEEL_R = 10;   // wheel centres (x, in the car), axle row, tyre radius
const WINDOW = [54, 8, 24, 12];                   // the front door's glass: x, y, w, h
const SILVER = '#aab0b7', LIGHT = '#d6dadf', SHADE = '#7d838b', DARK = '#33363d', GLASS = '#26303c', GLINT = '#46566a';

// The dog standing up at the wheel, as in the photo: its head turned forward, the houndstooth
// turtleneck, a front paw on the rim. Two frames: ears back while driving, pricked once parked.
const DOG_PAL = { C: '#5a5e6e', c: '#454857', e: '#3b3d48', N: '#141218', 1: '#efe4cb', 2: '#9a6a45', 3: '#3a2e28' };
const DOG_AT_WHEEL = [`
............
....ee......
...eCCC.....
...CCNCCC...
....CCCCCCN.
....CCcc....
...3112.....
..121312....
..311213CC..
..2131...C..
..1213......
..3121......
`, `
....e.......
....ee......
...eCCC.....
...CCNCCC...
....CCCCCCN.
....CCcc....
...3112.....
..121312....
..311213CC..
..2131...C..
..1213......
..3121......
`].map(rows => art(rows, DOG_PAL, '#22202a'));

// The car's upper edge at x: rear bumper, the raked tailgate, the roof, the windscreen, the hood, the nose.
function roofline(x) {
  if (x < 3) return 22;
  if (x < 14) return Math.round(20 - (x - 3) * 14 / 11);
  if (x < 40) return Math.round(6 - (x - 14) * 2 / 26);
  if (x < 70) return 4;
  if (x < 86) return Math.round(4 + (x - 70) * 15 / 16);
  if (x < 106) return Math.round(19 + (x - 86) * 3 / 20);
  return 22 + Math.round((x - 106) * 0.5);
}

// The GLC 63 from its left side, facing right: a compact SUV's tall body and short high hood, raked
// tailgate, roof rails, tinted glass, the Panamericana grille, quad pipes. Wheels are drawn on their
// own, so they can turn.
function glc() {
  const p = new Painter(CAR_W, CAR_H);
  for (let x = 0; x < CAR_W; x++) {
    const t = roofline(x), bottom = x < 8 || x > 104 ? 38 : 36;
    for (let y = t; y < bottom; y++) {
      let c = y === t ? LIGHT : y < 20 ? SILVER : y < 22 ? LIGHT : y === 23 ? '#c4c9cf' : y < 30 ? SILVER : y < 34 ? SHADE : DARK;
      if (y === 30) c = '#8e949c';                                                 // the lower crease
      for (const wx of WHEELS) if (Math.hypot(x - wx, y - AXLE) < WHEEL_R + 1.5) c = null;   // wheel arches
      if (c) p.px(x, y, c);
    }
  }
  for (const wx of WHEELS) for (let a = Math.PI; a <= Math.PI * 2; a += 0.02) p.px(Math.round(wx + Math.cos(a) * (WHEEL_R + 2)), Math.round(AXLE + Math.sin(a) * (WHEEL_R + 2)), DARK);
  for (let x = 16; x < 70; x++) p.px(x, roofline(x) - 1, x % 7 === 0 ? SHADE : DARK);   // roof rails
  for (let x = 15; x <= 78; x++) for (let y = 7; y < 20; y++) {                     // the glass, inset from the roof
    if (y < roofline(x) + 2 || (x < 18 && y < roofline(x) + 3) || (x > 72 && y < roofline(x + 3) + 1)) continue;
    p.px(x, y, (x - y) % 13 === 0 || (x - y) % 13 === 1 ? GLINT : GLASS);
  }
  for (let y = 6; y < 21; y++) for (const x of [30, 31, 52, 53]) p.px(x, y, DARK);   // C- and B-pillars
  for (let x = 15; x <= 80; x++) p.px(x, 20, '#c8ccd2');                           // chrome window line
  for (const x of [31, 53]) for (let y = 21; y < 34; y++) p.px(x, y, SHADE);       // door shuts
  p.rect(42, 24, 4, 1, LIGHT); p.rect(66, 24, 4, 1, LIGHT);                         // handles
  p.rect(79, 15, 6, 4, SILVER); p.rect(79, 14, 5, 1, LIGHT);                        // mirror
  p.rect(98, 21, 9, 3, '#e8f0f8'); p.rect(98, 24, 7, 1, '#9ab4d8');                 // headlight
  for (let y = 24; y < 34; y++) for (let x = 106; x < CAR_W; x++) if (y >= roofline(x)) p.px(x, y, (x % 2) ? '#c8ccd2' : DARK);   // the grille's slats
  p.rect(1, 21, 4, 5, '#c8302a'); p.rect(4, 15, 3, 5, '#c8302a'); p.px(5, 16, '#ff6a5a');   // tail lights
  p.rect(94, 26, 7, 1, DARK); p.rect(95, 27, 5, 1, '#5a5e66');                     // the AMG fender badge
  for (const x of [2, 7]) { p.rect(x, 35, 3, 2, '#1a1a1e'); p.px(x + 1, 35, '#8a9098'); }   // quad pipes, in pairs
  for (let x = 36; x < 76; x++) { p.px(x, 34, '#1e2024'); p.px(x, 35, '#2a2d33'); }  // side skirt
  return p;
}

function wheel(ctx, x, y, turn) {
  for (let j = -WHEEL_R; j <= WHEEL_R; j++) for (let i = -WHEEL_R; i <= WHEEL_R; i++) {
    const d = Math.hypot(i, j);
    if (d > WHEEL_R) continue;
    let c = d > WHEEL_R - 2.5 ? '#141418' : d > WHEEL_R - 3.2 ? '#4a4e56' : '#2c2f35';
    const a = Math.atan2(j, i) + turn;
    if (d <= WHEEL_R - 3.2 && d > 1.5 && Math.abs(((a * 5 / (Math.PI * 2)) % 1 + 1) % 1 - 0.5) < 0.12) c = '#9aa0a8';   // five spokes
    if (d <= 1.5) c = '#6a6e76';
    ctx.fillStyle = c; ctx.fillRect(x + i, y + j, 1, 1);
  }
}

function street(W, H) {
  const p = new Painter(W, H), r = rng(77);
  const hills = ridge(W, 12, [[4, 2, 0.5], [2, 5, 1.6]]);
  for (let x = 0; x < W; x++) for (let j = 0; j < hills[x]; j++) p.px(x, 62 - j, j > hills[x] - 1.5 ? '#e8c46a' : '#d8ae58');   // golden hills
  for (let n = 0; n < W / 26; n++) {                                               // oaks dotting the hills
    const x = Math.floor(r() * W), y = 62 - Math.floor(hills[x] * 0.6);
    for (let j = -2; j <= 2; j++) for (let i = -3; i <= 3; i++) if (i * i + j * j * 2 < 10) p.px(x + i, y + j, j < 0 ? '#5e7a3e' : '#4a6232');
  }
  for (let x0 = -10, n = 0; x0 < W; x0 += 46, n++) {                              // white stucco and red tile
    const w = 40, top = 52 + (n % 3) * 4;
    for (let y = top; y < 80; y++) for (let x = x0; x < x0 + w; x++) p.px(x, y, n % 2 ? '#f2ece0' : '#efe2cc');
    for (let k = 0; k < 4; k++) for (let x = x0 - 2 + k; x < x0 + w + 2 - k; x++) p.px(x, top - 1 - k, k % 2 ? '#a8462e' : '#c45a3a');
    for (const wx of [x0 + 6, x0 + 26]) { p.rect(wx, top + 7, 7, 8, '#3a5a7a'); p.rect(wx, top + 7, 7, 1, '#8a5a3a'); }
    p.rect(x0 + 17, top + 12, 6, 80 - top - 12, '#7a4a32');
  }
  for (let x0 = 22; x0 < W; x0 += 64) {                                           // palms
    for (let s = 0; s < 60; s++) p.px(x0 + Math.round((s / 60) ** 2 * 5), 80 - s, s % 3 ? '#8a6a4a' : '#6e5038');
    for (const [dir, droop] of [[-1, 0.9], [-0.6, 0.35], [0.6, 0.35], [1, 0.9], [0.15, 0]]) for (let k = 0; k < 15; k++) {
      p.px(x0 + 5 + dir * k, 20 - Math.round(2.5 * Math.sin(k / 15 * Math.PI) * (1 - droop) - droop * (k / 15) ** 2 * 9), r() < 0.5 ? '#3f8a3a' : '#5aa848');
    }
  }
  for (let y = 80; y < H; y++) for (let x = 0; x < W; x++) {                      // sidewalk, kerb, road
    let c = y < 84 ? ((x % 12 === 0) ? '#b8b2a6' : '#d0cabc') : y === 84 ? '#8a867e' : (y === 90 && x % 16 < 8) ? '#e8d48a' : '#4a4c52';
    p.px(x, y, c);
  }
  return p;
}

export function buildArrive(W, H = 96) {
  return { W, H, stopX: Math.round(W * 0.5 - CAR_W / 2), layers: { sky: gradient(W, H, [['#3a86d8', 0], ['#5a9ee0', 0.3], ['#86bcea', 0.6], ['#bcdcf4', 0.85]]), street: street(W, H), car: glc() } };
}

// Where the car is: rolling in from off the left, easing to a stop at stopX.
export function carAt(s, t) {
  const u = Math.min(1, t / ARRIVE), e = 1 - (1 - u) * (1 - u);
  return Math.round(-CAR_W - 10 + (s.stopX + CAR_W + 10) * e);
}

export function renderArrive(ctx, t, s, env) {
  const { W, H, canvases: c } = s, x = carAt(s, t), y = ROAD - CAR_H + 1;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  ctx.drawImage(c.street, 0, 0);
  ctx.drawImage(c.car, x, y);
  // through the front window: Yimeng in the passenger seat, and the dog standing at the wheel
  const [wx, wy, ww, wh] = WINDOW;
  ctx.save(); ctx.beginPath(); ctx.rect(x + wx, y + wy, ww, wh); ctx.clip();
  const hero = env.hero('work', 'sit');
  ctx.drawImage(hero.canvases[0], x + wx - 8 - hero.anchorX, y + wy - 14);
  ctx.fillStyle = '#1e2024'; ctx.fillRect(x + wx + 18, y + wy + 5, 2, 7);           // the steering wheel's rim
  ctx.drawImage(env.art(DOG_AT_WHEEL[t < ARRIVE ? 0 : 1]), x + wx + 9, y + wy + 1);
  ctx.globalAlpha = 0.28; ctx.fillStyle = GLASS; ctx.fillRect(x + wx, y + wy, ww, wh); ctx.globalAlpha = 1;   // tinted glass over them
  ctx.restore();
  const turn = -x / WHEEL_R;                                                        // the wheels roll with the car
  for (const wxl of WHEELS) wheel(ctx, x + wxl, y + AXLE, turn);
  if (t < ARRIVE) {                                                                 // a little road dust behind
    ctx.fillStyle = 'rgba(220, 200, 160, 0.5)';
    for (let k = 0; k < 3; k++) ctx.fillRect(x - 6 - k * 5, ROAD - 2 - k, 4, 2);
  }
}

export const arrive = { build: buildArrive, render: renderArrive };
```

- [ ] **Step 4: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 171`, `ℹ fail 0`, then 16 `ok` lines and exit 0. The shot is not in the reel yet: Task 6 adds it.

- [ ] **Step 5: Commit**

```bash
git add reel/ch4/arrive.js tests/reel/ch4-arrive.test.js
git commit -m "feat(reel): Add the California arrival, the dog at the wheel of the GLC"
```

---

### Task 4: The office

**Files:**
- Create: `reel/ch4/office.js`
- Test: `tests/reel/ch4-office.test.js` (new)

**Interfaces:**
- Consumes: `Painter`, `rng`; `gradient`; the hero's `work` outfit in the `type` pose and its `hands`; the dog's `houndstooth` coat in the `sleep` pose.
- Produces: `CLOSES`, 12 closing prices that rise with a dip in the middle, and `candlesAt(t)`, the number of candles on the chart: one more every 0.11 s, from 1 up to 11.
- Produces: `office`, a scene with layers `room` (behind Yimeng) and `desk` (in front), exposing `hx = round(0.34 W)`, the left edge of Yimeng's chair.
  - The whiteboard and the plant appear only where they fit.

- [ ] **Step 1: Write the failing test.** Create `tests/reel/ch4-office.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { office, candlesAt, CLOSES } from '../../reel/ch4/office.js';

sceneContract('ch4 office', office, 1.6);

test('office: the chart on the phone grows a candle at a time and climbs, with a dip on the way', () => {
  assert.deepEqual([0, 0.11, 0.5, 1.2, 1.6].map(candlesAt), [1, 2, 5, 11, 11]);
  assert.equal(CLOSES.length, 12, 'eleven candles, open to close');
  assert.ok(CLOSES.at(-1) > CLOSES[0] * 2, 'up overall');
  assert.ok(CLOSES.some((c, i) => i && c < CLOSES[i - 1]), 'with red candles too');
});

test('office: Yimeng works at the desk in the purple hoodie, the dog asleep under it', () => {
  const { ctx, s } = frameAt(office, 480, 0.8), calls = ctx.calls.filter(c => c[0] === 'drawImage');
  const at = (re) => calls.findIndex(c => re.test(c[1]));
  assert.deepEqual(calls.filter(c => /^work:type:\d$/.test(c[1])).map(c => [c[2], c[3]]), [[s.hx - 9, 41]]);
  assert.ok(at(/^dog:houndstooth:sleep:\d$/) >= 0);
  assert.ok(at(/^desk$/) > at(/^work:type/), 'the desk in front of Yimeng');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/reel/ch4-office.test.js`
Expected: the file fails to load (`Cannot find module …/reel/ch4/office.js`).

- [ ] **Step 3: Implement.** Create `reel/ch4/office.js`:

```js
// Chapter 4, shot 2: the office. A bright open-plan floor with California through glass walls,
// palms and golden hills outside. Yimeng, in the purple sun hoodie, works at the desk with a phone in
// hand, and a bubble shows its stock chart climbing candle by candle. The dog naps under the desk.
import { Painter, rng } from '../pixels.js';
import { gradient } from '../kit.js';

const FLOOR = 90, SEAT = 80, DESK_TOP = 73;
const CANDLES = 11, EVERY = 0.11;              // the chart grows one candle every EVERY seconds
// The chart's closes, an index from the first: a climb with a dip in the middle.
export const CLOSES = [10, 11, 13, 12, 15, 17, 16, 14, 18, 21, 24, 27];

// How many candles are on the chart at time t.
export const candlesAt = (t) => Math.min(CANDLES, 1 + Math.floor(t / EVERY));

function room(W, H, hx) {
  const p = new Painter(W, H), r = rng(23);
  const sky = gradient(W, H, [['#6aaee8', 0], ['#8ac0ee', 0.4], ['#bcdcf4', 0.7]]);
  p.data.set(sky.data);
  for (let x = 0; x < W; x++) {                                                    // outside: hills, low glass offices, palms
    const h = 6 + Math.sin(x * 0.03) * 3 + Math.sin(x * 0.09 + 1) * 1.5;
    for (let y = Math.round(54 - h); y < 54; y++) p.px(x, y, '#d8b45e');
  }
  for (let x0 = 4; x0 < W; x0 += 70) for (let y = 44; y < 60; y++) for (let x = x0; x < x0 + 40; x++) p.px(x, y, (x + y) % 5 === 0 ? '#9ac4e0' : '#6a8aa8');
  for (let x0 = 30; x0 < W; x0 += 58) {
    for (let s = 0; s < 34; s++) p.px(x0 + Math.round((s / 34) ** 2 * 3), 60 - s, '#7a5a40');
    for (const dir of [-1, -0.5, 0.5, 1]) for (let k = 0; k < 10; k++) p.px(x0 + 3 + dir * k, 26 + Math.round(Math.abs(dir) * (k / 10) ** 2 * 6), r() < 0.5 ? '#3f8a3a' : '#5aa848');
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {                       // the glass wall's frame, the office around it
    if (y < 20 || y >= 62) p.px(x, y, y < 20 ? (y === 19 ? '#c8c6c0' : '#eeece6') : y < 80 ? (y === 62 ? '#c8c6c0' : '#f2f0ea') : ((x + (y % 2) * 9) % 18 === 0 ? '#b89a72' : '#c8aa82'));
    else if (x % 36 < 2) p.px(x, y, '#9a9a9c');                                    // mullions
  }
  for (let x = 0; x < W; x += 24) p.rect(x + 6, 6, 12, 2, '#fffbe8');              // ceiling lights
  const bx = hx - 70;                                                               // a whiteboard: an agent's loop
  if (bx > 0) {
    for (let y = 64; y < 78; y++) for (let x = bx; x < bx + 40; x++) p.px(x, y, x === bx || x === bx + 39 || y === 64 || y === 77 ? '#9a9690' : '#fafaf6');
    for (const [cx, cy] of [[bx + 8, 70], [bx + 20, 67], [bx + 32, 70], [bx + 20, 74]]) p.rect(cx - 2, cy - 1, 5, 3, '#3a5a8a');
    for (let k = 0; k < 8; k++) { p.px(bx + 11 + k, 69 - (k >> 2), '#a84a4a'); p.px(bx + 23 + k, 68 + (k >> 2), '#a84a4a'); }
  }
  const px = hx + 92;                                                               // a plant in a white pot
  if (px < W - 8) {
    p.rect(px, 80, 8, 9, '#e8e6e0');
    for (let n = 0; n < 40; n++) p.px(px + 4 + Math.round(Math.sin(n * 2.1) * 6 * (n / 40)), 79 - Math.floor(n / 2.5), n % 3 ? '#4f8a4a' : '#6aa860');
  }
  for (let y = 62; y < SEAT; y++) for (let x = hx; x <= hx + 2; x++) p.px(x, y, x === hx ? '#2e3036' : '#3c3e46');   // the office chair
  for (let x = hx; x <= hx + 17; x++) { p.px(x, SEAT, '#3c3e46'); p.px(x, SEAT + 1, '#2e3036'); }
  for (let y = SEAT + 2; y < 88; y++) p.px(hx + 9, y, '#5a5c62');
  for (let x = hx + 3; x <= hx + 15; x++) p.px(x, 88, '#2e3036');
  return p;
}

function desk(W, H, hx) {
  const p = new Painter(W, H);
  for (let x = hx + 13; x <= hx + 80; x++) { p.px(x, DESK_TOP, '#fafaf6'); p.px(x, DESK_TOP + 1, '#d8d6d0'); }   // a white desk on legs
  for (const x of [hx + 15, hx + 78]) for (let y = DESK_TOP + 2; y < FLOOR; y++) p.px(x, y, '#9a9a9c');
  for (const [mx, w] of [[hx + 26, 22], [hx + 50, 22]]) {                          // two monitors
    for (let y = 52; y < 69; y++) for (let x = mx; x < mx + w; x++) p.px(x, y, x === mx || x === mx + w - 1 || y === 52 || y === 68 ? '#2a2c32' : '#1e2a2e');
    p.rect(mx + w / 2 - 2, 69, 4, 3, '#2a2c32'); p.rect(mx + w / 2 - 5, 72, 10, 1, '#2a2c32');
  }
  for (let k = 0; k < 7; k++) p.rect(hx + 28 + (k % 3) * 2, 54 + k * 2, 6 + (k * 5) % 9, 1, ['#7ab89a', '#8aa8d8', '#d8d0a8'][k % 3]);   // code on the left screen
  p.rect(hx + 16, DESK_TOP - 1, 14, 1, '#4a4c54');                                 // the keyboard
  p.rect(hx + 74, DESK_TOP - 4, 3, 4, '#e8e4dc'); p.px(hx + 77, DESK_TOP - 3, '#e8e4dc');   // a mug
  return p;
}

export function buildOffice(W, H = 96) {
  const hx = Math.round(W * 0.34);
  return { W, H, hx, layers: { room: room(W, H, hx), desk: desk(W, H, hx) } };
}

// A candlestick chart in a box: n candles of CLOSES, green up, red down, scaled to fit h px.
function chart(ctx, x0, y0, w, h, n) {
  const lo = Math.min(...CLOSES), hi = Math.max(...CLOSES), Y = (v) => Math.round(y0 + h - 1 - (v - lo) * (h - 1) / (hi - lo));
  const step = Math.floor(w / CANDLES);
  for (let i = 0; i < n; i++) {
    const open = CLOSES[i], close = CLOSES[i + 1], up = close >= open, x = x0 + i * step;
    ctx.fillStyle = up ? '#3ac46a' : '#e84a4a';
    ctx.fillRect(x + 1, Y(Math.max(open, close)) - 1, 1, Math.abs(Y(open) - Y(close)) + 3);   // the wick
    ctx.fillRect(x, Math.min(Y(open), Y(close)), 3, Math.max(1, Math.abs(Y(open) - Y(close))));
  }
}

export function renderOffice(ctx, t, s, env) {
  const { W, H, canvases: c, hx } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.room, 0, 0);
  const dog = env.dog('houndstooth', 'sleep');                                     // the dog asleep under the desk
  ctx.drawImage(dog.canvases[Math.floor(t * 2) % 2], hx + 44, 89 - dog.footY);
  const hero = env.hero('work', 'type'), f = Math.floor(t * 8) % 2;
  const x = hx - hero.anchorX, y = SEAT - 1 - hero.seatY;
  ctx.drawImage(hero.canvases[f], x, y);
  ctx.drawImage(c.desk, 0, 0);
  chart(ctx, hx + 52, 54, 18, 13, candlesAt(t));                                    // the right monitor follows the market too
  const [px, py] = hero.hands[f];                                                   // the phone in Yimeng's hand
  ctx.fillStyle = '#1a1c22'; ctx.fillRect(x + px - 1, y + py - 6, 5, 8);
  ctx.fillStyle = '#2a3a44'; ctx.fillRect(x + px, y + py - 5, 3, 5);
  ctx.fillStyle = '#3ac46a'; ctx.fillRect(x + px, y + py - 3, 1, 1); ctx.fillRect(x + px + 1, y + py - 4, 1, 1); ctx.fillRect(x + px + 2, y + py - 5, 1, 1);
  const bx = x + px + 8, by = 18, bw = 50, bh = 30;                                 // the phone's screen, blown up in a bubble
  ctx.fillStyle = '#f4f1ea'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
  ctx.fillStyle = '#141a22'; ctx.fillRect(bx, by, bw, bh);
  for (let k = 0; k < 6; k++) { ctx.fillStyle = '#f4f1ea'; ctx.fillRect(Math.round(bx + 4 - k * 1.2), by + bh + 1 + k, 2, 1); }   // its tail, down to the phone
  ctx.fillStyle = '#26303a'; for (let k = 1; k < 4; k++) ctx.fillRect(bx + 2, by + 2 + k * 6, bw - 4, 1);   // grid lines
  chart(ctx, bx + 3, by + 3, bw - 6, bh - 6, candlesAt(t));
}

export const office = { build: buildOffice, render: renderOffice };
```

- [ ] **Step 4: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 175`, `ℹ fail 0`, then 16 `ok` lines and exit 0.

- [ ] **Step 5: Commit**

```bash
git add reel/ch4/office.js tests/reel/ch4-office.test.js
git commit -m "feat(reel): Add the California office, a stock chart climbing on the phone"
```

---

### Task 5: The ranch

**Files:**
- Create: `reel/ch4/ranch.js`
- Test: `tests/reel/ch4-ranch.test.js` (new)

**Interfaces:**
- Consumes: the `aim` pose (Task 1); the hero's `hunt` outfit in the `type` (riding) and `walk` poses; the dog's `blaze` coat; `Painter`, `rng`; `gradient`, `ridge`, `tile`, `art`.
- Produces: `runAt(t)`, how far the camera has run along the track, in px. It runs at 70 px/s, brakes from 1.1 s and stops at 1.5 s.
- Produces: `beatAt(t)`, one of:

  | Beat | From (s) | To (s) |
  |---|---|---|
  | `'chase'` | 0 | 1.5 |
  | `'stop'` | 1.5 | 1.6 |
  | `'off'` | 1.6 | 1.8 |
  | `'aim'` | 1.8 | 2.2 |
  | `'scope'` | 2.2 | end |

- Produces: `ranch`, a scene with layers `sky`, `far`, `mid` and `near`, the last three twice the screen wide for tiling. It exposes `hx = round(0.3 W)`, `TW`, `ridge` (the mid hills' height by x) and `herd`.
  - In the scope beat it draws only the scope: the doe, in profile until 2.5 s, then looking straight back.

- [ ] **Step 1: Write the failing test.** Create `tests/reel/ch4-ranch.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { ranch, runAt, beatAt } from '../../reel/ch4/ranch.js';

sceneContract('ch4 ranch', ranch, 3);

test('ranch: the chase runs at full speed, brakes, and stops for good', () => {
  assert.equal(runAt(0.5), 35);
  assert.ok(runAt(1.4) - runAt(1.3) < runAt(0.6) - runAt(0.5), 'braking');
  assert.equal(runAt(1.5), runAt(3));
});

test('ranch: the beats: the chase, the stop, off the ATV, the rifle raised, then the scope', () => {
  assert.deepEqual([0.5, 1.55, 1.7, 2, 2.6].map(beatAt), ['chase', 'stop', 'off', 'aim', 'scope']);
});

const names = (t) => frameAt(ranch, 480, t).ctx.calls.filter(c => c[0] === 'drawImage').map(c => c[1]);

test('ranch: Yimeng rides with the dog in its blaze vest on the rack, and aims only on foot', () => {
  const chase = names(0.5), aim = names(2);
  assert.ok(chase.includes('hunt:type:0'), 'riding the ATV');
  assert.ok(chase.some(n => /^dog:blaze:\d$/.test(n)));
  assert.ok(!chase.some(n => n.startsWith('hunt:aim')), 'never aiming from the vehicle');
  assert.ok(!aim.includes('hunt:type:0'), 'off the ATV');
  assert.ok(aim.some(n => /^hunt:aim:\d$/.test(n)));
  assert.ok(aim.some(n => /^dog:blaze:\d$/.test(n)), 'the dog waits on the rack');
});

test('ranch: the scope shows only the deer, its shoulder in the crosshairs', () => {
  const { ctx } = frameAt(ranch, 480, 2.6), drawn = ctx.calls.filter(c => c[0] === 'drawImage');
  assert.deepEqual(drawn.map(c => c[1]), ['art']);
  assert.ok(Math.abs(drawn[0][2] + 20 - 240) <= 2);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/reel/ch4-ranch.test.js`
Expected: the file fails to load (`Cannot find module …/reel/ch4/ranch.js`).

- [ ] **Step 3: Implement.** Create `reel/ch4/ranch.js`:

```js
// Chapter 4, shot 3: a ranch in the golden hills. On the ATV, the dog on the rack behind, Yimeng runs
// the dirt track by a split-rail fence while a herd of black-tailed deer bounds along the hillside
// above: parallax makes it a chase, though the ATV never leaves the track. It stops; Yimeng gets
// off and raises the rifle. Then the scope: the deer in the crosshairs looks back, and the scene
// cuts away. No shot is fired. (Never from the vehicle: California forbids it.)
import { Painter, rng } from '../pixels.js';
import { gradient, ridge, tile, art } from '../kit.js';

const GROUND = 88;                           // the track's row, under the ATV's tyres and Yimeng's shoes
const V = 70;                                // the chase, px/s at the track
const STOP = [1.1, 1.5], DISMOUNT = 1.6, AIM = 1.8, SCOPE = 2.2;
const DEER = 5;

// How far the camera has run along the track: full speed, then braking to a stop.
export function runAt(t) {
  const [a, b] = STOP, u = Math.min(Math.max(t, a), b) - a;
  return V * Math.min(t, a) + V * (u - (u * u) / (2 * (b - a)));
}
// What is on screen: the chase, the stop, Yimeng off and aiming, then the scope.
export const beatAt = (t) => (t < STOP[1] ? 'chase' : t < DISMOUNT ? 'stop' : t < AIM ? 'off' : t < SCOPE ? 'aim' : 'scope');

// The ATV from the side, facing right: a long rear rack for the dog, the seat, handlebars, front rack.
const ATV = art(`
.............................KK.......
............................K..K......
.KKKKKKKKKKKKKK..............KK.KKKK..
RRRRRRRRRRRRRRRR............RRRRRRRR..
RrrrrrrrrrrrrrRRBBBBBBBBBBBRRrrrrrrRRy
RRRRRRRRRRRRRRRRBBBBBBBBBBBRRRRRRRRRRy
.rrrrrrrrrrKKKKKKKKKKKKKKKKKKrrrrrrrr.
...........KKKKKKKKKKKKKKKKKK.........
............KK............KK..........
`, { K: '#22242a', R: '#c8402e', r: '#962e22', B: '#1a1a1e', y: '#f4f1d0' }, '#141418');
const TYRES = [8, 30], TYRE_R = 5;

const DEER_PAL = { a: '#6a4a30', e: '#7a5232', B: '#a8784a', b: '#7a5232', N: '#1a1210', w: '#f4eee2', k: '#1a1210' };
const DEER_RUN = [`
.................a.a..
................a.a...
...............ee.....
..............eBBe....
.............BBBBBN...
............BBBB......
.wkBBBBBBBBBBBB.......
wwBBBBBBBBBBBBb.......
.wBBBBBBBBBBBb........
..b...........b.......
.b.............b......
b...............b.....
`, `
.................a.a..
................a.a...
...............ee.....
..............eBBe....
.............BBBBBN...
............BBBB......
.wkBBBBBBBBBBBB.......
wwBBBBBBBBBBBBb.......
.wBBBBBBBBBBBb........
....b......b..........
....b......b..........
....b......b..........
`].map(rows => art(rows, DEER_PAL, '#3a2618'));
const DOE_RUN = DEER_RUN.map(a => ({ ...a, rows: a.rows.map((r, y) => (y < 2 ? r.replace(/a/g, '.') : r)) }));   // no antlers

// The doe in the scope, broadside: head up in profile, then turned to look straight back.
const DEER_BODY = `
...bbbbbbbbbbbbbbbbbBBBBB......
..BBBBBBBBBBBBBBBBBBBBBBB......
.wBBBBBBBBBBBBBBBBBBBBBBB......
wwBBBBBBBBBBBBBBBBBBBBBB.......
.wBBBBBBBBBBBBBBBBBBBBBB.......
..BBBBBBLLLLLLLLLLLBBBBB.......
...BBBB...........BBBB.........
...bb.b...........b.bb.........
...b..b...........b..b.........
...b..b...........b..b.........
...b..b...........b..b.........
...N..N...........N..N.........`;
const DEER_FACE = [`
......................e.e......
.....................eEeEe.....
......................eBBBB....
......................BBKBBB...
.......................BBBBBBN.
.......................BBBww...
......................BBBB.....
.....................BBBBw.....
....................BBBBBw.....` + DEER_BODY, `
..................ee.....ee....
..................eEe...eEe....
...................eeBBBee.....
.....................BBB.......
....................BKBKB......
....................BBBBB......
.....................BBB.......
.....................BNB.......
.....................www.......` + DEER_BODY].map(rows => art(rows, { e: '#6a4a30', E: '#d8a890', B: '#a8784a', b: '#8a6038', L: '#c8a070', K: '#140c08', N: '#1a1210', w: '#f4eee2' }, '#3a2618'));

function hills(TW, base, h, cols, seed) {
  const p = new Painter(TW, 96), r = rng(seed), line = ridge(TW, h, [[h * 0.35, 2, seed], [h * 0.18, 5, seed * 2]]);
  for (let x = 0; x < TW; x++) for (let j = 0; j < line[x] + (96 - base); j++) {
    const y = base - Math.round(line[x]) + j;
    p.px(x, y, j === 0 ? cols[0] : (x * 3 + y * 7) % 17 === 0 ? cols[2] : cols[1]);
  }
  for (let n = 0; n < TW / 30; n++) {                                               // oaks: dark round crowns on the gold
    const x = Math.floor(r() * TW), y = base - Math.round(line[x]) + 2, rad = 3 + Math.floor(r() * 3);
    for (let j = -rad; j <= rad; j++) for (let i = -rad - 2; i <= rad + 2; i++) if (i * i * 0.6 + j * j < rad * rad) p.wpx(x + i, y - rad + j, j < -1 ? '#5e7a3e' : '#4a6232');
    for (let j = 0; j < 3; j++) p.wpx(x, y + j, '#4a3a28');
  }
  return { p, line };
}

export function buildRanch(W, H = 96) {
  const TW = W * 2, layers = { sky: gradient(W, H, [['#5a9ad8', 0], ['#86b6e2', 0.35], ['#c8dcea', 0.62], ['#f2e2b8', 0.8]]) };
  layers.far = hills(TW, 62, 10, ['#e8cc7a', '#dcbc66', '#c8a856'], 3).p;
  const mid = hills(TW, 74, 14, ['#f0d27a', '#e2bc5c', '#cfa64a'], 7);
  layers.mid = mid.p;
  const near = new Painter(TW, H), r = rng(11);
  for (let y = 78; y < H; y++) for (let x = 0; x < TW; x++) {                       // dry grass, then the dirt track
    let c = y < 84 ? ((x * 5 + y) % 7 === 0 ? '#c8a04a' : '#d8b25a') : y < 93 ? ((x + y * 3) % 11 === 0 ? '#b8946a' : '#c8a47a') : '#b08a5a';
    if (y === 84) c = '#a8865a';
    near.px(x, y, c);
  }
  for (let x = 0; x < TW; x += 18) {                                                // the split-rail fence
    for (let y = 70; y < 84; y++) { near.px(x, y, '#6a4a30'); near.px(x + 1, y, '#5a3e28'); }
    for (const ry of [72, 77]) for (let k = 0; k < 18; k++) near.wpx(x + k, ry + Math.round(Math.sin(k / 18 * Math.PI) * 0.6), '#7a5a3a');
  }
  for (let n = 0; n < TW / 6; n++) near.wpx(Math.floor(r() * TW), 83 - Math.floor(r() * 4), '#e8c870');   // seed heads
  layers.near = near;
  // the herd on the hill, a buck in the lead; on a phone it closes up and runs ahead of the rider
  const hx = Math.round(W * 0.3), gap = Math.min(19, Math.floor((W - hx - 50) / DEER));
  const lead = Math.min(W - 42, Math.max(Math.round(W * 0.62), hx + 26 + (DEER - 1) * gap));
  const rd = rng(5), herd = Array.from({ length: DEER }, (_, i) => ({ x: lead - i * gap + Math.floor(rd() * 6), ph: rd() * 6 }));
  return { W, H, TW, hx, ridge: mid.line, herd, layers };
}

function rifle(ctx, x, y, hand) {
  // stock at the shoulder, through the hand, the barrel raised a little towards the hillside
  const [hx, hy] = hand, x0 = x + hx - 6, y0 = y + hy - 1, x1 = x + hx + 22, y1 = y + hy - 5;
  ctx.fillStyle = '#2a1e16';
  for (let k = 0; k <= 28; k++) ctx.fillRect(Math.round(x0 + (x1 - x0) * k / 28), Math.round(y0 + (y1 - y0) * k / 28), 1, k < 7 ? 2 : 1);
  ctx.fillStyle = '#1a1a1e'; ctx.fillRect(x + hx + 4, y + hy - 4, 7, 2);              // the scope
}

function scope(ctx, t, s, env) {
  const { W, H } = s, cx = Math.round(W / 2), cy = 48, R = 36;
  ctx.fillStyle = '#060606'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.beginPath();
  for (let y = cy - R; y <= cy + R; y++) { const w = Math.sqrt(Math.max(0, R * R - (y - cy) * (y - cy))); ctx.rect(Math.round(cx - w), y, Math.round(2 * w), 1); }
  ctx.clip();
  const sway = Math.round(Math.sin(t * 3) * 1.5);
  ctx.fillStyle = '#e2bc5c'; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);            // the hillside, close
  ctx.fillStyle = '#8ab4dc'; ctx.fillRect(cx - R, cy - R, R * 2, 18);
  const deer = env.art(DEER_FACE[t > SCOPE + 0.3 ? 1 : 0]);                          // the crosshairs on its shoulder; it looks back
  ctx.drawImage(deer, cx - 20 + sway, cy - 11);
  ctx.fillStyle = '#c09a44';                                                         // grass in front of its hooves
  for (let k = 0; k < 36; k++) ctx.fillRect(cx - R + 2 * k + (k % 2), cy + 8 - (k * 7) % 3, 1, 3 + (k * 5) % 3);
  ctx.restore();
  ctx.fillStyle = '#060606';                                                         // crosshairs and the scope's rim
  ctx.fillRect(cx - R, cy, R * 2, 1); ctx.fillRect(cx, cy - R, 1, R * 2);
  ctx.fillRect(cx - R, cy - 1, 10, 3); ctx.fillRect(cx + R - 10, cy - 1, 10, 3); ctx.fillRect(cx - 1, cy + R - 10, 3, 10);
  ctx.fillStyle = '#2a2a2e';
  for (let a = 0; a < Math.PI * 2; a += 0.02) ctx.fillRect(Math.round(cx + Math.cos(a) * R), Math.round(cy + Math.sin(a) * R), 1, 1);
}

export function renderRanch(ctx, t, s, env) {
  const { W, H, canvases: c, hx } = s, beat = beatAt(t);
  if (beat === 'scope') { scope(ctx, t, s, env); return; }
  const run = runAt(t);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  tile(ctx, c.far, run * 0.15, 0);
  tile(ctx, c.mid, run * 0.4, 0);
  // the herd bounds along the hillside, keeping pace, then stops and stands
  const running = t < STOP[1] + 0.15, midOff = run * 0.4;
  s.herd.forEach((d, i) => {
    const x = d.x + (running ? t * 9 : (STOP[1] + 0.15) * 9), wx = ((Math.round(x + midOff) % s.TW) + s.TW) % s.TW;
    const top = 74 - Math.round(s.ridge[wx]), bob = running ? Math.round(Math.abs(Math.sin(t * 9 + d.ph)) * -3) : 0;
    const deer = env.art((i === 0 ? DEER_RUN : DOE_RUN)[running ? Math.floor(t * 8 + i) % 2 : 1]);   // a buck leads the does
    ctx.drawImage(deer, Math.round(x), top - deer.height + 2 + bob);
  });
  tile(ctx, c.near, run, 0);
  const atv = env.art(ATV), ax = hx - 10, ay = GROUND - atv.height - 2, jolt = beat === 'chase' ? Math.floor(t * 12) % 2 : 0;
  const dog = env.dog('blaze');                                                     // the dog rides the rack behind the seat
  if (beat === 'chase' || beat === 'stop') {
    const rider = env.hero('hunt', 'type');
    ctx.drawImage(rider.canvases[0], ax + 14 - rider.anchorX, ay - rider.seatY + 4 - jolt);
  }
  ctx.drawImage(dog.canvases[beat === 'chase' ? Math.floor(t * 9) % 4 : 0], ax - 7, ay - dog.footY + 4 - jolt);
  ctx.drawImage(atv, ax, ay - jolt);
  for (const tx of TYRES) {                                                         // knobbly tyres, the tread turning
    const wx = ax + tx + 1, wy = GROUND - TYRE_R;
    for (let j = -TYRE_R; j <= TYRE_R; j++) for (let i = -TYRE_R; i <= TYRE_R; i++) {
      const d = Math.hypot(i, j);
      if (d > TYRE_R + 0.3) continue;
      const knob = d > TYRE_R - 1.2 && (Math.round(Math.atan2(j, i) * 4 + run * 0.4) % 2 === 0);
      ctx.fillStyle = d < 2 ? '#8a8e96' : knob ? '#2e3036' : '#16161a'; ctx.fillRect(wx + i, wy + j, 1, 1);
    }
  }
  if (beat === 'chase' || beat === 'stop') {                                       // dust kicked up behind
    ctx.fillStyle = 'rgba(214, 186, 136, 0.55)';
    for (let k = 0; k < 6; k++) { const age = (t * 3 + k / 6) % 1; ctx.fillRect(Math.round(ax - 6 - age * 30), Math.round(GROUND - 4 - age * 8), 4 + Math.round(age * 8), 3); }
  }
  if (beat === 'off' || beat === 'aim') {                                           // off the ATV, on foot, the rifle raised
    const hero = env.hero('hunt', beat === 'aim' ? 'aim' : 'walk'), x = hx + 38 - hero.anchorX, y = GROUND - hero.footY;
    const f = beat === 'aim' ? Math.floor(t * 3) % 2 : 1;
    ctx.drawImage(hero.canvases[f], x, y);
    if (beat === 'aim') rifle(ctx, x, y, hero.hands[f]);
  }
}

export const ranch = { build: buildRanch, render: renderRanch };
```

- [ ] **Step 4: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 181`, `ℹ fail 0`, then 16 `ok` lines and exit 0.

- [ ] **Step 5: Commit**

```bash
git add reel/ch4/ranch.js tests/reel/ch4-ranch.test.js
git commit -m "feat(reel): Add the ranch: the ATV chase, the rifle raised, the deer looking back"
```

---

### Task 6: Chapter 4 in the reel

**Files:**
- Create: `reel/ch4/index.js`
- Modify: `reel/story.js`, `docs/superpowers/specs/2026-10-03-life-reel-design.md`
- Test: `tests/reel/ch4-chapter.test.js` (new)

**Interfaces:**
- Consumes: `arrive`, `office` and `ranch` (Tasks 3–5).
- Produces: `CHAPTER_4 = { name: 'California', shots }`, with three shots:

  | Id | Duration (s) | Fade in (s) | Fade out (s) |
  |---|---|---|---|
  | `ch4-arrive` | 1.8 | none | none |
  | `ch4-office` | 1.6 | 0.15 | 0.15 |
  | `ch4-ranch` | 3 | 0.15 | none |

  All are captioned `California`.

- [ ] **Step 1: Write the failing test.** Create `tests/reel/ch4-chapter.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTER_4 } from '../../reel/ch4/index.js';

test('chapter 4 so far: the arrival, the office and the ranch, 6.4 s', () => {
  assert.equal(CHAPTER_4.name, 'California');
  assert.deepEqual(CHAPTER_4.shots.map(s => s.id), ['ch4-arrive', 'ch4-office', 'ch4-ranch']);
  assert.ok(CHAPTER_4.shots.every(s => s.caption === 'California'));
  assert.equal(Math.round(CHAPTER_4.shots.reduce((a, s) => a + s.duration, 0) * 10) / 10, 6.4);
  assert.ok(!CHAPTER_4.shots[0].fadeIn, 'it opens straight from the map, in full colour');
  assert.ok(!CHAPTER_4.shots.at(-1).fadeOut, 'and the scope hard-cuts away');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/reel/ch4-chapter.test.js`
Expected: the file fails to load (`Cannot find module …/reel/ch4/index.js`).

- [ ] **Step 3: Implement.** Create `reel/ch4/index.js`:

```js
// Chapter 4: California, in full colour.
import { arrive } from './arrive.js';
import { office } from './office.js';
import { ranch } from './ranch.js';

export const CHAPTER_4 = {
  name: 'California',
  shots: [
    { id: 'ch4-arrive', scene: arrive, caption: 'California', duration: 1.8 },
    { id: 'ch4-office', scene: office, caption: 'California', duration: 1.6, fadeIn: 0.15, fadeOut: 0.15 },
    { id: 'ch4-ranch', scene: ranch, caption: 'California', duration: 3, fadeIn: 0.15 },
  ],
};
```

Then apply to `reel/story.js`:

`reel/story.js`, change 1. Find:

```js
import { CHAPTER_3 } from './ch3/index.js';
```

Replace with:

```js
import { CHAPTER_3 } from './ch3/index.js';
import { CHAPTER_4 } from './ch4/index.js';
```

`reel/story.js`, change 2. Find:

```js
  { name: 'California', shots: [standIn('ch4-california', 'California', 8)] },
```

Replace with:

```js
  CHAPTER_4,
```

- [ ] **Step 4: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 182`, `ℹ fail 0`, then 16 `ok` lines and exit 0.

- [ ] **Step 5: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 47.5,48.6,49.4,50.4,51.2,52.3,52.6,52.95,53.45 && python3 tests/reel/sheet.py /tmp/f /tmp/f-ca.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 48.6,50.3,51.2,52.7,53.45 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-ca.png 3
```

Expected:
- 47.5 s: a bright palm-lined street of white stucco and red tile, golden hills behind. The silver-grey GLC rolls in from the left, wheels turning, kicking up a little dust.
- 48.6 s: the car stands in the middle of the street. Through the tinted window, Yimeng sits in the passenger seat, and the dog stands at the wheel in its houndstooth, ears pricked.
- 49.4 s and 50.4 s: the office. Palms and hills are outside the glass wall. Yimeng, in the purple hoodie, sits at a white desk with two monitors, holding the phone. A bubble above shows its candlestick chart, a few candles at 49.4 s and climbing, red dip included, at 50.4 s, and the right monitor shows the same chart. The dog sleeps under the desk.
- 51.2 s: the ranch. The red ATV runs the dirt track by a split-rail fence, the dog in its blaze vest on the rear rack, dust behind. Deer bound along the golden hillside above, a buck leading.
- 52.3 s: stopped. Yimeng stands beside the ATV.
- 52.6 s: Yimeng raises the rifle towards the hill, and the herd has stopped.
- 52.95 s: the scope, black all round: the doe broadside in the crosshairs, head in profile.
- 53.45 s: the doe has turned its head and looks straight back.
- On the phone: the car fills most of the street but stops in full view, the office desk and bubble fit, and the ATV, the dog, Yimeng and the herd all fit.

- [ ] **Step 6: Update the spec.** Apply to `docs/superpowers/specs/2026-10-03-life-reel-design.md`:

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 1. Find:

```markdown
1. A car rolls in with the dog standing at the steering wheel, as in the hero photo above.
2. Office, with a stock chart on the phone.
3. Ranch: golden hills, oaks and fences. An ATV kicks up dust on the ranch track in the foreground while a herd of deer runs along the hills in the background. Parallax makes it read as a chase, but the ATV never leaves the track. Yimeng stops, gets off and raises the rifle. Cut to the scope view, the deer looks back, and the scene hard-cuts away. No shot is fired. (Yimeng never aims from the vehicle: California forbids shooting from vehicles and herding game with them.)
```

Replace with:

```markdown
1. Yimeng's silver-grey Mercedes-AMG GLC 63 rolls along a palm-lined street of white stucco and red tile, golden hills behind, and stops. Through the window, the dog stands at the steering wheel in its houndstooth turtleneck, as in the hero photo above, with Yimeng in the passenger seat.
2. The office: a bright open-plan floor with California through the glass wall. Yimeng, in the purple hoodie, works at a desk with two monitors and a phone in hand. A bubble blows up the phone's screen, where a candlestick chart climbs candle by candle, and the second monitor shows it too. The dog naps under the desk.
3. Ranch: golden hills, oaks and fences. An ATV kicks up dust on the ranch track in the foreground, the dog in its blaze vest on the rear rack, while a herd of deer, a buck leading the does, runs along the hills in the background. Parallax makes it read as a chase, but the ATV never leaves the track. Yimeng stops, gets off and raises the rifle. Cut to the scope view: the doe in the crosshairs turns its head and looks straight back, and the scene hard-cuts away. No shot is fired. (Yimeng never aims from the vehicle: California forbids shooting from vehicles and herding game with them.)
```

- [ ] **Step 7: Commit**

```bash
git add reel/ch4/index.js reel/story.js tests/reel/ch4-chapter.test.js docs/superpowers/specs/2026-10-03-life-reel-design.md
git commit -m "feat(reel): Open chapter 4 on California: the arrival, the office, the ranch"
```

- [ ] **Step 8: Hand over for review.** Give the user these links, plus `http://127.0.0.1:8000/` with the `03` and `04` buttons, then stop. The coast (Phase 5b) waits for their approval.
  - `http://127.0.0.1:8000/?reel=ch3-roadtrip`
  - `http://127.0.0.1:8000/?reel=ch4-arrive`
  - `http://127.0.0.1:8000/?reel=ch4-office`
  - `http://127.0.0.1:8000/?reel=ch4-ranch`
