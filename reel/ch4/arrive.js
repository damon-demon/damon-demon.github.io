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
