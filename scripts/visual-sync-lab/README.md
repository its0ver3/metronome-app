# Visual and audio synchronization measurement

This isolated page imports the production React app, audio bridge, worklet, and styles unchanged. Test-only wrappers record beat callback arrival, the first animation-frame callback observing the matching active orbit segment, its opacity ramp, and the screen-flash animation. A silent observer branch captures rendered click onset frames.

```sh
npx vite build --config scripts/visual-sync-lab/vite.config.js
python3 scripts/visual-sync-lab/serve.py
```

Open `http://127.0.0.1:4180/scripts/visual-sync-lab/index.html?label=chrome-normal` in the browser being tested, then click the app's Start button. The run stops and saves JSON in `docs/visual-sync-evidence/` after thirty seconds. Use a new label per run. Add `&stress=1` to inject 200 ms main-thread stalls every two seconds. Enter Kit View before starting to measure that view; use a label such as `safari-kit-stress`. Do not switch tabs during a run. Stop early to mark the result cancelled.

Add `&downbeat-only=1` to test the actual “One only” setting rather than flashes on every click. An uninterrupted 30-second run has 18 downbeats. Use labels containing `-after-` for the immediate-attack/downbeat-only regression assertions in the analyzer. Suppressed stale visual pulses are recorded separately from the rendered audio clicks; under deliberate stalls, fewer visual pulses are expected.

This server binds only to loopback. Its POST endpoint accepts the locally generated measurement JSON and writes it under the chosen alphanumeric/hyphen label. Use a dedicated origin: the page resets that origin's app preferences to Classic Click, 137 BPM, quarter notes, volume 10%, and screen flash enabled for every click. It does not reset settings at the production app's origin.

Negative `*MinusEstimatedOutputMs` means the UI observation was early relative to the browser's estimated audio-output time; positive means late. The estimate uses `AudioContext.getOutputTimestamp()` and may be unavailable on a device. The first two beat events are excluded from visual timing summary statistics to allow startup timestamps to settle. Full records are retained for inspection.

`firstFrame` records a requestAnimationFrame callback that sees the updated DOM/style **before paint**. It does not measure the actual display scanout; the first frame can still have the previous opacity at the start of a CSS transition. `fullOpacityFrame` is a proxy for the orbit transition reaching its target, not a perceptual-brightness measurement. Audio output timestamps are browser estimates, not microphone measurements. This test cannot certify physical speaker/Bluetooth-to-screen alignment. A separate synchronized audio/video or photodiode/audio capture is needed for that.

The window lasts thirty seconds on the audio clock, starting at the first beat. To recompute checks from saved runs, use `python3 scripts/visual-sync-lab/analyze.py`. The analyzer skips files labelled as pilots, and verifies click/event counts and sample correspondence for the fixed test scenario.

The threshold-based audio observer is only suitable for the fixed 137 BPM, one-click-per-beat baseline. Do not change sounds, meter, tempo, trainers, or subdivision during this run and then interpret the audio click-count/phase metrics as valid. A separate scenario-specific observer is needed for those configurations.
