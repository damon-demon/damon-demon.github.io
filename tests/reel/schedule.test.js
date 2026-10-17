import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline } from '../../reel/timeline.js';
import { seq } from '../../reel/audio/notation.js';
import { planScore, eventsBetween, toneAt, slip } from '../../reel/audio/schedule.js';

const shot = (id, duration) => ({ id, duration, caption: id });
const TL = buildTimeline([{ name: 'A', shots: [shot('a', 2), shot('b', 2)] }, { name: 'B', shots: [shot('c', 4)] }]);
const SCORE = {
  cues: [
    { id: 'one', shots: ['a', 'b'], beats: 8, tone: 'soft', voices: [['p1', seq('C4:4 D4:4')]] },
    { id: 'two', shots: ['c'], beats: 4, tone: 'dark', tones: [[1, 'bright', 2]], voices: [['p1', seq('E4@.5 - G4:2')], ['noise', seq('hat')]] },
  ],
};

test('planScore places cues on their shots and derives the beat length', () => {
  const plan = planScore(SCORE, TL);
  assert.equal(plan.duration, 8);
  assert.deepEqual(plan.cues.map(c => [c.cue.id, c.start, c.end, c.spb]), [['one', 0, 4, 0.5], ['two', 4, 8, 1]]);
});

test('planScore turns notes and tones into sorted, timed events', () => {
  const plan = planScore(SCORE, TL);
  const notes = plan.events.filter(e => e.kind === 'note');
  assert.deepEqual(notes.map(e => [e.voice, e.time, e.dur, e.pitch ?? e.hit]), [['p1', 0, 2, 60], ['p1', 2, 2, 62], ['p1', 4, 1, 64], ['noise', 4, 1, 'hat'], ['p1', 6, 2, 67]]);
  assert.equal(notes[2].vel, 0.5);
  const tones = plan.events.filter(e => e.kind === 'tone');
  assert.deepEqual(tones.map(e => [e.time, e.tone, e.glide]), [[0, 'soft', 0.2], [4, 'dark', 0.2], [5, 'bright', 2]]);
  assert.ok(plan.events.every((e, i, a) => !i || a[i - 1].time <= e.time));
});

test('planScore rejects unknown or out-of-order shots', () => {
  assert.throws(() => planScore({ cues: [{ id: 'x', shots: ['zz'], beats: 4, tone: 'soft', voices: [] }] }, TL), /no shot zz/);
  assert.throws(() => planScore({ cues: [{ id: 'x', shots: ['a', 'c'], beats: 4, tone: 'soft', voices: [] }] }, TL), /not consecutive/);
});

test('eventsBetween takes a half-open window and wraps across the loop', () => {
  const plan = planScore(SCORE, TL);
  const at = (t0, t1) => eventsBetween(plan, t0, t1).filter(e => e.kind === 'note').map(e => e.time);
  assert.deepEqual(at(0, 2), [0]);
  assert.deepEqual(at(2, 4.5), [2, 4, 4]);
  assert.deepEqual(at(7, 10.5), [8, 10]);
  const whole = at(0, 16), pieces = [0, 1.3, 4, 7.9, 8, 12.25, 16].flatMap((t, i, a) => (i ? at(a[i - 1], t) : []));
  assert.deepEqual(pieces, whole);
  assert.equal(whole.length, 10);
});

test('toneAt reports the tone set last, and a glide still under way', () => {
  const plan = planScore(SCORE, TL);
  assert.deepEqual(toneAt(plan, 1), { from: 'soft', to: 'soft', remaining: 0 });
  assert.deepEqual(toneAt(plan, 4.5), { from: 'dark', to: 'dark', remaining: 0 });
  assert.deepEqual(toneAt(plan, 14), { from: 'dark', to: 'bright', remaining: 1 });
  assert.deepEqual(toneAt(plan, 7.5), { from: 'bright', to: 'bright', remaining: 0 });
});

test('slip measures the short way round the loop', () => {
  assert.ok(Math.abs(slip(5, 4.9, 66) - 0.1) < 1e-9);
  assert.ok(Math.abs(slip(0.02, 65.98, 66) - 0.04) < 1e-9);
  assert.ok(Math.abs(slip(65.98, 0.02, 66) + 0.04) < 1e-9);
  assert.equal(slip(30, 10, 66), 20);
});
