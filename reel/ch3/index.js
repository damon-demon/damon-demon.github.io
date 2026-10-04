// Chapter 3: Michigan, five grey years from the first snow to the hooding, and out through the door.
import { snow } from './snow.js';
import { timelapse } from './timelapse.js';
import { hooding } from './hooding.js';
import { door } from './door.js';

export const CHAPTER_3 = {
  name: 'Michigan',
  shots: [
    { id: 'ch3-snow', scene: snow, caption: 'Michigan', duration: 2 },
    { id: 'ch3-timelapse', scene: timelapse, caption: 'Michigan', duration: 4.5, fadeIn: 0.1 },
    { id: 'ch3-hooding', scene: hooding, caption: 'Michigan', duration: 2, fadeIn: 0.15, fadeOut: 0.15 },
    { id: 'ch3-door', scene: door, caption: 'Michigan', duration: 1.5, fadeIn: 0.1 },
  ],
};
