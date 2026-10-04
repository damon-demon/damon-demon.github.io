import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { kusama, lightsOn } from '../../reel/ch2/kusama.js';

sceneContract('ch2 Kusama', kusama, 1.1);

test('Kusama: the lights come up out of the dark', () => {
  assert.deepEqual([lightsOn(0), lightsOn(0.5)], [0, 1]);
  assert.ok(lightsOn(0.15) > 0 && lightsOn(0.15) < 1);
  const lamps = (t) => frameAt(kusama, 480, t).ctx.calls.filter(c => c[0] === 'fillRect').length;
  assert.equal(lamps(0), 0);
  assert.ok(lamps(0.6) > 200, 'hundreds of lamps');
});

test('Kusama: Yimeng stands among the lamps, mirrored on the walkway', () => {
  const s = kusama.build(480, 96);
  assert.deepEqual(frameAt(kusama, 480, 0.6).ctx.draws('nyc:walk:1'), [[s.hx - 9, 88 - 44], [s.hx - 9, 88 - 44]]);
});
