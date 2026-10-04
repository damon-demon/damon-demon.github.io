// Chapter 5: to be continued. The sunset boardwalk of the beach scene, and ahead of Yimeng the world
// turns into an unfinished pencil sketch. The frontier comes along the boardwalk, and Yimeng, in the
// California hoodie, and the dog, in its houndstooth, walk into it and are drawn in pencil too.
// Further on, the lines thin out to blank paper.
import { Painter } from '../pixels.js';
import { tile } from '../kit.js';
import { buildBeach } from '../beach.js';

const SPEED = 26;                            // the walk, px/s at the boardwalk, as on the beach
const AHEAD = 75;                            // how far ahead of Yimeng the sketch starts
const BLANK = [60, 150];                     // past the frontier: where the lines start to thin, and where the paper is blank
const PAPER = '#f2efe8';
const LAYERS = [['clouds', 0.06], ['head', 0.12], ['ocean', 0.25], ['beach', 0.5], ['walk', 1]];

// A layer redrawn in pencil: a graphite line wherever the tone changes or a shape ends, hatching in
// the darkest parts, paper everywhere else. Tones are averaged over 3 x 3 first, so dithering draws
// no lines. Empty pixels stay empty; columns wrap, so tiling layers still tile.
export function pencilLayer(src) {
  const { w, h, data } = src, p = new Painter(w, h), L = new Float32Array(w * h), S = new Float32Array(w * h);
  for (let k = 0; k < w * h; k++) L[k] = data[k * 4 + 3] ? 0.3 * data[k * 4] + 0.59 * data[k * 4 + 1] + 0.11 * data[k * 4 + 2] : -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let sum = 0, n = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const yy = y + j, v = yy < 0 || yy >= h ? -1 : L[yy * w + ((x + i + w) % w)];
      if (v >= 0) { sum += v; n++; }
    }
    S[y * w + x] = L[y * w + x] < 0 ? -1 : sum / n;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = y * w + x, l = S[k];
    if (l < 0) continue;
    const right = S[y * w + ((x + 1) % w)], down = y + 1 < h ? S[k + w] : l, up = y > 0 ? S[k - w] : l, left = S[y * w + ((x - 1 + w) % w)];
    const e = Math.abs(l - Math.max(0, right)) + Math.abs(l - Math.max(0, down)) + (Math.min(right, down, up, left) < 0 ? 40 : 0);
    const v = e > 16 ? Math.max(72, 150 - e * 1.5) : l < 75 && (x + y) % 4 === 0 ? 176 : 242;
    const o = k * 4;
    p.data[o] = v; p.data[o + 1] = v - 3; p.data[o + 2] = v - 10; p.data[o + 3] = 255;
  }
  return p;
}

// Where the frontier is on screen at t, in row y: coming along with the boardwalk, and ragged.
export const frontierAt = (s, t, y) => Math.round(s.hx + AHEAD - t * SPEED + Math.sin(y * 0.7) * 2 + Math.sin(y * 0.23 + 1) * 3);

export function buildSketch(W, H = 96) {
  const b = buildBeach(W, H), layers = { ...b.layers };
  for (const [k, p] of Object.entries(b.layers)) layers[`pencil_${k}`] = pencilLayer(p);
  return { ...b, hx: Math.round(W * 0.34), layers };
}

// The world, either in colour (prefix '') or in pencil ('pencil_'), clipped to [from, to) in each row.
function world(ctx, t, s, env, prefix, tone, from, to) {
  const { W, H, canvases: c, hx } = s;
  ctx.save(); ctx.beginPath();
  for (let y = 0; y < H; y++) { const a = Math.max(0, from(y)), b = Math.min(W, to(y)); if (b > a) ctx.rect(a, y, b - a, 1); }
  ctx.clip();
  ctx.drawImage(c[prefix + 'sky'], 0, 0);
  for (const [k, par] of LAYERS) tile(ctx, c[prefix + k], t * SPEED * par, k === 'ocean' ? s.horizon + 1 : 0);
  tile(ctx, c[prefix + 'fg'], t * SPEED * 1.3, 0);
  if (!prefix) {
    const tick = Math.floor(t * 6);                                               // the sun's glitter, in colour only
    s.glitter.forEach(([x, y, r], n) => { if (((n * 7 + tick) % 5) < 2) { ctx.fillStyle = r > 0.6 ? '#fff4c8' : '#ffd27e'; ctx.fillRect(Math.round(x), y, r > 0.8 ? 2 : 1, 1); } });
  } else {
    const edge = from(0);                                                          // the lines thinning out to blank paper
    ctx.fillStyle = PAPER;
    for (let x = Math.max(0, edge + BLANK[0]); x < W; x += 2) {
      ctx.globalAlpha = Math.min(1, (x - edge - BLANK[0]) / (BLANK[1] - BLANK[0])); ctx.fillRect(x, 0, 2, H);
    }
    ctx.globalAlpha = 1;
  }
  const hero = env.hero('work', 'walk', tone), dog = env.dog('houndstooth', 'trot', tone);
  ctx.drawImage(hero.canvases[Math.floor(t * 6) % 4], hx - hero.anchorX, s.feet - hero.footY);
  ctx.drawImage(dog.canvases[Math.floor(t * 9) % 4], hx + 28 - dog.anchorX, s.feet - dog.footY);
  ctx.restore();
}

export function renderSketch(ctx, t, s, env) {
  const { W, H } = s, edge = (y) => frontierAt(s, t, y);
  ctx.clearRect(0, 0, W, H);
  world(ctx, t, s, env, '', 'full', () => 0, edge);
  world(ctx, t, s, env, 'pencil_', 'sketch', edge, () => W);
  ctx.fillStyle = '#5a5650';                                                       // the frontier: a ragged pencil stroke
  for (let y = 0; y < H; y++) if ((y * 7) % 11 < 8) ctx.fillRect(edge(y), y, 1, 1);
}

export const sketch = { build: buildSketch, render: renderSketch };
