// The reel's running order, chapter by chapter. It loops: chapter 5 fades out, and Sheffield fades in.
import { beach } from './beach.js';
import { CHAPTER_1 } from './ch1/index.js';
import { CHAPTER_2 } from './ch2/index.js';
import { CHAPTER_3 } from './ch3/index.js';
import { CHAPTER_4 } from './ch4/index.js';
import { CHAPTER_5 } from './ch5/index.js';

export const CHAPTERS = [CHAPTER_1, CHAPTER_2, CHAPTER_3, CHAPTER_4, CHAPTER_5];

// Shown, still, to visitors who prefer reduced motion (chapter 4 = California).
export const POSTER = { id: 'poster', scene: beach, caption: 'California', duration: 1, chapter: 3 };
