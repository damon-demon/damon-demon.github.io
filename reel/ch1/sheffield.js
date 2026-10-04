// Chapter 1, shot 1: Sheffield in drizzle. Red-brick terraces, Firth Court, a red phone box,
// Victorian street lamps, wet pavement; Yimeng walks under an umbrella.
import { Painter, rng } from '../pixels.js';
import { tile, gradient, ridge, drawHero, art } from '../kit.js';

const SPEED = 26;                      // walk speed at parallax 1, px/s
const GROUND = 88;                     // the row Yimeng's shoes rest on

const SKY = [['#56617a', 0], ['#66718a', 0.22], ['#7a8599', 0.45], ['#8e98a9', 0.68], ['#a3acb9', 0.88]];

const PHONE_BOX = art(`
..RRRRRR..
.RRRRRRRR.
RRrrrrrrRR
RRCCCCCCRR
RRRRRRRRRR
RGWGWGWGWR
RGWGWGWGWR
RGGGGGGGGR
RGWGWGWGWR
RGWGWGWGWR
RGGGGGGGGR
RGWGWGWGWR
RGWGWGWGWR
RGGGGGGGGR
RGWGWGWGWR
RGWGWGWGWR
RRRRRRRRRR
RRRRRRRRRR
RRRRRRRRRR
RRRRRRRRRR
dddddddddd
`, { R: '#c4202c', r: '#e8414b', C: '#f2efe6', G: '#8f1820', W: '#3a4352', d: '#5a1218' }, '#2a1f2d');

const LAMP = art(`
.KK.
KYYK
KYYK
.KK.
..K.
..K.
..K.
..K.
..K.
..K.
..K.
..K.
..K.
..K.
..K.
..K.
..K.
..K.
..K.
..K.
.KKK
KKKK
`, { K: '#2e3a34', Y: '#f4d08a' });

function terraces(p, x0, x1, base) {
  // two-up two-down terraced houses, 22 px wide, alternating brick tones and door colours
  const DOORS = ['#2f4f3e', '#26365e', '#6b1f2a', '#2a2a30'];
  for (let n = 0, x = x0; x < x1; n++, x += 22) {
    const brick = n % 2 ? '#94473a' : '#9c4d3e', mortar = '#7d3a30';
    const top = base - 29;
    for (let j = top; j < base; j++) for (let i = x; i < x + 22; i++) p.wpx(i, j, (j - top) % 3 === 0 && (i + (j >> 1)) % 4 === 0 ? mortar : brick);
    for (let i = x - 1; i < x + 23; i++) p.wpx(i, top - 1, '#3e4250');          // slate roof edge
    for (let k = 0; k < 6; k++) for (let i = x + k; i < x + 22 - k; i++) p.wpx(i, top - 2 - k, k % 2 ? '#4a4f5c' : '#535866');
    p.rect(x + 16, top - 11, 3, 6, '#7a3d32'); p.rect(x + 16, top - 12, 1, 1, '#b46a4a'); p.rect(x + 18, top - 12, 1, 1, '#b46a4a');
    for (const [wx, wy] of [[x + 3, top + 4], [x + 13, top + 4], [x + 13, top + 16]]) {
      p.rect(wx - 1, wy - 1, 7, 9, '#e8e4dc');                                    // sash frame
      p.rect(wx, wy, 5, 7, '#2f3646');
      p.rect(wx, wy + 3, 5, 1, '#e8e4dc');
      p.wpx(wx + 1, wy + 1, '#59637a');
    }
    p.rect(x + 3, top + 15, 6, 14, '#e8e4dc'); p.rect(x + 4, top + 16, 4, 13, DOORS[n % 4]);
    p.wpx(x + 7, top + 23, '#d9b45a');
  }
}

function tree(p, cx, base, r) {
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
    const d = i * i + j * j * 1.3;
    if (d <= r * r) p.wpx(cx + i, base - 9 - r + j, d > (r - 1.5) * (r - 1.5) && j > 0 ? '#3f5a3a' : ((i + j) % 3 === 0 ? '#5d7d4e' : '#4e6b44'));
  }
  p.rect(cx - 1, base - 9, 2, 9, '#4a3a2c');
}

function firthCourt(p, x, base) {
  // the University of Sheffield's Firth Court: red brick, stone bands, arched windows, clock tower
  const W = 66, top = base - 40;
  for (let j = top; j < base; j++) for (let i = x; i < x + W; i++) p.wpx(i, j, (j - top) % 3 === 0 && (i + (j >> 1)) % 4 === 0 ? '#86392d' : '#a5483a');
  for (const y of [top, top + 13, top + 26]) p.rect(x, y, W, 1, '#d9cdb5');           // stone string courses
  for (let k = 0; k < 7; k++) for (let i = x - 1 + k; i < x + W + 1 - k; i++) p.wpx(i, top - 1 - k, k % 2 ? '#4a4f5c' : '#535866');
  for (let col = 0; col < 10; col++) {                                                 // arched windows, three floors
    const wx = x + 3 + col * 6 + (col >= 5 ? 4 : 0);
    if (col === 4 || col === 5) continue;                                              // tower bay
    for (const wy of [top + 3, top + 16, top + 29]) {
      p.rect(wx, wy + 1, 3, 7, '#2f3646'); p.wpx(wx + 1, wy, '#2f3646');
      p.rect(wx - 1, wy + 8, 5, 1, '#d9cdb5'); p.wpx(wx + 1, wy + 2, '#59637a');
    }
  }
  const tx = x + 27, tw = 12, ttop = top - 20;                                         // tower
  for (let j = ttop; j < base; j++) for (let i = tx; i < tx + tw; i++) p.wpx(i, j, (j - ttop) % 3 === 0 && i % 4 === 0 ? '#86392d' : '#a5483a');
  p.rect(tx - 1, ttop, tw + 2, 2, '#d9cdb5'); p.rect(tx - 1, top - 8, tw + 2, 1, '#d9cdb5');
  for (let k = 0; k < 9; k++) for (let i = tx - 1 + Math.ceil(k * 0.75); i < tx + tw + 1 - Math.ceil(k * 0.75); i++) p.wpx(i, ttop - 1 - k, k % 2 ? '#3e4250' : '#4a4f5c');
  p.wpx(tx + 6, ttop - 11, '#c9a14a'); p.wpx(tx + 6, ttop - 12, '#c9a14a');
  for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (i * i + j * j <= 5) p.wpx(tx + 6 + i, ttop + 6 + j, '#efe8d6');
  p.wpx(tx + 6, ttop + 5, '#2a2a30'); p.wpx(tx + 6, ttop + 6, '#2a2a30'); p.wpx(tx + 7, ttop + 6, '#2a2a30');
  p.rect(tx + 4, ttop + 11, 4, 8, '#2f3646'); p.wpx(tx + 5, ttop + 10, '#2f3646'); p.wpx(tx + 6, ttop + 10, '#2f3646');
  p.rect(tx + 3, base - 12, 6, 12, '#d9cdb5'); p.rect(tx + 4, base - 11, 4, 11, '#3a2a22');  // stone doorway
}

export function buildSheffield(W, H = 96) {
  const TW = W * 2, layers = {};
  layers.sky = gradient(W, 80, SKY);

  const cl = new Painter(TW, 60);                                       // low rain clouds (0.04)
  const rc = rng(31);
  for (let n = 0; n < 14; n++) {
    const cx = rc() * TW, cy = 4 + rc() * 34, len = 30 + rc() * 70;
    for (let x = 0; x < len; x++) cl.wpx(cx + x, cy, rc() < 0.5 ? '#5f6a80' : '#68738a');
    for (let x = 6; x < len - 6; x++) cl.wpx(cx + x, cy + 1, '#a0a9b6');
  }
  layers.clouds = cl;

  const hills = new Painter(TW, 80);                                    // Peak District moors (0.12)
  const h1 = ridge(TW, 14, [[4, 2, 0.3], [2, 5, 1.2], [1, 11, 0.4]]);
  const h2 = ridge(TW, 8, [[3, 3, 2.1], [1.5, 7, 0.2]]);
  for (let i = 0; i < TW; i++) {
    for (let j = 0; j < h1[i] + 30; j++) hills.px(i, 79 - j, j > h1[i] + 28.5 ? '#8a947f' : '#727c6a');
    for (let j = 0; j < h2[i] + 26; j++) hills.px(i, 79 - j, j > h2[i] + 24.5 ? '#6f7766' : '#5f6858');
  }
  layers.hills = hills;

  const st = new Painter(TW, H);                                        // street front (0.5)
  const fc = Math.round(W * 0.45);
  terraces(st, fc + 80, fc + TW - 14, 79);
  tree(st, fc - 7, 79, 7);
  firthCourt(st, fc, 79);
  tree(st, fc + 73, 79, 7);
  layers.street = st;

  const pv = new Painter(TW, H);                                        // pavement and road (1.0)
  for (let j = 79; j < H; j++) for (let i = 0; i < TW; i++) {
    let c = j < 82 ? '#8a8f98' : j < 89 ? ((i + (j - 82) * 0) % 14 === 0 ? '#6f747d' : '#7d828c') : j < 91 ? '#5d626b' : '#3e434d';
    if (j === 79) c = '#9aa0a9';
    if (j >= 82 && j < 89 && (j - 82) % 4 === 3) c = '#6f747d';
    if (j >= 91 && (i * 13 + j * 7) % 29 === 0) c = '#6b7280';           // wet road glints
    pv.px(i, j, c);
  }
  const rp = rng(9);
  for (let n = 0; n < 9; n++) {                                         // puddles on the pavement
    const x = rp() * TW, y = 84 + Math.floor(rp() * 4), len = 6 + rp() * 10;
    for (let k = 0; k < len; k++) pv.wpx(x + k, y, k % 3 ? '#9ba6b8' : '#b9c3d1');
  }
  layers.pavement = pv;
  return { W, H, TW, layers, phoneX: Math.round(W * 0.34) + 74, lampEvery: 96 };
}

export function renderSheffield(ctx, t, s, env) {
  const { W, H, canvases: c } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  tile(ctx, c.clouds, t * SPEED * 0.04, 0);
  tile(ctx, c.hills, t * SPEED * 0.12, 0);
  tile(ctx, c.street, t * SPEED * 0.5, 0);
  const off = t * SPEED;
  tile(ctx, c.pavement, off, 0);
  const lamp = env.art(LAMP);
  for (let x = 20 - (off % s.lampEvery); x < W + 10; x += s.lampEvery) ctx.drawImage(lamp, Math.round(x), 80 - lamp.height);
  const box = env.art(PHONE_BOX);
  ctx.drawImage(box, Math.round(s.phoneX - off), 81 - box.height);
  drawHero(ctx, env.hero('sheffield'), Math.floor(t * 6), Math.round(W * 0.34), GROUND);
  // drizzle: thin streaks slanting left, in front of everything
  ctx.fillStyle = 'rgba(205, 216, 230, 0.45)';
  const rr = rng(77);
  for (let n = 0; n < 90; n++) {
    const x0 = rr() * (W + 40), y0 = rr() * H, v = 150 + rr() * 60;
    const y = (y0 + t * v) % (H + 6) - 6, x = ((x0 - t * (SPEED + 30) - y * 0.35) % (W + 40) + W + 40) % (W + 40) - 20;
    ctx.fillRect(Math.round(x), Math.round(y), 1, 3);
  }
}

export const sheffield = { build: buildSheffield, render: renderSheffield };
