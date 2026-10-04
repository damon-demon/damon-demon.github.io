import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { sceneContract, frameAt } from './fake-canvas.js';
import { roadtrip, tripAt, floodAt, toMap, LEGS } from '../../reel/ch3/roadtrip.js';

sceneContract('ch3 roadtrip', roadtrip, 5);

// When, on one leg, the car comes closest to a place, and how close it gets (px on the map).
function passes(leg, lonLat) {
  const [px, py] = toMap(lonLat), [a, b] = LEGS[leg];
  let best = { t: a, d: Infinity };
  for (let t = a; t <= b; t += 0.005) {
    const p = tripAt(t), d = Math.hypot(p.x - px, p.y - py);
    if (d < best.d) best = { t, d };
  }
  return best;
}
const gap = (p, lonLat) => { const [x, y] = toMap(lonLat); return Math.hypot(p.x - x, p.y - y); };
const inOrder = (stops) => stops.every((s, i) => !i || s.t > stops[i - 1].t);

test('road trip: the car loops round the East from East Lansing, by Niagara, Maine, New York and Washington, and home', () => {
  const stops = [[-79.07, 43.09], [-70.26, 43.66], [-74.0, 40.71], [-77.04, 38.91]].map(p => passes('east', p));
  assert.ok(stops.every(s => s.d < 2), 'it goes through each');
  assert.ok(inOrder(stops), 'in that order');
  assert.ok(gap(tripAt(0), [-84.48, 42.73]) < 1 && gap(tripAt(LEGS.east[1]), [-84.48, 42.73]) < 1, 'from East Lansing and back');
});

test('road trip: then it turns west, by Chicago, Denver and Las Vegas to Santa Clara', () => {
  const stops = [[-87.63, 41.88], [-104.99, 39.74], [-115.14, 36.17]].map(p => passes('west', p));
  assert.ok(stops.every(s => s.d < 2));
  assert.ok(inOrder(stops));
  assert.ok(gap(tripAt(5), [-121.95, 37.35]) < 1);
  assert.equal(tripAt(3.5).dir, -1, 'facing west');
});

test('road trip: the map comes up grey, and as the car sets off the colour floods out from East Lansing, ahead of it', () => {
  assert.equal(floodAt(0.1), 0);
  const r = [0.3, 0.5, 0.7].map(floodAt);
  assert.ok(r[0] > 0 && r[1] > r[0] && r[2] > r[1]);
  for (const place of [[-70.26, 43.66], [-74.0, 40.71]]) {
    const [x, y] = toMap(place), [hx, hy] = toMap([-84.48, 42.73]);
    assert.ok(floodAt(passes('east', place).t) > Math.hypot(x - hx, y - hy), 'Maine and New York are in colour before the car gets there');
  }
  assert.ok(floodAt(1) >= 2000, 'and then the whole map');
});

test('road trip: the grey map alone at first, the colour clipped over it while it floods, then the colour alone', () => {
  const layers = (t) => { const c = frameAt(roadtrip, 480, t).ctx; return [c.draws('grey').length, c.draws('colour').length]; };
  assert.deepEqual(layers(0.1), [1, 0]);
  assert.deepEqual(layers(0.5), [1, 1]);
  assert.deepEqual(layers(3.5), [0, 1]);
});

test('road trip: on a desktop the map holds still; on a phone the camera follows the car', () => {
  const mapX = (W, t) => frameAt(roadtrip, W, t).ctx.draws('colour')[0][0];
  assert.equal(mapX(480, 1.5), mapX(480, 4.5));
  assert.ok(mapX(195, 4.5) > mapX(195, 1.5), 'the map slides right as the car drives west');
});

test('road trip: the map is painted exactly as approved, pixel for pixel', () => {
  const s = roadtrip.build(480, 96), sha = (p) => createHash('sha256').update(p.data).digest('hex').slice(0, 16);
  assert.deepEqual([sha(s.layers.colour), sha(s.layers.grey)], ['7bf1e42f20b08159', '8ced6214334516e9']);
});
