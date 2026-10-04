// Chapter 4, shot 2: the office. A bright open-plan floor with California through glass walls,
// palms and golden hills outside. Yimeng, in the purple sun hoodie, works at the desk with a phone in
// hand, and a bubble shows its stock chart climbing candle by candle. The dog naps under the desk.
import { Painter, rng } from '../pixels.js';
import { gradient } from '../kit.js';

const FLOOR = 90, SEAT = 80, DESK_TOP = 73;
const CANDLES = 11, EVERY = 0.11;              // the chart grows one candle every EVERY seconds
// The chart's closes, an index from the first: a climb with a dip in the middle.
export const CLOSES = [10, 11, 13, 12, 15, 17, 16, 14, 18, 21, 24, 27];

// How many candles are on the chart at time t.
export const candlesAt = (t) => Math.min(CANDLES, 1 + Math.floor(t / EVERY));

function room(W, H, hx) {
  const p = new Painter(W, H), r = rng(23);
  const sky = gradient(W, H, [['#6aaee8', 0], ['#8ac0ee', 0.4], ['#bcdcf4', 0.7]]);
  p.data.set(sky.data);
  for (let x = 0; x < W; x++) {                                                    // outside: hills, low glass offices, palms
    const h = 6 + Math.sin(x * 0.03) * 3 + Math.sin(x * 0.09 + 1) * 1.5;
    for (let y = Math.round(54 - h); y < 54; y++) p.px(x, y, '#d8b45e');
  }
  for (let x0 = 4; x0 < W; x0 += 70) for (let y = 44; y < 60; y++) for (let x = x0; x < x0 + 40; x++) p.px(x, y, (x + y) % 5 === 0 ? '#9ac4e0' : '#6a8aa8');
  for (let x0 = 30; x0 < W; x0 += 58) {
    for (let s = 0; s < 34; s++) p.px(x0 + Math.round((s / 34) ** 2 * 3), 60 - s, '#7a5a40');
    for (const dir of [-1, -0.5, 0.5, 1]) for (let k = 0; k < 10; k++) p.px(x0 + 3 + dir * k, 26 + Math.round(Math.abs(dir) * (k / 10) ** 2 * 6), r() < 0.5 ? '#3f8a3a' : '#5aa848');
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {                       // the glass wall's frame, the office around it
    if (y < 20 || y >= 62) p.px(x, y, y < 20 ? (y === 19 ? '#c8c6c0' : '#eeece6') : y < 80 ? (y === 62 ? '#c8c6c0' : '#f2f0ea') : ((x + (y % 2) * 9) % 18 === 0 ? '#b89a72' : '#c8aa82'));
    else if (x % 36 < 2) p.px(x, y, '#9a9a9c');                                    // mullions
  }
  for (let x = 0; x < W; x += 24) p.rect(x + 6, 6, 12, 2, '#fffbe8');              // ceiling lights
  const bx = hx - 70;                                                               // a whiteboard: an agent's loop
  if (bx > 0) {
    for (let y = 64; y < 78; y++) for (let x = bx; x < bx + 40; x++) p.px(x, y, x === bx || x === bx + 39 || y === 64 || y === 77 ? '#9a9690' : '#fafaf6');
    for (const [cx, cy] of [[bx + 8, 70], [bx + 20, 67], [bx + 32, 70], [bx + 20, 74]]) p.rect(cx - 2, cy - 1, 5, 3, '#3a5a8a');
    for (let k = 0; k < 8; k++) { p.px(bx + 11 + k, 69 - (k >> 2), '#a84a4a'); p.px(bx + 23 + k, 68 + (k >> 2), '#a84a4a'); }
  }
  const px = hx + 92;                                                               // a plant in a white pot
  if (px < W - 8) {
    p.rect(px, 80, 8, 9, '#e8e6e0');
    for (let n = 0; n < 40; n++) p.px(px + 4 + Math.round(Math.sin(n * 2.1) * 6 * (n / 40)), 79 - Math.floor(n / 2.5), n % 3 ? '#4f8a4a' : '#6aa860');
  }
  for (let y = 62; y < SEAT; y++) for (let x = hx; x <= hx + 2; x++) p.px(x, y, x === hx ? '#2e3036' : '#3c3e46');   // the office chair
  for (let x = hx; x <= hx + 17; x++) { p.px(x, SEAT, '#3c3e46'); p.px(x, SEAT + 1, '#2e3036'); }
  for (let y = SEAT + 2; y < 88; y++) p.px(hx + 9, y, '#5a5c62');
  for (let x = hx + 3; x <= hx + 15; x++) p.px(x, 88, '#2e3036');
  return p;
}

function desk(W, H, hx) {
  const p = new Painter(W, H);
  for (let x = hx + 13; x <= hx + 80; x++) { p.px(x, DESK_TOP, '#fafaf6'); p.px(x, DESK_TOP + 1, '#d8d6d0'); }   // a white desk on legs
  for (const x of [hx + 15, hx + 78]) for (let y = DESK_TOP + 2; y < FLOOR; y++) p.px(x, y, '#9a9a9c');
  for (const [mx, w] of [[hx + 26, 22], [hx + 50, 22]]) {                          // two monitors
    for (let y = 52; y < 69; y++) for (let x = mx; x < mx + w; x++) p.px(x, y, x === mx || x === mx + w - 1 || y === 52 || y === 68 ? '#2a2c32' : '#1e2a2e');
    p.rect(mx + w / 2 - 2, 69, 4, 3, '#2a2c32'); p.rect(mx + w / 2 - 5, 72, 10, 1, '#2a2c32');
  }
  for (let k = 0; k < 7; k++) p.rect(hx + 28 + (k % 3) * 2, 54 + k * 2, 6 + (k * 5) % 9, 1, ['#7ab89a', '#8aa8d8', '#d8d0a8'][k % 3]);   // code on the left screen
  p.rect(hx + 16, DESK_TOP - 1, 14, 1, '#4a4c54');                                 // the keyboard
  p.rect(hx + 74, DESK_TOP - 4, 3, 4, '#e8e4dc'); p.px(hx + 77, DESK_TOP - 3, '#e8e4dc');   // a mug
  return p;
}

export function buildOffice(W, H = 96) {
  const hx = Math.round(W * 0.34);
  return { W, H, hx, layers: { room: room(W, H, hx), desk: desk(W, H, hx) } };
}

// A candlestick chart in a box: n candles of CLOSES, green up, red down, scaled to fit h px.
function chart(ctx, x0, y0, w, h, n) {
  const lo = Math.min(...CLOSES), hi = Math.max(...CLOSES), Y = (v) => Math.round(y0 + h - 1 - (v - lo) * (h - 1) / (hi - lo));
  const step = Math.floor(w / CANDLES);
  for (let i = 0; i < n; i++) {
    const open = CLOSES[i], close = CLOSES[i + 1], up = close >= open, x = x0 + i * step;
    ctx.fillStyle = up ? '#3ac46a' : '#e84a4a';
    ctx.fillRect(x + 1, Y(Math.max(open, close)) - 1, 1, Math.abs(Y(open) - Y(close)) + 3);   // the wick
    ctx.fillRect(x, Math.min(Y(open), Y(close)), 3, Math.max(1, Math.abs(Y(open) - Y(close))));
  }
}

export function renderOffice(ctx, t, s, env) {
  const { W, H, canvases: c, hx } = s;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(c.room, 0, 0);
  const dog = env.dog('houndstooth', 'sleep');                                     // the dog asleep under the desk
  ctx.drawImage(dog.canvases[Math.floor(t * 2) % 2], hx + 44, 89 - dog.footY);
  const hero = env.hero('work', 'type'), f = Math.floor(t * 8) % 2;
  const x = hx - hero.anchorX, y = SEAT - 1 - hero.seatY;
  ctx.drawImage(hero.canvases[f], x, y);
  ctx.drawImage(c.desk, 0, 0);
  chart(ctx, hx + 52, 54, 18, 13, candlesAt(t));                                    // the right monitor follows the market too
  const [px, py] = hero.hands[f];                                                   // the phone in Yimeng's hand
  ctx.fillStyle = '#1a1c22'; ctx.fillRect(x + px - 1, y + py - 6, 5, 8);
  ctx.fillStyle = '#2a3a44'; ctx.fillRect(x + px, y + py - 5, 3, 5);
  ctx.fillStyle = '#3ac46a'; ctx.fillRect(x + px, y + py - 3, 1, 1); ctx.fillRect(x + px + 1, y + py - 4, 1, 1); ctx.fillRect(x + px + 2, y + py - 5, 1, 1);
  const bx = x + px + 8, by = 18, bw = 50, bh = 30;                                 // the phone's screen, blown up in a bubble
  ctx.fillStyle = '#f4f1ea'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
  ctx.fillStyle = '#141a22'; ctx.fillRect(bx, by, bw, bh);
  for (let k = 0; k < 6; k++) { ctx.fillStyle = '#f4f1ea'; ctx.fillRect(Math.round(bx + 4 - k * 1.2), by + bh + 1 + k, 2, 1); }   // its tail, down to the phone
  ctx.fillStyle = '#26303a'; for (let k = 1; k < 4; k++) ctx.fillRect(bx + 2, by + 2 + k * 6, bw - 4, 1);   // grid lines
  chart(ctx, bx + 3, by + 3, bw - 6, bh - 6, candlesAt(t));
}

export const office = { build: buildOffice, render: renderOffice };
