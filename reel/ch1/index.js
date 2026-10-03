// Chapter 1: Sheffield, then a whirlwind through Europe.
import { sheffield } from './sheffield.js';
import { train } from './train.js';

export const CHAPTER_1 = {
  name: 'Sheffield',
  shots: [
    { id: 'ch1-sheffield', scene: sheffield, caption: 'Sheffield', duration: 3, fadeIn: 0.4, fadeOut: 0.25 },
    { id: 'ch1-train', scene: train, caption: 'Europe', duration: 4, fadeIn: 0.2, fadeOut: 0.2 },
  ],
};
