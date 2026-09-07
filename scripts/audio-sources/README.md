# Spoken “and” source takes

`and-male.wav` and `and-female.wav` are the unprocessed John/Kristin Piper takes
retained from the subdivision audition. The rejected refined-number experiment
has been removed. Its flattened pitch contours and envelope compression are not used.

Run `scripts/prepare-and-voices.py` with Python, numpy, scipy, soundfile,
praat-parselmouth and FFmpeg installed. It writes only the ten production `and.wav`
tempo variants. It never rewrites counts 1–16.

The male take already lies close to the established 95 Hz center and is left at its
natural pitch. The female take is gently shifted as a whole toward 137 Hz while
retaining its internal inflection. Both are level-matched to the current voice's
corresponding tempo tier. Pitch-preserving atempo stages stay at or below 2× and
render from the source without clipping word endings to reach the duration limit.

The exact sources are retained to allow rebuilding without regenerating TTS.
See the root THIRD_PARTY_NOTICES.md for model and engine attribution.
