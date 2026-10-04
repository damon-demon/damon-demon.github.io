import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneContract, frameAt } from './fake-canvas.js';
import { scuba } from '../../reel/ch4/scuba.js';

sceneContract('ch4 scuba', scuba, 1.4);

const names = (t) => frameAt(scuba, 480, t).ctx.calls.filter(c => c[0] === 'drawImage').map(c => c[1]);

test('scuba: Yimeng swims through the kelp in the scuba gear, kicking', () => {
  const a = names(0.1).filter(n => n.startsWith('scuba:swim:')), b = names(0.3).filter(n => n.startsWith('scuba:swim:'));
  assert.equal(a.length, 1);
  assert.notEqual(a[0], b[0], 'the fins kick');
});

test('scuba: kelp at three depths, the near stalks passing in front of Yimeng', () => {
  const n = names(0.7), hero = n.findIndex(x => x.startsWith('scuba:swim:'));
  assert.ok(n.indexOf('far') < hero && n.indexOf('mid') < hero && n.indexOf('near') > hero);
});
