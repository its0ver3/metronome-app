# Chrome and Safari audio checks

This isolated harness imports the production browser audio engine and sound files. It exercises native AudioContexts, worklets, decoded samples, session completion, real context suspension/closure, and a deliberately rejected worklet module. It does not change the production entry point or the user's saved app settings.

```sh
npx vite build --config scripts/browser-checks/vite.config.js
python3 scripts/browser-checks/serve.py
```

Open `http://127.0.0.1:4182/scripts/browser-checks/index.html?label=chrome-recovery` in Chrome, or use `label=safari-recovery` in Safari. Click **Run browser checks** and keep the page visible for about a minute. When prompted, click **Restart after closed audio context**. That final restart deliberately uses a new user gesture so the browser's real autoplay rules apply.

Results appear on the page and are saved in `docs/browser-check-evidence/`. A run is complete only when `completed` is true and all checks pass. Failures stop the run and retain the failed check. Runtime errors are recorded separately. A fresh page is required to repeat a run.

The first test measures 69 expected clicks over 30 seconds at 137 BPM while blocking the main thread for 200 ms every two seconds. Phase error must remain within one audio sample. The remaining audio checks assert signal presence and lifecycle behavior, not musical correctness for every possible configuration; deterministic engine tests cover that separately.

The observer uses a silent branch of the engine output. Normal playback remains audible at 8% volume. These measurements cannot detect physical speaker/Bluetooth dropouts or validate iPhone/Android OS interruptions. UI interactions and real-phone testing remain separate checks.

The server binds only to loopback and accepts labelled JSON results under a fixed directory. The harness and its test-only fault injection are excluded from the normal production builds.
