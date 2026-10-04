// Chapter 2: New York, from the first day at Columbia to the cap toss.
import { columbia } from './columbia.js';
import { night } from './night.js';

export const CHAPTER_2 = {
  name: 'New York',
  shots: [
    { id: 'ch2-columbia', scene: columbia, caption: 'New York', duration: 2, fadeIn: 0.35, fadeOut: 0.15 },
    { id: 'ch2-night', scene: night, caption: 'New York', duration: 2.4, fadeIn: 0.15, fadeOut: 0.15 },
  ],
};
