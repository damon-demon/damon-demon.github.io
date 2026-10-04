import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { timelapse, phaseAt, papersAt, seasonAt, dogCoat } from '../../reel/ch3/timelapse.js';

sceneContract('ch3 time-lapse', timelapse, 4.5);

test('time-lapse: five years, each the desk and then the gym', () => {
  const cuts = [];
  for (let t = 0; t < 4.5; t += 0.02) { const p = phaseAt(t), k = `${p.year}:${p.room}`; if (cuts.at(-1) !== k) cuts.push(k); }
  assert.deepEqual(cuts, ['0:desk', '0:gym', '1:desk', '1:gym', '2:desk', '2:gym', '3:desk', '3:gym', '4:desk', '4:gym']);
});

test('time-lapse: the paper count climbs from 0 to 16 and never goes back', () => {
  const counts = [];
  for (let t = 0; t < 4.5; t += 0.01) { const p = phaseAt(t); if (p.room === 'desk') counts.push(papersAt(p.year, p.u)); }
  assert.ok(counts.every((n, i) => !i || n >= counts[i - 1]));
  assert.deepEqual([counts[0], counts.at(-1)], [0, 16]);
});

test('time-lapse: the window runs through the seasons, and the dog dresses for them', () => {
  assert.deepEqual([0.1, 0.3, 0.6, 0.9].map(seasonAt), ['winter', 'spring', 'summer', 'autumn']);
  assert.equal(dogCoat(0, 'winter'), 'pup', 'still a puppy in the first year');
  assert.deepEqual(['winter', 'spring', 'summer', 'autumn'].map(s => dogCoat(3, s)), ['msu_knit', 'bandana', 'bare', 'bandana']);
});

test('time-lapse: Yimeng types at the desk, and curls in a bigger build in later years', () => {
  assert.ok(frameAt(timelapse, 480, 0.2).ctx.calls.some(c => String(c[1]).startsWith('lab:type:muted')));
  const lifter = (t) => frameAt(timelapse, 480, t).ctx.calls.find(c => /^gym\d:curl/.test(c[1]))[1];
  assert.match(lifter(1), /^gym1:/);
  assert.match(lifter(4.3), /^gym5:/);
});
