# Life Reel — Phase 2d (Nürburgring: the Golf at twice the size) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply Yimeng's third Nürburgring review: double the Golf to 120×64 and give it more detail.

**Architecture:**
- A second, detailed rear sprite `golfRearBig()` (120×64) joins `golfRear()` (60×32) in `reel/ch1/ring.js`.
- `buildRing(W)` picks the big car when the native width is at least 300 px; that covers laptops and wider. On narrower screens it keeps the small one, because on a phone the road is narrower than the doubled car.
- With the big car the horizon rises from row 36 to row 22, so the road ahead stays visible over the roof.
- The sway, the crest lift, the tyre smoke and the shadow all scale with the car.

**Tech Stack:** Vanilla JS, Node 25 `node:test`, the Phase 2 frame-review tools.

**Spec:** `docs/superpowers/specs/2026-10-03-life-reel-design.md`. **Builds on:** `docs/superpowers/plans/2026-10-03-life-reel-phase-2c.md`.

## Global Constraints

- Everything in the Phase 2 plan's Global Constraints still holds.
- The Golf stays white, with the red grille stripe theme carried by the red tail lights and red GTI letters.
- No timing changes, so `page-check.sh` stays as it is.

---

### Task 1: The full-size, detailed Golf

**Files:**
- Modify: `reel/ch1/ring.js`, `docs/superpowers/specs/2026-10-03-life-reel-design.md`
- Test: `tests/reel/ch1-ring.test.js` (append)

**Interfaces:**
- Produces: `ring.build(W)` exposes `hy`, the horizon row: 22 with the big car, 36 with the small one. The `car` layer is 120×64 when `W ≥ 300`, otherwise 60×32.
- The big car carries:
  - a shark-fin aerial, and a roof spoiler with end plates and a third brake light
  - tinted, defrosted rear glass showing the driver, the passenger headrest, the rear wiper and reflections
  - body-coloured mirrors and flared rear arches
  - LED tail-light clusters with light bars and reverse lamps
  - a chrome VW roundel and red `GTI` letters
  - an `AW GT7` German plate with the EU band and plate lights
  - parking sensors, reflectors and a fog lamp
  - a finned diffuser with twin pipes each side, and wide treaded tyres

- [ ] **Step 1: Write the failing test.** Append to `tests/reel/ch1-ring.test.js`:

```js
test('wide screens get the Golf at twice the size, phones keep the 60x32 one', () => {
  const wide = ring.build(480, 96), phone = ring.build(195, 96);
  assert.deepEqual([wide.layers.car.w, wide.layers.car.h], [120, 64]);
  assert.deepEqual([phone.layers.car.w, phone.layers.car.h], [60, 32]);
  assert.ok(wide.hy < phone.hy, 'the horizon rises over the big car so the road ahead stays in view');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test 'tests/reel/ch1-ring.test.js'`
Expected: 1 failure (the wide car is 60×32).

- [ ] **Step 3: Implement.** Apply to `reel/ch1/ring.js`:

`reel/ch1/ring.js`, change 1. Find:

```js
const HY = 36;                                // horizon row for a flat road
```

Replace with:

```js

```

`reel/ch1/ring.js`, change 2. Find:

```js

export function buildRing(W, H = 96) {
```

Replace with:

```js

// The white Golf GTI from behind at 120 x 64: shark-fin aerial, roof spoiler with end plates and a
// third brake light, tinted rear glass with the driver, the passenger headrest and the rear wiper,
// body-coloured mirrors, flared rear arches, LED tail-light clusters with light bars and reverse
// lamps, a chrome VW roundel, red GTI letters, an AW-GT 7 plate (Ahrweiler: the Ring's district),
// parking sensors, a finned diffuser with twin pipes each side, and wide tyres.
function golfRearBig() {
  const W = 120, H = 64, p = new Painter(W, H);
  const B = '#f3f4f6', b = '#dcdfe4', s = '#bfc4cc', d = '#9ea4ae', K = '#16161b', k = '#2a2a32';
  const G0 = '#1d2531', G1 = '#26303e', G2 = '#2f3b4d', GL = '#4a5a74';
  const R = '#d8202f', r = '#8e0c19', rr = '#5e0710', L = '#ff6b6b', C = '#cdd2da', c = '#8f95a0';
  const px = (x, y, col) => p.px(x, y, col);
  const hline = (x0, x1, y, col) => { for (let x = x0; x <= x1; x++) px(x, y, col); };

  // tyres, under everything
  for (const x0 of [2, 102]) for (let y = 42; y < 64; y++) for (let x = x0; x < x0 + 16; x++) {
    const tread = (y % 3 === 0) || (x - x0) % 5 === 0;
    px(x, y, tread ? '#24242a' : '#111115');
  }
  // shark-fin aerial and roof
  hline(71, 74, 0, K); hline(70, 75, 1, K);
  for (let y = 2; y < 8; y++) hline(38 - (y - 2), 81 + (y - 2), y, y === 2 ? '#ffffff' : y < 5 ? B : b);
  // roof spoiler with end plates, third brake light beneath
  for (let y = 8; y < 12; y++) hline(27, 92, y, y === 8 ? k : K);
  for (let y = 12; y < 14; y++) { hline(27, 29, y, K); hline(90, 92, y, K); }
  hline(50, 69, 12, R); hline(52, 67, 13, r);
  // rear glass: tinted, defroster lines, the driver, the passenger headrest, the wiper, reflections
  for (let y = 12; y < 28; y++) {
    const x0 = Math.round(30 - (y - 12) * 0.28), x1 = Math.round(89 + (y - 12) * 0.28);
    for (let x = x0; x <= x1; x++) {
      if (y < 14 && x > 48 && x < 71) continue;                      // brake light stays visible
      px(x, y, y < 16 ? G0 : y < 22 ? G1 : G2);
    }
    if (y % 3 === 1) for (let x = x0 + 3; x <= x1 - 3; x += 1) if ((x + y) % 2 === 0) px(x, y, '#222b38');
  }
  for (let y = 15; y < 28; y++) for (let x = 36; x < 52; x++) {          // the driver: hair and shoulders
    const dh = Math.hypot((x - 44) / 6.5, (y - 20) / 5.5);
    if (dh < 1) px(x, y, y < 17 ? '#3a3540' : '#17151b');
    if (y > 24 && x > 34 && x < 54) px(x, y, '#121116');
  }
  px(49, 19, '#6a5f58'); px(50, 19, '#6a5f58');                          // a glint off the glasses' arm
  for (let y = 18; y < 28; y++) for (let x = 70; x < 81; x++) {           // passenger headrest
    const dr = Math.hypot((x - 75) / 5.5, (y - 21) / 4);
    if (dr < 1) px(x, y, y < 19 ? '#3a3f4c' : '#262a35');
    if (y > 24) px(x, y, '#20232c');
  }
  for (let i = 0; i < 18; i++) { px(60 - i, 26 - Math.round(i * 0.33), K); if (i > 2) px(60 - i, 27 - Math.round(i * 0.33), k); }   // wiper
  px(60, 27, '#3a3a42'); px(61, 27, '#3a3a42');
  for (let i = 0; i < 9; i++) { px(78 + i, 13 + i, GL); px(82 + i, 13 + i, GL); px(83 + i, 13 + i, '#3e4c64'); }   // reflections
  // body-coloured mirrors sticking out beside the glass
  for (let y = 22; y < 29; y++) { hline(15, 24, y, y === 22 ? '#ffffff' : y > 26 ? s : B); hline(95, 104, y, y === 22 ? '#ffffff' : y > 26 ? s : B); }
  hline(15, 24, 29, K); hline(95, 104, 29, K);
  // the tailgate and flared rear arches
  for (let y = 28; y < 47; y++) {
    const half = y < 31 ? 47 + (y - 28) * 3 : 56 - Math.max(0, y - 42);
    for (let x = Math.round(60 - half); x < Math.round(60 + half); x++) {
      const edge = Math.min(x - (60 - half), 60 + half - 1 - x);
      px(x, y, edge < 2 ? d : edge < 5 ? s : (y === 28 || y === 29) ? b : y === 39 ? b : B);
    }
  }
  // LED tail-light clusters: dark frame, red body, two light bars, a reverse lamp near the middle
  for (let y = 30; y < 39; y++) {
    const len = 29 - Math.round((y - 30) * 1.6);
    for (let i = 0; i < len; i++) {
      const frame = y === 30 || y === 38 || i === 0 || i === len - 1;
      let col = frame ? rr : R;
      if (!frame && (y === 32 || y === 35) && i > 2 && i < len - 3) col = L;
      if (!frame && i > len - 6 && y > 31 && y < 37) col = '#f1eeea';     // reverse lamp
      if (!frame && i < 3) col = r;
      px(7 + i, y, col); px(112 - i, y, col);
    }
  }
  // chrome VW roundel with the V over the W
  for (let y = 29; y < 43; y++) for (let x = 53; x < 67; x++) {
    const dd = Math.hypot(x - 59.5, y - 35.5);
    if (dd < 6.6) px(x, y, dd > 5.6 ? c : dd > 4.8 ? C : '#334055');
  }
  const VW = ['#.......#', '.#.....#.', '.#.....#.', '..#...#..', '#..#.#..#', '.#..#..#.', '.#.#.#.#.', '..#...#..'];
  VW.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === '#') px(55 + x, 31 + y, '#f4f6fa'); });
  // red GTI letters on the right of the tailgate
  const gti = label('GTI', R);
  gti.rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === '#') px(86 + x, 41 + y, R); });
  // bumper, sensors, reflectors, the fog lamp, finned diffuser, twin pipes each side
  for (let y = 47; y < 56; y++) hline(5, 114, y, y === 47 ? b : y > 53 ? s : B);
  for (const x of [30, 46, 73, 89]) px(x, 48, c);
  hline(7, 13, 50, R); hline(106, 112, 50, R); hline(23, 28, 51, R);
  for (let y = 54; y < 61; y++) for (let x = 15; x < 105; x++) px(x, y, (x - 15) % 6 === 0 && y > 55 ? k : y === 54 ? k : K);
  for (const x0 of [19, 29, 82, 92]) for (let y = 55; y < 61; y++) for (let x = x0; x < x0 + 8; x++) {
    const dd = Math.hypot((x - x0 - 3.5) / 4, (y - 57.8) / 3.2);
    if (dd < 1) px(x, y, dd > 0.75 ? C : dd > 0.5 ? c : '#0c0c10');
  }
  // plate recess and German plate AW-GT 7 with the EU band
  for (let y = 41; y < 52; y++) hline(42, 77, y, y === 41 ? s : b);
  for (let y = 42; y < 51; y++) hline(44, 75, y, (y === 42 || y === 50) ? K : '#f6f6f2');
  for (let y = 42; y < 51; y++) { px(44, y, K); px(75, y, K); hline(45, 47, y, y > 42 && y < 50 ? '#2f4fa8' : K); }
  px(46, 44, '#f2c200'); px(45, 45, '#f2c200'); px(47, 45, '#f2c200');
  const plate = label('AW GT7', '#16161b');
  plate.rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === '#') px(50 + x, 44 + y, K); });
  hline(52, 67, 41, '#fff6dc');                                           // plate lights
  return p;
}

export function buildRing(W, H = 96) {
```

`reel/ch1/ring.js`, change 3. Find:

```js
  layers.sky = gradient(W, H, [['#9fb2c6', 0], ['#b6c5d4', 0.25], ['#cfd9e2', 0.42], ['#dde5ea', 0.5]]);
  const hills = new Painter(W * 3, H);                              // the Eifel's forested hills on the horizon
```

Replace with:

```js
  layers.sky = gradient(W, H, [['#9fb2c6', 0], ['#b6c5d4', 0.25], ['#cfd9e2', 0.42], ['#dde5ea', 0.5]]);
  // Wide screens get the full-size Golf; on a phone the road is too narrow for it, so the 60 x 32 one.
  // The horizon rises with the car so the road ahead stays visible over its roof.
  const car = W >= 300 ? golfRearBig() : golfRear(), hy = car.h > 40 ? 22 : 36;
  const hills = new Painter(W * 3, H);                              // the Eifel's forested hills on the horizon
```

`reel/ch1/ring.js`, change 4. Find:

```js
  for (let i = 0; i < W * 3; i++) for (let j = 0; j < h1[i]; j++) hills.px(i, HY + 2 - j, j > h1[i] - 1.5 ? '#5d7a68' : '#4a6a58');
```

Replace with:

```js
  for (let i = 0; i < W * 3; i++) for (let j = 0; j < h1[i]; j++) hills.px(i, hy + 2 - j, j > h1[i] - 1.5 ? '#5d7a68' : '#4a6a58');
```

`reel/ch1/ring.js`, change 5. Find:

```js
  layers.car = golfRear();
  return { W, H, layers, track: buildTrack() };
```

Replace with:

```js
  layers.car = car;
  return { W, H, hy, layers, track: buildTrack() };
```

`reel/ch1/ring.js`, change 6. Find:

```js
function project(p, camY, camZ, W, H) {
```

Replace with:

```js
function project(p, camY, camZ, W, H, hy) {
```

`reel/ch1/ring.js`, change 7. Find:

```js
  return { z, scale, x: Math.round(W / 2 + scale * p.x * W / 2), y: Math.round(HY - scale * (p.y - camY) * H / 2), w: Math.round(scale * ROAD * W / 2) };
```

Replace with:

```js
  return { z, scale, x: Math.round(W / 2 + scale * p.x * W / 2), y: Math.round(hy - scale * (p.y - camY) * H / 2), w: Math.round(scale * ROAD * W / 2) };
```

`reel/ch1/ring.js`, change 8. Find:

```js
    const p1 = project({ x: -x, y: sg.y1, z: z1 }, camY, pos, W, H);
    const p2 = project({ x: -x - dx, y: sg.y2, z: z2 }, camY, pos, W, H);
```

Replace with:

```js
    const p1 = project({ x: -x, y: sg.y1, z: z1 }, camY, pos, W, H, s.hy);
    const p2 = project({ x: -x - dx, y: sg.y2, z: z2 }, camY, pos, W, H, s.hy);
```

`reel/ch1/ring.js`, change 9. Find:

```js
  // the car: pushed wide in the bends, bouncing, airborne over the crest
  const ahead = segs[(base + 4) % N].curve;
```

Replace with:

```js
  // the car: pushed wide in the bends, bouncing, airborne over the crest; everything scales with it
  const k = c.car.width / 60, ahead = segs[(base + 4) % N].curve;
```

`reel/ch1/ring.js`, change 10. Find:

```js
  const lift = Math.round(Math.sin(air * Math.PI / 2) * 8 * air);
  const cx = Math.round(W / 2 - c.car.width / 2 - ahead * 1.6), cy = H - c.car.height - 1 - lift + (Math.floor(t * 12) % 2);
```

Replace with:

```js
  const lift = Math.round(Math.sin(air * Math.PI / 2) * 8 * k * air);
  const cx = Math.round(W / 2 - c.car.width / 2 - ahead * 1.6 * k), cy = H - c.car.height - 1 - lift + (Math.floor(t * 12) % 2);
```

`reel/ch1/ring.js`, change 11. Find:

```js
  ctx.fillRect(cx + 4 + Math.round(lift / 2), H - 3, c.car.width - 8 - lift, 3);
```

Replace with:

```js
  ctx.fillRect(cx + Math.round((4 + lift / 2) * 1), H - 3, c.car.width - 8 * k - lift, 3);
```

`reel/ch1/ring.js`, change 12. Find:

```js
    for (let k = 0; k < 4; k++) {
      const age = (t * 7 + k * 0.25) % 1;
      ctx.fillRect(Math.round(cx + (ahead > 0 ? 2 : 50) - age * 8 * Math.sign(ahead)), Math.round(cy + 26 - age * 8), 5 + Math.round(age * 5), 3);
```

Replace with:

```js
    for (let n = 0; n < 4; n++) {
      const age = (t * 7 + n * 0.25) % 1;
      ctx.fillRect(Math.round(cx + (ahead > 0 ? 2 : 50) * k - age * 8 * k * Math.sign(ahead)), Math.round(cy + 26 * k - age * 8 * k), Math.round((5 + age * 5) * k), Math.round(3 * k));
```

- [ ] **Step 4: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 98`, `ℹ fail 0`, 15 `ok` lines and exit 0.

- [ ] **Step 5: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 9.6,10.0,10.4 && python3 tests/reel/sheet.py /tmp/f /tmp/f-ring.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 9.6,10.0 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-ring.png 3
```

Expected:
- **Desktop:** the Golf fills about two thirds of the banner height. Its details are readable: the brake light under the spoiler, the driver through the glass, the LED tail lights, the VW roundel, `GTI`, the `AW GT7` plate and four pipes.
  - At 9.6 s it is airborne about 16 px above its shadow.
  - At 10.0 s the road bends away beside it, with big tyre-smoke puffs.
  - At 10.4 s the road disappears over a crest above its roof.
- **Phone:** the 60×32 Golf as before.

- [ ] **Step 6: Update the spec line.** Apply:

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 1. Find:

```markdown
4. Nürburgring, from a chase camera: Yimeng's white modified VW Golf GTI attacks a narrow stretch of the "Green Hell", bend after bend through the forest, climbing and plunging, and briefly airborne over a crest like Flugplatz. The Golf fills the lower third of the frame. A sign in the top corner names the track, `NÜRBURGRING` over `NORDSCHLEIFE` in green, above a fast-running lap timer.
```

Replace with:

```markdown
4. Nürburgring, from a chase camera: Yimeng's white modified VW Golf GTI attacks a narrow stretch of the "Green Hell", bend after bend through the forest, climbing and plunging, and briefly airborne over a crest like Flugplatz. On desktop the Golf is a detailed 120 × 64 sprite, about two thirds of the banner's height; it carries the driver behind the rear glass, LED tail lights, a VW roundel, red GTI letters and an `AW GT7` plate (AW is the Ring's district). On phones, where the road is narrower, it is 60 × 32 and fills the lower third. A sign in the top corner names the track, `NÜRBURGRING` over `NORDSCHLEIFE` in green, above a fast-running lap timer.
```

- [ ] **Step 7: Commit**

```bash
git add reel/ch1/ring.js tests/reel/ch1-ring.test.js docs/superpowers/specs/2026-10-03-life-reel-design.md
git commit -m "fix(reel): Double the Golf on wide screens and fill it with detail"
```

- [ ] **Step 8: Hand over for review:** `http://127.0.0.1:8000/?reel=ch1-ring`.
