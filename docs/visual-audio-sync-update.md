# Immediate highlights and audio-clock-aligned flashes

Implemented the visual timing changes following the [baseline measurement](visual-audio-sync.md). The orbit and detailed subdivision indicators now have an immediate attack, with the existing release transition retained. Beat indicators and screen flashes use an output-clock presentation queue, independent of audio rendering.

## Behavior

- `VisualTimeline` maps beat timestamps through `AudioContext.getOutputTimestamp()`. When that API cannot provide a usable timestamp, it uses the context clock and reported processing/output latency. It re-evaluates the mapping each frame so queued events follow output-route changes.
- React commits the selected beat events together within the presentation frame. The flash starts in a layout effect before paint, and its fade-out phase accounts for the elapsed time since the estimated click output.
- Pulses more than 50 ms late are suppressed. After a blocked frame, old flashes are not replayed; the next timely beat lights normally. Pending work is bounded. This does not make it possible to draw while the main thread is blocked.
- A primary downbeat retains priority if several subdivisions or both polyrhythm voices arrive within one display frame. “One only” continues to flash once per bar; “One + subdivisions” remains available. Existing muted-beat and gap-training visual-reference behavior is retained.
- Manual stop clears queued visuals immediately. Automatic completion waits for the final audio deadline to reach the output estimate, allowing the last queued cues to finish. Audio samples still stop at their original render-clock deadline.

## Browser measurements

Four completed thirty-second runs at 137 BPM / 48 kHz used the production components and styles. The updated runs used **One only**, so each uninterrupted run should have 18 downbeat flashes across 69 clicks.

| Scenario | Audio clicks | Downbeat flashes | Suppressed late indicators | Median / latest shown orbit offset |
| --- | ---: | ---: | ---: | ---: |
| Chrome 152, normal | 69/69 | 18/18 | 0 | +9.67 / +19.30 ms |
| Safari 26.4, normal | 69/69 | 18/18 | 0 | +11.86 / +21.10 ms |
| Chrome 152, 200 ms stalls | 69/69 | 15; 3 stale downbeats skipped | 7 | +9.60 / +17.18 ms |
| Safari 26.4 Kit View, 200 ms stalls | 69/69 | 16; 2 stale downbeats skipped | 6 | +11.86 / +35.94 ms |

The orbit reached full opacity in the **same observed frame** in every displayed updated sample. Previously it took about another 83 ms. Every recorded “One only” flash belonged to beat 1. Audio/event correspondence remained within one sample, with maximum difference **0.010341 ms**. There were no recorded page errors or document-visibility changes.

Offsets compare DOM/style readiness in an animation frame with the browser's estimated audio-output time. Positive means late. The updated harness forwards the production React batching callback and observes the commit in that same frame, avoiding an artificial extra frame from the observer. Stress statistics exclude suppressed pulses; they must not be read as proof that every visual pulse was rendered during a stall. The baseline stress run displayed a pulse nearly 199 ms late; the updated behavior suppresses such a pulse.

This establishes display-frame-level scheduling in the tested browsers, not physical screen-to-speaker or Bluetooth synchronization. Actual phones and output routes still require measurement; browser timestamps are estimates and display scanout is outside this test.

## Validation and artifacts

**184 automated tests passed**, including 12 new visual-timeline tests for output latency, route changes, missing APIs, stalls, bounded catch-up, count-in, dense-frame downbeat priority, polyrhythm, stop/restart, interruption, and automatic completion. Both production builds passed. A fresh production origin passed settings toggles, playback with both flash patterns, mini-player navigation, combined trainers, Kit View, and manual stop.

The static measurement build and final production build have identical renderer and CSS hashes:

- Renderer: `677e7d8150feb367e45199433eed25fde7446b9b21957dc2cdea656c07294544`
- CSS: `1f29318a46ec516252d7b82f6cee85d91ea2f6b4aea2885f1efa7f814a0eb2a6`

Raw records: [Chrome normal](visual-sync-evidence/chrome-after-normal.json), [Chrome stalls](visual-sync-evidence/chrome-after-stress.json), [Safari normal](visual-sync-evidence/safari-after-normal.json), [Safari Kit View stalls](visual-sync-evidence/safari-after-kit-stress.json). [Test output](visual-sync-evidence/tests-after.log), [build output](visual-sync-evidence/build-after.log), [Sites build output](visual-sync-evidence/sites-build-after.log).

Use the [visual timing harness](../scripts/visual-sync-lab/README.md) with `&downbeat-only=1` to repeat these measurements. Run `python3 scripts/visual-sync-lab/analyze.py` to verify the retained raw records. The standalone harness also supports the prior every-click flash scenario. No deployment was performed.
