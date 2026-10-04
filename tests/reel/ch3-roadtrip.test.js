import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { roadtrip, tripAt, toMap, LEGS } from '../../reel/ch3/roadtrip.js';

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

test('road trip: the East loop stays grey; once the car turns west the colour spreads out from it until the map is all colour', () => {
  assert.equal(tripAt(LEGS.east[1]).colour, 0);
  assert.equal(tripAt(LEGS.west[0]).colour, 0);
  const r = [3, 3.6, 4.2].map(t => tripAt(t).colour);
  assert.ok(r[0] > 0 && r[1] > r[0] && r[2] > r[1]);
  assert.ok(tripAt(4.8).colour > 2000, 'all colour once it has arrived');
});

test('road trip: the grey map alone on the East loop, the colour map over it once the car turns west', () => {
  const east = frameAt(roadtrip, 480, 1.5).ctx, west = frameAt(roadtrip, 480, 3.5).ctx;
  assert.deepEqual([east.draws('grey').length, east.draws('colour').length], [1, 0]);
  assert.deepEqual([west.draws('grey').length, west.draws('colour').length], [1, 1]);
});

test('road trip: on a desktop the map holds still; on a phone the camera follows the car', () => {
  const mapX = (W, t) => frameAt(roadtrip, W, t).ctx.draws('grey')[0][0];
  assert.equal(mapX(480, 0.5), mapX(480, 4.5));
  assert.ok(mapX(195, 4.5) > mapX(195, 0.5), 'the map slides right as the car drives west');
});
