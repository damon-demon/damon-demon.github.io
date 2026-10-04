// Chapter 3, shot 4: out of Michigan. In a grey corridor Yimeng, hooded, walks with the dog to a
// door. It swings open on California in full colour, sun, sea and palms, and the colour floods out
// through the doorway until it fills everything, as in The Wizard of Oz.
import { Painter, rng } from '../pixels.js';
import { gradient } from '../kit.js';
import { drawHood } from './hooding.js';

const FLOOR = 88;                              // the row Yimeng's shoes rest on
const STEP = 26;                               // walk speed, px/s
const OPEN = [0.55, 0.8];                      // the door swings open
const FLOOD = [0.8, 1.45];                     // the colour spreads from the doorway to the whole frame
const DOOR_W = 16, DOOR_TOP = 50;

// How far the colour has spread: the radius of the circle round the doorway, in px.
export function floodAt(t, W) {
  const u = Math.min(1, Math.max(0, (t - FLOOD[0]) / (FLOOD[1] - FLOOD[0])));
  return u * u * (W + 60);
}

function corridor(W, H, dx) {
  const p = new Painter(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = y < 80 ? ((x % 40 === 0) ? '#7e7e7a' : '#8e8e8a') : (x + (y % 2) * 5) % 10 === 0 ? '#5e5a54' : '#6c6862';
    if (y === 62) c = '#7a7a76';
    p.px(x, y, c);
  }
  for (let y = DOOR_TOP - 2; y < 80; y++) for (let x = dx - 2; x < dx + DOOR_W + 2; x++) p.px(x, y, '#5a5650');   // the frame
  for (let y = 18; y < 30; y++) for (let x = dx; x < dx + DOOR_W; x++) p.px(x, y, (x + y) % 2 ? '#b8b8b2' : '#a8a8a2');   // an EXIT light, unlit
  return p;
}

// California through the door: sun over the Pacific, golden hills, palms.
function california(W, H) {
  const p = gradient(W, H, [['#4a8fd8', 0], ['#6aa8e4', 0.3], ['#94c4ee', 0.55], ['#c8e2f6', 0.72]]);
  const sx = Math.round(W * 0.7);
  for (let j = -9; j <= 9; j++) for (let i = -9; i <= 9; i++) {
    const d = Math.hypot(i, j);
    if (d < 6) p.px(sx + i, 30 + j, '#fff4c4'); else if (d < 9 && (i + j) % 2 === 0) p.px(sx + i, 30 + j, '#ffe08a');
  }
  for (let y = 66; y < 80; y++) for (let x = 0; x < W; x++) p.px(x, y, y < 68 ? '#8ac8e8' : (x * 3 + y) % 11 === 0 ? '#5aa0d0' : '#3a86c4');   // the sea
  for (let x = 0; x < W; x++) {                                                    // golden hills
    const h = 6 + Math.sin(x * 0.03) * 4 + Math.sin(x * 0.11) * 2;
    for (let y = Math.round(66 - h); y < 66; y++) if (x < W * 0.45) p.px(x, y, y === Math.round(66 - h) ? '#e8c06a' : '#d8a850');
  }
  for (let y = 80; y < H; y++) for (let x = 0; x < W; x++) p.px(x, y, y < 82 ? '#f0d8a8' : (x + y) % 7 === 0 ? '#d8b878' : '#e8c890');   // sand
  const r = rng(6);
  for (const fx of [0.12, 0.3, 0.86]) {                                            // palms
    const x0 = Math.round(W * fx);
    for (let s = 0; s < 34; s++) p.px(x0 + Math.round((s / 34) ** 2 * 4), 80 - s, s % 3 ? '#8a6040' : '#6a4630');
    for (const [dir, droop] of [[-1, 0.8], [-0.6, 0.3], [0.6, 0.3], [1, 0.8], [0.1, 0]]) for (let k = 0; k < 13; k++) {
      p.px(x0 + 4 + dir * k, 46 - Math.round(2 * Math.sin(k / 13 * Math.PI) * (1 - droop) - droop * (k / 13) ** 2 * 8), r() < 0.5 ? '#3f8a3a' : '#5aa848');
    }
  }
  return p;
}

export function buildDoor(W, H = 96) {
  const hx = Math.round(W * 0.34), dx = Math.round(W * 0.62);
  return { W, H, hx, dx, layers: { grey: corridor(W, H, dx), oz: california(W, H) } };
}

// Clip to the circle the colour has reached, row by row (cx, cy: the doorway's middle).
function clipCircle(ctx, cx, cy, r, H) {
  ctx.beginPath();
  for (let y = 0; y < H; y++) {
    const d = r * r - (y - cy) * (y - cy);
    if (d > 0) { const w = Math.sqrt(d); ctx.rect(Math.round(cx - w), y, Math.round(2 * w), 1); }
  }
  ctx.clip();
}

function cast(ctx, t, s, env, tone) {
  const hero = env.hero('phd', 'walk', tone), dog = env.dog('bandana', 'trot', tone), f = Math.floor(t * 6) % 4;
  const x = Math.round(s.hx - 18 + t * STEP) - hero.anchorX, y = FLOOR - hero.footY;
  ctx.drawImage(hero.canvases[f], x, y);
  drawHood(ctx, x, y, f % 2 === 0 ? 1 : 0);
  ctx.drawImage(dog.canvases[Math.floor(t * 9) % 4], Math.round(s.hx + 14 + t * STEP) - dog.anchorX, FLOOR - dog.footY);
}

export function renderDoor(ctx, t, s, env) {
  const { W, H, canvases: c, dx } = s, r = floodAt(t, W), cy = DOOR_TOP + 15;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.grey, 0, 0);
  if (t >= OPEN[0]) {                                                               // the doorway shows California
    ctx.save(); ctx.beginPath(); ctx.rect(dx, DOOR_TOP, DOOR_W, 80 - DOOR_TOP); ctx.clip();
    ctx.drawImage(c.oz, 0, 0); ctx.restore();
  }
  const swing = Math.min(1, Math.max(0, (t - OPEN[0]) / (OPEN[1] - OPEN[0])));      // the door panel turning on its hinge
  const panel = Math.round(DOOR_W * (1 - swing * 0.85));
  ctx.fillStyle = '#6a6258'; ctx.fillRect(dx, DOOR_TOP, panel, 80 - DOOR_TOP);
  ctx.fillStyle = '#c8c0b0'; if (panel > 4) ctx.fillRect(dx + panel - 3, 66, 1, 2);
  cast(ctx, t, s, env, 'muted');
  if (r > 0) {                                                                      // the colour floods out from the doorway
    ctx.save(); clipCircle(ctx, dx + DOOR_W / 2, cy, r, H);
    ctx.drawImage(c.oz, 0, 0);
    cast(ctx, t, s, env, 'full');
    ctx.restore();
    ctx.fillStyle = '#fff6d0';                                                      // a bright, glittering edge to it
    for (let a = 0; a < Math.PI * 2; a += 2 / Math.max(8, r)) {
      if ((Math.floor(a * r) + Math.floor(t * 30)) % 3 === 0) continue;
      ctx.fillRect(Math.round(dx + DOOR_W / 2 + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1);
    }
  }
}

export const door = { build: buildDoor, render: renderDoor };
