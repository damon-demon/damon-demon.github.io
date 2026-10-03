// The dog: a slender sighthound (as in the hero photo), adult and puppy, with its outfits.
// Ported from the approved mockup (.superpowers/pixel-mock/art_dog.py); the golden test in
// tests/reel/dog.test.js holds this file to those exact pixels.
import { Grid, line } from './pixels.js';

export const DOG_PALETTE = {
  k: '#22202a', C: '#5a5e6e', c: '#454857', L: '#2e303b', N: '#141218', w: '#ffffff', e: '#3b3d48',
  X: '#e9dcc0', Q: '#e9dcc0', Z: '#d8c9aa', G: '#1f5a46', g: '#16463a', W: '#f1efe6', b: '#a9d0ec',
  d: '#6f9fc4', O: '#ff6b1a', o: '#c94e0f', R: '#e9e9e9', Y: '#ffc21a', y: '#d39a0b', r: '#d8402f',
  h: '#2b2730', T: '#2f6f73', t: '#22524f', u: '#e0782f', 1: '#efe4cb', 2: '#9a6a45', 3: '#3a2e28', 4: '#d9cbb0',
};

// X = torso garment area, Q = neck garment area; dress() re-colours them per outfit.
const ADULT = {
  body: `
..............ee......
.............eCCC.....
.............CCCCCC...
..............CCCCCCC.
.............CCc......
............QQQ.......
......XXXXXXXXX.......
....XXXXXXXXXXXX......
...XXXXXXXXXXXXX......
....XXXX...XXXXX......
`,
  // hip/shoulder (x0, y0) -> paw (x1, y1); index 0 = far leg, 1 = near leg
  poses: {
    ext: { back: [[5, 10, 2, 15], [6, 10, 4, 15]], front: [[13, 10, 16, 15], [14, 10, 17, 15]] },
    gather: { back: [[5, 10, 6, 15], [6, 10, 8, 15]], front: [[13, 10, 12, 15], [14, 10, 13, 15]] },
  },
  eye: [16, 2], nose: [21, 3], tail: [3, 9, 0, 12], w: 24, h: 17, footY: 15,
};
const PUPPY = {
  body: `
.........ee.....
........eeCCC...
........eCCCCC..
.........CCCCCCC
.........CCCC...
.......QQQ......
...XXXXXXXX.....
..XXXXXXXXX.....
..XXXXXXXXX.....
`,
  poses: {
    ext: { back: [[3, 9, 2, 12], [4, 9, 3, 12]], front: [[9, 9, 10, 12], [10, 9, 11, 12]] },
    gather: { back: [[3, 9, 4, 12], [4, 9, 5, 12]], front: [[9, 9, 8, 12], [10, 9, 9, 12]] },
  },
  eye: [12, 2], nose: [16, 3], tail: [2, 7, 0, 8], w: 19, h: 14, footY: 12,
};

const TILE = ['1123', '1132', '2311', '3211'];     // houndstooth-ish: cream with brown/dark teeth

// Re-colour the garment placeholders; bodyY = canvas row of body-grid row 0.
function dress(c, outfit, bodyY) {
  for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) {
    const ch = c.px[y][x];
    if (ch !== 'X' && ch !== 'Q' && ch !== 'Z') continue;
    const ry = y - bodyY;
    let out;
    if (outfit === 'houndstooth') {
      const t = TILE[y % 4][x % 4];
      out = ch === 'Z' ? (t === '1' ? '4' : t) : t;
    } else if (outfit === 'msu_knit') {
      out = ch === 'Z' ? 'g' : ch === 'X' && ry === 7 ? 'W' : ch === 'X' && ry === 9 ? 'g' : 'G';
    } else if (outfit === 'blaze') {
      out = ch === 'Q' ? 'C' : ch === 'Z' ? 'o' : ry === 7 ? 'R' : ry === 9 ? 'o' : 'O';
    } else if (outfit === 'lifevest') {
      out = ch === 'Q' ? 'C' : ch === 'Z' ? 'y' : ry === 8 ? 'r' : ry === 9 ? 'y' : 'Y';
    } else if (outfit === 'hikepack' && ch === 'X' && ry >= 6 && ry <= 8 && x >= 6 && x <= 12) {
      out = ry === 8 ? 't' : 'T';
    } else if (outfit === 'hikepack' && ch === 'X' && ry === 7 && (x === 13 || x === 14)) {
      out = 'u';
    } else {                                   // bare, bandana, the rest of hikepack: coat
      out = (ch === 'X' && ry === 9) || ch === 'Z' ? 'c' : 'C';
    }
    c.px[y][x] = out;
  }
  const extra = {
    bandana: [[12, 6, 'b'], [13, 6, 'b'], [14, 6, 'b'], [13, 7, 'b'], [14, 7, 'd'], [14, 8, 'd']],
    lifevest: [[8, 5, 'h'], [9, 4, 'h'], [10, 4, 'h'], [11, 5, 'h']],
    hikepack: [[7, 5, 'T'], [8, 5, 'T'], [9, 5, 'u'], [10, 5, 'T'], [11, 5, 'T'], [8, 4, 't'], [9, 4, 't'], [10, 4, 't']],
  }[outfit] || [];
  for (const [x, y, col] of extra) c.set(x, y + bodyY, col);
}

function frame(spec, outfit, pose, bob) {
  const c = new Grid(spec.w, spec.h);
  c.stamp(spec.body, 0, 1 + bob, { outline: 'k' });
  c.set(spec.eye[0], spec.eye[1] + 1 + bob, 'N');
  c.set(spec.nose[0], spec.nose[1] + 1 + bob, 'N');
  dress(c, outfit, 1 + bob);
  // Thin legs, no outline: far legs (index 0) first in shade, near legs on top.
  for (const i of [0, 1]) {
    for (const group of ['back', 'front']) {
      const [x0, y0, x1, y1] = spec.poses[pose][group][i];
      const col = i === 0 ? 'c' : 'C';
      line(c, x0, y0 + bob, x1, y1, col);
      c.set(x1 + 1, y1, col);                  // paw
    }
  }
  const [tx0, ty0, tx1, ty1] = spec.tail;
  line(c, tx0, ty0 + bob, tx1, ty1 + bob, 'C');
  return c;
}

// Trot cycle: [pose, bob].
const TROT = [['ext', 0], ['gather', -1], ['ext', 0], ['gather', -1]];

export const DOG_KEYS = ['pup', 'bandana', 'msu_knit', 'bare', 'houndstooth', 'hikepack', 'blaze', 'lifevest'];

// 'pup' is the puppy in its Columbia-blue bandana; every other key dresses the adult.
export function dogSprite(key) {
  if (!DOG_KEYS.includes(key)) throw new Error(`unknown dog outfit: ${key}`);
  const spec = key === 'pup' ? PUPPY : ADULT;
  const frames = TROT.map(([pose, bob]) => {
    const c = frame(spec, key === 'pup' ? 'bare' : key, pose, bob);
    if (key === 'pup') for (const [x, y, col] of [[7, 6, 'b'], [8, 6, 'b'], [9, 6, 'b'], [8, 7, 'b'], [9, 7, 'd']]) c.set(x, y + 1 + bob, col);
    return c.rows();
  });
  return { frames, palette: DOG_PALETTE, width: spec.w, height: spec.h, anchorX: 0, footY: spec.footY };
}
