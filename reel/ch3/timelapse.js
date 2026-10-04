// Chapter 3, shot 2: five years in Michigan as a time-lapse, cutting between the desk and the gym a
// year at a time, each year a little quicker than the last. At the desk the window runs through
// winter, spring, summer and autumn; coffee cups pile up, the paper count on the whiteboard climbs,
// and the dog sleeps behind the chair, growing out of puppyhood and changing its coat with the
// seasons. In the gym the dumbbells get heavier and Yimeng gets bigger.
import { Painter, rng } from '../pixels.js';
import { label } from '../kit.js';

const YEARS = [1.2, 1, 0.85, 0.75, 0.7];          // each year's length, s
const DESK = 0.55;                                // the share of each year spent at the desk
export const PAPERS = [0, 2, 5, 12, 16];          // papers by the end of each year, 2021 to 2025
const CUPS = 3;                                   // coffee cups drunk per year
const SEASONS = ['winter', 'spring', 'summer', 'autumn'];
const COAT = { winter: 'msu_knit', spring: 'bandana', summer: 'bare', autumn: 'bandana' };
const FLOOR = 90, SEAT = 80, DESK_TOP = 73, GYM_FLOOR = 87;
const BELL = [2, 3, 3, 4, 5];                     // the dumbbell's plate radius, year by year
const MIRROR = [-26, 120];                        // the gym mirror's span, relative to Yimeng
const BLUE = '#3a5a8a';

// Which year it is at time t, which room we are in, and how far through that room's cut (0..1).
export function phaseAt(t) {
  let start = 0;
  for (let k = 0; k < YEARS.length; k++) {
    const end = start + YEARS[k], split = start + YEARS[k] * DESK;
    if (t < end || k === YEARS.length - 1) {
      return t < split ? { year: k, room: 'desk', u: (t - start) / (split - start) } : { year: k, room: 'gym', u: Math.min(1, (t - split) / (end - split)) };
    }
    start = end;
  }
}

// The season in the window during a desk cut, and the dog's coat to go with it (a puppy in year 1).
export const seasonAt = (u) => SEASONS[Math.min(3, Math.floor(u * 4))];
export const dogCoat = (year, season) => (year === 0 ? 'pup' : COAT[season]);
export const papersAt = (year, u) => Math.round((year ? PAPERS[year - 1] : 0) + ((PAPERS[year] - (year ? PAPERS[year - 1] : 0)) * Math.min(1, u * 1.4)));

// ---------- the desk ----------
function windowView(season) {
  const p = new Painter(40, 28), r = rng(4);
  const sky = { winter: '#a9b0b8', spring: '#b8c6d2', summer: '#9fb4c8', autumn: '#b2b4b6' }[season];
  const leaf = { winter: null, spring: ['#a8b89a', '#c8b8c0'], summer: ['#6f8a64', '#5f7a56'], autumn: ['#b8845a', '#a86a48'] }[season];
  const ground = { winter: '#e2e5e8', spring: '#8ea47e', summer: '#768f66', autumn: '#9a8a64' }[season];
  for (let y = 0; y < 28; y++) for (let x = 0; x < 40; x++) p.px(x, y, y > 20 ? ground : sky);
  p.rect(26, 10, 12, 11, '#8a8e94'); for (let y = 12; y < 20; y += 3) for (let x = 27; x < 37; x += 3) p.px(x, y, '#5e6268');   // a campus building
  for (let y = 8; y < 22; y++) p.px(12, y, '#5a524c');                               // the tree outside
  for (const [dx, dy] of [[-3, 9], [3, 8], [-5, 6], [4, 5], [0, 4]]) { p.px(12 + dx / 2, 8 + dy / 2, '#5a524c'); p.px(12 + dx, 8 + dy / 3 - 3, '#5a524c'); }
  if (leaf) for (let n = 0; n < 60; n++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 8;
    p.px(12 + Math.cos(a) * d * 1.2, 7 + Math.sin(a) * d * 0.8, leaf[n % 2]);
  }
  if (season === 'winter') for (let n = 0; n < 24; n++) p.px(Math.floor(r() * 40), Math.floor(r() * 21), '#f2f4f6');
  return p;
}

function deskRoom(W, H, hx) {
  const p = new Painter(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = y < 78 ? ((x * 5 + y * 3) % 31 === 0 ? '#a09a90' : '#aaa59c') : y < 80 ? '#86817a' : ((x + (y % 2) * 8) % 16 === 0 ? '#5e5c5a' : '#6c6a68');
    p.px(x, y, c);
  }
  const wx = hx + 60;                                                               // the window frame
  for (let y = 26; y < 58; y++) for (let x = wx - 2; x < wx + 42; x++) p.px(x, y, '#d6d2ca');
  for (let x = wx - 3; x < wx + 43; x++) { p.px(x, 58, '#c4c0b8'); p.px(x, 59, '#9a968e'); }
  const bx = hx - 56;                                                               // the whiteboard, scribbled on
  for (let y = 24; y < 54; y++) for (let x = bx; x < bx + 46; x++) p.px(x, y, x === bx || x === bx + 45 || y === 24 || y === 53 ? '#8e8a84' : '#e4e4e0');
  const r = rng(12);
  for (let k = 0; k < 4; k++) {                                                     // equations nobody else can read
    const y0 = 28 + k * 6 + (k > 1 ? 10 : 0), len = 14 + Math.floor(r() * 20);
    for (let i = 0; i < len; i++) p.px(bx + 4 + i, y0 + Math.round(Math.sin(i * 0.9 + k) * 1.2), k === 2 ? '#a84a4a' : BLUE);
  }
  for (let y = 54; y < 56; y++) for (let x = bx + 4; x < bx + 42; x++) p.px(x, y, '#8e8a84');   // the marker tray
  for (let y = 18; y < 27; y++) for (let x = hx + 28; x < hx + 37; x++) {          // the clock's face
    const d = Math.hypot(x - hx - 32, y - 22);
    if (d < 4.6) p.px(x, y, d > 3.6 ? '#4a4a50' : '#f0eee8');
  }
  for (let y = 84; y < 90; y++) for (let x = hx - 32; x < hx - 6; x++) {           // the dog's bed behind the chair
    const d = Math.hypot((x - hx + 19) / 13, (y - 87) / 3.2);
    if (d < 1) p.px(x, y, d > 0.75 ? '#5e4642' : '#7a5c56');
  }
  for (let y = 62; y < SEAT; y++) for (let x = hx; x <= hx + 2; x++) p.px(x, y, x === hx ? '#2e3036' : '#3c3e46');   // the office chair
  for (let x = hx; x <= hx + 17; x++) { p.px(x, SEAT, '#3c3e46'); p.px(x, SEAT + 1, '#2e3036'); }
  for (let y = SEAT + 2; y < 87; y++) p.px(hx + 9, y, '#5a5c62');
  for (let x = hx + 3; x <= hx + 15; x++) p.px(x, 87, '#2e3036');
  for (const x of [hx + 3, hx + 9, hx + 15]) p.px(x, 88, '#1e2026');
  return p;
}

function deskFront(W, H, hx) {
  const p = new Painter(W, H);
  for (let y = DESK_TOP; y < FLOOR; y++) for (let x = hx + 13; x <= hx + 78; x++) {
    let c = y < DESK_TOP + 2 ? (y === DESK_TOP ? '#9a8a74' : '#7a6c5a') : (x - hx) % 22 === 13 ? '#6a5c4c' : '#857664';
    if (y >= DESK_TOP + 2 && (x === hx + 13 || x === hx + 78)) c = '#5a4e40';
    p.px(x, y, c);
  }
  for (let x = hx + 50; x < hx + 70; x++) p.px(x, DESK_TOP + 6, '#5a4e40');        // a drawer
  p.rect(hx + 58, DESK_TOP + 8, 4, 1, '#c4c0b8');
  for (let y = 50; y < 69; y++) for (let x = hx + 24; x < hx + 46; x++) p.px(x, y, x === hx + 24 || x === hx + 45 || y === 50 || y === 68 ? '#2a2c32' : '#1e2a2e');   // the monitor
  p.rect(hx + 33, 69, 4, 3, '#2a2c32'); p.rect(hx + 30, 72, 10, 1, '#2a2c32');
  p.rect(hx + 16, DESK_TOP - 1, 14, 1, '#4a4c54');                                  // the keyboard
  return p;
}

// ---------- the gym ----------
function gymRoom(W, H, hx) {
  const p = new Painter(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = y < 80 ? '#7e868f' : (x % 20 === 0 || y === 80) ? '#30343a' : '#3c4046';
    if (y >= 58 && y < 61) c = '#4c6a5c';                                           // a green stripe round the walls
    p.px(x, y, c);
  }
  const [m0, m1] = MIRROR;
  for (let y = 22; y < 72; y++) for (let x = hx + m0; x < hx + m1; x++) {           // the long mirror behind Yimeng
    const streak = (x - y * 0.7) % 23;
    p.px(x, y, x === hx + m0 || x === hx + m1 - 1 || y === 22 || y === 71 ? '#5a6068' : streak < 2 ? '#c2cad2' : '#a8b0b8');
  }
  const rx = hx - 70;                                                               // a power rack with a loaded bar
  for (const x of [rx, rx + 22]) for (let y = 30; y < 80; y++) { p.px(x, y, '#2a2e34'); p.px(x + 1, y, '#3a3e46'); }
  for (let x = rx - 6; x < rx + 30; x++) p.px(x, 52, '#9aa0a8');
  for (const px0 of [rx - 5, rx + 26]) for (let y = 45; y < 60; y++) for (let k = 0; k < 3; k++) p.px(px0 + k, y, k === 1 ? '#4a4e56' : '#2e3238');
  for (let tier = 0; tier < 2; tier++) {                                            // the dumbbell rack
    const y = 76 + tier * 5;
    for (let x = hx + 56; x < hx + 128; x++) p.px(x, y + 3, '#22252a');
    for (let n = 0; n < 9; n++) {
      const cx = hx + 60 + n * 8, rad = 1 + Math.floor(n / 3);
      for (let j = -rad; j <= rad; j++) for (let i = -rad; i <= rad; i++) if (i * i + j * j <= rad * rad + 1) p.px(cx + i, y + 1 + j, (i + j) % 2 ? '#2e3238' : '#40444c');
    }
  }
  for (const [kx, kr] of [[hx + 134, 3], [hx + 142, 4]]) {                         // kettlebells
    for (let j = -kr; j <= kr; j++) for (let i = -kr; i <= kr; i++) if (i * i + j * j <= kr * kr) p.px(kx + i, GYM_FLOOR - kr - 1 + j, '#2e3238');
    for (let i = -1; i <= 1; i++) p.px(kx + i, GYM_FLOOR - 2 * kr - 3, '#2e3238');
    p.px(kx - 2, GYM_FLOOR - 2 * kr - 2, '#2e3238'); p.px(kx + 2, GYM_FLOOR - 2 * kr - 2, '#2e3238');
  }
  for (let x = hx - 44; x < hx - 30; x++) { p.px(x, 78, '#2a2c32'); p.px(x, 79, '#22242a'); }   // a bench, a towel on it
  for (const x of [hx - 42, hx - 32]) for (let y = 80; y < GYM_FLOOR; y++) p.px(x, y, '#5a5e66');
  p.rect(hx - 40, 76, 5, 2, '#c8ccd0');
  return p;
}

export function buildTimelapse(W, H = 96) {
  const hx = Math.round(W * 0.34), layers = { desk: deskRoom(W, H, hx), front: deskFront(W, H, hx), gym: gymRoom(W, H, hx) };
  SEASONS.forEach((season, k) => { layers[`win${k}`] = windowView(season); });
  const r = rng(30), code = Array.from({ length: 30 }, () => [Math.floor(r() * 4), 2 + Math.floor(r() * 12), ['#7ab89a', '#8aa8d8', '#d8d0a8', '#c8c8c8'][Math.floor(r() * 4)]]);
  return { W, H, hx, code, layers };
}

const labels = new Map();
function text(str, ink) {
  if (!labels.has(str + ink)) labels.set(str + ink, label(str, ink));
  return labels.get(str + ink);
}

function desk(ctx, t, s, env, year, u) {
  const { canvases: c, hx } = s, season = seasonAt(u);
  ctx.drawImage(c.desk, 0, 0);
  ctx.drawImage(c[`win${SEASONS.indexOf(season)}`], hx + 60, 28);
  const a = t * 75, b = t * 6.3;                                                    // the clock racing
  ctx.fillStyle = '#2a2a30';
  for (let k = 1; k <= 3; k++) ctx.fillRect(Math.round(hx + 32 + Math.cos(a) * k), Math.round(22 + Math.sin(a) * k), 1, 1);
  for (let k = 1; k <= 2; k++) ctx.fillRect(Math.round(hx + 32 + Math.cos(b) * k), Math.round(22 + Math.sin(b) * k), 1, 1);
  const yr = env.art(text(String(2021 + year), '#2a2a30'));                          // the calendar on the wall
  ctx.fillStyle = '#ecebe6'; ctx.fillRect(hx + 2, 32, yr.width + 6, 12);
  ctx.fillStyle = '#a84a4a'; ctx.fillRect(hx + 2, 32, yr.width + 6, 3);
  ctx.drawImage(yr, hx + 5, 37);
  const word = env.art(text('PAPERS', BLUE)), n = env.art(text(String(papersAt(year, u)), '#a84a4a'));
  ctx.drawImage(word, hx - 50, 42); ctx.drawImage(n, hx - 50 + word.width + 4, 42);
  const dog = env.dog(dogCoat(year, season), 'sleep', 'muted');                     // the dog asleep on its bed
  ctx.drawImage(dog.canvases[Math.floor(t * 2) % 2], hx - 28, 88 - dog.footY);
  const z = (t * 1.5) % 1;                                                          // Zz
  ctx.globalAlpha = 1 - z; ctx.fillStyle = '#e8e8ec';
  const zx = hx - 10 + Math.round(z * 4), zy = 76 - Math.round(z * 8);
  ctx.fillRect(zx, zy, 3, 1); ctx.fillRect(zx + 1, zy + 1, 1, 1); ctx.fillRect(zx, zy + 2, 3, 1);
  ctx.globalAlpha = 1;
  const hero = env.hero('lab', 'type', 'muted');
  ctx.drawImage(hero.canvases[Math.floor(t * 8) % 2], hx - hero.anchorX, SEAT - 1 - hero.seatY);
  ctx.drawImage(c.front, 0, 0);
  s.code.forEach(([indent, len, col], i) => {                                      // code scrolling up the screen
    const y = 51 + ((i * 2 - Math.floor(t * 20)) % 60 + 60) % 60;
    if (y > 66) return;
    ctx.fillStyle = col; ctx.fillRect(hx + 26 + indent * 2, y, Math.min(len, 18 - indent * 2), 1);
  });
  const cups = year * CUPS + Math.min(CUPS, Math.floor(u * (CUPS + 1)));             // the coffee cups pile up
  for (let i = 0; i < cups; i++) {
    const cx = hx + 50 + (i % 6) * 4 + (Math.floor(i / 6) % 2) * 2, cy = DESK_TOP - 4 - Math.floor(i / 6) * 4;
    ctx.fillStyle = '#e6e4e0'; ctx.fillRect(cx, cy, 3, 4);
    ctx.fillStyle = '#8a6a4a'; ctx.fillRect(cx, cy + 2, 3, 1);
    ctx.fillStyle = '#4a4c54'; ctx.fillRect(cx, cy, 3, 1);
  }
}

function gym(ctx, t, s, env, year) {
  const { canvases: c, hx } = s;
  ctx.drawImage(c.gym, 0, 0);
  const hero = env.hero(year < 2 ? 'gym1' : 'gym5', 'curl', 'muted'), f = Math.floor(t * 5) % 2;
  const x = hx - hero.anchorX, y = GYM_FLOOR - hero.footY, [hx0, hy0] = hero.hands[f], r = BELL[year];
  const bell = (cx, cy) => {                                                        // the dumbbell, seen end on: a silver plate
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      const d = i * i + j * j;
      if (d > r * r + 1) continue;
      ctx.fillStyle = d > (r - 1) * (r - 1) ? '#5a5e66' : d < 2 ? '#3a3e46' : (i - j) > r * 0.6 ? '#7e848c' : '#a4aab2';
      ctx.fillRect(cx + i, cy + j, 1, 1);
    }
  };
  ctx.save(); ctx.beginPath(); ctx.rect(hx + MIRROR[0] + 1, 23, MIRROR[1] - MIRROR[0] - 2, 48); ctx.clip();   // a faint reflection
  ctx.globalAlpha = 0.3; ctx.drawImage(hero.canvases[f], x + 7, y - 3); ctx.restore(); ctx.globalAlpha = 1;
  ctx.drawImage(hero.canvases[f], x, y);
  bell(x + hx0, y + hy0);
  if (f === 1) { ctx.fillStyle = '#d8dee6'; ctx.fillRect(x + 31, y + 15, 2, 1); ctx.fillRect(x + 32, y + 18, 2, 1); }   // effort lines
}

export function renderTimelapse(ctx, t, s, env) {
  const { W, H } = s, { year, room, u } = phaseAt(t);
  ctx.clearRect(0, 0, W, H);
  if (room === 'desk') desk(ctx, t, s, env, year, u); else gym(ctx, t, s, env, year);
}

export const timelapse = { build: buildTimelapse, render: renderTimelapse };
