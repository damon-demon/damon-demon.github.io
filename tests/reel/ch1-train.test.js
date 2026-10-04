import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { train } from '../../reel/ch1/train.js';

sceneContract('ch1 train', train, 4);

test('the train: Yimeng sits by the window, rocking with the carriage', () => {
  const bob = Math.floor(0.2 * 7) % 2;
  assert.deepEqual(frameAt(train, 480, 0.2).ctx.draws('travel:sit:0'), [[163 - 9, 81 - 1 - 38 + bob]]);
});

test('the train: each second shows the next city and its landmark', () => {
  ['lm0', 'lm1', 'lm2', 'lm3'].forEach((lm, i) => assert.equal(frameAt(train, 480, i + 0.5).ctx.draws(lm).length, 1, `${lm} at ${i + 0.5}s`));
});

test('the train: passport stamps pile up, faster at the end', () => {
  const stamps = (t) => frameAt(train, 480, t).ctx.draws('art').length;
  assert.equal(stamps(0.05), 0);
  assert.equal(stamps(2.5), 3);
  assert.equal(stamps(3.9), 9);
});

test('the train: the Eiffel Tower is open lattice, not a solid silhouette', () => {
  const lm = train.build(480, 96).layers.lm0;
  const row = (y) => Array.from({ length: lm.w }, (_, x) => lm.data[(y * lm.w + x) * 4 + 3] > 0);
  const gapsInside = (r) => { const a = r.indexOf(true), b = r.lastIndexOf(true); return r.slice(a, b + 1).filter(v => !v).length; };
  assert.ok([20, 24, 34].every(y => gapsInside(row(y)) > 0), 'see-through rows in the body and between the legs');
  assert.ok(lm.h >= 40, 'tall enough to read');
});
