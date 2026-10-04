// Chapter 3, shot 2: five years in Michigan as a time-lapse of one living room, seen from a camera
// that never moves: the home gym on the left, the desk on the right, the dog's bed between. Each
// year Yimeng appears at the desk, then in the gym, as in a time-lapse film, each year a little
// quicker than the last. At the desk the window runs through the seasons, coffee cups pile up and
// the paper count on the whiteboard climbs; in the gym Yimeng alternates dumbbell curls and
// pull-ups, getting bigger; the dog sleeps on its bed, growing up and dressing for the seasons.
import { Painter, rng, mute } from '../pixels.js';
import { label } from '../kit.js';

const YEARS = [1.2, 1, 0.85, 0.75, 0.7];          // each year's length, s
const DESK = 0.55;                                // the share of each year spent at the desk
export const PAPERS = [0, 2, 5, 12, 16];          // papers by the end of each year, 2021 to 2025
const CUPS = 3;                                   // coffee cups drunk per year
const SEASONS = ['winter', 'spring', 'summer', 'autumn'];
const COAT = { winter: 'msu_knit', spring: 'bandana', summer: 'bare', autumn: 'bandana' };
export const WORKOUT = ['curl', 'hang', 'curl', 'hang', 'curl'];   // the gym, year by year: curls or pull-ups
const FLOOR = 88, SEAT = 80, DESK_TOP = 73, BAR = 34;
const BELL = [2, 3, 3, 4, 5];                     // the dumbbell's plate radius, year by year
const BLUE = '#3a5a8a';
const SKIN = mute('#f4cfae', 0.6), SKIN_SHADE = mute('#e0a985', 0.6);   // arms reaching up to the bar

// Which year it is at time t, where Yimeng is, and how far through that spell (0..1).
export function phaseAt(t) {
  let start = 0;
  for (let k = 0; k < YEARS.length; k++) {
    const end = start + YEARS[k], split = start + YEARS[k] * DESK;
    if (t < end || k === YEARS.length - 1) {
      return t < split ? { year: k, spot: 'desk', u: (t - start) / (split - start) } : { year: k, spot: 'gym', u: Math.min(1, (t - split) / (end - split)) };
    }
    start = end;
  }
}

// The season in the window during a spell at the desk, and the dog's coat to go with it.
export const seasonAt = (u) => SEASONS[Math.min(3, Math.floor(u * 4))];
export const dogCoat = (year, season) => (year === 0 ? 'pup' : COAT[season]);
export const papersAt = (year, u) => Math.round((year ? PAPERS[year - 1] : 0) + ((PAPERS[year] - (year ? PAPERS[year - 1] : 0)) * Math.min(1, u * 1.4)));

// Where things stand in the room, by screen width (each an x, the left edge): the pull-up stand,
// Yimeng's spot for curls, the dog's bed and Yimeng's seat at the desk.
export function layout(W) {
  const pull = Math.round(W * 0.07) + 4, lift = pull + 34;
  const desk = Math.max(lift + 66, Math.round(W * 0.56));
  return { pull, lift, desk, bed: desk - 44 };
}

function windowView(season) {
  const p = new Painter(40, 24), r = rng(4);
  const sky = { winter: '#a9b0b8', spring: '#b8c6d2', summer: '#9fb4c8', autumn: '#b2b4b6' }[season];
  const leaf = { winter: null, spring: ['#a8b89a', '#c8b8c0'], summer: ['#6f8a64', '#5f7a56'], autumn: ['#b8845a', '#a86a48'] }[season];
  const ground = { winter: '#e2e5e8', spring: '#8ea47e', summer: '#768f66', autumn: '#9a8a64' }[season];
  for (let y = 0; y < 24; y++) for (let x = 0; x < 40; x++) p.px(x, y, y > 17 ? ground : sky);
  p.rect(26, 8, 12, 10, '#8a8e94'); for (let y = 10; y < 17; y += 3) for (let x = 27; x < 37; x += 3) p.px(x, y, '#5e6268');   // a campus building
  for (let y = 7; y < 19; y++) p.px(12, y, '#5a524c');                               // the tree outside
  for (const [dx, dy] of [[-3, 9], [3, 8], [-5, 6], [4, 5], [0, 4]]) { p.px(12 + dx / 2, 7 + dy / 2, '#5a524c'); p.px(12 + dx, 7 + dy / 3 - 3, '#5a524c'); }
  if (leaf) for (let n = 0; n < 56; n++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 7;
    p.px(12 + Math.cos(a) * d * 1.2, 6 + Math.sin(a) * d * 0.8, leaf[n % 2]);
  }
  if (season === 'winter') for (let n = 0; n < 22; n++) p.px(Math.floor(r() * 40), Math.floor(r() * 18), '#f2f4f6');
  return p;
}

// ---------- the living room ----------
function room(W, H, L) {
  const p = new Painter(W, H), r = rng(12), { pull, lift, desk, bed } = L;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = y < 78 ? ((x * 5 + y * 3) % 31 === 0 ? '#a29c92' : '#aca79e') : y < 80 ? '#86817a' : ((x + (y % 3) * 11) % 22 === 0 || y === 84 ? '#62584e' : '#72685c');   // wall, skirting, floorboards
    if (y === 26) c = '#9a958c';                                                    // a picture rail
    p.px(x, y, c);
  }
  // the gym corner: mats, the pull-up stand, then a bench and a dumbbell rack if there is room
  for (let y = 85; y < 90; y++) for (let x = pull - 8; x < lift + 30; x++) p.px(x, y, (x + y) % 9 === 0 ? '#3a3c42' : '#2e3036');
  for (const x0 of [pull, pull + 24]) {
    for (let y = BAR - 2; y < 86; y++) { p.px(x0, y, '#2a2c32'); p.px(x0 + 1, y, '#44464e'); }
    for (let x = x0 - 4; x <= x0 + 5; x++) p.px(x, 86, '#2a2c32');                  // feet
    for (let k = 0; k < 6; k++) p.px(x0 + (x0 === pull ? -k : k + 1), 80 + k, '#2a2c32');   // braces
  }
  for (let x = pull - 2; x <= pull + 26; x++) p.px(x, BAR, '#9aa0a8');              // the bar
  for (const [x0, dir] of [[pull, -1], [pull + 25, 1]]) for (let k = 0; k < 5; k++) p.px(x0 + dir * k, 58, '#2a2c32');   // dip handles
  if (lift + 54 < bed - 4) {
    for (let x = lift + 28; x < lift + 50; x++) { p.px(x, 79, '#2a2c32'); p.px(x, 80, '#22242a'); }   // the bench, a towel on it
    for (const x of [lift + 30, lift + 47]) for (let y = 81; y < 86; y++) p.px(x, y, '#5a5e66');
    p.rect(lift + 32, 77, 5, 2, '#c8ccd0');
    for (let tier = 0; tier < 2; tier++) for (let n = 0; n < 4; n++) {              // the dumbbell rack
      const cx = lift + 58 + n * 6, cy = 76 + tier * 5, rad = 1 + Math.floor(n / 2);
      for (let j = -rad; j <= rad; j++) for (let i = -rad; i <= rad; i++) if (i * i + j * j <= rad * rad + 1) p.px(cx + i, cy + j, (i + j) % 2 ? '#2e3238' : '#44484e');
      if (n === 0) for (let x = lift + 54; x < lift + 80; x++) p.px(x, cy + 3, '#22252a');
    }
    for (let y = 60; y < 86; y++) p.px(lift + 88, y, '#5a524c');                    // a floor lamp
    p.rect(lift + 85, 56, 7, 4, '#d8d0b8'); p.rect(lift + 86, 85, 5, 1, '#5a524c');
  }
  if (lift + 130 < bed - 4) {                                                       // a framed photo and a plant, if the wall is wide
    const fx = lift + 100;
    for (let y = 34; y < 52; y++) for (let x = fx; x < fx + 22; x++) p.px(x, y, x === fx || x === fx + 21 || y === 34 || y === 51 ? '#4a4038' : y > 44 ? '#7e8a78' : '#9aa8b4');
    for (let y = 42; y < 47; y++) for (let x = fx + 6; x < fx + 14; x++) if (Math.abs(x - fx - 10) < 47 - y) p.px(x, y, '#6a7466');   // a mountain in it
    p.rect(fx + 28, 78, 7, 8, '#7a6a5a');                                           // a potted plant
    for (let n = 0; n < 30; n++) p.px(fx + 31 + Math.round(Math.sin(n * 2.3) * 5 * (n / 30)), 77 - Math.floor(n / 2.2), n % 3 ? '#5e7258' : '#6e8468');
  }
  // the dog's bed between the two, and the desk corner
  for (let y = 84; y < 90; y++) for (let x = bed; x < bed + 26; x++) {
    const d = Math.hypot((x - bed - 13) / 13, (y - 87) / 3.2);
    if (d < 1) p.px(x, y, d > 0.75 ? '#5e4642' : '#7a5c56');
  }
  for (let y = 86; y < 92; y++) for (let x = desk - 4; x < desk + 84; x++) p.px(x, y, (x + y * 2) % 7 === 0 ? '#5a626e' : '#6a7280');   // a rug
  const wx = desk + 20;                                                             // the window
  for (let y = 22; y < 48; y++) for (let x = wx - 2; x < wx + 42; x++) p.px(x, y, '#d6d2ca');
  for (let x = wx - 3; x < wx + 43; x++) { p.px(x, 48, '#c4c0b8'); p.px(x, 49, '#9a968e'); }
  const bx = desk - 52;                                                             // the whiteboard, scribbled on
  for (let y = 22; y < 50; y++) for (let x = bx; x < bx + 44; x++) p.px(x, y, x === bx || x === bx + 43 || y === 22 || y === 49 ? '#8e8a84' : '#e4e4e0');
  for (const [k, y0] of [[0, 26], [1, 31], [2, 46]]) {
    const len = 14 + Math.floor(r() * 18);
    for (let i = 0; i < len; i++) p.px(bx + 4 + i, y0 + Math.round(Math.sin(i * 0.9 + k) * 1.2), k === 1 ? '#a84a4a' : BLUE);
  }
  for (let y = 15; y < 23; y++) for (let x = desk + 3; x < desk + 12; x++) {         // the clock's face
    const d = Math.hypot(x - desk - 7, y - 19);
    if (d < 4.4) p.px(x, y, d > 3.4 ? '#4a4a50' : '#f0eee8');
  }
  for (let y = 62; y < SEAT; y++) for (let x = desk; x <= desk + 2; x++) p.px(x, y, x === desk ? '#2e3036' : '#3c3e46');   // the office chair
  for (let x = desk; x <= desk + 17; x++) { p.px(x, SEAT, '#3c3e46'); p.px(x, SEAT + 1, '#2e3036'); }
  for (let y = SEAT + 2; y < 87; y++) p.px(desk + 9, y, '#5a5c62');
  for (let x = desk + 3; x <= desk + 15; x++) p.px(x, 87, '#2e3036');
  if (desk + 154 < W) {                                                             // the sofa, where there is room for it
    const sx = desk + 92;
    for (let y = 66; y < 86; y++) for (let x = sx; x < sx + 60; x++) {
      const back = y < 74, arm = x < sx + 6 || x > sx + 53;
      if (back || arm || y > 74) p.px(x, y, y === 66 || (arm && y === 70) ? '#7a7e88' : y > 82 ? '#4a4c54' : arm || back ? '#6a6e78' : '#5e626c');
    }
    for (const cx of [sx + 14, sx + 34]) p.rect(cx, 70, 10, 5, '#8a7e6e');           // cushions
  }
  return p;
}

function front(W, H, L) {
  const p = new Painter(W, H), { desk } = L;
  for (let y = DESK_TOP; y < FLOOR + 2; y++) for (let x = desk + 13; x <= desk + 78; x++) {
    let c = y < DESK_TOP + 2 ? (y === DESK_TOP ? '#9a8a74' : '#7a6c5a') : (x - desk) % 22 === 13 ? '#6a5c4c' : '#857664';
    if (y >= DESK_TOP + 2 && (x === desk + 13 || x === desk + 78)) c = '#5a4e40';
    p.px(x, y, c);
  }
  for (let x = desk + 50; x < desk + 70; x++) p.px(x, DESK_TOP + 6, '#5a4e40');      // a drawer
  p.rect(desk + 58, DESK_TOP + 8, 4, 1, '#c4c0b8');
  for (let y = 50; y < 69; y++) for (let x = desk + 24; x < desk + 46; x++) p.px(x, y, x === desk + 24 || x === desk + 45 || y === 50 || y === 68 ? '#2a2c32' : '#1e2a2e');   // the monitor
  p.rect(desk + 33, 69, 4, 3, '#2a2c32'); p.rect(desk + 30, 72, 10, 1, '#2a2c32');
  p.rect(desk + 16, DESK_TOP - 1, 14, 1, '#4a4c54');                                // the keyboard
  return p;
}

export function buildTimelapse(W, H = 96) {
  const L = layout(W), layers = { room: room(W, H, L), front: front(W, H, L) };
  SEASONS.forEach((season, k) => { layers[`win${k}`] = windowView(season); });
  const r = rng(30), code = Array.from({ length: 30 }, () => [Math.floor(r() * 4), 2 + Math.floor(r() * 12), ['#7ab89a', '#8aa8d8', '#d8d0a8', '#c8c8c8'][Math.floor(r() * 4)]]);
  return { W, H, ...L, code, layers };
}

const labels = new Map();
function text(str, ink) {
  if (!labels.has(str + ink)) labels.set(str + ink, label(str, ink));
  return labels.get(str + ink);
}

// Yimeng in the gym: curling a dumbbell on the mat, or doing pull-ups on the stand, arms up behind the head.
function workout(ctx, t, s, env, year, u) {
  const hero = env.hero(year < 2 ? 'gym1' : 'gym5', WORKOUT[year], 'muted');
  if (WORKOUT[year] === 'hang') {
    const lift = (1 - Math.cos(u * Math.PI * 4)) / 2, x = s.pull + 3 - hero.anchorX, y = Math.round(BAR - 5 - lift * 18);   // hanging low, then the chin over the bar
    const [ax, ay] = hero.hands[0];
    for (const [hx, col] of [[x + 14, SKIN_SHADE], [x + 19, SKIN]]) {             // both arms, from the shoulders up to the bar
      const n = Math.max(1, y + ay - BAR);
      for (let k = 0; k <= n; k++) { ctx.fillStyle = col; ctx.fillRect(Math.round(x + ax + (hx - x - ax) * k / n), BAR + n - k, 2, 1); }
      ctx.fillStyle = col; ctx.fillRect(hx, BAR - 1, 2, 2);
    }
    ctx.drawImage(hero.canvases[lift > 0.5 ? 1 : 0], x, y);
    return;
  }
  const f = Math.floor(t * 5) % 2, x = s.lift - hero.anchorX, y = FLOOR - hero.footY, [hx0, hy0] = hero.hands[f], r = BELL[year];
  ctx.drawImage(hero.canvases[f], x, y);
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {                     // the dumbbell, seen end on: a silver plate
    const d = i * i + j * j;
    if (d > r * r + 1) continue;
    ctx.fillStyle = d > (r - 1) * (r - 1) ? '#5a5e66' : d < 2 ? '#3a3e46' : (i - j) > r * 0.6 ? '#7e848c' : '#a4aab2';
    ctx.fillRect(x + hx0 + i, y + hy0 + j, 1, 1);
  }
}

function atDesk(ctx, t, env, s) {
  const hero = env.hero('lab', 'type', 'muted');
  ctx.drawImage(hero.canvases[Math.floor(t * 8) % 2], s.desk - hero.anchorX, SEAT - 1 - hero.seatY);
}

export function renderTimelapse(ctx, t, s, env) {
  const { W, H, canvases: c, desk, bed } = s, { year, spot, u } = phaseAt(t);
  const was = phaseAt(Math.max(0, t - 0.1));                                       // a moment ago, for the time-lapse ghost
  const season = spot === 'desk' ? seasonAt(u) : 'autumn';
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.room, 0, 0);
  ctx.drawImage(c[`win${SEASONS.indexOf(season)}`], desk + 20, 23);
  const a = t * 75, b = t * 6.3;                                                    // the clock racing
  ctx.fillStyle = '#2a2a30';
  for (let k = 1; k <= 3; k++) ctx.fillRect(Math.round(desk + 7 + Math.cos(a) * k), Math.round(19 + Math.sin(a) * k), 1, 1);
  for (let k = 1; k <= 2; k++) ctx.fillRect(Math.round(desk + 7 + Math.cos(b) * k), Math.round(19 + Math.sin(b) * k), 1, 1);
  const yr = env.art(text(String(2021 + year), '#2a2a30'));                         // the calendar
  ctx.fillStyle = '#ecebe6'; ctx.fillRect(desk, 28, yr.width + 4, 12);
  ctx.fillStyle = '#a84a4a'; ctx.fillRect(desk, 28, yr.width + 4, 3);
  ctx.drawImage(yr, desk + 2, 33);
  const papers = spot === 'desk' ? papersAt(year, u) : PAPERS[year];
  const word = env.art(text('PAPERS', BLUE)), n = env.art(text(String(papers), '#a84a4a'));
  ctx.drawImage(word, desk - 47, 40); ctx.drawImage(n, desk - 47 + word.width + 4, 40);
  const dog = env.dog(dogCoat(year, season), 'sleep', 'muted');                     // the dog asleep on its bed
  ctx.drawImage(dog.canvases[Math.floor(t * 2) % 2], bed + 3, 88 - dog.footY);
  const z = (t * 1.5) % 1;
  ctx.globalAlpha = 1 - z; ctx.fillStyle = '#e8e8ec';
  const zx = bed + 20 + Math.round(z * 4), zy = 76 - Math.round(z * 8);
  ctx.fillRect(zx, zy, 3, 1); ctx.fillRect(zx + 1, zy + 1, 1, 1); ctx.fillRect(zx, zy + 2, 3, 1);
  ctx.globalAlpha = 1;
  if (spot === 'desk') atDesk(ctx, t, env, s);
  else if (was.spot === 'desk') { ctx.globalAlpha = 0.35; atDesk(ctx, t, env, s); ctx.globalAlpha = 1; }   // just left: a ghost
  ctx.drawImage(c.front, 0, 0);
  s.code.forEach(([indent, len, col], i) => {                                      // code scrolling up the screen
    const y = 51 + ((i * 2 - Math.floor(t * 20)) % 60 + 60) % 60;
    if (y > 66) return;
    ctx.fillStyle = col; ctx.fillRect(desk + 26 + indent * 2, y, Math.min(len, 18 - indent * 2), 1);
  });
  const cups = year * CUPS + (spot === 'desk' ? Math.min(CUPS, Math.floor(u * (CUPS + 1))) : CUPS);   // the coffee cups pile up
  for (let i = 0; i < cups; i++) {
    const cx = desk + 50 + (i % 6) * 4 + (Math.floor(i / 6) % 2) * 2, cy = DESK_TOP - 4 - Math.floor(i / 6) * 4;
    ctx.fillStyle = '#e6e4e0'; ctx.fillRect(cx, cy, 3, 4);
    ctx.fillStyle = '#8a6a4a'; ctx.fillRect(cx, cy + 2, 3, 1);
    ctx.fillStyle = '#4a4c54'; ctx.fillRect(cx, cy, 3, 1);
  }
  if (spot === 'gym') workout(ctx, t, s, env, year, u);
  else if (was.spot === 'gym') { ctx.globalAlpha = 0.35; workout(ctx, t, s, env, was.year, 1); ctx.globalAlpha = 1; }
}

export const timelapse = { build: buildTimelapse, render: renderTimelapse };
