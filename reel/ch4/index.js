// Chapter 4: California, in full colour.
import { arrive } from './arrive.js';
import { office } from './office.js';
import { ranch } from './ranch.js';
import { forest } from './forest.js';
import { fishing } from './fishing.js';
import { tide } from './tide.js';
import { scuba } from './scuba.js';
import { freedive } from './freedive.js';
import { sunset } from './sunset.js';

export const CHAPTER_4 = {
  name: 'California',
  shots: [
    { id: 'ch4-arrive', scene: arrive, caption: 'California', duration: 1.8 },
    { id: 'ch4-office', scene: office, caption: 'California', duration: 1.6, fadeIn: 0.15, fadeOut: 0.15 },
    { id: 'ch4-ranch', scene: ranch, caption: 'California', duration: 3, fadeIn: 0.15 },
    { id: 'ch4-forest', scene: forest, caption: 'California', duration: 1.8, fadeOut: 0.15 },
    { id: 'ch4-fishing', scene: fishing, caption: 'California', duration: 1.9, fadeIn: 0.15, fadeOut: 0.15 },
    { id: 'ch4-tide', scene: tide, caption: 'California', duration: 1.9, fadeIn: 0.15, fadeOut: 0.15 },
    { id: 'ch4-scuba', scene: scuba, caption: 'California', duration: 1.4, fadeIn: 0.15, fadeOut: 0.15 },
    { id: 'ch4-freedive', scene: freedive, caption: 'California', duration: 1.5, fadeIn: 0.15 },
    { id: 'ch4-sunset', scene: sunset, caption: 'California', duration: 2, fadeOut: 0.3 },
  ],
};
