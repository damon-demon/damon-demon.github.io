// Pixel helpers shared by the cast and the scenes. Pure: no DOM, so Node tests can import them.
// Sprites are text grids, one character per pixel, '.' = transparent.

// String or row array -> rows of equal width. Strings lose their leading/trailing newlines.
export function parseRows(part) {
  if (Array.isArray(part)) return part;
  const r = part.replace(/^\n+|\n+$/g, '').split('\n');
  const w = Math.max(...r.map(x => x.length));
  return r.map(x => x.padEnd(w, '.'));
}

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export class Grid {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.px = Array.from({ length: h }, () => new Array(w).fill('.'));
  }

  get(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.px[y][x] : '.';
  }

  set(x, y, ch) {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y][x] = ch;
  }

  // Stamp a fill-only part. With `outline`, a 1px 4-neighbour ring of that colour goes down
  // first: over transparent pixels only, over anything (`over`), or over opaque pixels only
  // (`opaqueOnly`, used for an arm drawn across the torso).
  stamp(part, ox, oy, { outline = null, over = false, opaqueOnly = false } = {}) {
    const g = parseRows(part);
    const filled = new Set();
    g.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] !== '.') filled.add((x + ox) + ',' + (y + oy)); });
    if (outline) {
      for (const key of filled) {
        const [x, y] = key.split(',').map(Number);
        for (const [dx, dy] of N4) {
          const px = x + dx, py = y + dy;
          if (filled.has(px + ',' + py)) continue;
          const cur = this.get(px, py);
          if (opaqueOnly) { if (cur !== '.') this.set(px, py, outline); } else if (over || cur === '.') this.set(px, py, outline);
        }
      }
    }
    g.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] !== '.') this.set(x + ox, y + oy, row[x]); });
  }

  // Outer silhouette: every transparent pixel touching a non-outline pixel becomes `color`.
  outlineAll(color) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.px[y][x] !== '.') continue;
      if (N4.some(([dx, dy]) => { const c = this.get(x + dx, y + dy); return c !== '.' && c !== color; })) add.push([x, y]);
    }
    for (const [x, y] of add) this.px[y][x] = color;
  }

  rows() {
    return this.px.map(r => r.join(''));
  }
}

// Bresenham line. `col` is a character or (i, n) => character; width > 1 thickens to the right.
export function line(grid, x0, y0, x1, y1, col, width = 1) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  const pts = [];
  for (;;) {
    pts.push([x0, y0]);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
  pts.forEach(([x, y], i) => {
    const c = typeof col === 'function' ? col(i, pts.length) : col;
    for (let w = 0; w < width; w++) grid.set(x + w, y, c);
  });
  return pts;
}

// Swap characters in rows [rowFrom, rowTo).
export function recolor(part, mapping, rowFrom = 0, rowTo = 99) {
  return parseRows(part).map((r, y) => (y >= rowFrom && y < rowTo ? [...r].map(ch => mapping[ch] ?? ch).join('') : r));
}

// Deterministic PRNG (LCG), so every play of the reel looks the same.
export function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// Rows + palette -> rows of hex colours ('.' stays '.'); what a sprite actually looks like.
export function resolve(rows, palette) {
  return rows.map(r => [...r].map(ch => (ch === '.' ? '.' : palette[ch])));
}

// RGBA pixel buffer for procedural backgrounds. wpx wraps horizontally so tiles stay seamless.
export class Painter {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = new Uint8ClampedArray(w * h * 4);
    this.cache = {};
  }

  px(i, j, col) {
    i = Math.round(i); j = Math.round(j);
    if (i < 0 || j < 0 || i >= this.w || j >= this.h) return;
    const [r, g, b] = this.cache[col] || (this.cache[col] = hexToRgb(col));
    const k = (j * this.w + i) * 4;
    this.data[k] = r; this.data[k + 1] = g; this.data[k + 2] = b; this.data[k + 3] = 255;
  }

  wpx(i, j, col) {
    this.px(((Math.round(i) % this.w) + this.w) % this.w, j, col);
  }

  rect(i, j, rw, rh, col) {
    for (let y = j; y < j + rh; y++) for (let x = i; x < i + rw; x++) this.wpx(x, y, col);
  }
}

// Banded vertical gradient with a 2-row checker dither just above each boundary.
export function bandColor(stops, t, i, j) {
  let k = 0;
  while (k < stops.length - 1 && t >= stops[k + 1][1]) k++;
  if (k < stops.length - 1) {
    const next = stops[k + 1][1], span = stops[k + 1][1] - stops[k][1];
    if (next - t < span * 0.22 && (i + j) % 2 === 0) return stops[k + 1][0];
  }
  return stops[k][0];
}

// 3x5 pixel font for in-world text: stamps, counters, signs. Unknown characters render blank.
const GLYPHS = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'], K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#.#', '###', '###', '#.#', '#.#'], N: ['##.', '#.#', '#.#', '#.#', '#.#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'], Q: ['.#.', '#.#', '#.#', '##.', '.##'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'], U: ['#.#', '#.#', '#.#', '#.#', '###'],
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'], 'Ü': ['#.#', '...', '#.#', '#.#', '###'], W: ['#.#', '#.#', '###', '###', '#.#'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
  0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'],
  3: ['##.', '..#', '.#.', '..#', '##.'], 4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'],
  6: ['.##', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'], 8: ['###', '#.#', '###', '#.#', '###'],
  9: ['###', '#.#', '###', '..#', '##.'],
  ':': ['...', '.#.', '...', '.#.', '...'], '.': ['...', '...', '...', '...', '.#.'], '/': ['..#', '..#', '.#.', '#..', '#..'],
  '-': ['...', '...', '###', '...', '...'], "'": ['.#.', '.#.', '...', '...', '...'], ' ': ['...', '...', '...', '...', '...'],
};

// Text as 5 rows of '#' (ink) and '.', with 1px between letters. Lower case is drawn as upper.
export function textRows(str) {
  const rows = ['', '', '', '', ''];
  [...str.toUpperCase()].forEach((ch, i) => {
    const g = GLYPHS[ch] || GLYPHS[' '];
    for (let y = 0; y < 5; y++) rows[y] += (i ? '.' : '') + g[y];
  });
  return rows;
}
