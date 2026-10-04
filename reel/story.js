// The reel's running order. Chapters that are not built yet are stand-ins on the beach scene, so the
// controls, captions and timeline sync work end to end in the meantime.
import { beach } from './beach.js';
import { CHAPTER_1 } from './ch1/index.js';
import { CHAPTER_2 } from './ch2/index.js';

const standIn = (id, caption, duration) => ({ id, scene: beach, caption, duration });

export const CHAPTERS = [
  CHAPTER_1,
  CHAPTER_2,
  { name: 'Michigan', shots: [standIn('ch3-michigan', 'Michigan', 6)] },
  { name: 'California', shots: [standIn('ch4-california', 'California', 8)] },
  { name: 'To be continued', shots: [standIn('ch5-continued', 'To be continued…', 4)] },
];

// Shown, still, to visitors who prefer reduced motion (chapter 4 = California).
export const POSTER = { id: 'poster', scene: beach, caption: 'California', duration: 1, chapter: 3 };
