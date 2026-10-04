import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { sceneContract, frameAt } from './fake-canvas.js';
import { moma } from '../../reel/ch2/moma.js';

sceneContract('ch2 MoMA', moma, 1.1);

test('MoMA: Yimeng walks in and stops just left of The Starry Night', () => {
  const s = moma.build(480, 96), { ctx } = frameAt(moma, 480, 0.6);
  assert.deepEqual(ctx.draws('nyc:walk:1'), [[s.hx - 9, 88 - 44]]);
  const [[px]] = ctx.calls.filter(c => /^starry\d$/.test(c[1])).map(c => [c[2]]);
  assert.ok(px > s.hx + 20, "the painting hangs just past Yimeng's face");
});

test("MoMA: The Starry Night's sky turns while Yimeng looks", () => {
  const shown = [0, 0.2, 0.4, 0.6].map(t => frameAt(moma, 480, t).ctx.calls.find(c => /^starry\d$/.test(c[1]))[1]);
  assert.deepEqual(shown, ['starry0', 'starry1', 'starry2', 'starry3']);
  const s = moma.build(480, 96), sha = (p) => createHash('sha256').update(p.data).digest('hex');
  assert.equal(new Set([0, 1, 2, 3].map(k => sha(s.layers[`starry${k}`]))).size, 4, 'four different frames');
});
