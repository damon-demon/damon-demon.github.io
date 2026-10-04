import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { sunset, riseAt } from '../../reel/ch4/sunset.js';

sceneContract('ch4 sunset', sunset, 2);

test('sunset: Yimeng comes up out of the sea, and stays up', () => {
  assert.equal(riseAt(0.2), 0);
  assert.ok(riseAt(0.45) > 0 && riseAt(0.45) < 1);
  assert.equal(riseAt(0.7), 1);
});

test('sunset: Yimeng in the camo wetsuit with the catch, and the dog on the rocks, a heart over it', () => {
  const names = frameAt(sunset, 480, 1.1).ctx.calls.filter(c => c[0] === 'drawImage').map(c => c[1]);
  assert.ok(names.includes('freedive:walk:1'));
  assert.ok(names.some(n => /^dog:lifevest:wait:\d$/.test(n)));
  assert.equal(names.filter(n => n === 'art').length, 2, 'the sheephead and the heart');
});
