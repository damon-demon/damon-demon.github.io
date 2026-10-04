import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { ranch, runAt, beatAt } from '../../reel/ch4/ranch.js';

sceneContract('ch4 ranch', ranch, 3);

test('ranch: the chase runs at full speed, brakes, and stops for good', () => {
  assert.equal(runAt(0.5), 35);
  assert.ok(runAt(1.4) - runAt(1.3) < runAt(0.6) - runAt(0.5), 'braking');
  assert.equal(runAt(1.5), runAt(3));
});

test('ranch: the beats: the chase, the stop, off the ATV, the rifle raised, then the scope', () => {
  assert.deepEqual([0.5, 1.55, 1.7, 2, 2.6].map(beatAt), ['chase', 'stop', 'off', 'aim', 'scope']);
});

const names = (t) => frameAt(ranch, 480, t).ctx.calls.filter(c => c[0] === 'drawImage').map(c => c[1]);

test('ranch: Yimeng rides with the dog in its blaze vest on the rack, and aims only on foot', () => {
  const chase = names(0.5), aim = names(2);
  assert.ok(chase.includes('hunt:type:0'), 'riding the ATV');
  assert.ok(chase.some(n => /^dog:blaze:\d$/.test(n)));
  assert.ok(!chase.some(n => n.startsWith('hunt:aim')), 'never aiming from the vehicle');
  assert.ok(!aim.includes('hunt:type:0'), 'off the ATV');
  assert.ok(aim.some(n => /^hunt:aim:\d$/.test(n)));
  assert.ok(aim.some(n => /^dog:blaze:\d$/.test(n)), 'the dog waits on the rack');
});

test('ranch: the scope shows only the deer, its shoulder in the crosshairs', () => {
  const { ctx } = frameAt(ranch, 480, 2.6), drawn = ctx.calls.filter(c => c[0] === 'drawImage');
  assert.deepEqual(drawn.map(c => c[1]), ['art']);
  assert.ok(Math.abs(drawn[0][2] + 20 - 240) <= 2);
});
