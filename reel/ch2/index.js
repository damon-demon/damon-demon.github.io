// Chapter 2: New York, from the first day at Columbia to the cap toss.
import { columbia } from './columbia.js';
import { night } from './night.js';
import { dining } from './dining.js';
import { moma } from './moma.js';
import { met } from './met.js';
import { guggenheim } from './guggenheim.js';
import { kusama } from './kusama.js';
import { graduation } from './graduation.js';

export const CHAPTER_2 = {
  name: 'New York',
  shots: [
    { id: 'ch2-columbia', scene: columbia, caption: 'New York', duration: 1.8, fadeIn: 0.35, fadeOut: 0.15 },
    { id: 'ch2-night', scene: night, caption: 'New York', duration: 2, fadeIn: 0.15, fadeOut: 0.15 },
    { id: 'ch2-dining', scene: dining, caption: 'New York', duration: 5.2, fadeIn: 0.2, fadeOut: 0.2 },
    { id: 'ch2-moma', scene: moma, caption: 'New York', duration: 1.1, fadeIn: 0.15, fadeOut: 0.1 },
    { id: 'ch2-met', scene: met, caption: 'New York', duration: 1.1, fadeIn: 0.1, fadeOut: 0.1 },
    { id: 'ch2-guggenheim', scene: guggenheim, caption: 'New York', duration: 1.1, fadeIn: 0.1, fadeOut: 0.1 },
    { id: 'ch2-kusama', scene: kusama, caption: 'New York', duration: 1.1, fadeIn: 0.1, fadeOut: 0.15 },
    { id: 'ch2-graduation', scene: graduation, caption: 'New York', duration: 2.8, fadeIn: 0.2, fadeOut: 0.3 },
  ],
};
