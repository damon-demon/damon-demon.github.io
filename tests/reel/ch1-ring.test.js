import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { ring } from '../../reel/ch1/ring.js';

sceneContract('ch1 Nürburgring', ring, 2);

test('the Nürburgring: Yimeng drives the Golf while the timer ticks past 8:00', () => {
  const { ctx } = frameAt(ring, 480, 1);
  assert.equal(ctx.draws('travel:walk:1').length, 1);
  assert.equal(ctx.draws('car').length, 1);
});
