// Chapter 1, shot 5: Trolltunga. Yimeng walks out along the rock tongue, sits at the tip with legs
// dangling over the lake 700 m below, and the camera simply holds. The stillest moment in the film.
import { Painter, rng } from '../pixels.js';
import { gradient, ridge } from '../kit.js';

const TOP = 58;                          // the tongue's walking surface (row the shoes rest on)
const WALK_END = 1.15;                   // seconds of walking before sitting down
const STEP = 26;                         // walk speed, px/s

function range(p, W, base, amp, waves, cols, snowFrac) {
  // a mountain range: lit faces left of each crest, shaded right, snow fields near the tops
  const h = ridge(W * 2, amp, waves);
  for (let i = 0; i < W; i++) {
    const slope = h[i + 1] - h[i];
    for (let j = 0; j < h[i]; j++) {
      const y = base - j, fromTop = h[i] - j;
      let c = slope > 0 ? cols.lit : cols.shade;
      const cap = h[i] * snowFrac;
      if (fromTop < cap * 0.6 || (fromTop < cap && (i + y) % 2 === 0)) c = slope > 0 ? cols.snow : cols.snowShade;
      p.px(i, y, c);
    }
  }
}

export function buildTrolltunga(W, H = 96) {
  const layers = {}, tip = Math.round(W * 0.6);
  layers.sky = gradient(W, H, [['#4f88c8', 0], ['#6a9fd6', 0.3], ['#93bce4', 0.6], ['#c3dbf0', 0.9]]);
  const cl = new Painter(W * 2, 50), rc = rng(21);                        // a few soft clouds
  for (let n = 0; n < 6; n++) {
    const cx = rc() * W * 2, cy = 14 + rc() * 22, len = 16 + rc() * 30;
    for (let y = 0; y < 3; y++) for (let x = y * 3; x < len - y * 3; x++) if (y < 2 || (x + y) % 2) cl.wpx(cx + x, cy + y, y === 0 ? '#f4f8fc' : '#dfe9f4');
  }
  layers.clouds = cl;

  const mts = new Painter(W, H);
  range(mts, W, 74, 44, [[10, 2, 0.3], [6, 5, 1.1], [2.5, 13, 0.6]], { lit: '#a3b4c8', shade: '#8a9cb2', snow: '#f2f6fa', snowShade: '#d3dde8' }, 0.3, 1);
  range(mts, W, 84, 34, [[9, 3, 2.2], [4, 7, 0.4], [2, 17, 1.0]], { lit: '#7488a0', shade: '#5f7189', snow: '#e8eef5', snowShade: '#c3cfdc' }, 0.14, 2);
  for (let j = 70; j < H; j++) for (let i = 0; i < W; i++) {                // valley walls down to the water
    const right = W * 0.82 + Math.sin(j * 0.5) * 2 - (j - 70) * 0.9;
    const left = W * 0.34 + (j - 70) * 0.35 + Math.sin(j * 0.7) * 1.5;
    if (i > right || i < left) mts.px(i, j, (i * 3 + j * 5) % 7 === 0 ? '#3e4d45' : (i > right ? '#4c5d55' : '#55665d'));
  }
  for (let j = 84; j < H; j++) for (let i = 0; i < W; i++) {                // Ringedalsvatnet, far below
    const right = W * 0.82 - (j - 70) * 0.9, left = W * 0.34 + (j - 70) * 0.35;
    if (i >= left && i <= right) mts.px(i, j, j === 84 ? '#a6d6dc' : (i * 3 + j) % 11 === 0 ? '#5fb0b8' : '#3f8f9c');
  }
  layers.mts = mts;

  const rock = new Painter(W, H), rr = rng(12);                           // the cliff and its tongue
  const cliffEdge = Math.round(W * 0.3);
  for (let i = 0; i <= tip; i++) {
    const lift = i > tip - 20 ? (i - (tip - 20)) * 0.09 : 0;               // the tip curls up a little
    const top = TOP - Math.round(lift) + (i < cliffEdge ? Math.round(Math.sin(i * 0.31) + Math.sin(i * 0.13)) - 1 : 0);
    const thick = i < cliffEdge ? H : Math.round(10 - (i - cliffEdge) / (tip - cliffEdge) * 4 + Math.sin(i * 0.9) * 1.2 + (rr() < 0.15 ? 1 : 0));
    const bottom = i < cliffEdge ? H : TOP - Math.round(lift) + thick;
    for (let j = top; j < bottom; j++) {
      const depth = j - top;
      let c = depth === 0 ? '#b3aa9c' : depth < 2 ? '#9a9286' : (i * 5 + j * 3) % 9 === 0 ? '#5a554f' : '#77716a';
      if (i < cliffEdge && i > cliffEdge - 8 && depth > 6) c = (i + j) % 3 ? '#5f5a54' : '#4f4a45';   // the cliff face in shade
      if (i >= cliffEdge && j >= bottom - 2) c = '#4f4a45';                  // rough underside
      rock.px(i, j, c);
    }
  }
  for (let n = 0; n < 60; n++) rock.px(Math.floor(rr() * (cliffEdge - 8)), TOP + 6 + Math.floor(rr() * 34), rr() < 0.5 ? '#8f877c' : '#4f4a45');
  layers.rock = rock;

  const mist = new Painter(W, H);                                          // haze between the tongue and the lake
  for (let j = 72; j < 84; j++) for (let i = 0; i < W; i++) if ((i + j * 2) % (j < 78 ? 3 : 2) === 0) mist.px(i, j, '#e6eef5');
  layers.mist = mist;
  return { W, H, layers, tip };
}

export function renderTrolltunga(ctx, t, s, env) {
  const { W, H, canvases: c } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  ctx.drawImage(c.clouds, Math.round(-t * 3), 0);
  ctx.drawImage(c.mts, 0, 0);
  ctx.globalAlpha = 0.35; ctx.drawImage(c.mist, Math.round(-t * 2), 0); ctx.globalAlpha = 1;
  ctx.drawImage(c.rock, 0, 0);
  const sitX = s.tip - 12;                          // with the knees over the edge
  if (t < WALK_END) {
    const hero = env.hero('trolltunga');
    const x = sitX - (WALK_END - t) * STEP;
    ctx.drawImage(hero.canvases[Math.floor(t * 6) % 4], Math.round(x) - hero.anchorX, TOP - hero.footY);
  } else {
    const hero = env.hero('trolltunga', 'sit');
    ctx.drawImage(hero.canvases[Math.floor((t - WALK_END) * 2) % 2], sitX - hero.anchorX, TOP - 1 - hero.seatY);
  }
}

export const trolltunga = { build: buildTrolltunga, render: renderTrolltunga };
