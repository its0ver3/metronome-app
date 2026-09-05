# Trainer controls prototype

Open `/metronome-app/mockups/trainer-controls-lab/` on the existing Vite server.

Isolated React entry point with in-memory demo settings. It does not load the app,
audio engine, saved settings, or service-worker registration. It only reuses the
current trainer pictograms and throw-off component/assets as read-only imports.
Delete this directory to remove the prototype; production does not import it.

- Enabled values are compact inline number wheels; there are no pop-up editors.
- Swipe/drag left to bring higher numbers into the centre, right for lower numbers.
  Release snaps the horizontal cylinder; neighbouring numbers peek in at each side.
  Vertical touch gestures can still scroll the page.
- Numbers sit at equal angles on a perspective cylinder, turning away and dimming
  toward its sides. Touch and trackpad movement track fractional turns; release
  settles to a whole number. Reduced-motion preferences disable the settling tween.
- Fine grip ribs rotate with the cylinder, with a smooth central numeral band.
  A fixed square drum-key-style index marks the selected value. Disengaged trainers
  retain a muted charcoal cylinder with faded grip/index details and read-only values.
  Grip fades apply to individual ridges, never their 3D parent, to avoid a perspective
  jump when engagement finishes.
  On screens up to 360px wide, header wheels use the full card width. BPM typography
  reserves space for three-digit neighbours; touch targets remain at least 44px high.
- Click or keyboard-focus a wheel before using mouse/trackpad scrolling. Outside
  the focused control, page scrolling is unchanged. Escape releases focus.
- Arrow keys step by one, Page Up/Down by ten, Home/End jump to the limits.
- Changes apply immediately to demo state; disabled values remain read-only.
- The same wheel handles BPM, bar counts, increments and stage subdivisions.
- Subdivision supports 1–13 clicks per beat, 1–16 bars, and 2–4 stages.

This is a control-interaction study, not an audio playback preview.
