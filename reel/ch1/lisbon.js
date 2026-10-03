// Chapter 1, shot 3: Lisbon. The yellow 28 tram grinds up a steep street of tiled facades with
// laundry overhead; the red 25 de Abril bridge spans the Tagus far below. The camera climbs with it.
import { Painter, rng } from '../pixels.js';
import { gradient, label } from '../kit.js';

const SLOPE = 0.2;                       // the street rises 1 px for every 5 px
const V = 34;                            // tram speed along x, px/s
const RAIL = 84;                         // screen row of the rail under the tram at t = 0

const FACADES = ['#e9a3a0', '#ecc76a', '#8fb9d6', '#a8d5b5', '#efe9dd', '#e7b48c'];
const LAUNDRY = ['#e8414b', '#f4f1ea', '#3f6fb5', '#f2c22e', '#4f9a4a'];

function tramArt() {
  const W = 50, H = 30, p = new Painter(W, H);
  const Y = '#f2c22e', y = '#d4a41f', C = '#f4efe2', K = '#2a2a2e', G = '#2c3a4a';
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const front = i > W - 6 ? (i - (W - 6)) : 0;               // rounded front end
    if (j < front - 2 || j > H - 1) continue;
    let c = null;
    if (j < 2) c = i > 3 && i < W - 4 ? C : null;
    else if (j < 4) c = C;
    else if (j < 6) c = Y;
    else if (j < 14) c = ((i - 3) % 8 < 6 && i > 2 && i < W - 3) ? G : Y;    // windows
    else if (j === 14) c = C;
    else if (j < 24) c = (j === 19 ? y : Y);
    else if (j < 26) c = K;
    if (c) p.px(i, j, c);
  }
  for (let i = 3; i < W - 3; i += 8) for (let j = 6; j < 14; j++) p.px(i + 6, j, C);   // window pillars
  for (const cx of [11, 37]) for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (i * i + j * j <= 5) p.px(cx + i, 27 + j, j < 0 && i < 0 ? '#4a4a50' : K);
  p.rect(W - 4, 20, 2, 2, '#fff6c8');                          // headlight
  p.rect(W - 13, 2, 9, 3, K);                                  // destination board "28"
  const n = label('28', '#f2c22e');
  for (let j = 0; j < 5; j++) for (let i = 0; i < n.w; i++) if (n.rows[j][i] === '#') p.px(W - 12 + i + 1, j - 1 + 2, '#f2c22e');
  return p;
}

function bridgeFar(W) {
  // the Tagus with the 25 de Abril bridge, very far off
  const p = new Painter(W, 60);
  for (let j = 38; j < 60; j++) for (let i = 0; i < W; i++) p.px(i, j, j < 40 ? '#9cc4dc' : (i + j) % 9 === 0 ? '#8fb6d0' : '#6f9fc2');
  for (let i = 0; i < W; i++) for (let j = 34; j < 38; j++) p.px(i, j, '#9fb59a');      // far bank
  const bx = Math.round(W * 0.15), span = Math.round(W * 0.7);
  for (let i = bx - 20; i < bx + span + 20; i++) p.px(i, 33, '#b8402e');               // deck
  for (const tx of [bx, bx + span]) for (let j = 18; j < 34; j++) { p.px(tx, j, '#c8462f'); p.px(tx + 1, j, '#a83a28'); }
  for (let i = 0; i <= span; i++) {
    const sag = 18 + Math.round(13 * (1 - Math.pow((i / span) * 2 - 1, 2)));
    p.px(bx + i, sag, '#c8462f');
    if (i % 6 === 0) for (let j = sag + 1; j < 33; j++) p.px(bx + i, j, '#d47a62');
  }
  return p;
}

export function buildLisbon(W, H = 96) {
  const hx = Math.round(W * 0.34);
  const run = W + V * 2 + 60;                                   // how far the street must extend
  const top = Math.floor(RAIL - SLOPE * (run - hx)) - 70;         // highest row any building reaches
  const LH = H + 20 - top;
  const street = new Painter(run, LH);                           // world strip, row 0 = screen row `top`
  const sy = (x) => RAIL - SLOPE * (x - hx) - top;                // street surface row in the strip
  const r = rng(28);
  for (let bx = -10, n = 0; bx < run; bx += 22, n++) {          // houses climbing the hill
    const base = Math.round(sy(bx + 11)) + 2, h = 34 + Math.floor(r() * 12), col = FACADES[n % FACADES.length];
    const tiled = n % 3 === 1;
    for (let j = base - h; j < base; j++) for (let i = bx; i < bx + 21; i++) {
      const tile = tiled && ((i >> 1) + (j >> 1)) % 2 === 0;
      street.px(i, j, tile ? '#3f6fb5' : (tiled ? '#e8eef6' : col));
    }
    for (let i = bx - 1; i < bx + 22; i++) { street.px(i, base - h - 1, '#c0603e'); street.px(i, base - h - 2, '#a84f32'); }
    for (let fy = base - h + 4; fy < base - 6; fy += 9) for (const fx of [bx + 3, bx + 12]) {
      street.rect(fx, fy, 5, 6, '#2f3646'); street.rect(fx - 1, fy, 1, 6, '#3d7a4a'); street.rect(fx + 5, fy, 1, 6, '#3d7a4a');
      street.rect(fx - 1, fy + 6, 7, 1, '#2a2a2e');                // iron balcony
    }
    if (n % 2 === 0) {                                          // laundry strung between windows
      const ly = base - h + 12;
      for (let i = bx + 2; i < bx + 20; i++) street.px(i, ly, '#5a5a60');
      for (let k = 0; k < 5; k++) street.rect(bx + 3 + k * 3, ly + 1, 2, 3, LAUNDRY[(n + k) % LAUNDRY.length]);
    }
  }
  for (let x = 0; x < run; x++) {                               // cobbles, kerb and the rail
    const s = Math.round(sy(x));
    for (let j = s; j < LH; j++) street.px(x, j, j === s ? '#8a8378' : ((x + j * 3) % 5 === 0 ? '#bdb5a3' : '#d9d3c4'));
    street.px(x, s + 3, '#5a5550'); street.px(x, s + 7, '#5a5550');
  }
  return { W, H, hx, top, layers: { sky: gradient(W, H, [['#6fa9e0', 0], ['#86b9e6', 0.3], ['#a8cdee', 0.6], ['#cfe4f5', 0.9]]), far: bridgeFar(W), street, tram: tramArt() } };
}

export function renderLisbon(ctx, t, s, env) {
  const { W, H, canvases: c } = s;
  const cx = t * V, cy = -SLOPE * t * V;                          // the camera climbs with the tram
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  ctx.drawImage(c.far, 0, Math.round(-cy * 0.15) - 6);
  ctx.drawImage(c.street, -Math.round(cx), Math.round(s.top - cy));
  // the overhead wire, parallel to the street
  ctx.fillStyle = '#2a2a2e';
  for (let x = 0; x < W; x++) ctx.fillRect(x, Math.round(RAIL - 40 - SLOPE * (x - s.hx)), 1, 1);
  // Yimeng at the tram's front window, then the tram body sheared onto the slope
  const tx = s.hx - 8, ty = RAIL - 27;
  const hero = env.hero('travel'), bob = Math.floor(t * 6) % 2;
  ctx.save();
  ctx.beginPath(); ctx.rect(tx + 35, ty - 1 + bob, 6, 8); ctx.clip();         // the fifth window, after the shear
  ctx.fillStyle = '#4a3a30'; ctx.fillRect(tx + 35, ty - 1 + bob, 6, 8);
  ctx.drawImage(hero.canvases[1], tx + 14, ty - 20 + bob);
  ctx.restore();
  for (let i = 0; i < c.tram.width; i++) {
    // leave Yimeng's window open: skip the glass rows of that column
    const winCol = i >= 35 && i <= 40;
    if (winCol) {
      ctx.drawImage(c.tram, i, 0, 1, 6, tx + i, ty - Math.round(SLOPE * i) + bob, 1, 6);
      ctx.drawImage(c.tram, i, 14, 1, c.tram.height - 14, tx + i, ty + 14 - Math.round(SLOPE * i) + bob, 1, c.tram.height - 14);
    } else ctx.drawImage(c.tram, i, 0, 1, c.tram.height, tx + i, ty - Math.round(SLOPE * i) + bob, 1, c.tram.height);
  }
  // trolley pole up to the wire
  ctx.fillStyle = '#2a2a2e';
  for (let k = 0; k < 14; k++) ctx.fillRect(tx + 22 + k, ty - 1 - Math.round(SLOPE * 22) - k + bob, 1, 1);
}

export const lisbon = { build: buildLisbon, render: renderLisbon };
