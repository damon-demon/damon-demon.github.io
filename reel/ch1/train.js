// Chapter 1, shot 2: a train across Europe, seen from inside the carriage. Yimeng sits by the
// window while Paris, Rome, Barcelona and the Alps stream past behind, cut together by tunnels.
// Passport stamps pile up on the wall.
import { Painter, rng } from '../pixels.js';
import { tile, gradient, ridge, label, art, paint } from '../kit.js';

const LEG = 1;                               // seconds per city
const WIN_TOP = 19, WIN_BOT = 63;            // window glass rows (outside shows through)
const SEAT = 81;                             // the seat cushion's top row
const CITIES = ['paris', 'rome', 'bcn', 'alps'];

const SKIES = {
  paris: [['#8fa7c4', 0], ['#a6bbd3', 0.35], ['#c3d2e2', 0.7], ['#dbe4ee', 0.92]],
  rome: [['#d9a978', 0], ['#e6bc8b', 0.35], ['#f0cf9f', 0.7], ['#f8e2bb', 0.92]],
  bcn: [['#4f97d6', 0], ['#6dabe0', 0.35], ['#93c3ea', 0.7], ['#bfdcf3', 0.92]],
  alps: [['#3f80cf', 0], ['#5b97da', 0.35], ['#86b4e6', 0.7], ['#c4dcf3', 0.92]],
};

// ---------- landmarks, each its own transparent Painter ----------
// The Eiffel Tower in open lattice: the great arch between the legs, a cross-braced middle,
// two platforms and the spire.
const EIFFEL = art(`
...............I...............
...............I...............
...............I...............
..............III..............
..............ILI..............
.............IIIII.............
..............I.I..............
..............III..............
..............I.I..............
.............IILII.............
.............I.I.I.............
.............IIIII.............
.............I.L.I.............
............IIIIIII............
............I.I.I.I............
............IIIIIII............
...........LLLLLLLLL...........
...........IIIIIIIII...........
...........II.I.I.II...........
...........I.I...I.I...........
..........II..I.I..II..........
..........I.I..I..I.I..........
..........II.I...I.II..........
.........II...I.I...II.........
.........I.I...I...I.I.........
.........II.I.I.I.I.II.........
........II...I...I...II........
........IIIIIIIIIIIIIII........
......LLLLLLLLLLLLLLLLLLL......
......IILILILILILILILILII......
......IIIIIIIIIIIIIIIIIII......
......III.I.I.....I.I.III......
.....III.I.I.......I.I.III.....
.....II.I.I.........I.I.II.....
....III.I.I.........I.I.III....
....II.I.I...........I.I.II....
...III.I.I...........I.I.III...
...II.I.I.............I.I.II...
..III.I.I.............I.I.III..
..II.I.I...............I.I.II..
.III.I.I...............I.I.III.
.II.I.I.................I.I.II.
III.I.I.................I.I.III
IIIIII...................IIIIII
`, { I: '#4f3d30', L: '#9a7c60' });

function colosseum() {
  const W = 64, H = 24, p = new Painter(W, H);
  const S = '#dcc7a2', d = '#b39a76', A = '#6e5c46';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ruin = x > 46 ? Math.min(12, (x - 46) * 0.9) : 0;             // the broken outer ring on the right
    if (y < ruin) continue;
    p.px(x, y, (y === 4 || y === 10 || y === 16) ? d : S);
  }
  for (let tier = 0; tier < 3; tier++) {                                // three tiers of arches
    const y0 = 5 + tier * 6;
    for (let x = 2; x < W - 2; x += 5) {
      const ruin = x > 46 ? Math.min(12, (x - 46) * 0.9) : 0;
      if (y0 < ruin) continue;
      for (let y = y0 + 1; y < y0 + 5; y++) for (let k = 0; k < 3; k++) if (!(y === y0 + 1 && k !== 1)) p.px(x + k, y, A);
    }
  }
  for (let x = 3; x < 44; x += 5) p.px(x, 2, A);                         // attic windows
  return p;
}

function sagrada() {
  const W = 44, H = 40, p = new Painter(W, H);
  const S = '#cfac7c', d = '#9c7c56', tips = ['#e8c23a', '#c8402e', '#4f9a4a', '#e8c23a'];
  for (let y = 22; y < H; y++) for (let x = 2; x < 30; x++) p.px(x, y, (x + y) % 4 === 0 ? d : S);   // nave
  [[4, 6], [10, 1], [16, 3], [22, 8]].forEach(([x0, top], i) => {     // four bell towers, tapering
    for (let y = top; y < 24; y++) {
      const w = 1 + (y - top) * 0.16;
      for (let x = Math.round(x0 + 2 - w); x <= Math.round(x0 + 2 + w); x++) p.px(x, y, (y % 3 === 0 && x === x0 + 2) ? d : S);
    }
    p.px(x0 + 2, top - 1, tips[i]); p.px(x0 + 2, top - 2, tips[i]);
  });
  for (let y = 4; y < H; y++) p.px(37, y, '#e0b020');                   // the ever-present crane
  for (let x = 30; x < 44; x++) p.px(x, 4, '#e0b020');
  p.px(31, 5, '#e0b020'); p.px(31, 6, '#555'); p.px(31, 7, '#555');
  return p;
}

function matterhorn() {
  const W = 70, H = 46, p = new Painter(W, H);
  for (let y = 0; y < H; y++) {
    const l = 30 - y * 0.75, r = 34 + y * 0.62 + (y > 20 ? (y - 20) * 0.3 : 0);
    for (let x = Math.max(0, Math.round(l)); x <= Math.min(W - 1, Math.round(r)); x++) {
      const snow = y < 14 || (y < 30 && (x * 3 + y * 5) % 7 < 3 - (y - 14) / 8);
      p.px(x, y, snow ? (x < 32 ? '#f4f7fa' : '#d4dde6') : (x < 32 ? '#6f7f93' : '#5a6a7e'));
    }
  }
  return p;
}

function chalet() {
  const p = new Painter(16, 14);
  for (let y = 0; y < 5; y++) for (let x = 7 - y * 1.6; x <= 8 + y * 1.6; x++) p.px(x, y, '#7a3a28');
  for (let y = 5; y < 14; y++) for (let x = 1; x < 15; x++) p.px(x, y, (y === 5) ? '#5a2c1c' : '#b8875a');
  for (const [x, y] of [[3, 7], [10, 7]]) p.rect(x, y, 3, 3, '#e9e2cf');
  p.rect(7, 9, 2, 5, '#4a2c1c');
  return p;
}

function swissFlag() {
  const p = new Painter(9, 14);
  for (let y = 0; y < 14; y++) p.px(0, y, '#4a4a50');
  for (let y = 0; y < 6; y++) for (let x = 1; x < 8; x++) p.px(x, y, '#d7262e');
  for (const [x, y] of [[4, 1], [4, 2], [4, 3], [4, 4], [2, 2.5], [3, 2.5], [5, 2.5], [6, 2.5]]) p.px(x, Math.round(y), '#ffffff');
  return p;
}

// ---------- the view out of the window, per city ----------
function cityFar(W, kind) {
  const TW = W * 2, far = new Painter(TW, 66), r = rng(kind.length * 17), base = 64;
  if (kind === 'paris') {
    for (let x = 0; x < TW; x += 19) {
      const h = 14 + Math.floor(r() * 5), top = base - h;
      far.rect(x, top, 18, h, '#e3d8c2');
      for (let k = 0; k < 4; k++) far.rect(x - 1 + k, top - 4 + k, 20 - 2 * k, 1, '#8a929c');
      for (let fy = top + 2; fy < base - 1; fy += 4) for (let fx = x + 2; fx < x + 17; fx += 4) { far.rect(fx, fy, 2, 2, '#5e6672'); far.rect(fx - 1, fy + 2, 4, 1, '#2a2a2e'); }
    }
  } else if (kind === 'rome') {
    for (let x = 0; x < TW; x += 16) {
      const h = 10 + Math.floor(r() * 6), top = base - h, col = r() < 0.5 ? '#d9965a' : '#c97b4f';
      far.rect(x, top, 15, h, col); far.rect(x - 1, top - 1, 17, 1, '#a4532f');
      for (let fy = top + 2; fy < base - 1; fy += 4) for (let fx = x + 2; fx < x + 13; fx += 4) far.rect(fx, fy, 2, 2, '#6e4b33');
    }
    for (let x = 6; x < TW; x += 41) {
      far.rect(x + 7, base - 16, 2, 16, '#5a4030');
      for (let j = 0; j < 5; j++) for (let i = -10 + j; i <= 10 - j; i++) far.wpx(x + 8 + i, base - 20 + j, j === 4 ? '#2f4a2a' : '#3e6234');
    }
  } else if (kind === 'bcn') {
    for (let x = 0; x < TW; x += 20) {
      const h = 11 + Math.floor(r() * 5), top = base - h;
      far.rect(x, top, 19, h, r() < 0.5 ? '#e8d2b0' : '#ddc3a0');
      for (let fy = top + 2; fy < base - 1; fy += 4) for (let fx = x + 2; fx < x + 18; fx += 4) far.rect(fx, fy, 2, 2, '#7a6a58');
    }
    for (let x = 0; x < TW; x += 29) {
      far.rect(x + 8, base - 22, 1, 22, '#6b5a40');
      for (const [dx, dy] of [[-6, 2], [-4, 0], [-2, -1], [0, -1], [2, -1], [4, 0], [6, 2], [-5, 3], [5, 3]]) far.wpx(x + 8 + dx, base - 23 + dy, '#3f7a3a');
    }
  } else {
    const peaks = ridge(TW, 26, [[8, 2, 0.4], [5, 5, 1.7], [2.5, 11, 0.2]]);
    for (let i = 0; i < TW; i++) for (let j = 0; j < peaks[i]; j++) far.px(i, base - j, j > peaks[i] - 6 ? '#eef2f6' : j > peaks[i] - 8 ? '#c9d4df' : '#7d8ea3');
    const meadow = ridge(TW, 8, [[2, 3, 1.1], [1, 9, 0.5]]);
    for (let i = 0; i < TW; i++) for (let j = 0; j < meadow[i]; j++) far.px(i, base - j, j > meadow[i] - 1.5 ? '#86b85e' : '#6c9f4c');
    for (let x = 4; x < TW; x += 19) for (let j = 0; j < 9; j++) for (let i = -Math.floor(j / 2); i <= Math.floor(j / 2); i++) far.wpx(x + i, base - 12 + j, '#2f5a3a');
  }
  return far;
}

function cityNear(W, kind) {
  // foreground scrub along the line, smeared by speed
  const TW = W * 2, p = new Painter(TW, 66), r = rng(kind.length * 5 + 3);
  const col = { paris: '#3f5a3a', rome: '#4a5f34', bcn: '#55703c', alps: '#2f5a3a' }[kind];
  for (let x = 0; x < TW; x++) {
    const h = 3 + Math.floor((Math.sin(x / 7) + 1) * 2 + r() * 2);
    for (let j = 0; j < h; j++) p.px(x, 65 - j, j === h - 1 ? '#6f8a55' : col);
  }
  return p;
}

// ---------- the carriage, with the windows cut out ----------
function carriage(W, H) {
  const p = new Painter(W, H), seatX = Math.round(W * 0.34);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = y < 20 ? '#e8e4da' : y < 66 ? '#d6d0c3' : y < 88 ? '#cbc4b5' : '#4a4f5c';
    if (y === 20 || y === 66) c = '#a9a294';
    if (y >= 88 && y === 88) c = '#6a707d';
    p.px(x, y, c);
  }
  for (let x = 0; x < W; x += 34) p.rect(x + 12, 8, 10, 2, '#fff6dc');      // ceiling lights
  const paneW = 58, pillar = 6;                                            // window panes
  for (let x0 = 4; x0 < W; x0 += paneW + pillar) {
    for (let y = WIN_TOP - 1; y <= WIN_BOT; y++) for (let x = x0 - 1; x <= x0 + paneW; x++) {
      const inside = y >= WIN_TOP && y < WIN_BOT && x >= x0 && x < x0 + paneW;
      if (x < 0 || x >= W) continue;
      if (inside) { const k = (y * W + x) * 4; p.data[k + 3] = 0; }
      else p.px(x, y, '#3a3a40');                                           // rubber frame
    }
  }
  for (let x = 0; x < W; x++) { p.px(x, WIN_BOT + 1, '#8a8f99'); p.px(x, WIN_BOT + 2, '#757a84'); }  // ledge
  for (let x = seatX + 2 - 52 * Math.ceil((seatX + 60) / 52); x < W + 60; x += 52) {   // seats, side on, one under Yimeng
    if (x + 18 < 0) continue;
    for (let y = 64; y < 88; y++) for (let k = 0; k < 6; k++) p.px(x - 6 + k, y, k === 0 ? '#20345e' : '#2f4f8f');   // backrest
    for (let y = SEAT; y < SEAT + 4; y++) for (let k = 0; k < 18; k++) p.px(x + k, y, y === SEAT ? '#4a6fb5' : '#2f4f8f');
    for (let y = SEAT + 4; y < 88; y++) p.px(x + 8, y, '#3a3f4a');
    for (let k = -3; k < 0; k++) p.px(x + k, 63, '#f4f1ea');               // headrest cover
  }
  return p;
}

// ---------- passport stamps ----------
const STAMPS = [
  ['PARIS', '#c0392b', 0.1], ['ROMA', '#2c5aa0', 1.1], ['BCN', '#7b3fa0', 2.1], ['ALPEN', '#2e8b57', 3.05],
  ['PRAHA', '#b0482c', 3.35], ['WIEN', '#2c6aa0', 3.48], ['AMS', '#a0522d', 3.58], ['MUC', '#3a7a3a', 3.66], ['BUD', '#8b3a6a', 3.73],
];
function stampArt(str, ink) {
  const t = label(str, ink), w = t.w + 6, h = 11;
  const rows = [];
  for (let y = 0; y < h; y++) {
    let r = '';
    for (let x = 0; x < w; x++) {
      const corner = (x === 0 || x === w - 1) && (y === 0 || y === h - 1);
      const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      const text = y >= 3 && y < 8 && x >= 3 && x < 3 + t.w && t.rows[y - 3][x - 3] === '#';
      r += corner ? '.' : edge || text ? '#' : '.';
    }
    rows.push(r);
  }
  return { rows, palette: { '#': ink }, w, h };
}
const STAMP_ART = STAMPS.map(([s, ink]) => stampArt(s, ink));

export function buildTrain(W, H = 96) {
  const layers = { carriage: carriage(W, H) };
  CITIES.forEach((k, i) => {
    layers[`sky${i}`] = gradient(W, 66, SKIES[k]);
    layers[`far${i}`] = cityFar(W, k);
    layers[`near${i}`] = cityNear(W, k);
  });
  Object.assign(layers, { lm0: paint(EIFFEL), lm1: colosseum(), lm2: sagrada(), lm3: matterhorn(), chalet: chalet(), flag: swissFlag() });
  return { W, H, layers };
}

export function renderTrain(ctx, t, s, env) {
  const { W, H, canvases: c } = s;
  const leg = Math.min(3, Math.floor(t / LEG)), lt = t - leg * LEG;
  ctx.clearRect(0, 0, W, H);
  // outside
  ctx.drawImage(c[`sky${leg}`], 0, 0);
  tile(ctx, c[`far${leg}`], lt * 70, 0);
  const lm = c[`lm${leg}`], lx = Math.round(W * 0.58 - lt * 46);
  ctx.drawImage(lm, lx, 64 - lm.height);
  if (leg === 3) { ctx.drawImage(c.chalet, lx + 52, 64 - c.chalet.height); ctx.drawImage(c.flag, lx + 46, 64 - c.flag.height); }
  tile(ctx, c[`near${leg}`], t * 380, 0);
  ctx.fillStyle = '#2a2d33';                                              // poles flicking past
  for (let x = W - ((t * 560) % 170); x > -4; x -= 170) ctx.fillRect(Math.round(x), WIN_TOP, 2, WIN_BOT - WIN_TOP);
  // tunnels between cities: the window goes black for a beat
  for (let k = 1; k <= 3; k++) {
    const a = Math.max(0, 1 - Math.abs(t - k * LEG) / 0.1);
    if (a > 0) { ctx.globalAlpha = a; ctx.fillStyle = '#0b0b0c'; ctx.fillRect(0, WIN_TOP, W, WIN_BOT - WIN_TOP); ctx.globalAlpha = 1; }
  }
  // inside: the carriage rocks on the rail joints
  const bob = Math.floor(t * 7) % 2;
  ctx.drawImage(c.carriage, 0, bob);
  const hero = env.hero('travel', 'sit');
  ctx.drawImage(hero.canvases[0], Math.round(W * 0.34) - hero.anchorX, SEAT - 1 - hero.seatY + bob);
  // passport stamps collect on the wall to the right
  STAMPS.forEach(([, , at], i) => {
    if (t < at) return;
    const col = i % 3, row = Math.floor(i / 3);
    ctx.globalAlpha = 0.88;
    ctx.drawImage(env.art(STAMP_ART[i]), W - 88 + col * 27 + (row % 2) * 5, 67 + row * 7 + (i % 2) + bob);
    ctx.globalAlpha = 1;
  });
}

export const train = { build: buildTrain, render: renderTrain };
