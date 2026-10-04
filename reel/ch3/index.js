// Chapter 3: Michigan, five grey years from the first snow to the hooding, then the Graduation Road Trip.
import { snow } from './snow.js';
import { timelapse } from './timelapse.js';
import { hooding } from './hooding.js';
import { roadtrip } from './roadtrip.js';

export const CHAPTER_3 = {
  name: 'Michigan',
  shots: [
    { id: 'ch3-snow', scene: snow, caption: 'Michigan', duration: 2 },
    { id: 'ch3-timelapse', scene: timelapse, caption: 'Michigan', duration: 4.5, fadeIn: 0.1 },
    { id: 'ch3-hooding', scene: hooding, caption: 'Michigan', duration: 2, fadeIn: 0.15, fadeOut: 0.15 },
    { id: 'ch3-roadtrip', scene: roadtrip, caption: 'Graduation Road Trip', duration: 5, fadeIn: 0.2 },
  ],
};
