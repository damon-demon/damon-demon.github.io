// Chapter 1, shot 4: the Nürburgring Nordschleife from a chase camera. Yimeng's white modified Golf
// GTI attacks a stretch of the Green Hell: bend after bend, climbing and plunging, airborne over a
// crest like Flugplatz. A pseudo-3D road (projected segments, near to far) under a lap timer.
import { Painter } from '../pixels.js';
import { gradient, ridge, label } from '../kit.js';

const SEG = 200, ROAD = 620, CAM_H = 700, DEPTH = 0.8, DRAW = 80;
const SPEED = 46 * SEG;                       // world units per second
const HY = 36;                                // horizon row for a flat road
const TREE_H = 2600;

// the stretch of track: [segments, curve, climb]
const TRACK = [
  [4, 0, 0], [16, 6, 1400], [8, 0.8, 900], [10, 0, -1800], [16, -8, -2600], [8, 0, 1200],
  [12, 7.5, 500], [12, -6.5, -900], [14, 5, 1700], [10, 0, -1300], [14, -7, 0], [30, 4, 800], [50, -3, 0],
];
const ease = (u) => (1 - Math.cos(u * Math.PI)) / 2;

export function buildTrack() {
  const segs = [];
  let y = 0;
  for (const [n, curve, climb] of TRACK) {
    const y0 = y;
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n;
      const c = curve * Math.sin(Math.PI * (i + 0.5) / n);         // ease into and out of each bend
      segs.push({ index: segs.length, curve: c, y1: y0 + climb * ease(u0), y2: y0 + climb * ease(u1) });
    }
    y = y0 + climb;
  }
  const crest = segs.reduce((best, s) => (s.y2 > best.y2 ? s : best), segs[0]).index;
  return { segs, crest };
}

function golfRear() {
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
  return p;
}

export function buildRing(W, H = 96) {
  const layers = {};
  layers.sky = gradient(W, H, [['#9fb2c6', 0], ['#b6c5d4', 0.25], ['#cfd9e2', 0.42], ['#dde5ea', 0.5]]);
  const hills = new Painter(W * 3, H);                              // the Eifel's forested hills on the horizon
  const h1 = ridge(W * 3, 10, [[4, 3, 0.5], [2, 7, 1.3], [1, 19, 0.2]]);
  for (let i = 0; i < W * 3; i++) for (let j = 0; j < h1[i]; j++) hills.px(i, HY + 2 - j, j > h1[i] - 1.5 ? '#5d7a68' : '#4a6a58');
  layers.hills = hills;
  layers.car = golfRear();
  return { W, H, layers, track: buildTrack() };
}

const labels = new Map();                // text -> pixel art, so the timer does not churn objects
function text(str, ink) {
  const k = str + ink;
  if (!labels.has(k)) labels.set(k, label(str, ink));
  return labels.get(k);
}

function project(p, camY, camZ, W, H) {
  const z = p.z - camZ, scale = DEPTH / z;
  return { z, scale, x: Math.round(W / 2 + scale * p.x * W / 2), y: Math.round(HY - scale * (p.y - camY) * H / 2), w: Math.round(scale * ROAD * W / 2) };
}

function band(ctx, y1, y2, x1, w1, x2, w2, col, f) {
  // fill a road trapezoid row by row, from the far edge (y2) down to the near edge (y1); f widens it
  ctx.fillStyle = col;
  for (let y = Math.max(0, y2); y < y1; y++) {
    const u = (y - y2) / (y1 - y2), x = x2 + (x1 - x2) * u, w = (w2 + (w1 - w2) * u) * f;
    ctx.fillRect(Math.round(x - w), y, Math.round(2 * w), 1);
  }
}

export function renderRing(ctx, t, s, env) {
  const { W, H, canvases: c } = s, { segs, crest } = s.track, N = segs.length;
  const pos = t * SPEED, base = Math.floor(pos / SEG), pct = (pos % SEG) / SEG;
  const here = segs[base % N], camY = here.y1 + (here.y2 - here.y1) * pct + CAM_H;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  const turned = segs.slice(0, base).reduce((a, sg) => a + sg.curve, 0) + here.curve * pct;
  ctx.drawImage(c.hills, -Math.round(((turned * 3) % W + W) % W) - W, 0);   // hills slide as the road turns

  let x = 0, dx = -here.curve * pct, maxy = H;
  const drawn = [];
  for (let n = 0; n < DRAW; n++) {
    const sg = segs[(base + n) % N];
    const z1 = (base + n) * SEG, z2 = z1 + SEG;
    const p1 = project({ x: -x, y: sg.y1, z: z1 }, camY, pos, W, H);
    const p2 = project({ x: -x - dx, y: sg.y2, z: z2 }, camY, pos, W, H);
    x += dx; dx += sg.curve;
    drawn.push({ sg, p1, clip: maxy });
    if (p1.z <= DEPTH || p2.y >= p1.y || p2.y >= maxy) continue;
    const alt = Math.floor((base + n) / 2) % 2, y1 = Math.min(p1.y, maxy);
    band(ctx, y1, p2.y, W / 2, W, W / 2, W, alt ? '#3d6b38' : '#356236', 1);                       // grass
    band(ctx, y1, p2.y, p1.x, p1.w, p2.x, p2.w, '#8a8f98', 1.32);                                  // run-off by the Armco
    band(ctx, y1, p2.y, p1.x, p1.w, p2.x, p2.w, alt ? '#e8414b' : '#f4f1e6', 1.14);                // kerbs
    band(ctx, y1, p2.y, p1.x, p1.w, p2.x, p2.w, alt ? '#474a52' : '#41444c', 1);                   // asphalt
    if (alt) {                                                                                       // white edge lines
      for (const side of [-1, 1]) band(ctx, y1, p2.y, p1.x + side * p1.w * 0.93, p1.w * 0.03, p2.x + side * p2.w * 0.93, p2.w * 0.03, '#e9e6df', 1);
    }
    maxy = p2.y;
  }
  // trees, far to near, clipped behind crests
  for (let n = drawn.length - 1; n >= 1; n--) {
    const { sg, p1, clip } = drawn[n];
    if (p1.z <= DEPTH || sg.index % 2) continue;
    for (const side of [-1, 1]) {
      const off = side * (1.9 + ((sg.index * 7) % 5) * 0.25);
      const tx = p1.x + p1.scale * off * ROAD * W / 2, th = Math.round(p1.scale * TREE_H * H / 2), tw = th * 0.42;
      if (th < 2 || tx < -tw || tx > W + tw) continue;
      for (let j = 0; j < th; j++) {
        const y = p1.y - th + j;
        if (y >= clip || y < 0) continue;
        const half = Math.max(0.5, (j / th) * tw * (j % 4 === 3 ? 0.8 : 1));
        ctx.fillStyle = side < 0 ? '#1f3d2b' : '#24432f'; ctx.fillRect(Math.round(tx - half), y, Math.round(half * 2), 1);
        ctx.fillStyle = '#2f5a3c'; ctx.fillRect(Math.round(tx - side * half * 0.8), y, Math.max(1, Math.round(half * 0.4)), 1);
      }
    }
  }
  // the car: pushed wide in the bends, bouncing, airborne over the crest
  const ahead = segs[(base + 4) % N].curve;
  const air = Math.max(0, 1 - Math.abs(base + pct - crest - 2) / 5);   // airborne just past the crest
  const lift = Math.round(Math.sin(air * Math.PI / 2) * 8 * air);
  const cx = Math.round(W / 2 - c.car.width / 2 - ahead * 1.6), cy = H - c.car.height - 3 - lift + (Math.floor(t * 12) % 2);
  if (lift > 0) { ctx.fillStyle = 'rgba(20, 30, 20, 0.45)'; ctx.fillRect(cx + 4, H - 4, c.car.width - 8, 2); }
  ctx.drawImage(c.car, cx, cy);
  if (Math.abs(ahead) > 2.5) {                                          // tyre smoke on the hard bends
    ctx.fillStyle = 'rgba(225, 226, 230, 0.6)';
    for (let k = 0; k < 4; k++) {
      const age = (t * 7 + k * 0.25) % 1;
      ctx.fillRect(Math.round(cx + (ahead > 0 ? 2 : 32) - age * 6 * Math.sign(ahead)), Math.round(cy + 18 - age * 6), 4 + Math.round(age * 4), 2);
    }
  }
  // lap timer under the controls, running fast
  const secs = 474 + t * 4, m = Math.floor(secs / 60), sec = secs - m * 60;
  const lbl = env.art(text(`${m}:${sec.toFixed(2).padStart(5, '0')}`, '#f4f1e6')), lap = env.art(text('LAP', '#e8b923'));
  const bx = W - lbl.width - lap.width - 14;
  ctx.fillStyle = 'rgba(11, 11, 12, 0.7)'; ctx.fillRect(bx, 20, lbl.width + lap.width + 10, 9);
  ctx.drawImage(lap, bx + 3, 22); ctx.drawImage(lbl, bx + lap.width + 7, 22);
}

export const ring = { build: buildRing, render: renderRing };
