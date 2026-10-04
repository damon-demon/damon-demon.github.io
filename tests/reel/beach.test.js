import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildBeach, renderBeach } from '../../reel/beach.js';

const golden = JSON.parse(readFileSync(new URL('./fixtures/beach-golden.json', import.meta.url)));
const sha = (d) => createHash('sha256').update(d).digest('hex');

for (const W of Object.keys(golden)) {
  test(`beach at native width ${W} matches the approved mockup`, () => {
    const s = buildBeach(Number(W));
    const g = golden[W];
    for (const k of ['horizon', 'shore', 'walkTop', 'feet', 'TW']) assert.equal(s[k], g[k], k);
    assert.deepEqual(Object.keys(s.layers).sort(), Object.keys(g.layers).sort());
    for (const [name, p] of Object.entries(s.layers)) {
      assert.deepEqual({ w: p.w, h: p.h, sha256: sha(p.data) }, g.layers[name], name);
    }
    assert.deepEqual(s.glitter, g.glitter);
  });
}

// A canvas stand-in that records what gets drawn where.
function recorder() {
  const calls = [];
  return {
    calls,
    clearRect: () => {}, fillRect: (...a) => calls.push(['fillRect', ...a]),
    drawImage: (img, x, y) => calls.push(['drawImage', img.name, x, y]),
    set fillStyle(v) { calls.push(['fillStyle', v]); },
  };
}

test('render scrolls each layer by its parallax and walks both characters', () => {
  const s = buildBeach(480);
  s.canvases = Object.fromEntries(Object.entries(s.layers).map(([k, p]) => [k, { name: k, width: p.w }]));
  const frames = (who, n) => ({ canvases: Array.from({ length: 4 }, (_, i) => ({ name: `${who}${i}` })), anchorX: n.anchorX, footY: n.footY });
  const env = { hero: () => frames('hero', { anchorX: 9, footY: 44 }), dog: () => frames('dog', { anchorX: 0, footY: 15 }) };
  const ctx = recorder();
  renderBeach(ctx, 2, s, env);
  const draws = ctx.calls.filter(c => c[0] === 'drawImage');
  const at = (name) => draws.filter(d => d[1] === name).map(d => [d[2], d[3]]);
  assert.deepEqual(at('sky'), [[0, 0]]);
  assert.deepEqual(at('clouds'), [[-3, 0], [957, 0]]);           // 2 s * 26 px/s * 0.06 = 3.12 -> 3
  assert.deepEqual(at('walk'), [[-52, 0], [908, 0]]);            // parallax 1
  assert.deepEqual(at('ocean'), [[-13, 57], [947, 57]]);         // 13 px, drawn just under the horizon
  assert.deepEqual(at('hero0'), [[163 - 9, 88 - 44]]);           // frame floor(2*6)%4 = 0 at 34% of 480
  assert.deepEqual(at('dog2'), [[163 + 28, 88 - 15]]);           // frame floor(2*9)%4 = 2, 28 px ahead
  assert.equal(draws.at(-1)[1], 'fg', 'the ice plant is drawn last, in front of the characters');
});
