import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { fishing, fishAt } from '../../reel/ch4/fishing.js';

sceneContract('ch4 fishing', fishing, 1.9);

test('fishing: the float in the sea, a bite, the rockfish reeled up, then hanging from the rod', () => {
  assert.deepEqual([0.3, 1, 1.6].map(fishAt), ['water', 'reeling', 'up']);
});

test('fishing: Yimeng at the edge of the rock with the rod, the dog in its life vest behind', () => {
  const { ctx, s } = frameAt(fishing, 480, 1.6), calls = ctx.calls.filter(c => c[0] === 'drawImage');
  assert.deepEqual(ctx.draws('fish:walk:1'), [[s.hx - 9, 66 - 44]]);
  const dog = calls.find(c => /^dog:lifevest:wait:\d$/.test(c[1]));
  assert.ok(dog && dog[2] + 24 < s.hx, 'behind Yimeng');
});
