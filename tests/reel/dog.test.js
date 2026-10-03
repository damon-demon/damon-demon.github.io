import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dogSprite, DOG_KEYS } from '../../reel/dog.js';
import { resolve } from '../../reel/pixels.js';

const golden = JSON.parse(readFileSync(new URL('./fixtures/cast-golden.json', import.meta.url))).dog;

test('the dog has the puppy plus the 7 adult outfits', () => {
  assert.deepEqual([...DOG_KEYS].sort(), Object.keys(golden).sort());
});

for (const key of Object.keys(golden)) {
  test(`dog ${key} matches the approved mockup pixel for pixel`, () => {
    const s = dogSprite(key);
    assert.equal(s.frames.length, 4);
    s.frames.forEach((f, i) => {
      assert.deepEqual(resolve(f, s.palette), resolve(golden[key].frames[i], golden[key].palette), `frame ${i}`);
    });
  });
}

test('adult and puppy report their size and foot row', () => {
  assert.deepEqual([dogSprite('houndstooth').width, dogSprite('houndstooth').height, dogSprite('houndstooth').footY], [24, 17, 15]);
  assert.deepEqual([dogSprite('pup').width, dogSprite('pup').height, dogSprite('pup').footY], [19, 14, 12]);
});

test('unknown dog outfits fail loudly', () => {
  assert.throws(() => dogSprite('tutu'), /unknown dog outfit: tutu/);
});
