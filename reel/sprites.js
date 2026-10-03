// DOM side of the pixel pipeline: text grids and Painters become canvases.
import { hexToRgb } from './pixels.js';

export function gridCanvas(rows, palette) {
  const h = rows.length, w = rows[0].length;
  const img = new ImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = rows[y][x];
    if (ch === '.') continue;
    const [r, g, b] = hexToRgb(palette[ch]), k = (y * w + x) * 4;
    img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = b; img.data[k + 3] = 255;
  }
  return imageCanvas(img);
}

export function painterCanvas(p) {
  return imageCanvas(new ImageData(p.data, p.w, p.h));
}

function imageCanvas(img) {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  c.getContext('2d').putImageData(img, 0, 0);
  return c;
}

// A sprite ({ frames, palette, ...placement such as anchorX, footY, seatY }) as canvases.
export function spriteCanvases(sprite) {
  const { frames, palette, ...placement } = sprite;
  return { ...placement, canvases: frames.map(f => gridCanvas(f, palette)) };
}
