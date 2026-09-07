# Visual and audio synchronization findings

This document retains the pre-change findings. The recommendations below have now been implemented and remeasured; see the [implementation and verification update](visual-audio-sync-update.md).

The indicators follow the correct musical events, but they are **not precisely synchronized to physical audio output**. Normal desktop updates are close to the browser's estimated output time. Main-thread stalls can delay the visuals by around 200 ms while the audio remains precise. The orbit's 90 ms highlight transition also softens the visual attack.

## Measured results

Four completed thirty-second runs used the production React interface, audio engine, and styles through an isolated test entry point. Each ran at 137 BPM with Classic Click, 4/4 quarter notes, 48 kHz, and screen flash enabled for every click. Stress runs deliberately blocked the main thread for 200 ms every two seconds, fifteen times.

The table measures the first animation-frame callback observing the active orbit segment against **the browser's estimated audio-output time**. Negative means early, positive means late. It measures DOM/style readiness before paint, not physical screen illumination.

| Browser and scenario | Median orbit offset | Latest orbit offset | Latest screen-flash offset |
| --- | ---: | ---: | ---: |
| Chrome 152, main metronome, normal | −4.99 ms | +6.15 ms | +6.88 ms |
| Safari 26.4, main metronome, normal | +10.90 ms | +21.18 ms | +21.64 ms |
| Chrome 152, main metronome, injected stalls | −3.86 ms | **+199.06 ms** | **+199.06 ms** |
| Safari 26.4, Kit View, injected stalls | +11.62 ms | **+173.81 ms** | **+188.81 ms** |

All four runs had **69 rendered clicks, 69 beat events, and 69 flash animations**. Every beat event's audio timestamp matched the corresponding rendered sample onset within one sample (maximum difference 0.010341 ms). No observed orbit updates were lost in these runs; the stressed ones arrived late. No page errors or document-visibility changes were recorded.

During normal playback, the orbit reached full opacity approximately **83 ms after** the first frame that observed its active class. Its CSS specifies 90 ms opacity/filter transitions. The first observed frame can still have the old opacity, so the table does not establish the first physically visible change, and full opacity is not a perceptual-brightness measurement.

## What the code explains

- `src/audio/AudioRenderTimeline.js` emits the same timestamps used to place click samples. The raw sample/event comparison confirms that shared timing in these fixed-tempo runs.
- `src/audio/BrowserAudioEngine.js:73` dispatches received beat events immediately. `src/hooks/useAudioEngine.js:41` translates them into React state. Neither schedules visual presentation against `getOutputTimestamp()` or compensates for the selected audio output route.
- `src/components/layout/DownbeatFlash.jsx:12` starts a fresh flash animation from a React effect when the beat state changes. A delayed callback therefore starts a delayed flash.
- `src/index.css:448` applies 90 ms opacity/filter transitions to the orbit. This produces a gradual highlight instead of an immediate beat attack.

For one concrete Chrome stress event, the beat callback arrived just before the deliberate stall. Its corresponding orbit update was observed 210.6 ms later, approximately 199.1 ms after the browser's audio-output estimate. This is a visual scheduling delay, not an audio drift problem.

## Recommended changes

1. **Give the beat highlight an immediate attack and a smooth release.** Keep the visual styling, but avoid fading into the active beat over 90 ms. Verify normal, Kit View, and mini-player states after the CSS change.
2. **Use an audio-output-clock-driven visual timeline.** Map timestamped beat events to estimated output time with `AudioContext.getOutputTimestamp()`, with a guarded fallback when that estimate is unavailable. The event delivery design may need advance visual cues to hit a target frame; simply delaying already-late callbacks cannot recover missed frames. Handle output-route changes, stop/restart, trainer changes, and polyrhythm explicitly.
3. **Discard stale visual flashes after a stall and restore the current beat.** The page cannot draw new frames while its main thread is blocked. Recovery should show the musically current state rather than replaying a late pulse. Keep audio timing independent of this recovery.

These are recommendations from the measurement. **No production audio or visual behavior was changed in this check.** The new files are the reusable test harness, retained evidence, and this report.

## Physical-device verification

`getOutputTimestamp()` provides an estimated mapping from audio stream position to the performance clock. `requestAnimationFrame()` runs before repaint. Neither measures the physical display or speaker. See [MDN output timestamps](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/getOutputTimestamp), [MDN animation-frame timing](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame), and [audio output latency](https://web.dev/articles/audio-output-latency).

Repeat the test on actual iPhone and Android hardware over HTTPS, with speakers/wired headphones and Bluetooth tested separately. Bluetooth and audio interfaces can change output delay; the estimated offset can differ from physical output. A second device recording the screen and sound together, with audio retained, is useful for spotting perceptible mismatch. Millisecond-level physical claims require a calibrated audio/video recording chain, or a photodiode and audio capture sharing a clock; a screen recording alone is not sufficient.

These runs cover the standard orbit, Kit View orbit, and screen flash at a fixed simple rhythm. The mini-player, detailed subdivision indicators, high-tempo/dense rhythms, polyrhythm, and live trainer transitions have not received separate visual-offset measurements here. They should be included when validating a visual-timeline change. Screen-off playback remains outside scope.

## Reproduction and evidence

- [Build and run the visual/audio harness](../scripts/visual-sync-lab/README.md)
- [Chrome normal raw records](visual-sync-evidence/chrome-normal.json)
- [Chrome stress raw records](visual-sync-evidence/chrome-stress.json)
- [Safari normal raw records](visual-sync-evidence/safari-normal.json)
- [Safari Kit View stress raw records](visual-sync-evidence/safari-kit-stress.json)

Run `python3 scripts/visual-sync-lab/analyze.py` to recompute sample/event correspondence and the principal visual statistics from the raw records. Visual summaries exclude the first two beats so startup output timestamps can settle. A retained pilot (`chrome-pilot-wall-window.json`) used a wall-clock window before the audio device fully started; it is excluded from the table and verification script. The final runs measure thirty seconds on the audio clock from the first beat.

The compiled renderer in this harness is byte-identical to the previously verified production renderer (SHA-256 `23765e2e2678139865043438394293b7eae61ecb02bea455cca5644548c97c30`). Instrumentation wraps callbacks and observes computed styles, so a small measurement overhead is possible. The harness's production CSS also matches the production build. No deployment was performed.
