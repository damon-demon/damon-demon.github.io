// Chapter 4, shot 8: freediving. Yimeng, in the kelp-camo wetsuit and long fins, breathes at the
// surface, then dives down through the kelp to the reef, the speargun out in front. A California
// sheephead noses along the rocks ahead; Yimeng levels off, aims and fires, and the scene cuts while
// the spear is still on its way.
import { gradient, art } from '../kit.js';
import { WATER, kelp, reef, rays, surface } from './sea.js';

const SURF = 10;                             // the surface's row
export const DIVE = [0.25, 0.85], FIRE = 1.25;
const SPEAR = 260;                           // the spear's speed, px/s
const GUN = 22;                              // the gun's length from the hand

// Where Yimeng is: the feet's column and the centre line, at the surface, diving, then level.
export function diverAt(s, t) {
  const u = Math.min(1, Math.max(0, (t - DIVE[0]) / (DIVE[1] - DIVE[0]))), e = u * u * (3 - 2 * u);
  const level = Math.max(0, t - DIVE[1]) * 8;
  return { x: Math.round(s.x0 + (s.x1 - s.x0) * e + level), y: Math.round(SURF + 3 + (62 - SURF - 3) * e + (t < DIVE[0] ? Math.sin(t * 6) : 0)) };
}

// How far the spear has flown (0 until Yimeng fires), where its tip is for a swimmer sprite, and
// where the sheephead is.
export const spearAt = (t) => (t < FIRE ? 0 : (t - FIRE) * SPEAR);
export const tipAt = (s, t, hero) => diverAt(s, t).x - hero.anchorX + hero.hands[0][0] + 18 + 3 + GUN + spearAt(t);
export const sheepheadAt = (s, t) => Math.round(s.fishX - t * 10);

// A California sheephead, facing left: black head with a white chin, the red-pink middle, a black tail.
// The sunset shot holds it up on the spear.
export const SHEEPHEAD = [`
.......kkkkkk........
....kkkkkrrrrrrr...kk
..kkKkkkrrrrrrrrrkkk.
.kkkkkkrrrrrrrrrrkkk.
wwkkkkkrrrrrrrrrrkkkk
.wwwkkkrrrrrrrrrr..kk
...wwwkkrrrrrrr......
`, `
.......kkkkkk........
....kkkkkrrrrrrr.....
..kkKkkkrrrrrrrrrkkkk
.kkkkkkrrrrrrrrrrkkk.
wwkkkkkrrrrrrrrrrkkk.
.wwwkkkrrrrrrrrrrkkkk
...wwwkkrrrrrrr......
`].map(rows => art(rows, { k: '#1e1a1e', K: '#f0e8d8', r: '#e05a72', w: '#f4f1ea' }, '#0e0a0e'));

export function buildFreedive(W, H = 96) {
  // on a phone Yimeng keeps to the left and the fish to the right edge, so the cut still comes first
  const x1 = Math.min(Math.round(W * 0.28), W - 170), x0 = Math.round(x1 * 0.57);
  const water = gradient(W, H, [['#bfe6f2', 0], ['#9ad0e8', 0.09], ...WATER.map(([c, v]) => [c, 0.11 + v * 0.89])]);
  return {
    W, H, x0, x1, fishX: Math.min(W - 21, Math.max(Math.round(W * 0.62), x1 + 150)),
    layers: { water, far: kelp(W, H, 23, 26, ['#3e7a6a', '#346a5e', '#4a8a72']), mid: kelp(W, H, 41, 70, ['#9a7a2a', '#7a5e22', '#c8a03a']), reef: reef(W, H) },
  };
}

export function renderFreedive(ctx, t, s, env) {
  const { W, H, canvases: c } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.water, 0, 0);
  rays(ctx, W, t * 4);
  ctx.drawImage(c.far, 0, 0);
  surface(ctx, W, t, SURF);
  ctx.drawImage(c.mid, 0, 0);
  ctx.drawImage(c.reef, 0, 0);
  ctx.drawImage(env.art(SHEEPHEAD[Math.floor(t * 5) % 2]), sheepheadAt(s, t), Math.round(64 + Math.sin(t * 3) * 1.5));   // the sheephead, nosing along
  const hero = env.hero('freedive', 'swim'), { x: dx, y: dy } = diverAt(s, t), f = Math.floor(t * 7) % 4;
  const x = dx - hero.anchorX, y = dy - hero.footY, [sx, sy] = hero.hands[f];
  if (t > DIVE[0] && t < DIVE[0] + 0.3) {                                          // the splash of the duck dive
    ctx.fillStyle = '#f4fbff';
    for (let k = 0; k < 8; k++) ctx.fillRect(Math.round(s.x0 + 20 + k * 3 - 6), SURF - 1 - ((k * 5) % 3) - Math.round((t - DIVE[0]) * 10), 1, 1);
  }
  ctx.drawImage(hero.canvases[f], x, y);
  const hx = x + sx + 18, hy = y + sy + 1;                                         // the arm out in front, under the chin, the gun in hand
  ctx.fillStyle = '#2a3326'; ctx.fillRect(x + sx, y + sy, 19, 3);
  ctx.fillStyle = '#3e4a36'; ctx.fillRect(x + sx, y + sy, 18, 2);
  ctx.fillStyle = '#2a2a30'; ctx.fillRect(hx - 2, hy, 9, 2); ctx.fillRect(hx + 7, hy, GUN - 7, 1);
  const flown = spearAt(t);
  ctx.fillStyle = '#c8ccd2'; ctx.fillRect(Math.round(hx + 2 + flown), hy - 1, GUN + 1, 1);   // the spear, then on its way
  ctx.fillStyle = '#e8eef2'; ctx.fillRect(Math.round(hx + 3 + GUN + flown), hy - 1, 2, 1);
  if (t >= FIRE) {
    ctx.fillStyle = '#e8fbff';
    for (let k = 0; k < 10; k++) { const bx = hx + GUN + k * flown / 10; ctx.fillRect(Math.round(bx), hy - 2 - (k % 3) - Math.round((t - FIRE) * 12 * (1 - k / 10)), 1, 1); }
    ctx.fillStyle = '#8a8e96'; ctx.fillRect(hx + GUN, hy, Math.round(flown), 1);   // the shooting line paying out
  }
}

export const freedive = { build: buildFreedive, render: renderFreedive };
