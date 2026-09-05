# Sound Library Lab

Standalone audio prototype for comparing five shortlisted percussion sounds and separate male and female count voices. It does not import or modify the production metronome audio engine.

Open through the local Vite server at `/metronome-app/mockups/sound-library-lab/`.

## Behaviour under test

- Separate soft, regular, and accent recordings for each percussion palette.
- VCSL hi-hat and cajón recordings selected after direct comparison with FreePats alternatives.
- Three round-robin recordings per role for the FreePats shaker and tambourine.
- Fixed sixteenth-note playback: four clicks per beat in every option.
- Spoken numbers on primary beats in both count modes.
- Quiet woodblock clicks for subdivisions in the count modes.
- Five pre-rendered, pitch-preserving voice tempo tiers spanning 20–300 BPM.
- Every spoken number is gently pitch-balanced as a whole: approximately 95 Hz for the male voice and 137 Hz for the female voice. Natural movement inside each word is preserved, while large count-to-count jumps are reduced so they do not imply accents.
- Spelled-out source text preserves each complete number before tempo compression.
- Sample-accurate Web Audio scheduling with a short look-ahead window.

The prototype voices cover 1–10. The promoted production library extends both voices through 16 and keeps the same five tempo ranges. Bespoke recordings remain a future quality upgrade over generated and offline-compressed speech.
