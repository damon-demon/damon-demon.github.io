// Chapter 4, shot 5: fishing from the rocks. A dark outcrop over the Pacific, swell breaking white at
// its foot, a cypress headland and sea stacks along the horizon. Yimeng, in the bucket hat and vest,
// stands at the edge with the line straight down into the sea. The float bobs, ducks under, and a
// rockfish comes up out of the water on the line, flapping. The dog, in its life vest, hops behind.
import { Painter, rng } from '../pixels.js';
import { gradient, ridge, art } from '../kit.js';

const TOP = 66;                              // the row Yimeng's shoes rest on, on top of the rock
const HORIZON = 50, SEA = 84;                // the horizon; the row the float sits on
export const BITE = 0.65, LAND = 1.35;       // the float ducks under; the fish is up at the rod
const ROD_TIP = [27, -33];                   // from Yimeng's left edge and shoes: where the line leaves the rod
const LINE_END = -19;                        // and where the line in the sprite stops

// Where the fish is at t: in the water, being reeled up the line, or hanging under the rod tip.
export function fishAt(t) {
  if (t < BITE + 0.25) return 'water';
  return t < LAND ? 'reeling' : 'up';
}

// A rockfish hanging from the hook, head up: two frames, its tail flicking.
const ROCKFISH = [`
..r...
.rRr..
rRKRr.
rRRRRs
rRRRRs
.RRRRs
.rRRr.
..RR..
..rr..
.r..r.
r....r
`, `
..r...
.rRr..
rRKRr.
rRRRRs
rRRRRs
.RRRRs
.rRRr.
..RR..
..rr..
..rr..
..r.r.
`].map(rows => art(rows, { R: '#e0603a', r: '#b0402a', K: '#1a1214', s: '#f0a070' }, '#4a1a10'));
const FLOAT = art(`
.r.
rrr
www
`, { r: '#e83a2a', w: '#f4f1ea' }, '#2a2a30');
const BANG = art(`
#
#
#
.
#
`, { '#': '#ffd75e' }, '#5a3a10');

function rock(W, H, edge) {
  const p = new Painter(W, H), r = rng(19), top = ridge(W, 0, [[1.5, 3, 0.4], [1, 7, 1.2]]);
  for (let x = 0; x < W; x++) {
    if (x > edge + 6) break;
    const t0 = TOP + Math.round(top[x]) + (x > edge ? Math.round((x - edge) ** 1.6) : 0);
    for (let y = t0; y < SEA + 3; y++) {                                           // down to the waterline
      const d = y - t0, crack = (x * 7 + y * 3) % 23 === 0 || (x + y * 5) % 31 === 0, v = r();
      let c = d === 0 ? '#6a6a6e' : d < 3 ? '#4e4e54' : crack ? '#26262a' : (x + y) % 5 === 0 ? '#3a3a40' : '#424248';
      if (y > SEA - 5 && y < SEA && v < 0.12) c = '#c8c4ba';                        // barnacles above the tide line
      else if (y >= SEA - 1 && v < 0.45) c = v < 0.2 ? '#1e2430' : '#2a3240';        // mussels at it
      p.px(x, y, c);
    }
  }
  for (let n = 0; n < 6; n++) {                                                    // kelp washed up on the rock
    const x = Math.floor(r() * edge), y = TOP + 2 + Math.floor(r() * 8);
    for (let k = 0; k < 6; k++) p.px(x + k, y + (k % 2), k % 2 ? '#5a6a2a' : '#6e7e32');
  }
  return p;
}

function backdrop(W, H) {
  const p = new Painter(W, H), r = rng(8);
  const sky = gradient(W, H, [['#5a9ad8', 0], ['#7ab0e0', 0.25], ['#b4d4ea', 0.48], ['#5a86b4', 0.53], ['#3e6e9e', 0.7], ['#34608e', 0.9]]);
  p.data.set(sky.data);
  const hill = ridge(W, 9, [[3, 2, 0.5], [2, 5, 1.7]]);
  for (let x = 0; x < Math.round(W * 0.42); x++) {                                 // a headland, and cypresses on it
    const h = Math.round(hill[x] * (1 - x / (W * 0.42)) + 3 * (1 - x / (W * 0.42)));
    for (let y = HORIZON - h; y <= HORIZON; y++) p.px(x, y, y === HORIZON - h ? '#7a8a5a' : '#5a6a46');
  }
  for (let x0 = 4; x0 < W * 0.3; x0 += 18 + Math.floor(r() * 14)) {               // Monterey cypresses, bent inland by the wind
    const base = HORIZON - Math.round(hill[x0] * (1 - x0 / (W * 0.42))) - 1, h = 5 + Math.floor(r() * 4);
    for (let y = base - h; y <= base; y++) { const lx = x0 + Math.round((base - y) * -0.4); p.px(lx, y, '#2e2a24'); p.px(lx + 1, y, '#3e362c'); }
    const cx = x0 - Math.round(h * 0.4), cy = base - h;
    for (const [dx, dy, w, th] of [[-3, 0, 9, 3], [-5, -2, 7, 2], [1, -1, 6, 2], [-1, -4, 5, 2]]) for (let j = 0; j < th; j++) for (let i = -w; i <= w; i++) {
      if (Math.abs(i) > w - j || r() < 0.08) continue;
      p.px(cx + dx + i, cy + dy - j, j === th - 1 && i < 0 ? '#4a6038' : (i + j) % 4 === 0 ? '#22341e' : '#2e4228');
    }
  }
  for (const [fx, w, h] of [[0.72, 7, 9], [0.8, 4, 5], [0.9, 9, 6]]) {             // sea stacks
    const x0 = Math.round(W * fx);
    for (let y = HORIZON - h; y <= HORIZON; y++) for (let x = x0; x < x0 + w - Math.round((HORIZON - y) / 3); x++) p.px(x, y, x === x0 ? '#4a4a56' : '#5e5e6a');
  }
  return p;
}

export function buildFishing(W, H = 96) {
  const hx = Math.round(W * 0.34), edge = hx + 20, rd = rng(61);
  const swell = Array.from({ length: Math.round(W / 6) }, () => [Math.floor(rd() * W), HORIZON + 3 + Math.floor(rd() * (H - HORIZON - 4)), 3 + Math.floor(rd() * 6), rd() * 6]);
  return { W, H, hx, edge, swell, layers: { backdrop: backdrop(W, H), rock: rock(W, H, edge) } };
}

export function renderFishing(ctx, t, s, env) {
  const { W, H, canvases: c, hx, edge } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.backdrop, 0, 0);
  ctx.fillStyle = '#7ea4cc';                                                       // the swell rolling in
  for (const [x, y, len, ph] of s.swell) ctx.fillRect(Math.round((x + t * 8 + Math.sin(t * 2 + ph) * 2) % W), y, len, 1);
  const surge = (t * 0.8) % 1;                                                     // a wave breaking white at the rock's foot
  ctx.fillStyle = '#f4f6f8';
  for (let k = 0; k < 14; k++) {
    const a = k / 14 * Math.PI, rad = surge * 12;
    if (surge < 0.7) ctx.fillRect(Math.round(edge + 4 + Math.cos(a) * rad * 0.8), Math.round(SEA + 4 - Math.sin(a) * rad), 2, 1);
  }
  ctx.drawImage(c.rock, 0, 0);
  const hero = env.hero('fish', 'walk'), x = hx - hero.anchorX, y = TOP - hero.footY, sway = Math.round(Math.sin(t * 2.2) * 1.2);
  const tipX = hx + ROD_TIP[0], tipY = TOP + ROD_TIP[1], state = fishAt(t);
  const dog = env.dog('lifevest', 'wait'), hop = state === 'up' && Math.floor(t * 8) % 2 ? 2 : 0;   // the dog, behind on the rock
  ctx.drawImage(dog.canvases[Math.floor(t * (state === 'up' ? 10 : 4)) % 2], hx - 30, TOP - dog.footY - hop);
  ctx.drawImage(hero.canvases[1], x, y);
  ctx.fillStyle = '#e8e8ec';
  let lineTo = SEA - 1;
  if (state === 'reeling') lineTo = Math.round(SEA - 1 - (SEA - 1 - (TOP + LINE_END + 6)) * Math.min(1, (t - BITE - 0.25) / (LAND - BITE - 0.25)));
  if (state === 'up') lineTo = TOP + LINE_END + 6;
  ctx.fillRect(tipX, TOP + LINE_END, 1, Math.max(0, lineTo - (TOP + LINE_END)));    // the line, on down into the water
  if (state === 'water') {
    const dip = t > BITE ? (Math.floor(t * 14) % 2 ? 3 : 1) : 0, bob = Math.round(Math.sin(t * 5) * 1 + sway * 0.5);
    ctx.drawImage(env.art(FLOAT), tipX - 2, SEA - 3 + bob + dip);
    if (t > BITE) { ctx.fillStyle = '#f4f6f8'; const ring = Math.round((t - BITE) * 30); ctx.fillRect(tipX - 3 - ring, SEA + 1, 2, 1); ctx.fillRect(tipX + 2 + ring, SEA + 1, 2, 1); }
  } else {
    const fish = env.art(ROCKFISH[Math.floor(t * 12) % 2]);
    ctx.drawImage(fish, tipX - 2, lineTo - 1);
    if (state === 'reeling' && t < BITE + 0.5) {                                   // the splash as it leaves the water
      ctx.fillStyle = '#f4f6f8';
      for (let k = 0; k < 6; k++) ctx.fillRect(tipX - 5 + k * 2, SEA - 2 - ((k * 3) % 4) - Math.round((t - BITE - 0.25) * 20), 1, 1);
    }
  }
  if (t > BITE && t < BITE + 0.5) ctx.drawImage(env.art(BANG), hx + 9, y + 4);      // a bite!
}

export const fishing = { build: buildFishing, render: renderFishing };
