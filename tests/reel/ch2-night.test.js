import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { night, camAt, starsLit } from '../../reel/ch2/night.js';

sceneContract('ch2 night', night, 2.4);

const heroAt = (t) => frameAt(night, 480, t).ctx.calls.filter(c => c[0] === 'drawImage' && String(c[1]).startsWith('nyc:walk'));

test('night: it opens on the skyline and tilts down to the street', () => {
  const streetY = (t) => frameAt(night, 480, t).ctx.draws('street')[0][1];
  assert.ok(streetY(0) >= 96, 'the street starts below the frame');
  assert.ok(streetY(0.8) > 0 && streetY(0.8) < streetY(0), 'rising into view');
  assert.equal(streetY(1.4), 0, 'then in place');
});

test('night: the camera tracks Yimeng at walking pace, then eases to a stop', () => {
  assert.equal(camAt(0.5), 13);
  assert.ok(camAt(1.45) - camAt(1.4) < 0.5, 'slowing down');
  assert.equal(camAt(1.6), camAt(2.4), 'stopped');
});

test('night: three stars light up over the door, one by one', () => {
  assert.deepEqual([1.4, 1.55, 1.7, 1.9].map(starsLit), [0, 1, 2, 3]);
});

test('night: Yimeng reaches the door as the third star is lit, and goes in', () => {
  const s = night.build(480, 96), [[, , x]] = heroAt(1.95);
  assert.ok(Math.abs(x + 9 + 9 - (s.door - camAt(1.95))) <= 1, "Yimeng's middle is at the door");
  assert.equal(heroAt(2.3).length, 0, 'and has gone inside');
});
