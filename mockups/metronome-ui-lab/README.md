# Metronome UI Lab

This is a standalone HTML/CSS/JavaScript concept environment. It does not import from or write to the working React app in `src/`.

Open `index.html` directly in a browser. Use the concept switcher or the mobile Previous/Next controls to compare all five directions:

1. Pulse Core — a premium radial performance view.
2. Beat Tide — a fluid bar timeline built from waves, crests, and traveling subdivisions.
3. Rhythm Loom — a tactile woven pattern where beats are strands and accents are knots.
4. Kinetic Poster — a bold typographic direction inspired by animated concert graphics.
5. Soft Utility — a warm, friendly utility layout with tactile controls and inline disclosure.

BPM, meter, subdivision, playback, Tap tempo, and accent state carry between concepts. Tap tempo waits for four taps before changing BPM. The rhythm editor uses familiar meter presets, named subdivision counts, useful accent presets, and an explicit Accent/Click/Soft/Mute paint tool. Pulse Core and the three experimental concepts use a bottom sheet; Soft Utility expands the same editor inline.

Keyboard shortcuts are also available: Left/Right changes concepts, Space toggles playback, `T` taps tempo, and Escape closes an open rhythm sheet.

The mockup deliberately uses synthesized visual timing rather than the production audio engine. It is intended for evaluating hierarchy, interaction, visual identity, and mobile usability before implementation decisions are made.

## Selected direction

Pulse Core is now the selected production direction. Its hierarchy and disclosure model have been adapted into the real React Metronome screen, but this lab remains an independent historical comparison environment. Production continues to use its broader beats/subdivision model, trainers, persistence, polyrhythm, accent values, and Web Audio timing; the lab's meter model and timer were not copied into the app.
