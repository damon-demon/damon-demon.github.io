import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { hooding, hoodAt } from '../../reel/ch3/hooding.js';

sceneContract('ch3 hooding', hooding, 2);

test("hooding: the advisor lifts the hood over Yimeng's head and onto the shoulders", () => {
  const s = hooding.build(480, 96), held = hoodAt(s, 0.2), over = hoodAt(s, 0.68), worn = hoodAt(s, 1.2);
  assert.equal(held.worn, false);
  assert.ok(held.x > s.hx + 15, "held up on the advisor's side");
  assert.ok(over.y < held.y, 'lifted over the head');
  assert.equal(worn.worn, true);
});

test('hooding: Yimeng stands in the doctoral gown, greyed like the rest of Michigan', () => {
  const s = hooding.build(480, 96);
  assert.deepEqual(frameAt(hooding, 480, 1.5).ctx.draws('phd:walk:muted:1'), [[s.hx - 9, 82 - 44]]);
});
