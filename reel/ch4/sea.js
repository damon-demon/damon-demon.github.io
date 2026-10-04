// The underwater sets chapter 4's dives share: the water, giant kelp, the rocky reef, light from the
// surface.
import { Painter, rng } from '../pixels.js';

export const WATER = [['#7ac8d8', 0], ['#4aa0bc', 0.12], ['#2a7a9a', 0.4], ['#1a5a7a', 0.7], ['#10405a', 1]];

// A layer of giant kelp: wavy stalks from the reef to the surface, blades off them with a float at
// each base, and the blades spreading into a canopy along the surface.
export function kelp(TW, H, seed, every, cols) {
  const p = new Painter(TW, H), r = rng(seed);
  for (let x0 = Math.floor(r() * every); x0 < TW; x0 += every + Math.floor(r() * every * 0.7)) {
    const ph = r() * 6, bend = 2 + r() * 3;
    const at = (y) => Math.round(x0 + Math.sin(y * 0.045 + ph) * bend);
    for (let y = 3; y < H; y++) p.wpx(at(y), y, cols[1]);
    for (let y = 8 + Math.floor(r() * 5), side = 1; y < H - 6; y += 5 + Math.floor(r() * 3), side = -side) {
      const len = 5 + Math.floor(r() * 5), x = at(y);
      p.wpx(x + side, y, cols[2]); p.wpx(x + side, y + 1, cols[2]);                 // the float
      for (let k = 1; k <= len; k++) { p.wpx(x + side * (1 + k), y - Math.round(k * 0.7), cols[0]); p.wpx(x + side * (1 + k), y - Math.round(k * 0.7) + 1, cols[1]); }
    }
    for (let k = -10; k <= 10; k++) p.wpx(at(3) + k, 3 + Math.round(Math.abs(k) * 0.15) + (k % 3 === 0 ? 1 : 0), k % 2 ? cols[0] : cols[1]);   // the canopy
  }
  return p;
}

export function reef(TW, H) {
  const p = new Painter(TW, H), r = rng(71);
  for (let x = 0; x < TW; x++) {
    const top = 84 + Math.round(Math.sin(x * 0.07) * 2 + Math.sin(x * 0.19 + 1) * 1.5);
    for (let y = top; y < H; y++) p.px(x, y, y === top ? '#5a6a6a' : (x * 3 + y * 5) % 7 === 0 ? '#2a3a40' : '#3a4a50');
  }
  for (let n = 0; n < TW / 7; n++) {                                               // urchins, anemones and sea stars on it
    const x = Math.floor(r() * TW), y = 84 + Math.round(Math.sin(x * 0.07) * 2 + Math.sin(x * 0.19 + 1) * 1.5) - 1, k = r();
    if (k < 0.5) { p.px(x, y, '#4a2a66'); p.px(x + 1, y, '#6b3f8f'); p.px(x, y - 1, '#6b3f8f'); p.px(x + 1, y - 1, '#4a2a66'); }
    else if (k < 0.75) { p.px(x, y, '#e8a0b0'); p.px(x, y - 1, '#f0c0c8'); p.px(x + 1, y - 1, '#e8a0b0'); }
    else p.px(x, y, '#e8702a');
  }
  return p;
}

// Light slanting down from the surface, drifting with the camera.
export function rays(ctx, W, off) {
  ctx.globalAlpha = 0.12; ctx.fillStyle = '#e8fbff';
  for (let k = 0; k < Math.ceil(W / 70) + 2; k++) {
    const x0 = ((k * 70 - off) % (W + 140) + W + 140) % (W + 140) - 70;
    for (let y = 0; y < 80; y++) ctx.fillRect(Math.round(x0 + y * 0.35), y, 6 + Math.round(y / 20), 1);
  }
  ctx.globalAlpha = 1;
}

// The surface seen from below, rippling, at row y.
export function surface(ctx, W, t, y = 1) {
  ctx.fillStyle = '#d8f4fa';
  for (let x = 0; x < W; x++) if ((x + Math.floor(t * 12)) % 7 < 4) ctx.fillRect(x, Math.round(y + Math.sin(x * 0.2 + t * 3)), 1, 1);
}
