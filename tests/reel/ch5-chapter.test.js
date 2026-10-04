import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTER_5 } from '../../reel/ch5/index.js';

test('chapter 5 is the pencil sketch, 4 s, fading in from the sunset and out to the loop', () => {
  assert.equal(CHAPTER_5.name, 'To be continued');
  assert.deepEqual(CHAPTER_5.shots.map(s => [s.id, s.caption, s.duration]), [['ch5-sketch', 'To be continued…', 4]]);
  assert.ok(CHAPTER_5.shots[0].fadeIn > 0 && CHAPTER_5.shots[0].fadeOut > 0);
});
