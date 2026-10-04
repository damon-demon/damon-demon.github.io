// Chapter 3, shot 4: the Graduation Road Trip, on a map. From East Lansing the car loops round the
// East: through Ontario to Niagara, across New York to Vermont and the Maine coast, down by Boston,
// New York and Washington to the Carolinas, and home through Tennessee, Kentucky and Ohio, all in
// Michigan's grey. Then it turns west, by Chicago, Kansas City, Denver and the Rockies, Utah and
// Las Vegas, to Santa Clara, and the colour spreads out from the car until the map is all colour.
import { Painter, rng, hexToRgb } from '../pixels.js';
import { art, label } from '../kit.js';

const S = 8, LON0 = -160, LAT0 = 51, KX = Math.cos(38 * Math.PI / 180) * S;      // px per degree of latitude, of longitude
export const toMap = ([lon, lat]) => [(lon - LON0) * KX, (LAT0 - lat) * S];
const MAP_W = Math.round((-40 - LON0) * KX), MAP_H = Math.round((LAT0 - 26) * S);
export const LEGS = { east: [0.15, 2.45], west: [2.55, 4.6] };       // when the car drives each loop

// The drive, as [lon, lat] waypoints along the roads it took.
const EAST = [[-84.48, 42.73], [-83.05, 42.33], [-81.25, 42.98], [-79.07, 43.09], [-77.6, 43.16], [-76.15, 43.05],
  [-74.9, 43.9], [-73.21, 44.48], [-71.3, 44.27], [-70.26, 43.66], [-70.9, 42.85], [-71.06, 42.36], [-71.41, 41.82],
  [-72.93, 41.31], [-74.0, 40.71], [-75.17, 39.95], [-76.61, 39.29], [-77.04, 38.91], [-77.44, 37.54], [-79.8, 36.07],
  [-82.55, 35.6], [-83.92, 35.96], [-84.5, 38.04], [-84.51, 39.1], [-84.19, 39.76], [-83.54, 41.66], [-84.48, 42.73]];
const WEST = [[-84.48, 42.73], [-85.59, 42.29], [-87.63, 41.88], [-90.58, 41.52], [-93.61, 41.59], [-94.58, 39.1],
  [-95.69, 39.05], [-97.61, 38.84], [-99.33, 38.88], [-102.0, 39.3], [-104.99, 39.74], [-106.37, 39.64], [-108.55, 39.06],
  [-110.16, 38.99], [-112.08, 38.77], [-113.06, 37.68], [-113.58, 37.1], [-115.14, 36.17], [-117.02, 34.9], [-119.02, 35.37],
  [-119.79, 36.74], [-121.57, 37.0], [-121.95, 37.35]];

// ---------- the map ----------
const PACIFIC = [[-170, 52], [-124.7, 48.4], [-124.0, 46.3], [-124.1, 44.0], [-124.5, 42.8], [-124.2, 41.0], [-124.4, 40.4],
  [-123.7, 38.9], [-123.0, 38.0], [-122.5, 37.8], [-122.5, 37.5], [-122.0, 36.95], [-121.9, 36.6], [-121.3, 35.6], [-120.6, 34.6],
  [-119.2, 34.2], [-118.5, 34.0], [-118.0, 33.6], [-117.2, 32.7], [-116.6, 31.4], [-115.6, 29.5], [-170, 24]];
const BAY = [[-122.5, 37.8], [-122.4, 37.95], [-122.3, 38.1], [-122.1, 38.05], [-122.05, 37.7], [-121.95, 37.42], [-122.15, 37.5], [-122.35, 37.65]];
const ATLANTIC = [[-30, 52], [-55, 52], [-64.5, 47.5], [-66.9, 44.8], [-68.2, 44.3], [-69.8, 43.7], [-70.2, 43.6], [-70.6, 42.9],
  [-70.8, 42.3], [-70.0, 41.9], [-69.95, 41.7], [-70.5, 41.5], [-71.4, 41.4], [-72.9, 41.2], [-73.8, 40.9], [-73.95, 40.6],
  [-74.0, 40.4], [-74.1, 39.7], [-74.9, 38.95], [-75.1, 38.4], [-75.4, 37.9], [-76.0, 37.0], [-75.6, 36.0], [-75.5, 35.25],
  [-76.5, 34.7], [-77.9, 33.9], [-79.0, 33.2], [-79.9, 32.8], [-80.9, 32.0], [-81.4, 30.4], [-81.0, 29.2], [-80.6, 28.4],
  [-80.0, 26.7], [-80.1, 25.4], [-81.1, 25.1], [-81.8, 26.2], [-82.7, 27.6], [-82.8, 28.9], [-83.7, 29.9], [-84.9, 29.7],
  [-86.5, 30.4], [-88.0, 30.5], [-89.4, 30.3], [-89.2, 29.2], [-90.5, 29.1], [-92.0, 29.6], [-93.8, 29.7], [-95.0, 29.3],
  [-96.6, 28.3], [-97.3, 27.3], [-97.4, 26.0], [-97.6, 24.0], [-30, 24]];
const CHESAPEAKE = [[-76.0, 37.0], [-76.3, 37.3], [-76.4, 38.0], [-76.5, 38.9], [-76.1, 39.5], [-76.0, 38.5], [-75.9, 37.6]];
const LAKES = [
  [[-92.1, 46.75], [-89.2, 48.35], [-87.0, 48.75], [-85.6, 47.9], [-84.9, 47.0], [-84.6, 46.5], [-85.9, 46.65], [-87.4, 46.5],
    [-88.0, 47.45], [-88.6, 46.95], [-89.9, 46.75], [-91.2, 46.85]],                                                       // Superior
  [[-87.65, 41.65], [-87.55, 42.6], [-87.9, 43.3], [-87.6, 44.2], [-87.4, 44.8], [-87.0, 45.2], [-86.6, 45.85], [-85.6, 45.9],
    [-84.8, 45.8], [-85.4, 45.2], [-85.6, 44.6], [-86.2, 44.1], [-86.4, 43.4], [-86.25, 42.6], [-86.6, 42.0], [-87.2, 41.6]],   // Michigan
  [[-84.7, 45.85], [-83.3, 46.05], [-81.9, 45.6], [-81.6, 45.15], [-81.3, 44.3], [-81.7, 43.5], [-82.4, 43.0], [-82.6, 43.6],
    [-83.4, 43.9], [-83.3, 44.6], [-83.5, 45.1], [-84.2, 45.6]],                                                            // Huron
  [[-81.6, 45.2], [-80.2, 45.8], [-79.9, 44.8], [-80.6, 44.5], [-81.2, 44.9]],                                              // Georgian Bay
  [[-83.4, 41.75], [-82.7, 41.45], [-81.7, 41.5], [-80.5, 41.95], [-79.1, 42.6], [-78.9, 42.9], [-79.6, 42.85], [-80.4, 42.6],
    [-81.5, 42.6], [-82.5, 42.05], [-83.1, 42.0]],                                                                          // Erie
  [[-79.8, 43.3], [-79.1, 43.2], [-77.6, 43.25], [-76.3, 43.5], [-76.2, 44.1], [-77.2, 44.0], [-78.3, 43.95], [-79.4, 43.65]],   // Ontario
];
const RIVERS = [
  [[-95.2, 47.5], [-93.3, 45.0], [-91.2, 43.5], [-90.6, 41.5], [-91.4, 40.0], [-90.2, 38.6], [-89.2, 37.0], [-90.2, 35.0], [-91.1, 33.0], [-91.3, 31.0], [-90.1, 29.9], [-89.4, 29.2]],   // Mississippi
  [[-111.5, 47.5], [-104.0, 47.9], [-100.4, 46.8], [-96.5, 42.5], [-95.9, 41.3], [-94.6, 39.1], [-92.2, 38.6], [-90.2, 38.8]],   // Missouri
  [[-80.0, 40.4], [-81.6, 39.3], [-82.9, 38.7], [-84.5, 39.1], [-85.8, 38.2], [-87.6, 37.9], [-89.2, 37.0]],                    // Ohio
  [[-106.0, 40.1], [-108.5, 39.1], [-109.9, 38.2], [-111.4, 36.9], [-112.1, 36.1], [-114.0, 36.1], [-114.7, 35.0], [-114.6, 32.7]],   // Colorado
  [[-76.4, 44.1], [-75.0, 45.0], [-73.5, 45.6], [-71.2, 46.8], [-68.5, 48.6], [-64.5, 49.2]],                                  // St Lawrence
];
// The US-Canada border, as the latitude where Canada starts at each longitude (west to east).
const CANADA = [[-125, 49], [-95.2, 49], [-89.6, 48.0], [-84.6, 46.5], [-82.4, 45.3], [-82.5, 43.0], [-79.0, 43.3], [-76.4, 44.1], [-74.7, 45.0], [-71.5, 45.0], [-70.0, 46.7], [-67.8, 47.1], [-67.0, 45.0], [-60, 45]];
const MEXICO = [[-125, 32.5], [-117.1, 32.5], [-114.7, 32.7], [-111.1, 31.3], [-108.2, 31.3], [-108.2, 31.8], [-106.5, 31.8], [-104.5, 29.6], [-103.0, 29.0], [-101.4, 29.8], [-99.5, 27.5], [-97.4, 25.9], [-90, 24]];
const RANGES = [[[-112, 48.5], [-109, 45], [-106.5, 40.5], [-105.5, 37.5], [-106, 35]],                          // the Rockies
  [[-120.8, 40.3], [-120, 38.8], [-118.6, 37], [-118.2, 35.6]],                                                       // the Sierra Nevada
  [[-121.8, 48.8], [-121.7, 46.8], [-121.8, 44.2], [-122.2, 42.3]],                                                   // the Cascades
  [[-84.8, 34.6], [-82.6, 35.6], [-80.5, 37.4], [-78.6, 39.2], [-76.4, 41.2], [-74.6, 42.4], [-73.0, 44.0], [-71.3, 44.3]]];   // the Appalachians
const STATE_LINES = [[[-124.2, 42], [-111.05, 42]], [[-120, 42], [-120, 39], [-114.6, 35]], [[-114.05, 42], [-114.05, 37]], [[-114.05, 37], [-94.6, 37]],
  [[-109.05, 41], [-109.05, 37]], [[-102.05, 41], [-102.05, 37]], [[-111.05, 41], [-102.05, 41]], [[-102.05, 40], [-95.3, 40]],
  [[-94.6, 36.5], [-81.7, 36.5]], [[-80.5, 39.7], [-75.8, 39.7]], [[-79.8, 42], [-75.4, 42]], [[-84.8, 39.1], [-84.8, 41.7]],
  [[-87.5, 38], [-87.5, 41.7]], [[-87.5, 41.7], [-82.7, 41.7]], [[-94.6, 40.6], [-94.6, 36.5]], [[-104.05, 49], [-104.05, 41]]];

// The land's colour by longitude: forest green in the East, farmland, the plains' yellow-green, the
// browns of the Rockies and the plateau, desert tan, and California's dry gold.
const TINTS = [[-125, '#a8ac68'], [-119, '#c4a870'], [-112, '#caa66e'], [-106, '#a88e66'], [-101, '#b8b46a'], [-95, '#9cb064'], [-88, '#86a660'], [-80, '#78985c'], [-66, '#6e8e58']];
const mix = (a, b, u) => '#' + hexToRgb(a).map((v, i) => Math.round(v + (hexToRgb(b)[i] - v) * u).toString(16).padStart(2, '0')).join('');
function landTint(lon) {
  if (lon <= TINTS[0][0]) return TINTS[0][1];
  for (let i = 1; i < TINTS.length; i++) if (lon <= TINTS[i][0]) return mix(TINTS[i - 1][1], TINTS[i][1], (lon - TINTS[i - 1][0]) / (TINTS[i][0] - TINTS[i - 1][0]));
  return TINTS.at(-1)[1];
}

// Interpolate a [lon, lat] polyline's latitude at a longitude.
function latAt(line, lon) {
  for (let i = 1; i < line.length; i++) {
    const [a, b] = [line[i - 1], line[i]];
    if (lon >= a[0] && lon <= b[0]) return a[1] + (b[1] - a[1]) * (lon - a[0]) / (b[0] - a[0] || 1);
  }
  return lon < line[0][0] ? line[0][1] : line.at(-1)[1];
}

function fillPoly(mask, pts, value) {
  const m = pts.map(toMap);
  for (let y = 0; y < MAP_H; y++) {
    const yc = y + 0.5, xs = [];
    for (let i = 0; i < m.length; i++) {
      const [x0, y0] = m[i], [x1, y1] = m[(i + 1) % m.length];
      if ((y0 <= yc) !== (y1 <= yc)) xs.push(x0 + (yc - y0) * (x1 - x0) / (y1 - y0));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.max(0, Math.ceil(xs[k])); x < Math.min(MAP_W, xs[k + 1]); x++) mask[y * MAP_W + x] = value;
  }
}

function polyline(p, pts, col, dash = 0) {
  const m = pts.map(toMap);
  let n = 0;
  for (let i = 1; i < m.length; i++) {
    const [x0, y0] = m[i - 1], [x1, y1] = m[i], steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    for (let s = 0; s < steps; s++, n++) if (!dash || n % dash < dash / 2) p.px(x0 + (x1 - x0) * s / steps, y0 + (y1 - y0) * s / steps, col);
  }
}

// The map in full colour: sea, the land tinted by region (Canada and Mexico paler), mountains with
// snow on the Rockies, the Great Lakes and rivers, borders and a few state lines.
function colourMap() {
  const p = new Painter(MAP_W, MAP_H), water = new Uint8Array(MAP_W * MAP_H), r = rng(54);
  fillPoly(water, PACIFIC, 1); fillPoly(water, ATLANTIC, 1);
  for (const lake of [...LAKES, BAY, CHESAPEAKE]) fillPoly(water, lake, 1);
  const ranges = RANGES.map(line => line.map(toMap));
  const nearRange = (x, y) => {
    let best = 99;
    for (const line of ranges) for (let i = 1; i < line.length; i++) {
      const [ax, ay] = line[i - 1], [bx, by] = line[i], dx = bx - ax, dy = by - ay;
      const u = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
      best = Math.min(best, Math.hypot(x - ax - u * dx, y - ay - u * dy));
    }
    return best;
  };
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    const lon = x / KX + LON0, lat = LAT0 - y / S, v = r();
    if (water[y * MAP_W + x]) { p.px(x, y, (x * 7 + y * 3) % 23 === 0 ? '#4a8ac8' : '#3a76b8'); continue; }
    let c = landTint(lon + (r() - 0.5) * 3);                                       // dithered from region to region
    if (lat > latAt(CANADA, lon)) c = mix(c, '#c4d0b0', 0.35);
    if (lat < latAt(MEXICO, lon)) c = mix(c, '#e0c89a', 0.4);
    const d = nearRange(x, y);
    if (lon > -86 && d < 3) c = v < 0.5 ? '#5e7e4a' : '#6a8a54';                  // the green Appalachians
    else if (lon < -100 && d < 3.5) c = d < 1.6 && v < 0.3 ? '#efefe9' : v < 0.5 ? '#8e765a' : '#9a8262';   // the western ranges, snow on the crest
    else if (v < 0.05) c = mix(c, '#000000', 0.12);
    p.px(x, y, c);
  }
  for (const line of RIVERS) polyline(p, line, '#4a86c4');
  polyline(p, CANADA, '#4a4a40', 4); polyline(p, MEXICO, '#4a4a40', 4);
  for (const line of STATE_LINES) polyline(p, line, '#6a6450', 3);
  for (let y = 0; y < MAP_H; y++) for (let x = 1; x < MAP_W; x++) {               // a light rim where land meets the sea
    if (water[y * MAP_W + x] !== water[y * MAP_W + x - 1]) p.px(water[y * MAP_W + x] ? x : x - 1, y, '#d8e4ea');
  }
  return p;
}

// The same map in Michigan's grey: every pixel pulled 80% of the way to its own luminance.
function greyed(p) {
  const g = new Painter(p.w, p.h);
  for (let k = 0; k < p.data.length; k += 4) {
    const [r, gg, b] = [p.data[k], p.data[k + 1], p.data[k + 2]], l = 0.3 * r + 0.59 * gg + 0.11 * b;
    g.data[k] = r + (l - r) * 0.8; g.data[k + 1] = gg + (l - gg) * 0.8; g.data[k + 2] = b + (l - b) * 0.8; g.data[k + 3] = p.data[k + 3];
  }
  return g;
}

// ---------- the car, the route, the places ----------
const CAR = art(`
...SSSS....
..SaaSaaS..
.SSSSSSSSS.
SSSSSSSSSSS
.OO.....OO.
`, { S: '#b4b9c0', a: '#2a3542', O: '#16161a' }, '#2a2d33');
const ICONS = {
  nyc: { at: [-74.0, 40.71], dx: 3, dy: -12, art: art(`
....s......
....s...s..
...ss...s..
..sss..sss.
.ssss.ssss.
sssssssssss
`, { s: '#5a6a80' }, '#2a2d38') },
  dc: { at: [-77.04, 38.91], dx: -14, dy: -8, art: art(`
.....w.....
.....w.....
.....w.....
..www.w....
.wwwwwww...
wwwwwwwww..
`, { w: '#e8e4da' }, '#4a4a48') },
  maine: { at: [-70.26, 43.66], dx: 3, dy: -10, art: art(`
.y.
rrr
www
rrr
www
`, { y: '#ffd75e', r: '#c8302a', w: '#f4f1ea' }, '#2a2a30') },
  chicago: { at: [-87.63, 41.88], dx: -6, dy: -13, art: art(`
..s.s.....
..sss.....
..sss.s...
.ssss.ss..
.sssssss..
ssssssss..
`, { s: '#4a5262' }, '#22242a') },
  arch: { at: [-109.6, 38.6], dx: -4, dy: -9, art: art(`
.rrrrr.
rr...rr
r.....r
r.....r
`, { r: '#c8603a' }, '#5a2a1a') },
  vegas: { at: [-115.14, 36.17], dx: 3, dy: -9, art: art(`
.ppppp.
pyyyyyp
pyyyyyp
.ppppp.
...p...
`, { p: '#e84a8a', y: '#ffe08a' }, '#3a1a2a') },
  bridge: { at: [-122.48, 37.82], dx: -12, dy: -9, art: art(`
r.....r
r.....r
rrrrrrr
r.r.r.r
`, { r: '#d8402a' }, '#4a1a12') },
};
const PLACES = [['EAST LANSING', [-84.48, 42.73], 0], ['NEW YORK', [-74.0, 40.71], 0], ['WASHINGTON', [-77.04, 38.91], 0],
  ['CHICAGO', [-87.63, 41.88], 1], ['DENVER', [-104.99, 39.74], 1], ['LAS VEGAS', [-115.14, 36.17], 1], ['SANTA CLARA', [-121.95, 37.35], 1]];

// Lengths along a leg, so the car keeps an even pace; and how far along its leg the car is when it
// reaches each landmark and place.
function route(pts) {
  const m = pts.map(toMap), acc = [0];
  for (let i = 1; i < m.length; i++) acc.push(acc[i - 1] + Math.hypot(m[i][0] - m[i - 1][0], m[i][1] - m[i - 1][1]));
  return { m, acc, len: acc.at(-1) };
}
function along(rt, d) {
  let i = 1;
  while (i < rt.m.length - 1 && rt.acc[i] < d) i++;
  const u = Math.max(0, Math.min(1, (d - rt.acc[i - 1]) / (rt.acc[i] - rt.acc[i - 1] || 1)));
  const [x0, y0] = rt.m[i - 1], [x1, y1] = rt.m[i];
  return { x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u, dir: Math.sign(x1 - x0) || 1 };
}
const legU = ([a, b], t) => Math.max(0, Math.min(1, (t - a) / (b - a)));

// Where the car is at time t, on which leg, and how far the colour has spread (0 until it turns west).
export function tripAt(t) {
  const e = legU(LEGS.east, t), w = legU(LEGS.west, t);
  const leg = t < LEGS.west[0] ? 'east' : 'west', rt = leg === 'east' ? R_EAST : R_WEST;
  const pos = along(rt, (leg === 'east' ? e : w) * rt.len);
  return { leg, ...pos, colour: leg === 'west' ? Math.pow(w, 1.6) * (MAP_W + 100) + (t > LEGS.west[1] ? 2000 : 0) : 0 };
}
const R_EAST = route(EAST), R_WEST = route(WEST);
function reachAt(pt, leg) {
  const rt = leg ? R_WEST : R_EAST, [px, py] = toMap(pt);
  let best = 0, bestD = Infinity;
  for (let d = 0; d <= rt.len; d += 1) { const q = along(rt, d), dd = Math.hypot(q.x - px, q.y - py); if (dd < bestD) { bestD = dd; best = d; } }
  return best;
}
const WEST_KEYS = new Set(['chicago', 'arch', 'vegas', 'bridge']);
for (const [key, icon] of Object.entries(ICONS)) { icon.leg = WEST_KEYS.has(key) ? 1 : 0; icon.d = reachAt(icon.at, icon.leg); }
const SPOTS = PLACES.map(([name, pt, leg]) => ({ name, pt, leg, d: name === 'EAST LANSING' ? -1 : reachAt(pt, leg) }));

export function buildRoadtrip(W, H = 96) {
  const colour = colourMap();
  return { W, H, layers: { colour, grey: greyed(colour) }, mapW: MAP_W, mapH: MAP_H };
}

const labels = new Map();
function text(str, ink) {
  if (!labels.has(str + ink)) labels.set(str + ink, label(str, ink));
  return labels.get(str + ink);
}

function trail(ctx, rt, upTo, X, Y) {
  ctx.fillStyle = '#f0dc8c';
  let n = 0;
  for (let i = 1; i < rt.m.length; i++) {
    const [x0, y0] = rt.m[i - 1], [x1, y1] = rt.m[i], seg = rt.acc[i] - rt.acc[i - 1];
    for (let s = 0; s < seg; s += 1, n++) {
      if (rt.acc[i - 1] + s > upTo) return;
      if (n % 3 < 2) ctx.fillRect(X(x0 + (x1 - x0) * s / seg), Y(y0 + (y1 - y0) * s / seg), 1, 1);
    }
  }
}

function layerAt(ctx, img, t, s, env, cam) {
  // one full drawing of the map: the base, the trails driven so far, places and landmarks reached
  const { x: camX, y: camY } = cam, X = (x) => Math.round(x - camX), Y = (y) => Math.round(y - camY);
  ctx.drawImage(img, -Math.round(camX), -Math.round(camY));
  const e = legU(LEGS.east, t), w = legU(LEGS.west, t);
  trail(ctx, R_EAST, e * R_EAST.len, X, Y);
  if (w > 0) trail(ctx, R_WEST, w * R_WEST.len, X, Y);
  const reached = (leg, d) => (leg ? w * R_WEST.len : e * R_EAST.len) >= d;     // has the car got this far along the leg?
  for (const icon of Object.values(ICONS)) {
    if (!reached(icon.leg, icon.d)) continue;
    const [mx, my] = toMap(icon.at);
    ctx.drawImage(env.art(icon.art), X(mx + icon.dx), Y(my + icon.dy));
  }
  for (const { name, pt, leg, d } of SPOTS) {
    if (!reached(leg, d)) continue;
    const [mx, my] = toMap(pt), fg = env.art(text(name, '#f4f1ea')), bg = env.art(text(name, '#141418'));
    ctx.fillStyle = '#141418'; ctx.fillRect(X(mx) - 1, Y(my) - 1, 3, 3);
    ctx.fillStyle = '#f4f1ea'; ctx.fillRect(X(mx), Y(my), 1, 1);
    const lx = X(mx) - (name === 'SANTA CLARA' ? -4 : fg.width / 2), ly = Y(my) + (name === 'NEW YORK' || name === 'WASHINGTON' ? 4 : -9);
    ctx.drawImage(bg, lx + 1, ly + 1); ctx.drawImage(fg, lx, ly);
  }
}

export function renderRoadtrip(ctx, t, s, env) {
  const { W, H, canvases: c } = s, trip = tripAt(t);
  const camX = W >= MAP_W * 0.62 ? toMap([-96.5, 0])[0] - W / 2 : Math.min(Math.max(trip.x - W * 0.5, 0), MAP_W - W);
  const cam = { x: camX, y: Math.min(Math.max(trip.y - 56, 0), MAP_H - H) };
  ctx.clearRect(0, 0, W, H);
  layerAt(ctx, c.grey, t, s, env, cam);
  if (trip.colour > 0) {                                                            // the colour spreads out from the car
    const cx = trip.x - cam.x, cy = trip.y - cam.y, r = trip.colour;
    ctx.save(); ctx.beginPath();
    for (let y = 0; y < H; y++) { const d = r * r - (y - cy) * (y - cy); if (d > 0) { const hw = Math.sqrt(d); ctx.rect(Math.round(cx - hw), y, Math.round(2 * hw), 1); } }
    ctx.clip();
    layerAt(ctx, c.colour, t, s, env, cam);
    ctx.restore();
    if (r < W * 2) {
      ctx.fillStyle = '#fff6d0';
      for (let a = 0; a < Math.PI * 2; a += 2 / Math.max(8, r)) if ((Math.floor(a * r) + Math.floor(t * 30)) % 3) ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1);
    }
  }
  const car = env.art(CAR), x = Math.round(trip.x - cam.x), y = Math.round(trip.y - cam.y);   // the car, facing the way it drives
  const bob = t < LEGS.west[1] && Math.floor(t * 10) % 2 ? 1 : 0;
  ctx.save();
  if (trip.dir < 0) { ctx.translate(x * 2, 0); ctx.scale(-1, 1); }
  ctx.drawImage(car, x - 6, y - 6 - bob);
  ctx.restore();
}

export const roadtrip = { build: buildRoadtrip, render: renderRoadtrip };
