// The reel's score: one theme for Yimeng, varied chapter by chapter, and a short call for the dog.
// It is written in C. Each cue lays lines on the voices (p1 melody, p2 harmony, tri bass, noise
// drums) over a run of shots. Phase 1 has one cue per chapter.
import { seq, cat, repeat, rest, minor, arp } from './notation.js';

// The theme is four bars, played twice: the first time it ends open, on the dominant, and the second
// time it comes home.
const OPEN = seq('G4 C5 D5 E5 | D5:1.5 C5:.5 A4:2 | A4 C5 F5 E5 | D5:2 B4 G4');
const HOME = seq('G4 C5 D5 E5 | D5:1.5 C5:.5 A4:2 | A4 C5 F5 E5 | D5:1.5 B4:.5 C5:2');
export const THEME = cat(OPEN, HOME);
const BASS_OPEN = seq('C3:2 G2:2 | A2:2 E2:2 | F2:2 C3:2 | G2:2 D3:2');
const BASS_HOME = seq('C3:2 G2:2 | A2:2 E2:2 | F2:2 C3:2 | G2:2 C3:2');
const BASS = cat(BASS_OPEN, BASS_HOME);
const CHORDS = 'C Am F G';
const HARMONY = repeat(arp(CHORDS), 2);

// The dog: a quick, rising call.
export const DOG = seq('G5:.25 C6:.25 E6:.25 G6:.75');

const hats = (beats) => repeat(seq('hat:.5'), beats * 2);
const kit = (bars) => repeat(seq('kick snare kick snare'), bars);

export const SCORE = {
  cues: [
    {
      // Sheffield's rain under the theme in the minor, then the major for the continent.
      id: 'europe', tone: 'soft', beats: 32,
      shots: ['ch1-sheffield', 'ch1-train', 'ch1-lisbon', 'ch1-ring', 'ch1-trolltunga', 'ch1-iceland', 'ch1-takeoff'],
      voices: [
        ['p1', cat(minor(OPEN), HOME)],
        ['p2', cat(minor(arp(CHORDS)), arp(CHORDS))],
        ['tri', cat(minor(BASS_OPEN), BASS_HOME)],
        ['noise', cat(seq('rain:16'), hats(16))],
        ['noise', cat(rest(16), kit(4))],
      ],
    },
    {
      // The theme in full, and the dog's call as the puppy arrives at the graduation.
      id: 'new-york', tone: 'soft', beats: 32,
      shots: ['ch2-columbia', 'ch2-night', 'ch2-dining', 'ch2-moma', 'ch2-met', 'ch2-guggenheim', 'ch2-kusama', 'ch2-graduation'],
      voices: [['p1', THEME], ['p2', HARMONY], ['tri', BASS], ['noise', hats(32)], ['noise', kit(8)], ['p1', cat(rest(30), DOG)]],
    },
    {
      // Grey and slow: the theme's homecoming half in the minor, with no drums.
      id: 'michigan', tone: 'dark', beats: 16,
      shots: ['ch3-snow', 'ch3-timelapse', 'ch3-hooding', 'ch3-roadtrip'],
      voices: [['p1', minor(HOME)], ['p2', minor(arp(CHORDS, { step: 1 }))], ['tri', minor(BASS_HOME)]],
    },
    {
      id: 'california', tone: 'soft', beats: 32,
      shots: ['ch4-arrive', 'ch4-office', 'ch4-ranch', 'ch4-forest', 'ch4-fishing', 'ch4-tide', 'ch4-scuba', 'ch4-freedive', 'ch4-sunset'],
      voices: [['p1', THEME], ['p2', HARMONY], ['tri', BASS], ['noise', hats(32)], ['noise', kit(8)], ['p1', cat(rest(30), DOG)]],
    },
    {
      // The theme's last phrase, left hanging on the second, so the loop runs on into Sheffield.
      id: 'to-be-continued', tone: 'soft', beats: 8,
      shots: ['ch5-sketch'],
      voices: [['p1', seq('A4 C5 F5 E5 | D5:4')], ['p2', arp('F G')], ['tri', seq('F2:2 C3:2 | G2:4')]],
    },
  ],
};
