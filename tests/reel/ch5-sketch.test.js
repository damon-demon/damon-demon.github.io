import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { Painter } from '../../reel/pixels.js';
import { sketch, frontierAt, pencilLayer } from '../../reel/ch5/sketch.js';

sceneContract('ch5 sketch', sketch, 4);

test('sketch: every beach layer has a pencil twin, the same size', () => {
  const s = sketch.build(480, 96);
  for (const k of ['sky', 'clouds', 'head', 'ocean', 'beach', 'walk', 'fg']) {
    assert.deepEqual([s.layers[`pencil_${k}`].w, s.layers[`pencil_${k}`].h], [s.layers[k].w, s.layers[k].h], k);
  }
});

test('pencilLayer: a line where a shape ends, paper inside it, nothing where it is empty', () => {
  const src = new Painter(8, 8);
  for (let y = 2; y < 6; y++) for (let x = 2; x < 6; x++) src.px(x, y, '#3a76b8');
  const p = pencilLayer(src), at = (x, y) => [...p.data.slice((y * 8 + x) * 4, (y * 8 + x) * 4 + 4)];
  assert.ok(at(2, 2)[0] < 150, 'a graphite edge');
  assert.equal(at(0, 0)[3], 0, 'still empty outside');
  assert.ok(at(3, 3)[0] > at(2, 2)[0], 'paler inside than on the edge');
});

test('sketch: the frontier comes along the boardwalk at walking pace, and Yimeng and the dog cross it', () => {
  const s = sketch.build(480, 96);
  assert.equal(frontierAt(s, 0, 10) - frontierAt(s, 1, 10), 26);
  assert.ok(frontierAt(s, 0, 60) > s.hx + 52, 'it starts ahead of the dog');
  assert.ok(frontierAt(s, 4, 60) < s.hx, 'and ends behind Yimeng');
});

test('sketch: the world is drawn twice, in colour and in pencil, the cast in both tones', () => {
  const names = frameAt(sketch, 480, 2).ctx.calls.filter(c => c[0] === 'drawImage').map(c => c[1]);
  for (const n of ['sky', 'walk', 'pencil_sky', 'pencil_walk']) assert.ok(names.includes(n), n);
  assert.ok(names.some(n => /^work:walk:\d$/.test(n)) && names.some(n => /^work:walk:sketch:\d$/.test(n)));
  assert.ok(names.some(n => /^dog:houndstooth:\d$/.test(n)) && names.some(n => /^dog:houndstooth:sketch:\d$/.test(n)));
});
