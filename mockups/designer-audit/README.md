# Designer audit and standalone concepts

Open `index.html` for the interactive review and links to each concept. Open any numbered HTML file directly for a standalone mockup. Each numbered page includes its own CSS, JavaScript, and any required audio data; it does not need a network connection or a build step. The gallery uses the sibling files for its previews.

- `01-instrument.html` — main metronome and shared visual language
- `02-rhythm.html` — rhythm editor, subdivisions, accents, and polyrhythm
- `03-training.html` — purpose-led trainers and progressive controls
- `04-sound.html` — grouped sound selection and independent audible previews
- `05-kit-view.html` — responsive distance view and tempo lock
- `06-creator-edition.html` — example brand variants, welcome, pack, and exercise detail
- `AUDIT.md` — detailed findings, priorities, commercial context, and sources

These are design proposals. The production app is unchanged. All playback outside sound previews is a silent timer-driven visual demonstration, not the production audio engine. It is unsuitable for timing practice. Rhythm application, trainer scheduling, persistence, edition deployment, payment, onboarding persistence, screen wake lock, and background playback are not implemented here. Input configuration and visible state changes are included so the design can be reviewed interactively.

The main mockup intentionally represents the general metronome configuration; navigation between standalone files starts each example from its own illustrative state. The rhythm mockup keeps per-click editing local and does not apply settings to another file. The creator detail shows an exercise's proposed configuration but does not run that trainer. Two creator identities and all creator teaching copy are fictional examples.

Sound previews use the current app's existing recorded percussion and spoken-count samples. Synthesized click previews approximate the production sound parameters. Attribution and licenses are retained in `THIRD_PARTY_NOTICES.md` beside these files. All preview audio requires a user click.

To regenerate the self-contained pages after editing `prototype.css`, `prototype.js`, or the page markup in `build-mockups.mjs`, run from the repository root:

```sh
node mockups/designer-audit/build-mockups.mjs
```

The generator reads existing audio assets from this repository. It is not needed to view the already-generated pages.

## Verification

The review uses the existing local Vite server. Visual checks cover all six concepts and the gallery, phone and small-screen layouts, a wide kit view, and representative interactive states. Results:

- All six pages and the review gallery were visually inspected.
- All six concepts were checked at an actual 320 × 568 viewport; document and content widths fit without horizontal overflow.
- The main metronome fits its primary controls at 320 × 568 without internal scrolling. At short heights it omits the slider and secondary sound shortcut; direct BPM editing, nudges, Tap tempo, and Settings remain available.
- Main, rhythm, training, sound, welcome, collection, and exercise-detail layouts were inspected at 390 × 844. Kit view was also inspected at 1024 × 768.
- Tempo nudges, playback state, subdivisions, accent cycling, polyrhythm switching, trainer combination, gap inputs, independent sound selection/preview, tempo lock with Stop available, creator switching, preset detail, and brand continuity through gallery navigation were exercised.
- The gallery fits at 320 px and was reviewed at desktop width.
- Inline scripts in all seven HTML pages passed Node syntax checks; browser checks reported no runtime errors.

Production tests were not rerun because production code was not changed. These checks validate the mockups, not the underlying audio engine or platform capabilities.
