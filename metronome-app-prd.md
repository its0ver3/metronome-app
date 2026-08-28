# Drums Only Metronome — Current Product Specification

## 1. Status and product goal

This document describes the implemented web app. Drums Only Metronome is a mobile-first metronome designed to help drummers practise. It includes optional training routines and a polyrhythm mode, but it remains a focused metronome rather than a broader practice platform.

The commercial goal is to sell branded versions to local drum shops. Each shop should be able to offer the app under its own identity without changing or forking the metronome, training, or audio code. Drums Only is the current reference brand.

The overarching plan is:

1. Finish and validate the core metronome experience.
2. Parameterize the remaining shop-specific metadata, icons, hosting, and deployment settings.
3. Create a repeatable process for producing and maintaining a branded shop version.
4. Pilot the offer with local drum shops before expanding it.

The primary target is iPhone-sized portrait viewports. Tablet and desktop users receive the same app inside a centered phone-sized frame.

The current navigation contains exactly three screens:

1. Metronome
2. Training
3. Settings

Setlists, Journal, and Groove are removed from the current product. Reintroducing any of them requires a new product and interaction design rather than restoring the previous implementation.

## 2. Technical shape

| Layer | Current implementation |
|---|---|
| UI | React 19 |
| Build | Vite 6 |
| Styling | Tailwind CSS 4 plus global CSS |
| Timing and sound | Web Audio API with a 25 ms scheduler check, a 50 ms audio scheduling horizon, and visual events deferred to the audible timestamp |
| Settings persistence | `localStorage` |
| Distribution | Static PWA build with manifest and generated service worker |

There is no backend, account system, authentication, or cloud sync. The audio engine owns playback timing and mode state; React receives callbacks and renders the current snapshot.

On browsers that require it, including iOS Safari, the audio context is created or resumed from the user's playback or preview gesture.

## 3. Shared application shell

- The phone layout is edge-to-edge at widths up to 640 px and uses `100dvh` with a `100vh` fallback.
- iPhone top, left, right, and bottom safe-area insets are respected.
- The desktop frame is capped at 430 × 932 px.
- The bottom navigation exposes the three current screens and identifies the active screen semantically.
- Training and Settings show a persistent transport with the current mode, BPM or bar/beat state, active trainer summaries, a start/stop control, and a shortcut back to Metronome.
- Metronome omits an idle title/status row so the tempo surface begins immediately below the shared brand mark. Active trainer ownership appears through compact chips only when needed.
- Metronome, Training, Settings, the persistent transport, and bottom navigation share the Pulse Core surface, typography, spacing, and control language.
- A compact Drums Only mark remains in the shell. The mark, palette, and fonts come from the active brand definition rather than metronome feature code.

## 4. Metronome screen

### 4.1 Tempo and transport

- Default tempo: 120 BPM.
- The slider and numeric BPM display use one 20–300 BPM range in whole-number steps.
- `+` and `−` change tempo by one BPM.
- Tap tempo waits for four taps before changing BPM, then refines the result using up to the five most recent taps while the session remains active. Five seconds without input expires the session, so the next tempo requires four fresh taps. The elapsed-time check occurs on input as well as through an idle timer so mobile timer throttling cannot reuse stale taps.
- Start/stop is available as a central, distance-readable control without overpowering the BPM hierarchy.
- The main Pulse Core view combines a large BPM orbit, one-BPM nudges, the full 20–300 slider, compact beat indicators, and two evenly divided quick actions. Tap Tempo retains its short text label. The rhythm action uses an icon-led count readout: standard mode pairs beats per bar with a metronome icon and clicks per beat with a notes icon, while Polyrhythm shows distinct A and B pulse counts. Its accessible name announces the full meaning, and it opens the complete rhythm sheet in either mode.
- Standard and Polyrhythm modes share one discrete visual language: evenly spaced orbit segments and fixed-position circular indicators illuminate from the audible beat state. Standard divides the full circle by its beat count; Polyrhythm divides the upper and lower halves by the independent R1 and R2 pulse counts.
- The orbit segments are direct accent controls with mobile-sized hit regions and keyboard activation. Annular wedges sit on a recessed track and cycle Off → On → Accent, visibly rendering those states as hollow → inner-half depth → clean full-depth solid fill without edge outlines. Segment divisions are straight slot-style gaps with parallel opposing faces; there is no separate cycle-origin dot. Audible-time playback feedback changes only brightness and glow without shifting the ring. A standard segment applies its chosen state to every subdivision click inside that beat; the detailed Rhythm sheet remains available for individual-click edits. Polyrhythm segments address their corresponding R1 or R2 pulse, and both modes remain synchronized with the detailed Rhythm sheet.
- Standard mode and Polyrhythm Rhythm 1 communicate tempo through a continuous gradient: blue at 20 BPM, green at 110, yellow at 200, red at 290, and a smoothly warming fire base through 300. Polyrhythm Rhythm 2 uses a contrasting cool-violet identity in both its orbit and compact indicators so the voices remain visually distinct. At 291–300 BPM, Rhythm 1 uses the warm animated fire treatment while Rhythm 2 uses a separate cool blue-flame treatment. The slider reveals the primary tempo gradient from its left edge to the thumb while the remaining range stays muted.
- Beat 1 uses a brighter synthesized companion of the selected click sound. It marks each return to the start of a standard measure and both voices' shared polyrhythm cycle boundary; an explicitly muted first pulse remains silent.
- The orbit is a view of audio-timed React state; it does not create or own a second playback clock.

Keyboard shortcuts work while focus is not inside an interactive control:

- Space: start or stop
- Up/Down Arrow: add or subtract one BPM
- T: tap tempo

### 4.2 Beat structure and accents

- Beats per bar: 1–16.
- Subdivisions per beat: any whole number from 1–13.
- Every scheduled click can be tapped to cycle through Off, On, and Accent. Accent is the loudest state.
- Tapping a standard orbit segment cycles the beat's main click through On and Accent without flattening its subdivision dynamics or detailed pattern edits. Choosing Off silences the complete beat and all its subdivisions; re-enabling that beat restores all its clicks to On. Tapping an individual marker in the Rhythm sheet changes only that scheduled click.
- The first click of each beat is initialized as Accent; the remaining subdivision clicks are initialized as On.
- Dense beat grids paginate in groups of four beats and support touch swiping; the active page follows playback.
- Visual state continues during Gap Training silence.
- Beats, subdivision, standard accents, polyrhythm voices, sounds, and polyrhythm accents are edited in the scrollable Rhythm sheet. The primary screen remains uncluttered without removing those controls.

The metronome does not model a time-signature denominator. `beats per bar` and `subdivisions per beat` are the actual current controls.

### 4.3 Click sounds

The app synthesizes eight click voices in the browser:

- Classic Click
- Woodblock
- Rimshot
- Cowbell
- Hi-Hat
- Electronic Beep
- Soft Tone
- Stick Click

Settings provides a compact two-column sound selection grid with immediate preview and a 0–100% master volume control.

### 4.4 Polyrhythm mode

- Two rhythms can each be set from 1–16 pulses.
- Each rhythm has its own synthesized click sound and per-pulse accent pattern.
- Rhythm 1 defines the cycle duration at the selected BPM; Rhythm 2 is distributed evenly over that same cycle.
- Changing polyrhythm mode or either pulse count stops current playback before the configuration changes.

Polyrhythm is an exclusive playback mode. Trainer configuration is preserved but paused while it is active, and the Training screen explains that state. Leaving Polyrhythm restores the Tempo Trainer start BPM and the first Subdivision Trainer stage when those trainers are enabled.

## 5. Training screen

All three trainers can be enabled together and share the standard metronome timeline.

Each trainer is presented as a focused Pulse card with its own explanation, switch, and configuration. When Polyrhythm mode pauses training, the saved cards remain readable while their controls use native disabled behavior.

### 5.1 Gap Training

- Alternates audible and silent phases indefinitely.
- Audible bars: 1–16.
- Silent bars: 1–16.
- Changing the configuration resets the phase to the audible portion.
- The playback status reports whether the current phase is Click or Silent.

### 5.2 Tempo Trainer

- Start and target: 20–300 BPM.
- Increment: 1–20 BPM.
- Interval: every 1–32 bars.
- Supports increasing and decreasing routines.
- Tempo changes occur only at bar boundaries and clamp at the target.
- Reaching the target ends further tempo changes; metronome playback continues at the target.
- Enabling or editing the trainer while stopped sets the metronome to the configured start BPM. During playback, the new start takes effect at the next bar boundary.

While Tempo Trainer owns tempo in standard metronome mode, direct BPM entry, slider, `+`/`−`, Tap, and their global keyboard shortcuts are disabled. This prevents the same state from being changed through a secondary path.

### 5.3 Subdivision Trainer

- Cycles continuously through two to four user-configured stages.
- Each stage chooses a subdivision from 1–13 and lasts 1–16 bars.
- The current stage and bar are shown during playback.
- Enabling the trainer while stopped applies Stage A immediately; enabling or editing it during playback applies the relevant change at a bar boundary.

While Subdivision Trainer owns subdivision in standard metronome mode, the main subdivision selector is disabled.

## 6. Mode ownership and transitions

The app uses one audio engine and one shared BPM value. To keep interactions predictable:

| Active mode | Owns playback | Preserved but inactive |
|---|---|---|
| Standard Metronome | Beat/subdivision click and any enabled trainers | Polyrhythm setup |
| Polyrhythm | Two polyrhythm voices | All trainer setup; standard beat/subdivision setup |

Mode changes stop playback before the new mode becomes active. Configuration is not silently discarded. Playback must then be restarted by the user in the newly selected mode.

## 7. Persistence

Metronome settings are saved after a 500 ms debounce and include:

- BPM, click sound, volume, beats, subdivision, and subdivision accents
- All Gap, Tempo, and Subdivision Trainer settings
- Polyrhythm enabled state, counts, sounds, and accents

Saved settings are applied while the audio engine is constructed, before the first interactive render. The current runtime contains no IndexedDB adapter. Previous Preset, Setlist, Journal, or Groove records in an existing browser are not actively deleted, but the app no longer opens, reads, or writes those stores.

## 8. Brand and reseller architecture

Drums Only is the active identity in this build. `src/brand/drumsOnly.js` supplies the product name, accessible logo, branded range-thumb asset, colors, and fonts through a validated, frozen contract. `PhoneFrame` converts that contract to semantic CSS custom properties.

Metronome, Training, Settings, and the audio engine do not import the Drums Only definition. A future independent drum shop can provide a new definition and select it at the shell boundary without forking feature or playback code.

The following remain Drums Only-specific until a reseller build pipeline is added: document title, PWA manifest metadata, public app icons, Apple touch icon, public brand images, deployment base path, and the existing settings storage namespace. See `BRANDING.md` for the exact boundary. The storage key must not change without a migration.

## 9. Mobile and accessibility requirements

The current UI baseline includes:

- Viewport zoom remains available; `viewport-fit=cover` supports modern iPhone safe areas.
- Primary controls, navigation items, range inputs, switches, and beat/accent targets are designed around a 44 px touch area.
- Form controls have programmatic labels; trainer toggles use switch semantics; disabled ownership states use native disabled controls.
- Play/stop, Tap, accent buttons, page selectors, and navigation expose accessible names and current states.
- Keyboard focus has a visible high-contrast outline.
- Global keyboard shortcuts ignore focused inputs, selects, buttons, links, sliders, and switches.
- Scrollable screens hide the decorative scrollbar while preserving scrolling.
- The Rhythm sheet uses dialog semantics, moves focus inside on open, contains keyboard focus, closes with Done/backdrop/Escape, restores the opening control, and makes surrounding app controls inert while open.
- Pulse motion respects `prefers-reduced-motion`.

These are implementation requirements, not a claim of formal WCAG certification. Keyboard, VoiceOver, zoom, and common iPhone viewport checks should remain part of release testing.

## 10. Current exclusions

- Setlists
- Journal, practice history, and analytics
- Groove editor, sequencer, and notation preview
- Visible preset management
- Accounts, login, cloud sync, or multi-device state
- Dark/light theme switching; the app currently has one dark theme
- User-provided audio samples
- MIDI, Ableton Link, recording, or haptics
- Native iOS or Android builds

The native iOS drum-tuner concept in `drum-tuner-prd.md` is a separate future product and is not part of this specification.

## 11. Release acceptance checks

| Area | Pass condition |
|---|---|
| Tempo ownership | Enabling Tempo Trainer disables every direct tempo path in standard mode, including Tap and keyboard shortcuts |
| Trainer combination | Gap, Tempo, and Subdivision trainers can be enabled together and their states are all visible in playback status |
| Mode preservation | Entering Polyrhythm stops playback without clearing configured trainers; returning to standard mode restores trainer-owned values |
| Persistent transport | Playback can be started or stopped from Training and Settings, and its summary matches Metronome |
| Dense metronome layout | 16 beats and subdivision 13 remain usable through paging/scrolling without page-level horizontal overflow on supported mobile widths |
| Pulse presentation | Orbit and beat progress use audio-timed engine callbacks; BPM editing and all playback controls continue to call the existing engine handlers |
| Rhythm sheet | Standard accents and all polyrhythm controls remain reachable; focus is contained and restored; the sheet scrolls independently |
| Brand boundary | Changing the active runtime brand does not require edits to metronome, trainer, settings, or audio modules |
| Persistence | After a saved change clears the debounce interval, refresh shows and plays the restored metronome, trainer, and polyrhythm settings without first exposing defaults |
| Mobile shell | Current iPhone portrait sizes render edge-to-edge, respect safe areas, and keep bottom navigation reachable |
| Accessibility smoke check | Primary controls have accessible names and states, disabled controls are not interactive, focus is visible, and keyboard shortcuts do not hijack focused controls |
| PWA build | The production build emits a valid manifest, 192 px and 512 px square icons, and a service worker with the configured `/metronome-app/` base path |
