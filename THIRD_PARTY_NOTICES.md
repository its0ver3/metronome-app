# Third-party notices

## Bravura subdivision notehead

The musical subdivision UI contains the black notehead outline (uniE0A4)
from Bravura, copyright © 2015 Steinberg Media Technologies GmbH, with Reserved
Font Name "Bravura". Distributed under the SIL Open Font License 1.1.
The complete license is retained in `src/assets/notation/OFL.txt`.

Source: https://github.com/steinbergmedia/bravura/tree/master/redist

## Phosphor Icons

The Metronome rhythm readout and tap-tempo interface use Phosphor Icons.

MIT License

Copyright (c) 2023 Phosphor Icons

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Versilian Community Sample Library (VCSL)

The production app and standalone audio mockups contain edited cowbell, hi-hat,
and woodblock samples from the Versilian Community Sample Library. The mockups
also retain the evaluated cajón samples. The woodblock sample is used quietly
beneath the spoken-count options.

Source: https://github.com/sgossner/VCSL

Creative Commons Zero 1.0 Universal (CC0-1.0)

## FreePats World Percussion

The production app and standalone audio mockups contain edited egg-shaker and
tambourine recordings from the FreePats World Percussion sound bank.

Source: https://github.com/freepats/world-percussion

Creative Commons Zero 1.0 Universal (CC0-1.0)

## Piper count voices

The production app and standalone audio mockups contain generated male and
female count samples created with the Piper text-to-speech engine. The John and
Kristin model cards identify their source recordings as public domain.

Sources:

- https://github.com/rhasspy/piper
- https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/john/medium
- https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/kristin/medium

Piper and the piper-voices repository are distributed under the MIT License.
Generated voice masters receive gentle whole-word pitch balancing before the
pitch-preserving tempo variants are rendered.

The added “and” takes use those same John/Kristin models, generated offline with
OHF-Voice Piper 1.8.0 (GPL-3.0; engine and models are not distributed with the app).
They retain natural inflection, with gentle whole-word pitch balancing and level
matching to the existing counts. Sources are retained in `scripts/audio-sources/`;
`scripts/prepare-and-voices.py` renders the five pitch-preserving tempo variants.
