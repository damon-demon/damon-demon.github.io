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

// The white Golf GTI from behind, 60 x 32: spoiler, the driver through the rear glass, LED tail
// lights, VW roundel, red GTI badge, German plate, diffuser with twin pipes each side.
function golfRear() {
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
  const cx = Math.round(W / 2 - c.car.width / 2 - ahead * 1.6), cy = H - c.car.height - 1 - lift + (Math.floor(t * 12) % 2);
  ctx.fillStyle = `rgba(16, 22, 16, ${lift > 0 ? 0.4 : 0.55})`;                                 // shadow on the asphalt
  ctx.fillRect(cx + 4 + Math.round(lift / 2), H - 3, c.car.width - 8 - lift, 3);
  ctx.drawImage(c.car, cx, cy);
  if (Math.abs(ahead) > 2.5) {                                          // tyre smoke on the hard bends
    ctx.fillStyle = 'rgba(225, 226, 230, 0.6)';
    for (let k = 0; k < 4; k++) {
      const age = (t * 7 + k * 0.25) % 1;
      ctx.fillRect(Math.round(cx + (ahead > 0 ? 2 : 50) - age * 8 * Math.sign(ahead)), Math.round(cy + 26 - age * 8), 5 + Math.round(age * 5), 3);
    }
  }
  // the track sign and the lap timer under the controls; the timer runs fast
  const secs = 474 + t * 4, m = Math.floor(secs / 60), sec = secs - m * 60;
  const name = env.art(text('NÜRBURGRING', '#f4f1e6')), loop = env.art(text('NORDSCHLEIFE', '#6fd36a'));
  const lbl = env.art(text(`${m}:${sec.toFixed(2).padStart(5, '0')}`, '#f4f1e6')), lap = env.art(text('LAP', '#e8b923'));
  const boxW = Math.max(name.width, loop.width, lap.width + 4 + lbl.width) + 8, bx = W - boxW - 6;
  ctx.fillStyle = 'rgba(11, 11, 12, 0.72)'; ctx.fillRect(bx, 19, boxW, 25);
  ctx.fillStyle = '#6fd36a'; ctx.fillRect(bx, 19, 2, 25);                                       // green edge for the Green Hell
  ctx.drawImage(name, bx + 5, 22); ctx.drawImage(loop, bx + 5, 29);
  ctx.fillStyle = 'rgba(244, 241, 230, 0.25)'; ctx.fillRect(bx + 5, 35, boxW - 9, 1);
  ctx.drawImage(lap, bx + 5, 37); ctx.drawImage(lbl, bx + 9 + lap.width, 37);
}

export const ring = { build: buildRing, render: renderRing };
