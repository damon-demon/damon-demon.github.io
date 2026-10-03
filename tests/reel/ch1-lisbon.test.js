import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { lisbon } from '../../reel/ch1/lisbon.js';

sceneContract('ch1 Lisbon', lisbon, 2);

test('Lisbon: Yimeng rides in the tram window while the street slides down the hill', () => {
  assert.equal(frameAt(lisbon, 480, 1).ctx.draws('travel:walk:1').length, 1);
  const y = (t) => frameAt(lisbon, 480, t).ctx.draws('street')[0][1];
  assert.ok(y(1.5) > y(0.5), 'the camera climbs, so the street layer moves down');
});

test('Lisbon: under the street runs a limestone retaining wall, not open cobbles', () => {
  const s = lisbon.build(480, 96), st = s.layers.street;
  const hex = (x, y) => { const k = (y * st.w + x) * 4; return '#' + [0, 1, 2].map(i => st.data[k + i].toString(16).padStart(2, '0')).join(''); };
  const WALL = new Set(['#dcd2bd', '#b3a78f', '#cfc4ad', '#2f5fa8', '#e9eef6', '#4f7fc4', '#d63c8a', '#3f7a3a', '#2a2a2e']);
  for (const x of [120, 260, 400]) assert.ok(WALL.has(hex(x, s.kerb(x) + 12)), `wall below the street at x=${x}`);
});
