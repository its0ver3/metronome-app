# Subdivision notation study

Local, disposable prototype: `/metronome-app/mockups/subdivision-notation-lab/`.
All new UI, state, font assets and styling live in this folder. Remove this folder
to discard the experiment. No production components, settings storage, routes,
dependencies, or build configuration are changed.

Notation / Numbers changes the representation without changing the selected
subdivision. Metronome / Practice tools previews the two contexts. The trainer
has two editable stages; bar counts keep the existing number wheel. All 1–13
subdivisions are available by scrolling the note selector. Play auditions the
selection using a separate instance of the existing AudioEngine, without loading
or saving production preferences. Pattern edits stop the preview, while tempo
can change live. Switching screens, hiding the tab or leaving stops playback.

Bravura (unmodified WOFF), Steinberg, SIL Open Font License 1.1: see `OFL.txt`.
Source: https://github.com/steinbergmedia/bravura/tree/master/redist
SMuFL black notehead: https://smufl.formats.music/latest/tables/noteheads.html
The noteheads use U+E0A4; stems and beams are simple SVG engraving geometry.
One group represents one quarter-note beat: 1 quarter, 2 eighths, 3 eighth-note
triplets, 4 sixteenths, 5–7 sixteenth-note tuplets, 8 thirty-seconds, and 9–13
thirty-second-note tuplets. Tuplet ratios are N:2, N:4, or N:8 respectively.
These are even subdivisions, not swing or accent patterns.
