# Local performance audit

Build and serve the isolated app with the existing dependencies:

```sh
npx vite build --config scripts/performance-lab/vite.config.js
python3 scripts/performance-lab/serve.py
```

Open `http://127.0.0.1:4190/scripts/performance-lab/index.html?label=baseline`.
Click Start, then Capture 10 seconds. Keep the page visible and leave the UI
untouched until the result appears. For dense playback use
`?label=dense&bpm=300&subdivision=13`. Capture separately on Metronome, Training,
and Settings. For a voice startup use `?label=voice&sound=8` on a fresh page.
Volume is zero; the actual engine and worklet still run.

The page overwrites this dedicated origin's metronome preferences on each load.
Never host the harness at the production app origin. It runs outside the
production build and does not register the PWA service worker.

Results are displayed on the page and posted to the loopback server, which writes
`docs/performance-audit-evidence/<label>-<screen>.json`. Repeat captures with the
same label and screen replace that file; use a new label to retain comparisons.
The server accepts at most 200 KB per result and only alphanumeric/hyphen labels.

The build uses React's production profiling renderer, a root Profiler, test-only
component entry counters, and a wrapper timing the existing VisualTimeline batch.
Product source files are imported without edits; counters are injected only by
this Vite config. React render durations exclude commit/paint; visual batch
duration measures the synchronous batch including its React work. Neither
measures GPU rasterization or display scanout. Animation-frame intervals and
Long Task observations cover the ten-second capture window. Startup is the
duration of `engine.start()`, not physical tap-to-sound latency. Resource records
can include HTTP cache hits and earlier requests within that page lifetime.

The harness omits the production HTML's external Google Fonts stylesheet and
PWA installation. Use production-device profiling for loading, font layout,
cache-install behavior, touch latency, thermals, battery, and physical audio.
Desktop measurements are not mobile benchmarks. Profiler/counter overhead and
the test overlay are present. Do not compare this instrumented bundle's size
against the normal production bundle as an optimization result.

To reproduce the accelerated worklet session-allocation count:

```sh
node scripts/performance-lab/worklet-session-count.mjs
```

That probe counts calls over ten simulated audio seconds using two-frame fake
samples. It is not a wall-clock performance benchmark or an audio-quality test.
