# Meter feature study

Local preview: `/metronome-app/mockups/meter-lab/`.
All new files live here; delete this folder to remove the study. No production
engine, controls, storage, or build configuration are modified. Existing logo,
tempo palette, and orbit geometry are reused read-only.

## Working behavior

- Presets: 4/4, 3/4, 2/4, 6/8, 9/8, 12/8, 5/8, 7/8.
- 5/8 offers 2+3 / 3+2; 7/8 offers 2+2+3 / 2+3+2 / 3+2+2.
- Custom numerator 1–16, denominator 4 or 8, positive-integer groups summing
  exactly to the numerator. Groups determine accent placement and ring spans.
- Quarter, dotted-quarter, or eighth-note tempo unit, explicitly displayed.
  Presets choose quarter for /4, dotted quarter for compound /8, eighth for
  uneven /8. Changing units or presets keeps the numerical BPM, **not** speed;
  this policy is stated next to the selector so it can be vetted.
- The audio model derives seconds from written note lengths, not group count.
  7/8 pulses therefore remain uneven; 6/8 at dotted quarter=120 lasts one second.
- /4 clicks: quarters, eighths, triplets, sixteenths. /8: group pulses, eighths,
  sixteenths. Compound eighths are ordinary eighths, not triplets.
- Ring groups cycle Off → On → Accent. Off mutes the whole group. Accent
  changes the main click while retaining quieter internal clicks.
- Gap, Tempo, and Subdivision demo trainers can run together. Their intervals
  count complete bars. Tempo rises to a maximum of 300. Subdivision stage B
  doubles click density (or moves group-only pulses onto the written grid).
- Edits stop playback; Play restarts bar 1. The UI says this explicitly.
  No live-edit/next-bar migration into production is implied.
- Separate Web Audio oscillator audition, 100ms lookahead, 20ms scheduler,
  output-clock-aligned visual queue; stop cancels queued audio/visuals.
  Hiding/leaving the page stops it. No sampled sound-bank or voice integration.

This folder preserves the approved study. Its meter behavior is now integrated
in production through `src/audio/meter.js` and the existing AudioEngine, with
compact controls instead of this expanded review layout. Production keeps the
numeric BPM and stops on meter/unit edits, migrates old settings to N/4, counts
spoken group starts, and retains independent polyrhythm timing. The prototype
remains isolated and is not imported by the main app.

## Checks

`node --test mockups/meter-lab/meter.test.mjs`

## References

- Open Music Theory: [compound meters](https://viva.pressbooks.pub/openmusictheory/chapter/compound-meters-and-time-signatures/)
- Open Music Theory: [meter and time signatures](https://openmusictheory.github.io/meter.html)

References inform timing concepts; no source text or imagery is copied.
