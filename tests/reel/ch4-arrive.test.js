import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { arrive, carAt, CAR_W } from '../../reel/ch4/arrive.js';

sceneContract('ch4 arrive', arrive, 1.8);

test('arrive: the GLC rolls in from off the left and eases to a stop mid-street', () => {
  const s = arrive.build(480, 96), x = [0, 0.3, 0.6, 0.9, 1.2, 1.7].map(t => carAt(s, t));
  assert.ok(x[0] + CAR_W <= 0, 'off screen at first');
  assert.ok(x[1] - x[0] > x[3] - x[2], 'slowing down');
  assert.deepEqual(x.slice(4), [s.stopX, s.stopX]);
  assert.equal(s.stopX + CAR_W / 2, 240, 'stopped in the middle');
});

test('arrive: through the window, Yimeng in the passenger seat and the dog standing at the wheel', () => {
  const { ctx, s } = frameAt(arrive, 480, 1.5), [[x, y]] = ctx.draws('car');
  assert.deepEqual([x, y], [s.stopX, 47]);
  assert.deepEqual(ctx.draws('work:sit:0'), [[x + 37, y - 6]]);
  assert.ok(ctx.draws('art').some(([ax, ay]) => ax === x + 63 && ay === y + 9), 'the dog, at the wheel');
});
