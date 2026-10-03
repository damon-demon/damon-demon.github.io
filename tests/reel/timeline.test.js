import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline, locate, chapterStart, liveStep, parseDebug } from '../../reel/timeline.js';

const shot = (id, duration, caption) => ({ id, duration, caption });
const CH = [
  { name: 'Sheffield', shots: [shot('a', 4, 'Sheffield'), shot('b', 4, 'Europe')] },
  { name: 'New York', shots: [shot('c', 6, 'New York')] },
  { name: 'To be continued', shots: [shot('d', 2, 'To be continued…')] },
];

test('buildTimeline lays shots end to end and records chapter spans', () => {
  const tl = buildTimeline(CH);
  assert.equal(tl.duration, 16);
  assert.deepEqual(tl.shots.map(e => [e.shot.id, e.chapter, e.start, e.end]), [['a', 0, 0, 4], ['b', 0, 4, 8], ['c', 1, 8, 14], ['d', 2, 14, 16]]);
  assert.deepEqual(tl.chapters, [{ name: 'Sheffield', start: 0, end: 8 }, { name: 'New York', start: 8, end: 14 }, { name: 'To be continued', start: 14, end: 16 }]);
});

test('locate finds the shot, its local time and chapter, and wraps around the loop', () => {
  const tl = buildTimeline(CH);
  const at = (t) => { const l = locate(tl, t); return [l.entry.shot.id, l.local, l.chapter]; };
  assert.deepEqual(at(0), ['a', 0, 0]);
  assert.deepEqual(at(5.5), ['b', 1.5, 0]);
  assert.deepEqual(at(8), ['c', 0, 1], 'a boundary belongs to the next shot');
  assert.deepEqual(at(17), ['a', 1, 0], 'past the end wraps to the start');
  assert.deepEqual(at(-1), ['d', 1, 2], 'negative time wraps from the end');
});

test('chapterStart gives the jump target for each chapter button', () => {
  const tl = buildTimeline(CH);
  assert.deepEqual([0, 1, 2].map(n => chapterStart(tl, n)), [0, 8, 14]);
});

test('liveStep maps chapters onto the four About steps, holding the last', () => {
  assert.deepEqual([0, 1, 2, 3, 4].map(c => liveStep(c, 4)), [0, 1, 2, 3, 3]);
});

test('parseDebug reads ?reel= as a time or a shot id', () => {
  assert.equal(parseDebug(''), null);
  assert.equal(parseDebug('?reel='), null);
  assert.deepEqual(parseDebug('?reel=42.5'), { time: 42.5 });
  assert.deepEqual(parseDebug('?x=1&reel=ch2-michelin'), { shot: 'ch2-michelin' });
});

test('fadeAlpha darkens the start and end of shots that ask for it', async () => {
  const { fadeAlpha } = await import('../../reel/timeline.js');
  const s = { duration: 4, fadeIn: 0.5, fadeOut: 1 };
  assert.equal(fadeAlpha(s, 0), 1);
  assert.equal(fadeAlpha(s, 0.25), 0.5);
  assert.equal(fadeAlpha(s, 2), 0);
  assert.equal(fadeAlpha(s, 3.5), 0.5);
  assert.equal(fadeAlpha({ duration: 4 }, 0), 0, 'no fade unless the shot sets one');
});
