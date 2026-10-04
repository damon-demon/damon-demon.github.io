import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { iceland, takeoff } from '../../reel/ch1/iceland.js';

sceneContract('ch1 Iceland', iceland, 2);
sceneContract('ch1 takeoff', takeoff, 1);

test('Iceland: walks in, then stands still under the aurora', () => {
  assert.deepEqual(frameAt(iceland, 480, 1.5).ctx.draws('iceland:walk:1'), [[163 - 9, 90 - 44]]);
});

test('the takeoff climbs out to the top right', () => {
  const at = (t) => frameAt(takeoff, 480, t).ctx.draws('plane')[0];
  assert.ok(at(0.9)[0] > at(0.1)[0], 'moves right');
  assert.ok(at(0.9)[1] < at(0.1)[1], 'climbs');
});
