// Chapter 2, shot 6: the Guggenheim, looking up inside Frank Lloyd Wright's rotunda. Each turn of the
// white spiral ramp curves round the skylight as a ring, with paintings and small visitors on every
// level. Yimeng walks up the lowest turn, seen from the waist up over its wall.
import { Painter, rng } from '../pixels.js';

const RINGS = 7;                             // turns of the ramp, from the skylight outwards
const SKY_Y = 8;                             // the skylight's centre row
const STEP = 26;                             // walk speed, px/s
const RISE = 0.07;                           // the near ramp climbs 1px for every ~14px
const PAINTING = ['#c8302a', '#2c5aa0', '#f2c21e', '#3a3a40', '#4f9a4a', '#e8a0b0', '#7b3fa0', '#f4f1ea'];

// The near ramp's floor, under Yimeng's shoes, at screen column x.
export const rampAt = (s, x) => Math.round(92 - (x - s.hx) * RISE);

// Turn k of the ramp as seen from below: the lower half of an ellipse round the skylight.
function ring(W, k) { return { rx: W * (0.1 + k * 0.085), ry: 9 + k * 10.5 }; }
function ringY(W, cx, k, x) {
  const { rx, ry } = ring(W, k), u = (x - cx) / rx;
  return Math.abs(u) > 1 ? null : Math.round(SKY_Y + ry * Math.sqrt(1 - u * u));
}

export function buildGuggenheim(W, H = 96) {
  const cx = Math.round(W * 0.56), hx = Math.round(W * 0.34), r = rng(59);
  const back = new Painter(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) back.px(x, y, (x + y) % 2 && Math.abs(x - cx) > W * 0.5 ? '#d8d2c6' : '#e2ddd2');
  for (let y = 0; y < 20; y++) for (let x = 0; x < W; x++) {                        // the skylight, ribbed like a wheel
    const { rx, ry } = ring(W, 0), d = Math.hypot((x - cx) / rx, (y - SKY_Y) / ry);
    if (d > 1) continue;
    back.px(x, y, Math.round(Math.atan2(y - SKY_Y, x - cx) * 9) % 2 ? '#f6f8fa' : '#d4dae2');
  }
  const visitors = [];
  for (let k = 0; k < RINGS; k++) {
    for (let x = 0; x < W; x++) {                                                   // the white parapet, its lip in shadow
      const y = ringY(W, cx, k, x);
      if (y === null) continue;
      for (let j = 0; j < 4; j++) back.px(x, y + j, j === 0 ? '#ffffff' : j === 3 ? '#c4beb2' : '#f2efe8');
      for (let j = 4; j < 6; j++) back.px(x, y + j, '#b4aea2');
    }
    if (k === 0) continue;
    for (let x = 4 + Math.floor(r() * 10); x < W - 4; x += 12 + Math.floor(r() * 14)) {   // paintings on the wall above each turn
      const y = ringY(W, cx, k, x);
      if (y === null || y - 6 < 0) continue;
      back.rect(x, y - 6, 3, 4, PAINTING[Math.floor(r() * PAINTING.length)]);
    }
    for (let n = 0; n < Math.round(W / 70) + 1; n++) visitors.push({ k, x: cx + (r() * 2 - 1) * ring(W, k).rx * 0.9, v: (k % 2 ? -1 : 1) * (3 + r() * 4), col: ['#3a3a40', '#5a2a2a', '#2a3a5a', '#4a4a3a'][Math.floor(r() * 4)] });
  }
  const front = new Painter(W, H), s = { hx };                                     // the near ramp's wall, in front of Yimeng
  for (let x = 0; x < W; x++) {
    const top = rampAt(s, x) - 8;
    for (let y = top; y < H; y++) front.px(x, y, y === top ? '#ffffff' : y < top + 3 ? '#f4f1ea' : y === top + 3 ? '#d4cec2' : '#ece8e0');
  }
  return { W, H, cx, hx, visitors, layers: { back, front } };
}

export function renderGuggenheim(ctx, t, s, env) {
  const { W, H, canvases: c, hx, cx } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.back, 0, 0);
  for (const v of s.visitors) {                                                     // people strolling round the turns
    const { rx } = ring(W, v.k), x = cx + ((v.x - cx + t * v.v + rx * 3) % (rx * 2)) - rx, y = ringY(W, cx, v.k, x);
    if (y === null) continue;
    ctx.fillStyle = v.col; ctx.fillRect(Math.round(x), y - 4, 2, 4);
    ctx.fillStyle = '#e0b08c'; ctx.fillRect(Math.round(x), y - 5, 2, 1);
  }
  const hero = env.hero('nyc'), x = hx - 14 + t * STEP;
  ctx.drawImage(hero.canvases[Math.floor(t * 6) % 4], Math.round(x) - hero.anchorX, rampAt(s, Math.round(x) + 9) - hero.footY);
  ctx.drawImage(c.front, 0, 0);
}

export const guggenheim = { build: buildGuggenheim, render: renderGuggenheim };
