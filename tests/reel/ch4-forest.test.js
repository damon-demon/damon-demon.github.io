import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { forest, runAt, walkingAt, PICKS } from '../../reel/ch4/forest.js';

sceneContract('ch4 forest', forest, 1.8);

const drawn = (t) => frameAt(forest, 480, t).ctx.calls.filter(c => c[0] === 'drawImage');

test('forest: Yimeng walks in, stops at the chanterelles, and walks on', () => {
  assert.ok(runAt(0.3) > runAt(0.1));
  assert.equal(runAt(0.9), runAt(1.3), 'standing while picking');
  assert.ok(runAt(1.8) > runAt(1.3));
  assert.deepEqual([0.2, 1, 1.7].map(walkingAt), [true, false, true]);
  assert.ok(PICKS.every(p => !walkingAt(p) && !walkingAt(p + 0.22)), 'every one picked standing still');
});

test('forest: the chanterelles go from the ground into the basket', () => {
  const caps = (t) => drawn(t).filter(c => c[1] === 'art').map(c => c[3]);
  assert.ok(caps(0.5).length === 3 && caps(0.5).every(y => y >= 84), 'three on the ground');
  assert.ok(caps(1.5).length === 3 && caps(1.5).every(y => y <= 76), 'three in the basket');
});

test('forest: the dog in its backpack trots ahead, then turns back and waits, wagging', () => {
  assert.ok(drawn(0.2).some(c => /^dog:hikepack:\d$/.test(c[1])));
  assert.ok(drawn(1).some(c => /^dog:hikepack:wait:\d$/.test(c[1])));
});
