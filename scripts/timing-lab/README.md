# Digital audio timing measurement

Build an isolated test surface, then serve it without hot reload:

```sh
npx vite build --config scripts/timing-lab/vite.config.js
python3 -m http.server 4179 --bind 127.0.0.1 --directory tmp/timing-static
```

Open `http://127.0.0.1:4179/scripts/timing-lab/index.html?label=after` and press Start. Keep the browser visible. The default run lasts ten actual minutes at 137 BPM with Classic Click; it is not an accelerated simulation. The page prints a summary and the raw rendered frame / scheduled-time arrays when complete. Copy the JSON from the result if retaining a new run. Stop is available for cancellation; a cancelled run must not be reported as a completed ten-minute run.

Query options:

- `baseline=1`: use the frozen, pre-change AudioEngine/SoundBank/constants in `docs/audio-timing-evidence/baseline-source/`.
- `fallback=1`: use the current BufferSource scheduler directly, without the worklet bridge.
- `seconds=30&stress=1`: a short fault-injection run that blocks the main thread for 200 ms every two seconds. Run this only in the test page; it deliberately makes the interface briefly unresponsive.
- `label=before` or another label: included in the output for recordkeeping.

The observer AudioWorklet watches a silent branch of the engine's gain output. It records threshold-crossing frames, with a 200 ms refractory period appropriate for this fixed 137 BPM / single-click test. The normal output branch remains unchanged. Do not use that onset detector to evaluate higher densities, overlapping sounds, or polyrhythm without adapting it.

Phase error is measured relative to the first rendered click and the ideal `60/137` interval. Interval error measures variation between consecutive clicks. The ten-minute window contains 1,370 expected clicks; a scheduled click just after the window is excluded. Browser startup/stop polling can extend total page runtime slightly beyond 600 seconds. Source scheduling metrics are null for the worklet backend, because scheduling takes place in the audio thread; rendered-frame measurements remain available for both backends.

This is a digital timing test, not a microphone recording. It does not measure Bluetooth or speaker latency, physical output dropouts beyond the observer, or the hardware sample oscillator against an independent reference. Test those separately on real target phones. No wake lock or background-playback workaround is included.

For accelerated deterministic regression checks, run:

```sh
node --test tests/audio-scheduling.test.js
```

The harness, archived baseline, and test artifacts are outside the production entry point and are not deployed by the normal app builds.
