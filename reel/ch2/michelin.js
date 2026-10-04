// Chapter 2, shot 3: dinner at a three-star restaurant. A gold-and-burgundy room under a crystal
// chandelier, the skyline in the windows. Yimeng, in the burgundy blazer, sits at a white table; the
// waiter lifts a silver cloche on one tiny bite in the middle of a huge plate. The courses run from
// 1/12 to 12/12 as the candle burns down, the sommelier fills a champagne tower, and the bill
// unrolls all the way down to the floor.
import { Painter, rng } from '../pixels.js';
import { art, label } from '../kit.js';

const FLOOR = 90, SEAT = 84, TOP = 76;        // floor, chair cushion and table-top rows
const LIFT = [0.25, 0.7];                     // the waiter lifts the cloche
const COURSES = [0.7, 1.75];                  // course 1 shows at LIFT; 2..12 tick by over this span
const POUR = [1.75, 2.35];                    // the champagne tower fills, top glass first
const BILL = [2.35, 2.95];                    // the bill drops to the floor and runs along it
const GOLD = '#d9b44a', DEEP = '#9c7c2c', CLOTH = '#f4f1ea', FOLD = '#d9d4ca';

// The waiter, facing left: slicked hair, a thin moustache, tailcoat and bow tie. The sommelier wears
// the same coat with grey hair.
const STAFF_ROWS = `
......HHH...........
....HHHHHHHHH.......
...HhhHHHHHHHHH.....
..HHHHHHHHHHHHHH....
.HHHHHHHHHHHHHHHH...
.HHHHHHHHHHHHHHHH...
.SHHHHHHHHHHHHHHHH..
.SSSSHHHHHHHHHHHHH..
.SSSSSSSSHHHHHHHHH..
.SSESSSSSSSSeeHHHH..
SSSSSSSSSSSSeqeHHH..
.SSSSSSSSSSSSeHHHH..
.sMMSSSSSSSSSSHHH...
..sSSSSSSSSSSSHH....
...ssSSSSSSSSs......
........SSS.........
......WbWKKKK.......
......WWWKKKKK......
......KWWKKKKK......
......KWWKKKKK......
......KKWKKKKKK.....
......KKKKKKKKKK....
......KKKKKKKKKKK...
.......PPPPPPKKKK...
.......PPP..PPP.....
.......PPP..PPP.....
.......PPP..PPP.....
.......PPP..PPP.....
.......PPP..PPP.....
.......PPP..PPP.....
.......PPP..PPP.....
.......PPP..PPP.....
.......PPP..PPP.....
.......PPP..PPP.....
......OOOO.OOOO.....
`;
const STAFF = { E: '#241c22', S: '#f0c8a4', s: '#d9a885', e: '#e0b08c', q: '#b88466', M: '#3a2a22', W: '#f6f4ee', b: '#1c1c22', K: '#1a1a20', P: '#22222a', O: '#121216' };
const WAITER = art(STAFF_ROWS, { ...STAFF, H: '#2a2026', h: '#4a3a40' }, '#141016');
const SOMMELIER = art(STAFF_ROWS, { ...STAFF, H: '#9a9aa4', h: '#c4c4cc', M: '#9a9aa4' }, '#141016');

const CLOCHE = art(`
......kk......
....SSSSSS....
..SSSSSSSSSS..
.SWSSSSSSSSSS.
.SWSSSSSSSSSs.
SWSSSSSSSSSSss
SSSSSSSSSSSSss
dddddddddddddd
`, { k: '#e6e8ee', S: '#c9ced8', W: '#ffffff', s: '#9aa0ac', d: '#7f8590' }, '#3a3d46');

const COUPE = art(`
#####
.###.
..#..
.###.
`, { '#': '#c8dce6' });
const COUPE_FULL = art(`
fffff
.fff.
..#..
.###.
`, { '#': '#c8dce6', f: '#f2d27a' });

const BOTTLE = art(`
.....GGG.
....GGGGG
...GGGGGG
..GGGGGG.
..GGGG...
.gGG.....
ggg......
gg.......
`, { g: '#e2bf55', G: '#1f3a2a' }, '#0e140f');

// one bite per course: a dab of colour in the middle of the plate
const BITES = ['#e8414b', '#f2c21e', '#4f9a4a', '#f4f1ea', '#c86a28', '#7b3fa0', '#2c5aa0', '#e8a0b0', '#3a2a22', '#a8d070', '#ffd75e', '#d63c8a'];

function room(W, H, hx) {
  const p = new Painter(W, H), r = rng(31), lx = hx + 36;                       // lx: the light pool's centre
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot((x - lx) / 1.7, (y - 72) * 1.1), warm = d < 30 || (d < 40 && (x + y) % 2 === 0) || (d < 48 && (x + y) % 4 === 0);   // candlelight warms the wall near the table
    let c = ((x >> 2) + (y >> 2)) % 2 === 0 && (x + y) % 3 === 0 ? (warm ? '#3a1c20' : '#24121a') : (warm ? '#2c1418' : '#1a0d12');   // damask
    if (y === 12 || y === 15) c = GOLD;
    if (y === 13 || y === 14) c = (x % 6 < 3) ? DEEP : '#5a4418';                // crown moulding
    if (y >= 64 && y < 80) c = (x % 26 === 0 || x % 26 === 25 || y === 67 || y === 77) && y > 66 ? DEEP : warm ? '#3a1a1e' : '#2a1418';
    if (y === 64) c = GOLD;
    if (y === 65) c = DEEP;
    if (y >= 80) c = ((x + y * 2) % 12 === 0 || (x - y * 2) % 12 === 0) ? '#6a3a22' : (x + y) % 2 ? '#3a1a1e' : '#341618';   // carpet
    p.px(x, y, c);
  }
  const windowAt = (x0) => {                                                    // a tall arched window on the skyline
    for (let y = 22; y < 62; y++) for (let x = x0; x < x0 + 34; x++) {
      const arch = y < 30 && Math.hypot(x - x0 - 16.5, (y - 30) * 2.1) > 17;
      if (arch) continue;
      let c = y < 38 ? '#0a0b16' : '#0e1022';
      if (y > 40 && ((x * 3 + y * 5) % 11 === 0 || (x % 4 === 0 && y % 3 === 0 && r() < 0.5))) c = r() < 0.5 ? '#c9a24a' : '#8a6e30';
      if (y > 52 && (x + y) % 3 === 0) c = '#14141c';
      p.px(x, y, c);
    }
    for (let y = 22; y < 62; y++) { p.px(x0 + 16, y, '#3a2a14'); p.px(x0 + 17, y, '#3a2a14'); }
    for (let x = x0 - 1; x <= x0 + 34; x++) p.px(x, 62, GOLD);
    for (const side of [0, 1]) for (let y = 17; y < 64; y++) for (let k = 0; k < 8; k++) {     // swagged curtains
      const x = side ? x0 + 34 - k + 4 : x0 + k - 4, tie = y > 48 && y < 51;
      p.px(x, y, tie ? GOLD : (k + Math.floor(y / 3)) % 3 === 0 ? '#4a1020' : '#7a1e30');
    }
  };
  const mirrorAt = (x0) => {                                                    // a gilt mirror between two sconces
    for (let y = 26; y < 58; y++) for (let x = x0; x < x0 + 20; x++) {
      const edge = x === x0 || x === x0 + 19 || y === 26 || y === 57;
      p.px(x, y, edge ? GOLD : (x + y) % 9 === 0 ? '#5a4a4e' : '#3a2e34');
    }
    for (let k = 0; k < 6; k++) p.px(x0 + 4 + k * 2, 29 + k, '#6a5a60');         // a streak of reflection
    for (const sx of [x0 - 7, x0 + 26]) {
      p.rect(sx, 40, 2, 5, GOLD); p.rect(sx - 1, 37, 4, 3, '#fff1c4'); p.px(sx, 36, '#ffd27a');
    }
  };
  windowAt(hx - 128); windowAt(hx + 132);
  if (W > 420) windowAt(hx + 262);
  mirrorAt(hx - 58); mirrorAt(hx + 196);
  for (let x = hx + 236; x < W; x += 400) {                                     // a tall arrangement of white and pink flowers
    p.rect(x - 2, 50, 5, 14, GOLD); p.rect(x - 1, 51, 3, 13, DEEP);
    for (let n = 0; n < 60; n++) {
      const a = r() * Math.PI, d = r() * 11;
      p.px(Math.round(x + Math.cos(a) * d * 1.3), Math.round(50 - Math.sin(a) * d), r() < 0.3 ? '#3d6e34' : r() < 0.5 ? '#f4c0d0' : '#fbf6ee');
    }
  }
  // other tables further back, each with a candle and two diners in silhouette
  for (let x = hx - 92; x < W + 30; x += 74) {
    if (x > hx - 30 && x < hx + 120) continue;
    for (let y = 72; y < 82; y++) for (let k = -9; k <= 9; k++) p.px(x + k, y, y === 72 ? '#d8d2c4' : (k + y) % 4 ? '#b9b2a4' : '#a39c8e');
    p.rect(x - 1, 68, 2, 4, '#e8e2d2'); p.px(x - 1, 67, '#ffd27a');
    for (const dx of [-15, 11]) {
      for (let y = 63; y < 82; y++) for (let k = 0; k < 5; k++) p.px(x + dx + k, y, y < 68 ? '#3a2a2a' : '#2a1e22');
      p.rect(x + dx, 58, 5, 5, '#3a2a2a');
    }
  }
  return p;
}

function table(W, H, hx) {
  const p = new Painter(W, H);
  for (let y = TOP; y < FLOOR + 2; y++) for (let x = hx + 15; x <= hx + 57; x++) {
    let c = y === TOP ? '#ffffff' : (x - hx) % 7 === 0 && y > TOP + 3 ? FOLD : CLOTH;
    if (y > FLOOR - 3) c = (x - hx) % 7 === 0 ? FOLD : '#e8e4da';
    p.px(x, y, c);
  }
  for (const [x0, x1] of [[hx + 22, hx + 23], [hx + 44, hx + 46]]) for (let x = x0; x <= x1; x++) p.px(x, TOP, '#aab0bc');   // cutlery glints
  return p;
}

function chair(W, H, hx) {
  const p = new Painter(W, H);
  for (let y = 62; y < FLOOR; y++) for (let x = hx + 1; x <= hx + 3; x++) p.px(x, y, x === hx + 1 ? '#3a1e12' : '#5a3020');
  for (let y = 61; y < 63; y++) for (let x = hx; x <= hx + 4; x++) p.px(x, y, GOLD);
  for (let x = hx + 1; x <= hx + 17; x++) { p.px(x, SEAT, '#8a2438'); p.px(x, SEAT + 1, '#5e1727'); p.px(x, SEAT + 2, '#3a1e12'); }
  for (let y = SEAT + 3; y < FLOOR; y++) { p.px(hx + 2, y, '#3a1e12'); p.px(hx + 16, y, '#3a1e12'); }
  return p;
}

function chandelier(W, H, cx) {
  const p = new Painter(W, 44);
  for (let y = 0; y < 16; y++) p.px(cx, y, DEEP);
  for (const [ry, hw] of [[21, 10], [27, 18]]) {                                 // two gilt rings
    for (let k = -hw; k <= hw; k++) { p.px(cx + k, ry, GOLD); p.px(cx + k, ry + 1, DEEP); }
    for (let k = -hw; k <= hw; k += Math.round(hw / 2.5)) {
      for (let y = 16; y < ry; y++) p.px(Math.round(cx + k * (y - 16) / (ry - 16)), y, GOLD);   // arms
      p.rect(cx + k - 1, ry - 3, 3, 3, '#f4f1ea'); p.px(cx + k, ry - 4, '#ffe6a6');   // candle bulbs
      for (let y = ry + 2; y < ry + 5 + (Math.abs(k) % 3); y++) p.px(cx + k, y, y % 2 ? '#e8f2fa' : '#b8cce0');   // crystal drops
    }
  }
  for (let k = -16; k <= 16; k += 2) p.px(cx + k, 30, (k / 2) % 2 ? '#dfeaf4' : '#b8cce0');   // a fringe of crystals
  for (let y = 31; y < 37; y++) p.px(cx, y, y % 2 ? '#e8f2fa' : '#b8cce0');
  return p;
}

export function buildMichelin(W, H = 96) {
  const hx = Math.round(W * 0.34);
  return {
    W, H, hx, plate: hx + 33, tower: hx + 81,
    layers: { room: room(W, H, hx), chair: chair(W, H, hx), table: table(W, H, hx), chandelier: chandelier(W, H, hx + 36) },
    sparkle: Array.from({ length: 13 }, (_, i) => [hx + 36 - 18 + i * 3, 24 + (i % 3) * 3]),
  };
}

const labels = new Map();
function text(str, ink) {
  if (!labels.has(str + ink)) labels.set(str + ink, label(str, ink));
  return labels.get(str + ink);
}

const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : 1 - (1 - u) * (1 - u));

// Which course is on the plate at time t: none before the cloche lifts, then 1 to 12.
export function courseAt(t) {
  if (t < LIFT[0]) return 0;
  if (t < COURSES[0]) return 1;
  return Math.min(12, 2 + Math.floor((t - COURSES[0]) / ((COURSES[1] - COURSES[0]) / 11)));
}

// A sleeve from shoulder to hand, 2px thick, ending in a white glove.
function arm(ctx, x0, y0, x1, y1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  ctx.fillStyle = '#1a1a20';
  for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 2, 2);
  ctx.fillStyle = '#f6f4ee'; ctx.fillRect(x1, y1, 2, 2);
}

// How much of the bill has unrolled: `drop` px down the tablecloth, then `run` px along the floor.
export function billAt(s, t) {
  const u = Math.min(1, Math.max(0, (t - BILL[0]) / (BILL[1] - BILL[0]))), len = Math.round(u * (s.hx + 30));
  const drop = Math.min(len, FLOOR - TOP);
  return { drop, run: len - drop };
}

function glow(ctx, x, y, r, a) {
  ctx.fillStyle = `rgba(255, 207, 122, ${a})`;
  for (let k = r; k > 0; k -= 2) ctx.fillRect(Math.round(x - k), Math.round(y - k / 2), k * 2, k);
}

export function renderMichelin(ctx, t, s, env) {
  const { W, H, canvases: c, hx, plate, tower } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.room, 0, 0);
  ctx.drawImage(c.chandelier, 0, 0);
  s.sparkle.forEach(([x, y], i) => {                                            // crystal glints
    if ((Math.floor(t * 10) + i * 3) % 5 === 0) { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(x), y, 1, 1); }
  });
  glow(ctx, hx + 36, 24, 22, 0.05);
  for (let k = 0; k < 14; k++) {                                                // gold dust drifting in the light
    const x = (hx - 40 + k * 37 + t * (6 + (k % 3) * 3)) % (W + 20) - 10, y = 20 + ((k * 23 + t * 5) % 50);
    if ((Math.floor(t * 8) + k) % 3) { ctx.fillStyle = k % 2 ? '#f2d27a' : '#fff1c4'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
  }
  ctx.drawImage(c.chair, 0, 0);
  const hero = env.hero('michelin', 'sit');
  ctx.drawImage(hero.canvases[0], hx - hero.anchorX, SEAT - 1 - hero.seatY);
  // the waiter behind the table, and the sommelier beside the champagne tower
  const lift = ease((t - LIFT[0]) / (LIFT[1] - LIFT[0])) * 9, course = courseAt(t);
  const waiter = env.art(WAITER), wx = plate + 10, wy = FLOOR - waiter.height + 1;
  ctx.drawImage(waiter, wx, wy);
  const somm = env.art(SOMMELIER), sx = tower + 16;
  ctx.drawImage(somm, sx, FLOOR - somm.height + 1);
  ctx.drawImage(c.table, 0, 0);
  // the huge plate and its one tiny bite
  ctx.fillStyle = '#b9b4aa'; ctx.fillRect(plate - 12, TOP - 1, 25, 1);           // a wide plate: rim, well, rim
  ctx.fillStyle = '#ffffff'; ctx.fillRect(plate - 12, TOP - 2, 25, 1); ctx.fillRect(plate - 10, TOP - 3, 21, 1);
  ctx.fillStyle = '#e9e6df'; ctx.fillRect(plate - 6, TOP - 2, 13, 1);
  if (course > 0) {
    ctx.fillStyle = BITES[course - 1]; ctx.fillRect(plate, TOP - 4, 2, 1);
    ctx.fillStyle = '#4f9a4a'; ctx.fillRect(plate + 1, TOP - 5, 1, 1);
    ctx.fillStyle = '#8a2438'; ctx.fillRect(plate - 3, TOP - 3, 1, 1); ctx.fillRect(plate + 4, TOP - 3, 1, 1);   // two dots of sauce
  }
  // the cloche, raised by the waiter's hand
  const cl = env.art(CLOCHE), cy = Math.round(TOP - 2 - cl.height - lift);
  ctx.drawImage(cl, plate - Math.floor(cl.width / 2) + 1, cy);
  arm(ctx, wx + 8, wy + 19, plate + 2, cy - 1);
  if (t > LIFT[1] && t < LIFT[1] + 0.25) {                                       // a glint as it comes up
    ctx.fillStyle = '#ffffff'; ctx.fillRect(plate - 3, cy + 2, 1, 1); ctx.fillRect(plate - 4, cy + 3, 3, 1);
  }
  // the candle burns down as the courses go by
  const wax = Math.max(2, 7 - Math.floor(course / 2.4)), fx = hx + 19;
  ctx.fillStyle = GOLD; ctx.fillRect(fx - 1, TOP - 2, 3, 2);
  ctx.fillStyle = '#f4efe2'; ctx.fillRect(fx, TOP - 2 - wax, 1, wax);
  ctx.fillStyle = Math.floor(t * 12) % 2 ? '#ffd27a' : '#fff1c4'; ctx.fillRect(fx, TOP - 4 - wax, 1, 2);
  glow(ctx, fx, TOP - 4 - wax, 10, 0.07);
  // the champagne tower: fifteen coupes on a side table, filled top first
  ctx.fillStyle = CLOTH; ctx.fillRect(tower - 17, TOP + 2, 35, FLOOR - TOP - 1);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(tower - 17, TOP + 2, 35, 1);
  const filled = (row) => t >= POUR[0] + (row + 1) * ((POUR[1] - POUR[0]) / 5);
  for (let row = 0; row < 5; row++) for (let k = 0; k <= row; k++) {
    const gx = tower - 2 - row * 3 + k * 6, gy = TOP + 2 - 4 - (4 - row) * 4;
    ctx.drawImage(env.art(filled(row) ? COUPE_FULL : COUPE), gx, gy);
  }
  const pouring = t >= POUR[0] && t < POUR[1] + 0.2, by = TOP - 30;
  if (pouring) {
    const b = env.art(BOTTLE);
    ctx.drawImage(b, tower - 1, by);
    ctx.fillStyle = '#f2d27a';
    for (let y = by + 9; y < TOP - 18; y++) if ((y + Math.floor(t * 20)) % 3) ctx.fillRect(tower, y, 1, 1);   // the pour
    for (let k = 0; k < 6; k++) {                                                 // spill running down the sides
      const y = TOP - 18 + ((t * 30 + k * 4) % 20), spread = Math.floor((y - (TOP - 18)) / 4) * 3 + 3;
      ctx.fillRect(tower + (k % 2 ? spread : -spread), Math.round(y), 1, 1);
    }
  }
  arm(ctx, sx + 7, FLOOR - somm.height + 20, pouring ? tower + 6 : sx + 2, pouring ? by + 3 : FLOOR - somm.height + 24);
  // the bill: down the tablecloth to the floor, then along it under the chair
  if (t >= BILL[0]) {
    const { drop, run } = billAt(s, t), bx = hx + 13;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, TOP, 5, drop);
    if (run) ctx.fillRect(bx + 5 - run, FLOOR - 1, run, 3);
    ctx.fillStyle = '#9a958c';
    for (let y = TOP + 1; y < TOP + drop; y += 2) ctx.fillRect(bx + 1, y, (y % 6) ? 3 : 2, 1);
    for (let x = bx + 4 - run; x < bx; x += 3) ctx.fillRect(x, FLOOR, 2, 1);
    ctx.fillStyle = '#1a1a20'; ctx.fillRect(bx - 1, TOP - 1, 7, 2);              // the bill folder
    if (drop + run > 30) {                                                        // a bead of sweat
      const top = SEAT - 1 - hero.seatY;
      ctx.fillStyle = '#bfe3f2'; ctx.fillRect(hx + 3, top + 17, 1, 2); ctx.fillRect(hx + 2, top + 18, 1, 1);
    }
  }
  // the course counter
  if (course > 0) {
    const n = env.art(text(`${course}/12`, '#f4f1e6')), k = env.art(text('COURSE', GOLD));
    const bw = k.width + n.width + 11, bx = W - bw - 6;
    ctx.fillStyle = 'rgba(11, 11, 12, 0.75)'; ctx.fillRect(bx, 20, bw, 9);
    ctx.fillStyle = GOLD; ctx.fillRect(bx, 20, 1, 9);
    ctx.drawImage(k, bx + 4, 22); ctx.drawImage(n, bx + k.width + 8, 22);
  }
}

export const michelin = { build: buildMichelin, render: renderMichelin };
