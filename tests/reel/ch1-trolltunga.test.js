import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { trolltunga } from '../../reel/ch1/trolltunga.js';

sceneContract('ch1 Trolltunga', trolltunga, 3);

test('Trolltunga: walks out along the tongue, then sits at the tip', () => {
  const walking = frameAt(trolltunga, 480, 0.5).ctx.calls.filter(c => String(c[1]).startsWith('trolltunga:walk'));
  assert.equal(walking.length, 1);
  assert.equal(walking[0][3], 58 - 44);
  const { ctx, s } = frameAt(trolltunga, 480, 2);
  const sitting = ctx.calls.filter(c => String(c[1]).startsWith('trolltunga:sit'));
  assert.deepEqual(sitting.map(c => [c[2], c[3]]), [[s.tip - 12 - 9, 58 - 1 - 38]]);
});
