// Chapter 4: California, in full colour.
import { arrive } from './arrive.js';
import { office } from './office.js';
import { ranch } from './ranch.js';

export const CHAPTER_4 = {
  name: 'California',
  shots: [
    { id: 'ch4-arrive', scene: arrive, caption: 'California', duration: 1.8 },
    { id: 'ch4-office', scene: office, caption: 'California', duration: 1.6, fadeIn: 0.15, fadeOut: 0.15 },
    { id: 'ch4-ranch', scene: ranch, caption: 'California', duration: 3, fadeIn: 0.15 },
  ],
};
