# Life Reel — Phase 2c (Nürburgring: bigger Golf, named track) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply Yimeng's second Nürburgring review. The white Golf grows from a toy-like 40×22 to a 60×32 rear view, about a third of the near road's width. A sign above the lap timer names the track: `NÜRBURGRING` over `NORDSCHLEIFE`.

**Architecture:** A local change to `reel/ch1/ring.js`. `golfRear()` is redrawn at 60×32, the car's placement and shadow are adjusted, and the HUD becomes a three-line sign. The pixel font gains `Ü`.

**Tech Stack:** Vanilla JS, Node 25 `node:test`, the Phase 2 frame-review tools.

**Spec:** `docs/superpowers/specs/2026-10-03-life-reel-design.md`. **Builds on:** `docs/superpowers/plans/2026-10-03-life-reel-phase-2b.md`.

## Global Constraints

- Everything in the Phase 2 plan's Global Constraints still holds.
- The Golf stays white with the red grille stripe and red tail lights. The sign's track name is English-alphabet German: `NÜRBURGRING` / `NORDSCHLEIFE`.
- No timing changes: chapter 1 stays 17.5 s, so `page-check.sh` is unchanged.

---

### Task 1: An Ü in the pixel font

**Files:**
- Modify: `reel/pixels.js`
- Test: `tests/reel/pixels.test.js` (append)

**Interfaces:**
- Produces: `textRows('Ü') → ['#.#', '...', '#.#', '#.#', '###']`. The two dots sit on top, with a squeezed U below.

- [ ] **Step 1: Write the failing test.** Append to `tests/reel/pixels.test.js`:

```js
test('textRows has an Ü for NÜRBURGRING', async () => {
  const { textRows } = await import('../../reel/pixels.js');
  assert.deepEqual(textRows('Ü'), ['#.#', '...', '#.#', '#.#', '###']);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test 'tests/reel/pixels.test.js'`
Expected: 1 failure, because `Ü` renders blank.

- [ ] **Step 3: Implement.** Apply to `reel/pixels.js`:

`reel/pixels.js`, change 1. Find:

```js
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'], W: ['#.#', '#.#', '###', '###', '#.#'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
```

Replace with:

```js
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'], 'Ü': ['#.#', '...', '#.#', '#.#', '###'], W: ['#.#', '#.#', '###', '###', '#.#'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test 'tests/reel/pixels.test.js'`
Expected: `ℹ pass 13`, `ℹ fail 0`.

- [ ] **Step 5: Commit**

```bash
git add reel/pixels.js tests/reel/pixels.test.js
git commit -m "feat(reel): Add Ü to the pixel font"
```

---

### Task 2: A full-size Golf and a named track

**Files:**
- Modify: `reel/ch1/ring.js`, `docs/superpowers/specs/2026-10-03-life-reel-design.md`
- Test: `tests/reel/ch1-ring.test.js` (append)

**Interfaces:**
- Produces:
  - The `car` layer is 60×32 and sits on row 95 with a shadow; it lifts up to 8 px just past the crest.
  - The HUD draws four pieces of pixel text through `env.art`: `NÜRBURGRING`, `NORDSCHLEIFE`, `LAP` and the time. They sit in a box with a green left edge, at the top right under the controls.

- [ ] **Step 1: Write the failing tests.** Append to `tests/reel/ch1-ring.test.js`:

```js
test('the Golf is big enough to read as a car, not a toy', () => {
  const car = ring.build(480, 96).layers.car;
  assert.ok(car.w >= 56 && car.h >= 30, `${car.w}x${car.h}`);
});

test('the track is named above the lap timer', () => {
  // the sign draws four pieces of text: NÜRBURGRING, NORDSCHLEIFE, LAP and the time
  assert.equal(frameAt(ring, 480, 1).ctx.draws('art').length, 4);
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `node --test 'tests/reel/ch1-ring.test.js'`
Expected: 2 failures (`40x22`, and 2 art draws instead of 4).

- [ ] **Step 3: Implement.** Apply to `reel/ch1/ring.js`:

`reel/ch1/ring.js`, change 1. Find:

```js

function golfRear() {
```

Replace with:

```js

// The white Golf GTI from behind, 60 x 32: spoiler, the driver through the rear glass, LED tail
// lights, VW roundel, red GTI badge, German plate, diffuser with twin pipes each side.
function golfRear() {
```

`reel/ch1/ring.js`, change 2. Find:

```js
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
```

Replace with:

```js
  const W = 60, H = 32, p = new Painter(W, H);
  const B = '#f2f3f5', b = '#d5d8de', s = '#b4b9c2', K = '#18181e', k = '#2c2c34', G = '#27303e', g = '#3b4658';
  const R = '#d8202f', r = '#8a0c18', L = '#ff6a6a', C = '#a9aeb8';
  // tyres first, the body sits over their tops
  for (const x0 of [3, 49]) for (let y = 19; y < 32; y++) for (let x = x0; x < x0 + 8; x++) p.px(x, y, (x + y) % 4 === 0 ? '#26262c' : '#121216');
  // roof and spoiler
  for (let y = 0; y < 3; y++) for (let x = 19 - y; x <= 40 + y; x++) p.px(x, y, y === 0 ? b : B);
  for (let x = 14; x <= 45; x++) { p.px(x, 3, K); p.px(x, 4, k); }
  // rear window, the driver's head on the left seat, reflections
  for (let y = 5; y < 12; y++) for (let x = Math.round(15 - (y - 5) * 0.35); x <= Math.round(44 + (y - 5) * 0.35); x++) p.px(x, y, G);
  for (let y = 6; y < 12; y++) for (let x = 18; x < 25; x++) {
    const d = Math.hypot(x - 21, y - 9);
    if (d < 3.4) p.px(x, y, y < 8 ? '#2a2630' : '#17151b');
  }
  for (let y = 7; y < 12; y++) p.px(17, y, '#20232c');                         // headrest edge
  for (let k2 = 0; k2 < 5; k2++) { p.px(33 + k2, 5 + k2, g); p.px(36 + k2, 5 + k2, g); }
  // hatch, shoulders wider than the glass
  for (let y = 12; y < 24; y++) {
    const half = y < 15 ? 23 + (y - 12) : 26;
    for (let x = 30 - half; x < 30 + half; x++) p.px(x, y, (x < 30 - half + 2 || x >= 30 + half - 2) ? s : (y === 12 || y === 18 ? b : B));
  }
  // LED tail lights: wedges reaching onto the hatch
  for (let y = 13; y < 18; y++) {
    const len = 13 - (y - 13);
    for (let i = 0; i < len; i++) {
      const c = y === 15 && i > 1 ? L : (i < 2 ? r : R);
      p.px(4 + i, y, c); p.px(55 - i, y, c);
    }
  }
  // VW roundel: a chrome ring around a V
  for (let y = 12; y < 19; y++) for (let x = 26; x < 34; x++) {
    const d = Math.hypot(x - 29.5, y - 15.5);
    if (d < 3.6) p.px(x, y, d > 2.6 ? C : '#3a4150');
  }
  for (const [x, y] of [[28, 14], [31, 14], [28, 15], [31, 15], [29, 16], [30, 16], [29, 17], [30, 17]]) p.px(x, y, B);
  // red GTI badge, lower right
  p.rect(40, 19, 6, 1, R); p.px(46, 19, C);
  // number plate: white, black frame, EU blue strip, a few dark glyph dots
  for (let y = 18; y < 22; y++) for (let x = 23; x < 37; x++) p.px(x, y, (y === 18 || y === 21 || x === 23 || x === 36) ? K : (x === 24 ? '#2f4fa8' : B));
  for (let x = 26; x < 35; x++) if (x !== 29 && x !== 32) { p.px(x, 19, '#7a808c'); p.px(x, 20, '#5a606c'); }
  // bumper, reflectors, diffuser, twin pipes each side
  for (let y = 22; y < 27; y++) for (let x = 5; x < 55; x++) p.px(x, y, y === 22 ? b : B);
  p.rect(6, 23, 3, 1, R); p.rect(51, 23, 3, 1, R);
  for (let y = 25; y < 28; y++) for (let x = 9; x < 51; x++) p.px(x, y, y === 25 ? k : K);
  for (const x0 of [11, 15, 41, 45]) { p.rect(x0, 26, 3, 2, C); p.px(x0 + 1, 27, '#5a5f6a'); }
```

`reel/ch1/ring.js`, change 3. Find:

```js
  const cx = Math.round(W / 2 - c.car.width / 2 - ahead * 1.6), cy = H - c.car.height - 3 - lift + (Math.floor(t * 12) % 2);
  if (lift > 0) { ctx.fillStyle = 'rgba(20, 30, 20, 0.45)'; ctx.fillRect(cx + 4, H - 4, c.car.width - 8, 2); }
```

Replace with:

```js
  const cx = Math.round(W / 2 - c.car.width / 2 - ahead * 1.6), cy = H - c.car.height - 1 - lift + (Math.floor(t * 12) % 2);
  ctx.fillStyle = `rgba(16, 22, 16, ${lift > 0 ? 0.4 : 0.55})`;                                 // shadow on the asphalt
  ctx.fillRect(cx + 4 + Math.round(lift / 2), H - 3, c.car.width - 8 - lift, 3);
```

`reel/ch1/ring.js`, change 4. Find:

```js
      ctx.fillRect(Math.round(cx + (ahead > 0 ? 2 : 32) - age * 6 * Math.sign(ahead)), Math.round(cy + 18 - age * 6), 4 + Math.round(age * 4), 2);
```

Replace with:

```js
      ctx.fillRect(Math.round(cx + (ahead > 0 ? 2 : 50) - age * 8 * Math.sign(ahead)), Math.round(cy + 26 - age * 8), 5 + Math.round(age * 5), 3);
```

`reel/ch1/ring.js`, change 5. Find:

```js
  // lap timer under the controls, running fast
```

Replace with:

```js
  // the track sign and the lap timer under the controls; the timer runs fast
```

`reel/ch1/ring.js`, change 6. Find:

```js
  const secs = 474 + t * 4, m = Math.floor(secs / 60), sec = secs - m * 60;
  const lbl = env.art(text(`${m}:${sec.toFixed(2).padStart(5, '0')}`, '#f4f1e6')), lap = env.art(text('LAP', '#e8b923'));
```

Replace with:

```js
  const secs = 474 + t * 4, m = Math.floor(secs / 60), sec = secs - m * 60;
  const name = env.art(text('NÜRBURGRING', '#f4f1e6')), loop = env.art(text('NORDSCHLEIFE', '#6fd36a'));
  const lbl = env.art(text(`${m}:${sec.toFixed(2).padStart(5, '0')}`, '#f4f1e6')), lap = env.art(text('LAP', '#e8b923'));
```

`reel/ch1/ring.js`, change 7. Find:

```js
  const bx = W - lbl.width - lap.width - 14;
  ctx.fillStyle = 'rgba(11, 11, 12, 0.7)'; ctx.fillRect(bx, 20, lbl.width + lap.width + 10, 9);
  ctx.drawImage(lap, bx + 3, 22); ctx.drawImage(lbl, bx + lap.width + 7, 22);
```

Replace with:

```js
  const boxW = Math.max(name.width, loop.width, lap.width + 4 + lbl.width) + 8, bx = W - boxW - 6;
  ctx.fillStyle = 'rgba(11, 11, 12, 0.72)'; ctx.fillRect(bx, 19, boxW, 25);
  ctx.fillStyle = '#6fd36a'; ctx.fillRect(bx, 19, 2, 25);                                       // green edge for the Green Hell
  ctx.drawImage(name, bx + 5, 22); ctx.drawImage(loop, bx + 5, 29);
  ctx.fillStyle = 'rgba(244, 241, 230, 0.25)'; ctx.fillRect(bx + 5, 35, boxW - 9, 1);
  ctx.drawImage(lap, bx + 5, 37); ctx.drawImage(lbl, bx + 9 + lap.width, 37);
```

- [ ] **Step 4: Run every check**

Run: `node --test 'tests/reel/*.test.js' && tests/reel/page-check.sh`
Expected: `ℹ pass 97`, `ℹ fail 0`, 15 `ok` lines and exit 0.

- [ ] **Step 5: Look at it**

```bash
rm -rf /tmp/f && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/f --width 1440 --times 9.6,10.0,10.4 && python3 tests/reel/sheet.py /tmp/f /tmp/f-ring.png 2
rm -rf /tmp/fm && node tests/reel/frames.mjs http://127.0.0.1:8000/ /tmp/fm --width 390 --mobile --times 9.6,10.0 && python3 tests/reel/sheet.py /tmp/fm /tmp/fm-ring.png 3
```

Expected:
- The Golf reads as a real car about a third as wide as the near road, with:
  - a roof spoiler, and the driver's head through the dark rear glass
  - red LED tail-light wedges, a chrome VW roundel and a red GTI badge
  - a German plate with a blue EU strip
  - a black diffuser with twin pipes at each corner
- At 9.6 s it is airborne over a shadow.
- At the top right, a dark box with a green edge reads `NÜRBURGRING`, then `NORDSCHLEIFE` in green, then `LAP 7:5x.xx`.
- On the phone the car fills the lower third.

- [ ] **Step 6: Update the spec line.** Apply:

`docs/superpowers/specs/2026-10-03-life-reel-design.md`, change 1. Find:

```markdown
4. Nürburgring, from a chase camera: Yimeng's white modified VW Golf GTI attacks a narrow stretch of the "Green Hell", bend after bend through the forest, climbing and plunging, and briefly airborne over a crest like Flugplatz. A small lap timer runs in a corner.
```

Replace with:

```markdown
4. Nürburgring, from a chase camera: Yimeng's white modified VW Golf GTI attacks a narrow stretch of the "Green Hell", bend after bend through the forest, climbing and plunging, and briefly airborne over a crest like Flugplatz. The Golf fills the lower third of the frame. A sign in the top corner names the track, `NÜRBURGRING` over `NORDSCHLEIFE` in green, above a fast-running lap timer.
```

- [ ] **Step 7: Commit**

```bash
git add reel/ch1/ring.js tests/reel/ch1-ring.test.js docs/superpowers/specs/2026-10-03-life-reel-design.md
git commit -m "fix(reel): Full-size Golf and a NÜRBURGRING NORDSCHLEIFE sign over the lap timer"
```

- [ ] **Step 8: Hand over for review:** `http://127.0.0.1:8000/?reel=ch1-ring`.
