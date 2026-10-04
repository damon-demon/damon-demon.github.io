import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { tide, burrowAt } from '../../reel/ch4/tide.js';

sceneContract('ch4 tide', tide, 1.9);

test('tide: after the urchin, the burrow: sand spurting, the worm out, then into the bucket', () => {
  assert.deepEqual([0.5, 0.9, 1.3, 1.7].map(burrowAt), ['still', 'digging', 'worm', 'gone']);
});

test('tide: the dog faces the burrow, and jumps back when the worm comes out', () => {
  const dog = (t) => frameAt(tide, 480, t).ctx.calls.find(c => c[0] === 'drawImage' && /^dog:lifevest:wait:\d$/.test(c[1]));
  const [, , x0, y0] = dog(1), [, , x1, y1] = dog(1.37), [, , x2] = dog(1.7);
  assert.ok(y1 < y0, 'it jumps');
  assert.ok(x2 > x0, 'and backs off');
});
