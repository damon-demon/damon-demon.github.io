// Chapter 1: Sheffield, then a whirlwind through Europe.
import { sheffield } from './sheffield.js';
import { train } from './train.js';
import { lisbon } from './lisbon.js';
import { ring } from './ring.js';
import { trolltunga } from './trolltunga.js';
import { iceland, takeoff } from './iceland.js';

export const CHAPTER_1 = {
  name: 'Sheffield',
  shots: [
    { id: 'ch1-sheffield', scene: sheffield, caption: 'Sheffield', duration: 2, fadeIn: 0.4, fadeOut: 0.25 },
    { id: 'ch1-train', scene: train, caption: 'Europe', duration: 4, fadeIn: 0.2, fadeOut: 0.2 },
    { id: 'ch1-lisbon', scene: lisbon, caption: 'Europe', duration: 2, fadeIn: 0.2, fadeOut: 0.2 },
    { id: 'ch1-ring', scene: ring, caption: 'Europe', duration: 2.5, fadeIn: 0.15, fadeOut: 0.2 },
    { id: 'ch1-trolltunga', scene: trolltunga, caption: 'Europe', duration: 3, fadeIn: 0.3, fadeOut: 0.3 },
    { id: 'ch1-iceland', scene: iceland, caption: 'Europe', duration: 2, fadeIn: 0.3 },
    { id: 'ch1-takeoff', scene: takeoff, caption: 'Europe', duration: 1, fadeOut: 0.35 },
  ],
};
