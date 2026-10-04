import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { dining, heroAt, camAt, billAt, seatX, roomX } from '../../reel/ch2/dining.js';

sceneContract('ch2 dining', dining, 5.2);

const AT_TABLE = [0.4, 1.65, 2.9, 4.15];       // a moment at each of the four tables

test('dining: Yimeng eats in four restaurants, left to right', () => {
  const seated = AT_TABLE.map(heroAt);
  assert.deepEqual(seated.map(h => [h.room, h.seated]), [[0, true], [1, true], [2, true], [3, true]]);
  assert.ok(seated.every((h, k) => k === 0 || h.x > seated[k - 1].x), 'each one further right');
  assert.equal(heroAt(1).seated, false, 'running between tables');
});

test('dining: the whole row fits a desktop; on a phone the camera follows Yimeng', () => {
  assert.equal(camAt(0, 480), camAt(4, 480), 'held still on desktop');
  const phone = AT_TABLE.map(t => camAt(t, 195));
  assert.ok(phone.every((c, k) => k === 0 || c > phone[k - 1]), 'panning right on a phone');
  assert.equal(seatX(2) - camAt(2.9, 195), Math.round(195 * 0.34), 'with Yimeng a third of the way in');
});

test('dining: Yimeng sits behind each table, and runs in front of them', () => {
  const cam = camAt(0, 480);
  assert.deepEqual(frameAt(dining, 480, 0.4).ctx.draws('michelin:sit:1'), [[seatX(0) - cam - 9, 84 - 1 - 38]]);
  const run = frameAt(dining, 480, 1).ctx.calls.filter(c => c[0] === 'drawImage').map(c => String(c[1]));
  assert.ok(run.findIndex(n => n.startsWith('michelin:walk')) > run.indexOf('front'));
});

test('dining: after the last course the bill runs back under every restaurant', () => {
  assert.deepEqual(billAt(4.5), { drop: 0, run: 0 });
  const end = billAt(5.2);
  assert.equal(end.drop, 90 - 76, 'down the tablecloth to the floor');
  assert.ok(end.run > roomX(3) - roomX(0), 'then back past the first restaurant');
});
