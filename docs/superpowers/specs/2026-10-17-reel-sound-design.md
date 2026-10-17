# Reel Sound — a Chiptune Score for the Life Reel

Date: 2026-10-17

## Goal

Give the life reel a soundtrack: one theme for Yimeng, varied through the five chapters, a short motif for the dog, and a handful of sound effects on key moments. Sound is off until the visitor turns it on. This reverses the life reel spec's "Sound: none" decision, for the reel only.

## Decisions

| Topic | Decision |
|---|---|
| Scope | The reel only, not the whole page. Music plus sound effects (option C). |
| Source | Synthesised live with the Web Audio API. No audio files. |
| Why not files | A 66 s loop as a file is 1–2 MB, has to match the reel to the millisecond, drifts after a jump, and must be re-exported every time a shot is retimed. Synthesised from the reel's own clock, it is a few KB, stays in sync, and follows any retiming automatically. |
| Sound | Lo-fi music box and electric piano, like *Stardew Valley*'s indoor tunes or a Ghibli piano piece. Revised after the first listen: the chiptune draft sounded too much like an arcade. There are no chiptune voices. Big moments open the filter and fill out the band instead. |
| Structure | One 8-bar theme, a question and an answer, over seventh and ninth chords. Each chapter varies its instruments, chords, tempo and filter. A 3-note music-box call for the dog, heard first at the 2019 cap toss. |
| Default | Muted. Browsers block sound before a user gesture, and visitors often open the page at work. |
| Persistence | None. Every visit starts muted. |

## The score

### Voices

All voices are synthesised with Web Audio. There are no samples.

- **keys:** an electric piano. FM synthesis (a 1:1 modulator whose depth falls as the note rings, plus a brief 14:1 "tine" at the strike), a long natural decay, and a little extra ring, as if the sustain pedal were down.
- **box:** a music box. FM with a 3.5:1 modulator for a glassy strike that settles into a near-pure tone.
- **pad:** two sawtooth waves detuned ±8 cents, through a 1.1 kHz low-pass, with a slow swell.
- **bass:** a sine with a quarter of its octave added.
- **noise:**
  - soft lo-fi drums: a falling-sine kick, a brush snare, a shaker;
  - textures: rain, and vinyl crackle;
  - later, the sound effects.

A slow 0.55 Hz LFO detunes every pitched carrier by up to 3.5 cents, like old tape. Notes carry a velocity. The score's `human()` helper nudges every note's timing and velocity a little, the same way on every play.

All voices go through one tone stage: a low-pass filter plus a send to a reverb, a generated 2.4 s noise-decay impulse in a `ConvolverNode`, darkened at 4.5 kHz. Then come a master gain and a limiter (`DynamicsCompressorNode`).

The tone stage has four settings:

- **soft:** cutoff 5.2 kHz, reverb 0.22. This is the default.
- **bright:** 14 kHz, 0.14.
- **dark:** Michigan's grey, 1.6 kHz, 0.3.
- **water:** underwater, 700 Hz, 0.45.

Cues name a tone, and the filter glides between tones over 0.2 s, or over a whole cue if the cue sets `sweep`.

### Cues

The music is a list of **cues**. Each cue spans one or more consecutive shots, named by shot id, and is written in bars and beats. Its tempo is derived from its length: tempo = beats ÷ (total duration of its shots). When a shot is retimed, the cue stretches or squeezes with it. A unit test keeps every cue's derived tempo between 60 and 200 BPM, so retiming cannot push the music out of range without the tests saying so.

| Chapter | Cue (shots) | Music | Tone |
|---|---|---|---|
| 1 | Sheffield, train | Rain on the noise voice. The theme starts slowly, in a minor key. Then the train's clickety-clack rhythm, with passport stamps landing faster and faster. | soft |
| | Lisbon | The theme in the major, with a tram bell | soft |
| | Nürburgring | Sudden tempo jump, a fast bass arpeggio, an engine drone. The band drops out for one beat while the Golf is airborne. | **bright** |
| | Trolltunga | The stillest music in the film: the triangle alone, long notes, slow | soft |
| | Iceland, take-off | A shimmering high arpeggio for the aurora. The pitch climbs with the plane. | soft |
| 2 | Columbia | The theme in the major, light | soft |
| | Night, dining | Art Deco jazz, with a walking bass and swing. A "ding" when the cloche lifts, and a falling run as the bill unrolls. | soft |
| | MoMA, Met, Guggenheim, Kusama | One chord and texture per museum, twinkling for Kusama | soft |
| | Graduation | The full theme with a fanfare climax. A "whoosh" for the cap toss, then the dog motif for the first time. | **bright** |
| 3 | Snow | The theme in the minor, sparse | dark |
| | Time-lapse | A clock-tick ostinato that speeds up with each year, in step with the picture | dark |
| | Hooding | The theme slowed into a chorale, with applause on the noise voice | dark |
| | Road trip | The filter opens as the colour floods back, and a road-trip groove builds | dark → soft (sweep) |
| 4 | Arrive, office | A bright major groove, with a rising blip for every new candle | soft |
| | Ranch | Chase energy, then the music drops to a low drone when the rifle comes up. In the scope view there is one heartbeat, then the hard cut. No shot is fired and there is no gunshot. | soft |
| | Forest, fishing, tide | A light pizzicato feel. Each chanterelle into the basket is a rising note. A "plop" when the float ducks under, and comic "boing"s for the urchin and the innkeeper worm. | soft |
| | Scuba, freedive | Underwater, with bubbles. A "zip" as the spear is fired, cut off mid-flight. | water |
| | Sunset | The theme, full and warm, then the dog motif | soft |
| 5 | Sketch | The theme's last phrase. The voices drop out one by one as the pencil takes over, and the last note hangs unresolved. The loop brings back Sheffield's rain. | soft, fading |

### Sound effects

There are about 15–20 effects, each on a key moment: no footsteps or other every-frame sounds. Each effect is pinned to a shot id and a local time in that shot, taken from the moment the scene draws it. Effects play through the same voices and tone stage as the music, so they match its sound.

## Engine

### Files

- `reel/audio/score.js`: pure data. The theme, the dog motif, the cue list and the effect list.
- `reel/audio/schedule.js`: pure maths, with no Web Audio. `eventsBetween(score, tl, t0, t1)` returns every note and effect starting in `[t0, t1)` of the timeline, with its absolute time, and wraps across the loop. It is unit-tested with `node --test`, like `timeline.js`.
- `reel/audio/synth.js`: the Web Audio graph (voices, tone stage, master), plus `play(event, when)`, which returns a handle that can be stopped.
- `reel/audio/sound.js`: the bridge to the reel, described next.

### How it attaches to the reel

`sound.js` creates the `AudioContext` lazily, on the visitor's first click on the sound button. Each frame, `reel.js` calls `sound.update(t, playing)`, where `t` is the reel's position on the **full** timeline. In `?reel=<shot-id>` solo mode, that is the shot's start on the full timeline plus its local time, so the cues still resolve.

`sound.update` keeps a map from reel time to `AudioContext` time. It schedules 150 ms ahead and remembers what it has already scheduled. If `t` is more than 80 ms from where the map predicts, the reel has jumped or the loop has wrapped. It then stops every pending note and re-anchors. When playback stops (paused, scrolled offscreen, tab hidden), the master fades out over 0.3 s, pending notes are cancelled, and the context is suspended. When playback resumes, it fades back in.

## Page integration

- **Sound button:** a 28 px round button before the pause button, in the same style. It uses a speaker icon, with a slash through it when muted. Its `aria-label` is always "Sound", and `aria-pressed` gives its state. (A toggle that also changed its label would be announced twice.) On phones it is 24 px, like the pause button.
- **No Web Audio:** the button is not added.
- **Reduced motion:** sound follows playback, so with no autoplay it stays silent until the visitor presses play.
- **Volume:** master gain about 0.25, with the limiter so stacked voices never clip.
- **iOS:** Web Audio follows the ringer switch on iOS, so with the phone on silent the reel stays quiet. This is accepted.

## Verification

- **Unit tests** (`node --test 'tests/reel/*.test.js'`):
  - Every cue names real, consecutive shots, and together the cues cover the whole timeline once.
  - Derived tempos stay within 60–200 BPM.
  - `eventsBetween` returns the right events, wraps across the loop, and never returns the same event twice for adjacent windows.
  - Every effect falls inside its shot.
- **Offline render:** `tests/reel/render-sound.mjs` renders the full loop, or one cue, through an `OfflineAudioContext` in headless Chrome and writes a WAV file. The script checks that the peak level stays under −1 dBFS and that there is no stretch of unexpected silence. The user listens to the WAV (for example with `afplay`). **Musical quality is judged by the user's ears; there is a listening review after each chapter.**
- **Page:** `tests/reel/qa.mjs` gains three checks: the sound button exists, nothing creates an `AudioContext` before it is clicked, and the console shows no errors with sound on through every shot.

## Delivery

Work happens on branch `reel-sound`. Nothing is merged to `main` (which deploys) until the user approves the whole score.

1. Engine, sound button, offline renderer, and the theme and dog motif on their own, for a first listen.
2. Chapters 1 and 2.
3. Chapters 3, 4 and 5, and the loop seam.

## Out of scope

- Whole-page background music.
- Remembering the sound setting between visits.
- A volume slider.
- Audio files of any kind.
