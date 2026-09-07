# Audio scheduling changes and timing verification

The original engine had no meaningful cumulative drift in the ten-minute baseline. Its weakness was delayed clicks when browser work interrupted its JavaScript scheduler. The new AudioWorklet renderer kept click timing within one audio sample during the same injected browser stalls.

## Measured before and after

These are completed, real-time desktop browser runs at **137 BPM**, using Classic Click at a **48,000 Hz** audio sample rate. The baseline was recorded before production audio code was changed. A silent observation branch detected rendered click onsets while leaving the normal output branch intact.

| Test | Original engine | New engine |
| --- | ---: | ---: |
| Ten minutes: rendered / expected clicks | 1,370 / 1,370 | 1,370 / 1,370 |
| Ten minutes: final phase error | +0.018704 ms | −0.002129 ms |
| Ten minutes: largest absolute phase error | 0.020681 ms | 0.010341 ms |
| Thirty seconds with browser stalls: rendered / expected clicks | 69 / 69 | 69 / 69 |
| Browser stalls: largest absolute phase error | **125.454988 ms** | **0.010341 ms** |
| Browser stalls: late BufferSource scheduling calls | 4 | Not applicable; scheduling moved to the audio thread |

The stress test deliberately blocked the browser's main thread for 200 ms every two seconds, fifteen times. The original engine still produced the expected click count but placed some clicks late, followed by short intervals. Counting clicks or checking only the final offset would have missed that problem.

Phase error is each click's offset from its ideal time, relative to the first detected click. One sample at 48 kHz is approximately 0.020833 ms. The tiny errors in the new renderer are consistent with rounding click positions to audio samples. Both normal ten-minute runs were stable; the major improvement is tolerance of browser stalls, not a correction to cumulative BPM drift.

## Changes

- The browser now uses an **AudioWorklet** when available: a small audio processor schedules and mixes clicks on the browser's audio rendering thread. Page animations, React updates, and ordinary main-thread delays no longer have to deliver each click on time. Rhythm, meter, count-in, gap, and trainer rules remain shared with the existing engine.
- The BufferSource fallback schedules **150 ms ahead**, increased from 50 ms. Expired clicks and animations are skipped while logical musical state advances, avoiding a burst of old clicks after a stall. Catch-up work is bounded, and the interface receives the recovered tempo and bar state. A stall longer than its scheduling window can still cause missed clicks; this fallback is less resilient than the worklet.
- Polyrhythm tempo edits preserve any shared cycle that has already started being scheduled. The new tempo begins at the next uncommitted shared cycle, keeping both rhythms aligned.
- Audio-clock deadlines stop sessions and clip sample tails in the renderer. Pending starts, stop/restart generations, ordered live edits, and trainer-to-interface synchronization have regression coverage. An interrupted audio context can be resumed on a subsequent start.

An AudioWorklet changes where timing-critical work runs. It does not require users to install anything or understand a new control.

## Validation

- **168 automated tests passed**, including 14 new scheduling/renderer regression tests. Coverage includes a deterministic ten-minute timeline, overdue scheduling, polyrhythm tempo changes, combined trainers and count-in, session deadlines and sound tails, stereo and voice sample transfer, stale messages, live control edits, and 44.1 kHz rendering with varying block lengths.
- The existing combined-scenario exercise passed 384 scenarios over 3,072 bars, plus 256 polyrhythm ratios.
- `npm run build` and `npm run build:sites` passed. The Sites service-worker precache includes the worklet loader and renderer.
- Browser checks covered start/stop, count-in and automatic completion, all three trainers together, navigation during playback, Kit View and Escape, all nine sound selections during playback, and the final target BPM display. The compiled production app also passed its start/navigation/stop smoke check with no reported browser warnings or errors.
- The isolated static harness used for the completed post-change ten-minute run contained a renderer byte-identical to the final Sites production renderer: SHA-256 `23765e2e2678139865043438394293b7eae61ecb02bea455cca5644548c97c30`. An earlier post-change development run interrupted by hot reload was discarded.

## Limits and remaining device checks

These measurements inspect digital audio samples against the browser's nominal audio sample clock. They do **not** measure physical speaker output, Bluetooth latency, hardware clock accuracy against an independent reference, or end-to-end output dropouts. They also do not establish worst-case behavior on every phone. Actual iPhone Safari and Android Chrome hardware were not tested in this environment.

Before sharing widely, repeat the foreground ten-minute and short stress tests on the target phones, then exercise tempo edits, sound changes, trainers, and timer completion while listening on the intended output route. Use a wired or speaker recording against an independent clock if physical timing accuracy needs to be quantified.

Screen-off and background playback remain outside this change, as requested. This work addresses the audio scheduling scope; it is not a sign-off on every issue in the earlier whole-app audit. No deployment was performed.

## Evidence and reproduction

- [Run the browser timing harness](../scripts/timing-lab/README.md)
- [Before: ten-minute measurement](audio-timing-evidence/browser-before.json)
- [After: ten-minute measurement](audio-timing-evidence/browser-after.json)
- [Before: browser stalls](audio-timing-evidence/browser-before-stress.json)
- [After: browser stalls](audio-timing-evidence/browser-after-stress.json)
- [Accelerated baseline math](audio-timing-evidence/math-before.json)
- [Test output](audio-timing-evidence/tests-final.log)
- [Production build output](audio-timing-evidence/build-final.log)
- [Sites build output](audio-timing-evidence/sites-build-final.log)
- [Original source hashes](audio-timing-evidence/source-before.sha256) and [final audio source hashes](audio-timing-evidence/source-after.sha256)

The archived baseline source and measurement summaries are retained alongside this report. The harness prints full frame arrays for new runs; the saved browser evidence here contains the captured summaries, not those raw arrays. The harness and archived source are outside the production app entry point.
