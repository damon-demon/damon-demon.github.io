// Chapter 4, shot 4: mushrooms under the oaks. Dappled light in a California oak wood, the trunks
// hung with lace lichen, sword ferns along a path through the leaf litter. Yimeng walks in with the
// basket and stops at a cluster of golden chanterelles; the dog, in its little backpack, turns back
// and wags while they hop into the basket one by one, and then the two walk on.
import { Painter, rng } from '../pixels.js';
import { gradient, ridge, tile, art } from '../kit.js';

const V = 26;                                // walk speed, px/s
const GROUND = 88;                           // the row Yimeng's shoes rest on
const STOP = [0.45, 0.75], GO = [1.35, 1.6]; // braking to a stop, then setting off again
export const PICKS = [0.78, 0.94, 1.1];      // when each chanterelle leaves the ground
const HOP = 0.22;                            // and how long it takes to reach the basket

// How far the path has scrolled: walking, braking to a stop, standing, setting off again.
export function runAt(t) {
  const [a, b] = STOP, [c, d] = GO;
  if (t < a) return V * t;
  if (t < b) { const u = t - a; return V * (a + u - (u * u) / (2 * (b - a))); }
  const stopped = V * (a + (b - a) / 2);
  if (t < c) return stopped;
  if (t < d) { const u = t - c; return stopped + V * (u * u) / (2 * (d - c)); }
  return stopped + V * ((d - c) / 2 + t - d);
}
export const walkingAt = (t) => t < STOP[1] || t >= GO[0];

// A coast live oak: a short thick trunk forking into crooked limbs that sprawl out low, under
// clumps of dark leaves, the limbs hung with lace lichen.
function oak(p, x0, r, col) {
  const fork = 46 + Math.floor(r() * 8), lean = (r() - 0.5) * 4;
  for (let y = fork; y < GROUND - 1; y++) {                                       // the trunk, flaring at the foot
    const u = (y - fork) / (GROUND - fork), w = 7 + Math.round(u * u * 4), x = Math.round(x0 + lean * (1 - u) - w / 2);
    for (let i = 0; i < w; i++) p.px(x + i, y, i === 0 ? col.trunk[2] : i === w - 1 ? col.trunk[0] : (i * 3 + (y >> 2)) % 7 === 0 ? col.trunk[2] : (i + y) % 11 === 0 ? col.moss : col.trunk[1]);
  }
  const limbs = [[-1, 0.45, 34 + r() * 14], [1, 0.5, 30 + r() * 14], [-0.25, 1.4, 22 + r() * 8], [0.45, 1.2, 20 + r() * 8]];
  const tips = [];
  for (const [dir, rise, len] of limbs) {                                          // the limbs, thinning as they go
    let x = x0 + lean, y = fork + 2;
    for (let k = 0; k < len; k++) {
      x += dir * (0.9 + Math.sin(k * 0.35 + x0) * 0.35); y -= rise * (0.6 + Math.cos(k * 0.5 + x0) * 0.4);
      const w = Math.max(2, Math.round(5 - (k / len) * 3.5));
      for (let j = 0; j < w; j++) p.px(Math.round(x), Math.round(y) + j, j === 0 ? col.trunk[0] : j === w - 1 ? col.trunk[2] : col.trunk[1]);
      if (k > 6 && k % 7 === 0) for (let h = 1; h < 4 + Math.floor(r() * 6); h++) p.wpx(Math.round(x) + Math.round(Math.sin(h) * 0.5), Math.round(y) + w + h, h % 3 ? '#c4ccac' : '#a8b490');
    }
    tips.push([x, y]);
  }
  for (const [tx, ty] of tips) for (let n = 0; n < 5; n++) {                      // round clumps of leaves at the limb ends
    const cx = tx + (r() - 0.5) * 18, cy = ty - 5 + (r() - 0.5) * 10, rad = 7 + r() * 6;
    for (let j = -rad; j <= rad; j++) for (let i = -rad * 1.15; i <= rad * 1.15; i++) {
      const d = (i * i) / 1.32 + j * j;
      if (d > rad * rad || cy + j < 0) continue;
      const lit = i + j < -rad * 0.6, shade = j > rad * 0.45;
      p.px(Math.round(cx + i), Math.round(cy + j), lit ? ((Math.round(i) * 3 + Math.round(j) * 5) % 4 === 0 ? col.leaf[0] : col.leaf[1]) : shade ? col.leaf[3] : (Math.round(i) * 7 + Math.round(j) * 3) % 9 === 0 ? col.leaf[1] : col.leaf[2]);
    }
  }
}

// A stand of oaks, the canopy closing overhead.
function woods(TW, H, seed, every, col) {
  const p = new Painter(TW, H), r = rng(seed), roof = ridge(TW, 9, [[4, 3, seed], [3, 8, seed * 2], [2, 17, seed * 3]]);
  for (let x0 = 20 + Math.floor(r() * every * 0.5); x0 < TW - 30; x0 += every + Math.floor(r() * every * 0.4)) oak(p, x0, r, col);
  for (let x = 0; x < TW; x++) for (let y = 0; y < roof[x]; y++) {
    const gap = Math.sin(x * 0.23 + y * 0.9 + seed) + Math.sin(x * 0.051 - y * 0.4) > 1.5;
    if (!gap) p.px(x, y, y > roof[x] - 2 ? col.leaf[3] : (x * 3 + y * 5) % 7 === 0 ? col.leaf[1] : col.leaf[2]);
  }
  return p;
}

function ground(TW, H) {
  const p = new Painter(TW, H), r = rng(47);
  for (let y = 80; y < H; y++) for (let x = 0; x < TW; x++) {                      // leaf litter, and the path through it
    const path = y >= 85 && y < 93;
    let c = path ? ((x * 7 + y * 3) % 13 === 0 ? '#a07a52' : '#8c6a46') : (x * 5 + y * 11) % 7 === 0 ? '#b8743a' : (x + y * 3) % 5 === 0 ? '#6a4224' : '#8a5a32';
    if (y === 80) c = '#7a5a34';
    p.px(x, y, c);
  }
  for (let n = 0; n < TW / 40; n++) {                                              // sunflecks on the path
    const cx = Math.floor(r() * TW), cy = 86 + Math.floor(r() * 6), w = 4 + Math.floor(r() * 7);
    for (let i = -w; i <= w; i++) for (let j = -1; j <= 1; j++) if (i * i / (w * w) + j * j < 1) p.px(cx + i, cy + j, (i + j) % 3 ? '#c49a62' : '#d8b070');
  }
  for (let x0 = 4; x0 < TW; x0 += 16 + Math.floor(r() * 22)) {                     // sword ferns along the far edge of the path
    const h = 6 + Math.floor(r() * 6);
    for (const dir of [-1.5, -0.9, -0.35, 0.35, 0.9, 1.5]) for (let k = 0; k < h; k++) {
      const x = Math.round(x0 + dir * k * 0.75), y = 84 - Math.round(k * (1.25 - Math.abs(dir) * 0.38) - (Math.abs(dir) > 1 ? -((k / h) ** 2) * 4 : 0));
      p.wpx(x, y, k % 2 ? '#2e5a2a' : '#3e7034');
    }
  }
  return p;
}

// A golden chanterelle: a wavy funnel of a cap on a pale stem.
const CHANTERELLE = art(`
YYyYY
.YyY.
..w..
`, { Y: '#f2b23a', y: '#c8801e', w: '#f4dca0' }, '#6a3a12');

export function buildForest(W, H = 96) {
  const TW = W * 2, hx = Math.round(W * 0.34);
  const layers = {
    sky: gradient(W, H, [['#5a7a3c', 0], ['#8aa45a', 0.25], ['#d4d68e', 0.5], ['#b4bc78', 0.7], ['#8a9a5e', 0.85]]),
    far: woods(TW, H, 13, 34, { trunk: ['#8a8c62', '#7a7c58', '#6a6c4e'], moss: '#8a9462', leaf: ['#a4b070', '#8ea062', '#7c9058', '#6a7e4c'] }),
    mid: woods(TW, H, 29, 120, { trunk: ['#6a5a48', '#4a3e34', '#2e2620'], moss: '#6a7a3e', leaf: ['#7a9a48', '#5a7a38', '#3e5a2c', '#2c4220'] }),
    ground: ground(TW, H),
  };
  // the cluster sits just in front of Yimeng's feet once the walk has stopped
  return { W, H, TW, hx, cluster: hx + 15 + runAt(STOP[1]), layers };
}

export function renderForest(ctx, t, s, env) {
  const { W, H, canvases: c, hx } = s, run = runAt(t), walking = walkingAt(t);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  tile(ctx, c.far, run * 0.2, 0);
  ctx.globalAlpha = 0.18; ctx.fillStyle = '#fff6c8';                               // shafts of sun through the leaves
  for (let k = 0; k < Math.ceil(W / 90) + 1; k++) {
    const x0 = ((k * 90 - run * 0.3) % (W + 90) + W + 90) % (W + 90) - 60;
    for (let y = 0; y < GROUND; y++) ctx.fillRect(Math.round(x0 + y * 0.45), y, 9, 1);
  }
  ctx.globalAlpha = 1;
  tile(ctx, c.mid, run * 0.5, 0);
  tile(ctx, c.ground, run, 0);
  const hero = env.hero('forage', 'walk'), f = walking ? Math.floor(run / V * 6) % 4 : 1;
  const [bx, by] = hero.hands[f], x = hx - hero.anchorX, y = GROUND - hero.footY;
  const picked = PICKS.filter(p => t >= p + HOP).length;
  const cap = env.art(CHANTERELLE);
  PICKS.forEach((p, i) => {                                                         // the chanterelles: on the ground, then hopping into the basket
    const gx = Math.round(s.cluster - run) + i * 6 - 6, gy = GROUND - cap.height + 1 + (i % 2);
    if (t < p) {
      ctx.drawImage(cap, gx, gy);
      if (!walking && t > p - 0.15) { ctx.fillStyle = '#fff6c8'; ctx.fillRect(gx + 2, gy - 3, 1, 2); ctx.fillRect(gx + 1, gy - 2, 3, 1); }   // a glint: this one next
    } else if (t < p + HOP) {
      const u = (t - p) / HOP, tx = x + bx - 3 + i * 2, ty = y + by - 2;
      ctx.drawImage(cap, Math.round(gx + (tx - gx) * u), Math.round(gy + (ty - gy) * u - Math.sin(u * Math.PI) * 12));
    }
  });
  ctx.drawImage(hero.canvases[f], x, y);
  for (let i = 0; i < picked; i++) ctx.drawImage(cap, x + bx - 4 + i * 2, y + by - 1 - (i === 1 ? 1 : 0));   // piling up in the basket
  const dog = env.dog('hikepack', walking ? 'trot' : 'wait'), dx = hx + 26;
  if (walking) ctx.drawImage(dog.canvases[Math.floor(t * 9) % 4], dx - dog.anchorX, GROUND - dog.footY);
  else {                                                                            // turned back to watch, wagging
    ctx.save(); ctx.translate(2 * dx + 24, 0); ctx.scale(-1, 1);
    ctx.drawImage(dog.canvases[Math.floor(t * 6) % 2], dx, GROUND - dog.footY);
    ctx.restore();
  }
}

export const forest = { build: buildForest, render: renderForest };
