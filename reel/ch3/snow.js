// Chapter 3, shot 1: Michigan. Flat white land under a low grey sky, bare trees, and Beaumont Tower,
// Michigan State's brick carillon tower, with snow on its ledges. The snow from Columbia keeps
// falling as the white clears. Yimeng walks on in the green puffer, the puppy trotting ahead, and
// leaves footprints behind.
import { Painter, rng } from '../pixels.js';
import { gradient, ridge, tile } from '../kit.js';

const SPEED = 26;                            // walk speed, px/s
const GROUND = 88;                           // the row Yimeng's shoes rest on
const CLEAR = 0.6;                           // the white from the cap toss fades out over this long
const SKY = [['#8c929a', 0], ['#9aa0a8', 0.3], ['#acb2b9', 0.6], ['#c2c6cc', 0.9]];
const SNOW = '#e8eaec', SHADE = '#cfd4da', BRICK = '#8a5e52', MORTAR = '#77504a', STONE = '#b9b5ae';

// Beaumont Tower: a square brick tower with stone quoins and bands, a pointed-arch door, lancet
// windows, a belfry of tall pointed openings with louvres, and a parapet with a pinnacle at each corner.
function tower(p, cx, base) {
  const hw = 10, top = base - 56;
  for (let y = top; y < base; y++) for (let x = cx - hw; x <= cx + hw; x++) {
    const quoin = (x === cx - hw || x === cx + hw) && Math.floor((y - top) / 2) % 2 === 0;
    p.px(x, y, quoin ? STONE : (x + (y >> 1)) % 4 === 0 && y % 2 === 0 ? MORTAR : x > cx + 6 ? '#7c544a' : BRICK);
  }
  for (let y = base - 3; y < base; y++) for (let x = cx - hw - 1; x <= cx + hw + 1; x++) p.px(x, y, STONE);   // the stone plinth
  for (const y of [top + 16, top + 32, base - 18]) for (let x = cx - hw - 1; x <= cx + hw + 1; x++) { p.px(x, y, STONE); p.px(x, y - 1, SNOW); }   // stone bands, snow on them
  for (const bx of [cx - 6, cx + 2]) {                                             // the belfry's tall pointed openings, louvred
    for (let y = top + 4; y < top + 14; y++) for (let x = bx; x < bx + 5; x++) p.px(x, y, y % 2 ? '#3c4048' : '#5c6068');
    for (let k = 0; k < 2; k++) for (let x = bx + k; x < bx + 5 - k; x++) p.px(x, top + 3 - k, STONE);
    p.px(bx + 2, top + 1, STONE);
  }
  for (const wx of [cx - 4, cx + 3]) for (let y = top + 20; y < top + 29; y++) p.px(wx, y, y === top + 20 ? STONE : '#3c4048');   // lancet windows
  for (let y = base - 15; y < base - 3; y++) {                                     // the pointed-arch door in a stone frame
    const half = y < base - 11 ? (y - (base - 15)) : 4;
    for (let x = cx - half - 1; x <= cx + half + 1; x++) p.px(x, y, Math.abs(x - cx) > half ? STONE : '#4a3c36');
  }
  for (let x = cx - hw - 1; x <= cx + hw + 1; x++) { p.px(x, top - 1, STONE); p.px(x, top - 2, (x - cx) % 3 === 0 ? STONE : SNOW); }   // the parapet
  for (const px0 of [cx - hw - 1, cx + hw - 2]) for (let k = 0; k < 11; k++) {    // corner pinnacles, with a notch of crockets
    const w = k < 4 ? 4 : k < 8 ? 2 : 1, off = k < 4 ? 0 : k < 8 ? 1 : 1.5;
    for (let i = 0; i < w; i++) p.px(px0 + i + off, top - 3 - k, k === 0 || k === 4 ? SNOW : STONE);
  }
}

function bareTree(p, x, base, h, seed) {
  const r = rng(seed);
  for (let y = base - h; y < base; y++) p.px(x, y, '#4e4a48');
  p.px(x + 1, base - 1, '#4e4a48');
  const branch = (x0, y0, len, dir, depth) => {                                    // forked twigs, snow on the upper side
    let bx = x0, by = y0;
    for (let i = 0; i < len; i++) {
      bx += dir * (0.6 + r() * 0.5); by -= 0.8 + r() * 0.4;
      p.px(Math.round(bx), Math.round(by), '#5a5654');
      if (i % 3 === 1) p.px(Math.round(bx), Math.round(by) - 1, '#dcdfe2');
    }
    if (depth < 2) { branch(bx, by, len * 0.6, dir, depth + 1); branch(bx, by, len * 0.5, -dir * 0.5, depth + 1); }
  };
  branch(x, base - h * 0.55, h * 0.45, -1, 0); branch(x, base - h * 0.7, h * 0.4, 1, 0); branch(x, base - h, h * 0.3, 0.3, 1);
}

function pine(p, x, base, h) {
  for (let j = 0; j < h; j++) {
    const half = Math.round((j / h) * h * 0.32) + (j % 4 === 3 ? -1 : 0);
    for (let i = -half; i <= half; i++) p.px(x + i, base - h + j, (j % 4 === 0 && Math.abs(i) < half) ? '#d8dcdf' : i > 0 ? '#3f4c46' : '#4a5a52');
  }
  p.rect(x - 1, base, 2, 2, '#4e4a48');
}

export function buildSnow(W, H = 96) {
  const TW = W * 2, layers = {};
  layers.sky = gradient(W, H, SKY);
  const far = new Painter(TW, H);                                                   // a low line of bare woods on the flat horizon
  const woods = ridge(TW, 7, [[2, 5, 0.4], [1, 13, 1.1]]);
  for (let x = 0; x < TW; x++) for (let j = 0; j < woods[x]; j++) far.px(x, 71 - j, (x + j) % 3 ? '#7a7674' : '#8a8684');
  for (let y = 71; y < H; y++) for (let x = 0; x < TW; x++) far.px(x, y, y === 71 ? '#dfe2e5' : (x * 3 + y * 7) % 19 === 0 ? SHADE : SNOW);
  layers.far = far;
  const mid = new Painter(TW, H);                                                   // the tower among trees, at a third of walking pace
  tower(mid, Math.round(W * 0.62), 77);
  for (const [fx, h, s] of [[0.18, 26, 1], [0.42, 22, 2], [0.8, 28, 3], [1.15, 24, 4], [1.45, 27, 5], [1.75, 21, 6]]) bareTree(mid, Math.round(fx * W), 76, h, s);
  for (const fx of [0.5, 0.73, 1.3, 1.6]) pine(mid, Math.round(fx * W), 76, 16);
  for (let x = 0; x < TW; x++) for (let y = 76; y < 79; y++) mid.px(x, y, y === 76 ? '#d4d8dc' : SNOW);   // the snowy lawn they stand in
  layers.mid = mid;
  const ground = new Painter(TW, H);                                                // the near snow, with a trodden path
  for (let y = 79; y < H; y++) for (let x = 0; x < TW; x++) {
    let c = (x * 7 + y * 3) % 23 === 0 ? SHADE : SNOW;
    if (y >= 86 && y <= 90) c = (x + y) % 5 === 0 ? '#c4c9cf' : '#d6dade';
    ground.px(x, y, c);
  }
  layers.ground = ground;
  const r = rng(8), flakes = [];
  for (let n = 0; n < Math.round(W / 4); n++) flakes.push({ x: r() * W, y: r() * (H + 8), v: 10 + r() * 12, ph: r() * 6, big: r() < 0.25 });
  return { W, H, TW, hx: Math.round(W * 0.34), flakes, layers };
}

export function renderSnow(ctx, t, s, env) {
  const { W, H, canvases: c, hx } = s, off = t * SPEED;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  tile(ctx, c.far, off * 0.1, 0);
  tile(ctx, c.mid, off * 0.3, 0);
  tile(ctx, c.ground, off, 0);
  // footprints: three steps a second, each left where a shoe came down and drifting back with the snow
  ctx.fillStyle = '#b4bac2';
  for (let k = Math.floor(t * 3); k > Math.floor(t * 3) - 12; k--) {
    const x = hx + 12 - SPEED * (t - k / 3);
    if (x < hx + 6) ctx.fillRect(Math.round(x), GROUND + (k % 2), 2, 1);
  }
  const hero = env.hero('mi_winter', 'walk', 'muted'), dog = env.dog('pup', 'trot', 'muted');
  ctx.drawImage(hero.canvases[Math.floor(t * 6) % 4], hx - hero.anchorX, GROUND - hero.footY);
  ctx.drawImage(dog.canvases[Math.floor(t * 9) % 4], hx + 26 - dog.anchorX, GROUND - dog.footY);
  ctx.fillStyle = '#ffffff';
  for (const f of s.flakes) {                                                       // still snowing
    const y = ((f.y + t * f.v) % (H + 8)) - 4, x = ((f.x + Math.sin(t * 1.5 + f.ph) * 3 - t * 6) % W + W) % W;
    ctx.fillRect(Math.round(x), Math.round(y), f.big ? 2 : 1, f.big ? 2 : 1);
  }
  if (t < CLEAR) { ctx.globalAlpha = 0.85 * (1 - t / CLEAR); ctx.fillStyle = '#dfe6ee'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }   // the white of the cap toss clears
}

export const snow = { build: buildSnow, render: renderSnow };
