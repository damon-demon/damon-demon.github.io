import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTER_2 } from '../../reel/ch2/index.js';

test('chapter 2 opens and closes at Columbia, 16.2 s in all', () => {
  assert.equal(CHAPTER_2.name, 'New York');
  assert.deepEqual(CHAPTER_2.shots.map(s => s.id), ['ch2-columbia', 'ch2-night', 'ch2-dining', 'ch2-moma', 'ch2-met', 'ch2-guggenheim', 'ch2-kusama', 'ch2-graduation']);
  assert.ok(CHAPTER_2.shots.every(s => s.caption === 'New York'));
  assert.equal(Math.round(CHAPTER_2.shots.reduce((a, s) => a + s.duration, 0) * 10) / 10, 16.2);
  assert.ok(CHAPTER_2.shots[0].fadeIn > 0, 'it fades in from the takeoff');
  assert.ok(!CHAPTER_2.shots.at(-1).fadeOut, 'and hands its white snow straight to Michigan');
});
