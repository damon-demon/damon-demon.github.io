// Chapter 3, shot 3: the PhD hooding. On the commencement stage, before a green curtain, the advisor
// lifts the doctoral hood over Yimeng's head and lays it on Yimeng's shoulders; the audience claps
// and cameras flash. (Columbia ended with a cap toss; this is deliberately quieter.)
import { Painter, rng, textRows } from '../pixels.js';
import { art } from '../kit.js';

const STAGE = 82;                              // the row Yimeng's shoes rest on
const HOLD = 0.35, PLACED = 1.0;               // the hood is held up, then over the head and down by PLACED
const GREEN = '#3a5a4c', WHITE = '#e8e8e4', VELVET = '#2c3c6a';

// The advisor, facing left: dark hair, glasses, a black doctoral gown with velvet facings, a tam.
const ADVISOR = art(`
.....KKKKKKKK.......
...KKKKKKKKKKKK.....
..KKKKKKKKKKKKKKY...
....HHHHHHHHH...Y...
...HhhHHHHHHHHH.Y...
..HHHHHHHHHHHHHH....
.HHHHHHHHHHHHHHHH...
.SHHHHHHHHHHHHHHHH..
.SSSSHHHHHHHHHHHHH..
.GGGGGSSSHHHHHHHHH..
.GSEGSSSSSSSeeHHHH..
SGGGGSSSSSSSeqeHHH..
.SSSSSSSSSSSSeHHHH..
.sSSSSSSSSSSSSHHH...
..sSSSmSSSSSSSHH....
...ssSSSSSSSSs......
........SSS.........
......VBBBBBBB......
......VBBBBBBBB.....
......VBBBBBBBB.....
.....VBBBBBBBBBB....
.....VBBBBBBBBBB....
.....VBBBBBBBBBBB...
....VBBBBBBBBBBBB...
....VBBBBBBBBBBBBB..
....VBBBBBBBBBBBBB..
...VBBBBBBBBBBBBBB..
...VBBBBBBBBBBBBBBB.
...BBBBBBBBBBBBBBBB.
...BBBBBBBBBBBBBBBB.
....OOOO....OOOO....
`, { K: '#16161c', Y: '#d9b44a', H: '#22202a', h: '#3a3644', S: '#e2b896', s: '#c89a7a', e: '#d4a684', q: '#a87a5e', E: '#241c22', G: '#2a2a30', m: '#9a5a50', B: '#1c1c22', V: VELVET, O: '#121216' }, '#0e0e12');

// The hood as the advisor holds it up by its velvet collar, the satin lining hanging below it:
// MSU green with a white chevron.
const HOOD_HELD = art(`
..VVVVVVVV..
.VV......VV.
.V........V.
.VV......VV.
..VVVVVVVV..
...VGGGGV...
...VGWWGV...
...VWGGWV...
...VGWWGV...
...VWGGWV...
....VGGV....
....VWWV....
.....VV.....
`, { V: VELVET, G: GREEN, W: WHITE }, '#14161c');

// Draw the hood as worn: over the shoulders and down the back of a hero sprite drawn at (x, y),
// where x is the sprite's left edge and bob the frame's 1px dip. Used by the door shot too.
export function drawHood(ctx, x, y, bob = 0) {
  const sx = x + 9, top = y + 11 + 17 + bob;                                        // the character's left edge; the shoulder row
  ctx.fillStyle = VELVET; ctx.fillRect(sx + 2, top - 1, 11, 2);                    // the velvet collar over the shoulders
  ctx.fillRect(sx, top, 6, 11);                                                     // the hood down the back, edged in velvet
  ctx.fillStyle = GREEN; ctx.fillRect(sx + 1, top + 1, 4, 9);                      // its satin lining, with a white chevron
  ctx.fillStyle = WHITE;
  for (const [dy, dx] of [[3, 1], [4, 2], [5, 3], [4, 4]]) ctx.fillRect(sx + dx, top + dy, 1, 1);
  ctx.fillRect(sx + 2, top + 8, 2, 1);
}

function stage(W, H, hx) {
  const p = new Painter(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = (x % 9 < 2) ? '#2a3a34' : (x % 9 < 5 ? '#33463e' : '#3a4e46');           // the curtain's folds
    if (y >= 74 && y < 84) c = y === 74 ? '#8a7e72' : (x + (y % 3) * 7) % 24 === 0 ? '#5e554c' : '#6e6458';   // the stage boards
    if (y === 84) c = '#2a2622';
    if (y > 84) c = '#121216';                                                      // the dark hall
    p.px(x, y, c);
  }
  for (let x = 0; x < W; x++) for (let y = 0; y < 8; y++) p.px(x, y, y === 7 ? '#8a7a4a' : '#2a3a34');   // a valance with a gold edge
  const px0 = hx + 72;                                                              // the lectern, lettered MSU
  for (let y = 56; y < 82; y++) for (let x = px0; x < px0 + 20; x++) p.px(x, y, y < 58 ? '#4a4038' : x === px0 || x === px0 + 19 ? '#3a322c' : '#5a5048');
  textRows('MSU').forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === '#') p.px(px0 + 5 + x, 64 + y, WHITE); });
  for (let y = 50; y < 56; y++) p.px(px0 + 4, y, '#2a2a30');                       // the microphone
  p.rect(px0 + 3, 49, 2, 2, '#4a4a52');
  for (const fx of [hx - 40, hx + 104]) {                                           // flowers at the stage's edge
    p.rect(fx, 76, 8, 6, '#4a4038');
    for (let n = 0; n < 16; n++) p.px(fx + (n * 5) % 9, 71 + (n * 3) % 5, n % 3 ? '#d8d8d2' : '#5a7a62');
  }
  return p;
}

export function buildHooding(W, H = 96) {
  const hx = Math.round(W * 0.34), r = rng(2025), heads = [];
  for (let x = -2; x < W; x += 9 + Math.floor(r() * 4)) heads.push({ x, y: 88 + Math.floor(r() * 4), ph: r() * 6, cap: r() < 0.4 });
  const flashes = Array.from({ length: 6 }, (_, i) => ({ x: Math.floor(r() * W), y: 86 + Math.floor(r() * 6), at: PLACED + 0.1 + i * 0.15 }));
  return { W, H, hx, heads, flashes, layers: { stage: stage(W, H, hx) } };
}

// Where the hood is: held between them, then lifted over Yimeng's head and down to the shoulders.
export function hoodAt(s, t) {
  const from = [s.hx + 20, 48], over = [s.hx + 9, 38], to = [s.hx + 7, 56];
  if (t < HOLD) return { x: from[0], y: from[1], worn: false };
  if (t >= PLACED) return { x: to[0], y: to[1], worn: true };
  const u = (t - HOLD) / (PLACED - HOLD), a = u < 0.5 ? from : over, b = u < 0.5 ? over : to, v = u < 0.5 ? u * 2 : u * 2 - 1;
  return { x: Math.round(a[0] + (b[0] - a[0]) * v), y: Math.round(a[1] + (b[1] - a[1]) * v), worn: false };
}

export function renderHooding(ctx, t, s, env) {
  const { W, H, canvases: c, hx } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.stage, 0, 0);
  ctx.globalAlpha = 0.12; ctx.fillStyle = '#fff4d8';                                // a spotlight on the two of them
  for (let k = 0; k < 4; k++) ctx.fillRect(hx - 20 + k * 6, 8 + k * 10, 90 - k * 12, 76 - k * 10);
  ctx.globalAlpha = 1;
  const hero = env.hero('phd', 'walk', 'muted'), x = hx - hero.anchorX, y = STAGE - hero.footY;
  ctx.drawImage(hero.canvases[1], x, y);
  const advisor = env.art(ADVISOR), ax = hx + 30, ay = STAGE - advisor.height + 1;
  ctx.drawImage(advisor, ax, ay);
  const hood = hoodAt(s, t);
  if (hood.worn) drawHood(ctx, x, y);
  else {
    const held = env.art(HOOD_HELD), hxp = hood.x, hyp = hood.y;
    ctx.drawImage(held, hxp - 6, hyp - 5);
    const x0 = ax + 7, y0 = ay + 20, x1 = hxp + 4, y1 = hyp - 3, n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let k = 0; k <= n; k++) {                                                  // a sleeve up to the hood's collar, with a velvet bar
      ctx.fillStyle = Math.abs(k - n / 2) < 1 ? VELVET : '#1c1c22';
      ctx.fillRect(Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), 2, 2);
    }
    ctx.fillStyle = '#e2b896'; ctx.fillRect(x1, y1, 2, 2);
  }
  // the audience: heads in the dark, hands up clapping once the hood is on
  for (const h of s.heads) {
    const bob = t > PLACED ? Math.round(Math.sin(t * 14 + h.ph)) : 0;
    ctx.fillStyle = '#26262c'; ctx.fillRect(h.x, h.y + bob, 6, 8);
    if (h.cap) { ctx.fillStyle = '#1a1a20'; ctx.fillRect(h.x - 1, h.y - 1 + bob, 8, 1); }
    if (t > PLACED && Math.sin(t * 14 + h.ph) > 0.3) { ctx.fillStyle = '#3a3a42'; ctx.fillRect(h.x + 1, h.y - 3 + bob, 2, 2); ctx.fillRect(h.x + 4, h.y - 3 + bob, 2, 2); }
  }
  for (const f of s.flashes) {                                                      // cameras going off
    const a = 1 - Math.abs(t - f.at) / 0.08;
    if (a > 0) { ctx.globalAlpha = a; ctx.fillStyle = '#ffffff'; ctx.fillRect(f.x - 2, f.y, 5, 1); ctx.fillRect(f.x, f.y - 2, 1, 5); ctx.globalAlpha = 1; }
  }
}

export const hooding = { build: buildHooding, render: renderHooding };
