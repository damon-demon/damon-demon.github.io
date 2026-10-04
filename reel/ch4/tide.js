// Chapter 4, shot 6: low tide. The sea far out, wet sand shining with the late sky, low rocks hung with
// weed and mussels. Yimeng, in bib waders and boots, stands by a tide pool of anemones and a sea star;
// a purple sea urchin hops into the bucket. Then sand spurts from a burrow in the flat, a fat pink
// innkeeper worm pops out, and the dog, in its life vest, jumps back. The worm goes in the bucket too.
import { Painter, rng } from '../pixels.js';
import { gradient, ridge, art } from '../kit.js';

const GROUND = 88;                           // the row Yimeng's shoes rest on
const HORIZON = 44, FLAT = 58;               // the horizon; where the shining flat begins
export const URCHIN = 0.3, DIG = [0.7, 1.15], WORM = 1.2, BAG = 1.6;
const HOP = 0.25;

// What the burrow is doing at t: nothing yet, spurting sand, the worm out, then the worm gone.
export function burrowAt(t) {
  if (t < DIG[0]) return 'still';
  if (t < DIG[1]) return 'digging';
  return t < BAG ? 'worm' : 'gone';
}

const URCHIN_ART = art(`
.u.u.
uUUUu
.UuU.
uUUUu
.u.u.
`, { U: '#7a4a9e', u: '#4a2a66' }, '#24122e');
const WORM_ART = [`
.pppppppp.
pPPPPPPPPp
pPwPPPPPPp
.pppppppp.
`, `
..pppppp..
.pPPPPPPp.
pPwPPPPPPPp
.ppp..pppp.
`].map(rows => art(rows.split('\n').map(r => r.padEnd(11, '.')).join('\n'), { P: '#f2a2aa', p: '#d07080', w: '#fbd8dc' }, '#7a2a3a'));
const STAR = art(`
..o..
ooooo
.ooo.
o...o
`, { o: '#e8702a' }, '#6a2a10');
const BANG = art(`
#
#
#
.
#
`, { '#': '#ffd75e' }, '#5a3a10');

function shore(W, H, hx) {
  const p = new Painter(W, H), r = rng(37);
  const sky = gradient(W, H, [['#6a9ad0', 0], ['#9ab8d8', 0.2], ['#f0d8a8', 0.42], ['#5e86a8', 0.46], ['#7aa0b8', 0.56], ['#9a8a62', 0.6], ['#8a7a56', 0.8], ['#7a6a4a', 1]]);
  p.data.set(sky.data);
  for (let y = HORIZON + 2; y < FLAT; y += 3) for (let x = (y * 7) % 11; x < W; x += 9 + (y % 5)) p.px(x, y, '#d4e0e4');   // surf far out
  for (let y = FLAT; y < H; y++) for (let x = 0; x < W; x++) {                      // the wet flat, shining gold where it holds water
    const sheen = Math.sin(x * 0.05 + y * 0.9) + Math.sin(x * 0.013 - y * 0.2) > 1.1;
    if (sheen) p.px(x, y, y < 68 ? '#f0d8a8' : (x + y) % 2 ? '#c8b088' : '#d8c098');
    else if ((x * 3 + y * 7) % 19 === 0) p.px(x, y, '#6a5a3e');
  }
  const top = ridge(W, 0, [[2, 3, 0.7], [1.5, 9, 2.1]]);
  const rockAt = (x0, w, t0, x) => t0 + Math.round(top[x] + ((x - x0) / w - 0.5) ** 2 * 4 * 10);
  for (const [x0, w, t0] of [[-8, Math.round(W * 0.3), 70], [Math.round(W * 0.78), 70, 78], [Math.round(W * 0.6), 18, 84]]) {   // rocks, weed on top, mussels below
    for (let x = Math.max(0, x0); x < Math.min(W, x0 + w); x++) {
      const tt = rockAt(x0, w, t0, x);
      for (let y = tt; y < H; y++) {
        const d = y - tt, v = r();
        p.px(x, y, d === 0 ? '#6e6e70' : d < 3 && v < 0.6 ? (v < 0.3 ? '#5e7a32' : '#7a8a3a') : y > 88 && v < 0.4 ? '#1e2430' : (x * 5 + y) % 7 === 0 ? '#2e2e34' : '#44444a');
      }
    }
  }
  for (let n = 0; n < W / 30; n++) {                                               // strands of kelp left on the sand
    const x0 = Math.floor(r() * W), y0 = FLAT + 8 + Math.floor(r() * 24);
    for (let k = 0; k < 10; k++) p.px(x0 + k, y0 + Math.round(Math.sin(k * 0.9 + x0) * 1.2), k % 3 ? '#5a4a22' : '#7a6a2a');
  }
  const px0 = hx + 22, pw = 24;                                                    // the tide pool: a rim of rock round still water
  for (let j = -4; j <= 4; j++) for (let i = -pw / 2 - 3; i <= pw / 2 + 3; i++) {
    const d = (i * i) / ((pw / 2 + 3) ** 2) + (j * j) / 16;
    if (d > 1) continue;
    const inner = (i * i) / ((pw / 2) ** 2) + ((j + 1) * (j + 1)) / 6 < 1;
    p.px(px0 + pw / 2 + i, GROUND - 1 + j, inner ? (j < 0 ? '#9ac8d4' : '#5a9aa8') : (i + j) % 3 ? '#4a4a50' : '#5a5a60');
  }
  for (const [ax, col] of [[4, '#4ab070'], [9, '#e870a0'], [18, '#4ab070']]) {      // anemones round its edge
    p.px(px0 + ax, GROUND - 2, col); p.px(px0 + ax + 1, GROUND - 2, col); p.px(px0 + ax, GROUND - 3, col);
  }
  for (let n = 0; n < W / 14; n++) {                                               // ripples and shells in the sand
    const x = Math.floor(r() * W), y = FLAT + 6 + Math.floor(r() * (H - FLAT - 8));
    p.px(x, y, '#e8e0cc'); p.px(x + 1, y, '#8a7a5a');
  }
  return p;
}

export function buildTide(W, H = 96) {
  const hx = Math.round(W * 0.34);
  return { W, H, hx, pool: hx + 22, burrow: hx + 52, layers: { shore: shore(W, H, hx) } };
}

export function renderTide(ctx, t, s, env) {
  const { W, H, canvases: c, hx, pool, burrow } = s, state = burrowAt(t);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.shore, 0, 0);
  ctx.drawImage(env.art(STAR), pool + 13, GROUND - 4);
  const hero = env.hero('tide', 'walk'), x = hx - hero.anchorX, y = GROUND - hero.footY, [bx, by] = hero.hands[1];
  const bucket = [x + bx, y + by + 1];                                            // the top of the bucket
  const hop = (from, u) => [Math.round(from[0] + (bucket[0] - from[0]) * u), Math.round(from[1] + (bucket[1] - 4 - from[1]) * u - Math.sin(u * Math.PI) * 12)];
  if (t < URCHIN) ctx.drawImage(env.art(URCHIN_ART), pool + 6, GROUND - 5);       // the urchin, in the pool, then into the bucket
  else if (t < URCHIN + HOP) { const [ux, uy] = hop([pool + 6, GROUND - 5], (t - URCHIN) / HOP); ctx.drawImage(env.art(URCHIN_ART), ux, uy); }
  ctx.fillStyle = '#5a4a32'; ctx.fillRect(burrow, GROUND - 1, 3, 1);              // the burrow's mouth
  if (state === 'digging') {                                                       // wet sand spurting out of it
    for (let k = 0; k < 10; k++) {
      const u = ((t - DIG[0]) * 3 + k / 10) % 1, dir = k % 2 ? 1 : -1;
      ctx.fillStyle = k % 3 ? '#4a3a26' : '#6a5436';
      ctx.fillRect(Math.round(burrow + 1 + dir * u * (6 + k)), Math.round(GROUND - 2 - Math.sin(u * Math.PI) * (8 + k % 4)), 2, 2);
    }
  }
  if (state === 'worm') {
    const u = Math.min(1, (t - WORM) / 0.12), wx = burrow - 3, wy = GROUND - 4 - Math.round(u * 4);
    if (t < BAG - HOP) ctx.drawImage(env.art(WORM_ART[Math.floor(t * 10) % 2]), wx, wy);   // out, and wriggling
    else { const [qx, qy] = hop([wx, wy], (t - (BAG - HOP)) / HOP); ctx.drawImage(env.art(WORM_ART[0]), qx, qy); }
  }
  ctx.drawImage(hero.canvases[1], x, y);
  const dog = env.dog('lifevest', 'wait'), startled = state === 'worm' && t < WORM + 0.35;
  const back = state === 'worm' || state === 'gone' ? Math.min(6, Math.round((t - WORM) * 40)) : 0, jump = startled ? Math.round(Math.sin((t - WORM) / 0.35 * Math.PI) * 5) : 0;
  const dx = burrow + 10 + back;                                                   // the dog, facing the burrow
  ctx.save(); ctx.translate(2 * dx + 24, 0); ctx.scale(-1, 1);
  ctx.drawImage(dog.canvases[Math.floor(t * 6) % 2], dx, GROUND - dog.footY - jump);
  ctx.restore();
  if (startled) ctx.drawImage(env.art(BANG), dx + 6, GROUND - dog.footY - jump - 9);
}

export const tide = { build: buildTide, render: renderTide };
