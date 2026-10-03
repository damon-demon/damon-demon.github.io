import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRows, Grid, line, recolor, rng, hexToRgb, resolve, Painter, bandColor } from '../../reel/pixels.js';

test('parseRows trims surrounding newlines and pads rows to equal width', () => {
  assert.deepEqual(parseRows('\nab\nc\n'), ['ab', 'c.']);
  assert.deepEqual(parseRows(['x', 'yz']), ['x', 'yz'], 'row arrays pass through untouched');
});

test('Grid ignores writes outside and reads them as transparent', () => {
  const g = new Grid(2, 2);
  g.set(5, 5, 'A');
  assert.equal(g.get(5, 5), '.');
  g.set(1, 0, 'A');
  assert.deepEqual(g.rows(), ['.A', '..']);
});

test('stamp draws the part and, with outline, a 4-neighbour ring over transparent pixels', () => {
  const g = new Grid(3, 3);
  g.stamp('A', 1, 1, { outline: 'k' });
  assert.deepEqual(g.rows(), ['.k.', 'kAk', '.k.']);
});

test('stamp outline modes: over replaces anything, opaqueOnly only touches drawn pixels', () => {
  const over = new Grid(3, 1); over.stamp('BBB', 0, 0); over.stamp('A', 1, 0, { outline: 'k', over: true });
  assert.deepEqual(over.rows(), ['kAk']);
  const opaque = new Grid(3, 1); opaque.stamp('B', 0, 0); opaque.stamp('A', 1, 0, { outline: 'k', opaqueOnly: true });
  assert.deepEqual(opaque.rows(), ['kA.']);
});

test('outlineAll rings the silhouette but never outlines an outline', () => {
  const g = new Grid(5, 1);
  g.set(2, 0, 'A');
  g.outlineAll('k');
  assert.deepEqual(g.rows(), ['.kAk.']);
  g.outlineAll('k');
  assert.deepEqual(g.rows(), ['.kAk.'], 'running it twice adds nothing');
});

test('line walks Bresenham steps, supports per-step colours and widths', () => {
  const g = new Grid(4, 3);
  const pts = line(g, 0, 0, 3, 2, (i) => String(i));
  assert.deepEqual(pts, [[0, 0], [1, 1], [2, 1], [3, 2]]);
  assert.deepEqual(g.rows(), ['0...', '.12.', '...3']);
  const w = new Grid(3, 1); line(w, 0, 0, 0, 0, 'x', 2);
  assert.deepEqual(w.rows(), ['xx.']);
});

test('recolor only swaps characters inside the row range', () => {
  assert.deepEqual(recolor('PP\nPP\nPP', { P: 'S' }, 1, 2), ['PP', 'SS', 'PP']);
});

test('rng is deterministic per seed and stays in [0, 1)', () => {
  const a = rng(7), b = rng(7);
  const xs = Array.from({ length: 50 }, () => a());
  assert.deepEqual(xs, Array.from({ length: 50 }, () => b()));
  assert.ok(xs.every(x => x >= 0 && x < 1));
});

test('hexToRgb and resolve turn palette characters into colours', () => {
  assert.deepEqual(hexToRgb('#d9a35b'), [217, 163, 91]);
  assert.deepEqual(resolve(['a.'], { a: '#000000' }), [['#000000', '.']]);
});

test('Painter writes opaque RGBA, rounds coordinates and wraps with wpx', () => {
  const p = new Painter(3, 1);
  p.px(0.4, 0, '#ff0000');
  p.wpx(-1, 0, '#00ff00');
  assert.deepEqual([...p.data], [255, 0, 0, 255, 0, 0, 0, 0, 0, 255, 0, 255]);
});

test('bandColor picks the band and dithers just above the next boundary', () => {
  const stops = [['#000000', 0], ['#ffffff', 0.5]];
  assert.equal(bandColor(stops, 0.1, 0, 1), '#000000');
  assert.equal(bandColor(stops, 0.45, 0, 0), '#ffffff', 'even pixel near the boundary takes the next band');
  assert.equal(bandColor(stops, 0.45, 0, 1), '#000000', 'odd pixel keeps the current band');
  assert.equal(bandColor(stops, 0.7, 0, 0), '#ffffff');
});

test('textRows draws 3x5 glyphs with 1px gaps, upper-casing input', async () => {
  const { textRows } = await import('../../reel/pixels.js');
  assert.deepEqual(textRows('i1'), ['###..#.', '.#..##.', '.#...#.', '.#...#.', '###.###']);
  assert.deepEqual(textRows('?'), ['...', '...', '...', '...', '...'], 'unknown characters are blank');
});

test('textRows has an Ü for NÜRBURGRING', async () => {
  const { textRows } = await import('../../reel/pixels.js');
  assert.deepEqual(textRows('Ü'), ['#.#', '...', '#.#', '#.#', '###']);
});
