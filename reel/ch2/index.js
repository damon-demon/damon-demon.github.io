// Chapter 2: New York, from the first day at Columbia to the cap toss.
import { columbia } from './columbia.js';
import { night } from './night.js';
import { michelin } from './michelin.js';
import { moma } from './moma.js';
import { graduation } from './graduation.js';

export const CHAPTER_2 = {
  name: 'New York',
  shots: [
    { id: 'ch2-columbia', scene: columbia, caption: 'New York', duration: 1.8, fadeIn: 0.35, fadeOut: 0.15 },
    { id: 'ch2-night', scene: night, caption: 'New York', duration: 2, fadeIn: 0.15, fadeOut: 0.15 },
    { id: 'ch2-michelin', scene: michelin, caption: 'New York', duration: 3, fadeIn: 0.2, fadeOut: 0.2 },
    { id: 'ch2-moma', scene: moma, caption: 'New York', duration: 1.5, fadeIn: 0.2, fadeOut: 0.2 },
    { id: 'ch2-graduation', scene: graduation, caption: 'New York', duration: 2.8, fadeIn: 0.2, fadeOut: 0.3 },
  ],
};
