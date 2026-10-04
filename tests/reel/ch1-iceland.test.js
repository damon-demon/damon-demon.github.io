import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { iceland, takeoff } from '../../reel/ch1/iceland.js';

sceneContract('ch1 Iceland', iceland, 2);
sceneContract('ch1 takeoff', takeoff, 1);

test('Iceland: walks in, then stands still under the aurora', () => {
  assert.deepEqual(frameAt(iceland, 480, 1.5).ctx.draws('iceland:walk:1'), [[163 - 9, 90 - 44]]);
});

test('the takeoff climbs out to the top right', () => {
  const at = (t) => frameAt(takeoff, 480, t).ctx.draws('plane')[0];
  assert.ok(at(0.9)[0] > at(0.1)[0], 'moves right');
  assert.ok(at(0.9)[1] < at(0.1)[1], 'climbs');
});

test('Iceland: Vestrahorn, the "Batman Mountain": two ears in the middle are its highest peaks, a notch between them', () => {
  const m = iceland.build(480, 96).layers.mtn, top = (x) => { let y = 0; while (y < 96 && !m.data[(y * 480 + x) * 4 + 3]) y++; return y; };
  const highest = (a, b) => Math.min(...Array.from({ length: Math.round((b - a) * 480) + 1 }, (_, i) => top(Math.round(a * 480) + i)));
  const left = highest(0.452, 0.472), right = highest(0.495, 0.512), notch = highest(0.478, 0.486);
  assert.ok(right <= left, 'the right ear is the summit');
  assert.ok(left < Math.min(highest(0, 0.44), highest(0.53, 0.999)), 'the ears stand above the wings');
  assert.ok(notch - left >= 6, 'with a deep notch between them');
});
