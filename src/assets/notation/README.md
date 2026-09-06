# Subdivision notation

SubdivisionNotation.jsx uses the black notehead outline (uniE0A4) extracted
from Steinberg's Bravura WOFF. Stems and beams are SVG geometry. The outline
matches the approved subdivision-notation-lab prototype, without loading the
full font at runtime. Copyright © 2015 Steinberg Media Technologies GmbH;
Reserved Font Name Bravura. See the unmodified SIL OFL license in OFL.txt.

`gapGlyphs.js` also extracts the whole-bar, eighth, sixteenth, and thirty-second
rests and upward flags from the same Bravura WOFF for the Gap Trainer. The
notation shows one denominator note's duration, or a whole-bar rest for silence.

Source: https://github.com/steinbergmedia/bravura/tree/master/redist

Each notation group represents one written note of the meter denominator.
For /4 meters, counts 1, 2, 4, and 8 use quarter, eighth, sixteenth, and
thirty-second notes. For /8 meters, they use eighth, sixteenth, thirty-second,
and sixty-fourth notes. Other counts use N:2, N:4, or N:8 tuplets. These indicate
even subdivisions within the written note, not swing or meter accent groups.
