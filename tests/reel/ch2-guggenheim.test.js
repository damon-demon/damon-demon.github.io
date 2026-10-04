import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { guggenheim } from '../../reel/ch2/guggenheim.js';

sceneContract('ch2 Guggenheim', guggenheim, 1.1);

const heroAt = (t) => frameAt(guggenheim, 480, t).ctx.calls.find(c => String(c[1]).startsWith('nyc:walk'));

test('the Guggenheim: Yimeng walks up the ramp, rising as it climbs', () => {
  const a = heroAt(0.1), b = heroAt(1);
  assert.ok(b[2] > a[2], 'walking right');
  assert.ok(b[3] < a[3], 'and up');
});

test("the Guggenheim: the ramp's wall passes in front of Yimeng", () => {
  const order = frameAt(guggenheim, 480, 0.5).ctx.calls.filter(c => c[0] === 'drawImage').map(c => String(c[1]));
  assert.ok(order.indexOf('front') > order.findIndex(n => n.startsWith('nyc:walk')));
});
