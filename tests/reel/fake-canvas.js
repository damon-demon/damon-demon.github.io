// Test doubles for the DOM side of rendering: a recording 2D context, named fake canvases,
// and the contract every scene keeps.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Painter } from '../../reel/pixels.js';

export class Recorder {
  constructor() { this.calls = []; this.fillStyle = null; this.globalAlpha = 1; }
  drawImage(img, ...a) {
    const [dx, dy] = a.length >= 8 ? [a[4], a[5]] : [a[0], a[1]];   // 3-, 5- or 9-argument form
    this.calls.push(['drawImage', img.name, dx, dy]);
  }
  fillRect(...a) { this.calls.push(['fillRect', ...a]); }
  clearRect() {}
  save() {} restore() {} beginPath() {} rect() {} clip() {} translate() {} scale() {}
  draws(name) { return this.calls.filter(c => c[0] === 'drawImage' && c[1] === name).map(c => [c[2], c[3]]); }
}

// Turn a scene's Painter layers into fake canvases that keep their name and size.
export function fakeCanvases(scene) {
  scene.canvases = Object.fromEntries(Object.entries(scene.layers).map(([k, p]) => [k, { name: k, width: p.w, height: p.h }]));
  return scene;
}

// An env whose sprites are named "<key>:<pose>:<frame>" so tests can see what was drawn.
export function fakeEnv() {
  const sprite = (id, n, extra) => ({ canvases: Array.from({ length: n }, (_, i) => ({ name: `${id}:${i}`, width: 42, height: 50 })), ...extra });
  return {
    hero: (key, pose = 'walk') => sprite(`${key}:${pose}`, pose === 'sit' ? 2 : 4, { anchorX: 9, footY: 44, seatY: 38 }),
    dog: (key) => sprite(`dog:${key}`, 4, { anchorX: 0, footY: 15 }),
    art: (a) => ({ name: 'art', width: a.w, height: a.h }),
  };
}

// The contract every scene keeps: deterministic Painter layers at phone, desktop and wide widths,
// and a render that runs for the whole shot without throwing.

const WIDTHS = [195, 480, 640];
const sha = (d) => createHash('sha256').update(d).digest('hex');

export function sceneContract(name, scene, duration) {
  test(`${name} builds the same Painter layers every time, at every width`, () => {
    for (const W of WIDTHS) {
      const a = scene.build(W, 96), b = scene.build(W, 96);
      assert.ok(Object.keys(a.layers).length > 0);
      for (const [k, p] of Object.entries(a.layers)) {
        assert.ok(p instanceof Painter, `${k} is a Painter`);
        assert.equal(sha(p.data), sha(b.layers[k].data), `${k} is deterministic at W=${W}`);
      }
    }
  });
  test(`${name} renders through the whole shot without throwing`, () => {
    for (const W of WIDTHS) {
      const s = fakeCanvases(scene.build(W, 96)), env = fakeEnv();
      for (let t = 0; t < duration; t += 0.1) {
        const ctx = new Recorder();
        scene.render(ctx, t, s, env);
        assert.ok(ctx.calls.length > 0);
      }
    }
  });
}

// Render one frame of a scene into a Recorder.
export function frameAt(scene, W, t) {
  const s = fakeCanvases(scene.build(W, 96)), ctx = new Recorder();
  scene.render(ctx, t, s, fakeEnv());
  return { ctx, s };
}
