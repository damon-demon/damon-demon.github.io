import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { met } from '../../reel/ch2/met.js';

sceneContract('ch2 Met', met, 1.1);

test('the Met: Yimeng walks in along the pool and stops before the Temple of Dendur', () => {
  const s = met.build(480, 96);
  assert.ok(s.cx > s.hx + 60, 'the temple stands ahead, to the right');
  assert.deepEqual(frameAt(met, 480, 0.9).ctx.draws('nyc:walk:1'), [[s.hx - 9, 91 - 44]]);
});

test('the Met: the temple is mirrored in the pool', () => {
  assert.equal(frameAt(met, 480, 0.5).ctx.draws('hall').length, 2, 'the hall, then its reflection');
});
