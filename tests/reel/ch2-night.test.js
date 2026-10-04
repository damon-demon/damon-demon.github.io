import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { night, camAt } from '../../reel/ch2/night.js';

sceneContract('ch2 night', night, 2);

const heroAt = (t) => frameAt(night, 480, t).ctx.calls.filter(c => c[0] === 'drawImage' && String(c[1]).startsWith('nyc:walk'));

test('night: it opens on the skyline and tilts down to the street', () => {
  const streetY = (t) => frameAt(night, 480, t).ctx.draws('street')[0][1];
  assert.ok(streetY(0) >= 96, 'the street starts below the frame');
  assert.ok(streetY(0.7) > 0 && streetY(0.7) < streetY(0), 'rising into view');
  assert.equal(streetY(1.1), 0, 'then in place');
});

test('night: the camera tracks Yimeng at walking pace, then eases to a stop', () => {
  assert.equal(camAt(0.5), 13);
  assert.ok(camAt(1.25) - camAt(1.2) < 0.5, 'slowing down');
  assert.equal(camAt(1.3), camAt(2), 'stopped');
});

test('night: Yimeng walks up to the door and steps inside', () => {
  const s = night.build(480, 96), [[, , x]] = heroAt(1.55);
  assert.ok(Math.abs(x + 9 + 9 - (s.door - camAt(1.55))) <= 1, "Yimeng's middle is at the door");
  assert.equal(heroAt(1.9).length, 0, 'and has gone inside');
});

test('night: no stars over the door, only its light', () => {
  assert.equal(frameAt(night, 480, 1.8).ctx.draws('art').length, 0);
});
