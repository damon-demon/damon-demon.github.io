// Chapter 1, shots 6 and 7: Iceland. Vestrahorn ("Batman Mountain") over black sand dunes under a
// moving aurora; then a plane climbs out under the same sky, west towards New York.
import { Painter, rng } from '../pixels.js';
import { gradient, ridge } from '../kit.js';

const NIGHT = [['#0c1530', 0], ['#13204a', 0.3], ['#1c2c58', 0.6], ['#2a3d68', 0.85]];

function stars(W, seed) {
  const r = rng(seed), out = [];
  for (let n = 0; n < Math.round(W / 4); n++) out.push([Math.floor(r() * W), Math.floor(r() * 60), r()]);
  return out;
}

// The aurora: a wavy curtain of green rays with a violet fringe, alive with time.
function aurora(ctx, W, t, yBase) {
  for (let x = 0; x < W; x++) {
    const yc = yBase + 6 * Math.sin(x * 0.028 + t * 0.7) + 3 * Math.sin(x * 0.071 - t * 1.2);
    const ray = 0.5 + 0.5 * Math.sin(x * 0.33 + t * 2.1) * Math.sin(x * 0.11 - t * 0.9);
    const len = 8 + Math.round(10 * ray);
    ctx.globalAlpha = 0.18 + 0.32 * ray; ctx.fillStyle = '#a77ae0'; ctx.fillRect(x, Math.round(yc) - 3, 1, 3);
    ctx.globalAlpha = 0.25 + 0.5 * ray; ctx.fillStyle = '#3fe08a'; ctx.fillRect(x, Math.round(yc), 1, len);
    ctx.globalAlpha = 0.15 + 0.3 * ray; ctx.fillStyle = '#9af5c8'; ctx.fillRect(x, Math.round(yc), 1, 2);
  }
  ctx.globalAlpha = 1;
}

function drawStars(ctx, list, t) {
  for (const [x, y, b] of list) {
    if (Math.sin(t * 3 + b * 40) < -0.6) continue;               // twinkle
    ctx.fillStyle = b > 0.85 ? '#ffffff' : b > 0.5 ? '#c9d6f2' : '#7f90c0';
    ctx.fillRect(x, y, 1, 1);
  }
}

export function buildIceland(W, H = 96) {
  const layers = {};
  layers.sky = gradient(W, H, NIGHT);
  const mtn = new Painter(W, H);                                     // Vestrahorn: a black massif of sharp spires
  const massif = (x) => {
    const u = x / W;                                                 // 0..1 across the view
    const body = 4 + 30 * Math.exp(-Math.pow((u - 0.45) / 0.2, 2));
    let spikes = 0;
    for (const [c, h, w] of [[0.22, 30, 0.035], [0.3, 40, 0.03], [0.36, 48, 0.028], [0.42, 43, 0.022], [0.48, 50, 0.03], [0.55, 41, 0.026], [0.62, 33, 0.03], [0.7, 23, 0.035]]) {
      spikes = Math.max(spikes, h * Math.max(0, 1 - Math.abs(u - c) / w));
    }
    return Math.round(Math.max(body, spikes));
  };
  for (let i = 0; i < W; i++) {
    const h = massif(i), lit = massif(i + 1) > h;                    // the side facing the aurora catches light
    for (let j = 0; j < h; j++) mtn.px(i, 71 - j, j > h - 2 ? (lit ? '#6d8bc0' : '#3a4f78') : j > h - 5 && lit ? '#23304a' : '#0a0e16');
  }
  layers.mtn = mtn;
  const dunes = new Painter(W * 2, H), rd = rng(44);                 // black sand dunes and grass tufts
  const hump = ridge(W * 2, 10, [[4, 3, 0.4], [2, 9, 1.3]]);
  for (let i = 0; i < W * 2; i++) for (let j = 0; j < hump[i]; j++) dunes.px(i, 95 - j, j > hump[i] - 1.5 ? '#2a2c34' : '#17181e');
  for (let n = 0; n < W / 3; n++) {
    const x = Math.floor(rd() * W * 2), base = 95 - Math.round(hump[x]) + 1;
    for (let k = 0; k < 3; k++) dunes.px(x + k - 1, base - 1 - (k === 1 ? 2 : 1), k === 1 ? '#b8b25a' : '#7d8240');
  }
  layers.dunes = dunes;
  return { W, H, layers, stars: stars(W, 3) };
}

export function renderIceland(ctx, t, s, env) {
  const { W, H, canvases: c } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  drawStars(ctx, s.stars, t);
  aurora(ctx, W, t, 22);
  ctx.drawImage(c.mtn, 0, 0);
  // the wet sand mirrors the mountain and the aurora
  ctx.fillStyle = '#121a2e'; ctx.fillRect(0, 71, W, H - 71);         // wet sand
  ctx.save();
  ctx.translate(0, 142); ctx.scale(1, -1);
  ctx.globalAlpha = 0.5; ctx.drawImage(c.mtn, 0, 0, W, 71, 0, 0, W, 71);
  ctx.restore();
  ctx.globalAlpha = 0.14; ctx.fillStyle = '#3fe08a'; ctx.fillRect(0, 80, W, 4); ctx.globalAlpha = 1;   // the aurora, mirrored
  ctx.fillStyle = 'rgba(10, 14, 22, 0.55)';
  for (let y = 74; y < 90; y += 4) for (let x = (y * 7) % 23; x < W; x += 23) ctx.fillRect(x, y, 14, 1);   // broken ripples
  ctx.drawImage(c.dunes, Math.round(-t * 8), 0);
  // Yimeng walks in, stops, looks up
  const hero = env.hero('iceland'), stopAt = 1.1;
  const x = Math.round(W * 0.34) - Math.max(0, stopAt - t) * 22;
  const frame = t < stopAt ? Math.floor(t * 6) % 4 : 1;
  ctx.drawImage(hero.canvases[frame], Math.round(x) - hero.anchorX, 90 - hero.footY);
}

export const iceland = { build: buildIceland, render: renderIceland };

// ---------- the takeoff ----------
function plane() {
  const W = 58, H = 18, p = new Painter(W, H);
  const B = '#f2f3f6', b = '#c9ccd3', D = '#25427a', Y = '#e8b923', K = '#2a2d33';
  for (let y = 7; y < 14; y++) for (let x = 6; x < 56; x++) {           // fuselage, rounded nose
    const nose = x > 50 ? (x - 50) * 0.9 : 0, tail = x < 12 ? (12 - x) * 0.5 : 0;
    if (y < 7 + nose * 0.6 + tail * 0.8 || y > 13 - nose * 0.4) continue;
    p.px(x, y, y > 11 ? b : B);
  }
  for (let y = 0; y < 9; y++) for (let x = 7 + Math.round(y * 0.4); x < 12 + y; x++) p.px(x, y, y < 3 ? Y : D);   // tail fin, swept back
  for (let x = 2; x < 13; x++) p.px(x, 9, D);                           // tailplane
  for (let x = 14; x < 52; x += 3) p.px(x, 9, '#5a6f96');               // windows
  p.rect(50, 8, 3, 2, '#2a3a5a');                                       // cockpit
  for (let k = 0; k < 9; k++) for (let x = 24 + k; x < 36 + k; x++) p.px(x, 13 + Math.floor(k / 2), k < 2 ? b : '#9aa0aa');   // wing
  for (let y = 14; y < 17; y++) for (let x = 30; x < 37; x++) p.px(x, y, K);                   // engine
  p.px(37, 15, '#5a5f6a');
  return p;
}

function gear(ctx, x, y) {
  ctx.fillStyle = '#2a2d33';
  for (const dx of [16, 33, 34]) { ctx.fillRect(x + dx, y + 14, 1, 3); ctx.fillRect(x + dx - 1, y + 17, 3, 1); }
}

export function buildTakeoff(W, H = 96) {
  const layers = { sky: gradient(W, H, NIGHT), plane: plane() };
  const rw = new Painter(W * 2, H);                                     // runway with edge lights
  for (let i = 0; i < W * 2; i++) {
    for (let y = 80; y < H; y++) rw.px(i, y, y < 82 ? '#20232b' : y < 88 ? '#2c3038' : '#15171c');
    if (i % 12 < 6) rw.px(i, 85, '#d9dde4');
    if (i % 20 === 0) { rw.px(i, 81, '#5aa0ff'); rw.px(i, 88, '#5aa0ff'); }
  }
  for (let i = 0; i < W * 2; i++) for (let y = 74; y < 80; y++) rw.px(i, y, y === 79 && i % 9 === 0 ? '#e8b923' : '#0f1219');
  layers.runway = rw;
  return { W, H, layers, stars: stars(W, 8) };
}

export function renderTakeoff(ctx, t, s) {
  const { W, H, canvases: c } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  drawStars(ctx, s.stars, t + 2);
  aurora(ctx, W, t + 2, 22);
  ctx.drawImage(c.runway, Math.round(-t * 60), 0);
  // roll, rotate, climb out to the top right
  const roll = Math.min(t, 0.35), climb = Math.max(0, t - 0.35);
  const x = W * 0.2 + roll * 160 + climb * 260, y = 80 - c.plane.height - 1 - climb * climb * 120 - climb * 30;
  ctx.drawImage(c.plane, Math.round(x), Math.round(y));
  if (t < 0.6) gear(ctx, Math.round(x), Math.round(y));
  if (Math.floor(t * 6) % 2 === 0) { ctx.fillStyle = '#ff4a4a'; ctx.fillRect(Math.round(x) + 24, Math.round(y) + 6, 1, 1); }   // beacon
}

export const takeoff = { build: buildTakeoff, render: renderTakeoff };
