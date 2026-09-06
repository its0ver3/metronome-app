# Drums Only Metronome

A mobile-first metronome app designed to help drummers practise. The current product has three screens: Metronome, Training, and Settings.

## Product vision

The business goal is to sell branded versions of this app to local drum shops. Each shop can offer its customers the same metronome under its own name, logo, colors, icons, and web address.

This is intentionally a metronome app, not a general practice platform. The metronome is the product; training modes and polyrhythms make it more useful to drummers without changing that focus.

The production app uses the selected **Pulse Core** direction across Metronome, Training, Settings, transport, and navigation. The Metronome combines a distance-readable tempo orbit, compact transport, an icon-led rhythm readout, and an accessible mobile rhythm sheet; Training and Settings use the same premium card and control language. Everything is powered by the existing audio engine rather than the standalone mockup timer.

## Current feature set

- Precision Web Audio metronome with a default 20–300 BPM range; the saved “Pump the Jam” Settings toggle expands it to 20–800 across all tempo controls and Tempo Trainer. Turning it off clamps the current and saved trainer tempos back to 300.
- Meters with 1–16 quarter/eighth notes per bar, simple/compound/uneven groupings, 1–13 clicks per written note, and Off / On / Accent states
- Tap tempo, keyboard shortcuts, nine selected sounds, and master volume
- Optional “Screen flash” setting: choose “One only” or “One + subdivisions,” with a bright downbeat and softer, shorter flashes for the other clicks. Flashes stay inside the app frame across all tabs and Kit View. Defaults off and persists locally; the primary polyrhythm downbeat takes priority when pulses coincide, and silent/muted downbeats still flash.
- Spoken count-in in “Shape the click”: 0, 1, or 2 bars using Female Count before the selected click begins. Counts follow meter groups (primary rhythm pulses in Polyrhythm); trainers begin on the first click bar.
- Optional stop timer in “Shape the click”: 1–180 minutes or 1–999 complete bars, adjusted with the shared trainer wheel, with remaining-time/bar pills in Metronome, the mini transport, and Kit View. The count-in is excluded; silent bars count and each polyrhythm cycle is one bar. Settings persist locally and can be edited while stopped. Every new start resets the count-in and timer; audio is cut off at the timer deadline.
- Kit View: the top-right expand button opens a viewport-filling start/stop tap surface, large live tempo orbit, and BPM slider. Orbit slices cycle Off / On / Accent in standard and polyrhythm modes. Slices, slider, and exit button never toggle playback; Escape exits and restores focus. Entering or leaving preserves playback and returns to the previous tab. Tempo Trainer retains control of BPM while active.
- Three lightweight synthesized sounds plus recorded cowbell, hi-hat, shaker, tambourine, and male/female spoken counts from 1–16
- Gap, tempo, and subdivision trainers that can run together in standard metronome mode
- Side-mounted throw-off switches on all three trainer cards, with subtle lever/slide feedback and accessible native switch behavior
- Two-voice polyrhythm mode with independent counts, accents, and sounds
- A compact metronome transport on Training and Settings, with a live segmented BPM orbit and minus/start-stop/plus controls. Tap the orbit to open Metronome; tempo nudges remain locked while Tempo Trainer owns BPM.
- Mobile safe-area handling, visible keyboard focus, semantic control states, and touch-friendly primary controls
- Config-driven identity for future local-drum-shop versions

Setlists, Journal, and Groove are intentionally absent from the current app. They were removed so any of these features can be reconsidered from a clean product design later.

## Run locally

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

Run the focused behavior checks with:

```bash
npm test
```

The Vite base path is `/metronome-app/` for GitHub Pages-style project hosting.

## Architecture and persistence

- React 19, Vite 6, Tailwind CSS 4
- Web Audio API with a short lookahead scheduler; visual beat events are delivered at the matching audible timestamp
- Metronome, trainer, polyrhythm, sound, and volume settings persist in `localStorage`
- Persisted settings hydrate the audio engine before the first interactive render, so playback cannot start on stale defaults
- The PWA plugin supplies the manifest and offline cache, including the production sound library, at build time
- `src/brand/` owns the visible shop identity; feature components remain independent of shop logos and palettes

See [metronome-app-prd.md](metronome-app-prd.md) for the current product specification and [theme.md](theme.md) for the implemented design tokens.

See [BRANDING.md](BRANDING.md) for the current Drums Only brand contract and the safe reskin workflow. The original comparison environment remains in `mockups/metronome-ui-lab/`; it is still standalone and does not power production playback. `mockups/sound-library-lab/` and `mockups/sound-shortlist/` remain as standalone decision records. The checked shortlist choices now define the production library: Classic Click, Woodblock, Soft Tone, recorded Cowbell, recorded Hi-hat, Shaker, Tambourine, Male Count, and Female Count.

Third-party icon and audio notices are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

The selected side-view throw-off is implemented in the real Training screen using a shared `TrainerToggle` component and independently bundled artwork. [Artwork provenance and motion notes](src/assets/trainer-throwoff.md) are retained with the production asset. The trainer-toggle comparison mockup was removed after approval of the production version.

Training uses the selected Hoop Dial cards and inline cylindrical number wheels. Gap uses icon C (interrupted pulse loop); Tempo and Subdivision use icon A (note/up arrow and one-to-two-to-four divisions). Gap's click/silent bars and Tempo's start/target BPM are editable directly in the header when enabled. Tempo's wider increase/interval wheels and Subdivision's stage controls unfold with the throw-off. Subdivision stages use compact musical-note dropdowns; bar counts retain number wheels. The Subdivision header previews the saved sequence as note groups with arrows and highlights the current stage during playback; the highlight clears when stopped, disabled, or paused by Polyrhythm. Disabled values stay readable; folded settings remain mounted and inert, and Polyrhythm disables editing without discarding configuration.

The rhythm pill pairs a stacked time signature with subdivision notation. Compact 76 × 44 px selectors keep the rhythm sheet small; only the meter and subdivision selectors plus applicable grouping choices are shown. Common presets are 4/4, 3/4, 2/4, then 5/8, 6/8, 7/8, 9/8, and 12/8. Grouping choices appear for 5/8 and 7/8. The orbit and detailed accents reflect actual group lengths, including unequal pulses. Previously saved custom signatures remain readable, but there is no custom-meter editor.

BPM always counts quarter notes, including in /8 meters; older saved tempo-unit preferences normalize to quarter notes. Meter changes keep the numerical BPM and stop playback; Play restarts bar 1. Old settings migrate to N/4. In /8 meters, subdivision notation represents 1–13 clicks per written eighth note (not per dotted-quarter group). Group-pulse-only playback is also available; Subdivision Trainer temporarily overrides it while enabled. All trainer intervals count complete bars. Spoken sounds count group starts and use quiet subdivision samples within groups. Polyrhythm retains its independent pulse-A tempo and preserves the standard meter while trainers are paused. Meter settings are included in version-5 saved preferences.

Note-list Up/Down/Home/End keys browse choices and Enter/Space selects. Selection or Escape closes the list and restores focus; outside taps, page scrolling, and disabling the trainer also dismiss it. Static notation uses the licensed Bravura notehead SVG outline, without a runtime music font. The `mockups/subdivision-notation-lab/` and `mockups/meter-lab/` remain isolated for comparison; production imports neither.

Wheels support horizontal touch/mouse dragging, focused mouse/trackpad scrolling, and arrow/Page/Home/End keys. Slow movement gently snaps near numbers; faster movement bypasses the detent. Trainer highlights share the BPM slider's live Blue Olive colour mapping. Gesture animation is local and frame-batched; settings and the audio engine update once on release or after 120 ms of scroll inactivity. Keyboard steps apply immediately. Cancelled gestures do not publish changes. Memoized cylinder faces avoid rebuilding grip geometry on unrelated playback renders. Grip ridges fade individually so engagement does not flatten the 3D surface. The independent `mockups/trainer-controls-lab/` and `mockups/trainer-card-studio/` studies remain available for review; production imports no mockup code or assets.

`drum-tuner-prd.md` describes a separate future native iOS concept; it is not part of this web app.
