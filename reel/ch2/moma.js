// Chapter 2, shot 4: MoMA. A white gallery: Warhol's soup cans, then The Starry Night, where Yimeng
// stops and looks while its sky slowly turns; Monet's Water Lilies beyond, on wide screens.
import { Painter, rng, textRows } from '../pixels.js';

const FLOOR = 88;                            // the row Yimeng's shoes rest on
const STOP = 0.85;                           // walking in until here, then standing still
const STARRY = { w: 40, h: 32, x: 28, y: 28 };   // the painting; x is its left edge relative to Yimeng's stop
const FRAMES = 4;                            // the sky's swirl, cycled

const WALL = '#f1efe9', FRAME = '#8a6a3a', FRAME_LIT = '#b8925a';

// The Starry Night in 40x32, its sky drawn at phase k of FRAMES: brush strokes run around the
// big swirl and the stars' halos, and shift along as k advances.
function starryNight(k) {
  const { w, h } = STARRY, p = new Painter(w, h), r = rng(19);
  const swirls = [[17, 10, 9], [27, 13, 5]];                                    // [x, y, radius]: the big S-swirl
  const stars = [[4, 5, 2.2], [11, 3, 2], [22, 4, 2.2], [31, 7, 2.4], [8, 13, 2], [26, 17, 1.8], [14, 18, 1.7]];
  const moon = [35, 4, 3.2];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let c, best = null;                                                         // best: the nearest star, as [distance/radius, angle, isMoon]
    for (const [sx, sy, rad] of [...stars, moon]) {
      const d = Math.hypot(x - sx, (y - sy) * 1.1);
      if (d < rad * 2.4 && (!best || d / rad < best[0])) best = [d / rad, Math.atan2(y - sy, x - sx), sx === moon[0]];
    }
    if (best && best[0] < 1) c = best[2] ? (best[0] < 0.75 ? '#f8e9a1' : '#f4d03f') : best[0] < 0.55 ? '#fffbe0' : '#f4d03f';
    else if (best && best[0] < 2.4) {
      const ring = Math.floor(best[0] * 2 + best[1] * 0.6 + k * 0.5) % 3;     // halos of yellow and pale blue
      c = ring === 0 ? '#e8c94a' : ring === 1 ? '#8fb0e0' : '#c9d97a';
    } else {
      let a = Math.atan2(y - 12, x - 20) * 2 + Math.hypot(x - 20, y - 12) * 0.35;
      for (const [sx, sy, rad] of swirls) {
        const d = Math.hypot(x - sx, y - sy);
        if (d < rad) a = Math.atan2(y - sy, x - sx) * 3 + d * 0.9;               // tighter turns inside the swirl
      }
      const band = Math.floor(a + k * (Math.PI / 2)) % 4;
      c = band === 0 ? '#1d3570' : band === 1 ? '#3d5fae' : band === 2 ? '#26407e' : '#6c8fd6';
      if (y > 9 && y < 15 && x > 6 && x < 30 && (x + y + k) % 5 === 0) c = '#a7c0e8';   // the pale swirl's crest
    }
    p.px(x, y, c);
  }
  for (let x = 0; x < w; x++) {                                                 // hills, then the village
    const hill = 21 + Math.round(Math.sin(x * 0.18) * 1.5 + Math.sin(x * 0.07 + 1) * 2);
    for (let y = hill; y < h; y++) p.px(x, y, y === hill ? '#4a6aa0' : (x + y) % 4 ? '#22365e' : '#1a2a4a');
  }
  for (let n = 0; n < 12; n++) {
    const x = 12 + Math.floor(r() * 26), y = 25 + Math.floor(r() * 5);
    p.rect(x, y, 3, 2, '#2e4470'); p.px(x + 1, y, '#f4d03f');
  }
  for (let y = 16; y < 27; y++) p.px(25, y, '#1a2236');                         // the church spire
  for (let y = 22; y < 27; y++) { p.px(24, y, '#1a2236'); p.px(26, y, '#1a2236'); }
  for (let y = 1; y < h; y++) {                                                  // the cypress, a dark flame on the left
    const half = Math.max(0.5, (y / h) * 4.5 + Math.sin(y * 0.9) * 0.8);
    for (let x = Math.round(6 - half); x <= Math.round(6 + half); x++) p.px(x, y, (x + y) % 3 ? '#1f2a1a' : '#3a4a2a');
  }
  return p;
}

function soupCans() {
  const p = new Painter(38, 16);
  for (let row = 0; row < 2; row++) for (let col = 0; col < 6; col++) {
    const x = col * 6 + 2, y = row * 8 + 1;
    p.rect(x, y, 4, 6, '#f4f1ea');
    p.rect(x, y, 4, 2, '#d0242e'); p.rect(x, y + 5, 4, 1, '#c9c4ba');
    p.px(x + 1, y + 3, '#e2b84a'); p.px(x + 2, y + 3, '#e2b84a');
  }
  return p;
}

function waterLilies() {
  const p = new Painter(84, 18), r = rng(5);
  for (let y = 0; y < 18; y++) for (let x = 0; x < 84; x++) {
    const v = Math.sin(x * 0.21 + y * 0.6) + Math.sin(x * 0.07 - y * 0.3);
    p.px(x, y, v > 0.8 ? '#a7b8d8' : v > 0 ? '#6f8fb8' : v > -0.8 ? '#4f6f9a' : '#5a7a6a');
  }
  for (let n = 0; n < 26; n++) {
    const x = Math.floor(r() * 80), y = 4 + Math.floor(r() * 12);
    p.rect(x, y, 4, 1, '#4f8a5a'); p.px(x + 1, y - 1, r() < 0.4 ? '#f2b8c8' : '#4f8a5a');
  }
  return p;
}

// Black wall lettering at twice the font's size.
function sign(str) {
  const rows = textRows(str), p = new Painter(rows[0].length * 2, 10);
  rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === '#') p.rect(x * 2, y * 2, 2, 2, '#16161a'); });
  return p;
}

// Copy a Painter's opaque pixels into another at (x0, y0).
function blit(p, src, x0, y0) {
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const k = (y * src.w + x) * 4, X = x0 + x, Y = y0 + y;
    if (!src.data[k + 3] || X < 0 || Y < 0 || X >= p.w || Y >= p.h) continue;
    p.data.set(src.data.subarray(k, k + 4), (Y * p.w + X) * 4);
  }
}

function gallery(W, H, hx) {
  const p = new Painter(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = y < 22 ? '#e2dfd8' : WALL;
    if (y === 22) c = '#d4d0c8';
    if (y >= 82) c = y === 82 ? '#d8d4cc' : y === 83 ? '#bdb7ab' : ((x + (y % 3) * 31) % 40 === 0 ? '#a8885c' : (x + y) % 9 === 0 ? '#c4a272' : '#cfae7c');
    p.px(x, y, c);
  }
  for (let x = 0; x < W; x += 30) p.rect(x, 21, 6, 2, '#3a3a40');                // track lights
  // pools of light on the wall under the spots
  const pool = (cx, top, w, h) => {
    for (let y = top; y < top + h; y++) for (let x = cx - w; x <= cx + w; x++) if ((x + y) % 2 === 0 && Math.abs(x - cx) < w * (0.6 + 0.4 * (y - top) / h)) p.px(x, y, '#f7f5f0');
  };
  const sx = hx + STARRY.x + STARRY.w / 2;
  pool(sx, 23, 28, 46);
  const frame = (x0, y0, w, h) => {
    for (let y = y0 - 2; y < y0 + h + 2; y++) for (let x = x0 - 2; x < x0 + w + 2; x++) p.px(x, y, y < y0 - 1 || x < x0 - 1 ? FRAME_LIT : FRAME);
  };
  frame(hx + STARRY.x, STARRY.y, STARRY.w, STARRY.h);
  p.rect(hx + STARRY.x + STARRY.w + 6, 50, 7, 5, '#ffffff');                    // the wall label
  for (const y of [51, 53]) p.rect(hx + STARRY.x + STARRY.w + 7, y, 5, 1, '#9a958c');
  const sx0 = Math.max(4, hx - 120), cans = soupCans(), cx0 = Math.max(hx - 64, sx0 + 36);
  frame(cx0, 34, cans.w, cans.h);
  blit(p, cans, cx0, 34);
  const lilies = waterLilies(), lx0 = hx + 112;
  if (lx0 < W) {
    frame(lx0, 38, lilies.w, lilies.h);
    blit(p, lilies, lx0, 38);
    for (let x = lx0 + 18; x < lx0 + 66; x++) { p.px(x, 74, '#1e1e24'); p.px(x, 75, '#2e2e36'); }   // a bench before it
    for (const bx of [lx0 + 20, lx0 + 63]) for (let y = 76; y < FLOOR; y++) p.px(bx, y, '#9aa0aa');
  }
  blit(p, sign('MOMA'), sx0, 30);
  return p;
}

export function buildMoma(W, H = 96) {
  const hx = Math.round(W * 0.34), layers = { gallery: gallery(W, H, hx) };
  for (let k = 0; k < FRAMES; k++) layers[`starry${k}`] = starryNight(k);
  return { W, H, hx, layers };
}

export function renderMoma(ctx, t, s, env) {
  const { W, H, canvases: c, hx } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.gallery, 0, 0);
  ctx.drawImage(c[`starry${Math.floor(t * 5) % FRAMES}`], hx + STARRY.x, STARRY.y);
  const hero = env.hero('nyc'), x = hx - Math.max(0, STOP - t) * 30;
  ctx.drawImage(hero.canvases[t < STOP ? Math.floor(t * 6) % 4 : 1], Math.round(x) - hero.anchorX, FLOOR - hero.footY);
}

export const moma = { build: buildMoma, render: renderMoma };
