// Chapter 2, shot 1: Columbia. Low Memorial Library with Alma Mater on its steps, seen from College
// Walk in autumn. Yimeng arrives in the camel coat under falling leaves, stops and looks up. The set
// comes back in spring for the graduation (graduation.js).
import { Painter, rng } from '../pixels.js';
import { gradient, art } from '../kit.js';

export const WALK = 90;                        // College Walk: the row Yimeng's shoes rest on
const SEASONS = {
  autumn: { sky: [['#5d8fc8', 0], ['#7aa6d6', 0.3], ['#9cbfe2', 0.6], ['#c4dbef', 0.9]],
    leaf: ['#e8a832', '#cf6e2a', '#f2c862', '#b04a2a', '#8f3c22'] },
  spring: { sky: [['#4f8fd6', 0], ['#6fa6e0', 0.3], ['#95c0ea', 0.6], ['#c6def4', 0.9]],
    leaf: ['#5f9a46', '#4e8a3e', '#8fc060', '#3d6e34', '#2f5a2c'] },
};

// Alma Mater, seen from the front: a laurel wreath, arms held out in welcome, the sceptre in her
// right hand rising above her head, the open book on her lap, a throne under her.
const ALMA = art(`
..c................
.ccc...............
..c......www.......
..c.....wHHHw......
..c.....HfffH......
..c.....HfffH......
..c......HfH.......
..cb......H.....b..
..cBB...BBBBB..bB..
..c.BBBBBBBBBBBB...
..c....BBhBBBB.....
..c....BBhBBBB.....
..c...BBBhBBBBB....
..c...BwwwwwwwB....
..c..BBBBBBBBBBB...
..c..BBhBBBBhBBB...
....BBBhBBBBBhBBB..
...TTTTTTTTTTTTTTT.
...TtTTTTTTTTTTtTT.
`, { c: '#e2bf55', w: '#d7b44c', H: '#5f634e', f: '#8f9474', B: '#43463a', h: '#666a53', b: '#737860', T: '#2f3127', t: '#4a4c3e' }, '#1c1d16');

function library(p, cx) {
  const L = '#f0e9da', M = '#ddd3bd', S = '#c2b69b', D = '#a69a80', K = '#655b48';
  // the dome: the top of an ellipse whose centre sits below the drum, so it reads shallow
  for (let y = 20; y <= 33; y++) {
    const hw = 34 * Math.sqrt(Math.max(0, 1 - Math.pow((39 - y) / 19.5, 2)));
    for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) {
      const u = (x - cx) / hw;
      p.px(x, y, u < -0.45 && u > -0.85 ? '#e6e4dd' : u > 0.4 ? '#9d9a92' : (x + y) % 7 === 0 ? '#bdbab3' : '#c4c1ba');
    }
  }
  for (let x = cx - 36; x <= cx + 36; x++) { p.px(x, 32, '#a9a69e'); p.px(x, 33, '#d4d1ca'); }   // stepped rings
  for (let y = 34; y < 40; y++) for (let x = cx - 38; x <= cx + 38; x++) p.px(x, y, y === 34 ? L : y === 39 ? S : (x - cx + 60) % 6 === 0 ? S : M);   // drum
  // the attic over the portico, then the wings either side
  for (let y = 40; y < 45; y++) for (let x = cx - 58; x <= cx + 58; x++) p.px(x, y, y === 40 ? L : y === 44 ? S : M);
  for (const side of [-1, 1]) {
    for (let y = 44; y < 67; y++) for (let k = 51; k <= 100; k++) {
      const x = cx + side * k;
      let c = y === 44 ? L : y === 45 ? S : (k > 97 ? L : M);
      if (y > 60 && (y - 61) % 3 === 0) c = S;                                   // rusticated base
      p.px(x, y, c);
    }
    for (let k = 57; k <= 93; k += 9) {                                          // tall windows with lintels
      const x0 = side < 0 ? cx - k - 3 : cx + k;
      p.rect(x0 - 1, 49, 5, 1, L); p.rect(x0 - 1, 50, 5, 1, S);
      p.rect(x0, 51, 3, 9, K);
      p.px(x0, 52, '#8a96a8'); p.px(x0 + 1, 53, '#7a8698');
    }
  }
  // entablature: cornice with a shadow under it, the inscribed frieze, architrave
  for (let x = cx - 52; x <= cx + 52; x++) {
    p.px(x, 45, L); p.px(x, 46, D);
    for (const y of [47, 48]) p.px(x, y, M);
    if ((x - cx + 90) % 3 !== 0 && Math.abs(x - cx) < 46) p.px(x, 47, '#a89d85');   // the inscription
    p.px(x, 49, L); p.px(x, 50, S);
  }
  // the portico in shade behind the columns, with bronze doors
  for (let y = 51; y < 67; y++) for (let x = cx - 50; x <= cx + 50; x++) p.px(x, y, y < 53 ? K : D);
  for (const [dx, w, top] of [[0, 9, 55], [-30, 5, 58], [30, 5, 58]]) {
    p.rect(cx + dx - Math.floor(w / 2) - 1, top - 1, w + 2, 67 - top + 1, '#c09a48');
    p.rect(cx + dx - Math.floor(w / 2), top, w, 67 - top, '#4a3c2a');
  }
  // ten Ionic columns
  for (let i = 0; i < 10; i++) {
    const x = cx - 45 + i * 10;
    p.rect(x - 2, 51, 5, 1, L); p.px(x - 2, 52, S); p.px(x + 2, 52, S);          // capital with volutes
    for (let y = 52; y < 66; y++) { p.px(x - 1, y, L); p.px(x, y, M); p.px(x + 1, y, S); }
    p.rect(x - 2, 66, 5, 1, L);
  }
  // podium and the Low Steps, widening towards College Walk
  for (let x = cx - 104; x <= cx + 104; x++) { p.px(x, 67, L); p.px(x, 68, M); }
  for (let y = 69; y < 87; y++) {
    const hw = 104 + (y - 69) * 2.4, tread = (y - 69) % 2 === 0 || (y >= 76 && y <= 78);
    for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) p.px(x, y, tread ? '#e2dfd8' : '#bab6ae');
  }
  // Alma Mater's granite pedestal on the landing
  for (let y = 71; y < 82; y++) for (let x = cx - 9; x <= cx + 9; x++) p.px(x, y, y === 71 ? '#d1cec7' : y === 72 ? '#8f8b82' : x > cx + 6 ? '#8f8b82' : '#a9a59c');
}

function clouds(p, W, seed) {
  const r = rng(seed);
  for (let n = 0; n < Math.round(W / 120) + 1; n++) {
    const cx = r() * W, cy = 18 + r() * 14, len = 26 + r() * 30;
    for (let k = 0; k < 4; k++) {
      const w = len - k * 7, x0 = cx + k * 3.5 - len / 2;
      for (let i = 0; i < w; i++) p.px(x0 + i, cy - k, k === 0 ? '#c9d9ea' : '#f4f8fb');
    }
  }
}

function tree(p, x, base, r, leaf, seed) {
  const rr = rng(seed);
  for (let y = base - 16; y < base; y++) for (let k = 0; k < 3; k++) p.px(x - 1 + k, y, k === 2 ? '#3e2e22' : '#5a4232');
  p.px(x - 2, base - 1, '#5a4232'); p.px(x + 2, base - 1, '#3e2e22');
  for (const [ox, oy, rad] of [[0, -r - 12, r], [-r * 0.7, -r - 8, r * 0.75], [r * 0.7, -r - 7, r * 0.8], [0, -r * 1.6 - 12, r * 0.7]]) {
    for (let j = -rad; j <= rad; j++) for (let i = -rad; i <= rad; i++) {
      if (i * i + j * j > rad * rad) continue;
      const shade = i + j > rad * 0.6 ? 3 : i + j < -rad * 0.5 ? 2 : rr() < 0.25 ? 1 : 0;
      p.px(x + ox + i, base + oy + j, leaf[shade]);
    }
  }
}

function lamp(p, x, base) {
  for (let y = base - 15; y < base; y++) p.px(x, y, '#23302a');
  p.rect(x - 1, base - 2, 3, 2, '#23302a');
  p.rect(x - 1, base - 18, 3, 3, '#f6f4ec'); p.px(x - 1, base - 18, '#d9d6cc');
  p.px(x, base - 19, '#23302a');
  p.rect(x + 1, base - 13, 3, 6, '#9cc7ea'); p.px(x + 3, base - 13, '#6f9fca'); p.px(x + 2, base - 11, '#f4f1ea');   // Columbia banner
}

// The whole set: sky, Low Library, trees and lamps along College Walk, the brick walk itself.
// season: 'autumn' or 'spring'. Low Library is centred at cx.
export function buildSet(W, H, season) {
  const S = SEASONS[season], cx = Math.round(W * 0.6), p = new Painter(W, H);
  const sky = gradient(W, H, S.sky);
  p.data.set(sky.data);
  clouds(p, W, 5);
  library(p, cx);
  for (let k = -3; k <= 3; k++) {
    if (k === 0) continue;
    const x = cx + k * 66 + (k < 0 ? -58 : 58);
    if (x > -20 && x < W + 20) tree(p, x, 86, 10, S.leaf, 40 + k);
  }
  for (let y = 86; y < H; y++) for (let x = 0; x < W; x++) {                     // College Walk: granite kerb, brick
    const row = y - 87, brick = (x + (row % 2) * 3) % 6 === 0 || row % 3 === 2;
    p.px(x, y, y === 86 ? '#d6d3cc' : y === 87 ? '#a9a59c' : brick ? '#7e3b2e' : (x * 7 + y) % 11 === 0 ? '#b8604a' : '#a2503e');
  }
  for (let x = ((cx - 120) % 72 + 72) % 72; x < W; x += 72) lamp(p, x, 87);
  return { set: p, cx };
}

// Alma Mater on her pedestal, in front of the library centred at cx.
export function drawAlmaMater(ctx, env, cx) {
  ctx.drawImage(env.art(ALMA), cx - Math.floor(ALMA.w / 2), 72 - ALMA.h);
}

export function buildColumbia(W, H = 96) {
  const { set, cx } = buildSet(W, H, 'autumn');
  const r = rng(17), leaves = [];
  for (let n = 0; n < Math.round(W / 12); n++) {
    leaves.push({ x: r() * W, y: r() * 86, v: 10 + r() * 9, sway: 2 + r() * 3, ph: r() * 6, c: SEASONS.autumn.leaf[Math.floor(r() * 4)] });
  }
  return { W, H, cx, hx: Math.round(W * 0.34), leaves, layers: { set } };
}

export function renderColumbia(ctx, t, s, env) {
  const { W, H, canvases: c } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.set, 0, 0);
  drawAlmaMater(ctx, env, s.cx);
  for (const l of s.leaves) {                                                    // leaves drifting down
    const y = (l.y + t * l.v) % 92, x = l.x + Math.sin(t * 2 + l.ph) * l.sway - t * 4;
    const lx = Math.round(((x % W) + W) % W), ly = Math.round(y), flip = Math.floor(t * 5 + l.ph) % 2;
    ctx.fillStyle = l.c;
    ctx.fillRect(lx, ly, 2, 1); ctx.fillRect(lx + (flip ? 1 : 0), ly + 1, 1, 1);
  }
  const hero = env.hero('nyc'), stopAt = 1.1;                                    // walks in, stops, looks up
  const x = s.hx - Math.max(0, stopAt - t) * 26;
  ctx.drawImage(hero.canvases[t < stopAt ? Math.floor(t * 6) % 4 : 1], Math.round(x) - hero.anchorX, WALK - hero.footY);
}

export const columbia = { build: buildColumbia, render: renderColumbia };
