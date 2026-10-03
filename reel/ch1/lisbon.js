// Chapter 1, shot 3: Lisbon. The yellow 28 tram grinds up a steep street of tiled facades; below the
// street a limestone retaining wall with an iron railing, azulejo panels and bougainvillea; far off,
// the Tagus and the red 25 de Abril bridge. The camera climbs with the tram.
import { Painter, rng } from '../pixels.js';
import { gradient, label } from '../kit.js';

const SLOPE = 0.16;                      // the street rises 1 px for every ~6 px
const V = 34;                            // tram speed along x, px/s
const RAIL = 80;                         // screen row of the rail under the tram (fixed: the camera follows)

const FACADES = ['#e9a3a0', '#ecc76a', '#8fb9d6', '#a8d5b5', '#efe9dd', '#e7b48c'];
const LAUNDRY = ['#e8414b', '#f4f1ea', '#3f6fb5', '#f2c22e', '#4f9a4a'];

function tramArt() {
  const W = 50, H = 30, p = new Painter(W, H);
  const Y = '#f2c22e', y = '#d4a41f', C = '#f4efe2', K = '#2a2a2e', G = '#2c3a4a';
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const front = i > W - 6 ? (i - (W - 6)) : 0;               // rounded front end
    if (j < front - 2) continue;
    let c = null;
    if (j < 2) c = i > 3 && i < W - 4 ? C : null;
    else if (j < 4) c = C;
    else if (j < 6) c = Y;
    else if (j < 14) c = ((i - 3) % 8 < 6 && i > 2 && i < W - 3) ? G : Y;    // windows
    else if (j === 14) c = C;
    else if (j < 24) c = (j === 19 ? y : Y);
    else if (j < 26) c = K;
    if (c) p.px(i, j, c);
  }
  for (let i = 3; i < W - 3; i += 8) for (let j = 6; j < 14; j++) p.px(i + 6, j, C);   // window pillars
  for (const cx of [11, 37]) for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (i * i + j * j <= 5) p.px(cx + i, 27 + j, j < 0 && i < 0 ? '#4a4a50' : K);
  p.rect(W - 4, 20, 2, 2, '#fff6c8');                          // headlight
  p.rect(W - 13, 2, 9, 3, K);                                  // destination board "28"
  const n = label('28', '#f2c22e');
  for (let j = 0; j < 5; j++) for (let i = 0; i < n.w; i++) if (n.rows[j][i] === '#') p.px(W - 12 + i + 1, j - 1 + 2, '#f2c22e');
  return p;
}

function farView(W) {
  // the Tagus far below with the 25 de Abril bridge and a band of distant roofs
  const p = new Painter(W, 70);
  for (let j = 30; j < 70; j++) for (let i = 0; i < W; i++) p.px(i, j, j < 31 ? '#a9c9d9' : (i + j) % 9 === 0 ? '#8fb6d0' : '#78a6c6');
  for (let i = 0; i < W; i++) for (let j = 26; j < 30; j++) p.px(i, j, j === 26 ? '#b5c4a8' : '#9fb59a');   // the far bank
  const bx = Math.round(W * 0.08), span = Math.round(W * 0.55);
  for (let i = bx - 14; i < bx + span + 14; i++) p.px(i, 25, '#b8402e');                 // deck
  for (const tx of [bx, bx + span]) for (let j = 12; j < 26; j++) { p.px(tx, j, '#c8462f'); p.px(tx + 1, j, '#a83a28'); }
  for (let i = 0; i <= span; i++) {
    const sag = 12 + Math.round(11 * (1 - Math.pow((i / span) * 2 - 1, 2)));
    p.px(bx + i, sag, '#c8462f');
    if (i % 6 === 0) for (let j = sag + 1; j < 25; j++) p.px(bx + i, j, '#d47a62');
  }
  const r = rng(3);
  for (let i = 0; i < W; i += 3) {                                                      // roofs down by the river
    const h = 2 + Math.floor(r() * 4);
    for (let j = 0; j < h; j++) p.px(i, 44 - j, j === h - 1 ? '#c0603e' : '#efe7d8');
    p.px(i + 1, 44 - h + 1, '#a84f32');
  }
  for (let j = 45; j < 70; j++) for (let i = 0; i < W; i++) p.px(i, j, (i + j) % 5 === 0 ? '#c0603e' : (i * 3 + j) % 7 === 0 ? '#a84f32' : '#e6dccb');
  return p;
}

export function buildLisbon(W, H = 96) {
  const hx = Math.round(W * 0.34);
  const run = W + V * 2 + 60;                                   // how far the street must extend
  const top = Math.floor(RAIL - SLOPE * (run - hx)) - 72;         // the highest row any house reaches
  const LH = H + 24 - top;
  const st = new Painter(run, LH);                               // world strip: strip row 0 = screen row `top` at t = 0
  const kerb = (x) => Math.round(RAIL - 6 - SLOPE * (x - hx)) - top;   // the far kerb, where the houses stand
  const r = rng(28);

  for (let bx = -10, n = 0; bx < run; bx += 22, n++) {          // houses climbing the hill
    const h = 38 + Math.floor(r() * 12), col = FACADES[n % FACADES.length], tiled = n % 3 === 1;
    const roof = kerb(bx + 21) - h;                               // flat roofline, set by the uphill corner
    for (let i = bx; i < bx + 21; i++) {
      const base = kerb(i);
      for (let j = roof; j < base; j++) {
        let c = tiled && ((i >> 1) + (j >> 1)) % 2 === 0 ? '#3f6fb5' : (tiled ? '#e8eef6' : col);
        if (j >= base - 3) c = (i + j) % 4 === 0 ? '#b9ae98' : '#d4c9b3';      // stone plinth along the slope
        st.px(i, j, c);
      }
    }
    for (let i = bx - 1; i < bx + 22; i++) { st.px(i, roof - 1, '#c0603e'); st.px(i, roof - 2, '#a84f32'); }
    for (let fy = roof + 4; fy < kerb(bx + 16) - 12; fy += 9) for (const fx of [bx + 3, bx + 12]) {
      st.rect(fx, fy, 5, 6, '#2f3646'); st.rect(fx - 1, fy, 1, 6, '#3d7a4a'); st.rect(fx + 5, fy, 1, 6, '#3d7a4a');
      st.rect(fx - 1, fy + 6, 7, 1, '#2a2a2e');                   // iron balcony
    }
    const dx = bx + 14, db = kerb(dx + 2);                        // the front door, on the street
    st.rect(dx - 1, db - 10, 6, 10, '#d4c9b3'); st.rect(dx, db - 9, 4, 9, n % 2 ? '#3d5a7a' : '#6b2f2a');
    if (n % 2 === 0) {                                          // laundry strung between windows
      const ly = roof + 12;
      for (let i = bx + 2; i < bx + 20; i++) st.px(i, ly, '#5a5a60');
      for (let k = 0; k < 5; k++) st.rect(bx + 3 + k * 3, ly + 1, 2, 3, LAUNDRY[(n + k) % LAUNDRY.length]);
    }
  }
  for (let x = 0; x < run; x++) {
    const k = kerb(x);
    st.px(x, k, '#e8e1d2');                                       // far kerb
    for (let j = k + 1; j < k + 7; j++) st.px(x, j, (x + j * 3) % 5 === 0 ? '#9a9387' : '#bdb5a3');   // calcada
    st.px(x, k + 4, '#55504a'); st.px(x, k + 6, '#55504a');      // rails
    st.px(x, k + 7, '#e8e1d2');                                   // near kerb
    for (let j = k + 8; j < LH; j++) {                            // limestone retaining wall
      const row = Math.floor((j - k - 8) / 4), joint = (j - k - 8) % 4 === 0 || (x + row * 7) % 12 === 0;
      st.px(x, j, joint ? '#b3a78f' : (x * 3 + j) % 17 === 0 ? '#cfc4ad' : '#dcd2bd');
    }
    if (x % 5 === 0) for (let j = k + 7; j > k + 3; j--) st.px(x, j + 4, '#2a2a2e');   // railing posts
    st.px(x, k + 8, '#2a2a2e');                                   // railing top
  }
  for (let px0 = 30; px0 < run; px0 += 96) {                      // azulejo panels set into the wall
    const k = kerb(px0 + 12);
    for (let j = k + 14; j < k + 26; j++) for (let i = px0; i < px0 + 24; i++) st.px(i, j, (i === px0 || i === px0 + 23 || j === k + 14 || j === k + 25) ? '#2f5fa8' : ((i >> 1) + (j >> 1)) % 2 ? '#e9eef6' : '#4f7fc4');
  }
  for (let bx = 70; bx < run; bx += 130) {                         // bougainvillea spilling over the railing
    const k = kerb(bx);
    for (let n = 0; n < 40; n++) st.px(bx + Math.floor(r() * 16), k + 8 + Math.floor(r() * (6 + n / 6)), r() < 0.7 ? '#d63c8a' : '#3f7a3a');
  }
  return { W, H, hx, top, kerb, layers: { sky: gradient(W, H, [['#6fa9e0', 0], ['#86b9e6', 0.3], ['#a8cdee', 0.6], ['#cfe4f5', 0.9]]), far: farView(W), street: st, tram: tramArt() } };
}

export function renderLisbon(ctx, t, s, env) {
  const { W, H, canvases: c } = s;
  const cx = t * V, cy = -SLOPE * t * V;                          // the camera climbs with the tram
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  ctx.drawImage(c.far, 0, Math.round(-cy * 0.12) + 4);
  ctx.drawImage(c.street, -Math.round(cx), Math.round(s.top - cy));
  // the overhead wire, parallel to the street
  ctx.fillStyle = '#2a2a2e';
  for (let x = 0; x < W; x++) ctx.fillRect(x, Math.round(RAIL - 40 - SLOPE * (x - s.hx)), 1, 1);
  // Yimeng at the tram's front window, then the tram body sheared onto the slope
  const tx = s.hx - 8, ty = RAIL - 27;                            // wheels on the rails
  const hero = env.hero('travel'), bob = Math.floor(t * 6) % 2;
  const shear = (i) => Math.round(SLOPE * i);
  ctx.save();
  ctx.beginPath(); ctx.rect(tx + 35, ty + 6 - shear(37) + bob, 6, 8); ctx.clip();
  ctx.fillStyle = '#4a3a30'; ctx.fillRect(tx + 35, ty + 6 - shear(37) + bob, 6, 8);
  ctx.drawImage(hero.canvases[1], tx + 14, ty - 14 - shear(37) + bob);
  ctx.restore();
  for (let i = 0; i < c.tram.width; i++) {
    const dy = ty - shear(i) + bob;
    if (i >= 35 && i <= 40) {                                     // leave Yimeng's window open
      ctx.drawImage(c.tram, i, 0, 1, 6, tx + i, dy, 1, 6);
      ctx.drawImage(c.tram, i, 14, 1, c.tram.height - 14, tx + i, dy + 14, 1, c.tram.height - 14);
    } else ctx.drawImage(c.tram, i, 0, 1, c.tram.height, tx + i, dy, 1, c.tram.height);
  }
  ctx.fillStyle = '#2a2a2e';                                      // trolley pole up to the wire
  for (let k = 0; k < 14; k++) ctx.fillRect(tx + 22 + k, ty - 1 - shear(22) - k + bob, 1, 1);
}

export const lisbon = { build: buildLisbon, render: renderLisbon };
