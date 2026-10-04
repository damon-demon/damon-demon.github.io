// Chapter 4, shot 9: surfacing at sunset. The sun half down into the Pacific, its light laid across
// the water. Yimeng comes up out of the sea in the camo wetsuit, the sheephead on the spear, facing
// the rocks where the dog has been waiting in its life vest. The dog wags and hops, and a heart pops up.
import { Painter, bandColor, rng } from '../pixels.js';
import { art } from '../kit.js';
import { SHEEPHEAD } from './freedive.js';

const HORIZON = 54, WATER = 82;              // the horizon; the waterline round Yimeng's waist, in the shallows by the rocks
export const UP = [0.3, 0.6];                // Yimeng surfaces
const HEART_AT = 0.8;
const SKY = [['#29264f', 0], ['#3a3264', 0.14], ['#573d72', 0.28], ['#84497c', 0.41], ['#b25b7e', 0.53],
  ['#d67274', 0.64], ['#ec8f69', 0.74], ['#f5ad68', 0.83], ['#fbcd84', 0.92]];
const SEA = [['#4a3a6a', 0], ['#3b4c85', 0.25], ['#34447a', 0.6], ['#2a3866', 1]];

const HEART = art(`
.##.##.
#######
.#####.
..###..
...#...
`, { '#': '#e8607a' }, '#7a1e30');

// How far out of the water Yimeng is (0 under, 1 up), easing out as Yimeng breaks the surface.
export const riseAt = (t) => { const u = Math.min(1, Math.max(0, (t - UP[0]) / (UP[1] - UP[0]))); return 1 - (1 - u) ** 2; };

function sunsetSea(W, H, sx) {
  const p = new Painter(W, H), r = rng(29);
  for (let y = 0; y <= HORIZON; y++) for (let x = 0; x < W; x++) p.px(x, y, bandColor(SKY, y / HORIZON, x, y));
  for (let j = -10; j <= 10; j++) for (let i = -10; i <= 10; i++) {                // the sun, half set
    const d = Math.hypot(i, j), y = HORIZON - 2 + j;
    if (y > HORIZON) continue;
    if (d <= 7) p.px(sx + i, y, d > 6 ? '#ffe293' : '#fff5cf');
    else if (d <= 10 && (i + j) % 2 === 0) p.px(sx + i, y, '#fcd99a');
  }
  for (let y = HORIZON + 1; y < H; y++) for (let x = 0; x < W; x++) p.px(x, y, bandColor(SEA, (y - HORIZON) / (H - HORIZON), x, y));
  for (let n = 0; n < W / 3; n++) {                                                // swell lines, warmer near the sun's path
    const y = HORIZON + 2 + Math.floor(Math.pow(r(), 1.3) * (H - HORIZON - 3)), x = Math.floor(r() * W), len = 2 + Math.floor(r() * 6);
    for (let k = 0; k < len; k++) p.wpx(x + k, y, Math.abs(x - sx) < 20 + (y - HORIZON) ? '#c87a7a' : '#5a6aa0');
  }
  const rx = Math.round(W * 0.64), top = (x) => 66 + Math.round(Math.sin(x * 0.11) * 2 + ((x - rx) < 10 ? (10 - (x - rx)) ** 1.5 * 0.6 : 0));
  for (let x = rx; x < W; x++) for (let y = top(x); y < H; y++) {                  // the rocks, dark against the sunset, lit along the top
    const d = y - top(x), seam = Math.abs(Math.sin(x * 0.09 + y * 0.05) * 9 + Math.sin(x * 0.31) * 2 - (y - 70)) < 0.6;
    p.px(x, y, d === 0 ? '#c87a5a' : d === 1 ? '#7a4a4a' : seam ? '#4a3242' : y > WATER - 2 && (x + y) % 3 === 0 ? '#3a3050' : (x * 3 + y * 5) % 11 === 0 ? '#1e1624' : '#2e2232');
  }
  for (let x = rx - 6; x < rx + 3; x++) for (let y = WATER - 2; y < WATER + 1; y++) p.px(x, y, (x + y) % 2 ? '#2e2232' : '#3a2a3a');   // a boulder at the foot
  return { p, rockTop: top };
}

export function buildSunset(W, H = 96) {
  const sx = Math.round(W * 0.3), { p, rockTop } = sunsetSea(W, H, sx), rd = rng(3);
  const glitter = Array.from({ length: 60 }, () => { const y = HORIZON + 1 + Math.floor(Math.pow(rd(), 1.4) * (H - HORIZON - 2)); return [sx + (rd() - 0.5) * (8 + (y - HORIZON) * 1.6), y, rd()]; });
  const dog = Math.round(W * 0.64) + 6;
  return { W, H, sx, hx: Math.round(W * 0.34), dog, dogY: rockTop(dog + 12), glitter, layers: { scene: p } };
}

export function renderSunset(ctx, t, s, env) {
  const { W, H, canvases: c, hx } = s, rise = riseAt(t), up = t >= UP[1];
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.scene, 0, 0);
  const tick = Math.floor(t * 6);
  s.glitter.forEach(([x, y, b], n) => {                                            // the sun's path, glittering
    if (((n * 7 + tick) % 5) < 2 && x < Math.round(W * 0.64)) { ctx.fillStyle = b > 0.6 ? '#fff4c8' : '#ffd27e'; ctx.fillRect(Math.round(x), y, b > 0.8 ? 2 : 1, 1); }
  });
  const hero = env.hero('freedive', 'walk'), bob = up ? Math.round(Math.sin(t * 3)) : 0;
  const x = hx - hero.anchorX, y = WATER - 38 + Math.round((1 - rise) * 34) + bob, [gx, gy] = hero.hands[1];
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, WATER); ctx.clip();               // only what is above the water
  ctx.drawImage(hero.canvases[1], x, y);
  ctx.drawImage(env.art(SHEEPHEAD[0]), x + gx + 6, y + gy - 4);                    // the catch, on the spear
  ctx.restore();
  ctx.fillStyle = '#f4e8e0';                                                       // the waterline round Yimeng, and the splash
  for (let k = 0; k < 7; k++) ctx.fillRect(hx + k * 3 - 1, WATER + (k % 2), 2, 1);
  if (t > UP[0] && t < UP[1] + 0.3) {
    const u = (t - UP[0]) / (UP[1] + 0.3 - UP[0]);
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI; ctx.fillRect(Math.round(hx + 9 + Math.cos(a) * u * 16), Math.round(WATER - Math.sin(a) * u * 10 * (1 - u)), 1, 1); }
  }
  const dog = env.dog('lifevest', 'wait'), hop = up && Math.floor(t * 8) % 2 ? 2 : 0;   // the dog on the rocks, facing Yimeng
  ctx.save(); ctx.translate(2 * s.dog + 24, 0); ctx.scale(-1, 1);
  ctx.drawImage(dog.canvases[Math.floor(t * (up ? 10 : 3)) % 2], s.dog, s.dogY - dog.footY - hop);
  ctx.restore();
  if (t > HEART_AT) {
    const u = Math.min(1, (t - HEART_AT) / 0.8);
    ctx.globalAlpha = 1 - u * u; ctx.drawImage(env.art(HEART), s.dog + 6, Math.round(s.dogY - 24 - u * 10)); ctx.globalAlpha = 1;
  }
}

export const sunset = { build: buildSunset, render: renderSunset };
