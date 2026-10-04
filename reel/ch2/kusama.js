// Chapter 2, shot 7: Yayoi Kusama's Infinity Mirror Room. In the dark the lights come on: lamps hang
// on strings at every depth, glowing and slowly changing colour, doubled in the black pool on the
// floor. Yimeng stands among them on the walkway.
import { Painter, rng } from '../pixels.js';

const FLOOR = 88;                            // the walkway's row, where Yimeng's shoes rest
const POOL = 72;                             // the mirror pool's surface row
const COLOURS = ['#ff5a8a', '#ffd23a', '#4ad2ff', '#7cff6a', '#ffffff', '#c47aff'];

// How far the lights have come up: 0 in the dark, 1 from 0.3 s on.
export const lightsOn = (t) => Math.min(1, Math.max(0, t / 0.3));

export function buildKusama(W, H = 96) {
  const r = rng(1929), lamps = [];
  for (let n = 0; n < Math.round(W * 0.75); n++) {                                  // lamps on strings at every depth
    const z = 1 + Math.pow(r(), 0.6) * 4;
    lamps.push({ x: Math.floor(r() * W), y: 4 + Math.floor(r() * (POOL - 6)), size: z < 1.7 ? 3 : z < 3 ? 2 : 1, glow: Math.min(1, 1.5 / z), c: Math.floor(r() * COLOURS.length), ph: r() * 6 });
  }
  const room = new Painter(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) room.px(x, y, y >= FLOOR ? (y === FLOOR ? '#1c1c26' : '#101018') : '#050508');
  for (const l of lamps) if (l.size === 3) for (let y = 0; y < l.y; y++) room.px(l.x + 1, y, '#121219');   // the near lamps' strings
  return { W, H, hx: Math.round(W * 0.34), lamps, layers: { room } };
}

function lamp(ctx, l, t, on, y = l.y, fade = 1) {
  const a = l.glow * on * fade * (0.65 + 0.35 * Math.sin(t * 3 + l.ph));
  if (a <= 0.02) return;
  ctx.fillStyle = COLOURS[(l.c + Math.floor(t * 1.5 + l.ph)) % COLOURS.length];
  if (l.size === 3) { ctx.globalAlpha = Math.min(1, a) * 0.3; ctx.fillRect(l.x - 1, y - 1, 5, 5); }   // a soft halo round the nearest
  ctx.globalAlpha = Math.min(1, a);
  ctx.fillRect(l.x, y, l.size, l.size);
}

export function renderKusama(ctx, t, s, env) {
  const { W, H, canvases: c, hx } = s, on = lightsOn(t);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.room, 0, 0);
  for (const l of s.lamps) {
    if (l.size === 3) continue;                                                     // the nearest lamps hang in front of Yimeng
    lamp(ctx, l, t, on);
    const ry = 2 * POOL - l.y + Math.round(Math.sin(t * 4 + l.x) * 0.6);            // and every lamp again in the pool
    if (ry > POOL && ry < FLOOR) lamp(ctx, l, t, on, ry, 0.4);
  }
  ctx.globalAlpha = 1;
  const hero = env.hero('nyc');
  ctx.drawImage(hero.canvases[1], hx - hero.anchorX, FLOOR - hero.footY);
  ctx.save();                                                                       // Yimeng's reflection on the walkway
  ctx.translate(0, 2 * FLOOR); ctx.scale(1, -1);
  ctx.globalAlpha = 0.18;
  ctx.drawImage(hero.canvases[1], hx - hero.anchorX, FLOOR - hero.footY);
  ctx.restore();
  for (const l of s.lamps) if (l.size === 3) lamp(ctx, l, t, on);
  ctx.globalAlpha = 1;
}

export const kusama = { build: buildKusama, render: renderKusama };
