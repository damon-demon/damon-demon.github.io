import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTER_4 } from '../../reel/ch4/index.js';

test('chapter 4 so far: the arrival, the office and the ranch, 6.4 s', () => {
  assert.equal(CHAPTER_4.name, 'California');
  assert.deepEqual(CHAPTER_4.shots.map(s => s.id), ['ch4-arrive', 'ch4-office', 'ch4-ranch']);
  assert.ok(CHAPTER_4.shots.every(s => s.caption === 'California'));
  assert.equal(Math.round(CHAPTER_4.shots.reduce((a, s) => a + s.duration, 0) * 10) / 10, 6.4);
  assert.ok(!CHAPTER_4.shots[0].fadeIn, 'it opens straight from the map, in full colour');
  assert.ok(!CHAPTER_4.shots.at(-1).fadeOut, 'and the scope hard-cuts away');
});
