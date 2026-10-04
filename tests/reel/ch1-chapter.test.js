import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTER_1 } from '../../reel/ch1/index.js';

test('chapter 1 runs Sheffield, then six Europe shots, 16.5 s in all', () => {
  assert.equal(CHAPTER_1.name, 'Sheffield');
  assert.deepEqual(CHAPTER_1.shots.map(s => s.id), ['ch1-sheffield', 'ch1-train', 'ch1-lisbon', 'ch1-ring', 'ch1-trolltunga', 'ch1-iceland', 'ch1-takeoff']);
  assert.deepEqual(CHAPTER_1.shots.map(s => s.caption), ['Sheffield', 'Europe', 'Europe', 'Europe', 'Europe', 'Europe', 'Europe']);
  assert.equal(CHAPTER_1.shots.reduce((a, s) => a + s.duration, 0), 16.5);
  assert.ok(CHAPTER_1.shots[0].fadeIn > 0, 'the loop fades in');
  assert.ok(CHAPTER_1.shots.at(-1).fadeOut > 0, 'the chapter fades out');
});
