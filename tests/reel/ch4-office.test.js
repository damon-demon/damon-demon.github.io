import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { office, candlesAt, CLOSES } from '../../reel/ch4/office.js';

sceneContract('ch4 office', office, 1.6);

test('office: the chart on the phone grows a candle at a time and climbs, with a dip on the way', () => {
  assert.deepEqual([0, 0.11, 0.5, 1.2, 1.6].map(candlesAt), [1, 2, 5, 11, 11]);
  assert.equal(CLOSES.length, 12, 'eleven candles, open to close');
  assert.ok(CLOSES.at(-1) > CLOSES[0] * 2, 'up overall');
  assert.ok(CLOSES.some((c, i) => i && c < CLOSES[i - 1]), 'with red candles too');
});

test('office: Yimeng works at the desk in the purple hoodie, the dog asleep under it', () => {
  const { ctx, s } = frameAt(office, 480, 0.8), calls = ctx.calls.filter(c => c[0] === 'drawImage');
  const at = (re) => calls.findIndex(c => re.test(c[1]));
  assert.deepEqual(calls.filter(c => /^work:type:\d$/.test(c[1])).map(c => [c[2], c[3]]), [[s.hx - 9, 41]]);
  assert.ok(at(/^dog:houndstooth:sleep:\d$/) >= 0);
  assert.ok(at(/^desk$/) > at(/^work:type/), 'the desk in front of Yimeng');
});
