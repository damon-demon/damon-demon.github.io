// Chapter 2, shot 3: eating across New York. One long shot through four restaurants side by side,
// left to right: French, Japanese, Italian, Chinese. At each, Yimeng sits down to its signature
// moment: a cloche lifted on one tiny bite, nigiri laid down piece by piece, white truffle shaved
// over pasta, Peking duck carved at the table. Then Yimeng eats, dashes on to the next and leaves an
// empty plate behind. At the last table the bill unrolls to the floor and runs back under all four.
import { Painter, rng } from '../pixels.js';
import { art } from '../kit.js';

const FLOOR = 90, SEAT = 84, TOP = 76;        // floor, seat and table-top rows
const ROOM = 100, WALL = 4, MARGIN = 120;     // a restaurant's width, the pillars between, the dark ends
const ROW = 4 * ROOM + 5 * WALL;              // the four restaurants, wall to wall
const EAT = 0.8, DASH = 0.45, BILL = 0.45;    // seconds at each table, running to the next, unrolling the bill
const GOLD = '#d9b44a', DEEP = '#9c7c2c', CLOTH = '#f4f1ea', FOLD = '#d9d4ca';

export const roomX = (k) => MARGIN + WALL + k * (ROOM + WALL);   // a restaurant's left wall, world x
export const seatX = (k) => roomX(k) + 4;                        // where Yimeng sits in it (left edge)
const startAt = (k) => k * (EAT + DASH);                         // when Yimeng sits down there

const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : (1 - Math.cos(u * Math.PI)) / 2);

// Where Yimeng is at time t: seated at a table, or running between two.
export function heroAt(t) {
  for (let k = 0; k < 3; k++) {
    const leave = startAt(k) + EAT;
    if (t < leave) return { x: seatX(k), seated: true, room: k };
    if (t < leave + DASH) return { x: seatX(k) + (seatX(k + 1) - seatX(k)) * ease((t - leave) / DASH), seated: false, room: k };
  }
  return { x: seatX(3), seated: true, room: 3 };
}

// The camera holds still when all four fit, and otherwise keeps Yimeng a third of the way in.
export function camAt(t, W) {
  if (W >= ROW + 8) return Math.round(MARGIN + ROW / 2 - W / 2);
  const x = heroAt(t).x - Math.round(W * 0.34);
  return Math.round(Math.min(Math.max(x, MARGIN - 4), MARGIN + ROW + 4 - W));
}

// How far the bill has unrolled after the last course: down the tablecloth, then back along the
// floor under the other restaurants.
export function billAt(t) {
  const u = Math.max(0, t - startAt(3) - EAT) / BILL, len = Math.round(Math.min(1, u) * (roomX(3) + 16 - MARGIN));
  const drop = Math.min(len, FLOOR - TOP);
  return { drop, run: len - drop };
}

// ---------- the staff, all facing left towards Yimeng ----------
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
const TOQUE = `
.....WWWWWWW........
....WWWWWWWWW.......
....WWWWWWWWW.......
.....WWWWWWW........`;
const STAFF = { E: '#241c22', S: '#f0c8a4', s: '#d9a885', e: '#e0b08c', q: '#b88466', M: '#3a2a22', W: '#f6f4ee', b: '#1c1c22', K: '#1a1a20', P: '#22222a', O: '#121216', H: '#2a2026', h: '#4a3a40' };
const OUTLINE = '#141016';
const WAITER = art(STAFF_ROWS, STAFF, OUTLINE);                                      // tailcoat, moustache
const ITAMAE = art(STAFF_ROWS.replace('.HHHHHHHHHHHHHHHH...', '.BBBBBBBBBBBBBBBBBB.'),   // white coat, headband
  { ...STAFF, M: '#f0c8a4', B: '#f4f1ea', K: '#f4f1ea', W: '#f4f1ea', b: '#d8d2c4', P: '#2a2a30' }, OUTLINE);
const CAMERIERE = art(STAFF_ROWS, { ...STAFF, H: '#8a8a94', h: '#b4b4bc', M: '#8a8a94', K: '#7a1e2a' }, OUTLINE);   // grey hair, wine-red waistcoat
const CHEF = art(TOQUE + STAFF_ROWS, { ...STAFF, M: '#f0c8a4', K: '#f4f1ea', b: '#c8302a' }, OUTLINE);              // whites, a tall toque

// A sleeve from shoulder to hand, 2px thick, ending in a hand.
function arm(ctx, x0, y0, x1, y1, sleeve, hand = '#f0c8a4') {
  const n = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0));
  ctx.fillStyle = sleeve;
  for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 2, 2);
  ctx.fillStyle = hand; ctx.fillRect(x1, y1, 2, 2);
}

// ---------- props ----------
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
const DUCK = art(`
....rrrr..
..rRRRRRr.
.rRRWRRRRr
rRRRRRRRRr
.rrrrrrrr.
`, { r: '#8a3a1a', R: '#b8602a', W: '#f2c28a' }, '#3a1a0e');
const TRUFFLE = art(`
.tt.
tTTt
.tt.
`, { t: '#b8a684', T: '#d8c8a4' }, '#5a4a32');

// ---------- the set ----------
function pillar(p, x) {
  for (let y = 0; y < FLOOR + 6; y++) for (let i = 0; i < WALL; i++) p.px(x + i, y, i === 0 || i === WALL - 1 ? GOLD : '#141016');
}

function chair(p, hx, wood, cushion) {
  for (let y = 62; y < FLOOR; y++) for (let x = hx + 1; x <= hx + 3; x++) p.px(x, y, x === hx + 1 ? '#2a160e' : wood);
  for (let x = hx + 1; x <= hx + 17; x++) { p.px(x, SEAT, cushion); p.px(x, SEAT + 1, wood); }
  for (let y = SEAT + 2; y < FLOOR; y++) { p.px(hx + 2, y, '#2a160e'); p.px(hx + 16, y, '#2a160e'); }
}

function frenchRoom(p, x) {
  for (let y = 0; y < 96; y++) for (let i = x; i < x + ROOM; i++) {
    let c = ((i >> 2) + (y >> 2)) % 2 === 0 && (i + y) % 3 === 0 ? '#3a1c20' : '#2c1418';   // damask
    if (y === 12 || y === 15) c = GOLD;
    if (y === 13 || y === 14) c = i % 6 < 3 ? DEEP : '#5a4418';
    if (y >= 64 && y < 80) c = y === 64 ? GOLD : (i - x) % 25 === 0 || y === 67 || y === 77 ? DEEP : '#3a1a1e';
    if (y >= 80) c = (i + y * 2) % 12 === 0 || (i - y * 2) % 12 === 0 ? '#6a3a22' : (i + y) % 2 ? '#3a1a1e' : '#341618';
    p.px(i, y, c);
  }
  for (let y = 26; y < 58; y++) for (let i = x + 74; i < x + 94; i++) {             // a gilt mirror
    p.px(i, y, i === x + 74 || i === x + 93 || y === 26 || y === 57 ? GOLD : (i + y) % 9 === 0 ? '#5a4a4e' : '#3a2e34');
  }
  for (let k = 0; k < 6; k++) p.px(x + 78 + k * 2, 29 + k, '#6a5a60');
  for (const sx of [x + 69, x + 97]) { p.rect(sx, 40, 2, 5, GOLD); p.rect(sx - 1, 37, 4, 3, '#fff1c4'); }
  const cx = x + 38;                                                                 // the chandelier
  for (let y = 0; y < 16; y++) p.px(cx, y, DEEP);
  for (let k = -12; k <= 12; k++) { p.px(cx + k, 24, GOLD); p.px(cx + k, 25, DEEP); }
  for (const k of [-12, -6, 0, 6, 12]) {
    for (let y = 16; y < 24; y++) p.px(Math.round(cx + k * (y - 16) / 8), y, GOLD);
    p.rect(cx + k - 1, 21, 3, 3, '#f4f1ea'); p.px(cx + k, 20, '#ffe6a6');
    for (let y = 26; y < 29 + (Math.abs(k) % 3); y++) p.px(cx + k, y, y % 2 ? '#e8f2fa' : '#b8cce0');
  }
  chair(p, x + 4, '#5a3020', '#8a2438');
}

function japaneseRoom(p, x) {
  for (let y = 0; y < 96; y++) for (let i = x; i < x + ROOM; i++) {
    let c = (i - x) % 5 === 0 ? '#c4aa80' : (i + y * 3) % 17 === 0 ? '#e4cfa6' : '#d9c29a';   // hinoki slats
    if (y < 14) c = '#b89a70';
    if (y >= 64 && y < 80) c = y === 64 ? '#6a4a30' : (i - x) % 10 === 0 ? '#6a4a30' : '#8a6a48';
    if (y >= 80) c = (i - x + (y % 2) * 6) % 12 === 0 || y % 4 === 3 ? '#2a2a30' : '#3a3a42';   // slate floor
    p.px(i, y, c);
  }
  for (let y = 24; y < 50; y++) for (let i = x + 6; i < x + 32; i++) {             // a round window: bamboo and moon
    const d = Math.hypot(i - x - 18.5, (y - 37) * 1.0);
    if (d > 13) continue;
    let c = d > 12 ? '#4a3220' : '#1a2440';
    if (Math.hypot(i - x - 23, y - 31) < 3) c = '#f4e6a8';
    if (d <= 12 && ((i - x) % 7 === 2 || (i - x) % 7 === 3) && (y + i) % 5) c = '#3f6e3a';
    p.px(i, y, c);
  }
  for (let y = 30; y < 54; y++) for (let i = x + 70; i < x + 96; i++) {             // the noren, three panels and a crest
    if ((i - x - 70) % 9 === 8 && y > 34) continue;
    p.px(i, y, y < 33 ? '#1e2c4e' : '#2c3e6b');
  }
  for (let a = 0; a < Math.PI * 2; a += 0.3) p.px(Math.round(x + 83 + Math.cos(a) * 3), Math.round(42 + Math.sin(a) * 3), '#f4f1ea');
  for (let y = 20; y < 34; y++) {                                                   // a paper lantern
    const hw = Math.round(5 * Math.sin(((y - 20) / 14) * Math.PI)) + 1;
    for (let i = -hw; i <= hw; i++) p.px(x + 46 + i, y, y < 22 || y > 31 ? '#c8302a' : (y % 3 ? '#f6ecd6' : '#e8d8b8'));
  }
  for (let y = 14; y < 20; y++) p.px(x + 46, y, '#2a2a30');
  for (let y = SEAT; y < FLOOR; y++) for (let i = x + 7; i <= x + 17; i++) {       // a plain wooden stool
    if (y < SEAT + 2) p.px(i, y, y === SEAT ? '#c8a878' : '#a8885a');
    else if (i === x + 8 || i === x + 16) p.px(i, y, '#8a6a48');
  }
}

function italianRoom(p, x) {
  const r = rng(7);
  for (let y = 0; y < 96; y++) for (let i = x; i < x + ROOM; i++) {
    const v = r();
    let c = v < 0.08 ? '#d9a37a' : v < 0.14 ? '#ecc49c' : '#e3b48a';                // warm plaster
    if (y >= 64 && y < 80) c = y === 64 ? '#3a2416' : (i - x) % 20 === 0 ? '#3a2416' : '#5a3a26';
    if (y >= 80) c = (i - x) % 8 === 0 || y % 5 === 4 ? '#8a3e22' : (i + y) % 3 ? '#b8603a' : '#a8502e';   // terracotta
    p.px(i, y, c);
  }
  for (let y = 28; y < 46; y++) for (let i = x + 6; i < x + 30; i++) {             // a Tuscan landscape in a gilt frame
    const edge = i === x + 6 || i === x + 29 || y === 28 || y === 45;
    let c = y < 36 ? '#a8c8e0' : y < 40 ? '#c8b860' : '#8aa850';
    if (Math.abs(i - x - 12) < 2 - (y < 34 ? 1 : 0) && y > 31 && y < 41) c = '#2f4a2a';   // a cypress
    if (Math.abs(i - x - 22) < 2 && y > 33 && y < 41) c = '#2f4a2a';
    p.px(i, y, edge ? GOLD : c);
  }
  for (let y = 24; y < 62; y++) for (let i = x + 70; i < x + 96; i++) {             // a wine rack
    const cell = (i - x - 70) % 4 < 3 && (y - 24) % 4 < 3;
    p.px(i, y, i === x + 70 || i === x + 95 || y === 24 || y === 61 ? '#3a2416' : cell ? ((i + y) % 8 < 4 ? '#1f3a26' : '#5a1a24') : '#4a2e1c');
    if (cell && (i - x - 70) % 4 === 0 && (y - 24) % 4 === 0) p.px(i, y, '#8aa890');
  }
  for (let y = 0; y < 20; y++) p.px(x + 40, y, '#2a2a30');                         // a pendant lamp
  for (let k = 0; k < 4; k++) for (let i = -2 - k; i <= 2 + k; i++) p.px(x + 40 + i, 20 + k, k === 3 ? '#1f4a2e' : '#2f6a3e');
  p.rect(x + 39, 24, 3, 1, '#fff1c4');
  chair(p, x + 4, '#6a4428', '#c8a050');
}

function chineseRoom(p, x) {
  for (let y = 0; y < 96; y++) for (let i = x; i < x + ROOM; i++) {
    let c = (i + y * 2) % 23 === 0 ? '#8a2228' : '#7a1a1e';                          // red lacquer
    if (y === 12 || y === 14) c = GOLD;
    if (y === 13) c = DEEP;
    if (y >= 64 && y < 80) c = y === 64 ? GOLD : '#3a1a12';
    if (y >= 80) c = ((i - x) % 14 === 7 && y % 7 === 3) ? GOLD : (i + y) % 2 ? '#5a1418' : '#4a1014';
    p.px(i, y, c);
  }
  for (let y = 22; y < 62; y++) for (let i = x + 66; i < x + 96; i++) {             // a rosewood lattice screen, lit behind
    const gx = (i - x - 66) % 6, gy = (y - 22) % 6;
    const bar = gx === 0 || gy === 0 || (gx === gy && gx < 3) || (gx + gy === 6 && gx > 3);
    p.px(i, y, i === x + 66 || i === x + 95 || y === 22 || y === 61 || bar ? '#3a1a12' : '#c89a4a');
  }
  for (const lx of [x + 24, x + 56]) {                                               // two red lanterns
    for (let y = 8; y < 16; y++) p.px(lx, y, '#2a160e');
    for (let y = 16; y < 28; y++) {
      const hw = Math.round(5 * Math.sin(((y - 15) / 13) * Math.PI));
      for (let i = -hw; i <= hw; i++) p.px(lx + i, y, y === 16 || y === 27 ? GOLD : Math.abs(i) === hw ? '#9a1e1e' : (i + 9) % 3 ? '#c8302a' : '#e04a3a');
    }
    for (let y = 28; y < 33; y++) p.px(lx, y, y < 30 ? GOLD : '#e04a3a');            // the tassel
  }
  chair(p, x + 4, '#3a1a12', '#c8302a');
}

function ends(p, x0, x1) {
  for (let y = 0; y < 96; y++) for (let i = x0; i < x1; i++) {
    let c = (i % 30 === 0 || i % 30 === 1) && y < 80 ? DEEP : '#0c0c11';
    if (y === 80) c = '#2a2a30';
    p.px(i, y, c);
  }
}

// What stands in front of the seated diner: the tables and the counter.
function fronts() {
  const f = new Painter(MARGIN * 2 + ROW, 96);
  const cloth = (x0, x1) => {
    for (let y = TOP; y < FLOOR + 2; y++) for (let x = x0; x <= x1; x++) {
      f.px(x, y, y === TOP ? '#ffffff' : (x - x0) % 7 === 0 && y > TOP + 3 ? FOLD : y > FLOOR - 3 ? '#e8e4da' : CLOTH);
    }
  };
  cloth(roomX(0) + 19, roomX(0) + 61);                                               // French: white cloth to the floor
  const j = roomX(1);
  for (let y = TOP - 1; y < FLOOR + 2; y++) for (let x = j + 19; x <= j + 61; x++) { // Japanese: the hinoki counter
    f.px(x, y, y < TOP + 1 ? (y === TOP - 1 ? '#f2e2c2' : '#e8d4b0') : (x - j) % 9 === 0 ? '#a8885a' : '#c8a878');
  }
  const it = roomX(2);
  for (let x = it + 19; x <= it + 61; x++) { f.px(x, TOP, '#7a5232'); f.px(x, TOP + 1, '#4a2e1c'); }   // Italian: walnut, bare legs
  for (const lx of [it + 22, it + 58]) for (let y = TOP + 2; y < FLOOR; y++) f.px(lx, y, '#4a2e1c');
  for (let x = it + 30; x <= it + 46; x++) f.px(x, TOP, '#ece6d8');                 // a linen runner
  cloth(roomX(3) + 19, roomX(3) + 61);                                               // Chinese: a round table
  for (let x = roomX(3) + 19; x <= roomX(3) + 61; x++) f.px(x, TOP + 1, '#c8302a');
  return f;
}

export function buildDining(W, H = 96) {
  const back = new Painter(MARGIN * 2 + ROW, H);
  ends(back, 0, MARGIN); ends(back, MARGIN + ROW, MARGIN * 2 + ROW);
  [frenchRoom, japaneseRoom, italianRoom, chineseRoom].forEach((room, k) => room(back, roomX(k)));
  for (let k = 0; k <= 4; k++) pillar(back, MARGIN + k * (ROOM + WALL));
  const r = rng(11), flakes = Array.from({ length: 18 }, () => [Math.floor(r() * 9) - 4, Math.floor(r() * 3)]);
  return { W, H, flakes, layers: { back, front: fronts() } };
}

// ---------- each restaurant's moment; u is the time since Yimeng sat down there ----------
// X maps a world x to the screen.
function french(ctx, u, t, X, env) {
  const x = roomX(0), px = X(x + 37);
  ctx.fillStyle = '#b9b4aa'; ctx.fillRect(px - 12, TOP - 1, 25, 1);                   // a wide plate
  ctx.fillStyle = '#ffffff'; ctx.fillRect(px - 12, TOP - 2, 25, 1); ctx.fillRect(px - 10, TOP - 3, 21, 1);
  if (u < 0.55) { ctx.fillStyle = '#e8414b'; ctx.fillRect(px, TOP - 4, 2, 1); ctx.fillStyle = '#4f9a4a'; ctx.fillRect(px + 1, TOP - 5, 1, 1); }
  else { ctx.fillStyle = '#8a2438'; ctx.fillRect(px - 3, TOP - 3, 1, 1); ctx.fillRect(px + 2, TOP - 3, 2, 1); }   // a smear of sauce
  const wx = X(x + 47) + 8, wy = FLOOR - WAITER.h + 1 + 19;
  if (u < EAT) {                                                                      // the cloche goes up and stays up
    const lift = Math.round(ease((u - 0.05) / 0.25) * 9), cy = TOP - 2 - CLOCHE.h - lift;
    ctx.drawImage(env.art(CLOCHE), px - 6, cy);
    arm(ctx, wx, wy, px + 2, cy - 1, '#1a1a20', '#f6f4ee');
    if (u > 0.3 && u < 0.45) { ctx.fillStyle = '#ffffff'; ctx.fillRect(px - 3, cy + 2, 1, 1); ctx.fillRect(px - 4, cy + 3, 3, 1); }
  } else arm(ctx, wx, wy, wx - 3, wy + 6, '#1a1a20', '#f6f4ee');
  ctx.fillStyle = GOLD; ctx.fillRect(X(x + 23), TOP - 2, 3, 2);                        // a candle
  ctx.fillStyle = '#f4efe2'; ctx.fillRect(X(x + 24), TOP - 7, 1, 5);
  ctx.fillStyle = Math.floor(t * 12) % 2 ? '#ffd27a' : '#fff1c4'; ctx.fillRect(X(x + 24), TOP - 9, 1, 2);
}

function japanese(ctx, u, t, X) {
  const x = roomX(1), gx = X(x + 29);
  ctx.fillStyle = '#7a5232'; ctx.fillRect(gx, TOP - 2, 18, 1); ctx.fillStyle = '#5a3a22'; ctx.fillRect(gx, TOP - 1, 18, 1);   // the board
  const TOPPINGS = ['#c8303a', '#f08a4a', '#f4d8c8'];                                   // tuna, salmon, yellowtail
  let reach = null;
  for (let i = 0; i < 3; i++) {
    const at = 0.06 + i * 0.14, nx = gx + 2 + i * 5;
    if (u >= at && u < 0.44 + i * 0.12) {
      ctx.fillStyle = '#f4f1ea'; ctx.fillRect(nx, TOP - 3, 4, 1);
      ctx.fillStyle = TOPPINGS[i]; ctx.fillRect(nx, TOP - 4, 4, 1);
    }
    if (u >= at - 0.08 && u < at + 0.04) reach = nx + 1;                                // the chef's hand lays each piece down
  }
  if (u >= EAT) { ctx.fillStyle = '#f2a8b8'; ctx.fillRect(gx + 14, TOP - 3, 2, 1); }      // pickled ginger left behind
  const sx = X(x + 47) + 8, sy = FLOOR - ITAMAE.h + 1 + 19;
  arm(ctx, sx, sy, reach ?? sx - 4, reach ? TOP - 6 : sy + 5, '#f4f1ea');
}

function italian(ctx, u, t, X, env, flakes) {
  const x = roomX(2), px = X(x + 37);
  ctx.fillStyle = '#b9b4aa'; ctx.fillRect(px - 10, TOP - 1, 21, 1);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(px - 10, TOP - 2, 21, 1);
  const left = u < 0.45 ? 1 : u < 0.75 ? 1 - (u - 0.45) / 0.3 : 0;                      // how much pasta is left
  if (left > 0) {
    const w = Math.max(2, Math.round(9 * left));
    ctx.fillStyle = '#e8c060'; ctx.fillRect(px - (w >> 1), TOP - 3, w, 1);
    if (left > 0.35) { ctx.fillStyle = '#f2d27a'; ctx.fillRect(px - (w >> 1) + 1, TOP - 4, Math.max(1, w - 2), 1); }
  }
  const shaved = Math.floor(Math.max(0, Math.min(u, 0.42)) / 0.42 * flakes.length);
  ctx.fillStyle = '#e8dcc0';
  flakes.slice(0, Math.round(shaved * left)).forEach(([dx, dy]) => ctx.fillRect(px + dx, TOP - 4 - dy, 1, 1));
  const wx = X(x + 47) + 8, wy = FLOOR - CAMERIERE.h + 1 + 19;
  if (u > -0.3 && u < 0.42) {                                                         // the truffle and its slicer over the plate
    const hx = px + 4, hy = TOP - 16 + (Math.floor(t * 16) % 2);
    arm(ctx, wx, wy, hx + 3, hy + 2, '#f6f4ee');
    ctx.drawImage(env.art(TRUFFLE), hx - 3, hy - 1);
    ctx.fillStyle = '#c9ced8'; ctx.fillRect(hx - 1, hy + 3, 5, 1);
    if (u > 0) { ctx.fillStyle = '#e8dcc0'; ctx.fillRect(hx, hy + 5 + Math.floor(t * 30) % 6, 1, 1); ctx.fillRect(hx + 2, hy + 7 + Math.floor(t * 24) % 5, 1, 1); }
  } else arm(ctx, wx, wy, wx - 3, wy + 6, '#f6f4ee');
}

function chinese(ctx, u, t, X, env) {
  const x = roomX(3), cx = X(x + 40);
  ctx.fillStyle = '#c8dce6'; ctx.fillRect(cx - 15, TOP - 1, 31, 1);                      // the glass turntable
  ['#4f9a4a', '#c8302a', '#c8a050', '#f4f1ea'].forEach((col, i) => {
    const a = t * 1.6 + i * Math.PI / 2, dx = Math.round(Math.cos(a) * 12);
    if (Math.sin(a) < -0.2) return;                                                    // round the back of the turntable
    ctx.fillStyle = '#f6f4ee'; ctx.fillRect(cx + dx - 2, TOP - 3, 5, 2);
    ctx.fillStyle = col; ctx.fillRect(cx + dx - 1, TOP - 4, 3, 1);
  });
  ctx.drawImage(env.art(DUCK), X(x + 47), TOP - 7);                                    // the duck, on its board
  ctx.fillStyle = '#6a4428'; ctx.fillRect(X(x + 46), TOP - 2, 13, 1);
  const carved = u < 0 ? 0 : Math.min(6, Math.floor(Math.min(u, 0.42) / 0.07));
  const eaten = u < 0.45 ? 0 : Math.min(6, Math.floor((u - 0.45) / 0.05));
  const px = X(x + 26);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(px - 3, TOP - 2, 9, 1);
  for (let i = eaten; i < carved; i++) { ctx.fillStyle = i % 2 ? '#e8c8a0' : '#c8702a'; ctx.fillRect(px - 2 + (i % 3) * 2, TOP - 3 - Math.floor(i / 3), 2, 1); }
  const carving = u >= 0 && u < 0.42, chop = carving ? (Math.floor(t * 14) % 2) * 3 : 0;
  arm(ctx, X(x + 47) + 8, FLOOR - CHEF.h + 1 + 23, X(x + 52), TOP - 9 + chop, '#f4f1ea');
  if (carving) { ctx.fillStyle = '#c9ced8'; ctx.fillRect(X(x + 51), TOP - 12 + chop, 1, 3); }   // the knife
}

export function renderDining(ctx, t, s, env) {
  const { W, H, canvases: c } = s, cam = camAt(t, W), X = (x) => Math.round(x - cam);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.back, -cam, 0);
  const here = heroAt(t), hero = here.seated ? env.hero('michelin', 'sit') : env.hero('michelin');
  // the staff behind their tables, Yimeng seated, then the tables in front
  for (const [who, k] of [[WAITER, 0], [ITAMAE, 1], [CAMERIERE, 2], [CHEF, 3]]) ctx.drawImage(env.art(who), X(roomX(k) + 47), FLOOR - who.h + 1);
  if (here.seated) ctx.drawImage(hero.canvases[Math.floor(t * 4) % 2], X(here.x) - hero.anchorX, SEAT - 1 - hero.seatY);
  ctx.drawImage(c.front, -cam, 0);
  french(ctx, t - startAt(0), t, X, env);
  japanese(ctx, t - startAt(1), t, X);
  italian(ctx, t - startAt(2), t, X, env, s.flakes);
  chinese(ctx, t - startAt(3), t, X, env);
  // Yimeng dashing on to the next table, with speed lines
  if (!here.seated) {
    const hx = X(here.x);
    ctx.drawImage(hero.canvases[Math.floor(t * 14) % 4], hx - hero.anchorX, FLOOR - hero.footY);
    ctx.fillStyle = 'rgba(244, 241, 234, 0.7)';
    for (const [dy, len] of [[62, 6], [68, 9], [74, 5]]) ctx.fillRect(hx - len - 2, dy, len, 1);
  }
  // the bill, down to the floor and back under every restaurant
  const { drop, run } = billAt(t);
  if (drop > 0) {
    const bx = X(roomX(3) + 16);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, TOP, 5, drop);
    if (run) ctx.fillRect(bx + 5 - run, FLOOR - 1, run, 3);
    ctx.fillStyle = '#9a958c';
    for (let y = TOP + 1; y < TOP + drop; y += 2) ctx.fillRect(bx + 1, y, y % 6 ? 3 : 2, 1);
    for (let x = bx + 4 - run; x < bx; x += 3) ctx.fillRect(x, FLOOR, 2, 1);
    ctx.fillStyle = '#1a1a20'; ctx.fillRect(bx - 1, TOP - 1, 7, 2);                      // the bill folder
    if (run > 40) {                                                                    // a bead of sweat
      const top = SEAT - 1 - hero.seatY, hx = X(here.x);
      ctx.fillStyle = '#bfe3f2'; ctx.fillRect(hx + 3, top + 17, 1, 2); ctx.fillRect(hx + 2, top + 18, 1, 1);
    }
  }
}

export const dining = { build: buildDining, render: renderDining };
