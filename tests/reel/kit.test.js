import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tile, gradient, art, label, ridge, drawHero } from '../../reel/kit.js';
import { Recorder } from './fake-canvas.js';

test('tile draws a wrapped layer twice so it always covers the view', () => {
  const img = { name: 'L', width: 100 };
  const a = new Recorder();
  tile(a, img, 130, 5);
  assert.deepEqual(a.draws('L'), [[-30, 5], [70, 5]]);
  const b = new Recorder();
  tile(b, img, -10);
  assert.deepEqual(b.draws('L'), [[-90, 0], [10, 0]], 'negative offsets wrap too');
});

test('gradient paints every pixel opaque, top band first', () => {
  const p = gradient(4, 10, [['#000000', 0], ['#ffffff', 0.5]]);
  assert.equal(p.w, 4); assert.equal(p.h, 10);
  assert.ok([...p.data].filter((_, i) => i % 4 === 3).every(a => a === 255));
  assert.deepEqual([...p.data.slice(0, 3)], [0, 0, 0]);
});

test('art adds a generated outline ring and its colour', () => {
  const a = art('A', { A: '#111111' }, '#222222');
  assert.deepEqual(a.rows, ['.k.', 'kAk', '.k.']);
  assert.equal(a.palette.k, '#222222');
  assert.deepEqual([a.w, a.h], [3, 3]);
});

test('label renders 3x5 text in one ink', () => {
  const l = label('HI', '#ffffff');
  assert.equal(l.h, 5); assert.equal(l.w, 7);
  assert.equal(l.palette['#'], '#ffffff');
});

test('ridge is seamless across its tile width', () => {
  const r = ridge(200, 10, [[3, 2, 0.4], [1, 5, 1.1]]);
  assert.equal(r.length, 200);
  assert.ok(Math.abs(r[0] - (10 + 3 * Math.sin(0.4) + Math.sin(1.1))) < 1e-9);
  const next = 10 + 3 * Math.sin(2 * Math.PI * 2 + 0.4) + Math.sin(2 * Math.PI * 5 + 1.1);   // x = 200 wraps to x = 0
  assert.ok(Math.abs(next - r[0]) < 1e-9);
});

test('drawHero places the character by its left edge and ground row', () => {
  const ctx = new Recorder();
  drawHero(ctx, { canvases: [{ name: 'f0' }, { name: 'f1' }], anchorX: 9, footY: 44 }, 3, 100.4, 88);
  assert.deepEqual(ctx.draws('f1'), [[91, 44]]);
});
