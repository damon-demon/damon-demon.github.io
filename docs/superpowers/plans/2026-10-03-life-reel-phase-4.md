# Life Reel — Phase 4 (Chapter 3: Michigan) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace chapter 3's beach stand-in with the real chapter: four shots, 10 s in all, in a grey, low-saturation palette.
- The white snow of the cap toss clears onto Beaumont Tower in a Michigan snowfield.
- Then a five-year time-lapse cutting between the desk and the gym.
- Then the PhD hooding.
- Last, a door that opens on California and floods the grey world with colour.

**Architecture:**
- The cast gains two hero poses (`type` at a desk, `curl` with a dumbbell) and reports where each frame's hand is, for props.
- The dog gains a `sleep` pose.
- The engine's `env.hero` and `env.dog` take a tone: `'muted'` pulls every colour of a sprite's palette towards grey (`mute` in `pixels.js`). That is the "palette-derived" grey the spec asks for, in place of `ctx.filter`.
- Scenes live under `reel/ch3/` as before, collected in `CHAPTER_3`. The door shot clips a circle that grows from the doorway, drawing California and the full-colour cast inside it.
- Chapter 2's graduation now ends on white instead of fading to black, so its snow cuts straight into Michigan's.

**Tech Stack:** Vanilla JS (ES modules, Canvas 2D), Node 25 `node:test`, headless Chrome review tools from Phase 2.

**Spec:** `docs/superpowers/specs/2026-10-03-life-reel-design.md`, chapter 3 storyboard. **Builds on:** `docs/superpowers/plans/2026-10-03-life-reel-phase-3b.md`.

## Global Constraints

- Everything in the earlier phases' Global Constraints still holds:
  - no build step, English text, deterministic scenes
  - the golden tests (the 19 walking outfits, the dog's trot, the beach) stay untouched and passing
  - every scene reads at native widths 195, 480 and 640
  - a sprite drawn at `x - anchorX` has its left edge at `x`
  - branch `life-reel`; no merge, no push
- Every chapter 3 shot is captioned `Michigan`, and the chapter is named `Michigan`.
- Outfits:
  - `mi_winter`: the snow
  - `lab`: the desk, `type` pose
  - `gym1` for the first two years, then `gym5`: the gym, `curl` pose
  - `phd`: the hooding and the door
- The dog by the desk: the `pup` in year 1, then by season `msu_knit` (winter), `bandana` (spring, autumn), `bare` (summer). At the door: `bandana`.
- Michigan is grey: every set is painted in muted colours, and the cast is drawn with tone `'muted'`. Only what the door's colour reaches is drawn in `'full'`.
- The paper count follows the site's publication list for the PhD years: 0, 2, 5, 12, 16 by the end of 2021 … 2025.
- Chapter 3 lasts 10 s (2 + 4.5 + 2 + 1.5). Run the page checks in Tasks 1 and 6 only; Task 6 moves their times.

## File structure

| File | Responsibility |
|---|---|
| `reel/pixels.js` (modify) | + `mute(hex, amount)` |
| `reel/hero.js` (modify) | + poses `type` and `curl` (with `curlDown`/`curlUp` arms); sprites report `hands` |
| `reel/dog.js` (modify) | + `dogSprite(key, 'sleep')`, two breathing frames |
| `reel/reel.js` (modify) | `env.hero(key, pose, tone)` and `env.dog(key, pose, tone)`; tone `'muted'` greys the palette |
| `tests/reel/fake-canvas.js` (modify) | The fake env names poses and tones, and reports hands |
| `reel/ch2/graduation.js`, `reel/ch2/index.js` (modify) | The graduation ends on white, with no fade to black |
| `reel/ch3/snow.js` | Shot 1: Beaumont Tower in the snow |
| `reel/ch3/timelapse.js` | Shot 2: five years at the desk and the gym. Exports `phaseAt`, `seasonAt`, `dogCoat`, `papersAt`, `PAPERS` |
| `reel/ch3/hooding.js` | Shot 3: the hooding. Exports `hoodAt`, and `drawHood` for the door |
| `reel/ch3/door.js` | Shot 4: the door and the flood of colour. Exports `floodAt` |
| `reel/ch3/index.js`, `reel/story.js` (modify) | `CHAPTER_3`, replacing the Michigan stand-in |
| `tests/reel/ch3-*.test.js` | One test file per shot, plus `ch3-chapter.test.js` |
| `tests/reel/page-check.sh` (modify) | Times shifted for the 10 s chapter 3 |

## How to run things

- Unit tests: `node --test 'tests/reel/*.test.js'` (quote the glob).
- Page checks: `tests/reel/page-check.sh`.
- Frame review: keep `python3 -m http.server 8000 --bind 127.0.0.1` running from the repo root. Then run `node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times …` and `python3 tests/reel/sheet.py /tmp/f /tmp/f.png 2`. For a phone, use `--width 390 --mobile`. Delete the output folder between runs.
- Chapter 3 starts at 33.7 s. Shot start times: snow 33.7, time-lapse 35.7, hooding 40.2, door 42.2. Chapter 4 starts at 43.7.

---

### Task 1: The cast for Michigan

**Files:**
- Modify: `reel/pixels.js`, `reel/hero.js`, `reel/dog.js`, `reel/reel.js`, `tests/reel/fake-canvas.js`
- Test: `tests/reel/pixels.test.js`, `tests/reel/hero.test.js`, `tests/reel/dog.test.js` (append to each)

**Interfaces:**
- Produces: `mute(hex, amount) → hex`. It moves each channel towards the colour's luminance (`0.3 r + 0.59 g + 0.11 b`): 0 keeps the colour, 1 makes it grey.
- Produces: `heroSprite(key, 'type')`, seated with the hands forward and a 1 px nod, and `heroSprite(key, 'curl')`, standing, the arm down then the forearm up. Both have 2 frames.
  - Every hero sprite now also reports `hands`: one `[x, y]` per frame, the sprite pixel where a held prop goes.
  - For `curl` that is `[16, 33]` (hip) then `[19, 29]` (chest).
- Produces: `dogSprite(key, 'sleep')`: 2 frames, lying on `footY`, eyes shut, the second frame 1 px higher (a breath).
  - `dogSprite(key)` is unchanged (`pose = 'trot'`). Unknown poses throw `unknown dog pose: …`.
- Produces: `env.hero(key, pose = 'walk', tone = 'full')` and `env.dog(key, pose = 'trot', tone = 'full')`. Tone `'muted'` returns the same sprite with every palette colour passed through `mute(…, 0.6)`.
- Produces: in tests, `fakeEnv()` names sprites as follows:
  - heroes `"<key>:<pose>[:<tone>]:<frame>"`
  - dogs `"dog:<key>[:<pose>][:<tone>]:<frame>"`, where the pose is left out for `trot` and the tone for `full`
  - every hero reports `hands`

- [ ] **Step 1: Write the failing tests.** Append to `tests/reel/pixels.test.js`:

```js
test('mute pulls a colour towards its own grey', async () => {
  const { mute } = await import('../../reel/pixels.js');
  assert.equal(mute('#ff0000', 0), '#ff0000');
  assert.equal(mute('#ff0000', 1), '#4d4d4d');
  const [r, g, b] = hexToRgb(mute('#3a8fd8', 0.6));
  assert.ok(Math.max(r, g, b) - Math.min(r, g, b) < (0xd8 - 0x3a) / 2, 'less than half as saturated');
});
```

Append to `tests/reel/hero.test.js`:

```js
test('the type and curl poses: two frames each, and hands where props are held', () => {
  const type = heroSprite('lab', 'type'), curl = heroSprite('gym5', 'curl');
  assert.deepEqual([type.frames.length, curl.frames.length], [2, 2]);
  assert.notDeepEqual(curl.frames[0], curl.frames[1]);
  assert.deepEqual(curl.hands, [[16, 33], [19, 29]], 'the dumbbell comes up from the hip to the chest');
  assert.ok(type.hands.every(([, y]) => y < type.seatY), 'hands on the desk, above the lap');
  assert.equal(heroSprite('work').hands.length, 4, 'every pose reports its hands');
});
```

Append to `tests/reel/dog.test.js`:

```js
test('the dog sleeps: two breathing frames, lying lower than it stands', () => {
  const top = (f) => f.findIndex(r => /[^.]/.test(r)), bottom = (f) => Math.max(...f.map((r, y) => (/[^.]/.test(r) ? y : -1)));
  for (const key of ['pup', 'msu_knit', 'bandana', 'bare']) {
    const s = dogSprite(key, 'sleep');
    assert.equal(s.frames.length, 2);
    assert.notDeepEqual(s.frames[0], s.frames[1], `${key} breathes`);
    assert.ok(top(s.frames[0]) > top(dogSprite(key).frames[0]), `${key} lies down`);
    assert.ok(bottom(s.frames[0]) <= s.footY + 1, `${key} rests on the floor`);
  }
  assert.throws(() => dogSprite('bare', 'beg'), /unknown dog pose: beg/);
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `node --test 'tests/reel/pixels.test.js' 'tests/reel/hero.test.js' 'tests/reel/dog.test.js'`
Expected: 3 failures:
- `mute …`: `mute` is not exported yet.
- `the type and curl poses …`: `unknown pose: type`.
- `the dog sleeps …`: the pose argument is ignored, so there are 4 trotting frames.

- [ ] **Step 3: Implement.** Apply these replacements. Each "find" text occurs exactly once in its file.

`reel/pixels.js`, change 1. Find:

```js

// Rows + palette -> rows of hex colours ('.' stays '.'); what a sprite actually looks like.
```

Replace with:

```js

// A colour pulled towards its own grey by `amount` (0 keeps it, 1 is fully grey): Michigan's palette.
export function mute(hex, amount) {
  const [r, g, b] = hexToRgb(hex), l = 0.3 * r + 0.59 * g + 0.11 * b;
  return '#' + [r, g, b].map(c => Math.round(c + (l - c) * amount).toString(16).padStart(2, '0')).join('');
}

// Rows + palette -> rows of hex colours ('.' stays '.'); what a sprite actually looks like.
```

`reel/hero.js`, change 1. Find:

```js
};
const ARM_HOLD = `
```

Replace with:

```js
};
ARMS.curlDown = ARMS.mid;             // a dumbbell curl: the arm hangs, then the forearm comes up
ARMS.curlUp = `
.......BB.SS........
.......BBBr.........
.......BBBr.........
.......BBB..........
`;
const ARM_HOLD = `
```

`reel/hero.js`, change 2. Find:

```js
};
const LEGS = {
```

Replace with:

```js
};
ARM_BIG.curlDown = ARM_BIG.mid;
ARM_BIG.curlUp = `
.....SSSS.SSS.......
.....SSSSSSSSs......
.....sSSSSSSs.......
......sSSSs.........
`;
const LEGS = {
```

`reel/hero.js`, change 3. Find:

```js
const HAND = { mid: [7, 22], fwd: [9, 22], back: [6, 22], hold: [11, 20] };
```

Replace with:

```js
const HAND = { mid: [7, 22], fwd: [9, 22], back: [6, 22], hold: [11, 20], curlDown: [7, 22], curlUp: [10, 18] };
```

`reel/hero.js`, change 4. Find:

```js
// the cap toss: feet planted, bouncing, and bareheaded, because the hat is in the air.
```

Replace with:

```js
// the cap toss: feet planted, bouncing, and bareheaded, because the hat is in the air. `type` sits
// with the hands forward on a keyboard, nodding; `curl` lifts a dumbbell from the hip to the chest.
```

`reel/hero.js`, change 5. Find:

```js
  cheer: [['stand', 'fwd', 1, true], ['stand', 'mid', 0, true]],
};
```

Replace with:

```js
  cheer: [['stand', 'fwd', 1, true], ['stand', 'mid', 0, true]],
  type: [['sitA', 'hold', 0], ['sitA', 'hold', 1]],
  curl: [['stand', 'curlDown', 0], ['stand', 'curlUp', 0]],
};
```

`reel/hero.js`, change 6. Find:

```js
// One outfit in one pose ('walk': 4 frames, 'sit' and 'cheer': 2), plus what the engine needs to place it.
```

Replace with:

```js
// One outfit in one pose ('walk': 4 frames, the others 2), plus what the engine needs to place it.
// hands: per frame, the [x, y] in the sprite where props such as a dumbbell are held.
```

`reel/hero.js`, change 7. Find:

```js
  return { frames: POSES[pose].map(p => frame(o, p)), palette: palette(o), width: SPRITE_W, height: SPRITE_H, anchorX: ANCHOR_X, footY: FOOT_Y, seatY: SEAT_Y };
```

Replace with:

```js
  const hands = POSES[pose].map(([, arm, bob]) => {
    const a = o.hold ? 'hold' : o.stand ? 'mid' : arm;
    return [OX + HAND[a][0], OY + HAND[a][1] + bob];
  });
  return { frames: POSES[pose].map(p => frame(o, p)), palette: palette(o), width: SPRITE_W, height: SPRITE_H, anchorX: ANCHOR_X, footY: FOOT_Y, seatY: SEAT_Y, hands };
```

`reel/dog.js`, change 1. Find:

```js
const TROT = [['ext', 0], ['gather', -1], ['ext', 0], ['gather', -1]];
```

Replace with:

```js
const TROT = [['ext', 0], ['gather', -1], ['ext', 0], ['gather', -1]];
const PUP_BANDANA = [[7, 6, 'b'], [8, 6, 'b'], [9, 6, 'b'], [8, 7, 'b'], [9, 7, 'd']];

// Asleep: the body down on the floor, eyes shut, paws tucked under, the tail curled along the
// floor. `rise` lifts the chest 1px for a breath. Returns the grid and the body's top row.
function sleepFrame(spec, outfit, rise) {
  const c = new Grid(spec.w, spec.h), rows = spec.body.trim().split('\n').length;
  const bodyY = spec.footY - rows + 1 - rise;
  c.stamp(spec.body, 0, bodyY, { outline: 'k' });
  c.set(spec.eye[0], spec.eye[1] + bodyY, 'k'); c.set(spec.eye[0] - 1, spec.eye[1] + bodyY, 'k');   // eyes shut
  c.set(spec.nose[0], spec.nose[1] + bodyY, 'N');
  dress(c, outfit, bodyY);
  const front = spec.poses.ext.front[1][0], back = spec.poses.ext.back[1][0];
  for (let x = front; x <= front + 3; x++) c.set(x, spec.footY, 'C');                    // front paws, tucked
  for (let x = back - 1; x <= back + 1; x++) c.set(x, spec.footY, 'c');
  if (rise) for (let x = back; x < front; x++) if (c.get(x, spec.footY) === '.') c.set(x, spec.footY, 'c');   // the belly stays down
  const [tx0] = spec.tail;
  line(c, tx0, spec.footY - 1, 0, spec.footY, 'C');                                     // the tail, curled round
  return [c, bodyY];
}
```

`reel/dog.js`, change 2. Find:

```js
export function dogSprite(key) {
```

Replace with:

```js
// pose: 'trot' (4 frames) or 'sleep' (2 frames, breathing).
export function dogSprite(key, pose = 'trot') {
```

`reel/dog.js`, change 3. Find:

```js
  const spec = key === 'pup' ? PUPPY : ADULT;
  const frames = TROT.map(([pose, bob]) => {
    const c = frame(spec, key === 'pup' ? 'bare' : key, pose, bob);
    if (key === 'pup') for (const [x, y, col] of [[7, 6, 'b'], [8, 6, 'b'], [9, 6, 'b'], [8, 7, 'b'], [9, 7, 'd']]) c.set(x, y + 1 + bob, col);
```

Replace with:

```js
  if (pose !== 'trot' && pose !== 'sleep') throw new Error(`unknown dog pose: ${pose}`);
  const spec = key === 'pup' ? PUPPY : ADULT, outfit = key === 'pup' ? 'bare' : key;
  const made = pose === 'trot' ? TROT.map(([p, bob]) => [frame(spec, outfit, p, bob), 1 + bob]) : [0, 1].map(rise => sleepFrame(spec, outfit, rise));
  const frames = made.map(([c, bodyY]) => {
    if (key === 'pup') for (const [x, y, col] of PUP_BANDANA) c.set(x, y + bodyY, col);
```

`reel/reel.js`, change 1. Find:

```js
import { painterCanvas, spriteCanvases, gridCanvas } from './sprites.js';
import { CHAPTERS, POSTER } from './story.js';
```

Replace with:

```js
import { painterCanvas, spriteCanvases, gridCanvas } from './sprites.js';
import { mute } from './pixels.js';
import { CHAPTERS, POSTER } from './story.js';
```

`reel/reel.js`, change 2. Find:

```js
};
```

Replace with:

```js
};

const MUTE = 0.6;                     // how grey the cast goes in Michigan's 'muted' tone

// A sprite in a tone: 'full' as drawn, or 'muted' with every colour pulled towards grey.
function toned(sprite, tone) {
  if (tone !== 'muted') return sprite;
  return { ...sprite, palette: Object.fromEntries(Object.entries(sprite.palette).map(([k, v]) => [k, mute(v, MUTE)])) };
}
```

`reel/reel.js`, change 3. Find:

```js
  const heroFrames = memo(id => { const [key, pose] = id.split(':'); return spriteCanvases(heroSprite(key, pose)); });
```

Replace with:

```js
  const heroFrames = memo(id => { const [key, pose, tone] = id.split(':'); return spriteCanvases(toned(heroSprite(key, pose), tone)); });
  const dogFrames = memo(id => { const [key, pose, tone] = id.split(':'); return spriteCanvases(toned(dogSprite(key, pose), tone)); });
```

`reel/reel.js`, change 4. Find:

```js
    hero: (key, pose = 'walk') => heroFrames(key + ':' + pose),
    dog: memo(key => spriteCanvases(dogSprite(key))),
```

Replace with:

```js
    hero: (key, pose = 'walk', tone = 'full') => heroFrames(`${key}:${pose}:${tone}`),
    dog: (key, pose = 'trot', tone = 'full') => dogFrames(`${key}:${pose}:${tone}`),
```

`tests/reel/fake-canvas.js`, change 1. Find:

```js
// An env whose sprites are named "<key>:<pose>:<frame>" so tests can see what was drawn.
```

Replace with:

```js
// An env whose sprites are named "<key>:<pose>:<frame>" ("dog:<key>:<frame>" for the trotting dog)
// so tests can see what was drawn; a tone other than 'full' is added after the pose.
```

`tests/reel/fake-canvas.js`, change 2. Find:

```js
  const sprite = (id, n, extra) => ({ canvases: Array.from({ length: n }, (_, i) => ({ name: `${id}:${i}`, width: 42, height: 50 })), ...extra });
  return {
```

Replace with:

```js
  const sprite = (id, n, extra) => ({ canvases: Array.from({ length: n }, (_, i) => ({ name: `${id}:${i}`, width: 42, height: 50 })), ...extra });
  const toneOf = (tone) => (tone && tone !== 'full' ? `:${tone}` : '');
  return {
```

`tests/reel/fake-canvas.js`, change 3. Find:

```js
    hero: (key, pose = 'walk') => sprite(`${key}:${pose}`, pose === 'walk' ? 4 : 2, { anchorX: 9, footY: 44, seatY: 38 }),
    dog: (key) => sprite(`dog:${key}`, 4, { anchorX: 0, footY: 15 }),
```

Replace with:

```js
    hero: (key, pose = 'walk', tone) => sprite(`${key}:${pose}${toneOf(tone)}`, pose === 'walk' ? 4 : 2, { anchorX: 9, footY: 44, seatY: 38, hands: Array(4).fill([19, 33]) }),
    dog: (key, pose = 'trot', tone) => sprite(`dog:${key}${pose === 'trot' ? '' : ':' + pose}${toneOf(tone)}`, pose === 'trot' ? 4 : 2, { anchorX: 0, footY: 15 }),
```

- [ ] **Step 4: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 141`, `ℹ fail 0`, then 15 `ok` lines and exit 0. The golden tests still pass, because the walking frames and the trotting dog are untouched.

- [ ] **Step 5: Commit**

```bash
git add reel/pixels.js reel/hero.js reel/dog.js reel/reel.js tests/reel/fake-canvas.js tests/reel/pixels.test.js tests/reel/hero.test.js tests/reel/dog.test.js
git commit -m "feat(reel): Teach the cast to type, curl and sleep, in a muted tone"
```

---

### Task 2: Beaumont Tower in the snow

**Files:**
- Create: `reel/ch3/snow.js`, `reel/ch3/index.js`
- Modify: `reel/story.js`, `reel/ch2/graduation.js`, `reel/ch2/index.js`
- Test: `tests/reel/ch3-snow.test.js`, `tests/reel/ch2-chapter.test.js`

**Interfaces:**
- Consumes: tone `'muted'` (Task 1).
- Produces: `snow` (a scene), with layers `sky`, `far`, `mid` (the tower and trees, at a third of walking pace) and `ground`. It also exposes `hx` and `flakes`.
  - For the first 0.6 s a full-frame white (`#dfe6ee`, from 85 % to 0) clears away.
  - Yimeng walks on the spot at `hx` (`mi_winter`, muted), with the puppy (`pup`, muted) at `hx + 26`.
- Produces: `CHAPTER_3` in `reel/ch3/index.js`, named `Michigan`; Tasks 3–5 add one shot each. The first shot has no `fadeIn`, so it opens on white, not black.
- Produces: the graduation's last 1.2 s whitens to 85 %, and its shot has no `fadeOut`.

- [ ] **Step 1: Write the failing tests.** Create `tests/reel/ch3-snow.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { snow } from '../../reel/ch3/snow.js';

sceneContract('ch3 snow', snow, 2);

test('Michigan: the white of the cap toss clears off the snow', () => {
  const whiteOut = (t) => frameAt(snow, 480, t).ctx.calls.some(c => c[0] === 'fillRect' && c[1] === 0 && c[2] === 0 && c[3] === 480 && c[4] === 96);
  assert.equal(whiteOut(0.1), true);
  assert.equal(whiteOut(0.8), false);
});

test('Michigan: Yimeng walks on in the green puffer, greyed, with the puppy ahead', () => {
  const s = snow.build(480, 96), { ctx } = frameAt(snow, 480, 1);
  assert.deepEqual(ctx.draws('mi_winter:walk:muted:2'), [[s.hx - 9, 88 - 44]]);
  assert.deepEqual(ctx.draws('dog:pup:muted:1'), [[s.hx + 26, 88 - 15]]);
});
```

Apply to `tests/reel/ch2-chapter.test.js`:

`tests/reel/ch2-chapter.test.js`, change 1. Find:

```js
  assert.ok(CHAPTER_2.shots.at(-1).fadeOut > 0, 'and out after the snow');
```

Replace with:

```js
  assert.ok(!CHAPTER_2.shots.at(-1).fadeOut, 'and hands its white snow straight to Michigan');
```

- [ ] **Step 2: Run them to verify they fail**

Run: `node --test 'tests/reel/ch3-snow.test.js' 'tests/reel/ch2-chapter.test.js'`
Expected: the snow file fails to load (`Cannot find module …/reel/ch3/snow.js`), and the chapter 2 test fails because the graduation still fades out.

- [ ] **Step 3: Implement.** Create `reel/ch3/snow.js`:

```js
// Chapter 3, shot 1: Michigan. Flat white land under a low grey sky, bare trees, and Beaumont Tower,
// Michigan State's brick carillon tower, with snow on its ledges. The snow from Columbia keeps
// falling as the white clears. Yimeng walks on in the green puffer, the puppy trotting ahead, and
// leaves footprints behind.
import { Painter, rng } from '../pixels.js';
import { gradient, ridge, tile } from '../kit.js';

const SPEED = 26;                            // walk speed, px/s
const GROUND = 88;                           // the row Yimeng's shoes rest on
const CLEAR = 0.6;                           // the white from the cap toss fades out over this long
const SKY = [['#8c929a', 0], ['#9aa0a8', 0.3], ['#acb2b9', 0.6], ['#c2c6cc', 0.9]];
const SNOW = '#e8eaec', SHADE = '#cfd4da', BRICK = '#8a5e52', MORTAR = '#77504a', STONE = '#b9b5ae';

// Beaumont Tower: a square brick tower with stone quoins and bands, a pointed-arch door, lancet
// windows, a belfry of tall pointed openings with louvres, and a parapet with a pinnacle at each corner.
function tower(p, cx, base) {
  const hw = 10, top = base - 56;
  for (let y = top; y < base; y++) for (let x = cx - hw; x <= cx + hw; x++) {
    const quoin = (x === cx - hw || x === cx + hw) && Math.floor((y - top) / 2) % 2 === 0;
    p.px(x, y, quoin ? STONE : (x + (y >> 1)) % 4 === 0 && y % 2 === 0 ? MORTAR : x > cx + 6 ? '#7c544a' : BRICK);
  }
  for (let y = base - 3; y < base; y++) for (let x = cx - hw - 1; x <= cx + hw + 1; x++) p.px(x, y, STONE);   // the stone plinth
  for (const y of [top + 16, top + 32, base - 18]) for (let x = cx - hw - 1; x <= cx + hw + 1; x++) { p.px(x, y, STONE); p.px(x, y - 1, SNOW); }   // stone bands, snow on them
  for (const bx of [cx - 6, cx + 2]) {                                             // the belfry's tall pointed openings, louvred
    for (let y = top + 4; y < top + 14; y++) for (let x = bx; x < bx + 5; x++) p.px(x, y, y % 2 ? '#3c4048' : '#5c6068');
    for (let k = 0; k < 2; k++) for (let x = bx + k; x < bx + 5 - k; x++) p.px(x, top + 3 - k, STONE);
    p.px(bx + 2, top + 1, STONE);
  }
  for (const wx of [cx - 4, cx + 3]) for (let y = top + 20; y < top + 29; y++) p.px(wx, y, y === top + 20 ? STONE : '#3c4048');   // lancet windows
  for (let y = base - 15; y < base - 3; y++) {                                     // the pointed-arch door in a stone frame
    const half = y < base - 11 ? (y - (base - 15)) : 4;
    for (let x = cx - half - 1; x <= cx + half + 1; x++) p.px(x, y, Math.abs(x - cx) > half ? STONE : '#4a3c36');
  }
  for (let x = cx - hw - 1; x <= cx + hw + 1; x++) { p.px(x, top - 1, STONE); p.px(x, top - 2, (x - cx) % 3 === 0 ? STONE : SNOW); }   // the parapet
  for (const px0 of [cx - hw - 1, cx + hw - 2]) for (let k = 0; k < 11; k++) {    // corner pinnacles, with a notch of crockets
    const w = k < 4 ? 4 : k < 8 ? 2 : 1, off = k < 4 ? 0 : k < 8 ? 1 : 1.5;
    for (let i = 0; i < w; i++) p.px(px0 + i + off, top - 3 - k, k === 0 || k === 4 ? SNOW : STONE);
  }
}

function bareTree(p, x, base, h, seed) {
  const r = rng(seed);
  for (let y = base - h; y < base; y++) p.px(x, y, '#4e4a48');
  p.px(x + 1, base - 1, '#4e4a48');
  const branch = (x0, y0, len, dir, depth) => {                                    // forked twigs, snow on the upper side
    let bx = x0, by = y0;
    for (let i = 0; i < len; i++) {
      bx += dir * (0.6 + r() * 0.5); by -= 0.8 + r() * 0.4;
      p.px(Math.round(bx), Math.round(by), '#5a5654');
      if (i % 3 === 1) p.px(Math.round(bx), Math.round(by) - 1, '#dcdfe2');
    }
    if (depth < 2) { branch(bx, by, len * 0.6, dir, depth + 1); branch(bx, by, len * 0.5, -dir * 0.5, depth + 1); }
  };
  branch(x, base - h * 0.55, h * 0.45, -1, 0); branch(x, base - h * 0.7, h * 0.4, 1, 0); branch(x, base - h, h * 0.3, 0.3, 1);
}

function pine(p, x, base, h) {
  for (let j = 0; j < h; j++) {
    const half = Math.round((j / h) * h * 0.32) + (j % 4 === 3 ? -1 : 0);
    for (let i = -half; i <= half; i++) p.px(x + i, base - h + j, (j % 4 === 0 && Math.abs(i) < half) ? '#d8dcdf' : i > 0 ? '#3f4c46' : '#4a5a52');
  }
  p.rect(x - 1, base, 2, 2, '#4e4a48');
}

export function buildSnow(W, H = 96) {
  const TW = W * 2, layers = {};
  layers.sky = gradient(W, H, SKY);
  const far = new Painter(TW, H);                                                   // a low line of bare woods on the flat horizon
  const woods = ridge(TW, 7, [[2, 5, 0.4], [1, 13, 1.1]]);
  for (let x = 0; x < TW; x++) for (let j = 0; j < woods[x]; j++) far.px(x, 71 - j, (x + j) % 3 ? '#7a7674' : '#8a8684');
  for (let y = 71; y < H; y++) for (let x = 0; x < TW; x++) far.px(x, y, y === 71 ? '#dfe2e5' : (x * 3 + y * 7) % 19 === 0 ? SHADE : SNOW);
  layers.far = far;
  const mid = new Painter(TW, H);                                                   // the tower among trees, at a third of walking pace
  tower(mid, Math.round(W * 0.62), 77);
  for (const [fx, h, s] of [[0.18, 26, 1], [0.42, 22, 2], [0.8, 28, 3], [1.15, 24, 4], [1.45, 27, 5], [1.75, 21, 6]]) bareTree(mid, Math.round(fx * W), 76, h, s);
  for (const fx of [0.5, 0.73, 1.3, 1.6]) pine(mid, Math.round(fx * W), 76, 16);
  for (let x = 0; x < TW; x++) for (let y = 76; y < 79; y++) mid.px(x, y, y === 76 ? '#d4d8dc' : SNOW);   // the snowy lawn they stand in
  layers.mid = mid;
  const ground = new Painter(TW, H);                                                // the near snow, with a trodden path
  for (let y = 79; y < H; y++) for (let x = 0; x < TW; x++) {
    let c = (x * 7 + y * 3) % 23 === 0 ? SHADE : SNOW;
    if (y >= 86 && y <= 90) c = (x + y) % 5 === 0 ? '#c4c9cf' : '#d6dade';
    ground.px(x, y, c);
  }
  layers.ground = ground;
  const r = rng(8), flakes = [];
  for (let n = 0; n < Math.round(W / 4); n++) flakes.push({ x: r() * W, y: r() * (H + 8), v: 10 + r() * 12, ph: r() * 6, big: r() < 0.25 });
  return { W, H, TW, hx: Math.round(W * 0.34), flakes, layers };
}

export function renderSnow(ctx, t, s, env) {
  const { W, H, canvases: c, hx } = s, off = t * SPEED;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  tile(ctx, c.far, off * 0.1, 0);
  tile(ctx, c.mid, off * 0.3, 0);
  tile(ctx, c.ground, off, 0);
  // footprints: three steps a second, each left where a shoe came down and drifting back with the snow
  ctx.fillStyle = '#b4bac2';
  for (let k = Math.floor(t * 3); k > Math.floor(t * 3) - 12; k--) {
    const x = hx + 12 - SPEED * (t - k / 3);
    if (x < hx + 6) ctx.fillRect(Math.round(x), GROUND + (k % 2), 2, 1);
  }
  const hero = env.hero('mi_winter', 'walk', 'muted'), dog = env.dog('pup', 'trot', 'muted');
  ctx.drawImage(hero.canvases[Math.floor(t * 6) % 4], hx - hero.anchorX, GROUND - hero.footY);
  ctx.drawImage(dog.canvases[Math.floor(t * 9) % 4], hx + 26 - dog.anchorX, GROUND - dog.footY);
  ctx.fillStyle = '#ffffff';
  for (const f of s.flakes) {                                                       // still snowing
    const y = ((f.y + t * f.v) % (H + 8)) - 4, x = ((f.x + Math.sin(t * 1.5 + f.ph) * 3 - t * 6) % W + W) % W;
    ctx.fillRect(Math.round(x), Math.round(y), f.big ? 2 : 1, f.big ? 2 : 1);
  }
  if (t < CLEAR) { ctx.globalAlpha = 0.85 * (1 - t / CLEAR); ctx.fillStyle = '#dfe6ee'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }   // the white of the cap toss clears
}

export const snow = { build: buildSnow, render: renderSnow };
```

Create `reel/ch3/index.js`:

```js
// Chapter 3: Michigan, five grey years from the first snow to the hooding, and out through the door.
import { snow } from './snow.js';

export const CHAPTER_3 = {
  name: 'Michigan',
  shots: [
    { id: 'ch3-snow', scene: snow, caption: 'Michigan', duration: 2 },
  ],
};
```

Apply to `reel/story.js`:

`reel/story.js`, change 1. Find:

```js
import { CHAPTER_2 } from './ch2/index.js';
```

Replace with:

```js
import { CHAPTER_2 } from './ch2/index.js';
import { CHAPTER_3 } from './ch3/index.js';
```

`reel/story.js`, change 2. Find:

```js
  { name: 'Michigan', shots: [standIn('ch3-michigan', 'Michigan', 6)] },
```

Replace with:

```js
  CHAPTER_3,
```

Apply to `reel/ch2/graduation.js`:

`reel/ch2/graduation.js`, change 1. Find:

```js
    ctx.globalAlpha = 0.45 * u * u; ctx.fillStyle = '#dfe6ee'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
```

Replace with:

```js
    ctx.globalAlpha = 0.85 * u * u; ctx.fillStyle = '#dfe6ee'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;   // into Michigan's white
```

Apply to `reel/ch2/index.js`:

`reel/ch2/index.js`, change 1. Find:

```js
    { id: 'ch2-graduation', scene: graduation, caption: 'New York', duration: 2.8, fadeIn: 0.2, fadeOut: 0.3 },
```

Replace with:

```js
    { id: 'ch2-graduation', scene: graduation, caption: 'New York', duration: 2.8, fadeIn: 0.2 },
```

- [ ] **Step 4: Run the unit tests**

Run: `node --test 'tests/reel/*.test.js'`
Expected: `ℹ pass 145`, `ℹ fail 0`.

- [ ] **Step 5: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 33.5,33.8,34.8 && python3 tests/reel/sheet.py /tmp/f /tmp/f-snow.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 35.3 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-snow.png 3
```

Expected:
- 33.5 s: the graduation, snowing and nearly white.
- 33.8 s: the same white, clearing onto Michigan.
- 34.8 s: a flat snowfield under a low grey sky, with a line of bare woods on the horizon, bare trees with snow on their twigs, and small pines.
  - Beaumont Tower: red brick with stone quoins and bands (snow on each), a louvred belfry of pointed openings, lancet windows, a pointed-arch door, and four pinnacles.
  - Yimeng walks in the green puffer and white bobble hat, all in muted colours, the puppy trotting ahead.
  - Snow keeps falling.

- [ ] **Step 6: Commit**

```bash
git add reel/ch3/snow.js reel/ch3/index.js reel/story.js reel/ch2/graduation.js reel/ch2/index.js tests/reel/ch3-snow.test.js tests/reel/ch2-chapter.test.js
git commit -m "feat(reel): Open chapter 3 on Beaumont Tower in the snow"
```

---

### Task 3: Five years at the desk and the gym

**Files:**
- Create: `reel/ch3/timelapse.js`
- Modify: `reel/ch3/index.js`
- Test: `tests/reel/ch3-timelapse.test.js`

**Interfaces:**
- Consumes: the `type` and `curl` poses, `hands`, the dog's `sleep` pose, tone `'muted'` (Task 1).
- Produces: `phaseAt(t) → { year: 0..4, room: 'desk' | 'gym', u: 0..1 }`.
  - The years last 1.2, 1, 0.85, 0.75 and 0.7 s.
  - The first 55 % of each year is at the desk.
- Produces: `seasonAt(u)`, the window's season during a desk cut (a quarter each: winter, spring, summer, autumn).
- Produces: `dogCoat(year, season)`. It is `'pup'` in year 0; otherwise `msu_knit`, `bandana`, `bare` or `bandana` by season.
- Produces: `papersAt(year, u)`, counting from the last year's total up to `PAPERS[year]`, and `PAPERS = [0, 2, 5, 12, 16]`.
- Produces: `timelapse` (a scene), with layers `desk`, `front` (the desk itself, in front of Yimeng), `gym` and `win0`–`win3` (the window's four seasons).

- [ ] **Step 1: Write the failing test.** Create `tests/reel/ch3-timelapse.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { timelapse, phaseAt, papersAt, seasonAt, dogCoat } from '../../reel/ch3/timelapse.js';

sceneContract('ch3 time-lapse', timelapse, 4.5);

test('time-lapse: five years, each the desk and then the gym', () => {
  const cuts = [];
  for (let t = 0; t < 4.5; t += 0.02) { const p = phaseAt(t), k = `${p.year}:${p.room}`; if (cuts.at(-1) !== k) cuts.push(k); }
  assert.deepEqual(cuts, ['0:desk', '0:gym', '1:desk', '1:gym', '2:desk', '2:gym', '3:desk', '3:gym', '4:desk', '4:gym']);
});

test('time-lapse: the paper count climbs from 0 to 16 and never goes back', () => {
  const counts = [];
  for (let t = 0; t < 4.5; t += 0.01) { const p = phaseAt(t); if (p.room === 'desk') counts.push(papersAt(p.year, p.u)); }
  assert.ok(counts.every((n, i) => !i || n >= counts[i - 1]));
  assert.deepEqual([counts[0], counts.at(-1)], [0, 16]);
});

test('time-lapse: the window runs through the seasons, and the dog dresses for them', () => {
  assert.deepEqual([0.1, 0.3, 0.6, 0.9].map(seasonAt), ['winter', 'spring', 'summer', 'autumn']);
  assert.equal(dogCoat(0, 'winter'), 'pup', 'still a puppy in the first year');
  assert.deepEqual(['winter', 'spring', 'summer', 'autumn'].map(s => dogCoat(3, s)), ['msu_knit', 'bandana', 'bare', 'bandana']);
});

test('time-lapse: Yimeng types at the desk, and curls in a bigger build in later years', () => {
  assert.ok(frameAt(timelapse, 480, 0.2).ctx.calls.some(c => String(c[1]).startsWith('lab:type:muted')));
  const lifter = (t) => frameAt(timelapse, 480, t).ctx.calls.find(c => /^gym\d:curl/.test(c[1]))[1];
  assert.match(lifter(1), /^gym1:/);
  assert.match(lifter(4.3), /^gym5:/);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test 'tests/reel/ch3-timelapse.test.js'`
Expected: the file fails to load (`Cannot find module …/reel/ch3/timelapse.js`).

- [ ] **Step 3: Implement.** Create `reel/ch3/timelapse.js`:

```js
// Chapter 3, shot 2: five years in Michigan as a time-lapse, cutting between the desk and the gym a
// year at a time, each year a little quicker than the last. At the desk the window runs through
// winter, spring, summer and autumn; coffee cups pile up, the paper count on the whiteboard climbs,
// and the dog sleeps behind the chair, growing out of puppyhood and changing its coat with the
// seasons. In the gym the dumbbells get heavier and Yimeng gets bigger.
import { Painter, rng } from '../pixels.js';
import { label } from '../kit.js';

const YEARS = [1.2, 1, 0.85, 0.75, 0.7];          // each year's length, s
const DESK = 0.55;                                // the share of each year spent at the desk
export const PAPERS = [0, 2, 5, 12, 16];          // papers by the end of each year, 2021 to 2025
const CUPS = 3;                                   // coffee cups drunk per year
const SEASONS = ['winter', 'spring', 'summer', 'autumn'];
const COAT = { winter: 'msu_knit', spring: 'bandana', summer: 'bare', autumn: 'bandana' };
const FLOOR = 90, SEAT = 80, DESK_TOP = 73, GYM_FLOOR = 87;
const BELL = [2, 3, 3, 4, 5];                     // the dumbbell's plate radius, year by year
const MIRROR = [-26, 120];                        // the gym mirror's span, relative to Yimeng
const BLUE = '#3a5a8a';

// Which year it is at time t, which room we are in, and how far through that room's cut (0..1).
export function phaseAt(t) {
  let start = 0;
  for (let k = 0; k < YEARS.length; k++) {
    const end = start + YEARS[k], split = start + YEARS[k] * DESK;
    if (t < end || k === YEARS.length - 1) {
      return t < split ? { year: k, room: 'desk', u: (t - start) / (split - start) } : { year: k, room: 'gym', u: Math.min(1, (t - split) / (end - split)) };
    }
    start = end;
  }
}

// The season in the window during a desk cut, and the dog's coat to go with it (a puppy in year 1).
export const seasonAt = (u) => SEASONS[Math.min(3, Math.floor(u * 4))];
export const dogCoat = (year, season) => (year === 0 ? 'pup' : COAT[season]);
export const papersAt = (year, u) => Math.round((year ? PAPERS[year - 1] : 0) + ((PAPERS[year] - (year ? PAPERS[year - 1] : 0)) * Math.min(1, u * 1.4)));

// ---------- the desk ----------
function windowView(season) {
  const p = new Painter(40, 28), r = rng(4);
  const sky = { winter: '#a9b0b8', spring: '#b8c6d2', summer: '#9fb4c8', autumn: '#b2b4b6' }[season];
  const leaf = { winter: null, spring: ['#a8b89a', '#c8b8c0'], summer: ['#6f8a64', '#5f7a56'], autumn: ['#b8845a', '#a86a48'] }[season];
  const ground = { winter: '#e2e5e8', spring: '#8ea47e', summer: '#768f66', autumn: '#9a8a64' }[season];
  for (let y = 0; y < 28; y++) for (let x = 0; x < 40; x++) p.px(x, y, y > 20 ? ground : sky);
  p.rect(26, 10, 12, 11, '#8a8e94'); for (let y = 12; y < 20; y += 3) for (let x = 27; x < 37; x += 3) p.px(x, y, '#5e6268');   // a campus building
  for (let y = 8; y < 22; y++) p.px(12, y, '#5a524c');                               // the tree outside
  for (const [dx, dy] of [[-3, 9], [3, 8], [-5, 6], [4, 5], [0, 4]]) { p.px(12 + dx / 2, 8 + dy / 2, '#5a524c'); p.px(12 + dx, 8 + dy / 3 - 3, '#5a524c'); }
  if (leaf) for (let n = 0; n < 60; n++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 8;
    p.px(12 + Math.cos(a) * d * 1.2, 7 + Math.sin(a) * d * 0.8, leaf[n % 2]);
  }
  if (season === 'winter') for (let n = 0; n < 24; n++) p.px(Math.floor(r() * 40), Math.floor(r() * 21), '#f2f4f6');
  return p;
}

function deskRoom(W, H, hx) {
  const p = new Painter(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = y < 78 ? ((x * 5 + y * 3) % 31 === 0 ? '#a09a90' : '#aaa59c') : y < 80 ? '#86817a' : ((x + (y % 2) * 8) % 16 === 0 ? '#5e5c5a' : '#6c6a68');
    p.px(x, y, c);
  }
  const wx = hx + 60;                                                               // the window frame
  for (let y = 26; y < 58; y++) for (let x = wx - 2; x < wx + 42; x++) p.px(x, y, '#d6d2ca');
  for (let x = wx - 3; x < wx + 43; x++) { p.px(x, 58, '#c4c0b8'); p.px(x, 59, '#9a968e'); }
  const bx = hx - 56;                                                               // the whiteboard, scribbled on
  for (let y = 24; y < 54; y++) for (let x = bx; x < bx + 46; x++) p.px(x, y, x === bx || x === bx + 45 || y === 24 || y === 53 ? '#8e8a84' : '#e4e4e0');
  const r = rng(12);
  for (let k = 0; k < 4; k++) {                                                     // equations nobody else can read
    const y0 = 28 + k * 6 + (k > 1 ? 10 : 0), len = 14 + Math.floor(r() * 20);
    for (let i = 0; i < len; i++) p.px(bx + 4 + i, y0 + Math.round(Math.sin(i * 0.9 + k) * 1.2), k === 2 ? '#a84a4a' : BLUE);
  }
  for (let y = 54; y < 56; y++) for (let x = bx + 4; x < bx + 42; x++) p.px(x, y, '#8e8a84');   // the marker tray
  for (let y = 18; y < 27; y++) for (let x = hx + 28; x < hx + 37; x++) {          // the clock's face
    const d = Math.hypot(x - hx - 32, y - 22);
    if (d < 4.6) p.px(x, y, d > 3.6 ? '#4a4a50' : '#f0eee8');
  }
  for (let y = 84; y < 90; y++) for (let x = hx - 32; x < hx - 6; x++) {           // the dog's bed behind the chair
    const d = Math.hypot((x - hx + 19) / 13, (y - 87) / 3.2);
    if (d < 1) p.px(x, y, d > 0.75 ? '#5e4642' : '#7a5c56');
  }
  for (let y = 62; y < SEAT; y++) for (let x = hx; x <= hx + 2; x++) p.px(x, y, x === hx ? '#2e3036' : '#3c3e46');   // the office chair
  for (let x = hx; x <= hx + 17; x++) { p.px(x, SEAT, '#3c3e46'); p.px(x, SEAT + 1, '#2e3036'); }
  for (let y = SEAT + 2; y < 87; y++) p.px(hx + 9, y, '#5a5c62');
  for (let x = hx + 3; x <= hx + 15; x++) p.px(x, 87, '#2e3036');
  for (const x of [hx + 3, hx + 9, hx + 15]) p.px(x, 88, '#1e2026');
  return p;
}

function deskFront(W, H, hx) {
  const p = new Painter(W, H);
  for (let y = DESK_TOP; y < FLOOR; y++) for (let x = hx + 13; x <= hx + 78; x++) {
    let c = y < DESK_TOP + 2 ? (y === DESK_TOP ? '#9a8a74' : '#7a6c5a') : (x - hx) % 22 === 13 ? '#6a5c4c' : '#857664';
    if (y >= DESK_TOP + 2 && (x === hx + 13 || x === hx + 78)) c = '#5a4e40';
    p.px(x, y, c);
  }
  for (let x = hx + 50; x < hx + 70; x++) p.px(x, DESK_TOP + 6, '#5a4e40');        // a drawer
  p.rect(hx + 58, DESK_TOP + 8, 4, 1, '#c4c0b8');
  for (let y = 50; y < 69; y++) for (let x = hx + 24; x < hx + 46; x++) p.px(x, y, x === hx + 24 || x === hx + 45 || y === 50 || y === 68 ? '#2a2c32' : '#1e2a2e');   // the monitor
  p.rect(hx + 33, 69, 4, 3, '#2a2c32'); p.rect(hx + 30, 72, 10, 1, '#2a2c32');
  p.rect(hx + 16, DESK_TOP - 1, 14, 1, '#4a4c54');                                  // the keyboard
  return p;
}

// ---------- the gym ----------
function gymRoom(W, H, hx) {
  const p = new Painter(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = y < 80 ? '#7e868f' : (x % 20 === 0 || y === 80) ? '#30343a' : '#3c4046';
    if (y >= 58 && y < 61) c = '#4c6a5c';                                           // a green stripe round the walls
    p.px(x, y, c);
  }
  const [m0, m1] = MIRROR;
  for (let y = 22; y < 72; y++) for (let x = hx + m0; x < hx + m1; x++) {           // the long mirror behind Yimeng
    const streak = (x - y * 0.7) % 23;
    p.px(x, y, x === hx + m0 || x === hx + m1 - 1 || y === 22 || y === 71 ? '#5a6068' : streak < 2 ? '#c2cad2' : '#a8b0b8');
  }
  const rx = hx - 70;                                                               // a power rack with a loaded bar
  for (const x of [rx, rx + 22]) for (let y = 30; y < 80; y++) { p.px(x, y, '#2a2e34'); p.px(x + 1, y, '#3a3e46'); }
  for (let x = rx - 6; x < rx + 30; x++) p.px(x, 52, '#9aa0a8');
  for (const px0 of [rx - 5, rx + 26]) for (let y = 45; y < 60; y++) for (let k = 0; k < 3; k++) p.px(px0 + k, y, k === 1 ? '#4a4e56' : '#2e3238');
  for (let tier = 0; tier < 2; tier++) {                                            // the dumbbell rack
    const y = 76 + tier * 5;
    for (let x = hx + 56; x < hx + 128; x++) p.px(x, y + 3, '#22252a');
    for (let n = 0; n < 9; n++) {
      const cx = hx + 60 + n * 8, rad = 1 + Math.floor(n / 3);
      for (let j = -rad; j <= rad; j++) for (let i = -rad; i <= rad; i++) if (i * i + j * j <= rad * rad + 1) p.px(cx + i, y + 1 + j, (i + j) % 2 ? '#2e3238' : '#40444c');
    }
  }
  for (const [kx, kr] of [[hx + 134, 3], [hx + 142, 4]]) {                         // kettlebells
    for (let j = -kr; j <= kr; j++) for (let i = -kr; i <= kr; i++) if (i * i + j * j <= kr * kr) p.px(kx + i, GYM_FLOOR - kr - 1 + j, '#2e3238');
    for (let i = -1; i <= 1; i++) p.px(kx + i, GYM_FLOOR - 2 * kr - 3, '#2e3238');
    p.px(kx - 2, GYM_FLOOR - 2 * kr - 2, '#2e3238'); p.px(kx + 2, GYM_FLOOR - 2 * kr - 2, '#2e3238');
  }
  for (let x = hx - 44; x < hx - 30; x++) { p.px(x, 78, '#2a2c32'); p.px(x, 79, '#22242a'); }   // a bench, a towel on it
  for (const x of [hx - 42, hx - 32]) for (let y = 80; y < GYM_FLOOR; y++) p.px(x, y, '#5a5e66');
  p.rect(hx - 40, 76, 5, 2, '#c8ccd0');
  return p;
}

export function buildTimelapse(W, H = 96) {
  const hx = Math.round(W * 0.34), layers = { desk: deskRoom(W, H, hx), front: deskFront(W, H, hx), gym: gymRoom(W, H, hx) };
  SEASONS.forEach((season, k) => { layers[`win${k}`] = windowView(season); });
  const r = rng(30), code = Array.from({ length: 30 }, () => [Math.floor(r() * 4), 2 + Math.floor(r() * 12), ['#7ab89a', '#8aa8d8', '#d8d0a8', '#c8c8c8'][Math.floor(r() * 4)]]);
  return { W, H, hx, code, layers };
}

const labels = new Map();
function text(str, ink) {
  if (!labels.has(str + ink)) labels.set(str + ink, label(str, ink));
  return labels.get(str + ink);
}

function desk(ctx, t, s, env, year, u) {
  const { canvases: c, hx } = s, season = seasonAt(u);
  ctx.drawImage(c.desk, 0, 0);
  ctx.drawImage(c[`win${SEASONS.indexOf(season)}`], hx + 60, 28);
  const a = t * 75, b = t * 6.3;                                                    // the clock racing
  ctx.fillStyle = '#2a2a30';
  for (let k = 1; k <= 3; k++) ctx.fillRect(Math.round(hx + 32 + Math.cos(a) * k), Math.round(22 + Math.sin(a) * k), 1, 1);
  for (let k = 1; k <= 2; k++) ctx.fillRect(Math.round(hx + 32 + Math.cos(b) * k), Math.round(22 + Math.sin(b) * k), 1, 1);
  const yr = env.art(text(String(2021 + year), '#2a2a30'));                          // the calendar on the wall
  ctx.fillStyle = '#ecebe6'; ctx.fillRect(hx + 2, 32, yr.width + 6, 12);
  ctx.fillStyle = '#a84a4a'; ctx.fillRect(hx + 2, 32, yr.width + 6, 3);
  ctx.drawImage(yr, hx + 5, 37);
  const word = env.art(text('PAPERS', BLUE)), n = env.art(text(String(papersAt(year, u)), '#a84a4a'));
  ctx.drawImage(word, hx - 50, 42); ctx.drawImage(n, hx - 50 + word.width + 4, 42);
  const dog = env.dog(dogCoat(year, season), 'sleep', 'muted');                     // the dog asleep on its bed
  ctx.drawImage(dog.canvases[Math.floor(t * 2) % 2], hx - 28, 88 - dog.footY);
  const z = (t * 1.5) % 1;                                                          // Zz
  ctx.globalAlpha = 1 - z; ctx.fillStyle = '#e8e8ec';
  const zx = hx - 10 + Math.round(z * 4), zy = 76 - Math.round(z * 8);
  ctx.fillRect(zx, zy, 3, 1); ctx.fillRect(zx + 1, zy + 1, 1, 1); ctx.fillRect(zx, zy + 2, 3, 1);
  ctx.globalAlpha = 1;
  const hero = env.hero('lab', 'type', 'muted');
  ctx.drawImage(hero.canvases[Math.floor(t * 8) % 2], hx - hero.anchorX, SEAT - 1 - hero.seatY);
  ctx.drawImage(c.front, 0, 0);
  s.code.forEach(([indent, len, col], i) => {                                      // code scrolling up the screen
    const y = 51 + ((i * 2 - Math.floor(t * 20)) % 60 + 60) % 60;
    if (y > 66) return;
    ctx.fillStyle = col; ctx.fillRect(hx + 26 + indent * 2, y, Math.min(len, 18 - indent * 2), 1);
  });
  const cups = year * CUPS + Math.min(CUPS, Math.floor(u * (CUPS + 1)));             // the coffee cups pile up
  for (let i = 0; i < cups; i++) {
    const cx = hx + 50 + (i % 6) * 4 + (Math.floor(i / 6) % 2) * 2, cy = DESK_TOP - 4 - Math.floor(i / 6) * 4;
    ctx.fillStyle = '#e6e4e0'; ctx.fillRect(cx, cy, 3, 4);
    ctx.fillStyle = '#8a6a4a'; ctx.fillRect(cx, cy + 2, 3, 1);
    ctx.fillStyle = '#4a4c54'; ctx.fillRect(cx, cy, 3, 1);
  }
}

function gym(ctx, t, s, env, year) {
  const { canvases: c, hx } = s;
  ctx.drawImage(c.gym, 0, 0);
  const hero = env.hero(year < 2 ? 'gym1' : 'gym5', 'curl', 'muted'), f = Math.floor(t * 5) % 2;
  const x = hx - hero.anchorX, y = GYM_FLOOR - hero.footY, [hx0, hy0] = hero.hands[f], r = BELL[year];
  const bell = (cx, cy) => {                                                        // the dumbbell, seen end on: a silver plate
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      const d = i * i + j * j;
      if (d > r * r + 1) continue;
      ctx.fillStyle = d > (r - 1) * (r - 1) ? '#5a5e66' : d < 2 ? '#3a3e46' : (i - j) > r * 0.6 ? '#7e848c' : '#a4aab2';
      ctx.fillRect(cx + i, cy + j, 1, 1);
    }
  };
  ctx.save(); ctx.beginPath(); ctx.rect(hx + MIRROR[0] + 1, 23, MIRROR[1] - MIRROR[0] - 2, 48); ctx.clip();   // a faint reflection
  ctx.globalAlpha = 0.3; ctx.drawImage(hero.canvases[f], x + 7, y - 3); ctx.restore(); ctx.globalAlpha = 1;
  ctx.drawImage(hero.canvases[f], x, y);
  bell(x + hx0, y + hy0);
  if (f === 1) { ctx.fillStyle = '#d8dee6'; ctx.fillRect(x + 31, y + 15, 2, 1); ctx.fillRect(x + 32, y + 18, 2, 1); }   // effort lines
}

export function renderTimelapse(ctx, t, s, env) {
  const { W, H } = s, { year, room, u } = phaseAt(t);
  ctx.clearRect(0, 0, W, H);
  if (room === 'desk') desk(ctx, t, s, env, year, u); else gym(ctx, t, s, env, year);
}

export const timelapse = { build: buildTimelapse, render: renderTimelapse };
```

Replace `reel/ch3/index.js` with:

```js
// Chapter 3: Michigan, five grey years from the first snow to the hooding, and out through the door.
import { snow } from './snow.js';
import { timelapse } from './timelapse.js';

export const CHAPTER_3 = {
  name: 'Michigan',
  shots: [
    { id: 'ch3-snow', scene: snow, caption: 'Michigan', duration: 2 },
    { id: 'ch3-timelapse', scene: timelapse, caption: 'Michigan', duration: 4.5, fadeIn: 0.1 },
  ],
};
```

- [ ] **Step 4: Run the unit tests**

Run: `node --test 'tests/reel/*.test.js'`
Expected: `ℹ pass 151`, `ℹ fail 0`.

- [ ] **Step 5: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 35.9,36.25,36.6,37.2,38.5,39.7,40.0 && python3 tests/reel/sheet.py /tmp/f /tmp/f-tl.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 37.0,38.5 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-tl.png 3
```

Expected:
- At the desk (35.9, 36.25, 37.2, 39.7 s), the grey office has:
  - a whiteboard of squiggles reading `PAPERS 0`, then `1`, …, `15` as the years go by
  - a calendar with the year, `2021` to `2025`, and a clock racing
  - a monitor scrolling code
  - a window whose season changes from frame to frame
  - coffee cups piling up on the desk
  - the dog asleep on its bed behind the chair: a puppy in 2021, grown and dressed for the season later
  - Yimeng in the grey hoodie and headphones, typing
- In the gym (36.6, 38.5, 40.0 s): a long mirror with Yimeng's faint reflection, a green stripe, a rack with a loaded bar, rows of dumbbells, kettlebells and a bench.
  - Yimeng curls a silver dumbbell that is bigger each year.
  - From 38.5 s Yimeng's arms and shoulders are visibly bigger.

- [ ] **Step 6: Commit**

```bash
git add reel/ch3/timelapse.js reel/ch3/index.js tests/reel/ch3-timelapse.test.js
git commit -m "feat(reel): Time-lapse five years of desk and gym in Michigan"
```

---

### Task 4: The hooding

**Files:**
- Create: `reel/ch3/hooding.js`
- Modify: `reel/ch3/index.js`
- Test: `tests/reel/ch3-hooding.test.js`

**Interfaces:**
- Produces: `hoodAt(scene, t) → { x, y, worn }`.
  - Before 0.35 s the hood is held on the advisor's side.
  - It then rises over Yimeng's head and is worn from 1 s.
- Produces: `drawHood(ctx, x, y, bob = 0)`: the worn hood (velvet collar, green satin with a white chevron down the back) on a hero sprite drawn at `(x, y)`.
- Produces: `hooding` (a scene), with layer `stage`. It exposes `hx`, `heads` (the audience) and `flashes`.
  - Yimeng stands at `hx` in `phd` (muted), walk frame 1, on row 82.
  - The advisor stands at `hx + 30`.

- [ ] **Step 1: Write the failing test.** Create `tests/reel/ch3-hooding.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { hooding, hoodAt } from '../../reel/ch3/hooding.js';

sceneContract('ch3 hooding', hooding, 2);

test("hooding: the advisor lifts the hood over Yimeng's head and onto the shoulders", () => {
  const s = hooding.build(480, 96), held = hoodAt(s, 0.2), over = hoodAt(s, 0.68), worn = hoodAt(s, 1.2);
  assert.equal(held.worn, false);
  assert.ok(held.x > s.hx + 15, "held up on the advisor's side");
  assert.ok(over.y < held.y, 'lifted over the head');
  assert.equal(worn.worn, true);
});

test('hooding: Yimeng stands in the doctoral gown, greyed like the rest of Michigan', () => {
  const s = hooding.build(480, 96);
  assert.deepEqual(frameAt(hooding, 480, 1.5).ctx.draws('phd:walk:muted:1'), [[s.hx - 9, 82 - 44]]);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test 'tests/reel/ch3-hooding.test.js'`
Expected: the file fails to load (`Cannot find module …/reel/ch3/hooding.js`).

- [ ] **Step 3: Implement.** Create `reel/ch3/hooding.js`:

```js
// Chapter 3, shot 3: the PhD hooding. On the commencement stage, before a green curtain, the advisor
// lifts the doctoral hood over Yimeng's head and lays it on Yimeng's shoulders; the audience claps
// and cameras flash. (Columbia ended with a cap toss; this is deliberately quieter.)
import { Painter, rng, textRows } from '../pixels.js';
import { art } from '../kit.js';

const STAGE = 82;                              // the row Yimeng's shoes rest on
const HOLD = 0.35, PLACED = 1.0;               // the hood is held up, then over the head and down by PLACED
const GREEN = '#3a5a4c', WHITE = '#e8e8e4', VELVET = '#2c3c6a';

// The advisor, facing left: dark hair, glasses, a black doctoral gown with velvet facings, a tam.
const ADVISOR = art(`
.....KKKKKKKK.......
...KKKKKKKKKKKK.....
..KKKKKKKKKKKKKKY...
....HHHHHHHHH...Y...
...HhhHHHHHHHHH.Y...
..HHHHHHHHHHHHHH....
.HHHHHHHHHHHHHHHH...
.SHHHHHHHHHHHHHHHH..
.SSSSHHHHHHHHHHHHH..
.GGGGGSSSHHHHHHHHH..
.GSEGSSSSSSSeeHHHH..
SGGGGSSSSSSSeqeHHH..
.SSSSSSSSSSSSeHHHH..
.sSSSSSSSSSSSSHHH...
..sSSSmSSSSSSSHH....
...ssSSSSSSSSs......
........SSS.........
......VBBBBBBB......
......VBBBBBBBB.....
......VBBBBBBBB.....
.....VBBBBBBBBBB....
.....VBBBBBBBBBB....
.....VBBBBBBBBBBB...
....VBBBBBBBBBBBB...
....VBBBBBBBBBBBBB..
....VBBBBBBBBBBBBB..
...VBBBBBBBBBBBBBB..
...VBBBBBBBBBBBBBBB.
...BBBBBBBBBBBBBBBB.
...BBBBBBBBBBBBBBBB.
....OOOO....OOOO....
`, { K: '#16161c', Y: '#d9b44a', H: '#22202a', h: '#3a3644', S: '#e2b896', s: '#c89a7a', e: '#d4a684', q: '#a87a5e', E: '#241c22', G: '#2a2a30', m: '#9a5a50', B: '#1c1c22', V: VELVET, O: '#121216' }, '#0e0e12');

// The hood as the advisor holds it up by its velvet collar, the satin lining hanging below it:
// MSU green with a white chevron.
const HOOD_HELD = art(`
..VVVVVVVV..
.VV......VV.
.V........V.
.VV......VV.
..VVVVVVVV..
...VGGGGV...
...VGWWGV...
...VWGGWV...
...VGWWGV...
...VWGGWV...
....VGGV....
....VWWV....
.....VV.....
`, { V: VELVET, G: GREEN, W: WHITE }, '#14161c');

// Draw the hood as worn: over the shoulders and down the back of a hero sprite drawn at (x, y),
// where x is the sprite's left edge and bob the frame's 1px dip. Used by the door shot too.
export function drawHood(ctx, x, y, bob = 0) {
  const sx = x + 9, top = y + 11 + 17 + bob;                                        // the character's left edge; the shoulder row
  ctx.fillStyle = VELVET; ctx.fillRect(sx + 2, top - 1, 11, 2);                    // the velvet collar over the shoulders
  ctx.fillRect(sx, top, 6, 11);                                                     // the hood down the back, edged in velvet
  ctx.fillStyle = GREEN; ctx.fillRect(sx + 1, top + 1, 4, 9);                      // its satin lining, with a white chevron
  ctx.fillStyle = WHITE;
  for (const [dy, dx] of [[3, 1], [4, 2], [5, 3], [4, 4]]) ctx.fillRect(sx + dx, top + dy, 1, 1);
  ctx.fillRect(sx + 2, top + 8, 2, 1);
}

function stage(W, H, hx) {
  const p = new Painter(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = (x % 9 < 2) ? '#2a3a34' : (x % 9 < 5 ? '#33463e' : '#3a4e46');           // the curtain's folds
    if (y >= 74 && y < 84) c = y === 74 ? '#8a7e72' : (x + (y % 3) * 7) % 24 === 0 ? '#5e554c' : '#6e6458';   // the stage boards
    if (y === 84) c = '#2a2622';
    if (y > 84) c = '#121216';                                                      // the dark hall
    p.px(x, y, c);
  }
  for (let x = 0; x < W; x++) for (let y = 0; y < 8; y++) p.px(x, y, y === 7 ? '#8a7a4a' : '#2a3a34');   // a valance with a gold edge
  const px0 = hx + 72;                                                              // the lectern, lettered MSU
  for (let y = 56; y < 82; y++) for (let x = px0; x < px0 + 20; x++) p.px(x, y, y < 58 ? '#4a4038' : x === px0 || x === px0 + 19 ? '#3a322c' : '#5a5048');
  textRows('MSU').forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === '#') p.px(px0 + 5 + x, 64 + y, WHITE); });
  for (let y = 50; y < 56; y++) p.px(px0 + 4, y, '#2a2a30');                       // the microphone
  p.rect(px0 + 3, 49, 2, 2, '#4a4a52');
  for (const fx of [hx - 40, hx + 104]) {                                           // flowers at the stage's edge
    p.rect(fx, 76, 8, 6, '#4a4038');
    for (let n = 0; n < 16; n++) p.px(fx + (n * 5) % 9, 71 + (n * 3) % 5, n % 3 ? '#d8d8d2' : '#5a7a62');
  }
  return p;
}

export function buildHooding(W, H = 96) {
  const hx = Math.round(W * 0.34), r = rng(2025), heads = [];
  for (let x = -2; x < W; x += 9 + Math.floor(r() * 4)) heads.push({ x, y: 88 + Math.floor(r() * 4), ph: r() * 6, cap: r() < 0.4 });
  const flashes = Array.from({ length: 6 }, (_, i) => ({ x: Math.floor(r() * W), y: 86 + Math.floor(r() * 6), at: PLACED + 0.1 + i * 0.15 }));
  return { W, H, hx, heads, flashes, layers: { stage: stage(W, H, hx) } };
}

// Where the hood is: held between them, then lifted over Yimeng's head and down to the shoulders.
export function hoodAt(s, t) {
  const from = [s.hx + 20, 48], over = [s.hx + 9, 38], to = [s.hx + 7, 56];
  if (t < HOLD) return { x: from[0], y: from[1], worn: false };
  if (t >= PLACED) return { x: to[0], y: to[1], worn: true };
  const u = (t - HOLD) / (PLACED - HOLD), a = u < 0.5 ? from : over, b = u < 0.5 ? over : to, v = u < 0.5 ? u * 2 : u * 2 - 1;
  return { x: Math.round(a[0] + (b[0] - a[0]) * v), y: Math.round(a[1] + (b[1] - a[1]) * v), worn: false };
}

export function renderHooding(ctx, t, s, env) {
  const { W, H, canvases: c, hx } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.stage, 0, 0);
  ctx.globalAlpha = 0.12; ctx.fillStyle = '#fff4d8';                                // a spotlight on the two of them
  for (let k = 0; k < 4; k++) ctx.fillRect(hx - 20 + k * 6, 8 + k * 10, 90 - k * 12, 76 - k * 10);
  ctx.globalAlpha = 1;
  const hero = env.hero('phd', 'walk', 'muted'), x = hx - hero.anchorX, y = STAGE - hero.footY;
  ctx.drawImage(hero.canvases[1], x, y);
  const advisor = env.art(ADVISOR), ax = hx + 30, ay = STAGE - advisor.height + 1;
  ctx.drawImage(advisor, ax, ay);
  const hood = hoodAt(s, t);
  if (hood.worn) drawHood(ctx, x, y);
  else {
    const held = env.art(HOOD_HELD), hxp = hood.x, hyp = hood.y;
    ctx.drawImage(held, hxp - 6, hyp - 5);
    const x0 = ax + 7, y0 = ay + 20, x1 = hxp + 4, y1 = hyp - 3, n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let k = 0; k <= n; k++) {                                                  // a sleeve up to the hood's collar, with a velvet bar
      ctx.fillStyle = Math.abs(k - n / 2) < 1 ? VELVET : '#1c1c22';
      ctx.fillRect(Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), 2, 2);
    }
    ctx.fillStyle = '#e2b896'; ctx.fillRect(x1, y1, 2, 2);
  }
  // the audience: heads in the dark, hands up clapping once the hood is on
  for (const h of s.heads) {
    const bob = t > PLACED ? Math.round(Math.sin(t * 14 + h.ph)) : 0;
    ctx.fillStyle = '#26262c'; ctx.fillRect(h.x, h.y + bob, 6, 8);
    if (h.cap) { ctx.fillStyle = '#1a1a20'; ctx.fillRect(h.x - 1, h.y - 1 + bob, 8, 1); }
    if (t > PLACED && Math.sin(t * 14 + h.ph) > 0.3) { ctx.fillStyle = '#3a3a42'; ctx.fillRect(h.x + 1, h.y - 3 + bob, 2, 2); ctx.fillRect(h.x + 4, h.y - 3 + bob, 2, 2); }
  }
  for (const f of s.flashes) {                                                      // cameras going off
    const a = 1 - Math.abs(t - f.at) / 0.08;
    if (a > 0) { ctx.globalAlpha = a; ctx.fillStyle = '#ffffff'; ctx.fillRect(f.x - 2, f.y, 5, 1); ctx.fillRect(f.x, f.y - 2, 1, 5); ctx.globalAlpha = 1; }
  }
}

export const hooding = { build: buildHooding, render: renderHooding };
```

Replace `reel/ch3/index.js` with:

```js
// Chapter 3: Michigan, five grey years from the first snow to the hooding, and out through the door.
import { snow } from './snow.js';
import { timelapse } from './timelapse.js';
import { hooding } from './hooding.js';

export const CHAPTER_3 = {
  name: 'Michigan',
  shots: [
    { id: 'ch3-snow', scene: snow, caption: 'Michigan', duration: 2 },
    { id: 'ch3-timelapse', scene: timelapse, caption: 'Michigan', duration: 4.5, fadeIn: 0.1 },
    { id: 'ch3-hooding', scene: hooding, caption: 'Michigan', duration: 2, fadeIn: 0.15, fadeOut: 0.15 },
  ],
};
```

- [ ] **Step 4: Run the unit tests**

Run: `node --test 'tests/reel/*.test.js'`
Expected: `ℹ pass 155`, `ℹ fail 0`.

- [ ] **Step 5: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 40.35,40.75,41.5 && python3 tests/reel/sheet.py /tmp/f /tmp/f-hood.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 41.5 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-hood.png 3
```

Expected:
- The commencement stage: a green curtain under a gold-edged valance, a lectern lettered `MSU` with a microphone, and flowers at the edge. A spotlight falls on the two figures.
- 40.35 s: the advisor (black gown with velvet facings, gold-tasselled tam, glasses) raises the hood on one sleeve: a velvet collar over green-and-white satin.
- 40.75 s: the hood is above Yimeng's head.
- 41.5 s: the hood hangs down Yimeng's back over the green gown. The dark audience below claps, and camera flashes go off.

- [ ] **Step 6: Commit**

```bash
git add reel/ch3/hooding.js reel/ch3/index.js tests/reel/ch3-hooding.test.js
git commit -m "feat(reel): Hood Yimeng at the Michigan State commencement"
```

---

### Task 5: The door, and colour

**Files:**
- Create: `reel/ch3/door.js`
- Modify: `reel/ch3/index.js`
- Test: `tests/reel/ch3-door.test.js`, `tests/reel/ch3-chapter.test.js`

**Interfaces:**
- Consumes: `drawHood` (Task 4); tones `'muted'` and `'full'` (Task 1).
- Produces: `floodAt(t, W)`, the radius of the colour round the doorway. It is 0 until 0.8 s, then grows (eased) to `W + 60` at 1.45 s.
- Produces: `door` (a scene), with layers `grey` (the corridor) and `oz` (California in full colour). It exposes `hx` and `dx` (the door's left edge).
  - The door swings open between 0.55 and 0.8 s.
  - Inside the colour, the cast is drawn again in `'full'`.
- Produces: `CHAPTER_3` complete: snow 2 s, time-lapse 4.5 s, hooding 2 s, door 1.5 s, 10 s in all, with no fade at either end.

- [ ] **Step 1: Write the failing tests.** Create `tests/reel/ch3-door.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { door, floodAt } from '../../reel/ch3/door.js';

sceneContract('ch3 door', door, 1.5);

const names = (t) => frameAt(door, 480, t).ctx.calls.filter(c => c[0] === 'drawImage').map(c => String(c[1]));

test('the door: the colour floods out from the doorway until it fills the frame', () => {
  assert.equal(floodAt(0.7, 480), 0);
  assert.ok(floodAt(1.1, 480) > 0 && floodAt(1.1, 480) < 480);
  assert.ok(floodAt(1.5, 480) > 480);
});

test('the door: Yimeng is grey outside the colour, and in full colour inside it', () => {
  const before = names(0.3), during = names(1.2);
  assert.equal(before.filter(n => n.startsWith('phd:walk:muted')).length, 1);
  assert.equal(before.filter(n => /^phd:walk:\d/.test(n)).length, 0, 'no colour yet');
  assert.equal(during.filter(n => /^phd:walk:\d/.test(n)).length, 1, 'drawn again in colour inside the flood');
  assert.ok(during.includes('oz'), 'California inside the colour');
});
```

Create `tests/reel/ch3-chapter.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTER_3 } from '../../reel/ch3/index.js';

test('chapter 3 runs from the snow to the door, 10 s in all', () => {
  assert.equal(CHAPTER_3.name, 'Michigan');
  assert.deepEqual(CHAPTER_3.shots.map(s => s.id), ['ch3-snow', 'ch3-timelapse', 'ch3-hooding', 'ch3-door']);
  assert.ok(CHAPTER_3.shots.every(s => s.caption === 'Michigan'));
  assert.equal(Math.round(CHAPTER_3.shots.reduce((a, s) => a + s.duration, 0) * 10) / 10, 10);
  assert.ok(!CHAPTER_3.shots[0].fadeIn, 'it opens on the white of the cap toss, not on black');
  assert.ok(!CHAPTER_3.shots.at(-1).fadeOut, 'and ends in full colour, straight into California');
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `node --test 'tests/reel/ch3-door.test.js' 'tests/reel/ch3-chapter.test.js'`
Expected: the door file fails to load (`Cannot find module …/reel/ch3/door.js`), and the chapter test fails because there are only three shots, 8.5 s in all.

- [ ] **Step 3: Implement.** Create `reel/ch3/door.js`:

```js
// Chapter 3, shot 4: out of Michigan. In a grey corridor Yimeng, hooded, walks with the dog to a
// door. It swings open on California in full colour, sun, sea and palms, and the colour floods out
// through the doorway until it fills everything, as in The Wizard of Oz.
import { Painter, rng } from '../pixels.js';
import { gradient } from '../kit.js';
import { drawHood } from './hooding.js';

const FLOOR = 88;                              // the row Yimeng's shoes rest on
const STEP = 26;                               // walk speed, px/s
const OPEN = [0.55, 0.8];                      // the door swings open
const FLOOD = [0.8, 1.45];                     // the colour spreads from the doorway to the whole frame
const DOOR_W = 16, DOOR_TOP = 50;

// How far the colour has spread: the radius of the circle round the doorway, in px.
export function floodAt(t, W) {
  const u = Math.min(1, Math.max(0, (t - FLOOD[0]) / (FLOOD[1] - FLOOD[0])));
  return u * u * (W + 60);
}

function corridor(W, H, dx) {
  const p = new Painter(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = y < 80 ? ((x % 40 === 0) ? '#7e7e7a' : '#8e8e8a') : (x + (y % 2) * 5) % 10 === 0 ? '#5e5a54' : '#6c6862';
    if (y === 62) c = '#7a7a76';
    p.px(x, y, c);
  }
  for (let y = DOOR_TOP - 2; y < 80; y++) for (let x = dx - 2; x < dx + DOOR_W + 2; x++) p.px(x, y, '#5a5650');   // the frame
  for (let y = 18; y < 30; y++) for (let x = dx; x < dx + DOOR_W; x++) p.px(x, y, (x + y) % 2 ? '#b8b8b2' : '#a8a8a2');   // an EXIT light, unlit
  return p;
}

// California through the door: sun over the Pacific, golden hills, palms.
function california(W, H) {
  const p = gradient(W, H, [['#4a8fd8', 0], ['#6aa8e4', 0.3], ['#94c4ee', 0.55], ['#c8e2f6', 0.72]]);
  const sx = Math.round(W * 0.7);
  for (let j = -9; j <= 9; j++) for (let i = -9; i <= 9; i++) {
    const d = Math.hypot(i, j);
    if (d < 6) p.px(sx + i, 30 + j, '#fff4c4'); else if (d < 9 && (i + j) % 2 === 0) p.px(sx + i, 30 + j, '#ffe08a');
  }
  for (let y = 66; y < 80; y++) for (let x = 0; x < W; x++) p.px(x, y, y < 68 ? '#8ac8e8' : (x * 3 + y) % 11 === 0 ? '#5aa0d0' : '#3a86c4');   // the sea
  for (let x = 0; x < W; x++) {                                                    // golden hills
    const h = 6 + Math.sin(x * 0.03) * 4 + Math.sin(x * 0.11) * 2;
    for (let y = Math.round(66 - h); y < 66; y++) if (x < W * 0.45) p.px(x, y, y === Math.round(66 - h) ? '#e8c06a' : '#d8a850');
  }
  for (let y = 80; y < H; y++) for (let x = 0; x < W; x++) p.px(x, y, y < 82 ? '#f0d8a8' : (x + y) % 7 === 0 ? '#d8b878' : '#e8c890');   // sand
  const r = rng(6);
  for (const fx of [0.12, 0.3, 0.86]) {                                            // palms
    const x0 = Math.round(W * fx);
    for (let s = 0; s < 34; s++) p.px(x0 + Math.round((s / 34) ** 2 * 4), 80 - s, s % 3 ? '#8a6040' : '#6a4630');
    for (const [dir, droop] of [[-1, 0.8], [-0.6, 0.3], [0.6, 0.3], [1, 0.8], [0.1, 0]]) for (let k = 0; k < 13; k++) {
      p.px(x0 + 4 + dir * k, 46 - Math.round(2 * Math.sin(k / 13 * Math.PI) * (1 - droop) - droop * (k / 13) ** 2 * 8), r() < 0.5 ? '#3f8a3a' : '#5aa848');
    }
  }
  return p;
}

export function buildDoor(W, H = 96) {
  const hx = Math.round(W * 0.34), dx = Math.round(W * 0.62);
  return { W, H, hx, dx, layers: { grey: corridor(W, H, dx), oz: california(W, H) } };
}

// Clip to the circle the colour has reached, row by row (cx, cy: the doorway's middle).
function clipCircle(ctx, cx, cy, r, H) {
  ctx.beginPath();
  for (let y = 0; y < H; y++) {
    const d = r * r - (y - cy) * (y - cy);
    if (d > 0) { const w = Math.sqrt(d); ctx.rect(Math.round(cx - w), y, Math.round(2 * w), 1); }
  }
  ctx.clip();
}

function cast(ctx, t, s, env, tone) {
  const hero = env.hero('phd', 'walk', tone), dog = env.dog('bandana', 'trot', tone), f = Math.floor(t * 6) % 4;
  const x = Math.round(s.hx - 18 + t * STEP) - hero.anchorX, y = FLOOR - hero.footY;
  ctx.drawImage(hero.canvases[f], x, y);
  drawHood(ctx, x, y, f % 2 === 0 ? 1 : 0);
  ctx.drawImage(dog.canvases[Math.floor(t * 9) % 4], Math.round(s.hx + 14 + t * STEP) - dog.anchorX, FLOOR - dog.footY);
}

export function renderDoor(ctx, t, s, env) {
  const { W, H, canvases: c, dx } = s, r = floodAt(t, W), cy = DOOR_TOP + 15;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.grey, 0, 0);
  if (t >= OPEN[0]) {                                                               // the doorway shows California
    ctx.save(); ctx.beginPath(); ctx.rect(dx, DOOR_TOP, DOOR_W, 80 - DOOR_TOP); ctx.clip();
    ctx.drawImage(c.oz, 0, 0); ctx.restore();
  }
  const swing = Math.min(1, Math.max(0, (t - OPEN[0]) / (OPEN[1] - OPEN[0])));      // the door panel turning on its hinge
  const panel = Math.round(DOOR_W * (1 - swing * 0.85));
  ctx.fillStyle = '#6a6258'; ctx.fillRect(dx, DOOR_TOP, panel, 80 - DOOR_TOP);
  ctx.fillStyle = '#c8c0b0'; if (panel > 4) ctx.fillRect(dx + panel - 3, 66, 1, 2);
  cast(ctx, t, s, env, 'muted');
  if (r > 0) {                                                                      // the colour floods out from the doorway
    ctx.save(); clipCircle(ctx, dx + DOOR_W / 2, cy, r, H);
    ctx.drawImage(c.oz, 0, 0);
    cast(ctx, t, s, env, 'full');
    ctx.restore();
    ctx.fillStyle = '#fff6d0';                                                      // a bright, glittering edge to it
    for (let a = 0; a < Math.PI * 2; a += 2 / Math.max(8, r)) {
      if ((Math.floor(a * r) + Math.floor(t * 30)) % 3 === 0) continue;
      ctx.fillRect(Math.round(dx + DOOR_W / 2 + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1);
    }
  }
}

export const door = { build: buildDoor, render: renderDoor };
```

Replace `reel/ch3/index.js` with:

```js
// Chapter 3: Michigan, five grey years from the first snow to the hooding, and out through the door.
import { snow } from './snow.js';
import { timelapse } from './timelapse.js';
import { hooding } from './hooding.js';
import { door } from './door.js';

export const CHAPTER_3 = {
  name: 'Michigan',
  shots: [
    { id: 'ch3-snow', scene: snow, caption: 'Michigan', duration: 2 },
    { id: 'ch3-timelapse', scene: timelapse, caption: 'Michigan', duration: 4.5, fadeIn: 0.1 },
    { id: 'ch3-hooding', scene: hooding, caption: 'Michigan', duration: 2, fadeIn: 0.15, fadeOut: 0.15 },
    { id: 'ch3-door', scene: door, caption: 'Michigan', duration: 1.5, fadeIn: 0.1 },
  ],
};
```

- [ ] **Step 4: Run the unit tests**

Run: `node --test 'tests/reel/*.test.js'`
Expected: `ℹ pass 160`, `ℹ fail 0`.

- [ ] **Step 5: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 42.4,42.85,43.15,43.45,43.65,43.9 && python3 tests/reel/sheet.py /tmp/f /tmp/f-door.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 43.2 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-door.png 3
```

Expected:
- 42.4 s: a grey corridor. Yimeng, hooded, walks with the dog towards a door under an unlit EXIT light.
- 42.85 s: the door is swinging open on a sliver of blue.
- 43.15 s: a circle of full colour (blue sky, sea, sand) spreads from the doorway with a glittering edge.
- 43.45 s: the colour has most of the frame. Yimeng and the dog are in full colour where it has reached them.
- 43.65 s: all California: sun, sea, golden hills, palms.
- 43.9 s: chapter 4's stand-in beach, in colour.

- [ ] **Step 6: Commit**

```bash
git add reel/ch3/door.js reel/ch3/index.js tests/reel/ch3-door.test.js tests/reel/ch3-chapter.test.js
git commit -m "feat(reel): Open the door on California and flood Michigan with colour"
```

---

### Task 6: Page checks, spec and hand-off

**Files:**
- Modify: `tests/reel/page-check.sh`, `docs/superpowers/specs/2026-10-03-life-reel-design.md`

- [ ] **Step 1: See the page checks fail.** Chapter 3 now ends at 43.7 s.

Run: `tests/reel/page-check.sh`
Expected:
- `FAIL - California lights step 4`, because 43 s is still Michigan.
- `FAIL - To be continued keeps step 4 lit`, because 50 s is still California.
- Exit 1.

- [ ] **Step 2: Move the times.** The chapter spans are now:
  - Michigan 33.7–43.7
  - California 43.7–51.7
  - To be continued 51.7–55.7

Apply to `tests/reel/page-check.sh`:

`tests/reel/page-check.sh`, change 1. Find:

```bash
d=$(dom 1440,900 '?reel=43'); expect 'California lights step 4' "$d" 'data-chapter="3"' 'class="step is-live" data-org="amazon"'
d=$(dom 1440,900 '?reel=50'); expect 'To be continued keeps step 4 lit' "$d" 'data-chapter="4"' '>To be continued…<' 'class="step is-live" data-org="amazon"'
```

Replace with:

```bash
d=$(dom 1440,900 '?reel=47'); expect 'California lights step 4' "$d" 'data-chapter="3"' 'class="step is-live" data-org="amazon"'
d=$(dom 1440,900 '?reel=53'); expect 'To be continued keeps step 4 lit' "$d" 'data-chapter="4"' '>To be continued…<' 'class="step is-live" data-org="amazon"'
```

- [ ] **Step 3: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 160`, then 15 `ok` lines and exit 0.

- [ ] **Step 4: Update the spec.** Apply to `docs/superpowers/specs/2026-10-03-life-reel-design.md`:

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 1. Find:

```markdown
**The dog.** A slender sighthound with a slate-grey coat, thin legs, a long muzzle and folded ears, matching the dog in the hero photo. It trots at about 9 fps. It joins at the 2019 graduation as a puppy and grows up during the Michigan time-lapse.
```

Replace with:

```markdown
**The dog.** A slender sighthound with a slate-grey coat, thin legs, a long muzzle and folded ears, matching the dog in the hero photo. It trots at about 9 fps. It joins at the 2019 graduation as a puppy and grows up during the Michigan time-lapse, asleep by the desk.
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 2. Find:

```markdown
The two dive outfits use swimming poses in the reel. The other outfits walk. Yimeng also sits (on the train, at Trolltunga and in the restaurants), and at the cap toss cheers bareheaded in the gown.
```

Replace with:

```markdown
The two dive outfits use swimming poses in the reel. The other outfits walk. Yimeng also sits (on the train, at Trolltunga and in the restaurants), types at the desk, curls dumbbells in the gym, and at the cap toss cheers bareheaded in the gown.
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 3. Find:

```markdown
The full loop runs about 62 s, and the timings below are targets. The caption is the place name and fades in at the top left whenever it changes.
```

Replace with:

```markdown
The full loop runs about 63 s, and the timings below are targets. The caption is the place name and fades in at the top left whenever it changes.
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 4. Find:

```markdown
### 3 · Michigan (~9 s). Caption: `Michigan`. Grey, low-saturation palette.
```

Replace with:

```markdown
### 3 · Michigan (~10 s). Caption: `Michigan`. Grey, low-saturation palette: the sets are painted in muted colours, and Yimeng and the dog are drawn in a muted version of their palettes.
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 5. Find:

```markdown
1. Snow, flat land and Beaumont Tower.
2. A time-lapse. The window cycles snow → green five times, one cycle per year. The scene cuts back and forth between the desk and the gym, and Yimeng gets visibly stronger with each gym cut. Coffee cups pile up, and a paper counter ticks upward. The dog sleeps by the desk and grows from puppy to adult, changing outfits with the seasons.
3. PhD graduation: the advisor places the doctoral hood on Yimeng's shoulders (the hooding ceremony). This is deliberately different from the cap toss at Columbia.
4. Transition: a door opens and colour floods in, as in *The Wizard of Oz*.
```

Replace with:

```markdown
1. Snow, flat land and Beaumont Tower. The white of the cap toss clears off a snowfield under a low grey sky, with bare trees and Michigan State's brick carillon tower, snow on its ledges. Yimeng walks on in the green puffer, the puppy trotting ahead, leaving footprints.
2. A time-lapse of five years, 2021 to 2025, each a little quicker than the last. Each year cuts from the desk to the gym.
   - At the desk, the window runs through winter, spring, summer and autumn, and the calendar turns over the year. Coffee cups pile up, and the paper count on the whiteboard climbs from 0 to 16, the papers of those years. The dog sleeps on its bed behind the chair: a puppy the first year, then grown, in the green knit in winter, the bandana in spring and autumn, nothing in summer.
   - In the gym, Yimeng curls a dumbbell in front of the mirror. The plates get bigger every year, and from the third year on Yimeng is visibly bigger too.
3. PhD graduation: under a spotlight on the commencement stage, the advisor lifts the doctoral hood, green and white satin with a velvet collar, over Yimeng's head and lays it on Yimeng's shoulders (the hooding ceremony). The audience claps and cameras flash. This is deliberately different from the cap toss at Columbia.
4. Transition: in a grey corridor, Yimeng, hooded, walks with the dog to a door. It swings open on California in full colour, and the colour floods out from the doorway, as in *The Wizard of Oz*. Whatever it reaches turns to colour, Yimeng and the dog included, until it fills the frame.
```

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 6. Find:

```markdown
- **Rendering:** layers are pre-rendered once into offscreen canvases that tile seamlessly. They are built lazily just before a shot starts and released after it ends. Each frame composes the layers and actors onto one canvas at native resolution, about 480×96 on desktop, which the browser scales. The grey Michigan palette and the door → colour transition use palette-derived greyscale variants and a `globalAlpha` crossfade, not `ctx.filter`, which Safari lacks. All layouts use a seeded PRNG, so every play looks the same.
```

Replace with:

```markdown
- **Rendering:** layers are pre-rendered once into offscreen canvases that tile seamlessly. They are built lazily just before a shot starts and released after it ends. Each frame composes the layers and actors onto one canvas at native resolution, about 480×96 on desktop, which the browser scales. The grey Michigan palette and the door → colour transition use palette-derived muted variants of the cast (`env.hero(key, pose, 'muted')`) and a clip that grows from the doorway, not `ctx.filter`, which Safari lacks. All layouts use a seeded PRNG, so every play looks the same.
```

- [ ] **Step 5: Commit**

```bash
git add tests/reel/page-check.sh docs/superpowers/specs/2026-10-03-life-reel-design.md
git commit -m "docs: Describe chapter 3 as built; move the page checks past it"
```

- [ ] **Step 6: Hand over for review.** Give the user:
  - `http://127.0.0.1:8000/?reel=ch3-snow`
  - `?reel=ch3-timelapse`
  - `?reel=ch3-hooding`
  - `?reel=ch3-door`
  - `http://127.0.0.1:8000/` with the `03` button for the whole chapter, and the end of chapter 2 for the snow hand-off

Stop there. Chapter 4 gets its own plan after this review.
