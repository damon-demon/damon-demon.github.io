// Chapter 1, shot 4: the Nürburgring Nordschleife from a chase camera. Yimeng's white modified Golf
// GTI attacks a stretch of the Green Hell: bend after bend, climbing and plunging, airborne over a
// crest like Flugplatz. A pseudo-3D road (projected segments, near to far) under a lap timer.
import { Painter } from '../pixels.js';
import { gradient, ridge, label } from '../kit.js';

const SEG = 200, ROAD = 620, CAM_H = 700, DEPTH = 0.8, DRAW = 80;
const SPEED = 46 * SEG;                       // world units per second
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
  const layers = {};
  layers.sky = gradient(W, H, [['#9fb2c6', 0], ['#b6c5d4', 0.25], ['#cfd9e2', 0.42], ['#dde5ea', 0.5]]);
  // Wide screens get the full-size Golf; on a phone the road is too narrow for it, so the 60 x 32 one.
  // The horizon rises with the car so the road ahead stays visible over its roof.
  const car = W >= 300 ? golfRearBig() : golfRear(), hy = car.h > 40 ? 22 : 36;
  const hills = new Painter(W * 3, H);                              // the Eifel's forested hills on the horizon
  const h1 = ridge(W * 3, 10, [[4, 3, 0.5], [2, 7, 1.3], [1, 19, 0.2]]);
  for (let i = 0; i < W * 3; i++) for (let j = 0; j < h1[i]; j++) hills.px(i, hy + 2 - j, j > h1[i] - 1.5 ? '#5d7a68' : '#4a6a58');
  layers.hills = hills;
  layers.car = car;
  return { W, H, hy, layers, track: buildTrack() };
}

const labels = new Map();                // text -> pixel art, so the timer does not churn objects
function text(str, ink) {
  const k = str + ink;
  if (!labels.has(k)) labels.set(k, label(str, ink));
  return labels.get(k);
}

function project(p, camY, camZ, W, H, hy) {
  const z = p.z - camZ, scale = DEPTH / z;
  return { z, scale, x: Math.round(W / 2 + scale * p.x * W / 2), y: Math.round(hy - scale * (p.y - camY) * H / 2), w: Math.round(scale * ROAD * W / 2) };
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
    const p1 = project({ x: -x, y: sg.y1, z: z1 }, camY, pos, W, H, s.hy);
    const p2 = project({ x: -x - dx, y: sg.y2, z: z2 }, camY, pos, W, H, s.hy);
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
  // the car: pushed wide in the bends, bouncing, airborne over the crest; everything scales with it
  const k = c.car.width / 60, ahead = segs[(base + 4) % N].curve;
  const air = Math.max(0, 1 - Math.abs(base + pct - crest - 2) / 5);   // airborne just past the crest
  const lift = Math.round(Math.sin(air * Math.PI / 2) * 8 * k * air);
  const cx = Math.round(W / 2 - c.car.width / 2 - ahead * 1.6 * k), cy = H - c.car.height - 1 - lift + (Math.floor(t * 12) % 2);
  ctx.fillStyle = `rgba(16, 22, 16, ${lift > 0 ? 0.4 : 0.55})`;                                 // shadow on the asphalt
  ctx.fillRect(cx + Math.round((4 + lift / 2) * 1), H - 3, c.car.width - 8 * k - lift, 3);
  ctx.drawImage(c.car, cx, cy);
  if (Math.abs(ahead) > 2.5) {                                          // tyre smoke on the hard bends
    ctx.fillStyle = 'rgba(225, 226, 230, 0.6)';
    for (let n = 0; n < 4; n++) {
      const age = (t * 7 + n * 0.25) % 1;
      ctx.fillRect(Math.round(cx + (ahead > 0 ? 2 : 50) * k - age * 8 * k * Math.sign(ahead)), Math.round(cy + 26 * k - age * 8 * k), Math.round((5 + age * 5) * k), Math.round(3 * k));
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
