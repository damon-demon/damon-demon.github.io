import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { sheffield } from '../../reel/ch1/sheffield.js';

sceneContract('ch1 Sheffield', sheffield, 3);

test('Sheffield: Yimeng walks under the umbrella at a third of the width', () => {
  assert.deepEqual(frameAt(sheffield, 480, 1).ctx.draws('sheffield:walk:2'), [[163 - 9, 88 - 44]]);
});

test('Sheffield: the red phone box and Firth Court come into view ahead', () => {
  const { ctx, s } = frameAt(sheffield, 480, 0);
  assert.ok(s.phoneX > 163, 'the phone box starts ahead of Yimeng');
  assert.equal(ctx.draws('art').length > 0, true, 'lamps and the phone box are drawn');
});
