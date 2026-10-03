import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { lisbon } from '../../reel/ch1/lisbon.js';

sceneContract('ch1 Lisbon', lisbon, 2);

test('Lisbon: Yimeng rides in the tram window while the street slides down the hill', () => {
  assert.equal(frameAt(lisbon, 480, 1).ctx.draws('travel:walk:1').length, 1);
  const y = (t) => frameAt(lisbon, 480, t).ctx.draws('street')[0][1];
  assert.ok(y(1.5) > y(0.5), 'the camera climbs, so the street layer moves down');
});
