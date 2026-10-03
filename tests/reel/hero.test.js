import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { heroSprite, OUTFIT_KEYS, FOOT_Y, ANCHOR_X } from '../../reel/hero.js';
import { resolve } from '../../reel/pixels.js';

const golden = JSON.parse(readFileSync(new URL('./fixtures/cast-golden.json', import.meta.url))).hero;

test('the wardrobe has exactly the 19 approved outfits', () => {
  assert.deepEqual([...OUTFIT_KEYS].sort(), Object.keys(golden).sort());
});

for (const key of Object.keys(golden)) {
  test(`outfit ${key} matches the approved mockup pixel for pixel`, () => {
    const s = heroSprite(key);
    assert.equal(s.frames.length, 4);
    s.frames.forEach((f, i) => {
      assert.deepEqual(resolve(f, s.palette), resolve(golden[key].frames[i], golden[key].palette), `frame ${i}`);
    });
  });
}

test('sprites report where the character stands', () => {
  const s = heroSprite('work');
  assert.equal(s.width, 42); assert.equal(s.height, 50);
  assert.equal(s.anchorX, ANCHOR_X); assert.equal(s.footY, FOOT_Y);
  // the lowest opaque row of a walk frame is the shoe outline, one below the foot row
  const lowest = Math.max(...s.frames[1].map((r, y) => (/[^.]/.test(r) ? y : -1)));
  assert.equal(lowest, FOOT_Y);
});

test('unknown outfits fail loudly', () => {
  assert.throws(() => heroSprite('tuxedo'), /unknown outfit: tuxedo/);
});
