// Chapter 2, shot 5: the class of 2019 on the Low Steps in spring. Everyone hops and throws their
// caps; a puppy trots along College Walk, and the cap Yimeng threw comes down on its head. From here
// on the dog walks along. Then the falling caps turn into snowflakes, and the snow takes over.
import { rng } from '../pixels.js';
import { art } from '../kit.js';
import { buildSet, drawAlmaMater, WALK } from './columbia.js';

const TOSS = 0.55;                             // everyone throws their caps
const G = 230;                                 // gravity for the caps, px/s^2
const DOG_STOP = 1.45, LAND = 1.85;            // the puppy trots in; Yimeng's cap comes down on it
const SNOW = [1.6, 2.8];                       // the caps turn to snow, which thickens towards white

// A graduate seen from the front, in the Columbia-blue gown; the cap is drawn on its own.
function graduate(hair, skin) {
  return art(`
..HHHHH..
.HHHHHHH.
HHHHHHHHH
HSSSSSSSH
HSESSSESH
HSSSSSSSH
.SSSSSSS.
..SSSSS..
...SSS...
.BBBBBBB.
BBBBBBBBB
BBBBBBBBB
SBBBBBBBS
.BBBBBBB.
.BBBBBBB.
.bbbbbbb.
..K...K..
`, { H: hair, S: skin, E: '#241c22', B: '#9cc7ea', b: '#6f9fca', K: '#1a1416' }, '#2a1f2d');
}
// The mortarboard as it spins: square on, tilted, seen from above.
const CAP_PALETTE = { J: '#9cc7ea', j: '#6f9fca', V: '#f4f1ea' };
const CAPS = [
  art(`
.JJJJJJJJJ.
JJJJJJJJJJJ
..jjjjjjjV.
...jjjjj.V.
`, CAP_PALETTE, '#2a1f2d'),
  art(`
JJJ......
.JJJJJ...
..JJJJJJ.
...jjjjJJ
....jjj.V
`, CAP_PALETTE, '#2a1f2d'),
  art(`
...JJJ...
.JJJJJJJ.
JJJJVJJJJ
.JJJJJJJ.
...JJJ...
`, CAP_PALETTE, '#2a1f2d'),
];
const HEART = art(`
.##.##.
#######
.#####.
..###..
...#...
`, { '#': '#e8607a' }, '#7a1e30');

const HAIR = ['#1e1a1e', '#3a2a20', '#6a4a30', '#c8a050', '#7a3a22', '#2a2026'];
const SKIN = ['#f4cfae', '#e0a985', '#c98d6e', '#8d5a3e', '#f0c8a4'];

export function buildGraduation(W, H = 96) {
  const { set, cx } = buildSet(W, H, 'spring'), hx = Math.round(W * 0.34), r = rng(2019);
  const crowd = [];
  for (const [feet, gap, skip, off] of [[77, 24, 18, 6], [86, 20, 13, 0]]) {     // two rows on the Low Steps
    for (let x = cx - 112 + off; x < cx + 104; x += gap + Math.floor(r() * 5)) {
      if (x < -4 || x > W - 6) continue;
      if (Math.abs(x + 4 - cx) < skip) continue;                                  // keep Alma Mater in view
      if (feet === 86 && x > hx - 12 && x < hx + 46) continue;                    // room for Yimeng and the puppy
      const fig = graduate(HAIR[Math.floor(r() * HAIR.length)], SKIN[Math.floor(r() * SKIN.length)]);
      crowd.push({ x, y: feet - fig.h + 1, fig, delay: r() * 0.08, vy: -(165 + r() * 45), vx: (r() - 0.5) * 50, morph: SNOW[0] + 0.1 + r() * 0.6, spin: r() * 3 });
    }
  }
  const flakes = [];
  for (let n = 0; n < Math.round(W / 5); n++) flakes.push({ x: r() * W, y: r() * (H + 8), v: 14 + r() * 12, sway: 1 + r() * 2.5, ph: r() * 6, big: r() < 0.3, k: r() });
  return { W, H, cx, hx, crowd, flakes, dogStop: hx + 24, layers: { set } };
}

// Where Yimeng's cap is at time t: thrown from Yimeng's head at the toss, it arcs over and lands on
// the puppy's head (dogFootY: the puppy sprite's foot row). Null while it is still being worn.
export function capPath(s, t, dogFootY) {
  if (t < TOSS) return null;
  const x0 = s.hx + 6, y0 = WALK - 36, x1 = s.dogStop + 4, y1 = WALK - dogFootY - 2;
  const T = LAND - TOSS, u = Math.min(t - TOSS, T), vy = (y1 - y0 - 0.5 * G * T * T) / T;
  return { x: Math.round(x0 + (x1 - x0) * (u / T)), y: Math.round(y0 + vy * u + 0.5 * G * u * u), landed: t >= LAND };
}

function flake(ctx, x, y, big) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  if (big) { ctx.fillRect(Math.round(x) - 1, Math.round(y), 3, 1); ctx.fillRect(Math.round(x), Math.round(y) - 1, 1, 3); }
}

// Everyone crouches just before the toss and springs up 3px with it.
const hop = (t, delay) => {
  const u = t - TOSS - delay;
  return u < -0.12 ? 0 : u < 0 ? 1 : u < 0.3 ? -Math.round(Math.sin((u / 0.3) * Math.PI) * 3) : 0;
};

export function renderGraduation(ctx, t, s, env) {
  const { W, H, canvases: c, hx } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.set, 0, 0);
  drawAlmaMater(ctx, env, s.cx);
  // the class on the steps: hop, throw, and watch the caps go
  for (const g of s.crowd) {
    const dy = hop(t, g.delay);
    ctx.drawImage(env.art(g.fig), g.x, g.y + dy);
    const u = t - TOSS - g.delay;
    if (u < 0) { ctx.drawImage(env.art(CAPS[0]), g.x - 1, g.y - 3 + dy); continue; }
    const m = g.morph - TOSS - g.delay, k = Math.min(u, m);
    const x = g.x - 1 + g.vx * k, y = g.y - 3 + g.vy * k + 0.5 * G * k * k;
    if (u < m) ctx.drawImage(env.art(CAPS[Math.floor(u * 10 + g.spin) % 3]), Math.round(x), Math.round(y));
    else flake(ctx, x + 5 + Math.sin(t * 2 + g.spin) * 2, y + (u - m) * 16, true);   // a cap no more: a snowflake
  }
  // Yimeng in the gown: cap on, then thrown, bouncing bareheaded
  const hero = t < TOSS ? env.hero('columbia') : env.hero('columbia', 'cheer');
  const frame = t < TOSS ? 1 : Math.floor((t - TOSS) * 4) % 2;
  ctx.drawImage(hero.canvases[frame], hx - hero.anchorX, WALK - hero.footY + hop(t, 0));
  // the puppy trots in along College Walk and stops by Yimeng; it ducks as the cap lands
  const dog = env.dog('pup'), dx = s.dogStop - Math.max(0, DOG_STOP - t) * 60;
  const bump = t >= LAND && t < LAND + 0.12 ? 1 : 0;
  ctx.drawImage(dog.canvases[t < DOG_STOP ? Math.floor(t * 9) % 4 : 0], Math.round(dx), WALK - dog.footY + bump);
  const cap = capPath(s, t, dog.footY);
  if (cap) ctx.drawImage(env.art(CAPS[cap.landed ? 0 : Math.floor((t - TOSS) * 10) % 3]), cap.x, cap.y + bump);
  if (t > LAND + 0.1) {                                                           // a heart: this is the dog
    const u = (t - LAND - 0.1) / 0.8;
    if (u < 1) { ctx.globalAlpha = 1 - u * u; ctx.drawImage(env.art(HEART), hx + 22, Math.round(64 - u * 12)); ctx.globalAlpha = 1; }
  }
  // the snow takes over: more and more flakes, and the scene whitens
  if (t > SNOW[0]) {
    const u = Math.min(1, (t - SNOW[0]) / (SNOW[1] - SNOW[0]));
    for (const f of s.flakes) {
      if (f.k > u * 1.2) continue;
      const y = ((f.y + (t - SNOW[0]) * f.v) % (H + 8)) - 4;
      flake(ctx, f.x + Math.sin(t * 2 + f.ph) * f.sway, y, f.big);
    }
    ctx.globalAlpha = 0.85 * u * u; ctx.fillStyle = '#dfe6ee'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;   // into Michigan's white
  }
}

export const graduation = { build: buildGraduation, render: renderGraduation };
