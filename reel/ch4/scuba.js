// Chapter 4, shot 7: scuba in a kelp forest. Golden kelp rises from the reef to the bright surface,
// light slanting down between the stalks. Yimeng swims through it in the black wetsuit, the tank on
// the back, bubbles going up; a school of blacksmith drifts by and a garibaldi, bright orange,
// turns away over the urchins on the reef.
import { rng } from '../pixels.js';
import { gradient, tile, art } from '../kit.js';
import { WATER, kelp, reef, rays, surface } from './sea.js';

const V = 30;                                // the swim, px/s at the reef
const MID = 46;                              // Yimeng's centre line

const GARIBALDI = art(`
..ooo....
.oooooo.o
oKoooooOo
.oooooo.o
..ooo....
`, { o: '#ff7a1a', O: '#ffb060', K: '#1a1214' }, '#7a2a08');
const BLACKSMITH = art(`
.bb.b
bKbbb
.ss.b
`, { b: '#3a4a6a', s: '#8a9ab0', K: '#0a0a12' }, null);

export function buildScuba(W, H = 96) {
  const TW = W * 2, rd = rng(83);
  const school = Array.from({ length: 14 }, () => [rd() * 40, rd() * 18, rd() * 6]);
  return {
    W, H, TW, hx: Math.round(W * 0.3), school,
    layers: {
      water: gradient(W, H, WATER),
      far: kelp(TW, H, 5, 24, ['#3e7a6a', '#346a5e', '#4a8a72']),
      mid: kelp(TW, H, 9, 46, ['#9a7a2a', '#7a5e22', '#c8a03a']),
      reef: reef(TW, H),
      near: kelp(TW, H, 17, 150, ['#b8902e', '#8a6a22', '#e0b84a']),
    },
  };
}

export function renderScuba(ctx, t, s, env) {
  const { W, H, canvases: c, hx } = s, run = t * V;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.water, 0, 0);
  rays(ctx, W, run * 0.2);
  surface(ctx, W, t);
  tile(ctx, c.far, run * 0.3, 0);
  s.school.forEach(([fx, fy, ph], i) => {                                          // the blacksmith, drifting together
    const x = ((W * 0.75 + fx - run * 0.45 - t * 6) % (W + 60) + W + 60) % (W + 60) - 30, y = 24 + fy + Math.sin(t * 2 + ph) * 1.5;
    ctx.drawImage(env.art(BLACKSMITH), Math.round(x), Math.round(y));
  });
  tile(ctx, c.mid, run * 0.6, 0);
  tile(ctx, c.reef, run, 0);
  const gx = Math.round(W * 0.85 - t * 40 - run * 0.2), gy = Math.round(72 + Math.sin(t * 4) * 2);   // the garibaldi, heading off the other way
  ctx.drawImage(env.art(GARIBALDI), gx, gy);
  const hero = env.hero('scuba', 'swim'), f = Math.floor(t * 8) % 4, bob = Math.round(Math.sin(t * 2.5) * 1.5);
  const x = hx - hero.anchorX, y = MID + bob - hero.footY;
  ctx.drawImage(hero.canvases[f], x, y);
  ctx.fillStyle = '#e8fbff';                                                       // bubbles from the regulator, in breaths
  for (let k = 0; k < 9; k++) {
    const age = (t * 1.6 + k / 9) % 1, bx = x + hero.width - 4 + Math.round(Math.sin(age * 9 + k) * 1.5 - age * 6), by = Math.round(y + 20 - age * 40);
    if ((k % 3) !== 2 || age > 0.3) ctx.fillRect(bx, by, k % 2 + 1, k % 2 + 1);
  }
  tile(ctx, c.near, run * 1.25, 0);
}

export const scuba = { build: buildScuba, render: renderScuba };
