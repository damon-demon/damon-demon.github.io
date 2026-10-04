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

test('the sit pose has two swinging frames and a seat row', () => {
  const s = heroSprite('trolltunga', 'sit');
  assert.equal(s.frames.length, 2);
  assert.equal(s.seatY, 38);
  assert.notDeepEqual(s.frames[0], s.frames[1]);
  assert.deepEqual([s.width, s.height, s.anchorX], [42, 50, 9]);
  // below the seat row only the dangling shins and shoes remain
  const below = s.frames[0].slice(s.seatY + 1).join('');
  assert.match(below, /O/, 'the shoes hang below the seat');
  assert.doesNotMatch(below, /[BbrTSsH]/, 'nothing but legs below the seat');
});

test('unknown poses fail loudly', () => {
  assert.throws(() => heroSprite('work', 'cartwheel'), /unknown pose: cartwheel/);
});

test('the cheer pose throws the cap: two bouncing frames, bareheaded', () => {
  const cheer = heroSprite('columbia', 'cheer'), worn = heroSprite('columbia');
  const capPixels = (f) => f.join('').replace(/[^Jj]/g, '').length;          // the mortarboard's colours
  assert.equal(cheer.frames.length, 2);
  assert.ok(capPixels(worn.frames[1]) > 20, 'the walking gown wears the mortarboard');
  assert.deepEqual(cheer.frames.map(capPixels), [0, 0]);
  assert.notDeepEqual(cheer.frames[0], cheer.frames[1]);
  assert.deepEqual([cheer.width, cheer.height, cheer.anchorX, cheer.footY], [42, 50, 9, 44]);
});

test('the type and curl poses: two frames each, and hands where props are held', () => {
  const type = heroSprite('lab', 'type'), curl = heroSprite('gym5', 'curl');
  assert.deepEqual([type.frames.length, curl.frames.length], [2, 2]);
  assert.notDeepEqual(curl.frames[0], curl.frames[1]);
  assert.deepEqual(curl.hands, [[16, 33], [19, 29]], 'the dumbbell comes up from the hip to the chest');
  assert.ok(type.hands.every(([, y]) => y < type.seatY), 'hands on the desk, above the lap');
  assert.equal(heroSprite('work').hands.length, 4, 'every pose reports its hands');
});
