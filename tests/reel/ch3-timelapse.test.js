import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { timelapse, phaseAt, papersAt, seasonAt, dogCoat, layout, WORKOUT } from '../../reel/ch3/timelapse.js';

sceneContract('ch3 time-lapse', timelapse, 4.5);

const names = (t) => frameAt(timelapse, 480, t).ctx.calls.filter(c => c[0] === 'drawImage').map(c => String(c[1]));

test('time-lapse: one living room, the gym on the left and the desk on the right, at every width', () => {
  for (const W of [195, 480, 640]) {
    const { pull, lift, bed, desk } = layout(W);
    assert.ok(pull < lift && lift + 20 <= bed && bed < desk, `in order at W=${W}`);
    assert.ok(desk + 78 <= W + 2, `the desk fits at W=${W}`);
  }
  assert.ok([0.2, 1, 2, 3.5, 4.4].every(t => names(t).filter(n => n === 'room').length === 1), 'the same room in every frame: no cuts');
});

test('time-lapse: each year Yimeng is at the desk, then in the gym', () => {
  const spells = [];
  for (let t = 0; t < 4.5; t += 0.02) { const p = phaseAt(t), k = `${p.year}:${p.spot}`; if (spells.at(-1) !== k) spells.push(k); }
  assert.deepEqual(spells, ['0:desk', '0:gym', '1:desk', '1:gym', '2:desk', '2:gym', '3:desk', '3:gym', '4:desk', '4:gym']);
});

test('time-lapse: in the gym Yimeng alternates curls and pull-ups, bigger from the third year', () => {
  assert.deepEqual(WORKOUT, ['curl', 'hang', 'curl', 'hang', 'curl']);
  const lifter = (t) => names(t).find(n => /^gym\d:(curl|hang)/.test(n));
  assert.match(lifter(1), /^gym1:curl/);
  assert.match(lifter(2), /^gym1:hang/);
  assert.match(lifter(4.3), /^gym5:curl/);
});

test('time-lapse: just after Yimeng moves, a faint ghost is left where Yimeng was', () => {
  assert.ok(names(0.7).some(n => n.startsWith('lab:type')), 'a ghost at the desk');
  assert.ok(!names(0.9).some(n => n.startsWith('lab:type')), 'gone a moment later');
});

test('time-lapse: the paper count climbs from 0 to 16 and never goes back', () => {
  const counts = [];
  for (let t = 0; t < 4.5; t += 0.01) { const p = phaseAt(t); if (p.spot === 'desk') counts.push(papersAt(p.year, p.u)); }
  assert.ok(counts.every((n, i) => !i || n >= counts[i - 1]));
  assert.deepEqual([counts[0], counts.at(-1)], [0, 16]);
});

test('time-lapse: the window runs through the seasons, and the dog dresses for them', () => {
  assert.deepEqual([0.1, 0.3, 0.6, 0.9].map(seasonAt), ['winter', 'spring', 'summer', 'autumn']);
  assert.equal(dogCoat(0, 'winter'), 'pup', 'still a puppy in the first year');
  assert.deepEqual(['winter', 'spring', 'summer', 'autumn'].map(s => dogCoat(3, s)), ['msu_knit', 'bandana', 'bare', 'bandana']);
});
