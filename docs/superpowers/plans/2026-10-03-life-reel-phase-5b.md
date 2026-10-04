# Life Reel — Phase 5b (The Coast) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply Yimeng's review of Phase 5a and finish chapter 4.
- The road trip is no longer grey round the East. The colour floods out from East Lansing as the car sets off, so the whole trip is in colour.
- Chapter 4 gets its second batch, the coast:
  - mushrooms under the oaks
  - fishing from the rocks
  - the tide pools
  - scuba in a kelp forest
  - freediving and spearfishing
  - surfacing at sunset, where the dog waits on the rocks

**Architecture:**
- The cast gains two poses:
  - `swim` for Yimeng: the standing rig's body turned a quarter clockwise, the head kept upright in front, fins added from the shoes.
  - `wait` for the dog: standing, with a wagging tail.
- Each coast shot is one module in `reel/ch4/`. The two dives share their water, kelp, reef and light painters through a new `reel/ch4/sea.js`.
- `reel/ch4/index.js` lists all nine shots once they are built.

**Tech Stack:** Vanilla JS (ES modules, Canvas 2D), Node 25 `node:test`, headless Chrome review tools from Phase 2.

**Spec:** `docs/superpowers/specs/2026-10-03-life-reel-design.md`: chapter 3 shot 4, the cast notes, and chapter 4 shots 4–8. Tasks 1, 2, 3 and 10 update it. **Builds on:** `docs/superpowers/plans/2026-10-03-life-reel-phase-5a.md`.

## Global Constraints

- Everything in the earlier plans' Global Constraints still holds:
  - native widths 195, 480 and 640 must all read well
  - branch `life-reel`; no merge, no push
- The road trip keeps its route, timing and caption. Only its colour changes:
  - the map comes up grey
  - the colour floods out from East Lansing between 0.15 s and 0.95 s
  - the map is all colour before the car reaches the coast
- Chapter 4's coast follows the spec's outfits:

  | Shot | Yimeng | The dog |
  |---|---|---|
  | Mushrooms | `forage` (olive top, rust beanie, basket) | `hikepack` |
  | Fishing | `fish` (bucket hat, vest, rod) | `lifevest` |
  | Tide pools | `tide` (bib waders, boots, bucket) | `lifevest` |
  | Scuba | `scuba` (black wetsuit, tank, mask, fins) | not there |
  | Freediving | `freedive` (kelp camo, long fins, snorkel, speargun) | not there |
  | Sunset | `freedive` | `lifevest` |

- The spear is fired, but the scene cuts before it reaches the fish, at every width. The sunset then shows the catch on the spear.
- Every shot is captioned `California`. Chapter 4 runs 16.9 s:

  | Shot | Duration (s) | Fade in (s) | Fade out (s) |
  |---|---|---|---|
  | `ch4-arrive` | 1.8 | none | none |
  | `ch4-office` | 1.6 | 0.15 | 0.15 |
  | `ch4-ranch` | 3 | 0.15 | none |
  | `ch4-forest` | 1.8 | none | 0.15 |
  | `ch4-fishing` | 1.9 | 0.15 | 0.15 |
  | `ch4-tide` | 1.9 | 0.15 | 0.15 |
  | `ch4-scuba` | 1.4 | 0.15 | 0.15 |
  | `ch4-freedive` | 1.5 | 0.15 | none |
  | `ch4-sunset` | 2 | none | 0.3 |

  The scope cuts hard to the forest, and the spear cuts hard to the sunset.
- The timeline after this phase:

  | Shot | Start (s) | End (s) |
  |---|---|---|
  | Chapter 4 | 47.2 | 64.1 |
  | Mushrooms | 53.6 | 55.4 |
  | Fishing | 55.4 | 57.3 |
  | Tide pools | 57.3 | 59.2 |
  | Scuba | 59.2 | 60.6 |
  | Freediving | 60.6 | 62.1 |
  | Sunset | 62.1 | 64.1 |
  | Chapter 5 | 64.1 | 68.1 |

- The `To be continued` page check moves from 56 s to 66 s in Task 10, when chapter 4 grows. Until then it stays at 56 s.

## How to run things

- Unit tests: `node --test 'tests/reel/*.test.js'`. Page checks: `tests/reel/page-check.sh`.
- Frame review: keep `python3 -m http.server 8000 --bind 127.0.0.1` running from the repo root. Then run `node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times …` and `python3 tests/reel/sheet.py /tmp/f /tmp/f.png 2`.

---

### Task 1: The road trip in colour

**Files:**
- Modify: `reel/ch3/roadtrip.js`, `docs/superpowers/specs/2026-10-03-life-reel-design.md`
- Test: `tests/reel/ch3-roadtrip.test.js`

**Interfaces:**
- Produces: `floodAt(t)`, the radius in map pixels of the colour round East Lansing.
  - It is 0 until 0.15 s.
  - It then grows as `u^1.6 × 0.7 × MAP_W` while `u` runs from 0 to 1 over 0.15–0.95 s.
  - It is 2000 from 0.95 s, past every corner of the map.
- `tripAt(t)` keeps `{ leg, x, y, dir }`, and loses `colour`.
- The render draws:
  - the `grey` layer alone before the flood
  - the `grey` layer with the `colour` layer clipped over it while the colour floods
  - the `colour` layer alone once the flood is done

- [ ] **Step 1: Write the failing tests.** Apply to `tests/reel/ch3-roadtrip.test.js`:

`tests/reel/ch3-roadtrip.test.js`, change 1. Find:

```js
import { roadtrip, tripAt, toMap, LEGS } from '../../reel/ch3/roadtrip.js';
```

Replace with:

```js
import { roadtrip, tripAt, floodAt, toMap, LEGS } from '../../reel/ch3/roadtrip.js';
```

`tests/reel/ch3-roadtrip.test.js`, change 2. Find:

```js
test('road trip: the East loop stays grey; once the car turns west the colour spreads out from it until the map is all colour', () => {
  assert.equal(tripAt(LEGS.east[1]).colour, 0);
  assert.equal(tripAt(LEGS.west[0]).colour, 0);
  const r = [3, 3.6, 4.2].map(t => tripAt(t).colour);
```

Replace with:

```js
test('road trip: the map comes up grey, and as the car sets off the colour floods out from East Lansing, ahead of it', () => {
  assert.equal(floodAt(0.1), 0);
  const r = [0.3, 0.5, 0.7].map(floodAt);
```

`tests/reel/ch3-roadtrip.test.js`, change 3. Find:

```js
  assert.ok(tripAt(4.8).colour > 2000, 'all colour once it has arrived');
```

Replace with:

```js
  for (const place of [[-70.26, 43.66], [-74.0, 40.71]]) {
    const [x, y] = toMap(place), [hx, hy] = toMap([-84.48, 42.73]);
    assert.ok(floodAt(passes('east', place).t) > Math.hypot(x - hx, y - hy), 'Maine and New York are in colour before the car gets there');
  }
  assert.ok(floodAt(1) >= 2000, 'and then the whole map');
```

`tests/reel/ch3-roadtrip.test.js`, change 4. Find:

```js
test('road trip: the grey map alone on the East loop, the colour map over it once the car turns west', () => {
  const east = frameAt(roadtrip, 480, 1.5).ctx, west = frameAt(roadtrip, 480, 3.5).ctx;
  assert.deepEqual([east.draws('grey').length, east.draws('colour').length], [1, 0]);
  assert.deepEqual([west.draws('grey').length, west.draws('colour').length], [1, 1]);
```

Replace with:

```js
test('road trip: the grey map alone at first, the colour clipped over it while it floods, then the colour alone', () => {
  const layers = (t) => { const c = frameAt(roadtrip, 480, t).ctx; return [c.draws('grey').length, c.draws('colour').length]; };
  assert.deepEqual(layers(0.1), [1, 0]);
  assert.deepEqual(layers(0.5), [1, 1]);
  assert.deepEqual(layers(3.5), [0, 1]);
```

`tests/reel/ch3-roadtrip.test.js`, change 5. Find:

```js
  const mapX = (W, t) => frameAt(roadtrip, W, t).ctx.draws('grey')[0][0];
  assert.equal(mapX(480, 0.5), mapX(480, 4.5));
  assert.ok(mapX(195, 4.5) > mapX(195, 0.5), 'the map slides right as the car drives west');
```

Replace with:

```js
  const mapX = (W, t) => frameAt(roadtrip, W, t).ctx.draws('colour')[0][0];
  assert.equal(mapX(480, 1.5), mapX(480, 4.5));
  assert.ok(mapX(195, 4.5) > mapX(195, 1.5), 'the map slides right as the car drives west');
```

- [ ] **Step 2: Run them to verify they fail**

Run: `node --test tests/reel/ch3-roadtrip.test.js`
Expected: the file fails to load (`does not provide an export named 'floodAt'`).

- [ ] **Step 3: Implement.** Apply to `reel/ch3/roadtrip.js`:

`reel/ch3/roadtrip.js`, change 1. Find:

```js
// Chapter 3, shot 4: the Graduation Road Trip, on a map. From East Lansing the car loops round the
// East: through Ontario to Niagara, across New York to Vermont and the Maine coast, down by Boston,
// New York and Washington to the Carolinas, and home through Tennessee, Kentucky and Ohio, all in
// Michigan's grey. Then it turns west, by Chicago, Kansas City, Denver and the Rockies, Utah and
// Las Vegas, to Santa Clara, and the colour spreads out from the car until the map is all colour.
```

Replace with:

```js
// Chapter 3, shot 4: the Graduation Road Trip, on a map. The map comes up in Michigan's grey, and as
// the car sets off the colour floods out from East Lansing, as through the door in The Wizard of Oz.
// From there the car loops round the East: through Ontario to Niagara, across New York to Vermont
// and the Maine coast, down by Boston, New York and Washington to the Carolinas, and home through
// Tennessee, Kentucky and Ohio. Then it turns west, by Chicago, Kansas City, Denver and the Rockies,
// Utah and Las Vegas, to Santa Clara.
```

`reel/ch3/roadtrip.js`, change 2. Find:

```js
export const LEGS = { east: [0.15, 2.45], west: [2.55, 4.6] };       // when the car drives each loop
```

Replace with:

```js
export const LEGS = { east: [0.15, 2.45], west: [2.55, 4.6] };       // when the car drives each loop
const FLOOD = [0.15, 0.95];                                           // the colour floods out as the car sets off
```

`reel/ch3/roadtrip.js`, change 3. Find:

```js
// Where the car is at time t, on which leg, and how far the colour has spread (0 until it turns west).
```

Replace with:

```js
// Where the car is at time t, and on which leg.
```

`reel/ch3/roadtrip.js`, change 4. Find:

```js
  const pos = along(rt, (leg === 'east' ? e : w) * rt.len);
  return { leg, ...pos, colour: leg === 'west' ? Math.pow(w, 1.6) * (MAP_W + 100) + (t > LEGS.west[1] ? 2000 : 0) : 0 };
```

Replace with:

```js
  return { leg, ...along(rt, (leg === 'east' ? e : w) * rt.len) };
```

`reel/ch3/roadtrip.js`, change 5. Find:

```js
}
const R_EAST = route(EAST), R_WEST = route(WEST);
```

Replace with:

```js
}

// How far the colour has flooded out from East Lansing (map px): slowly at first, then across the
// whole map, and past every corner once it is done.
export const floodAt = (t) => (t >= FLOOD[1] ? 2000 : Math.pow(legU(FLOOD, t), 1.6) * (MAP_W * 0.7));
const R_EAST = route(EAST), R_WEST = route(WEST);
```

`reel/ch3/roadtrip.js`, change 6. Find:

```js
  const { W, H, canvases: c } = s, trip = tripAt(t);
```

Replace with:

```js
  const { W, H, canvases: c } = s, trip = tripAt(t), r = floodAt(t);
```

`reel/ch3/roadtrip.js`, change 7. Find:

```js
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
```

Replace with:

```js
  if (r >= 2000) layerAt(ctx, c.colour, t, s, env, cam);                              // all colour once the flood is done
  else {
    layerAt(ctx, c.grey, t, s, env, cam);
    if (r > 0) {                                                                     // the colour floods out from East Lansing
      const [hx, hy] = toMap(EAST[0]), cx = hx - cam.x, cy = hy - cam.y;
      ctx.save(); ctx.beginPath();
      for (let y = 0; y < H; y++) { const d = r * r - (y - cy) * (y - cy); if (d > 0) { const hw = Math.sqrt(d); ctx.rect(Math.round(cx - hw), y, Math.round(2 * hw), 1); } }
      ctx.clip();
      layerAt(ctx, c.colour, t, s, env, cam);
      ctx.restore();
      ctx.fillStyle = '#fff6d0';                                                     // its glittering edge
```

- [ ] **Step 4: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 182`, `ℹ fail 0`, then 16 `ok` lines and exit 0.

- [ ] **Step 5: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 42.3,42.5,42.7,42.9,43.2,44.6 && python3 tests/reel/sheet.py /tmp/f /tmp/f-flood.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 42.4,42.6,42.9 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-flood.png 3
```

Expected:
- 42.3 s: the map in grey, the car at `EAST LANSING`.
- 42.5 s: a ring of colour round East Lansing, its edge glittering, as the car leaves for Detroit.
- 42.7 s: the colour reaches the Atlantic and the plains.
- 42.9 s: all but the far West is in colour.
- 43.2 s and 44.6 s: all colour, the car in New England, then back in Michigan.
- On the phone, the ring opens round the car, and the colour has reached the coast before the car does.

- [ ] **Step 6: Update the spec.** Apply to `docs/superpowers/specs/2026-10-03-life-reel-design.md`:

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 1. Find:

```markdown
4. Transition: the Graduation Road Trip, on a map of the United States, captioned `Graduation Road Trip` the whole way. A small silver car leaves East Lansing and loops round the East first, still in Michigan's grey: through Ontario to Niagara Falls, across New York State to Vermont and the Maine coast, down by Boston, New York City and Washington to the Carolinas, and home through Tennessee, Kentucky and Ohio. Then it turns west, by Chicago, Kansas City, Denver and the Rockies, Utah and Las Vegas, to Santa Clara.
```

Replace with:

```markdown
4. Transition: the Graduation Road Trip, on a map of the United States, captioned `Graduation Road Trip` the whole way. The map comes up in Michigan's grey. As a small silver car leaves East Lansing, the colour floods out from there, as through the door in *The Wizard of Oz*, and the map is all colour before the car reaches the coast. The car loops round the East first: through Ontario to Niagara Falls, across New York State to Vermont and the Maine coast, down by Boston, New York City and Washington to the Carolinas, and home through Tennessee, Kentucky and Ohio. Then it turns west, by Chicago, Kansas City, Denver and the Rockies, Utah and Las Vegas, to Santa Clara.
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 2. Find:

```markdown
   - Once the car heads west, the colour spreads out from it, slowly at first, until the whole map is in full colour as it reaches California.
   - A desktop shows the whole route from a still camera. On a phone, the camera follows the car.
```

Replace with:

```markdown
   - On a desktop the route's whole width is in view, and the camera only follows the car up and down. On a phone, it follows the car both ways.
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 3. Find:

```markdown
- **Rendering:** layers are pre-rendered once into offscreen canvases that tile seamlessly. They are built lazily just before a shot starts and released after it ends. Each frame composes the layers and actors onto one canvas at native resolution, about 480×96 on desktop, which the browser scales. The grey Michigan palette uses palette-derived muted variants of the cast (`env.hero(key, pose, 'muted')`), and the road trip draws a pre-greyed copy of the map under the coloured one, clipped to a circle that grows from the car. Neither uses `ctx.filter`, which Safari lacks. All layouts use a seeded PRNG, so every play looks the same.
```

Replace with:

```markdown
- **Rendering:** layers are pre-rendered once into offscreen canvases that tile seamlessly. They are built lazily just before a shot starts and released after it ends. Each frame composes the layers and actors onto one canvas at native resolution, about 480×96 on desktop, which the browser scales. The grey Michigan palette uses palette-derived muted variants of the cast (`env.hero(key, pose, 'muted')`), and the road trip draws a pre-greyed copy of the map under the coloured one, clipped to a circle that grows from East Lansing. Neither uses `ctx.filter`, which Safari lacks. All layouts use a seeded PRNG, so every play looks the same.
```

- [ ] **Step 7: Commit**

```bash
git add reel/ch3/roadtrip.js tests/reel/ch3-roadtrip.test.js docs/superpowers/specs/2026-10-03-life-reel-design.md
git commit -m "fix(reel): Flood the road trip with colour as the car sets off"
```

---

### Task 2: The swim pose

**Files:**
- Modify: `reel/hero.js`, `tests/reel/fake-canvas.js`, `docs/superpowers/specs/2026-10-03-life-reel-design.md`
- Test: `tests/reel/hero.test.js` (append)

**Interfaces:**
- Produces: `heroSprite(key, 'swim')`, 4 frames of flutter kick from the walking legs (`near`, `pass`, `far`, `pass`), arms along the body.
  - The body is the standing rig from the torso down (rows 28 on), turned a quarter clockwise so the back is up: `(x, y)` goes to `(fins + 49 − y, x)`.
  - The head (rows 0–26; the chin's outline in row 27 is dropped) stays upright, copied to `(fins + 9 + x, y − 4)`.
  - Fins (`F`) trail `fins` px back from each shoe. The speargun is left to the scene, and the snorkel stays on the upright head.
  - Placement: `width` is `fins + 39` and `height` is 42.
  - `anchorX` is the feet's column, `fins + 5`, and `footY` is the swimmer's centre line, 18.
  - `hands` is `[fins + 20, 23]`, just under the chin, where a scene can start an arm reaching forward.
  - For `freedive` (fins 9) that is 48 × 42, `anchorX` 14, `hands` `[29, 23]`. For `scuba` (fins 4) it is 43 × 42.
- The fake env gives `swim` 4 frames, as it does `walk`.

- [ ] **Step 1: Write the failing test.** Append to `tests/reel/hero.test.js`:

```js
test('the swim pose lays the rig out for the dives: four kicking frames, the head upright in front, fins behind', () => {
  const swim = heroSprite('freedive', 'swim'), scuba = heroSprite('scuba', 'swim');
  const span = (f, re) => { const xs = f.flatMap(r => [...r].flatMap((ch, x) => (re.test(ch) ? [x] : []))); return [Math.min(...xs), Math.max(...xs)]; };
  assert.equal(swim.frames.length, 4);
  assert.notDeepEqual(swim.frames[0], swim.frames[2], 'a flutter kick');
  assert.deepEqual([swim.width, swim.height, swim.anchorX, swim.footY, swim.hands[0]], [48, 42, 14, 18, [29, 23]]);
  assert.ok(span(swim.frames[0], /F/)[1] < swim.anchorX + 2, 'the fins trail behind the feet');
  assert.ok(span(swim.frames[0], /S/)[0] > swim.width / 2, 'the face is at the front');
  assert.ok(scuba.frames[0].findIndex(r => r.includes('V')) < scuba.footY, 'the tank rides on the back');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/reel/hero.test.js`
Expected: 1 failure in `the swim pose …` (`unknown pose: swim`).

- [ ] **Step 3: Implement.** Apply to `reel/hero.js`:

`reel/hero.js`, change 1. Find:

```js
// to the shoulder, breathing; the scene draws the rifle from the hand.
```

Replace with:

```js
// to the shoulder, breathing; the scene draws the rifle from the hand. `swim` is built apart: see
// swimFrame().
```

`reel/hero.js`, change 2. Find:

```js
  aim: [['stand', 'hold', 0], ['stand', 'hold', 1]],
};
```

Replace with:

```js
  aim: [['stand', 'hold', 0], ['stand', 'hold', 1]],
  swim: [['near', 'mid', 0], ['pass', 'mid', 0], ['far', 'mid', 0], ['pass', 'mid', 0]],
};
```

`reel/hero.js`, change 3. Find:

```js
// One outfit in one pose ('walk': 4 frames, the others 2), plus what the engine needs to place it.
```

Replace with:

```js
// The swimmer, for the dives: the body turned a quarter clockwise, back up, with the head kept
// upright at the front, looking ahead. The walking legs make a flutter kick, the arms lie along the
// body, and the fins trail from the feet. The speargun is left to the scene.
const NECK = OY + 17;                    // the torso's first row; the chin's outline above it is dropped
const SWIM_HEAD = [9, -4];               // where the upright head goes, from where it was
function swimFrame(o, pose) {
  const rows = frame({ ...o, stand: false, hold: false, fins: 0, props: (o.props || []).filter(([kind]) => kind !== 'gun') }, pose);
  const fins = o.fins || 0, [hx, hy] = SWIM_HEAD, c = new Grid(fins + 39, SPRITE_W);
  for (let y = NECK; y < SPRITE_H; y++) for (let x = 0; x < SPRITE_W; x++) if (rows[y][x] !== '.') c.set(fins + SPRITE_H - 1 - y, x, rows[y][x]);
  for (let y = 0; y < NECK - 1; y++) for (let x = 0; x < SPRITE_W; x++) if (rows[y][x] !== '.') c.set(fins + hx + x, hy + y, rows[y][x]);
  for (let y = 0; y < c.h; y++) {                                                  // a fin from each shoe, back past the toes
    let x = 0;
    while (x < c.w && c.px[y][x] === '.') x++;
    if (fins && (c.get(x + 1, y) === 'O' || c.get(x + 1, y) === 'n')) for (let k = 0; k <= fins; k++) c.set(x - k, y, 'F');
  }
  c.outlineAll('k');
  return c.rows();
}

// One outfit in one pose ('walk' and 'swim': 4 frames, the others 2), plus what the engine needs to
// place it. For 'swim', anchorX is the column of the feet, footY the swimmer's centre line, and
// hands the point just under the chin where a scene can start an arm reaching forward.
```

`reel/hero.js`, change 4. Find:

```js
  if (!POSES[pose]) throw new Error(`unknown pose: ${pose}`);
  const hands = POSES[pose].map(([, arm, bob]) => {
```

Replace with:

```js
  if (!POSES[pose]) throw new Error(`unknown pose: ${pose}`);
  if (pose === 'swim') {
    const fins = o.fins || 0;
    return { frames: POSES.swim.map(p => swimFrame(o, p)), palette: palette(o), width: fins + 39, height: SPRITE_W,
      anchorX: fins + SPRITE_H - 1 - FOOT_Y, footY: ANCHOR_X + 9, hands: POSES.swim.map(() => [fins + SPRITE_H - 1 - (OY + 18), NECK - 1 + SWIM_HEAD[1]]) };
  }
  const hands = POSES[pose].map(([, arm, bob]) => {
```

Then apply to `tests/reel/fake-canvas.js`:

`tests/reel/fake-canvas.js`, change 1. Find:

```js
    hero: (key, pose = 'walk', tone) => sprite(`${key}:${pose}${toneOf(tone)}`, pose === 'walk' ? 4 : 2, { anchorX: 9, footY: 44, seatY: 38, hands: Array(4).fill([19, 33]) }),
```

Replace with:

```js
    hero: (key, pose = 'walk', tone) => sprite(`${key}:${pose}${toneOf(tone)}`, pose === 'walk' || pose === 'swim' ? 4 : 2, { anchorX: 9, footY: 44, seatY: 38, hands: Array(4).fill([19, 33]) }),
```

- [ ] **Step 4: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 183`, `ℹ fail 0`, then 16 `ok` lines and exit 0.

- [ ] **Step 5: Update the spec.** Apply to `docs/superpowers/specs/2026-10-03-life-reel-design.md`:

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 1. Find:

```markdown
The two dive outfits use swimming poses in the reel. The other outfits walk. Yimeng also sits (on the train, at Trolltunga and in the restaurants), types at the desk, curls dumbbells and does pull-ups in the home gym, and at the cap toss cheers bareheaded in the gown.
```

Replace with:

```markdown
The two dive outfits swim: the body lies flat and flutter-kicks, fins trailing, with the head kept upright at the front, looking ahead. The other outfits walk. Yimeng also sits (on the train, at Trolltunga and in the restaurants), types at the desk, curls dumbbells and does pull-ups in the home gym, raises a rifle at the ranch, and at the cap toss cheers bareheaded in the gown.
```

- [ ] **Step 6: Commit**

```bash
git add reel/hero.js tests/reel/hero.test.js tests/reel/fake-canvas.js docs/superpowers/specs/2026-10-03-life-reel-design.md
git commit -m "feat(reel): Add a swim pose for the dives"
```

---

### Task 3: The dog waits

**Files:**
- Modify: `reel/dog.js`, `docs/superpowers/specs/2026-10-03-life-reel-design.md`
- Test: `tests/reel/dog.test.js` (append)

**Interfaces:**
- Produces: `dogSprite(key, 'wait')`, 2 frames standing on straight legs.
  - Its tail is low on the first frame and up on the second, so it wags.
  - Everything but the tail, from column 4 on, is the same in both frames.
- `frame()` takes an optional tail, so the trot frames are unchanged and the golden test still holds.

- [ ] **Step 1: Write the failing test.** Append to `tests/reel/dog.test.js`:

```js
test('the dog waits: standing still on two frames, only the tail wagging', () => {
  for (const key of ['lifevest', 'hikepack', 'pup']) {
    const wait = dogSprite(key, 'wait');
    assert.equal(wait.frames.length, 2);
    assert.notDeepEqual(wait.frames[0], wait.frames[1], `${key} wags`);
    assert.ok(wait.frames[0].every((r, y) => r.slice(4) === wait.frames[1][y].slice(4)), `${key} holds still but for the tail`);
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/reel/dog.test.js`
Expected: 1 failure in `the dog waits …` (`unknown dog pose: wait`).

- [ ] **Step 3: Implement.** Apply to `reel/dog.js`:

`reel/dog.js`, change 1. Find:

```js
    gather: { back: [[5, 10, 6, 15], [6, 10, 8, 15]], front: [[13, 10, 12, 15], [14, 10, 13, 15]] },
  },
```

Replace with:

```js
    gather: { back: [[5, 10, 6, 15], [6, 10, 8, 15]], front: [[13, 10, 12, 15], [14, 10, 13, 15]] },
    stand: { back: [[5, 10, 4, 15], [6, 10, 6, 15]], front: [[13, 10, 13, 15], [14, 10, 15, 15]] },
  },
```

`reel/dog.js`, change 2. Find:

```js
  eye: [16, 2], nose: [21, 3], tail: [3, 9, 0, 12], w: 24, h: 17, footY: 15,
```

Replace with:

```js
  eye: [16, 2], nose: [21, 3], tail: [3, 9, 0, 12], wag: [[3, 9, 0, 11], [3, 9, 1, 5]], w: 24, h: 17, footY: 15,
```

`reel/dog.js`, change 3. Find:

```js
    gather: { back: [[3, 9, 4, 12], [4, 9, 5, 12]], front: [[9, 9, 8, 12], [10, 9, 9, 12]] },
  },
```

Replace with:

```js
    gather: { back: [[3, 9, 4, 12], [4, 9, 5, 12]], front: [[9, 9, 8, 12], [10, 9, 9, 12]] },
    stand: { back: [[3, 9, 3, 12], [4, 9, 4, 12]], front: [[9, 9, 9, 12], [10, 9, 10, 12]] },
  },
```

`reel/dog.js`, change 4. Find:

```js
  eye: [12, 2], nose: [16, 3], tail: [2, 7, 0, 8], w: 19, h: 14, footY: 12,
```

Replace with:

```js
  eye: [12, 2], nose: [16, 3], tail: [2, 7, 0, 8], wag: [[2, 7, 0, 8], [2, 7, 0, 4]], w: 19, h: 14, footY: 12,
```

`reel/dog.js`, change 5. Find:

```js
function frame(spec, outfit, pose, bob) {
```

Replace with:

```js
function frame(spec, outfit, pose, bob, tail = spec.tail) {
```

`reel/dog.js`, change 6. Find:

```js
  const [tx0, ty0, tx1, ty1] = spec.tail;
```

Replace with:

```js
  const [tx0, ty0, tx1, ty1] = tail;
```

`reel/dog.js`, change 7. Find:

```js
// pose: 'trot' (4 frames) or 'sleep' (2 frames, breathing).
```

Replace with:

```js
// pose: 'trot' (4 frames), 'sleep' (2 frames, breathing) or 'wait' (2 frames: standing, wagging).
```

`reel/dog.js`, change 8. Find:

```js
  if (pose !== 'trot' && pose !== 'sleep') throw new Error(`unknown dog pose: ${pose}`);
```

Replace with:

```js
  if (!['trot', 'sleep', 'wait'].includes(pose)) throw new Error(`unknown dog pose: ${pose}`);
```

`reel/dog.js`, change 9. Find:

```js
  const made = pose === 'trot' ? TROT.map(([p, bob]) => [frame(spec, outfit, p, bob), 1 + bob]) : [0, 1].map(rise => sleepFrame(spec, outfit, rise));
```

Replace with:

```js
  const made = pose === 'trot' ? TROT.map(([p, bob]) => [frame(spec, outfit, p, bob), 1 + bob])
    : pose === 'wait' ? spec.wag.map(tail => [frame(spec, outfit, 'stand', 0, tail), 1])
    : [0, 1].map(rise => sleepFrame(spec, outfit, rise));
```

- [ ] **Step 4: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 184`, `ℹ fail 0`, then 16 `ok` lines and exit 0.

- [ ] **Step 5: Update the spec.** Apply to `docs/superpowers/specs/2026-10-03-life-reel-design.md`:

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 1. Find:

```markdown
**The dog.** A slender sighthound with a slate-grey coat, thin legs, a long muzzle and folded ears, matching the dog in the hero photo. It trots at about 9 fps. It joins at the 2019 graduation as a puppy and grows up during the Michigan time-lapse, asleep by the desk.
```

Replace with:

```markdown
**The dog.** A slender sighthound with a slate-grey coat, thin legs, a long muzzle and folded ears, matching the dog in the hero photo. It trots at about 9 fps. It joins at the 2019 graduation as a puppy and grows up during the Michigan time-lapse, asleep by the desk. On the California coast it also stands and waits, wagging.
```

- [ ] **Step 6: Commit**

```bash
git add reel/dog.js tests/reel/dog.test.js docs/superpowers/specs/2026-10-03-life-reel-design.md
git commit -m "feat(reel): Add a waiting pose for the dog"
```

---

### Task 4: Mushrooms under the oaks

**Files:**
- Create: `reel/ch4/forest.js`
- Test: `tests/reel/ch4-forest.test.js` (new)

**Interfaces:**
- Consumes: the `forage` outfit's walk and `hands` (its basket); the dog's `hikepack` coat, trotting and `wait` (Task 3); `Painter`, `rng`; `gradient`, `ridge`, `tile`, `art`.
- Produces: `runAt(t)`, how far the path has scrolled.
  - It walks at 26 px/s and brakes over 0.45–0.75 s.
  - It stands still until 1.35 s, then sets off again over 1.35–1.6 s.
- Produces: `walkingAt(t)` and `PICKS = [0.78, 0.94, 1.1]`. Each chanterelle leaves the ground at its `PICKS` time and reaches the basket 0.22 s later.
- Produces: `forest`, a scene with layers `sky`, `far`, `mid` (oaks with the canopy closing overhead, tiling at twice the screen width) and `ground`. It exposes `hx = round(0.34 W)` and `cluster`, where the chanterelles grow: just in front of Yimeng's feet once the walk has stopped.
  - While Yimeng stands, the dog is drawn mirrored, facing back.

- [ ] **Step 1: Write the failing test.** Create `tests/reel/ch4-forest.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { forest, runAt, walkingAt, PICKS } from '../../reel/ch4/forest.js';

sceneContract('ch4 forest', forest, 1.8);

const drawn = (t) => frameAt(forest, 480, t).ctx.calls.filter(c => c[0] === 'drawImage');

test('forest: Yimeng walks in, stops at the chanterelles, and walks on', () => {
  assert.ok(runAt(0.3) > runAt(0.1));
  assert.equal(runAt(0.9), runAt(1.3), 'standing while picking');
  assert.ok(runAt(1.8) > runAt(1.3));
  assert.deepEqual([0.2, 1, 1.7].map(walkingAt), [true, false, true]);
  assert.ok(PICKS.every(p => !walkingAt(p) && !walkingAt(p + 0.22)), 'every one picked standing still');
});

test('forest: the chanterelles go from the ground into the basket', () => {
  const caps = (t) => drawn(t).filter(c => c[1] === 'art').map(c => c[3]);
  assert.ok(caps(0.5).length === 3 && caps(0.5).every(y => y >= 84), 'three on the ground');
  assert.ok(caps(1.5).length === 3 && caps(1.5).every(y => y <= 76), 'three in the basket');
});

test('forest: the dog in its backpack trots ahead, then turns back and waits, wagging', () => {
  assert.ok(drawn(0.2).some(c => /^dog:hikepack:\d$/.test(c[1])));
  assert.ok(drawn(1).some(c => /^dog:hikepack:wait:\d$/.test(c[1])));
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/reel/ch4-forest.test.js`
Expected: the file fails to load (`Cannot find module …/reel/ch4/forest.js`).

- [ ] **Step 3: Implement.** Create `reel/ch4/forest.js`:

```js
// Chapter 4, shot 4: mushrooms under the oaks. Dappled light in a California oak wood, the trunks
// hung with lace lichen, sword ferns along a path through the leaf litter. Yimeng walks in with the
// basket and stops at a cluster of golden chanterelles; the dog, in its little backpack, turns back
// and wags while they hop into the basket one by one, and then the two walk on.
import { Painter, rng } from '../pixels.js';
import { gradient, ridge, tile, art } from '../kit.js';

const V = 26;                                // walk speed, px/s
const GROUND = 88;                           // the row Yimeng's shoes rest on
const STOP = [0.45, 0.75], GO = [1.35, 1.6]; // braking to a stop, then setting off again
export const PICKS = [0.78, 0.94, 1.1];      // when each chanterelle leaves the ground
const HOP = 0.22;                            // and how long it takes to reach the basket

// How far the path has scrolled: walking, braking to a stop, standing, setting off again.
export function runAt(t) {
  const [a, b] = STOP, [c, d] = GO;
  if (t < a) return V * t;
  if (t < b) { const u = t - a; return V * (a + u - (u * u) / (2 * (b - a))); }
  const stopped = V * (a + (b - a) / 2);
  if (t < c) return stopped;
  if (t < d) { const u = t - c; return stopped + V * (u * u) / (2 * (d - c)); }
  return stopped + V * ((d - c) / 2 + t - d);
}
export const walkingAt = (t) => t < STOP[1] || t >= GO[0];

// A coast live oak: a short thick trunk forking into crooked limbs that sprawl out low, under
// clumps of dark leaves, the limbs hung with lace lichen.
function oak(p, x0, r, col) {
  const fork = 46 + Math.floor(r() * 8), lean = (r() - 0.5) * 4;
  for (let y = fork; y < GROUND - 1; y++) {                                       // the trunk, flaring at the foot
    const u = (y - fork) / (GROUND - fork), w = 7 + Math.round(u * u * 4), x = Math.round(x0 + lean * (1 - u) - w / 2);
    for (let i = 0; i < w; i++) p.px(x + i, y, i === 0 ? col.trunk[2] : i === w - 1 ? col.trunk[0] : (i * 3 + (y >> 2)) % 7 === 0 ? col.trunk[2] : (i + y) % 11 === 0 ? col.moss : col.trunk[1]);
  }
  const limbs = [[-1, 0.45, 34 + r() * 14], [1, 0.5, 30 + r() * 14], [-0.25, 1.4, 22 + r() * 8], [0.45, 1.2, 20 + r() * 8]];
  const tips = [];
  for (const [dir, rise, len] of limbs) {                                          // the limbs, thinning as they go
    let x = x0 + lean, y = fork + 2;
    for (let k = 0; k < len; k++) {
      x += dir * (0.9 + Math.sin(k * 0.35 + x0) * 0.35); y -= rise * (0.6 + Math.cos(k * 0.5 + x0) * 0.4);
      const w = Math.max(2, Math.round(5 - (k / len) * 3.5));
      for (let j = 0; j < w; j++) p.px(Math.round(x), Math.round(y) + j, j === 0 ? col.trunk[0] : j === w - 1 ? col.trunk[2] : col.trunk[1]);
      if (k > 6 && k % 7 === 0) for (let h = 1; h < 4 + Math.floor(r() * 6); h++) p.wpx(Math.round(x) + Math.round(Math.sin(h) * 0.5), Math.round(y) + w + h, h % 3 ? '#c4ccac' : '#a8b490');
    }
    tips.push([x, y]);
  }
  for (const [tx, ty] of tips) for (let n = 0; n < 5; n++) {                      // round clumps of leaves at the limb ends
    const cx = tx + (r() - 0.5) * 18, cy = ty - 5 + (r() - 0.5) * 10, rad = 7 + r() * 6;
    for (let j = -rad; j <= rad; j++) for (let i = -rad * 1.15; i <= rad * 1.15; i++) {
      const d = (i * i) / 1.32 + j * j;
      if (d > rad * rad || cy + j < 0) continue;
      const lit = i + j < -rad * 0.6, shade = j > rad * 0.45;
      p.px(Math.round(cx + i), Math.round(cy + j), lit ? ((Math.round(i) * 3 + Math.round(j) * 5) % 4 === 0 ? col.leaf[0] : col.leaf[1]) : shade ? col.leaf[3] : (Math.round(i) * 7 + Math.round(j) * 3) % 9 === 0 ? col.leaf[1] : col.leaf[2]);
    }
  }
}

// A stand of oaks, the canopy closing overhead.
function woods(TW, H, seed, every, col) {
  const p = new Painter(TW, H), r = rng(seed), roof = ridge(TW, 9, [[4, 3, seed], [3, 8, seed * 2], [2, 17, seed * 3]]);
  for (let x0 = 20 + Math.floor(r() * every * 0.5); x0 < TW - 30; x0 += every + Math.floor(r() * every * 0.4)) oak(p, x0, r, col);
  for (let x = 0; x < TW; x++) for (let y = 0; y < roof[x]; y++) {
    const gap = Math.sin(x * 0.23 + y * 0.9 + seed) + Math.sin(x * 0.051 - y * 0.4) > 1.5;
    if (!gap) p.px(x, y, y > roof[x] - 2 ? col.leaf[3] : (x * 3 + y * 5) % 7 === 0 ? col.leaf[1] : col.leaf[2]);
  }
  return p;
}

function ground(TW, H) {
  const p = new Painter(TW, H), r = rng(47);
  for (let y = 80; y < H; y++) for (let x = 0; x < TW; x++) {                      // leaf litter, and the path through it
    const path = y >= 85 && y < 93;
    let c = path ? ((x * 7 + y * 3) % 13 === 0 ? '#a07a52' : '#8c6a46') : (x * 5 + y * 11) % 7 === 0 ? '#b8743a' : (x + y * 3) % 5 === 0 ? '#6a4224' : '#8a5a32';
    if (y === 80) c = '#7a5a34';
    p.px(x, y, c);
  }
  for (let n = 0; n < TW / 40; n++) {                                              // sunflecks on the path
    const cx = Math.floor(r() * TW), cy = 86 + Math.floor(r() * 6), w = 4 + Math.floor(r() * 7);
    for (let i = -w; i <= w; i++) for (let j = -1; j <= 1; j++) if (i * i / (w * w) + j * j < 1) p.px(cx + i, cy + j, (i + j) % 3 ? '#c49a62' : '#d8b070');
  }
  for (let x0 = 4; x0 < TW; x0 += 16 + Math.floor(r() * 22)) {                     // sword ferns along the far edge of the path
    const h = 6 + Math.floor(r() * 6);
    for (const dir of [-1.5, -0.9, -0.35, 0.35, 0.9, 1.5]) for (let k = 0; k < h; k++) {
      const x = Math.round(x0 + dir * k * 0.75), y = 84 - Math.round(k * (1.25 - Math.abs(dir) * 0.38) - (Math.abs(dir) > 1 ? -((k / h) ** 2) * 4 : 0));
      p.wpx(x, y, k % 2 ? '#2e5a2a' : '#3e7034');
    }
  }
  return p;
}

// A golden chanterelle: a wavy funnel of a cap on a pale stem.
const CHANTERELLE = art(`
YYyYY
.YyY.
..w..
`, { Y: '#f2b23a', y: '#c8801e', w: '#f4dca0' }, '#6a3a12');

export function buildForest(W, H = 96) {
  const TW = W * 2, hx = Math.round(W * 0.34);
  const layers = {
    sky: gradient(W, H, [['#5a7a3c', 0], ['#8aa45a', 0.25], ['#d4d68e', 0.5], ['#b4bc78', 0.7], ['#8a9a5e', 0.85]]),
    far: woods(TW, H, 13, 34, { trunk: ['#8a8c62', '#7a7c58', '#6a6c4e'], moss: '#8a9462', leaf: ['#a4b070', '#8ea062', '#7c9058', '#6a7e4c'] }),
    mid: woods(TW, H, 29, 120, { trunk: ['#6a5a48', '#4a3e34', '#2e2620'], moss: '#6a7a3e', leaf: ['#7a9a48', '#5a7a38', '#3e5a2c', '#2c4220'] }),
    ground: ground(TW, H),
  };
  // the cluster sits just in front of Yimeng's feet once the walk has stopped
  return { W, H, TW, hx, cluster: hx + 15 + runAt(STOP[1]), layers };
}

export function renderForest(ctx, t, s, env) {
  const { W, H, canvases: c, hx } = s, run = runAt(t), walking = walkingAt(t);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  tile(ctx, c.far, run * 0.2, 0);
  ctx.globalAlpha = 0.18; ctx.fillStyle = '#fff6c8';                               // shafts of sun through the leaves
  for (let k = 0; k < Math.ceil(W / 90) + 1; k++) {
    const x0 = ((k * 90 - run * 0.3) % (W + 90) + W + 90) % (W + 90) - 60;
    for (let y = 0; y < GROUND; y++) ctx.fillRect(Math.round(x0 + y * 0.45), y, 9, 1);
  }
  ctx.globalAlpha = 1;
  tile(ctx, c.mid, run * 0.5, 0);
  tile(ctx, c.ground, run, 0);
  const hero = env.hero('forage', 'walk'), f = walking ? Math.floor(run / V * 6) % 4 : 1;
  const [bx, by] = hero.hands[f], x = hx - hero.anchorX, y = GROUND - hero.footY;
  const picked = PICKS.filter(p => t >= p + HOP).length;
  const cap = env.art(CHANTERELLE);
  PICKS.forEach((p, i) => {                                                         // the chanterelles: on the ground, then hopping into the basket
    const gx = Math.round(s.cluster - run) + i * 6 - 6, gy = GROUND - cap.height + 1 + (i % 2);
    if (t < p) {
      ctx.drawImage(cap, gx, gy);
      if (!walking && t > p - 0.15) { ctx.fillStyle = '#fff6c8'; ctx.fillRect(gx + 2, gy - 3, 1, 2); ctx.fillRect(gx + 1, gy - 2, 3, 1); }   // a glint: this one next
    } else if (t < p + HOP) {
      const u = (t - p) / HOP, tx = x + bx - 3 + i * 2, ty = y + by - 2;
      ctx.drawImage(cap, Math.round(gx + (tx - gx) * u), Math.round(gy + (ty - gy) * u - Math.sin(u * Math.PI) * 12));
    }
  });
  ctx.drawImage(hero.canvases[f], x, y);
  for (let i = 0; i < picked; i++) ctx.drawImage(cap, x + bx - 4 + i * 2, y + by - 1 - (i === 1 ? 1 : 0));   // piling up in the basket
  const dog = env.dog('hikepack', walking ? 'trot' : 'wait'), dx = hx + 26;
  if (walking) ctx.drawImage(dog.canvases[Math.floor(t * 9) % 4], dx - dog.anchorX, GROUND - dog.footY);
  else {                                                                            // turned back to watch, wagging
    ctx.save(); ctx.translate(2 * dx + 24, 0); ctx.scale(-1, 1);
    ctx.drawImage(dog.canvases[Math.floor(t * 6) % 2], dx, GROUND - dog.footY);
    ctx.restore();
  }
}

export const forest = { build: buildForest, render: renderForest };
```

- [ ] **Step 4: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 189`, `ℹ fail 0`, then 16 `ok` lines and exit 0. Task 10 adds the shot to the reel.

- [ ] **Step 5: Commit**

```bash
git add reel/ch4/forest.js tests/reel/ch4-forest.test.js
git commit -m "feat(reel): Add the mushroom wood, chanterelles into the basket"
```

---

### Task 5: Fishing from the rocks

**Files:**
- Create: `reel/ch4/fishing.js`
- Test: `tests/reel/ch4-fishing.test.js` (new)

**Interfaces:**
- Consumes: the `fish` outfit (its rod and the line hanging from the tip are in the sprite); the dog's `lifevest` coat in `wait`; `Painter`, `rng`; `gradient`, `ridge`, `art`.
- Produces: `BITE = 0.65` and `LAND = 1.35`, and `fishAt(t)`, which is one of:
  - `'water'`: the float bobs, and from `BITE` ducks under
  - `'reeling'`: from `BITE + 0.25`, the rockfish comes up the line
  - `'up'`: from `LAND`, the rockfish hangs under the rod tip
- Produces: `fishing`, a scene with layers `backdrop` (sky, sea, the cypress headland, sea stacks) and `rock`. It exposes `hx = round(0.34 W)` and `edge = hx + 20`.
  - Yimeng stands on the rock with the shoes at row 66. The line runs on from the sprite's own line down to the water at row 84.

- [ ] **Step 1: Write the failing test.** Create `tests/reel/ch4-fishing.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { fishing, fishAt } from '../../reel/ch4/fishing.js';

sceneContract('ch4 fishing', fishing, 1.9);

test('fishing: the float in the sea, a bite, the rockfish reeled up, then hanging from the rod', () => {
  assert.deepEqual([0.3, 1, 1.6].map(fishAt), ['water', 'reeling', 'up']);
});

test('fishing: Yimeng at the edge of the rock with the rod, the dog in its life vest behind', () => {
  const { ctx, s } = frameAt(fishing, 480, 1.6), calls = ctx.calls.filter(c => c[0] === 'drawImage');
  assert.deepEqual(ctx.draws('fish:walk:1'), [[s.hx - 9, 66 - 44]]);
  const dog = calls.find(c => /^dog:lifevest:wait:\d$/.test(c[1]));
  assert.ok(dog && dog[2] + 24 < s.hx, 'behind Yimeng');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/reel/ch4-fishing.test.js`
Expected: the file fails to load (`Cannot find module …/reel/ch4/fishing.js`).

- [ ] **Step 3: Implement.** Create `reel/ch4/fishing.js`:

```js
// Chapter 4, shot 5: fishing from the rocks. A dark outcrop over the Pacific, swell breaking white at
// its foot, a cypress headland and sea stacks along the horizon. Yimeng, in the bucket hat and vest,
// stands at the edge with the line straight down into the sea. The float bobs, ducks under, and a
// rockfish comes up out of the water on the line, flapping. The dog, in its life vest, hops behind.
import { Painter, rng } from '../pixels.js';
import { gradient, ridge, art } from '../kit.js';

const TOP = 66;                              // the row Yimeng's shoes rest on, on top of the rock
const HORIZON = 50, SEA = 84;                // the horizon; the row the float sits on
export const BITE = 0.65, LAND = 1.35;       // the float ducks under; the fish is up at the rod
const ROD_TIP = [27, -33];                   // from Yimeng's left edge and shoes: where the line leaves the rod
const LINE_END = -19;                        // and where the line in the sprite stops

// Where the fish is at t: in the water, being reeled up the line, or hanging under the rod tip.
export function fishAt(t) {
  if (t < BITE + 0.25) return 'water';
  return t < LAND ? 'reeling' : 'up';
}

// A rockfish hanging from the hook, head up: two frames, its tail flicking.
const ROCKFISH = [`
..r...
.rRr..
rRKRr.
rRRRRs
rRRRRs
.RRRRs
.rRRr.
..RR..
..rr..
.r..r.
r....r
`, `
..r...
.rRr..
rRKRr.
rRRRRs
rRRRRs
.RRRRs
.rRRr.
..RR..
..rr..
..rr..
..r.r.
`].map(rows => art(rows, { R: '#e0603a', r: '#b0402a', K: '#1a1214', s: '#f0a070' }, '#4a1a10'));
const FLOAT = art(`
.r.
rrr
www
`, { r: '#e83a2a', w: '#f4f1ea' }, '#2a2a30');
const BANG = art(`
#
#
#
.
#
`, { '#': '#ffd75e' }, '#5a3a10');

function rock(W, H, edge) {
  const p = new Painter(W, H), r = rng(19), top = ridge(W, 0, [[1.5, 3, 0.4], [1, 7, 1.2]]);
  for (let x = 0; x < W; x++) {
    if (x > edge + 6) break;
    const t0 = TOP + Math.round(top[x]) + (x > edge ? Math.round((x - edge) ** 1.6) : 0);
    for (let y = t0; y < SEA + 3; y++) {                                           // down to the waterline
      const d = y - t0, crack = (x * 7 + y * 3) % 23 === 0 || (x + y * 5) % 31 === 0, v = r();
      let c = d === 0 ? '#6a6a6e' : d < 3 ? '#4e4e54' : crack ? '#26262a' : (x + y) % 5 === 0 ? '#3a3a40' : '#424248';
      if (y > SEA - 5 && y < SEA && v < 0.12) c = '#c8c4ba';                        // barnacles above the tide line
      else if (y >= SEA - 1 && v < 0.45) c = v < 0.2 ? '#1e2430' : '#2a3240';        // mussels at it
      p.px(x, y, c);
    }
  }
  for (let n = 0; n < 6; n++) {                                                    // kelp washed up on the rock
    const x = Math.floor(r() * edge), y = TOP + 2 + Math.floor(r() * 8);
    for (let k = 0; k < 6; k++) p.px(x + k, y + (k % 2), k % 2 ? '#5a6a2a' : '#6e7e32');
  }
  return p;
}

function backdrop(W, H) {
  const p = new Painter(W, H), r = rng(8);
  const sky = gradient(W, H, [['#5a9ad8', 0], ['#7ab0e0', 0.25], ['#b4d4ea', 0.48], ['#5a86b4', 0.53], ['#3e6e9e', 0.7], ['#34608e', 0.9]]);
  p.data.set(sky.data);
  const hill = ridge(W, 9, [[3, 2, 0.5], [2, 5, 1.7]]);
  for (let x = 0; x < Math.round(W * 0.42); x++) {                                 // a headland, and cypresses on it
    const h = Math.round(hill[x] * (1 - x / (W * 0.42)) + 3 * (1 - x / (W * 0.42)));
    for (let y = HORIZON - h; y <= HORIZON; y++) p.px(x, y, y === HORIZON - h ? '#7a8a5a' : '#5a6a46');
  }
  for (let x0 = 4; x0 < W * 0.3; x0 += 18 + Math.floor(r() * 14)) {               // Monterey cypresses, bent inland by the wind
    const base = HORIZON - Math.round(hill[x0] * (1 - x0 / (W * 0.42))) - 1, h = 5 + Math.floor(r() * 4);
    for (let y = base - h; y <= base; y++) { const lx = x0 + Math.round((base - y) * -0.4); p.px(lx, y, '#2e2a24'); p.px(lx + 1, y, '#3e362c'); }
    const cx = x0 - Math.round(h * 0.4), cy = base - h;
    for (const [dx, dy, w, th] of [[-3, 0, 9, 3], [-5, -2, 7, 2], [1, -1, 6, 2], [-1, -4, 5, 2]]) for (let j = 0; j < th; j++) for (let i = -w; i <= w; i++) {
      if (Math.abs(i) > w - j || r() < 0.08) continue;
      p.px(cx + dx + i, cy + dy - j, j === th - 1 && i < 0 ? '#4a6038' : (i + j) % 4 === 0 ? '#22341e' : '#2e4228');
    }
  }
  for (const [fx, w, h] of [[0.72, 7, 9], [0.8, 4, 5], [0.9, 9, 6]]) {             // sea stacks
    const x0 = Math.round(W * fx);
    for (let y = HORIZON - h; y <= HORIZON; y++) for (let x = x0; x < x0 + w - Math.round((HORIZON - y) / 3); x++) p.px(x, y, x === x0 ? '#4a4a56' : '#5e5e6a');
  }
  return p;
}

export function buildFishing(W, H = 96) {
  const hx = Math.round(W * 0.34), edge = hx + 20, rd = rng(61);
  const swell = Array.from({ length: Math.round(W / 6) }, () => [Math.floor(rd() * W), HORIZON + 3 + Math.floor(rd() * (H - HORIZON - 4)), 3 + Math.floor(rd() * 6), rd() * 6]);
  return { W, H, hx, edge, swell, layers: { backdrop: backdrop(W, H), rock: rock(W, H, edge) } };
}

export function renderFishing(ctx, t, s, env) {
  const { W, H, canvases: c, hx, edge } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.backdrop, 0, 0);
  ctx.fillStyle = '#7ea4cc';                                                       // the swell rolling in
  for (const [x, y, len, ph] of s.swell) ctx.fillRect(Math.round((x + t * 8 + Math.sin(t * 2 + ph) * 2) % W), y, len, 1);
  const surge = (t * 0.8) % 1;                                                     // a wave breaking white at the rock's foot
  ctx.fillStyle = '#f4f6f8';
  for (let k = 0; k < 14; k++) {
    const a = k / 14 * Math.PI, rad = surge * 12;
    if (surge < 0.7) ctx.fillRect(Math.round(edge + 4 + Math.cos(a) * rad * 0.8), Math.round(SEA + 4 - Math.sin(a) * rad), 2, 1);
  }
  ctx.drawImage(c.rock, 0, 0);
  const hero = env.hero('fish', 'walk'), x = hx - hero.anchorX, y = TOP - hero.footY, sway = Math.round(Math.sin(t * 2.2) * 1.2);
  const tipX = hx + ROD_TIP[0], tipY = TOP + ROD_TIP[1], state = fishAt(t);
  const dog = env.dog('lifevest', 'wait'), hop = state === 'up' && Math.floor(t * 8) % 2 ? 2 : 0;   // the dog, behind on the rock
  ctx.drawImage(dog.canvases[Math.floor(t * (state === 'up' ? 10 : 4)) % 2], hx - 30, TOP - dog.footY - hop);
  ctx.drawImage(hero.canvases[1], x, y);
  ctx.fillStyle = '#e8e8ec';
  let lineTo = SEA - 1;
  if (state === 'reeling') lineTo = Math.round(SEA - 1 - (SEA - 1 - (TOP + LINE_END + 6)) * Math.min(1, (t - BITE - 0.25) / (LAND - BITE - 0.25)));
  if (state === 'up') lineTo = TOP + LINE_END + 6;
  ctx.fillRect(tipX, TOP + LINE_END, 1, Math.max(0, lineTo - (TOP + LINE_END)));    // the line, on down into the water
  if (state === 'water') {
    const dip = t > BITE ? (Math.floor(t * 14) % 2 ? 3 : 1) : 0, bob = Math.round(Math.sin(t * 5) * 1 + sway * 0.5);
    ctx.drawImage(env.art(FLOAT), tipX - 2, SEA - 3 + bob + dip);
    if (t > BITE) { ctx.fillStyle = '#f4f6f8'; const ring = Math.round((t - BITE) * 30); ctx.fillRect(tipX - 3 - ring, SEA + 1, 2, 1); ctx.fillRect(tipX + 2 + ring, SEA + 1, 2, 1); }
  } else {
    const fish = env.art(ROCKFISH[Math.floor(t * 12) % 2]);
    ctx.drawImage(fish, tipX - 2, lineTo - 1);
    if (state === 'reeling' && t < BITE + 0.5) {                                   // the splash as it leaves the water
      ctx.fillStyle = '#f4f6f8';
      for (let k = 0; k < 6; k++) ctx.fillRect(tipX - 5 + k * 2, SEA - 2 - ((k * 3) % 4) - Math.round((t - BITE - 0.25) * 20), 1, 1);
    }
  }
  if (t > BITE && t < BITE + 0.5) ctx.drawImage(env.art(BANG), hx + 9, y + 4);      // a bite!
}

export const fishing = { build: buildFishing, render: renderFishing };
```

- [ ] **Step 4: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 193`, `ℹ fail 0`, then 16 `ok` lines and exit 0.

- [ ] **Step 5: Commit**

```bash
git add reel/ch4/fishing.js tests/reel/ch4-fishing.test.js
git commit -m "feat(reel): Add rock fishing, a rockfish on the line"
```

---

### Task 6: The tide pools

**Files:**
- Create: `reel/ch4/tide.js`
- Test: `tests/reel/ch4-tide.test.js` (new)

**Interfaces:**
- Consumes: the `tide` outfit (its bucket is in the sprite, at the hand); the dog's `lifevest` coat in `wait`, mirrored to face the burrow; `Painter`, `rng`; `gradient`, `ridge`, `art`.
- Produces: `URCHIN = 0.3`, when the urchin leaves the pool. Each hop into the bucket takes 0.25 s.
- Produces: `burrowAt(t)`, which is one of:
  - `'still'`: until 0.7 s
  - `'digging'`: sand spurts out, until 1.15 s
  - `'worm'`: the worm is out from 1.2 s, and from 1.35 s hops into the bucket
  - `'gone'`: from 1.6 s
- The dog jumps when the worm comes out, then backs off 6 px. The constants behind this are `DIG = [0.7, 1.15]`, `WORM = 1.2` and `BAG = 1.6`.
- Produces: `tide`, a scene with one layer, `shore`. It exposes `hx = round(0.34 W)`, `pool = hx + 22` and `burrow = hx + 52`.

- [ ] **Step 1: Write the failing test.** Create `tests/reel/ch4-tide.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { tide, burrowAt } from '../../reel/ch4/tide.js';

sceneContract('ch4 tide', tide, 1.9);

test('tide: after the urchin, the burrow: sand spurting, the worm out, then into the bucket', () => {
  assert.deepEqual([0.5, 0.9, 1.3, 1.7].map(burrowAt), ['still', 'digging', 'worm', 'gone']);
});

test('tide: the dog faces the burrow, and jumps back when the worm comes out', () => {
  const dog = (t) => frameAt(tide, 480, t).ctx.calls.find(c => c[0] === 'drawImage' && /^dog:lifevest:wait:\d$/.test(c[1]));
  const [, , x0, y0] = dog(1), [, , x1, y1] = dog(1.37), [, , x2] = dog(1.7);
  assert.ok(y1 < y0, 'it jumps');
  assert.ok(x2 > x0, 'and backs off');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/reel/ch4-tide.test.js`
Expected: the file fails to load (`Cannot find module …/reel/ch4/tide.js`).

- [ ] **Step 3: Implement.** Create `reel/ch4/tide.js`:

```js
// Chapter 4, shot 6: low tide. The sea far out, wet sand shining with the late sky, low rocks hung with
// weed and mussels. Yimeng, in bib waders and boots, stands by a tide pool of anemones and a sea star;
// a purple sea urchin hops into the bucket. Then sand spurts from a burrow in the flat, a fat pink
// innkeeper worm pops out, and the dog, in its life vest, jumps back. The worm goes in the bucket too.
import { Painter, rng } from '../pixels.js';
import { gradient, ridge, art } from '../kit.js';

const GROUND = 88;                           // the row Yimeng's shoes rest on
const HORIZON = 44, FLAT = 58;               // the horizon; where the shining flat begins
export const URCHIN = 0.3, DIG = [0.7, 1.15], WORM = 1.2, BAG = 1.6;
const HOP = 0.25;

// What the burrow is doing at t: nothing yet, spurting sand, the worm out, then the worm gone.
export function burrowAt(t) {
  if (t < DIG[0]) return 'still';
  if (t < DIG[1]) return 'digging';
  return t < BAG ? 'worm' : 'gone';
}

const URCHIN_ART = art(`
.u.u.
uUUUu
.UuU.
uUUUu
.u.u.
`, { U: '#7a4a9e', u: '#4a2a66' }, '#24122e');
const WORM_ART = [`
.pppppppp.
pPPPPPPPPp
pPwPPPPPPp
.pppppppp.
`, `
..pppppp..
.pPPPPPPp.
pPwPPPPPPPp
.ppp..pppp.
`].map(rows => art(rows.split('\n').map(r => r.padEnd(11, '.')).join('\n'), { P: '#f2a2aa', p: '#d07080', w: '#fbd8dc' }, '#7a2a3a'));
const STAR = art(`
..o..
ooooo
.ooo.
o...o
`, { o: '#e8702a' }, '#6a2a10');
const BANG = art(`
#
#
#
.
#
`, { '#': '#ffd75e' }, '#5a3a10');

function shore(W, H, hx) {
  const p = new Painter(W, H), r = rng(37);
  const sky = gradient(W, H, [['#6a9ad0', 0], ['#9ab8d8', 0.2], ['#f0d8a8', 0.42], ['#5e86a8', 0.46], ['#7aa0b8', 0.56], ['#9a8a62', 0.6], ['#8a7a56', 0.8], ['#7a6a4a', 1]]);
  p.data.set(sky.data);
  for (let y = HORIZON + 2; y < FLAT; y += 3) for (let x = (y * 7) % 11; x < W; x += 9 + (y % 5)) p.px(x, y, '#d4e0e4');   // surf far out
  for (let y = FLAT; y < H; y++) for (let x = 0; x < W; x++) {                      // the wet flat, shining gold where it holds water
    const sheen = Math.sin(x * 0.05 + y * 0.9) + Math.sin(x * 0.013 - y * 0.2) > 1.1;
    if (sheen) p.px(x, y, y < 68 ? '#f0d8a8' : (x + y) % 2 ? '#c8b088' : '#d8c098');
    else if ((x * 3 + y * 7) % 19 === 0) p.px(x, y, '#6a5a3e');
  }
  const top = ridge(W, 0, [[2, 3, 0.7], [1.5, 9, 2.1]]);
  const rockAt = (x0, w, t0, x) => t0 + Math.round(top[x] + ((x - x0) / w - 0.5) ** 2 * 4 * 10);
  for (const [x0, w, t0] of [[-8, Math.round(W * 0.3), 70], [Math.round(W * 0.78), 70, 78], [Math.round(W * 0.6), 18, 84]]) {   // rocks, weed on top, mussels below
    for (let x = Math.max(0, x0); x < Math.min(W, x0 + w); x++) {
      const tt = rockAt(x0, w, t0, x);
      for (let y = tt; y < H; y++) {
        const d = y - tt, v = r();
        p.px(x, y, d === 0 ? '#6e6e70' : d < 3 && v < 0.6 ? (v < 0.3 ? '#5e7a32' : '#7a8a3a') : y > 88 && v < 0.4 ? '#1e2430' : (x * 5 + y) % 7 === 0 ? '#2e2e34' : '#44444a');
      }
    }
  }
  for (let n = 0; n < W / 30; n++) {                                               // strands of kelp left on the sand
    const x0 = Math.floor(r() * W), y0 = FLAT + 8 + Math.floor(r() * 24);
    for (let k = 0; k < 10; k++) p.px(x0 + k, y0 + Math.round(Math.sin(k * 0.9 + x0) * 1.2), k % 3 ? '#5a4a22' : '#7a6a2a');
  }
  const px0 = hx + 22, pw = 24;                                                    // the tide pool: a rim of rock round still water
  for (let j = -4; j <= 4; j++) for (let i = -pw / 2 - 3; i <= pw / 2 + 3; i++) {
    const d = (i * i) / ((pw / 2 + 3) ** 2) + (j * j) / 16;
    if (d > 1) continue;
    const inner = (i * i) / ((pw / 2) ** 2) + ((j + 1) * (j + 1)) / 6 < 1;
    p.px(px0 + pw / 2 + i, GROUND - 1 + j, inner ? (j < 0 ? '#9ac8d4' : '#5a9aa8') : (i + j) % 3 ? '#4a4a50' : '#5a5a60');
  }
  for (const [ax, col] of [[4, '#4ab070'], [9, '#e870a0'], [18, '#4ab070']]) {      // anemones round its edge
    p.px(px0 + ax, GROUND - 2, col); p.px(px0 + ax + 1, GROUND - 2, col); p.px(px0 + ax, GROUND - 3, col);
  }
  for (let n = 0; n < W / 14; n++) {                                               // ripples and shells in the sand
    const x = Math.floor(r() * W), y = FLAT + 6 + Math.floor(r() * (H - FLAT - 8));
    p.px(x, y, '#e8e0cc'); p.px(x + 1, y, '#8a7a5a');
  }
  return p;
}

export function buildTide(W, H = 96) {
  const hx = Math.round(W * 0.34);
  return { W, H, hx, pool: hx + 22, burrow: hx + 52, layers: { shore: shore(W, H, hx) } };
}

export function renderTide(ctx, t, s, env) {
  const { W, H, canvases: c, hx, pool, burrow } = s, state = burrowAt(t);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.shore, 0, 0);
  ctx.drawImage(env.art(STAR), pool + 13, GROUND - 4);
  const hero = env.hero('tide', 'walk'), x = hx - hero.anchorX, y = GROUND - hero.footY, [bx, by] = hero.hands[1];
  const bucket = [x + bx, y + by + 1];                                            // the top of the bucket
  const hop = (from, u) => [Math.round(from[0] + (bucket[0] - from[0]) * u), Math.round(from[1] + (bucket[1] - 4 - from[1]) * u - Math.sin(u * Math.PI) * 12)];
  if (t < URCHIN) ctx.drawImage(env.art(URCHIN_ART), pool + 6, GROUND - 5);       // the urchin, in the pool, then into the bucket
  else if (t < URCHIN + HOP) { const [ux, uy] = hop([pool + 6, GROUND - 5], (t - URCHIN) / HOP); ctx.drawImage(env.art(URCHIN_ART), ux, uy); }
  ctx.fillStyle = '#5a4a32'; ctx.fillRect(burrow, GROUND - 1, 3, 1);              // the burrow's mouth
  if (state === 'digging') {                                                       // wet sand spurting out of it
    for (let k = 0; k < 10; k++) {
      const u = ((t - DIG[0]) * 3 + k / 10) % 1, dir = k % 2 ? 1 : -1;
      ctx.fillStyle = k % 3 ? '#4a3a26' : '#6a5436';
      ctx.fillRect(Math.round(burrow + 1 + dir * u * (6 + k)), Math.round(GROUND - 2 - Math.sin(u * Math.PI) * (8 + k % 4)), 2, 2);
    }
  }
  if (state === 'worm') {
    const u = Math.min(1, (t - WORM) / 0.12), wx = burrow - 3, wy = GROUND - 4 - Math.round(u * 4);
    if (t < BAG - HOP) ctx.drawImage(env.art(WORM_ART[Math.floor(t * 10) % 2]), wx, wy);   // out, and wriggling
    else { const [qx, qy] = hop([wx, wy], (t - (BAG - HOP)) / HOP); ctx.drawImage(env.art(WORM_ART[0]), qx, qy); }
  }
  ctx.drawImage(hero.canvases[1], x, y);
  const dog = env.dog('lifevest', 'wait'), startled = state === 'worm' && t < WORM + 0.35;
  const back = state === 'worm' || state === 'gone' ? Math.min(6, Math.round((t - WORM) * 40)) : 0, jump = startled ? Math.round(Math.sin((t - WORM) / 0.35 * Math.PI) * 5) : 0;
  const dx = burrow + 10 + back;                                                   // the dog, facing the burrow
  ctx.save(); ctx.translate(2 * dx + 24, 0); ctx.scale(-1, 1);
  ctx.drawImage(dog.canvases[Math.floor(t * 6) % 2], dx, GROUND - dog.footY - jump);
  ctx.restore();
  if (startled) ctx.drawImage(env.art(BANG), dx + 6, GROUND - dog.footY - jump - 9);
}

export const tide = { build: buildTide, render: renderTide };
```

- [ ] **Step 4: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 197`, `ℹ fail 0`, then 16 `ok` lines and exit 0.

- [ ] **Step 5: Commit**

```bash
git add reel/ch4/tide.js tests/reel/ch4-tide.test.js
git commit -m "feat(reel): Add the tide pools: an urchin, and an innkeeper worm out of its burrow"
```

---

### Task 7: The kelp forest and the scuba dive

**Files:**
- Create: `reel/ch4/sea.js`, `reel/ch4/scuba.js`
- Test: `tests/reel/ch4-scuba.test.js` (new)

**Interfaces:**
- Consumes: the `swim` pose (Task 2) for `scuba`; `Painter`, `rng`; `gradient`, `tile`, `art`.
- Produces, in `sea.js`:
  - `WATER`: the water's gradient stops
  - `kelp(TW, H, seed, every, cols)`: a Painter of giant kelp, with stalks every `every` px or so, blades with floats, and a canopy along the surface. `cols` is `[blade, stalk, float]`.
  - `reef(TW, H)`: the rocky bottom from row 84, with urchins, anemones and sea stars
  - `rays(ctx, W, off)`: light slanting down from the surface
  - `surface(ctx, W, t, y = 1)`: the surface seen from below, rippling at row `y`
- Produces: `scuba`, a scene with layers `water`, `far`, `mid`, `reef` and `near`.
  - `far` and `mid` are drawn behind Yimeng, `near` in front.
  - The camera swims at 30 px/s, with parallax 0.3, 0.6, 1 and 1.25.
  - It exposes `hx = round(0.3 W)` and `school`, the blacksmith.

- [ ] **Step 1: Write the failing test.** Create `tests/reel/ch4-scuba.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { scuba } from '../../reel/ch4/scuba.js';

sceneContract('ch4 scuba', scuba, 1.4);

const names = (t) => frameAt(scuba, 480, t).ctx.calls.filter(c => c[0] === 'drawImage').map(c => c[1]);

test('scuba: Yimeng swims through the kelp in the scuba gear, kicking', () => {
  const a = names(0.1).filter(n => n.startsWith('scuba:swim:')), b = names(0.3).filter(n => n.startsWith('scuba:swim:'));
  assert.equal(a.length, 1);
  assert.notEqual(a[0], b[0], 'the fins kick');
});

test('scuba: kelp at three depths, the near stalks passing in front of Yimeng', () => {
  const n = names(0.7), hero = n.findIndex(x => x.startsWith('scuba:swim:'));
  assert.ok(n.indexOf('far') < hero && n.indexOf('mid') < hero && n.indexOf('near') > hero);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/reel/ch4-scuba.test.js`
Expected: the file fails to load (`Cannot find module …/reel/ch4/scuba.js`).

- [ ] **Step 3: Implement the sea.** Create `reel/ch4/sea.js`:

```js
// The underwater sets chapter 4's dives share: the water, giant kelp, the rocky reef, light from the
// surface.
import { Painter, rng } from '../pixels.js';

export const WATER = [['#7ac8d8', 0], ['#4aa0bc', 0.12], ['#2a7a9a', 0.4], ['#1a5a7a', 0.7], ['#10405a', 1]];

// A layer of giant kelp: wavy stalks from the reef to the surface, blades off them with a float at
// each base, and the blades spreading into a canopy along the surface.
export function kelp(TW, H, seed, every, cols) {
  const p = new Painter(TW, H), r = rng(seed);
  for (let x0 = Math.floor(r() * every); x0 < TW; x0 += every + Math.floor(r() * every * 0.7)) {
    const ph = r() * 6, bend = 2 + r() * 3;
    const at = (y) => Math.round(x0 + Math.sin(y * 0.045 + ph) * bend);
    for (let y = 3; y < H; y++) p.wpx(at(y), y, cols[1]);
    for (let y = 8 + Math.floor(r() * 5), side = 1; y < H - 6; y += 5 + Math.floor(r() * 3), side = -side) {
      const len = 5 + Math.floor(r() * 5), x = at(y);
      p.wpx(x + side, y, cols[2]); p.wpx(x + side, y + 1, cols[2]);                 // the float
      for (let k = 1; k <= len; k++) { p.wpx(x + side * (1 + k), y - Math.round(k * 0.7), cols[0]); p.wpx(x + side * (1 + k), y - Math.round(k * 0.7) + 1, cols[1]); }
    }
    for (let k = -10; k <= 10; k++) p.wpx(at(3) + k, 3 + Math.round(Math.abs(k) * 0.15) + (k % 3 === 0 ? 1 : 0), k % 2 ? cols[0] : cols[1]);   // the canopy
  }
  return p;
}

export function reef(TW, H) {
  const p = new Painter(TW, H), r = rng(71);
  for (let x = 0; x < TW; x++) {
    const top = 84 + Math.round(Math.sin(x * 0.07) * 2 + Math.sin(x * 0.19 + 1) * 1.5);
    for (let y = top; y < H; y++) p.px(x, y, y === top ? '#5a6a6a' : (x * 3 + y * 5) % 7 === 0 ? '#2a3a40' : '#3a4a50');
  }
  for (let n = 0; n < TW / 7; n++) {                                               // urchins, anemones and sea stars on it
    const x = Math.floor(r() * TW), y = 84 + Math.round(Math.sin(x * 0.07) * 2 + Math.sin(x * 0.19 + 1) * 1.5) - 1, k = r();
    if (k < 0.5) { p.px(x, y, '#4a2a66'); p.px(x + 1, y, '#6b3f8f'); p.px(x, y - 1, '#6b3f8f'); p.px(x + 1, y - 1, '#4a2a66'); }
    else if (k < 0.75) { p.px(x, y, '#e8a0b0'); p.px(x, y - 1, '#f0c0c8'); p.px(x + 1, y - 1, '#e8a0b0'); }
    else p.px(x, y, '#e8702a');
  }
  return p;
}

// Light slanting down from the surface, drifting with the camera.
export function rays(ctx, W, off) {
  ctx.globalAlpha = 0.12; ctx.fillStyle = '#e8fbff';
  for (let k = 0; k < Math.ceil(W / 70) + 2; k++) {
    const x0 = ((k * 70 - off) % (W + 140) + W + 140) % (W + 140) - 70;
    for (let y = 0; y < 80; y++) ctx.fillRect(Math.round(x0 + y * 0.35), y, 6 + Math.round(y / 20), 1);
  }
  ctx.globalAlpha = 1;
}

// The surface seen from below, rippling, at row y.
export function surface(ctx, W, t, y = 1) {
  ctx.fillStyle = '#d8f4fa';
  for (let x = 0; x < W; x++) if ((x + Math.floor(t * 12)) % 7 < 4) ctx.fillRect(x, Math.round(y + Math.sin(x * 0.2 + t * 3)), 1, 1);
}
```

- [ ] **Step 4: Implement the dive.** Create `reel/ch4/scuba.js`:

```js
// Chapter 4, shot 7: scuba in a kelp forest. Golden kelp rises from the reef to the bright surface,
// light slanting down between the stalks. Yimeng swims through it in the black wetsuit, the tank on
// the back, bubbles going up; a school of blacksmith drifts by and a garibaldi, bright orange,
// turns away over the urchins on the reef.
import { rng } from '../pixels.js';
import { gradient, tile, art } from '../kit.js';
import { WATER, kelp, reef, rays, surface } from './sea.js';

const V = 30;                                // the swim, px/s at the reef
const MID = 46;                              // Yimeng's centre line

const GARIBALDI = art(`
..ooo....
.oooooo.o
oKoooooOo
.oooooo.o
..ooo....
`, { o: '#ff7a1a', O: '#ffb060', K: '#1a1214' }, '#7a2a08');
const BLACKSMITH = art(`
.bb.b
bKbbb
.ss.b
`, { b: '#3a4a6a', s: '#8a9ab0', K: '#0a0a12' }, null);

export function buildScuba(W, H = 96) {
  const TW = W * 2, rd = rng(83);
  const school = Array.from({ length: 14 }, () => [rd() * 40, rd() * 18, rd() * 6]);
  return {
    W, H, TW, hx: Math.round(W * 0.3), school,
    layers: {
      water: gradient(W, H, WATER),
      far: kelp(TW, H, 5, 24, ['#3e7a6a', '#346a5e', '#4a8a72']),
      mid: kelp(TW, H, 9, 46, ['#9a7a2a', '#7a5e22', '#c8a03a']),
      reef: reef(TW, H),
      near: kelp(TW, H, 17, 150, ['#b8902e', '#8a6a22', '#e0b84a']),
    },
  };
}

export function renderScuba(ctx, t, s, env) {
  const { W, H, canvases: c, hx } = s, run = t * V;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.water, 0, 0);
  rays(ctx, W, run * 0.2);
  surface(ctx, W, t);
  tile(ctx, c.far, run * 0.3, 0);
  s.school.forEach(([fx, fy, ph], i) => {                                          // the blacksmith, drifting together
    const x = ((W * 0.75 + fx - run * 0.45 - t * 6) % (W + 60) + W + 60) % (W + 60) - 30, y = 24 + fy + Math.sin(t * 2 + ph) * 1.5;
    ctx.drawImage(env.art(BLACKSMITH), Math.round(x), Math.round(y));
  });
  tile(ctx, c.mid, run * 0.6, 0);
  tile(ctx, c.reef, run, 0);
  const gx = Math.round(W * 0.85 - t * 40 - run * 0.2), gy = Math.round(72 + Math.sin(t * 4) * 2);   // the garibaldi, heading off the other way
  ctx.drawImage(env.art(GARIBALDI), gx, gy);
  const hero = env.hero('scuba', 'swim'), f = Math.floor(t * 8) % 4, bob = Math.round(Math.sin(t * 2.5) * 1.5);
  const x = hx - hero.anchorX, y = MID + bob - hero.footY;
  ctx.drawImage(hero.canvases[f], x, y);
  ctx.fillStyle = '#e8fbff';                                                       // bubbles from the regulator, in breaths
  for (let k = 0; k < 9; k++) {
    const age = (t * 1.6 + k / 9) % 1, bx = x + hero.width - 4 + Math.round(Math.sin(age * 9 + k) * 1.5 - age * 6), by = Math.round(y + 20 - age * 40);
    if ((k % 3) !== 2 || age > 0.3) ctx.fillRect(bx, by, k % 2 + 1, k % 2 + 1);
  }
  tile(ctx, c.near, run * 1.25, 0);
}

export const scuba = { build: buildScuba, render: renderScuba };
```

- [ ] **Step 5: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 201`, `ℹ fail 0`, then 16 `ok` lines and exit 0.

- [ ] **Step 6: Commit**

```bash
git add reel/ch4/sea.js reel/ch4/scuba.js tests/reel/ch4-scuba.test.js
git commit -m "feat(reel): Add the kelp forest and the scuba dive"
```

---

### Task 8: Freediving and the speargun

**Files:**
- Create: `reel/ch4/freedive.js`
- Test: `tests/reel/ch4-freedive.test.js` (new)

**Interfaces:**
- Consumes: the `swim` pose for `freedive` and its `hands` (Task 2); `WATER`, `kelp`, `reef`, `rays` and `surface` (Task 7); `gradient`, `art`.
- Produces: `DIVE = [0.25, 0.85]` and `FIRE = 1.25`.
- Produces: `diverAt(s, t) → { x, y }`, the feet's column and the centre line.
  - Yimeng breathes at the surface, with the centre line at row 13.
  - Over `DIVE`, Yimeng dives to row 62 and from `s.x0` to `s.x1`.
  - After that Yimeng drifts on at 8 px/s.
- Produces: `spearAt(t)`, how far the spear has flown: 0 before `FIRE`, then 260 px/s.
- Produces: `tipAt(s, t, hero)`, the spear tip's column for a swimmer sprite, and `sheepheadAt(s, t)`, the fish's left edge.
- Produces: `SHEEPHEAD`, 2 frames of the fish facing left, which the sunset reuses.
- Produces: `freedive`, a scene with layers `water` (a sliver of sky above the surface at row 10), `far`, `mid` and `reef`, all still.
  - It exposes `x0`, `x1` and `fishX`.
  - On a phone, `x1 = W - 170` keeps Yimeng to the left, and `fishX` is held to `W - 21`. That way `tipAt(s, 1.5) < sheepheadAt(s, 1.5)` at every width.

- [ ] **Step 1: Write the failing test.** Create `tests/reel/ch4-freedive.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract } from './fake-canvas.js';
import { heroSprite } from '../../reel/hero.js';
import { freedive, diverAt, spearAt, tipAt, sheepheadAt, FIRE } from '../../reel/ch4/freedive.js';

sceneContract('ch4 freedive', freedive, 1.5);

test('freedive: from a breath at the surface, down through the kelp, level over the reef', () => {
  const s = freedive.build(480, 96);
  assert.ok(diverAt(s, 0.1).y <= 14, 'at the surface');
  assert.ok(diverAt(s, 0.5).y > 20 && diverAt(s, 0.5).y < 60, 'diving');
  assert.equal(diverAt(s, 1).y, 62);
});

test('freedive: the spear stays in the gun until Yimeng fires, and the scene cuts before it reaches the fish', () => {
  assert.equal(spearAt(FIRE - 0.01), 0);
  assert.ok(spearAt(FIRE + 0.1) > 0);
  const swimmer = heroSprite('freedive', 'swim');
  for (const W of [195, 480, 640]) {
    const s = freedive.build(W, 96);
    assert.ok(tipAt(s, 1.5, swimmer) < sheepheadAt(s, 1.5), `W=${W}`);
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/reel/ch4-freedive.test.js`
Expected: the file fails to load (`Cannot find module …/reel/ch4/freedive.js`).

- [ ] **Step 3: Implement.** Create `reel/ch4/freedive.js`:

```js
// Chapter 4, shot 8: freediving. Yimeng, in the kelp-camo wetsuit and long fins, breathes at the
// surface, then dives down through the kelp to the reef, the speargun out in front. A California
// sheephead noses along the rocks ahead; Yimeng levels off, aims and fires, and the scene cuts while
// the spear is still on its way.
import { gradient, art } from '../kit.js';
import { WATER, kelp, reef, rays, surface } from './sea.js';

const SURF = 10;                             // the surface's row
export const DIVE = [0.25, 0.85], FIRE = 1.25;
const SPEAR = 260;                           // the spear's speed, px/s
const GUN = 22;                              // the gun's length from the hand

// Where Yimeng is: the feet's column and the centre line, at the surface, diving, then level.
export function diverAt(s, t) {
  const u = Math.min(1, Math.max(0, (t - DIVE[0]) / (DIVE[1] - DIVE[0]))), e = u * u * (3 - 2 * u);
  const level = Math.max(0, t - DIVE[1]) * 8;
  return { x: Math.round(s.x0 + (s.x1 - s.x0) * e + level), y: Math.round(SURF + 3 + (62 - SURF - 3) * e + (t < DIVE[0] ? Math.sin(t * 6) : 0)) };
}

// How far the spear has flown (0 until Yimeng fires), where its tip is for a swimmer sprite, and
// where the sheephead is.
export const spearAt = (t) => (t < FIRE ? 0 : (t - FIRE) * SPEAR);
export const tipAt = (s, t, hero) => diverAt(s, t).x - hero.anchorX + hero.hands[0][0] + 18 + 3 + GUN + spearAt(t);
export const sheepheadAt = (s, t) => Math.round(s.fishX - t * 10);

// A California sheephead, facing left: black head with a white chin, the red-pink middle, a black tail.
// The sunset shot holds it up on the spear.
export const SHEEPHEAD = [`
.......kkkkkk........
....kkkkkrrrrrrr...kk
..kkKkkkrrrrrrrrrkkk.
.kkkkkkrrrrrrrrrrkkk.
wwkkkkkrrrrrrrrrrkkkk
.wwwkkkrrrrrrrrrr..kk
...wwwkkrrrrrrr......
`, `
.......kkkkkk........
....kkkkkrrrrrrr.....
..kkKkkkrrrrrrrrrkkkk
.kkkkkkrrrrrrrrrrkkk.
wwkkkkkrrrrrrrrrrkkk.
.wwwkkkrrrrrrrrrrkkkk
...wwwkkrrrrrrr......
`].map(rows => art(rows, { k: '#1e1a1e', K: '#f0e8d8', r: '#e05a72', w: '#f4f1ea' }, '#0e0a0e'));

export function buildFreedive(W, H = 96) {
  // on a phone Yimeng keeps to the left and the fish to the right edge, so the cut still comes first
  const x1 = Math.min(Math.round(W * 0.28), W - 170), x0 = Math.round(x1 * 0.57);
  const water = gradient(W, H, [['#bfe6f2', 0], ['#9ad0e8', 0.09], ...WATER.map(([c, v]) => [c, 0.11 + v * 0.89])]);
  return {
    W, H, x0, x1, fishX: Math.min(W - 21, Math.max(Math.round(W * 0.62), x1 + 150)),
    layers: { water, far: kelp(W, H, 23, 26, ['#3e7a6a', '#346a5e', '#4a8a72']), mid: kelp(W, H, 41, 70, ['#9a7a2a', '#7a5e22', '#c8a03a']), reef: reef(W, H) },
  };
}

export function renderFreedive(ctx, t, s, env) {
  const { W, H, canvases: c } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.water, 0, 0);
  rays(ctx, W, t * 4);
  ctx.drawImage(c.far, 0, 0);
  surface(ctx, W, t, SURF);
  ctx.drawImage(c.mid, 0, 0);
  ctx.drawImage(c.reef, 0, 0);
  ctx.drawImage(env.art(SHEEPHEAD[Math.floor(t * 5) % 2]), sheepheadAt(s, t), Math.round(64 + Math.sin(t * 3) * 1.5));   // the sheephead, nosing along
  const hero = env.hero('freedive', 'swim'), { x: dx, y: dy } = diverAt(s, t), f = Math.floor(t * 7) % 4;
  const x = dx - hero.anchorX, y = dy - hero.footY, [sx, sy] = hero.hands[f];
  if (t > DIVE[0] && t < DIVE[0] + 0.3) {                                          // the splash of the duck dive
    ctx.fillStyle = '#f4fbff';
    for (let k = 0; k < 8; k++) ctx.fillRect(Math.round(s.x0 + 20 + k * 3 - 6), SURF - 1 - ((k * 5) % 3) - Math.round((t - DIVE[0]) * 10), 1, 1);
  }
  ctx.drawImage(hero.canvases[f], x, y);
  const hx = x + sx + 18, hy = y + sy + 1;                                         // the arm out in front, under the chin, the gun in hand
  ctx.fillStyle = '#2a3326'; ctx.fillRect(x + sx, y + sy, 19, 3);
  ctx.fillStyle = '#3e4a36'; ctx.fillRect(x + sx, y + sy, 18, 2);
  ctx.fillStyle = '#2a2a30'; ctx.fillRect(hx - 2, hy, 9, 2); ctx.fillRect(hx + 7, hy, GUN - 7, 1);
  const flown = spearAt(t);
  ctx.fillStyle = '#c8ccd2'; ctx.fillRect(Math.round(hx + 2 + flown), hy - 1, GUN + 1, 1);   // the spear, then on its way
  ctx.fillStyle = '#e8eef2'; ctx.fillRect(Math.round(hx + 3 + GUN + flown), hy - 1, 2, 1);
  if (t >= FIRE) {
    ctx.fillStyle = '#e8fbff';
    for (let k = 0; k < 10; k++) { const bx = hx + GUN + k * flown / 10; ctx.fillRect(Math.round(bx), hy - 2 - (k % 3) - Math.round((t - FIRE) * 12 * (1 - k / 10)), 1, 1); }
    ctx.fillStyle = '#8a8e96'; ctx.fillRect(hx + GUN, hy, Math.round(flown), 1);   // the shooting line paying out
  }
}

export const freedive = { build: buildFreedive, render: renderFreedive };
```

- [ ] **Step 4: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 205`, `ℹ fail 0`, then 16 `ok` lines and exit 0.

- [ ] **Step 5: Commit**

```bash
git add reel/ch4/freedive.js tests/reel/ch4-freedive.test.js
git commit -m "feat(reel): Add the freedive and the speargun shot"
```

---

### Task 9: Surfacing at sunset

**Files:**
- Create: `reel/ch4/sunset.js`
- Test: `tests/reel/ch4-sunset.test.js` (new)

**Interfaces:**
- Consumes: `SHEEPHEAD` (Task 8); the `freedive` outfit standing, with its gun at the hand; the dog's `lifevest` coat in `wait`, mirrored; `Painter`, `bandColor`, `rng`; `art`.
- Produces: `UP = [0.3, 0.6]` and `riseAt(t)`. It is 0 while Yimeng is under, rises with an ease-out over `UP`, and is 1 once Yimeng is up.
- Produces: `sunset`, a scene with one layer, `scene`: the sky, the half-set sun at `sx = round(0.3 W)`, the sea and the rocks from `0.64 W`.
  - It exposes `sx`, `hx = round(0.34 W)`, `dog` and `dogY`, where the dog stands on the rocks, and `glitter`.
  - Yimeng is drawn clipped above the waterline at row 82, with the sheephead on the spear.
  - A heart rises over the dog from 0.8 s.

- [ ] **Step 1: Write the failing test.** Create `tests/reel/ch4-sunset.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { sunset, riseAt } from '../../reel/ch4/sunset.js';

sceneContract('ch4 sunset', sunset, 2);

test('sunset: Yimeng comes up out of the sea, and stays up', () => {
  assert.equal(riseAt(0.2), 0);
  assert.ok(riseAt(0.45) > 0 && riseAt(0.45) < 1);
  assert.equal(riseAt(0.7), 1);
});

test('sunset: Yimeng in the camo wetsuit with the catch, and the dog on the rocks, a heart over it', () => {
  const names = frameAt(sunset, 480, 1.1).ctx.calls.filter(c => c[0] === 'drawImage').map(c => c[1]);
  assert.ok(names.includes('freedive:walk:1'));
  assert.ok(names.some(n => /^dog:lifevest:wait:\d$/.test(n)));
  assert.equal(names.filter(n => n === 'art').length, 2, 'the sheephead and the heart');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/reel/ch4-sunset.test.js`
Expected: the file fails to load (`Cannot find module …/reel/ch4/sunset.js`).

- [ ] **Step 3: Implement.** Create `reel/ch4/sunset.js`:

```js
// Chapter 4, shot 9: surfacing at sunset. The sun half down into the Pacific, its light laid across
// the water. Yimeng comes up out of the sea in the camo wetsuit, the sheephead on the spear, facing
// the rocks where the dog has been waiting in its life vest. The dog wags and hops, and a heart pops up.
import { Painter, bandColor, rng } from '../pixels.js';
import { art } from '../kit.js';
import { SHEEPHEAD } from './freedive.js';

const HORIZON = 54, WATER = 82;              // the horizon; the waterline round Yimeng's waist, in the shallows by the rocks
export const UP = [0.3, 0.6];                // Yimeng surfaces
const HEART_AT = 0.8;
const SKY = [['#29264f', 0], ['#3a3264', 0.14], ['#573d72', 0.28], ['#84497c', 0.41], ['#b25b7e', 0.53],
  ['#d67274', 0.64], ['#ec8f69', 0.74], ['#f5ad68', 0.83], ['#fbcd84', 0.92]];
const SEA = [['#4a3a6a', 0], ['#3b4c85', 0.25], ['#34447a', 0.6], ['#2a3866', 1]];

const HEART = art(`
.##.##.
#######
.#####.
..###..
...#...
`, { '#': '#e8607a' }, '#7a1e30');

// How far out of the water Yimeng is (0 under, 1 up), easing out as Yimeng breaks the surface.
export const riseAt = (t) => { const u = Math.min(1, Math.max(0, (t - UP[0]) / (UP[1] - UP[0]))); return 1 - (1 - u) ** 2; };

function sunsetSea(W, H, sx) {
  const p = new Painter(W, H), r = rng(29);
  for (let y = 0; y <= HORIZON; y++) for (let x = 0; x < W; x++) p.px(x, y, bandColor(SKY, y / HORIZON, x, y));
  for (let j = -10; j <= 10; j++) for (let i = -10; i <= 10; i++) {                // the sun, half set
    const d = Math.hypot(i, j), y = HORIZON - 2 + j;
    if (y > HORIZON) continue;
    if (d <= 7) p.px(sx + i, y, d > 6 ? '#ffe293' : '#fff5cf');
    else if (d <= 10 && (i + j) % 2 === 0) p.px(sx + i, y, '#fcd99a');
  }
  for (let y = HORIZON + 1; y < H; y++) for (let x = 0; x < W; x++) p.px(x, y, bandColor(SEA, (y - HORIZON) / (H - HORIZON), x, y));
  for (let n = 0; n < W / 3; n++) {                                                // swell lines, warmer near the sun's path
    const y = HORIZON + 2 + Math.floor(Math.pow(r(), 1.3) * (H - HORIZON - 3)), x = Math.floor(r() * W), len = 2 + Math.floor(r() * 6);
    for (let k = 0; k < len; k++) p.wpx(x + k, y, Math.abs(x - sx) < 20 + (y - HORIZON) ? '#c87a7a' : '#5a6aa0');
  }
  const rx = Math.round(W * 0.64), top = (x) => 66 + Math.round(Math.sin(x * 0.11) * 2 + ((x - rx) < 10 ? (10 - (x - rx)) ** 1.5 * 0.6 : 0));
  for (let x = rx; x < W; x++) for (let y = top(x); y < H; y++) {                  // the rocks, dark against the sunset, lit along the top
    const d = y - top(x), seam = Math.abs(Math.sin(x * 0.09 + y * 0.05) * 9 + Math.sin(x * 0.31) * 2 - (y - 70)) < 0.6;
    p.px(x, y, d === 0 ? '#c87a5a' : d === 1 ? '#7a4a4a' : seam ? '#4a3242' : y > WATER - 2 && (x + y) % 3 === 0 ? '#3a3050' : (x * 3 + y * 5) % 11 === 0 ? '#1e1624' : '#2e2232');
  }
  for (let x = rx - 6; x < rx + 3; x++) for (let y = WATER - 2; y < WATER + 1; y++) p.px(x, y, (x + y) % 2 ? '#2e2232' : '#3a2a3a');   // a boulder at the foot
  return { p, rockTop: top };
}

export function buildSunset(W, H = 96) {
  const sx = Math.round(W * 0.3), { p, rockTop } = sunsetSea(W, H, sx), rd = rng(3);
  const glitter = Array.from({ length: 60 }, () => { const y = HORIZON + 1 + Math.floor(Math.pow(rd(), 1.4) * (H - HORIZON - 2)); return [sx + (rd() - 0.5) * (8 + (y - HORIZON) * 1.6), y, rd()]; });
  const dog = Math.round(W * 0.64) + 6;
  return { W, H, sx, hx: Math.round(W * 0.34), dog, dogY: rockTop(dog + 12), glitter, layers: { scene: p } };
}

export function renderSunset(ctx, t, s, env) {
  const { W, H, canvases: c, hx } = s, rise = riseAt(t), up = t >= UP[1];
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.scene, 0, 0);
  const tick = Math.floor(t * 6);
  s.glitter.forEach(([x, y, b], n) => {                                            // the sun's path, glittering
    if (((n * 7 + tick) % 5) < 2 && x < Math.round(W * 0.64)) { ctx.fillStyle = b > 0.6 ? '#fff4c8' : '#ffd27e'; ctx.fillRect(Math.round(x), y, b > 0.8 ? 2 : 1, 1); }
  });
  const hero = env.hero('freedive', 'walk'), bob = up ? Math.round(Math.sin(t * 3)) : 0;
  const x = hx - hero.anchorX, y = WATER - 38 + Math.round((1 - rise) * 34) + bob, [gx, gy] = hero.hands[1];
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, WATER); ctx.clip();               // only what is above the water
  ctx.drawImage(hero.canvases[1], x, y);
  ctx.drawImage(env.art(SHEEPHEAD[0]), x + gx + 6, y + gy - 4);                    // the catch, on the spear
  ctx.restore();
  ctx.fillStyle = '#f4e8e0';                                                       // the waterline round Yimeng, and the splash
  for (let k = 0; k < 7; k++) ctx.fillRect(hx + k * 3 - 1, WATER + (k % 2), 2, 1);
  if (t > UP[0] && t < UP[1] + 0.3) {
    const u = (t - UP[0]) / (UP[1] + 0.3 - UP[0]);
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI; ctx.fillRect(Math.round(hx + 9 + Math.cos(a) * u * 16), Math.round(WATER - Math.sin(a) * u * 10 * (1 - u)), 1, 1); }
  }
  const dog = env.dog('lifevest', 'wait'), hop = up && Math.floor(t * 8) % 2 ? 2 : 0;   // the dog on the rocks, facing Yimeng
  ctx.save(); ctx.translate(2 * s.dog + 24, 0); ctx.scale(-1, 1);
  ctx.drawImage(dog.canvases[Math.floor(t * (up ? 10 : 3)) % 2], s.dog, s.dogY - dog.footY - hop);
  ctx.restore();
  if (t > HEART_AT) {
    const u = Math.min(1, (t - HEART_AT) / 0.8);
    ctx.globalAlpha = 1 - u * u; ctx.drawImage(env.art(HEART), s.dog + 6, Math.round(s.dogY - 24 - u * 10)); ctx.globalAlpha = 1;
  }
}

export const sunset = { build: buildSunset, render: renderSunset };
```

- [ ] **Step 4: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 209`, `ℹ fail 0`, then 16 `ok` lines and exit 0.

- [ ] **Step 5: Commit**

```bash
git add reel/ch4/sunset.js tests/reel/ch4-sunset.test.js
git commit -m "feat(reel): Add surfacing at sunset, the catch held up to the dog"
```

---

### Task 10: Chapter 4 complete

**Files:**
- Modify: `reel/ch4/index.js`, `tests/reel/page-check.sh`, `docs/superpowers/specs/2026-10-03-life-reel-design.md`
- Test: `tests/reel/ch4-chapter.test.js`

**Interfaces:**
- Consumes: `forest`, `fishing`, `tide`, `scuba`, `freedive` and `sunset` (Tasks 4–9).
- Produces: `CHAPTER_4`, the nine shots in the Global Constraints table.

- [ ] **Step 1: Write the failing test.** Replace `tests/reel/ch4-chapter.test.js` with:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTER_4 } from '../../reel/ch4/index.js';

test('chapter 4 runs from the arrival to the sunset, 16.9 s', () => {
  assert.equal(CHAPTER_4.name, 'California');
  assert.deepEqual(CHAPTER_4.shots.map(s => s.id), ['ch4-arrive', 'ch4-office', 'ch4-ranch', 'ch4-forest', 'ch4-fishing', 'ch4-tide', 'ch4-scuba', 'ch4-freedive', 'ch4-sunset']);
  assert.ok(CHAPTER_4.shots.every(s => s.caption === 'California'));
  assert.equal(Math.round(CHAPTER_4.shots.reduce((a, s) => a + s.duration, 0) * 10) / 10, 16.9);
  const shot = Object.fromEntries(CHAPTER_4.shots.map(s => [s.id, s]));
  assert.ok(!shot['ch4-arrive'].fadeIn, 'it opens straight from the map, in full colour');
  assert.ok(!shot['ch4-ranch'].fadeOut && !shot['ch4-forest'].fadeIn, 'the scope hard-cuts away');
  assert.ok(!shot['ch4-freedive'].fadeOut && !shot['ch4-sunset'].fadeIn, 'and so does the spear');
  assert.ok(shot['ch4-sunset'].fadeOut > 0, 'the sunset fades out');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/reel/ch4-chapter.test.js`
Expected: 1 failure in `chapter 4 runs from the arrival to the sunset, 16.9 s` (the shot ids).

- [ ] **Step 3: Implement.** Replace `reel/ch4/index.js` with:

```js
// Chapter 4: California, in full colour.
import { arrive } from './arrive.js';
import { office } from './office.js';
import { ranch } from './ranch.js';
import { forest } from './forest.js';
import { fishing } from './fishing.js';
import { tide } from './tide.js';
import { scuba } from './scuba.js';
import { freedive } from './freedive.js';
import { sunset } from './sunset.js';

export const CHAPTER_4 = {
  name: 'California',
  shots: [
    { id: 'ch4-arrive', scene: arrive, caption: 'California', duration: 1.8 },
    { id: 'ch4-office', scene: office, caption: 'California', duration: 1.6, fadeIn: 0.15, fadeOut: 0.15 },
    { id: 'ch4-ranch', scene: ranch, caption: 'California', duration: 3, fadeIn: 0.15 },
    { id: 'ch4-forest', scene: forest, caption: 'California', duration: 1.8, fadeOut: 0.15 },
    { id: 'ch4-fishing', scene: fishing, caption: 'California', duration: 1.9, fadeIn: 0.15, fadeOut: 0.15 },
    { id: 'ch4-tide', scene: tide, caption: 'California', duration: 1.9, fadeIn: 0.15, fadeOut: 0.15 },
    { id: 'ch4-scuba', scene: scuba, caption: 'California', duration: 1.4, fadeIn: 0.15, fadeOut: 0.15 },
    { id: 'ch4-freedive', scene: freedive, caption: 'California', duration: 1.5, fadeIn: 0.15 },
    { id: 'ch4-sunset', scene: sunset, caption: 'California', duration: 2, fadeOut: 0.3 },
  ],
};
```

Chapter 4 now runs 10.5 s longer, so `To be continued` starts at 64.1 s. Apply to `tests/reel/page-check.sh`:

`tests/reel/page-check.sh`, change 1. Find:

```bash
d=$(dom 1440,900 '?reel=56'); expect 'To be continued keeps step 4 lit' "$d" 'data-chapter="4"' '>To be continued…<' 'class="step is-live" data-org="amazon"'
```

Replace with:

```bash
d=$(dom 1440,900 '?reel=66'); expect 'To be continued keeps step 4 lit' "$d" 'data-chapter="4"' '>To be continued…<' 'class="step is-live" data-org="amazon"'
```

- [ ] **Step 4: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 209`, `ℹ fail 0`, then 16 `ok` lines and exit 0.

- [ ] **Step 5: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 54.0,54.8,55.2,56.0,56.2,56.6,57.1,57.7,58.2,58.6,59.0,59.9,60.7,61.2,61.6,62.0,62.3,62.6,63.1 && python3 tests/reel/sheet.py /tmp/f /tmp/f-coast.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 54.8,57.1,58.6,59.9,61.6,62.0,63.0 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-coast.png 3
```

Expected:
- Mushrooms:
  - 54.0 s: a shady oak wood under a closed canopy, with sun shafts, lace lichen and sword ferns. Yimeng walks in with the basket and the dog trots ahead in its backpack. Chanterelles show gold on the path ahead.
  - 54.8 s: stopped. A chanterelle is in the air on its way to the basket, and the dog has turned back to watch.
  - 55.2 s: walking on, the basket heaped with chanterelles.
- Fishing:
  - 56.0 s: Yimeng on the dark rock in the bucket hat, the line straight down to a red float. A cypress headland is to the left and sea stacks are on the horizon. The dog, in its life vest, is behind.
  - 56.2 s: a yellow `!` over Yimeng, and rings round the float.
  - 56.6 s: the rockfish halfway up the line.
  - 57.1 s: the rockfish hangs under the rod tip.
- Tide pools:
  - 57.7 s: wet sand shining gold, rocks with weed. A purple urchin is in the air from the pool to the bucket.
  - 58.2 s: dark sand spurting from the burrow.
  - 58.6 s: the fat pink worm out of the burrow, and the dog in the air with a `!`.
  - 59.0 s: the worm is gone into the bucket, and the dog stands back.
- Underwater:
  - 59.9 s: the kelp forest. Yimeng in the black wetsuit and yellow tank swims right, bubbles rising, past blacksmith and an orange garibaldi.
  - 60.7 s: Yimeng at the surface in kelp camo, the snorkel up, fading in.
  - 61.2 s: diving.
  - 61.6 s: level over the reef, the gun out in front, the sheephead ahead.
  - 62.0 s: the spear in flight with a trail of bubbles, short of the fish.
- Sunset:
  - 62.3 s: the sun half down into a purple and orange sky, its glitter on the sea. The dog waits on the rocks to the right.
  - 62.6 s: Yimeng coming up out of the water.
  - 63.1 s: Yimeng waist-deep, the sheephead on the spear, and a heart over the dog.
- On the phone, every shot fits. The spear is still short of the fish at 62.0 s.

- [ ] **Step 6: Update the spec.** Apply to `docs/superpowers/specs/2026-10-03-life-reel-design.md`:

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 1. Find:

```markdown
The full loop runs about 66 s, and the timings below are targets. The caption is the place name and fades in at the top left whenever it changes.
```

Replace with:

```markdown
The full loop runs about 68 s, and the timings below are targets. The caption is the place name and fades in at the top left whenever it changes.
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 2. Find:

```markdown
### 4 · California (~16 s). Caption: `California`. Full colour, morning to sunset.
```

Replace with:

```markdown
### 4 · California (~17 s). Caption: `California`. Full colour, morning to sunset.
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 3. Find:

```markdown
4. Forest under oaks, picking mushrooms. The dog wears its backpack.
5. Fishing from the rocks.
6. Low tide: picking up sea urchins and digging for fat innkeeper worms (海肠).
7. Into the sea: scuba, then freediving, then spearfishing in a kelp forest.
8. Surfacing at sunset. The dog is waiting on the rocks in its life vest.
```

Replace with:

```markdown
4. Mushrooms under the oaks: dappled light in a coast live oak wood, the limbs hung with lace lichen, sword ferns along the path. Yimeng walks in with the basket and stops at a cluster of golden chanterelles. The dog, in its little backpack, turns back and wags while they hop into the basket one by one, and the two walk on.
5. Fishing from the rocks: a dark outcrop over the Pacific, a cypress headland and sea stacks behind. The float bobs, ducks under, and a rockfish comes up out of the sea on the line. The dog, in its life vest, hops behind Yimeng.
6. Low tide: wet sand shining with the sky, rocks hung with weed and mussels. A purple sea urchin hops from a tide pool into Yimeng's bucket. Then sand spurts from a burrow, a fat pink innkeeper worm (海肠) pops out, and the dog jumps back. The worm goes in the bucket too.
7. Into the sea, in a kelp forest: golden kelp rising to the bright surface, light slanting down between the stalks.
   - Scuba: Yimeng swims through in the black wetsuit with the tank, bubbles going up, past a school of blacksmith and a bright orange garibaldi.
   - Freediving and spearfishing: in the camo wetsuit and long fins, Yimeng breathes at the surface, dives down through the kelp to the reef with the speargun out in front, levels off behind a California sheephead, and fires. The scene cuts while the spear is still on its way.
8. Surfacing at sunset: Yimeng comes up in the shallows with the sheephead on the spear, facing the rocks where the dog has been waiting in its life vest. The dog wags and hops, and a heart pops up.
```

- [ ] **Step 7: Commit**

```bash
git add reel/ch4/index.js tests/reel/ch4-chapter.test.js tests/reel/page-check.sh docs/superpowers/specs/2026-10-03-life-reel-design.md
git commit -m "feat(reel): Finish chapter 4 on the coast"
```

- [ ] **Step 8: Hand over for review.** Give the user these links, plus `http://127.0.0.1:8000/` with the `03` and `04` buttons, then stop. Phase 6 waits for their approval.
  - `http://127.0.0.1:8000/?reel=ch3-roadtrip`
  - `http://127.0.0.1:8000/?reel=ch4-forest`
  - `http://127.0.0.1:8000/?reel=ch4-fishing`
  - `http://127.0.0.1:8000/?reel=ch4-tide`
  - `http://127.0.0.1:8000/?reel=ch4-scuba`
  - `http://127.0.0.1:8000/?reel=ch4-freedive`
  - `http://127.0.0.1:8000/?reel=ch4-sunset`
