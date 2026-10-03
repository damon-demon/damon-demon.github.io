import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { ring, buildTrack } from '../../reel/ch1/ring.js';

sceneContract('ch1 Nürburgring', ring, 2.5);

test('the Nordschleife bends both ways and climbs and plunges', () => {
  const { segs, crest } = buildTrack();
  assert.ok(segs.some(s => s.curve > 4) && segs.some(s => s.curve < -4), 'hard bends left and right');
  const ys = segs.map(s => s.y2);
  assert.ok(Math.max(...ys) - Math.min(...ys) > 2000, 'real elevation change');
  assert.equal(segs[crest].y2, Math.max(...ys), 'the crest is the highest point');
});

test('the white Golf flies over the crest, then lands', () => {
  const { segs, crest } = buildTrack();
  const carY = (t) => frameAt(ring, 480, t).ctx.draws('car')[0][1];
  const atCrest = (crest + 2) * 200 / (46 * 200);                    // seconds until just past the crest
  assert.ok(carY(atCrest) < carY(0.05) - 4, 'airborne just past the crest');
  assert.ok(Math.abs(carY(2.2) - carY(0.05)) <= 1, 'back on the road later');
  assert.ok(segs.length * 200 > 2.5 * 46 * 200 + 80 * 200, 'the track outlasts the shot plus the draw distance');
});

test('the lap timer runs in the corner', () => {
  assert.ok(frameAt(ring, 480, 1).ctx.draws('art').length >= 2);
});
