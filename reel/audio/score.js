// The reel's score: a lo-fi theme for Yimeng on a music box and an electric piano, over a pad, a
// bass and soft drums, varied chapter by chapter, and a short music-box call for the dog. It is
// written in C. Each cue lays lines on the voices (keys, box, pad, bass, noise) over a run of shots.
// Phase 1 has one cue per chapter.
import { seq, cat, repeat, rest, up, comp, human, hole } from './notation.js';

// The theme is eight bars. The question rises twice and stops on an open E; the answer climbs to
// the high G, then comes home to C, or stops on D to lead on.
const QUESTION = seq('-:.5 A4:.5 C5:.5 E5:2.5 | D5:.5 E5:.5 D5:.5 B4:.5 G4:2 | -:.5 G4:.5 B4:.5 D5:2.5 | C5:.5 D5:.5 C5:.5 A4:.5 E5:2');
const ANSWER = 'F5:1.5 E5:.5 D5:1 A4:1 | C5:.5 D5:.5 E5:1 D5:1 B4:1 | E5:.5 G5:1.5 E5:1 D5:1';
const HOME = seq(`${ANSWER} | C5:4`);
const OPEN = seq(`${ANSWER} | D5:4`);
export const THEME = cat(QUESTION, HOME);

const CHORDS = {
  question: 'Fmaj7 G6 Em7 Am7',
  home: 'Dm9 G7 Cmaj7 Cadd9',
  open: 'Dm9 G7 Am7 G6',
  michigan: 'Dm9 Em7 Fmaj7 Am7',
};
const BASS = {
  question: seq('F2:3 C3:1 | G2:3 D3:1 | E2:3 B2:1 | A2:3 E2:1'),
  home: seq('D2:3 A2:1 | G2:3 B2:1 | C3:3 G2:1 | C3:4'),
  open: seq('D2:3 A2:1 | G2:3 B2:1 | A2:3 E2:1 | G2:4'),
  michigan: seq('D2:4 | E2:4 | F2:4 | A2:4'),
};

// Electric-piano comping: a lazy push on the "and" of two, or one chord held for the bar.
const PUSH = 'x:1.5@.62 x:2.5@.45';
const HELD = 'x:4@.5';
const pad = (chords) => comp(chords, 'x:4@.7', { lo: 55 });
// Half-time lo-fi drums: a kick on one and on the "and" of three, a brush on three, a shaker on the
// eighths. `from` is the beat they come in on.
const KICK = seq('kick:2.5 kick:1.5'), BRUSH = seq('-:2 snare:2'), SHAKER = repeat(seq('shaker:.5@.45 shaker:.5@.8'), 4);
const drums = (bars, from = 0) => [KICK, BRUSH, SHAKER].map(l => ['noise', cat(rest(from), repeat(l, bars))]);
const vinyl = (beats) => ['noise', seq(`vinyl:${beats}`)];

// The Graduation Road Trip: six bars at 150 BPM, on the car's legs (LEGS in ch3/roadtrip.js).
// Bar 1 lifts out of Michigan's grey as the colour floods; bars 2–3 drive the East with the question
// at double speed; the band stops for the half beat the car is home; bars 4–5 go west a tone higher
// with the answer; bar 6 lands at the Golden Gate and hands over to California.
const ROAD = {
  lift: seq('C5:.25 D5:.25 E5:.25 G5:.25 A5:.25 C6:.25 D6:.25 E6:1.25 -:1'),
  roll: seq('-:2 snare:.25@.3 snare:.25@.38 snare:.25@.46 snare:.25@.54 snare:.25@.62 snare:.25@.7 snare:.25@.8 snare:.25@.9'),
  east: seq('-:.25 A4:.25 C5:.25 E5:1.25 | D5:.25 E5:.25 D5:.25 B4:.25 G4:1 | -:.25 G4:.25 B4:.25 D5:1.25 | C5:.25 D5:.25 C5:.25 A4:.25 E5:.5 -:.5'),
  west: up(seq('F5:.75 E5:.25 D5:.5 A4:.5 | C5:.25 D5:.25 E5:.5 D5:.5 B4:.5 | E5:.25 G5:.75 E5:.5 D5:.5 | C5:2'), 2),
  bass: seq(`A2:2 -:1 E2:.5 G2:.5
    | F2:.5 F2:.5 F3:.5 F2:.5 G2:.5 G2:.5 G3:.5 G2:.5 | E2:.5 E2:.5 E3:.5 E2:.5 A2:.5 A2:.5 A3:.5 -:.5
    | E2:.5 E2:.5 E3:.5 E2:.5 A2:.5 A2:.5 A3:.5 A2:.5 | D2:.5 D2:.5 D3:.5 D2:.5 D2:.5 D2:.5 D3:.5 C#3:.5
    | D2:4@.9`),
  // the beats the landmarks pop up on, from landmarkTimes() at 0.4 s a beat, to the nearest 16th:
  // Maine, New York and Washington, then Chicago, the arch, Las Vegas and the Golden Gate
  pings: [[4.5, 'E6'], [5.75, 'G6'], [6.75, 'A6'], [12.5, 'F#6'], [17, 'A6'], [18.5, 'B6'], [20, 'D7']],
};
export const ROAD_PINGS = ROAD.pings.map(([beat]) => beat);
const ROAD_BREAK = [11.5, 12];
const groove = (bars) => [seq('kick kick kick kick'), seq('-:1 clap -:1 clap'), repeat(seq('shaker:.5@.45 shaker:.5@.8'), 2)]
  .map(l => ['noise', cat(rest(4), repeat(l, bars))]);
const pings = cat(...ROAD.pings.map(([beat, note], i) => cat(rest(beat - (i ? ROAD.pings[i - 1][0] + 0.25 : 0)), seq(`${note}:.25@.75`))));

// The dog: a quick, rising call on the music box.
export const DOG = seq('G5:.25@.7 C6:.25@.8 E6:.5@.9');

export const SCORE = {
  cues: [
    {
      // Sheffield's rain and the music box alone, then the band comes in for the continent.
      id: 'europe', tone: 'soft', beats: 32,
      shots: ['ch1-sheffield', 'ch1-train', 'ch1-lisbon', 'ch1-ring', 'ch1-trolltunga', 'ch1-iceland', 'ch1-takeoff'],
      voices: [
        ['box', human(up(cat(QUESTION, OPEN), 12), { seed: 1 })],
        ['keys', human(cat(comp(CHORDS.question, HELD), comp(CHORDS.open, PUSH)), { seed: 2 })],
        ['pad', pad(`${CHORDS.question} ${CHORDS.open}`)],
        ['bass', cat(rest(8), seq('E2:3 B2:1 | A2:3 E2:1'), BASS.open)],
        ['noise', seq('rain:16')],
        ...drums(4, 16),
        vinyl(32),
      ],
    },
    {
      // The electric piano takes the theme, with the whole band, and the dog's call as the puppy
      // arrives at the graduation.
      id: 'new-york', tone: 'soft', beats: 32,
      shots: ['ch2-columbia', 'ch2-night', 'ch2-dining', 'ch2-moma', 'ch2-met', 'ch2-guggenheim', 'ch2-kusama', 'ch2-graduation'],
      voices: [
        ['keys', human(THEME, { seed: 3 })],
        ['keys', human(comp(`${CHORDS.question} ${CHORDS.home}`, PUSH), { seed: 4 })],
        ['pad', pad(`${CHORDS.question} ${CHORDS.home}`)],
        ['bass', cat(BASS.question, BASS.home)],
        ...drums(8),
        vinyl(32),
        ['box', cat(rest(29), DOG)],
      ],
    },
    {
      // Grey and slow: three bars of the question over sadder chords, with no drums, stopping on an
      // open E for the road trip to lift out of.
      id: 'michigan', tone: 'dark', beats: 12,
      shots: ['ch3-snow', 'ch3-timelapse', 'ch3-hooding'],
      voices: [
        ['keys', human(seq('-:.5 A4:.5 C5:.5 E5:2.5 | D5:.5 E5:.5 D5:.5 B4:.5 G4:2 | C5:.5 D5:.5 C5:.5 A4:.5 E5:2'), { seed: 5 })],
        ['keys', human(comp('Dm9 Em7 Am7', HELD), { seed: 6 })],
        ['pad', pad('Dm9 Em7 Am7')],
        ['bass', seq('D2:4 | E2:4 | A2:4')],
        vinyl(12),
      ],
    },
    {
      id: 'road-trip', tone: 'dark', beats: 24,
      tones: [[0, 'bright', 4], [20, 'soft', 4]],
      shots: ['ch3-roadtrip'],
      voices: [
        ['box', human(ROAD.lift, { seed: 11 })],
        ['noise', ROAD.roll],
        ['keys', human(cat(rest(4), ROAD.east, ROAD.west, seq('D5:4@.85')), { seed: 12 })],
        ['box', human(cat(rest(12), up(ROAD.west, 12)), { seed: 13, vel: 0.08 })],
        ['keys', human(cat(comp('Am7', HELD), comp('Fmaj7 G6 Em7 Am7 Em9 A7 Dmaj7 Dadd9', 'x:1.5@.65 x:.5@.5'), comp('Dadd9', 'x:4@.8')), { seed: 14 })],
        ['pad', cat(pad('Am7'), comp('Fmaj7 G6 Em7 Am7 Em9 A7 Dmaj7 Dadd9', 'x:2@.7', { lo: 55 }), pad('Dadd9'))],
        ['bass', ROAD.bass],
        ...groove(4),
        ['noise', seq('-:20 kick@1')],
        ['box', pings],
        ['box', human(seq('-:20.5 A6:.5@.7 F#6:.5@.6 D6:2.5@.6'), { seed: 15 })],
      ].map(([v, l]) => [v, hole(l, ...ROAD_BREAK)]),
    },
    {
      // Sunshine: the electric piano, with the music box joining an octave up for the answer.
      id: 'california', tone: 'soft', beats: 32,
      shots: ['ch4-arrive', 'ch4-office', 'ch4-ranch', 'ch4-forest', 'ch4-fishing', 'ch4-tide', 'ch4-scuba', 'ch4-freedive', 'ch4-sunset'],
      voices: [
        ['keys', human(THEME, { seed: 7 })],
        ['box', human(cat(rest(16), up(HOME, 12)), { seed: 8, vel: 0.08 })],
        ['keys', human(comp(`${CHORDS.question} ${CHORDS.home}`, PUSH), { seed: 9 })],
        ['pad', pad(`${CHORDS.question} ${CHORDS.home}`)],
        ['bass', cat(BASS.question, BASS.home)],
        ...drums(8),
        vinyl(32),
        ['box', cat(rest(29), DOG)],
      ],
    },
    {
      // The music box alone with the answer's last bars, left hanging on D, so the loop runs on
      // into Sheffield.
      id: 'to-be-continued', tone: 'soft', beats: 8,
      shots: ['ch5-sketch'],
      voices: [
        ['box', human(seq('E6:.5 G6:1.5 E6:1 D6:1 | D6:4'), { seed: 10 })],
        ['pad', pad('Am7 G6')],
        ['bass', seq('A2:4@.5 | G2:4@.5')],
        vinyl(8),
      ],
    },
  ],
};
