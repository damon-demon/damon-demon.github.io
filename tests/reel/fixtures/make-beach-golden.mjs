// Freeze the approved beach scene (mockup scene.js) as per-layer SHA-256 hashes.
// Needs the local, gitignored mockups in .superpowers/pixel-mock/. Run from the repo root:
//   node tests/reel/fixtures/make-beach-golden.mjs .superpowers/pixel-mock/scene.js tests/reel/fixtures/beach-golden.json
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const src = readFileSync(process.argv[2], 'utf8')
  .replace('window.PixelMock = { makeBanner, zoomSheet };', 'window.PixelMock = { makeBanner, zoomSheet, buildScene };');
function fakeCanvas() {
  const cv = { width: 0, height: 0 };
  cv.getContext = () => ({
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    putImageData(img) { cv.img = img; },
  });
  return cv;
}
const ctx = { window: {}, document: { createElement: fakeCanvas }, Math };
vm.runInNewContext(src, ctx);
const sha = (d) => createHash('sha256').update(d).digest('hex');
const out = {};
for (const W of [195, 480, 640]) {
  const s = ctx.window.PixelMock.buildScene(1, W, 96);
  const layers = {};
  for (const [k, cv] of Object.entries(s.L)) layers[k] = { w: cv.img.width, h: cv.img.height, sha256: sha(cv.img.data) };
  out[W] = { horizon: s.horizon, shore: s.shore, walkTop: s.walkTop, feet: s.feet, TW: s.TW, layers, glitter: s.glit };
}
writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
console.log('wrote', process.argv[3], Object.keys(out));
