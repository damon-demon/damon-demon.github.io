// Small helpers every scene uses. Pure, except tile(), which only calls ctx.drawImage.
import { Painter, Grid, parseRows, bandColor, textRows } from './pixels.js';

// Draw a horizontally tiling layer (at least as wide as the view), scrolled left by `off` px.
export function tile(ctx, img, off, y = 0) {
  const w = img.width, o = ((Math.round(off) % w) + w) % w;
  ctx.drawImage(img, -o, y);
  ctx.drawImage(img, w - o, y);
}

// A w x h vertical banded gradient, dithered at each boundary.
export function gradient(w, h, stops) {
  const p = new Painter(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, bandColor(stops, j / Math.max(1, h - 1), i, j));
  return p;
}

// Scene pixel art: a fill-only grid plus palette, optionally with a generated 1px outline.
// Returns { rows, palette, w, h }; env.art() turns it into a canvas.
export function art(grid, palette, outline = null) {
  const rows = parseRows(grid), pad = outline ? 1 : 0;
  const g = new Grid(rows[0].length + 2 * pad, rows.length + 2 * pad);
  g.stamp(rows, pad, pad, outline ? { outline: 'k' } : {});
  return { rows: g.rows(), palette: outline ? { ...palette, k: outline } : palette, w: g.w, h: g.h };
}

// Pixel art painted into a Painter of its own size, for scenes that keep everything as layers.
export function paint(a) {
  const p = new Painter(a.w, a.h);
  a.rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] !== '.') p.px(x, y, a.palette[row[x]]); });
  return p;
}

// One line of 3x5 text as pixel art in a single ink colour.
export function label(str, ink) {
  const rows = textRows(str);
  return { rows, palette: { '#': ink }, w: rows[0].length, h: 5 };
}

// Seamless ridge profile over a tile width: base + sum of sines whose frequencies are whole numbers.
export function ridge(TW, base, waves) {
  return Array.from({ length: TW }, (_, x) => base + waves.reduce((s, [a, f, ph]) => s + a * Math.sin((x / TW) * Math.PI * 2 * f + ph), 0));
}

// Where a walking hero stands: x is the character's left edge, groundY the row its shoes rest on.
export function drawHero(ctx, hero, frame, x, groundY) {
  ctx.drawImage(hero.canvases[frame % hero.canvases.length], Math.round(x) - hero.anchorX, Math.round(groundY) - hero.footY);
}
