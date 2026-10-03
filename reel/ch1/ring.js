// Chapter 1, shot 4: the Nürburgring Nordschleife. Yimeng's modified Golf GTI (Tornado Red)
// flies through the Eifel forest past Armco and red-white kerbs; a lap timer runs in the corner.
import { Painter, rng } from '../pixels.js';
import { tile, gradient, ridge, label } from '../kit.js';

const V = 300;                          // the world streams past at this many px/s
const ROAD = 85;                        // asphalt top row; the tyres sit on it

function golf() {
  // side view, facing right: rear hatch on the left, bonnet on the right; glass left transparent
  const W = 64, H = 25, p = new Painter(W, H);
  const R = '#c8102e', r = '#9a0c22', h = '#e8414b', K = '#1c1c22', G = '#27303d';
  const body = (x, y) => {
    if (y < 2) return x >= 19 && x <= 45;                                    // roof
    if (y <= 10) {                                                             // greenhouse
      const back = 18 - (y - 1) * 0.85, front = 46 + (y - 1) * 0.95;
      return x >= back && x <= front;
    }
    if (y <= 19) return x >= 3 && x <= 62 - (y < 12 ? (12 - y) * 3 : 0);
    return false;
  };
  for (let y = 0; y < 20; y++) for (let x = 0; x < W; x++) {
    if (!body(x, y)) continue;
    let c = R;
    if (y >= 2 && y <= 10) {
      const pillarB = x >= 31 && x <= 32, edge = !body(x - 1, y) || !body(x + 1, y);
      c = edge || pillarB ? K : null;                                          // glass stays transparent
      if (c === null) continue;
    }
    if (y === 11) c = h;                                                       // shoulder highlight
    if (y >= 17) c = y >= 18 ? K : r;                                          // sill and skirt
    p.px(x, y, c);
  }
  for (let x = 19; x <= 45; x++) p.px(x, 0, '#e8414b');
  for (const [cx, cy] of [[15, 19], [50, 19]]) {                              // wheel arches, wheels, calipers
    for (let j = -7; j <= 0; j++) for (let i = -7; i <= 7; i++) if (i * i + j * j <= 49) p.px(cx + i, cy + j, '#14141a');
    for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) {
      const d = i * i + j * j;
      if (d > 30) continue;
      p.px(cx + i, cy + j, d > 20 ? '#1c1c22' : d < 3 ? '#8a8f98' : ((Math.atan2(j, i) * 5 / Math.PI + 10) % 2 < 1 ? '#3a3d45' : '#5a5f6a'));
    }
    p.px(cx + 2, cy - 3, '#e8414b'); p.px(cx + 3, cy - 2, '#e8414b');
  }
  p.rect(59, 12, 3, 2, '#f4f1e6');                                             // headlight
  p.rect(62, 14, 2, 1, '#e8414b');                                             // the red grille stripe
  p.rect(3, 12, 3, 2, '#7a0a18');                                              // tail light
  p.rect(53, 14, 3, 1, '#d9d9df');                                             // GTI badge glint
  return p;
}

const SIGN = (() => {
  const t = label('NORDSCHLEIFE', '#f4f1e6');
  const w = t.w + 6, rows = [];
  for (let y = 0; y < 9; y++) {
    let row = '';
    for (let x = 0; x < w; x++) row += (y >= 2 && y < 7 && x >= 3 && x < 3 + t.w && t.rows[y - 2][x - 3] === '#') ? 'w' : 'g';
    rows.push(row);
  }
  for (let y = 0; y < 8; y++) rows.push('.'.repeat(4) + 'p' + '.'.repeat(w - 10) + 'p' + '.'.repeat(4));
  return { rows, palette: { g: '#1f6b3a', w: '#f4f1e6', p: '#6a6f78' }, w, h: rows.length };
})();

export function buildRing(W, H = 96) {
  const TW = W * 2, layers = {};
  layers.sky = gradient(W, 70, [['#9fb2c6', 0], ['#b6c5d4', 0.4], ['#cfd9e2', 0.8]]);
  const forest = (base, hgt, step, cols, seed) => {                           // conifer band, seamless
    const p = new Painter(TW, H), r = rng(seed);
    const fill = ridge(TW, base - 4, [[2, 3, seed], [1, 7, seed * 2]]);
    for (let i = 0; i < TW; i++) for (let j = Math.round(fill[i]); j < base + 2; j++) p.px(i, j, cols[1]);
    for (let x = 0; x < TW; x += step) {
      const h = hgt * (0.7 + r() * 0.5), cx = x + r() * step;
      for (let j = 0; j < h; j++) {
        const w = (j / h) * (h * 0.32);
        for (let i = -Math.round(w); i <= Math.round(w); i++) p.wpx(cx + i, base - h + j, (j % 4 === 3 && i < 0) ? cols[1] : cols[0]);
      }
    }
    return p;
  };
  layers.hills = forest(62, 16, 7, ['#4c6a5c', '#5a7868'], 3);
  layers.mid = forest(72, 24, 9, ['#2f5240', '#3a5f4a'], 5);
  const track = new Painter(TW, H);                                            // Armco, asphalt, kerbs, grass
  for (let i = 0; i < TW; i++) {
    for (let y = 72; y < 85; y++) track.px(i, y, y < 78 ? '#2a4535' : '#33503d');      // verge behind the barrier
    for (const y of [74, 77]) { track.px(i, y, '#c9ced6'); track.px(i, y + 1, '#8a909a'); }
    if (i % 16 === 0) for (let y = 74; y < 82; y++) track.px(i, y, '#6a6f78');
    for (let y = ROAD; y < 93; y++) track.px(i, y, y === ROAD ? '#f4f1e6' : (i * 7 + y * 3) % 13 === 0 ? '#4a4e56' : '#3a3d44');
    for (let y = 93; y < 96; y++) track.px(i, y, y < 95 ? (Math.floor(i / 8) % 2 ? '#e8414b' : '#f4f1e6') : '#3f6a3a');
  }
  layers.track = track;
  const near = new Painter(TW, H), rn = rng(9);                              // trunks flicking past, low grass
  for (let x = 0; x < TW; x += 150 + Math.floor(rn() * 120)) for (let y = 0; y < H; y++) for (let k = 0; k < 4; k++) near.wpx(x + k, y, k === 0 ? '#16281e' : '#1e3a2a');
  for (let x = 0; x < TW; x++) for (let y = 95; y < H; y++) near.px(x, y, '#2f5236');
  layers.near = near;
  layers.car = golf();
  return { W, H, layers, signX: Math.round(W * 0.9) };
}

const labels = new Map();                // text -> pixel art, so the timer does not churn objects
function text(str, ink) {
  const k = str + ink;
  if (!labels.has(k)) labels.set(k, label(str, ink));
  return labels.get(k);
}

export function renderRing(ctx, t, s, env) {
  const { W, H, canvases: c } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  tile(ctx, c.hills, t * V * 0.06, 0);
  tile(ctx, c.mid, t * V * 0.25, 0);
  tile(ctx, c.track, t * V, 0);
  const sign = env.art(SIGN);                                                    // the sign whips past behind the barrier
  ctx.drawImage(sign, Math.round(s.signX - t * V * 0.55), 54);
  // the car: Yimeng behind the driver's window, then the body
  const cx = Math.round(W * 0.34) - 22, bob = Math.floor(t * 10) % 2, cy = ROAD - 24 + bob;
  const hero = env.hero('travel');
  ctx.save();
  ctx.beginPath(); ctx.rect(cx + 33, cy + 2, 14, 9); ctx.clip();
  ctx.fillStyle = '#27303d'; ctx.fillRect(cx + 20, cy, 30, 12);
  ctx.drawImage(hero.canvases[1], cx + 22, cy - 13);
  ctx.fillStyle = 'rgba(150, 175, 205, 0.22)'; ctx.fillRect(cx + 20, cy, 30, 12);
  ctx.restore();
  ctx.fillStyle = '#27303d'; ctx.fillRect(cx + 15, cy + 2, 16, 9);           // rear glass, tinted
  ctx.drawImage(c.car, cx, cy);
  // tyre smoke through the corner
  if (t > 0.7 && t < 1.5) {
    ctx.fillStyle = 'rgba(220, 222, 226, 0.55)';
    for (let k = 0; k < 6; k++) {
      const age = (t * 9 + k * 0.37) % 1, px = cx + 10 - age * 40, py = ROAD - 4 - age * 8;
      ctx.fillRect(Math.round(px), Math.round(py), 4 + Math.round(age * 4), 3);
    }
  }
  tile(ctx, c.near, t * V * 1.6, 0);
  // speed streaks
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  const rs = rng(4);
  for (let n = 0; n < 10; n++) {
    const y = 30 + Math.floor(rs() * 50), len = 10 + rs() * 30, x = ((rs() * W * 3 - t * V * 2.2) % (W + 60) + W + 60) % (W + 60) - 30;
    ctx.fillRect(Math.round(x), y, Math.round(len), 1);
  }
  // lap timer under the controls, running fast
  const secs = 474 + t * 4, m = Math.floor(secs / 60), sec = secs - m * 60;
  const txt = `${m}:${sec.toFixed(2).padStart(5, '0')}`;
  const lbl = env.art(text(txt, '#f4f1e6')), lap = env.art(text('LAP', '#e8b923'));
  const bx = W - lbl.width - lap.width - 14;
  ctx.fillStyle = 'rgba(11, 11, 12, 0.7)'; ctx.fillRect(bx, 20, lbl.width + lap.width + 10, 9);
  ctx.drawImage(lap, bx + 3, 22); ctx.drawImage(lbl, bx + lap.width + 7, 22);
}

export const ring = { build: buildRing, render: renderRing };
