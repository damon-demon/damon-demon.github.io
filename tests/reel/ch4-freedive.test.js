import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract } from './fake-canvas.js';
import { heroSprite } from '../../reel/hero.js';
import { freedive, diverAt, spearAt, tipAt, sheepheadAt, FIRE } from '../../reel/ch4/freedive.js';

sceneContract('ch4 freedive', freedive, 1.5);

test('freedive: from a breath at the surface, down through the kelp, level over the reef', () => {
  const s = freedive.build(480, 96);
  assert.ok(diverAt(s, 0.1).y <= 14, 'at the surface');
  assert.ok(diverAt(s, 0.5).y > 20 && diverAt(s, 0.5).y < 60, 'diving');
  assert.equal(diverAt(s, 1).y, 62);
});

test('freedive: the spear stays in the gun until Yimeng fires, and the scene cuts before it reaches the fish', () => {
  assert.equal(spearAt(FIRE - 0.01), 0);
  assert.ok(spearAt(FIRE + 0.1) > 0);
  const swimmer = heroSprite('freedive', 'swim');
  for (const W of [195, 480, 640]) {
    const s = freedive.build(W, 96);
    assert.ok(tipAt(s, 1.5, swimmer) < sheepheadAt(s, 1.5), `W=${W}`);
  }
});
