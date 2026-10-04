import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { graduation, capPath } from '../../reel/ch2/graduation.js';

sceneContract('ch2 graduation', graduation, 2.8);

test('graduation: the class stands on the steps, leaving Alma Mater in view', () => {
  const s = graduation.build(480, 96);
  assert.ok(s.crowd.length >= 10);
  assert.ok(s.crowd.every(g => Math.abs(g.x + 4 - s.cx) >= 13));
});

test('graduation: Yimeng throws the cap and goes on bareheaded', () => {
  assert.equal(frameAt(graduation, 480, 0.3).ctx.draws('columbia:walk:1').length, 1);
  const after = frameAt(graduation, 480, 1.2).ctx;
  assert.equal(after.draws('columbia:walk:1').length, 0);
  assert.equal(after.draws('columbia:cheer:0').length + after.draws('columbia:cheer:1').length, 1);
});

test("graduation: Yimeng's cap flies up and comes down on the puppy's head", () => {
  const s = graduation.build(480, 96);
  assert.equal(capPath(s, 0.5, 12), null, 'still worn before the toss');
  assert.ok(capPath(s, 1.1, 12).y < 30, 'high in the air');
  assert.deepEqual(capPath(s, 2.5, 12), { x: s.dogStop + 4, y: 90 - 12 - 2, landed: true });
});

test('graduation: the puppy trots in and stays by Yimeng', () => {
  const s = graduation.build(480, 96);
  const dogX = (t) => frameAt(graduation, 480, t).ctx.calls.find(c => String(c[1]).startsWith('dog:pup'))[2];
  assert.ok(dogX(0.5) < dogX(1.2), 'trotting right');
  assert.deepEqual(frameAt(graduation, 480, 2.4).ctx.draws('dog:pup:0'), [[s.dogStop, 90 - 15]]);
});
