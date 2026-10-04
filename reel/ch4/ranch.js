// Chapter 4, shot 3: a ranch in the golden hills. On the ATV, the dog on the rack behind, Yimeng runs
// the dirt track by a split-rail fence while a herd of black-tailed deer bounds along the hillside
// above: parallax makes it a chase, though the ATV never leaves the track. It stops; Yimeng gets
// off and raises the rifle. Then the scope: the deer in the crosshairs looks back, and the scene
// cuts away. No shot is fired. (Never from the vehicle: California forbids it.)
import { Painter, rng } from '../pixels.js';
import { gradient, ridge, tile, art } from '../kit.js';

const GROUND = 88;                           // the track's row, under the ATV's tyres and Yimeng's shoes
const V = 70;                                // the chase, px/s at the track
const STOP = [1.1, 1.5], DISMOUNT = 1.6, AIM = 1.8, SCOPE = 2.2;
const DEER = 5;

// How far the camera has run along the track: full speed, then braking to a stop.
export function runAt(t) {
  const [a, b] = STOP, u = Math.min(Math.max(t, a), b) - a;
  return V * Math.min(t, a) + V * (u - (u * u) / (2 * (b - a)));
}
// What is on screen: the chase, the stop, Yimeng off and aiming, then the scope.
export const beatAt = (t) => (t < STOP[1] ? 'chase' : t < DISMOUNT ? 'stop' : t < AIM ? 'off' : t < SCOPE ? 'aim' : 'scope');

// The ATV from the side, facing right: a long rear rack for the dog, the seat, handlebars, front rack.
const ATV = art(`
.............................KK.......
............................K..K......
.KKKKKKKKKKKKKK..............KK.KKKK..
RRRRRRRRRRRRRRRR............RRRRRRRR..
RrrrrrrrrrrrrrRRBBBBBBBBBBBRRrrrrrrRRy
RRRRRRRRRRRRRRRRBBBBBBBBBBBRRRRRRRRRRy
.rrrrrrrrrrKKKKKKKKKKKKKKKKKKrrrrrrrr.
...........KKKKKKKKKKKKKKKKKK.........
............KK............KK..........
`, { K: '#22242a', R: '#c8402e', r: '#962e22', B: '#1a1a1e', y: '#f4f1d0' }, '#141418');
const TYRES = [8, 30], TYRE_R = 5;

const DEER_PAL = { a: '#6a4a30', e: '#7a5232', B: '#a8784a', b: '#7a5232', N: '#1a1210', w: '#f4eee2', k: '#1a1210' };
const DEER_RUN = [`
.................a.a..
................a.a...
...............ee.....
..............eBBe....
.............BBBBBN...
............BBBB......
.wkBBBBBBBBBBBB.......
wwBBBBBBBBBBBBb.......
.wBBBBBBBBBBBb........
..b...........b.......
.b.............b......
b...............b.....
`, `
.................a.a..
................a.a...
...............ee.....
..............eBBe....
.............BBBBBN...
............BBBB......
.wkBBBBBBBBBBBB.......
wwBBBBBBBBBBBBb.......
.wBBBBBBBBBBBb........
....b......b..........
....b......b..........
....b......b..........
`].map(rows => art(rows, DEER_PAL, '#3a2618'));
const DOE_RUN = DEER_RUN.map(a => ({ ...a, rows: a.rows.map((r, y) => (y < 2 ? r.replace(/a/g, '.') : r)) }));   // no antlers

// The doe in the scope, broadside: head up in profile, then turned to look straight back.
const DEER_BODY = `
...bbbbbbbbbbbbbbbbbBBBBB......
..BBBBBBBBBBBBBBBBBBBBBBB......
.wBBBBBBBBBBBBBBBBBBBBBBB......
wwBBBBBBBBBBBBBBBBBBBBBB.......
.wBBBBBBBBBBBBBBBBBBBBBB.......
..BBBBBBLLLLLLLLLLLBBBBB.......
...BBBB...........BBBB.........
...bb.b...........b.bb.........
...b..b...........b..b.........
...b..b...........b..b.........
...b..b...........b..b.........
...N..N...........N..N.........`;
const DEER_FACE = [`
......................e.e......
.....................eEeEe.....
......................eBBBB....
......................BBKBBB...
.......................BBBBBBN.
.......................BBBww...
......................BBBB.....
.....................BBBBw.....
....................BBBBBw.....` + DEER_BODY, `
..................ee.....ee....
..................eEe...eEe....
...................eeBBBee.....
.....................BBB.......
....................BKBKB......
....................BBBBB......
.....................BBB.......
.....................BNB.......
.....................www.......` + DEER_BODY].map(rows => art(rows, { e: '#6a4a30', E: '#d8a890', B: '#a8784a', b: '#8a6038', L: '#c8a070', K: '#140c08', N: '#1a1210', w: '#f4eee2' }, '#3a2618'));

function hills(TW, base, h, cols, seed) {
  const p = new Painter(TW, 96), r = rng(seed), line = ridge(TW, h, [[h * 0.35, 2, seed], [h * 0.18, 5, seed * 2]]);
  for (let x = 0; x < TW; x++) for (let j = 0; j < line[x] + (96 - base); j++) {
    const y = base - Math.round(line[x]) + j;
    p.px(x, y, j === 0 ? cols[0] : (x * 3 + y * 7) % 17 === 0 ? cols[2] : cols[1]);
  }
  for (let n = 0; n < TW / 30; n++) {                                               // oaks: dark round crowns on the gold
    const x = Math.floor(r() * TW), y = base - Math.round(line[x]) + 2, rad = 3 + Math.floor(r() * 3);
    for (let j = -rad; j <= rad; j++) for (let i = -rad - 2; i <= rad + 2; i++) if (i * i * 0.6 + j * j < rad * rad) p.wpx(x + i, y - rad + j, j < -1 ? '#5e7a3e' : '#4a6232');
    for (let j = 0; j < 3; j++) p.wpx(x, y + j, '#4a3a28');
  }
  return { p, line };
}

export function buildRanch(W, H = 96) {
  const TW = W * 2, layers = { sky: gradient(W, H, [['#5a9ad8', 0], ['#86b6e2', 0.35], ['#c8dcea', 0.62], ['#f2e2b8', 0.8]]) };
  layers.far = hills(TW, 62, 10, ['#e8cc7a', '#dcbc66', '#c8a856'], 3).p;
  const mid = hills(TW, 74, 14, ['#f0d27a', '#e2bc5c', '#cfa64a'], 7);
  layers.mid = mid.p;
  const near = new Painter(TW, H), r = rng(11);
  for (let y = 78; y < H; y++) for (let x = 0; x < TW; x++) {                       // dry grass, then the dirt track
    let c = y < 84 ? ((x * 5 + y) % 7 === 0 ? '#c8a04a' : '#d8b25a') : y < 93 ? ((x + y * 3) % 11 === 0 ? '#b8946a' : '#c8a47a') : '#b08a5a';
    if (y === 84) c = '#a8865a';
    near.px(x, y, c);
  }
  for (let x = 0; x < TW; x += 18) {                                                // the split-rail fence
    for (let y = 70; y < 84; y++) { near.px(x, y, '#6a4a30'); near.px(x + 1, y, '#5a3e28'); }
    for (const ry of [72, 77]) for (let k = 0; k < 18; k++) near.wpx(x + k, ry + Math.round(Math.sin(k / 18 * Math.PI) * 0.6), '#7a5a3a');
  }
  for (let n = 0; n < TW / 6; n++) near.wpx(Math.floor(r() * TW), 83 - Math.floor(r() * 4), '#e8c870');   // seed heads
  layers.near = near;
  // the herd on the hill, a buck in the lead; on a phone it closes up and runs ahead of the rider
  const hx = Math.round(W * 0.3), gap = Math.min(19, Math.floor((W - hx - 50) / DEER));
  const lead = Math.min(W - 42, Math.max(Math.round(W * 0.62), hx + 26 + (DEER - 1) * gap));
  const rd = rng(5), herd = Array.from({ length: DEER }, (_, i) => ({ x: lead - i * gap + Math.floor(rd() * 6), ph: rd() * 6 }));
  return { W, H, TW, hx, ridge: mid.line, herd, layers };
}

function rifle(ctx, x, y, hand) {
  // stock at the shoulder, through the hand, the barrel raised a little towards the hillside
  const [hx, hy] = hand, x0 = x + hx - 6, y0 = y + hy - 1, x1 = x + hx + 22, y1 = y + hy - 5;
  ctx.fillStyle = '#2a1e16';
  for (let k = 0; k <= 28; k++) ctx.fillRect(Math.round(x0 + (x1 - x0) * k / 28), Math.round(y0 + (y1 - y0) * k / 28), 1, k < 7 ? 2 : 1);
  ctx.fillStyle = '#1a1a1e'; ctx.fillRect(x + hx + 4, y + hy - 4, 7, 2);              // the scope
}

function scope(ctx, t, s, env) {
  const { W, H } = s, cx = Math.round(W / 2), cy = 48, R = 36;
  ctx.fillStyle = '#060606'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.beginPath();
  for (let y = cy - R; y <= cy + R; y++) { const w = Math.sqrt(Math.max(0, R * R - (y - cy) * (y - cy))); ctx.rect(Math.round(cx - w), y, Math.round(2 * w), 1); }
  ctx.clip();
  const sway = Math.round(Math.sin(t * 3) * 1.5);
  ctx.fillStyle = '#e2bc5c'; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);            // the hillside, close
  ctx.fillStyle = '#8ab4dc'; ctx.fillRect(cx - R, cy - R, R * 2, 18);
  const deer = env.art(DEER_FACE[t > SCOPE + 0.3 ? 1 : 0]);                          // the crosshairs on its shoulder; it looks back
  ctx.drawImage(deer, cx - 20 + sway, cy - 11);
  ctx.fillStyle = '#c09a44';                                                         // grass in front of its hooves
  for (let k = 0; k < 36; k++) ctx.fillRect(cx - R + 2 * k + (k % 2), cy + 8 - (k * 7) % 3, 1, 3 + (k * 5) % 3);
  ctx.restore();
  ctx.fillStyle = '#060606';                                                         // crosshairs and the scope's rim
  ctx.fillRect(cx - R, cy, R * 2, 1); ctx.fillRect(cx, cy - R, 1, R * 2);
  ctx.fillRect(cx - R, cy - 1, 10, 3); ctx.fillRect(cx + R - 10, cy - 1, 10, 3); ctx.fillRect(cx - 1, cy + R - 10, 3, 10);
  ctx.fillStyle = '#2a2a2e';
  for (let a = 0; a < Math.PI * 2; a += 0.02) ctx.fillRect(Math.round(cx + Math.cos(a) * R), Math.round(cy + Math.sin(a) * R), 1, 1);
}

export function renderRanch(ctx, t, s, env) {
  const { W, H, canvases: c, hx } = s, beat = beatAt(t);
  if (beat === 'scope') { scope(ctx, t, s, env); return; }
  const run = runAt(t);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  tile(ctx, c.far, run * 0.15, 0);
  tile(ctx, c.mid, run * 0.4, 0);
  // the herd bounds along the hillside, keeping pace, then stops and stands
  const running = t < STOP[1] + 0.15, midOff = run * 0.4;
  s.herd.forEach((d, i) => {
    const x = d.x + (running ? t * 9 : (STOP[1] + 0.15) * 9), wx = ((Math.round(x + midOff) % s.TW) + s.TW) % s.TW;
    const top = 74 - Math.round(s.ridge[wx]), bob = running ? Math.round(Math.abs(Math.sin(t * 9 + d.ph)) * -3) : 0;
    const deer = env.art((i === 0 ? DEER_RUN : DOE_RUN)[running ? Math.floor(t * 8 + i) % 2 : 1]);   // a buck leads the does
    ctx.drawImage(deer, Math.round(x), top - deer.height + 2 + bob);
  });
  tile(ctx, c.near, run, 0);
  const atv = env.art(ATV), ax = hx - 10, ay = GROUND - atv.height - 2, jolt = beat === 'chase' ? Math.floor(t * 12) % 2 : 0;
  const dog = env.dog('blaze');                                                     // the dog rides the rack behind the seat
  if (beat === 'chase' || beat === 'stop') {
    const rider = env.hero('hunt', 'type');
    ctx.drawImage(rider.canvases[0], ax + 14 - rider.anchorX, ay - rider.seatY + 4 - jolt);
  }
  ctx.drawImage(dog.canvases[beat === 'chase' ? Math.floor(t * 9) % 4 : 0], ax - 7, ay - dog.footY + 4 - jolt);
  ctx.drawImage(atv, ax, ay - jolt);
  for (const tx of TYRES) {                                                         // knobbly tyres, the tread turning
    const wx = ax + tx + 1, wy = GROUND - TYRE_R;
    for (let j = -TYRE_R; j <= TYRE_R; j++) for (let i = -TYRE_R; i <= TYRE_R; i++) {
      const d = Math.hypot(i, j);
      if (d > TYRE_R + 0.3) continue;
      const knob = d > TYRE_R - 1.2 && (Math.round(Math.atan2(j, i) * 4 + run * 0.4) % 2 === 0);
      ctx.fillStyle = d < 2 ? '#8a8e96' : knob ? '#2e3036' : '#16161a'; ctx.fillRect(wx + i, wy + j, 1, 1);
    }
  }
  if (beat === 'chase' || beat === 'stop') {                                       // dust kicked up behind
    ctx.fillStyle = 'rgba(214, 186, 136, 0.55)';
    for (let k = 0; k < 6; k++) { const age = (t * 3 + k / 6) % 1; ctx.fillRect(Math.round(ax - 6 - age * 30), Math.round(GROUND - 4 - age * 8), 4 + Math.round(age * 8), 3); }
  }
  if (beat === 'off' || beat === 'aim') {                                           // off the ATV, on foot, the rifle raised
    const hero = env.hero('hunt', beat === 'aim' ? 'aim' : 'walk'), x = hx + 38 - hero.anchorX, y = GROUND - hero.footY;
    const f = beat === 'aim' ? Math.floor(t * 3) % 2 : 1;
    ctx.drawImage(hero.canvases[f], x, y);
    if (beat === 'aim') rifle(ctx, x, y, hero.hands[f]);
  }
}

export const ranch = { build: buildRanch, render: renderRanch };
