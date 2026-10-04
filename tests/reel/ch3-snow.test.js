import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { snow } from '../../reel/ch3/snow.js';

sceneContract('ch3 snow', snow, 2);

test('Michigan: the white of the cap toss clears off the snow', () => {
  const whiteOut = (t) => frameAt(snow, 480, t).ctx.calls.some(c => c[0] === 'fillRect' && c[1] === 0 && c[2] === 0 && c[3] === 480 && c[4] === 96);
  assert.equal(whiteOut(0.1), true);
  assert.equal(whiteOut(0.8), false);
});

test('Michigan: Yimeng walks on in the green puffer, greyed, with the puppy ahead', () => {
  const s = snow.build(480, 96), { ctx } = frameAt(snow, 480, 1);
  assert.deepEqual(ctx.draws('mi_winter:walk:muted:2'), [[s.hx - 9, 88 - 44]]);
  assert.deepEqual(ctx.draws('dog:pup:muted:1'), [[s.hx + 26, 88 - 15]]);
});
