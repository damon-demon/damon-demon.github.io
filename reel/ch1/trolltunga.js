// Chapter 1, shot 5: Trolltunga at golden hour. A long fjord runs away to a low sun between sheer,
// back-lit walls with waterfalls; red houses sit far below. Yimeng walks out along the stratified
// rock tongue and sits at the tip, legs over the drop, while the camera drifts.
import { Painter, rng } from '../pixels.js';
import { gradient } from '../kit.js';

const TOP = 56;                          // the tongue's walking surface at its root
const WALK_END = 1.15;                   // seconds of walking before sitting down
const STEP = 26;                         // walk speed, px/s
const PAN = 4;                           // camera drift, px/s at the foreground
const PAD = 16;                          // extra width so the drift never shows an edge

const SKY = [['#1d3466', 0], ['#33508a', 0.2], ['#5a72a8', 0.4], ['#a58fb0', 0.58], ['#e3a27e', 0.75], ['#f5c48a', 0.88], ['#fde2a6', 0.97]];

const lerp = (a, b, u) => a + (b - a) * u;

// A fjord spur: a ridge that falls from (ax, ay), high on the outside, to (bx, by) at the water's
// edge. Everything below the ridge on the outer side is mountain. cols = [base, strata, crack,
// snow, rim]; the ridge line itself catches the low sun.
function spur(p, H, ax, ay, bx, by, cols, snow, seed, water) {
  const lo = Math.round(Math.min(ax, bx)), hi = Math.round(Math.max(ax, bx)), left = ax < bx;
  for (let x = lo; x <= hi; x++) {
    const u = (x - ax) / (bx - ax);
    const ridge = Math.round(ay + (by - ay) * Math.pow(u, 1.25) + Math.sin(x * 0.37 + seed) * 1.2 + Math.sin(x * 0.11 + seed * 2) * 1.8);
    for (let y = Math.max(0, ridge); y < H; y++) {
      if (water(x, y)) continue;                                  // never paint over the fjord itself
      const d = y - ridge;
      let c = (x * 3 + y * 7) % 13 === 0 ? cols[2] : (y + Math.round(x * (left ? 0.5 : -0.5))) % 6 === 0 ? cols[1] : cols[0];
      if (snow && d > 0 && d < 5 && u < 0.6 && (x + y) % 3 !== 0) c = cols[3];
      if (d === 0) c = cols[4];
      p.px(x, y, c);
    }
  }
  // the rest of the mountain beyond the ridge's high end
  const outer = left ? [0, lo] : [hi, p.w];
  for (let x = outer[0]; x < outer[1]; x++) for (let y = Math.max(0, Math.round(ay + Math.sin(x * 0.29 + seed) * 1.5)); y < H; y++) {
    if (water(x, y)) continue;
    p.px(x, y, y === Math.round(ay + Math.sin(x * 0.29 + seed) * 1.5) ? cols[4] : (x + y) % 6 === 0 ? cols[1] : cols[0]);
  }
}

export function buildTrolltunga(W, H = 96) {
  const layers = {}, vx = Math.round(W * 0.64), vy = 40;        // where the fjord meets the sun
  const tip = Math.round(W * 0.6), cliffEdge = Math.round(W * 0.36);
  layers.sky = gradient(W, 62, SKY);

  // the sun with a wide warm glow and faint rays fanning out of the valley
  const sun = new Painter(W, 46);
  for (let j = -30; j <= 30; j++) for (let i = -40; i <= 40; i++) {
    const d = Math.hypot(i, j * 1.3), x = vx + i, y = vy - 4 + j;
    if (d <= 3) sun.px(x, y, '#fff7dc');
    else if (d <= 4.5) sun.px(x, y, '#fde8b0');
    else if (d <= 9 && (i + j) % 2 === 0) sun.px(x, y, '#fcdca0');
    else if (d <= 16 && (i + j) % 3 === 0) sun.px(x, y, '#f8cf94');
    else if (d <= 26 && (i * 2 + j) % 5 === 0) sun.px(x, y, '#efbf8d');
  }
  for (const a of [-2.75, -2.45, -0.75, -0.42]) {                   // god rays
    for (let r = 8; r < 70; r++) for (let w = -1; w <= 1; w++) {
      const x = Math.round(vx + Math.cos(a) * r + w * Math.sin(a)), y = Math.round(vy - 4 + Math.sin(a) * r * 0.6);
      if ((x + y + r) % 3 === 0) sun.px(x, y, '#f6d4a2');
    }
  }
  layers.sun = sun;

  // the valley: water first, then spurs from far to near on both sides
  const walls = new Painter(W + PAD, H);
  for (let y = vy; y < H; y++) {
    const u = (y - vy) / (H - vy);
    for (let x = 0; x < W + PAD; x++) {
      let c = u < 0.06 ? '#f0d4a8' : u < 0.16 ? '#c8c6b6' : u < 0.36 ? '#8fb6bc' : u < 0.62 ? '#4f8a96' : '#2c5f6c';
      if ((x * 7 + y * 13) % 31 === 0) c = '#76a8b0';
      walls.px(x, y, c);
    }
  }
  const leftShore = (y) => vx - 3 - (y - vy) * (vx - 3 - W * 0.22) / (H - vy);   // shorelines open out
  const rightShore = (y) => vx + 4 + (y - vy) * (W * 0.98 - vx - 4) / (H - vy);   // from the sun to the viewer
  const water = (x, y) => y > vy && x > leftShore(y) && x < rightShore(y);
  const HAZE = ['#ad9db5', '#a394ae', '#9b8da8', '#c7b0bc', '#f4ca92'];   // far: hazy and warm
  const MID = ['#5d6787', '#56607f', '#4e5876', '#a3aec6', '#ebba86'];
  const NEAR = ['#303b58', '#2b3551', '#262f49', '#7c88a6', '#dca878'];
  for (const [side, ax, ay, endY, cols, snow, seed] of [
    [-1, W * 0.28, 31, 41, HAZE, false, 1], [1, W + PAD, 29, 41, HAZE, false, 2],
    [-1, W * 0.08, 21, 54, MID, true, 3], [1, W + PAD, 17, 54, MID, true, 4],
    [-1, -4, 6, 72, NEAR, true, 5], [1, W + PAD, 5, 74, NEAR, true, 6],
  ]) spur(walls, H, ax, ay, side < 0 ? leftShore(endY) : rightShore(endY), endY, cols, snow, seed, water);
  for (let y = vy + 1; y < H; y++) {                                       // a dark green fringe along each shore
    walls.px(Math.floor(leftShore(y)), y, '#33473a'); walls.px(Math.ceil(rightShore(y)), y, '#33473a');
  }
  for (const hy of [84, 87, 90]) {                                         // red boathouses on the right shore
    const x = Math.round(rightShore(hy)) + 2;
    walls.rect(x, hy, 3, 2, '#c0392b'); walls.rect(x, hy - 1, 3, 1, '#e8e2d4');
  }
  layers.walls = walls;
  const falls = [[rightShore(52) + 6, 38, 52], [rightShore(60) + 10, 30, 60]].map(([fx, top, foot]) => ({ x: Math.round(fx), top, foot }));

  // the cliff and its tongue, layered rock lit gold on top by the low sun
  const rock = new Painter(W + PAD, H), rr = rng(12);
  for (let i = 0; i <= tip + 2; i++) {
    const onCliff = i < cliffEdge;
    const lift = i > tip - 22 ? (i - (tip - 22)) * 0.13 : 0;
    const top = Math.round(TOP - lift + (onCliff ? Math.sin(i * 0.31) * 1.2 + Math.sin(i * 0.11) * 1.5 - 1 : 0));
    const thick = onCliff ? H : Math.round(lerp(14, 6, (i - cliffEdge) / (tip - cliffEdge)) + Math.sin(i * 0.8) * 1.3 + (rr() < 0.18 ? 1 : 0));
    const bottom = i > tip ? top + 4 - (i - tip) * 2 : Math.min(H, top + thick);
    for (let j = top; j < bottom; j++) {
      const d = j - top;
      let c = d === 0 ? '#f0c58c' : d === 1 ? '#a8896a' : d % 4 === 2 ? '#2f2a26' : (i * 5 + j * 3) % 11 === 0 ? '#2a2622' : (d % 4 === 0 ? '#4a433c' : '#3f3933');
      if (!onCliff && j >= bottom - 2) c = '#1f1c19';                          // ragged dark underside
      if (i >= tip - 1 && d > 0 && d < 5) c = '#d9a774';                       // the sunlit end face
      rock.px(i, j, c);
    }
  }
  layers.rock = rock;

  // haze that hangs in the valley below the tongue
  const mist = new Painter(W * 2, H), rm = rng(5);
  for (let n = 0; n < 10; n++) {
    const cx = rm() * W * 2, cy = 60 + rm() * 14, rx = 18 + rm() * 30, ry = 2.5 + rm() * 2;
    for (let y = -4; y <= 4; y++) for (let x = -rx; x <= rx; x++) {
      const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
      if (d < 0.55 || (d < 1 && (Math.round(x) + y) % 2 === 0)) mist.wpx(cx + x, cy + y, '#f4e6da');
    }
  }
  layers.mist = mist;
  const glint = [], rg = rng(9);                                            // the sun's path on the water
  for (let n = 0; n < 40; n++) {
    const y = vy + 1 + Math.floor(Math.pow(rg(), 1.3) * (H - vy - 2)), spread = 1 + (y - vy) * 0.18;
    glint.push([vx + 3 + (rg() - 0.5) * 2 * spread, y, rg()]);
  }
  return { W, H, layers, tip, vx, vy, falls, glint };
}

export function renderTrolltunga(ctx, t, s, env) {
  const { W, H, canvases: c } = s;
  const cam = t * PAN, wx = Math.round(-cam * 0.35), tick = Math.floor(t * 8);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  ctx.drawImage(c.sun, 0, 0);
  ctx.drawImage(c.walls, wx, 0);
  s.glint.forEach(([x, y, b], n) => {                                       // twinkling sun path
    if ((n * 5 + tick) % 4 < 2) { ctx.fillStyle = b > 0.5 ? '#fde8b0' : '#f2c693'; ctx.fillRect(Math.round(x) + wx, y, b > 0.8 ? 2 : 1, 1); }
  });
  for (const f of s.falls) {                                                 // waterfalls tumbling down the right wall
    for (let y = f.top; y < f.foot; y++) {
      if ((y + tick * 2) % 5 === 0) continue;
      ctx.fillStyle = (y + tick) % 3 ? '#e9eef2' : '#bcc8d4';
      ctx.fillRect(f.x + wx + (y % 7 === 0 ? 1 : 0), y, 1, 1);
    }
    ctx.fillStyle = 'rgba(240, 244, 248, 0.55)'; ctx.fillRect(f.x + wx - 2, f.foot - 1, 5, 2);
  }
  ctx.fillStyle = '#2a2a35';                                                 // two birds riding the air
  for (const [bx, by, ph] of [[0.45, 30, 0], [0.52, 34, 1.7]]) {
    const x = Math.round(W * bx + t * 5), y = Math.round(by + Math.sin(t * 2 + ph)), up = Math.floor(t * 4 + ph) % 2;
    ctx.fillRect(x - 1, y - up, 1, 1); ctx.fillRect(x, y, 1, 1); ctx.fillRect(x + 1, y - up, 1, 1);
  }
  ctx.globalAlpha = 0.35; ctx.drawImage(c.mist, Math.round(-cam * 0.6 - t * 3) % W, 0); ctx.globalAlpha = 1;
  ctx.drawImage(c.rock, Math.round(-cam), 0);
  const sitX = s.tip - 12 - Math.round(cam);
  if (t < WALK_END) {
    const hero = env.hero('trolltunga');
    const x = sitX - (WALK_END - t) * STEP;
    ctx.drawImage(hero.canvases[Math.floor(t * 6) % 4], Math.round(x) - hero.anchorX, TOP - 2 - hero.footY);
  } else {
    const hero = env.hero('trolltunga', 'sit');
    ctx.drawImage(hero.canvases[Math.floor((t - WALK_END) * 2) % 2], sitX - hero.anchorX, TOP - 4 - hero.seatY);
  }
}

export const trolltunga = { build: buildTrolltunga, render: renderTrolltunga };
