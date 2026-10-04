import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, POSTER } from '../../reel/story.js';
import { buildTimeline } from '../../reel/timeline.js';
import { beach } from '../../reel/beach.js';

test('the reel: five chapters, 67.1 s, every shot built and named once', () => {
  const tl = buildTimeline(CHAPTERS), ids = tl.shots.map(e => e.shot.id);
  assert.deepEqual(CHAPTERS.map(c => c.name), ['Sheffield', 'New York', 'Michigan', 'California', 'To be continued']);
  assert.equal(Math.round(tl.duration * 10) / 10, 67.1);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(tl.shots.every(e => e.shot.scene !== beach), 'no stand-ins left');
});

test('the loop closes: the last shot fades out and Sheffield fades in', () => {
  assert.ok(CHAPTERS.at(-1).shots.at(-1).fadeOut > 0);
  assert.ok(CHAPTERS[0].shots[0].fadeIn > 0);
});

test('the reduced-motion poster is the beach scene, in chapter 4', () => {
  assert.equal(POSTER.scene, beach);
  assert.equal(POSTER.chapter, 3);
});
