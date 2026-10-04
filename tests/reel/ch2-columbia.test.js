import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { columbia } from '../../reel/ch2/columbia.js';

sceneContract('ch2 Columbia', columbia, 1.8);

test('Columbia: Low Library and Alma Mater stand ahead of Yimeng', () => {
  const s = columbia.build(480, 96);
  assert.ok(s.cx > s.hx + 60, 'the library is centred well to the right');
  assert.equal(frameAt(columbia, 480, 0.5).ctx.draws('art').length, 1, 'Alma Mater on her pedestal');
});

test('Columbia: Yimeng walks in along College Walk, then stops and looks up', () => {
  const s = columbia.build(480, 96);
  assert.deepEqual(frameAt(columbia, 480, 1.6).ctx.draws('nyc:walk:1'), [[s.hx - 9, 90 - 44]]);
  const x = (t) => frameAt(columbia, 480, t).ctx.calls.find(c => String(c[1]).startsWith('nyc:walk'))[2];
  assert.ok(x(0.2) < x(1), 'walking right');
  assert.equal(x(1.15), x(1.7), 'then standing still');
});
