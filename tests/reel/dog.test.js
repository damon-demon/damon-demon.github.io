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

test('the dog sleeps: two breathing frames, lying lower than it stands', () => {
  const top = (f) => f.findIndex(r => /[^.]/.test(r)), bottom = (f) => Math.max(...f.map((r, y) => (/[^.]/.test(r) ? y : -1)));
  for (const key of ['pup', 'msu_knit', 'bandana', 'bare']) {
    const s = dogSprite(key, 'sleep');
    assert.equal(s.frames.length, 2);
    assert.notDeepEqual(s.frames[0], s.frames[1], `${key} breathes`);
    assert.ok(top(s.frames[0]) > top(dogSprite(key).frames[0]), `${key} lies down`);
    assert.ok(bottom(s.frames[0]) <= s.footY + 1, `${key} rests on the floor`);
  }
  assert.throws(() => dogSprite('bare', 'beg'), /unknown dog pose: beg/);
});

test('the dog waits: standing still on two frames, only the tail wagging', () => {
  for (const key of ['lifevest', 'hikepack', 'pup']) {
    const wait = dogSprite(key, 'wait');
    assert.equal(wait.frames.length, 2);
    assert.notDeepEqual(wait.frames[0], wait.frames[1], `${key} wags`);
    assert.ok(wait.frames[0].every((r, y) => r.slice(4) === wait.frames[1][y].slice(4)), `${key} holds still but for the tail`);
  }
});
