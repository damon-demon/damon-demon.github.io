// California coast at golden hour: the approved test scene and the reduced-motion poster.
// Ported from the approved mockup (.superpowers/pixel-mock/scene.js); tests/reel/beach.test.js
// holds every layer to the mockup's exact pixels.
import { Painter, bandColor, rng } from './pixels.js';

const u = 1;                         // pixel density of option A
const R = (v) => Math.round(v * u);
const SPEED = 26;                    // native px per second at parallax 1 (matches the walk cycle)

const SKY = [
  ['#29264f', 0.00], ['#3a3264', 0.14], ['#573d72', 0.28], ['#84497c', 0.41],
  ['#b25b7e', 0.53], ['#d67274', 0.64], ['#ec8f69', 0.74], ['#f5ad68', 0.83], ['#fbcd84', 0.92],
];
const OCEAN = [['#3b4c85', 0], ['#465c99', 0.3], ['#5370a8', 0.6], ['#6585b5', 0.85]];

// Pure: every layer as a Painter. Scrolling layers are TW = 2W wide and tile seamlessly.
export function buildBeach(W, H = 96) {
  const horizon = R(56), shore = R(72), walkTop = R(80), feet = R(88);
  const TW = W * 2;
  const layers = {};

  // sky (static) + sun
  const sky = new Painter(W, horizon + 1);
  for (let j = 0; j <= horizon; j++) for (let i = 0; i < W; i++) sky.px(i, j, bandColor(SKY, j / horizon, i, j));
  const sx = Math.round(W * 0.72), sy = horizon - R(10), sr = R(7);
  for (let j = -sr - R(4); j <= sr + R(4); j++) for (let i = -sr - R(4); i <= sr + R(4); i++) {
    const dd = Math.sqrt(i * i + j * j);
    if (sy + j > horizon) continue;
    if (dd <= sr - u) sky.px(sx + i, sy + j, '#fff5cf');
    else if (dd <= sr) sky.px(sx + i, sy + j, '#ffe293');
    else if (dd <= sr + R(2) && (i + j) % 2 === 0) sky.px(sx + i, sy + j, '#fcd99a');
    else if (dd <= sr + R(4) && (i + j) % 4 === 0) sky.px(sx + i, sy + j, '#fbd08e');
  }
  layers.sky = sky;

  // clouds (parallax 0.06)
  const cl = new Painter(TW, horizon);
  const rc = rng(7);
  for (let n = 0; n < 7; n++) {
    const cx = rc() * TW, cy = R(10) + rc() * R(30), len = R(18) + rc() * R(40), th = Math.max(1, R(2 + rc() * 2));
    const warm = cy > R(26);
    for (let y = 0; y < th; y++) {
      const inset = Math.round((y === 0 ? 0.18 : 0) * len + y * u * 2);
      for (let x = inset; x < len - inset; x++) cl.wpx(cx + x, cy + y, y === 0 ? (warm ? '#f6b58c' : '#c77a93') : (warm ? '#e0866f' : '#8f5784'));
    }
  }
  layers.clouds = cl;

  // far headlands (0.12): a ridge on part of the tile, periodic in TW
  const hd = new Painter(TW, horizon + 1);
  const P = (x, a, f, ph) => a * Math.sin((x / TW) * Math.PI * 2 * f + ph);
  for (let i = 0; i < TW; i++) {
    const env = Math.max(0, Math.sin((i / TW) * Math.PI * 2) * 1.25 - 0.15);
    const h1 = env * (R(14) + P(i, R(4), 3, 0.4) + P(i, R(2), 9, 1.1));
    const h2 = env * (R(8) + P(i, R(3), 5, 2.0) + P(i, R(1.5), 13, 0.3));
    for (let j = 0; j < h1; j++) hd.px(i, horizon - j, j > h1 - u - 0.5 ? '#9a6283' : '#6d4d7c');
    for (let j = 0; j < h2; j++) hd.px(i, horizon - j, j > h2 - u - 0.5 ? '#7b4f74' : '#4f3a66');
  }
  layers.head = hd;

  // ocean (0.25) with wave dashes; the sun glitter is drawn per frame
  const oc = new Painter(TW, shore - horizon);
  const ro = rng(11);
  for (let j = 0; j < shore - horizon; j++) for (let i = 0; i < TW; i++) oc.px(i, j, bandColor(OCEAN, j / (shore - horizon), i, j));
  for (let n = 0; n < 60; n++) {
    const x0 = ro() * TW, y0 = 1 + Math.floor(ro() * (shore - horizon - 2)), len = R(3) + ro() * R(8);
    for (let x = 0; x < len; x++) oc.wpx(x0 + x, y0, y0 < (shore - horizon) * 0.5 ? '#5a74ad' : '#86a3cc');
  }
  layers.ocean = oc;

  // beach + palms (0.5); full height so palms rise into the sky
  const be = new Painter(TW, H);
  const rb = rng(23);
  for (let j = shore; j < walkTop; j++) for (let i = 0; i < TW; i++) {
    const foam = j === shore || (j === shore + 1 && Math.sin(i / (3 * u)) > 0.3);
    be.px(i, j, foam ? '#f6ecdf' : (j < shore + R(3) ? '#c99a74' : ((i * 7 + j * 3) % 23 === 0 ? '#f0c590' : '#e2b07c')));
  }
  const palm = (x0, base, hgt, lean) => {
    const tw = Math.max(2, R(2));
    let tx = x0, ty = base;
    for (let s = 0; s <= hgt; s++) {
      const t = s / hgt, x = x0 + lean * t * t, y = base - s;
      for (let w = 0; w < tw; w++) be.wpx(x + w, y, w === 0 ? '#5a3c2e' : ((s % R(3) === 0) ? '#5f4031' : '#86614a'));
      tx = x; ty = y;
    }
    const cxp = tx + tw / 2, cyp = ty;
    const fronds = [[-1.0, 0.9], [-0.7, 0.5], [-0.35, 0.2], [0.35, 0.2], [0.75, 0.55], [1.0, 1.0], [0.1, 0.05]];
    fronds.forEach(([dir, droop], k) => {
      const len = R(15) + (k % 3) * R(2);
      for (let s = 0; s <= len; s++) {
        const t = s / len, x = cxp + dir * s, y = cyp - R(3) * Math.sin(t * Math.PI) * (1 - droop) + droop * t * t * R(10);
        be.wpx(x, y, t > 0.75 ? '#9aa555' : (t > 0.4 ? '#4f7d48' : '#35583b'));
        if (u > 1) be.wpx(x, y + 1, '#2c4733');
        if (s % 2 === 0 && t > 0.15) be.wpx(x, y + R(1.5) + 1, '#2c4733');
      }
    });
    be.rect(Math.round(cxp - u), cyp + 1, Math.max(2, R(2)), Math.max(2, R(2)), '#3a2a22');
  };
  [[0.06, 36, 4], [0.31, 44, -5], [0.37, 33, 3], [0.62, 40, 5], [0.88, 46, -4]].forEach(([fx, hh, ln]) => palm(fx * TW, walkTop - 1, R(hh), R(ln)));
  for (let n = 0; n < 18; n++) {              // small rocks on the sand
    const x0 = rb() * TW, y0 = shore + R(4) + rb() * R(3);
    be.rect(Math.round(x0), Math.round(y0), R(3), Math.max(1, R(1.5)), '#8b6a58');
    be.rect(Math.round(x0), Math.round(y0), R(2), 1, '#a8836a');
  }
  layers.beach = be;

  // boardwalk + rope fence (1.0)
  const bw = new Painter(TW, H);
  for (let j = walkTop; j < H; j++) for (let i = 0; i < TW; i++) {
    const row = Math.floor((j - walkTop) / R(3));
    const seam = (i + row * R(17)) % R(24) === 0;
    let col = row % 2 ? '#a5734d' : '#b07d55';
    if ((j - walkTop) % R(3) === 0) col = '#7c5236';
    if (seam) col = '#6f4830';
    if (j === walkTop) col = '#c8935f';
    if (j > feet + R(3)) col = (j - feet) % 2 ? '#5d3d29' : '#664430';
    bw.px(i, j, col);
  }
  const postEvery = R(64);
  for (let p = 0; p < TW; p += postEvery) {
    bw.rect(p, walkTop - R(11), Math.max(2, R(2)), R(11), '#6b4a34');
    bw.rect(p, walkTop - R(11), 1, R(11), '#8d6446');
    for (let s = 0; s < postEvery; s++) {     // sagging rope
      const t = s / postEvery, y = walkTop - R(9) + Math.round(Math.sin(t * Math.PI) * R(3));
      bw.wpx(p + 1 + s, y, '#d9c4a0');
    }
  }
  layers.walk = bw;

  // foreground ice plant (1.3)
  const fg = new Painter(TW, H);
  const rf = rng(41);
  for (let n = 0; n < 26; n++) {
    const x0 = rf() * TW, wdt = R(10) + rf() * R(16), hh = R(4) + rf() * R(4);
    for (let i = 0; i < wdt; i++) {
      const t = i / wdt, top = H - Math.round(Math.sin(t * Math.PI) * hh) - 1;
      for (let j = top; j < H; j++) fg.wpx(x0 + i, j, j === top ? '#7fa65a' : ((i + j) % 3 ? '#4d7a43' : '#3d6538'));
      if (rf() < 0.18) { fg.wpx(x0 + i, top - 1, '#ff7ab8'); fg.wpx(x0 + i, top, '#e0559a'); }
    }
  }
  layers.fg = fg;

  // sun glitter on the water: [x, y, brightness]
  const rg = rng(5), glitter = [];
  for (let n = 0; n < 70; n++) {
    const j = horizon + 1 + Math.floor(Math.pow(rg(), 1.4) * (shore - horizon - 2));
    const spread = R(4) + (j - horizon) * 0.9;
    glitter.push([sx + (rg() - 0.5) * 2 * spread, j, rg()]);
  }
  return { W, H, layers, horizon, shore, walkTop, feet, TW, glitter };
}

function layer(ctx, img, par, y, t) {
  const off = Math.round((t * SPEED * par) % img.width);
  ctx.drawImage(img, -off, y);
  ctx.drawImage(img, img.width - off, y);
}

// Draw one frame. scene.canvases holds the layers as canvases (the engine converts them);
// env.hero(key) / env.dog(key) return { canvases, anchorX, footY } for an outfit.
export function renderBeach(ctx, t, scene, env) {
  const { W, H, canvases: c } = scene;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  layer(ctx, c.clouds, 0.06, 0, t);
  layer(ctx, c.head, 0.12, 0, t);
  layer(ctx, c.ocean, 0.25, scene.horizon + 1, t);
  const tick = Math.floor(t * 6);
  scene.glitter.forEach(([x, y, r], n) => {
    if (((n * 7 + tick) % 5) < 2) {
      ctx.fillStyle = r > 0.6 ? '#fff4c8' : '#ffd27e';
      ctx.fillRect(Math.round(x), y, r > 0.8 ? 2 : 1, 1);
    }
  });
  layer(ctx, c.beach, 0.5, 0, t);
  layer(ctx, c.walk, 1, 0, t);
  const hero = env.hero('work'), dog = env.dog('houndstooth');
  const x = Math.round(W * 0.34);
  ctx.drawImage(hero.canvases[Math.floor(t * 6) % hero.canvases.length], x - hero.anchorX, scene.feet - hero.footY);
  ctx.drawImage(dog.canvases[Math.floor(t * 9) % dog.canvases.length], x + 28 - dog.anchorX, scene.feet - dog.footY);
  layer(ctx, c.fg, 1.3, 0, t);
}

export const beach = { build: buildBeach, render: renderBeach };
