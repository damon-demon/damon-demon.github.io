// Chapter 3: Michigan, five grey years from the first snow to the hooding, and out through the door.
import { snow } from './snow.js';
import { timelapse } from './timelapse.js';

export const CHAPTER_3 = {
  name: 'Michigan',
  shots: [
    { id: 'ch3-snow', scene: snow, caption: 'Michigan', duration: 2 },
    { id: 'ch3-timelapse', scene: timelapse, caption: 'Michigan', duration: 4.5, fadeIn: 0.1 },
  ],
};
