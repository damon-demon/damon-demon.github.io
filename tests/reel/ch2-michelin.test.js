import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { michelin, courseAt, billAt } from '../../reel/ch2/michelin.js';

sceneContract('ch2 Michelin', michelin, 3);

test('Michelin: Yimeng sits at the table in the burgundy blazer', () => {
  const s = michelin.build(480, 96);
  assert.deepEqual(frameAt(michelin, 480, 1).ctx.draws('michelin:sit:0'), [[s.hx - 9, 84 - 1 - 38]]);
});

test('Michelin: the course counter runs from 1/12 to 12/12, never backwards', () => {
  assert.equal(courseAt(0.1), 0, 'nothing is served before the cloche lifts');
  assert.equal(courseAt(0.5), 1);
  const seq = Array.from({ length: 300 }, (_, i) => courseAt(i * 0.01));
  assert.ok(seq.every((n, i) => i === 0 || n >= seq[i - 1]));
  assert.deepEqual([...new Set(seq.filter(n => n > 0))], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  assert.equal(courseAt(1.8), 12);
});

test('Michelin: the bill unrolls down to the floor and on along it', () => {
  const s = michelin.build(480, 96);
  assert.deepEqual(billAt(s, 2.3), { drop: 0, run: 0 });
  assert.equal(billAt(s, 3).drop, 90 - 76, 'from the table top to the floor');
  assert.ok(billAt(s, 3).run > s.hx, 'then most of the way across the floor');
});
