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
- Counting voices speak “and” on an exact halfway subdivision: eighths count “1 and 2 and”; sixteenths use “1 click and click”. Other positions retain quiet clicks, and odd tuplets without a halfway position remain clicks. The existing 1–16 samples are unchanged.
- Gap, tempo, and subdivision trainers that can run together in standard metronome mode
- Side-mounted throw-off switches on all three trainer cards, with subtle lever/slide feedback and accessible native switch behavior
- Two-voice polyrhythm mode with independent counts, accents, and sounds
- A compact metronome transport on Training and Settings, with a live segmented BPM orbit and minus/start-stop/plus controls. Tap the orbit to open Metronome; tempo nudges remain locked while Tempo Trainer owns BPM.
- Mobile safe-area handling, visible keyboard focus, semantic control states, and touch-friendly primary controls
- Config-driven identity for future local-drum-shop versions

Setlists, Journal, and Groove are intentionally absent from the current app. They were removed so any of these features can be reconsidered from a clean product design later.

## Browser support target

The beta targets **Safari on iPhone and macOS**, and **Chrome on Android and desktop**, using up-to-date browser versions. Prioritize iPhone Safari and Android Chrome for tester coverage. Other browsers may work but are outside the current release test target; the app does not block them.

See the [browser compatibility report](docs/browser-compatibility.md) for verified versions and the reusable Chrome/Safari audio harness. Use the [beta tester checklist](docs/beta-test-checklist.md) for real-phone checks. A desktop pass does not certify mobile audio interruption or Bluetooth behavior.

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
- Web Audio API with an AudioWorklet renderer: the audio thread runs the shared meter/trainer timeline and mixes decoded samples at sample-frame positions, independently of UI timers. Browsers unable to load the worklet use a 25 ms polling / 150 ms lookahead BufferSource fallback.
- Live polyrhythm tempo changes take effect at the next uncommitted shared cycle; an already-started cycle keeps its pulse spacing. The fallback skips expired clicks after a stall while advancing trainer/bar state, rather than replaying a backlog. Audio-thread rendering owns session cutoffs; UI messages only report playback.
- Metronome, trainer, polyrhythm, sound, and volume settings persist in `localStorage`
- Persisted settings hydrate the audio engine before the first interactive render, so playback cannot start on stale defaults
- The PWA plugin supplies the manifest and offline cache, including the production sound library, at build time
- `src/brand/` owns the visible shop identity; feature components remain independent of shop logos and palettes

The playback rules remain in `src/audio/AudioEngine.js`. `BrowserAudioEngine.js` bridges controls and audio-thread events; `AudioRenderTimeline.js` reuses those rules with a PCM mixer; `metronome.worklet.js` supplies the browser render callback. Samples are decoded on the main thread before playback. Counting voices load only the counts used by the current meter or polyrhythm, retaining all five speed tiers for immediate tempo changes (26 WAV requests for a 4/4 counting voice, including “and” and the quiet click, instead of 86). A four-beat count-in without a playing voice needs 21. Concurrent loads share decoded samples and retry only failed files. Live sound changes keep the previous click until the new bank is ready; only missing PCM is sent to the renderer. New renderers receive active sounds and count-in dependencies, rather than all previously previewed voices. Startup is visibly pending and can be cancelled by tapping the transport again; load errors expose retry instructions, and obsolete previews cannot play after a newer selection. The worklet is bundled and precached in both hosting builds. Screen-off/background playback is not a supported guarantee in this browser beta.

Subdivision and flash updates subscribe directly to visual components, while unchanged Settings/Training screens and tempo controls skip playback renders. Orbit geometry is cached independently of the active beat. Session status publishes on meaningful transitions or countdown-second changes, while every audio block still enforces exact session cutoffs. Rhythm-sheet dismissal takes 220 ms and restores focus without scrolling. See the [performance implementation report](docs/performance-improvements.md).

Read the [before/after timing report](docs/audio-timing-verification.md), or repeat the digital timing checks with the [isolated harness](scripts/timing-lab/README.md). The retained baseline source and measurements are in `docs/audio-timing-evidence/`. These checks measure click spacing against the audio sample clock, not physical output latency or device-clock accuracy against an external reference.

The [browser compatibility report](docs/browser-compatibility.md) records native Safari and Chrome checks, browser support expectations, and remaining phone tests. Share an HTTPS link for phone testing so the AudioWorklet renderer is available; an ordinary HTTP LAN development address does not have the same secure-context exception as localhost.

The [iPhone Safari recovery investigation](docs/safari-audio-recovery.md) documents recovery defects found after a reported audio freeze around a meter change. Playback now returns to stopped after a browser interruption or detected frozen audio clock; Play rebuilds an unusable context while preserving settings. Startup and retired-renderer races have regression coverage. The original incident still needs confirmation on the affected iPhone.

The [visual/audio synchronization update](docs/visual-audio-sync-update.md) records immediate highlight attacks, output-clock-aligned visual presentation, late-pulse suppression, and Safari/Chrome measurements. The [baseline report](docs/visual-audio-sync.md) retains the earlier findings. The isolated harness observes production components without changing playback behavior.

See [metronome-app-prd.md](metronome-app-prd.md) for the current product specification and [theme.md](theme.md) for the implemented design tokens.

See [BRANDING.md](BRANDING.md) for the current Drums Only brand contract and the safe reskin workflow. The original comparison environment remains in `mockups/metronome-ui-lab/`; it is still standalone and does not power production playback. `mockups/sound-library-lab/` and `mockups/sound-shortlist/` remain as standalone decision records. The checked shortlist choices now define the production library: Classic Click, Woodblock, Soft Tone, recorded Cowbell, recorded Hi-hat, Shaker, Tambourine, Male Count, and Female Count.

Third-party icon and audio notices are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

The selected side-view throw-off is implemented in the real Training screen using a shared `TrainerToggle` component and independently bundled artwork. [Artwork provenance and motion notes](src/assets/trainer-throwoff.md) are retained with the production asset. The trainer-toggle comparison mockup was removed after approval of the production version.

Training uses the selected Hoop Dial cards and inline cylindrical number wheels. Gap uses icon C (interrupted pulse loop); Tempo and Subdivision use icon A (note/up arrow and one-to-two-to-four divisions). Gap's click/silent bars and Tempo's start/target BPM are editable directly in the header when enabled. Gap's pattern picker, Tempo's wider increase/interval wheels, and Subdivision's stage controls share the same opening and closing animation with the throw-off. Subdivision stages use compact musical-note dropdowns; bar counts retain number wheels. The Subdivision header previews the saved sequence as note groups with arrows and highlights the current stage during playback; the highlight clears when stopped, disabled, or paused by Polyrhythm. Disabled values stay readable; folded settings remain mounted and inert, and Polyrhythm disables editing without discarding configuration.

The rhythm pill pairs a stacked time signature with subdivision notation. Compact 76 × 44 px selectors keep the rhythm sheet small; only the meter and subdivision selectors plus applicable grouping choices are shown. Common presets are 4/4, 3/4, 2/4, then 5/8, 6/8, 7/8, 9/8, and 12/8. Quick grouping choices appear for 5/8 and 7/8, and their /16 counterparts. The orbit and detailed accents reflect actual group lengths, including unequal pulses. The meter picker also offers Custom: 1–16 beats, denominators 2/4/8/16, and positive whole-number groups that sum to the numerator. Apply commits the draft; Cancel or Escape discards it. Custom meters and groupings persist with settings.

BPM always counts quarter notes, including in /2, /8, and /16 meters; older saved tempo-unit preferences normalize to quarter notes. Meter changes keep the numerical BPM and stop playback; Play restarts bar 1. Old settings migrate to N/4. Subdivision notation represents 1–13 clicks per written denominator note (half, quarter, eighth, or sixteenth), not per accent group. Group-pulse-only playback is also available; Subdivision Trainer temporarily overrides it while enabled. All trainer intervals count complete bars. Spoken sounds count group starts and use quiet subdivision samples within groups. Polyrhythm retains its independent pulse-A tempo and preserves the standard meter while trainers are paused. Meter settings are included in version-5 saved preferences.

Note-list Up/Down/Home/End keys browse choices and Enter/Space selects. Selection or Escape closes the list and restores focus; outside taps, page scrolling, and disabling the trainer also dismiss it. Static notation uses the licensed Bravura notehead SVG outline, without a runtime music font. The `mockups/subdivision-notation-lab/` and `mockups/meter-lab/` remain isolated for comparison; production imports neither.

Wheels use direct horizontal dragging at 24 px per step, with momentum after release and a gentle settle to the nearest integer. Grab a rolling wheel to stop or reverse it at its current position. Numbers update as they cross the center, and parent acknowledgments preserve the fractional position and momentum; pointer release, blur, and capture loss retain the current value instead of restoring the drag's starting value. Only explicit external settings changes reset the controller. There is no direction lock, velocity-dependent detent, range-specific sensitivity, short-flick timing rule, or trackpad-tail filter. A 3 px tap tolerance distinguishes opening exact entry from dragging without delaying wheel movement. Mouse/trackpad scrolling retains all native movement and momentum events, then settles after 140 ms of inactivity. Arrow/Page/Home/End keys and inset minus/plus buttons provide exact steps and stop ongoing momentum. Tap the number (or press Enter / a digit) to type an exact integer; Enter/blur saves, Escape cancels the edit, invalid/empty input keeps the prior value, and values clamp to the supported range. Normal Escape stops wheel motion at its current value. The existing wheel widths and trainer/timer columns stay unchanged; heights remain 44.2 px regular and 37.4 px compact (15% shorter). Touch dragging is horizontal, leaving vertical page scrolling and pinch zoom available. One animation loop owns dragging, momentum, and settling; no CSS transform transition replays the final motion. Reduced motion skips coasting and settling animation. Settings update at most once per rendered frame when an integer changes, following the existing audio-engine bar-boundary rules. Idle wheels run no animation loop. Memoized cylinder faces avoid rebuilding grip geometry on unrelated playback renders. Grip ridges rotate in their own perspective container and share one mask per wheel instead of 29 individual masks. The 3D number faces remain separate. Opening and closing use the same 180 ms ease-out so both directions respond promptly; reduced-motion preferences disable the transitions. The independent `mockups/trainer-controls-lab/` and `mockups/trainer-card-studio/` studies remain available for review; production imports no mockup code or assets.

`drum-tuner-prd.md` describes a separate future native iOS concept; it is not part of this web app.
