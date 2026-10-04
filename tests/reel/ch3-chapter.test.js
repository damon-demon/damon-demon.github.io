import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTER_3 } from '../../reel/ch3/index.js';

test('chapter 3 runs from the snow to the Graduation Road Trip, 13.5 s in all', () => {
  assert.equal(CHAPTER_3.name, 'Michigan');
  assert.deepEqual(CHAPTER_3.shots.map(s => s.id), ['ch3-snow', 'ch3-timelapse', 'ch3-hooding', 'ch3-roadtrip']);
  assert.deepEqual(CHAPTER_3.shots.map(s => s.caption), ['Michigan', 'Michigan', 'Michigan', 'Graduation Road Trip']);
  assert.equal(Math.round(CHAPTER_3.shots.reduce((a, s) => a + s.duration, 0) * 10) / 10, 13.5);
  assert.ok(!CHAPTER_3.shots[0].fadeIn, 'it opens on the white of the cap toss, not on black');
  assert.ok(!CHAPTER_3.shots.at(-1).fadeOut, 'and ends in full colour, straight into California');
});
