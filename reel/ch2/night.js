// Chapter 2, shot 2: Manhattan by night, in black and gold. The camera opens on the Art Deco crowns
// of the Chrysler and Empire State buildings, a sunburst and sweeping searchlights, then tilts down
// to the street, where Yimeng walks up to a black-and-gold restaurant and steps into its light.
import { Painter, rng } from '../pixels.js';
import { gradient } from '../kit.js';

const V = 26;                                // walk speed, px/s
const STOP = [0.95, 1.3];                    // the camera slows over this span and stops; Yimeng walks on
const TILT = [0.25, 1.05];                   // the tilt down from the crowns to the street
const SIDEWALK = 87;                         // the row Yimeng's shoes rest on
const ENTER = 1.55;                          // Yimeng steps into the door's light

const SKY = [['#060609', 0], ['#0a0b12', 0.3], ['#10121d', 0.6], ['#1a1a24', 0.85], ['#262218', 0.97]];
const GOLD = '#d9b44a', DEEP = '#9c7c2c', LIT = '#f2d27a', WARM = '#ffe6a6', BLACK = '#0c0c11';

const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : (1 - Math.cos(u * Math.PI)) / 2);
const tiltAt = (t) => ease((t - TILT[0]) / (TILT[1] - TILT[0]));

// How far the camera has tracked Yimeng: walking pace, then easing to a stop.
export function camAt(t) {
  const [a, b] = STOP, u = Math.min(Math.max(t, a), b) - a;
  return V * Math.min(t, a) + V * (u - (u * u) / (2 * (b - a)));
}

// ---------- the skyline ----------
// Every tall layer is drawn in street-view coordinates: row 0 of a Painter sits `top` rows above
// the view, and the tilt starts with each layer pushed down by its own `range`.
const MID = { top: 64, range: 84 }, FAR = { top: 26, range: 46 }, STREET = { top: 0, range: 118 };

function windows(p, x0, x1, y0, y1, r, far) {
  // Deco towers light in vertical runs, not confetti: each column of windows is on or off in stretches
  for (let x = x0; x <= x1; x += 2) {
    let on = r() < 0.35;
    for (let y = y0; y <= y1; y += 2) {
      if (r() < 0.18) on = !on;
      if (on) p.px(x, y, far ? (r() < 0.2 ? '#5e4c26' : '#3c3320') : r() < 0.12 ? WARM : r() < 0.5 ? '#c9a24a' : '#8a6e30');
    }
  }
}

function decoTower(p, x, w, top, base, r, far) {
  const body = far ? '#13141c' : BLACK;
  const steps = [[0, 0], [Math.round((base - top) * 0.12), 2], [Math.round((base - top) * 0.26), 3]];
  for (const [dy, inset] of [...steps].reverse()) {
    for (let y = top + dy; y < base; y++) for (let i = x + inset; i < x + w - inset; i++) p.px(i, y, body);
  }
  steps.forEach(([dy, inset], k) => {
    if (far) return;
    for (let i = x + inset; i < x + w - inset; i++) p.px(i, top + dy, k === 0 ? LIT : GOLD);       // gold setback lines
  });
  windows(p, x + 2, x + w - 3, top + 4, base - 2, r, far);
}

function chrysler(p, x, top, base) {
  for (let y = top; y < top + 13; y++) p.px(x, y, y < top + 5 ? '#f4f1e6' : '#c8ccd4');          // the spire
  const arches = [[10, top + 38], [8.2, top + 31], [6.4, top + 24.5], [4.6, top + 18.5]];          // [radius, centre row]
  for (const [rad, cy] of arches) {
    for (let y = Math.round(cy - rad * 1.35); y <= cy; y++) for (let i = -rad; i <= rad; i++) {    // fill the terrace
      if ((i * i) / (rad * rad) + Math.pow((cy - y) / (rad * 1.35), 2) <= 1) p.px(x + i, y, '#16171e');
    }
    for (let a = 0; a <= Math.PI + 0.01; a += 0.03) p.px(Math.round(x + Math.cos(a) * rad), Math.round(cy - Math.sin(a) * rad * 1.35), '#e6e9ee');
    for (let a = 0.3; a < Math.PI - 0.15; a += 0.48) {                                            // triangular windows, lit
      const wx = Math.round(x + Math.cos(a) * (rad - 1.8)), wy = Math.round(cy - Math.sin(a) * (rad - 1.8) * 1.35);
      p.px(wx, wy, WARM); p.px(wx, wy + 1, LIT); p.px(wx - 1, wy + 1, GOLD); p.px(wx + 1, wy + 1, GOLD);
    }
  }
  for (let y = top + 38; y < base; y++) for (let i = -11; i <= 11; i++) p.px(x + i, y, Math.abs(i) === 11 ? '#2a2b33' : BLACK);
  for (let i = -12; i <= 12; i++) { p.px(x + i, top + 39, '#c8ccd4'); p.px(x + i, top + 50, GOLD); }   // the eagles' ledge
  p.px(x - 12, top + 40, '#c8ccd4'); p.px(x + 12, top + 40, '#c8ccd4');
  for (let y = top + 42; y < base; y += 2) for (let i = -9; i <= 9; i += 2) if ((i * 7 + y) % 5) p.px(x + i, y, (i + y) % 3 ? '#a8862a' : '#5a4a26');
}

function empire(p, x, top, base) {
  for (let y = top; y < top + 12; y++) p.px(x, y, y === top ? '#ff4a4a' : '#9aa0aa');               // the mast, red light on top
  for (let y = top + 12; y < top + 20; y++) for (let i = -2; i <= 2; i++) p.px(x + i, y, (y + i) % 2 ? '#ffe9b0' : '#e8c070');   // floodlit lantern
  for (const [y0, hw] of [[top + 20, 4], [top + 25, 6], [top + 33, 8], [top + 44, 11]]) {
    for (let y = y0; y < base; y++) for (let i = -hw; i <= hw; i++) p.px(x + i, y, Math.abs(i) === hw ? '#2a2b33' : BLACK);
    for (let i = -hw; i <= hw; i++) p.px(x + i, y0, y0 < top + 30 ? WARM : GOLD);
  }
  for (let y = top + 22; y < base; y += 2) for (let i = -9; i <= 9; i += 2) if (Math.abs(i) < (y < top + 33 ? 5 : y < top + 44 ? 7 : 10) && (i * 5 + y) % 7) p.px(x + i, y, (i + y) % 4 ? '#c9a24a' : '#f2d27a');
}

// A faint Art Deco sunburst fanning out behind the skyline, like a 1930s poster.
function sunburst(W, H) {
  const p = new Painter(W, H), ox = W / 2, oy = 92;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const a = Math.atan2(oy - y, x - ox), ray = Math.floor((a / Math.PI) * 26) % 2 === 0;
    const d = Math.hypot(x - ox, (oy - y) * 1.6);
    if (ray && d > 30 && (x + y) % 2 === 0) p.px(x, y, d < 120 ? '#2a2414' : '#1c1a14');
  }
  return p;
}

function buildMid(W) {
  const LH = MID.top + 60, p = new Painter(W + 80, LH), r = rng(7);
  for (let x = -6; x < W + 80; x += 18 + Math.floor(r() * 10)) {
    const w = 14 + Math.floor(r() * 10), top = 40 + Math.floor(r() * 40);
    decoTower(p, x, w, top, LH, r, false);
  }
  chrysler(p, Math.round(W * 0.26) + 20, 0, LH);
  empire(p, Math.round(W * 0.72) + 20, 12, LH);
  return p;
}

function buildFar(W) {
  const LH = FAR.top + 60, p = new Painter(W + 40, LH), r = rng(13);
  for (let x = -4; x < W + 40; x += 10 + Math.floor(r() * 9)) decoTower(p, x, 12 + Math.floor(r() * 9), 6 + Math.floor(r() * 34), LH, r, true);
  return p;
}

// ---------- the street ----------
function facade(p, x, w, top, r, kind) {
  for (let y = top; y < 84; y++) for (let i = x; i < x + w; i++) p.px(i, y, BLACK);
  for (let i = x; i < x + w; i++) { p.px(i, top, GOLD); p.px(i, top + 2, DEEP); }
  for (let i = x + 1; i < x + w - 1; i++) if ((i - x) % 4 < 2) p.px(i, top + 1, GOLD); else p.px(i, top + 3, GOLD);   // chevron frieze
  const sx = x + Math.round(w / 2);
  if (kind === 0) {                                                            // a shop window under a sunburst
    for (let i = x + 5; i < x + w - 5; i += 6) for (let y = top + 7; y < 62; y += 5) if (r() < 0.55) p.rect(i, y, 3, 3, r() < 0.3 ? WARM : '#c9a24a');
    p.rect(sx - 9, 70, 18, 13, '#2a2010'); p.rect(sx - 8, 71, 16, 11, '#e2b860'); p.rect(sx - 8, 78, 16, 1, '#b8903a');
    for (let k = 0; k < 7; k++) {
      const a = Math.PI * (k + 0.5) / 7;
      for (let q = 2; q < 6; q++) p.px(Math.round(sx + Math.cos(a) * q * 1.6), Math.round(69 - Math.sin(a) * q), GOLD);
    }
  } else if (kind === 1) {                                                     // tall fluted piers, a gold canopy over the entrance
    for (let i = x + 3; i < x + w - 3; i += 4) for (let y = top + 6; y < 84; y++) p.px(i, y, (y + i) % 9 ? '#1e1b12' : '#3a3018');
    for (let i = x + 5; i < x + w - 5; i += 4) for (let y = top + 8; y < 66; y += 3) if (r() < 0.4) p.rect(i, y, 2, 2, '#c9a24a');
    p.rect(sx - 8, 69, 16, 2, GOLD); p.rect(sx - 7, 71, 14, 1, DEEP);
    p.rect(sx - 4, 72, 8, 12, '#3a2c14'); p.rect(sx - 3, 73, 6, 11, '#d9b060'); p.rect(sx, 73, 1, 11, DEEP);
  } else {                                                                     // an apartment block, a few windows lit
    for (let i = x + 4; i < x + w - 4; i += 5) for (let y = top + 7; y < 80; y += 6) {
      const v = r();
      p.rect(i, y, 3, 4, v < 0.3 ? '#e2b860' : v < 0.45 ? WARM : '#1a1a22');
      p.rect(i - 1, y + 4, 5, 1, '#2a2618');
    }
  }
}

function restaurant(p, x) {
  // black marble, gold-edged; a double door full of warm light under a gilt Art Deco fan
  const w = 64, top = 40;
  for (let y = top; y < 84; y++) for (let i = x; i < x + w; i++) p.px(i, y, (i * 3 + y * 7) % 23 === 0 ? '#24242c' : '#101014');
  for (let i = x; i < x + w; i++) { p.px(i, top, GOLD); p.px(i, top + 1, DEEP); }
  for (let y = top; y < 84; y++) { p.px(x, y, GOLD); p.px(x + w - 1, y, GOLD); }
  const dx = x + 25;
  p.rect(dx - 2, 58, 18, 26, GOLD); p.rect(dx - 1, 59, 16, 25, '#3a2c14');      // door frame
  p.rect(dx, 60, 6, 24, WARM); p.rect(dx + 8, 60, 6, 24, WARM);                  // glass doors
  for (const gx of [dx + 6, dx + 7]) for (let y = 60; y < 84; y++) p.px(gx, y, DEEP);
  for (const [i, y] of [[dx + 4, 71], [dx + 9, 71]]) p.rect(i, y, 1, 3, DEEP);   // handles
  for (let k = 0; k < 9; k++) {                                                  // the fan over the door
    const a = Math.PI * (k + 0.5) / 9;
    for (let q = 3; q < 12; q++) p.px(Math.round(dx + 7 + Math.cos(a) * q * 1.25), Math.round(57 - Math.sin(a) * q), q > 9 ? LIT : GOLD);
  }
  for (let i = dx - 8; i < dx + 23; i++) p.px(i, 57, GOLD);
  for (const tx of [x + 6, x + w - 12]) {                                        // topiaries in gold planters
    p.rect(tx, 77, 6, 7, GOLD); p.rect(tx + 1, 78, 4, 6, DEEP);
    for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (i * i + j * j <= 16) p.px(tx + 3 + i, 71 + j, (i + j) % 3 ? '#1f3a26' : '#2e5236');
  }
  for (let i = dx - 4; i < dx + 18; i++) for (let y = 84; y < 88; y++) p.px(i, y, y === 84 ? '#a8203a' : '#8a1830');   // red carpet
  return { door: dx + 7 };
}

export function buildNight(W, H = 96) {
  const hx = Math.round(W * 0.34), run = W + 90;
  const st = new Painter(run, H), r = rng(21);
  const rx = Math.round(hx + V * ENTER + 9) - 32;                                // so the door's centre is where Yimeng's middle is at ENTER
  let x = -8;
  for (let n = 0; x < rx - 4; n++) { const w = Math.min(46 + Math.floor(r() * 20), rx - 4 - x); if (w > 20) facade(st, x, w, 46 + Math.floor(r() * 8), r, n % 3); x += w + 4; }
  const { door } = restaurant(st, rx);
  x = rx + 68;
  for (let n = 1; x < run; n++) { facade(st, x, 50, 44 + (n % 2) * 6, r, n % 3); x += 54; }
  for (let lx = 30; lx < run; lx += 86) {                                         // Art Deco lamp posts
    if (Math.abs(lx - rx - 32) < 40) continue;
    for (let y = 64; y < 85; y++) st.px(lx, y, '#1a1a20');
    st.rect(lx - 2, 60, 5, 5, GOLD); st.rect(lx - 1, 61, 3, 3, WARM); st.rect(lx - 1, 84, 3, 1, GOLD);
  }
  for (let y = 84; y < H; y++) for (let i = 0; i < run; i++) {                   // sidewalk, kerb, street
    if (st.data[(y * run + i) * 4 + 3] && y < 88) continue;
    let c = y < 88 ? ((i + y * 3) % 9 === 0 ? '#26262e' : '#1c1c22') : y === 88 ? '#3a3a42' : '#101014';
    if (y > 89 && (i * 7 + y * 13) % 41 === 0) c = '#5a4a26';                     // gold reflections in the wet street
    st.px(i, y, c);
  }
  return {
    W, H, hx, door, layers: { sky: gradient(W, H, SKY), burst: sunburst(W, H), far: buildFar(W), mid: buildMid(W), street: st },
    manhole: rx - 40,
  };
}

function beam(ctx, ox, oy, a, alpha) {
  ctx.fillStyle = `rgba(242, 210, 122, ${alpha})`;
  for (let y = oy; y >= 0; y--) {
    const d = oy - y, w = 2 + d * 0.09;
    ctx.fillRect(Math.round(ox + d * Math.tan(a) - w / 2), y, Math.round(w), 1);
  }
}

export function renderNight(ctx, t, s, env) {
  const { W, H, canvases: c } = s;
  const up = 1 - tiltAt(t), cam = camAt(t);                                      // up: 1 while the camera looks up at the crowns
  const yMid = -MID.top + up * MID.range, yFar = -FAR.top + up * FAR.range, yStreet = up * STREET.range;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.sky, 0, 0);
  ctx.drawImage(c.burst, 0, Math.round(up * 30) - 30);
  beam(ctx, W * 0.18 - cam * 0.2, yFar + FAR.top + 40, -0.55 + Math.sin(t * 1.3) * 0.35, 0.2);   // searchlights
  beam(ctx, W * 0.82 - cam * 0.2, yFar + FAR.top + 40, 0.5 + Math.sin(t * 1.1 + 2) * 0.35, 0.17);
  ctx.drawImage(c.far, Math.round(-cam * 0.2), Math.round(yFar));
  ctx.drawImage(c.mid, Math.round(-cam * 0.45) - 20, Math.round(yMid));
  ctx.drawImage(c.street, -Math.round(cam), Math.round(yStreet));
  const sx = (x) => Math.round(x - cam), sy = (y) => Math.round(y + yStreet);
  // steam rising from a manhole
  for (let k = 0; k < 5; k++) {
    const age = (t * 0.9 + k / 5) % 1, rad = 3 + age * 7;
    ctx.globalAlpha = 0.4 * (1 - age); ctx.fillStyle = '#d8d4cc';
    ctx.fillRect(sx(s.manhole + Math.sin(k * 2.1 + t) * 2) - rad, sy(90 - age * 26) - rad / 2, rad * 2, rad);
  }
  ctx.globalAlpha = 1;
  // Yimeng: tracked by the camera, then walking on into the restaurant's light
  const hero = env.hero('nyc'), wx = s.hx + V * t;
  if (t < ENTER + 0.3) {
    ctx.globalAlpha = Math.max(0, Math.min(1, 1 - (t - ENTER) / 0.3));
    ctx.drawImage(hero.canvases[Math.floor(t * 6) % 4], Math.round(wx - cam) - hero.anchorX, sy(SIDEWALK) - hero.footY);
    ctx.globalAlpha = 1;
  }
}

export const night = { build: buildNight, render: renderNight };
