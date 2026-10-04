import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTER_4 } from '../../reel/ch4/index.js';

test('chapter 4 runs from the arrival to the sunset, 16.9 s', () => {
  assert.equal(CHAPTER_4.name, 'California');
  assert.deepEqual(CHAPTER_4.shots.map(s => s.id), ['ch4-arrive', 'ch4-office', 'ch4-ranch', 'ch4-forest', 'ch4-fishing', 'ch4-tide', 'ch4-scuba', 'ch4-freedive', 'ch4-sunset']);
  assert.ok(CHAPTER_4.shots.every(s => s.caption === 'California'));
  assert.equal(Math.round(CHAPTER_4.shots.reduce((a, s) => a + s.duration, 0) * 10) / 10, 16.9);
  const shot = Object.fromEntries(CHAPTER_4.shots.map(s => [s.id, s]));
  assert.ok(!shot['ch4-arrive'].fadeIn, 'it opens straight from the map, in full colour');
  assert.ok(!shot['ch4-ranch'].fadeOut && !shot['ch4-forest'].fadeIn, 'the scope hard-cuts away');
  assert.ok(!shot['ch4-freedive'].fadeOut && !shot['ch4-sunset'].fadeIn, 'and so does the spear');
  assert.ok(shot['ch4-sunset'].fadeOut > 0, 'the sunset fades out');
});
