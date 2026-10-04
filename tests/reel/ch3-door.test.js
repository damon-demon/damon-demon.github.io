import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { door, floodAt } from '../../reel/ch3/door.js';

sceneContract('ch3 door', door, 1.5);

const names = (t) => frameAt(door, 480, t).ctx.calls.filter(c => c[0] === 'drawImage').map(c => String(c[1]));

test('the door: the colour floods out from the doorway until it fills the frame', () => {
  assert.equal(floodAt(0.7, 480), 0);
  assert.ok(floodAt(1.1, 480) > 0 && floodAt(1.1, 480) < 480);
  assert.ok(floodAt(1.5, 480) > 480);
});

test('the door: Yimeng is grey outside the colour, and in full colour inside it', () => {
  const before = names(0.3), during = names(1.2);
  assert.equal(before.filter(n => n.startsWith('phd:walk:muted')).length, 1);
  assert.equal(before.filter(n => /^phd:walk:\d/.test(n)).length, 0, 'no colour yet');
  assert.equal(during.filter(n => /^phd:walk:\d/.test(n)).length, 1, 'drawn again in colour inside the flood');
  assert.ok(during.includes('oz'), 'California inside the colour');
});
