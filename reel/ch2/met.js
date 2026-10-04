// Chapter 2, shot 5: the Met. The Temple of Dendur in the Sackler Wing: the sandstone gateway and
// the temple with its two lotus columns on their granite platform, a reflecting pool in front, and
// Central Park through the great glass wall behind. Yimeng walks in along the pool and stops.
import { Painter } from '../pixels.js';

const FLOOR = 91;                            // the row Yimeng's shoes rest on
const STOP = 0.6;                            // walking in until here, then standing still
const POOL = 76;                             // the pool's top row; it runs ten rows down
const SAND = '#dcbc8c', SAND_LIT = '#ecd2a4', SAND_MID = '#c8a676', SAND_SH = '#a8845a', RELIEF = '#9a7a50';

// A cavetto cornice: a band that flares out as it rises, over a rounded torus moulding.
function cornice(p, x0, x1, top) {
  for (let k = 0; k < 5; k++) for (let x = x0 - (4 - k); x <= x1 + (4 - k); x++) p.px(x, top + k, k === 0 ? SAND_LIT : k === 4 ? SAND_SH : SAND_MID);
  for (let x = x0; x <= x1; x++) p.px(x, top + 5, RELIEF);
}

function reliefs(p, x0, x1, y0, y1) {
  for (let y = y0; y < y1; y += 4) for (let x = x0; x < x1; x += 3) if ((x * 7 + y) % 5 < 3) { p.px(x, y, RELIEF); p.px(x, y + 1, RELIEF); }
}

export function buildMet(W, H = 96) {
  const p = new Painter(W, H), cx = Math.round(W * 0.62), hx = Math.round(W * 0.34);
  // the glass wall: sky over Central Park's trees, behind a grid of mullions
  for (let y = 0; y < 62; y++) for (let x = 0; x < W; x++) {
    const tree = 38 + Math.sin(x * 0.11) * 3 + Math.sin(x * 0.29 + 1) * 2;
    let c = y < tree ? (y < 18 ? '#a9c1d5' : '#c3d6e5') : (x * 3 + y * 7) % 11 === 0 ? '#86a676' : (x + y) % 4 ? '#6a8a58' : '#5a7a4a';
    if (x % 24 === 0 || y % 11 === 0) c = '#59606a';
    p.px(x, y, c);
  }
  for (let y = 62; y < 66; y++) for (let x = 0; x < W; x++) p.px(x, y, y === 62 ? '#e4dccb' : '#cfc6b4');   // the wall's stone base
  for (let y = 66; y < POOL; y++) for (let x = 0; x < W; x++) p.px(x, y, y === 66 ? '#e6dfd0' : (x % 40 === 0 || y === 71) ? '#c4bcae' : '#d8d0c0');   // the hall's stone floor
  // the granite platform
  for (let y = 66; y < POOL; y++) for (let x = cx - 74; x <= cx + 74; x++) p.px(x, y, y === 66 ? '#d2ccc0' : (x - cx + 80) % 16 === 0 || y === 71 ? '#9a958a' : '#b4aea2');
  // the gateway: two jambs under a lintel and cornice, a winged sun on the lintel
  const gx = cx - 50;
  for (let y = 40; y < 66; y++) for (const x0 of [gx, gx + 16]) for (let x = x0; x < x0 + 7; x++) p.px(x, y, x === x0 ? SAND_LIT : x === x0 + 6 ? SAND_SH : SAND);
  reliefs(p, gx + 1, gx + 6, 44, 64); reliefs(p, gx + 17, gx + 22, 44, 64);
  for (let y = 36; y < 40; y++) for (let x = gx; x < gx + 23; x++) p.px(x, y, SAND);
  cornice(p, gx, gx + 22, 30);
  for (let x = gx + 5; x < gx + 18; x++) p.px(x, 37, '#b8945e');
  p.rect(gx + 10, 36, 3, 3, '#c89a50');
  // the temple: a cornice over two lotus columns in front, the sanctuary behind
  const tx = cx - 18;
  for (let y = 42; y < 66; y++) for (let x = tx + 30; x < tx + 64; x++) p.px(x, y, x === tx + 30 ? SAND_LIT : x > tx + 60 ? SAND_SH : SAND);
  reliefs(p, tx + 33, tx + 59, 46, 64);
  for (let y = 56; y < 66; y++) for (let x = tx; x < tx + 30; x++) p.px(x, y, y === 56 ? SAND_LIT : SAND_MID);   // the screen walls
  for (let y = 42; y < 56; y++) for (let x = tx + 1; x < tx + 30; x++) p.px(x, y, '#6a5034');                     // the shaded porch
  for (const colx of [tx + 6, tx + 19]) {
    for (let y = 44; y < 66; y++) for (let x = colx; x < colx + 5; x++) p.px(x, y, x === colx ? SAND_LIT : x === colx + 4 ? SAND_SH : SAND);
    for (let k = 0; k < 3; k++) for (let x = colx - 2 + k; x < colx + 7 - k; x++) p.px(x, 41 + k, k === 0 ? SAND_LIT : SAND_MID);   // lotus capital
  }
  for (let y = 38; y < 42; y++) for (let x = tx; x < tx + 64; x++) p.px(x, y, SAND);
  cornice(p, tx, tx + 63, 32);
  // the pool's stone lip, its water, and the floor
  for (let y = POOL; y < POOL + 10; y++) for (let x = 0; x < W; x++) p.px(x, y, y === POOL ? '#d8d0c0' : (x + y * 5) % 13 === 0 ? '#3e5e6a' : '#2e4a54');
  for (let y = POOL + 10; y < H; y++) for (let x = 0; x < W; x++) p.px(x, y, y === POOL + 10 ? '#e6dfd0' : (x + (y % 6 < 3 ? 0 : 20)) % 40 === 0 || y % 6 === 0 ? '#c4bcae' : '#d8d0c0');
  return { W, H, cx, hx, layers: { hall: p } };
}

export function renderMet(ctx, t, s, env) {
  const { W, H, canvases: c, hx } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.hall, 0, 0);
  // the temple upside down in the pool, flattened by the low angle, shivering with the ripples
  ctx.save();
  ctx.translate(0, POOL + 10); ctx.scale(1, -1);
  ctx.globalAlpha = 0.32;
  ctx.drawImage(c.hall, 0, 30, W, 46, Math.round(Math.sin(t * 5)), 0, W, 9);
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(216, 232, 236, 0.35)';
  for (let k = 0; k < 6; k++) ctx.fillRect(Math.round(((k * 83 + t * 10) % (W + 20)) - 10), POOL + 2 + (k % 4) * 2, 6 + (k % 3) * 3, 1);
  const hero = env.hero('nyc'), x = hx - Math.max(0, STOP - t) * 30;
  ctx.drawImage(hero.canvases[t < STOP ? Math.floor(t * 6) % 4 : 1], Math.round(x) - hero.anchorX, FLOOR - hero.footY);
}

export const met = { build: buildMet, render: renderMet };
