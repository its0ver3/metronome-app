# Performance and interaction audit — 2026-09-08

The strongest opportunities are to keep beat updates out of unrelated controls,
reduce first-use voice loading, and shorten the rhythm sheet's dismissal. The
desktop app remained smooth in the measured scenarios; this audit found avoidable
work and interaction delays, rather than a demonstrated audio timing failure.

Audited commit: `a361247`. Production source and dependencies were not changed.
Added an isolated profiling harness and retained its results. The production
build passed, as did all **201 tests**.

## Measurements

Ten-second captures used the actual React components and AudioWorklet in the
Codex in-app browser, Chromium 152 on macOS, at 1280 × 720. Playback volume was
zero, screen flash and trainers were disabled, and captures involved no control
edits. React's production profiling build and test counters add overhead.

| Scenario | Screen renders / 10 sec | Combined wheel renders | React render time, total | Synchronous visual batch, p95 |
| --- | ---: | ---: | ---: | ---: |
| Metronome, 120 BPM, 1 subdivision | 26 | — | 9.7 ms | 1.5 ms |
| Metronome, 300 BPM, 13 subdivisions | 601 | — | 274.5 ms | 1.1 ms |
| Training, 300 BPM, 13 subdivisions | 613 | 4,904 | 221.3 ms | 1.0 ms |
| Settings, 300 BPM, 13 subdivisions | 612 | — | 148.8 ms | 0.8 ms |

All four captures recorded zero long tasks and zero animation-frame intervals
over 25 ms. These durations measure different workloads: React render time
excludes commit and paint; the visual-batch duration includes synchronous React
work, but excludes subsequent painting. Lower per-batch duration at high density
does not mean lower total work.

Female Count's first preparation requested **86 WAV files / 2,441,262 bytes**:
85 voice clips plus a subdivision click. Its `start()` completed in 86.6 ms over
loopback; the retained warmed Classic Click baseline completed in 31.2 ms.
These are individual local observations, not a controlled network comparison
or physical tap-to-sound measurements.

The normal production build contains **344.94 KB JS / 104.76 KB gzipped** and
**101.68 KB CSS / 17.66 KB gzipped**, plus the approximately 36.33 KB worklet.
Its PWA precache contains **211 entries / 6,150.57 KiB**. Precache totals describe
offline installation, not the bytes required before the first screen appears.

Evidence: [saved browser records](performance-audit-evidence/),
[repeatable harness](../scripts/performance-lab/README.md).

## Ranked findings

### 1. Isolate visual pulse state from settings and control rendering

**Highest priority; medium implementation effort. Confirmed by profiling.**

[useAudioEngine.js](../src/hooks/useAudioEngine.js#L42) updates subdivision state,
creates a new gap-status object on every standard pulse, and updates flash state
even when flashing is disabled. Its `flushSync` batch reaches
[AppShell](../src/components/layout/AppShell.jsx), which owns every active screen.
Most handler props are new functions each render. Settings and Training therefore
render roughly 60 times per second in the dense case, including disabled wheels.

At 300 BPM the main orbit changes beat only five times per second, yet
[RhythmArc](../src/components/metronome/PolyrhythmOrbit.jsx#L43) recomputes all SVG
paths on about 60 renders per second. The detail sheet needs subdivision updates
when open; the static settings controls do not.

Separate configuration, slow playback status, and frame-sensitive beat state.
Subscribe the orbit, open accent sheet, and flash directly to the state each
needs. Keep gap/status object identity when its values are unchanged. Stabilize
handler props and memoize Settings and unaffected trainer/control subtrees.
Cache orbit geometry by meter/count, independently of its active segment.
Suspend hidden mini-orbit rendering after the dock finishes collapsing.

Keep output-clock scheduling and immediate visual attacks. Removing `flushSync`
globally could regress the synchronization already verified in
[the visual timing report](visual-audio-sync-update.md). Narrow the work inside
the synchronous boundary. React documents both the cost of
[flushSync](https://react.dev/reference/react-dom/flushSync) and the need for
unchanged props to benefit from [memo](https://react.dev/reference/react/memo).

**Acceptance:** untouched Settings controls and inactive trainer wheels stop
rendering per beat; subdivision indicators still update when visible; trainer
status changes at the right bar; existing visual-sync and recovery checks pass.

### 2. Load voices progressively and make pending playback explicit

**High priority; medium effort. Request volume and control behavior confirmed.**

[SoundBank._loadVoice](../src/audio/SoundBank.js#L209) prepares all five tempo
tiers, counts 1–16, and “and” before marking the voice ready. Even a four-count
count-in waits for this entire bank.
[AudioEngine.start](../src/audio/AudioEngine.js#L298) awaits it before reporting
playing, while the transport exposes only Start/Stop. A slow load has no visible
pending state, and another tap starts another generation instead of clearly
cancelling pending playback. Start/preview failures also lack user-visible
recovery feedback. These are source-confirmed paths; slow-network and failure
UX were not fault-injected in this audit.

Prepare the required tier/counts first, then prefetch upcoming trainer tiers and
likely tempo changes. Loading one complete tier requires 17 voice clips rather
than 85, before further count-specific reductions. Retain a defined readiness
policy for live tempo/meter changes. Add immediate “Loading sound…” feedback,
cancellable startup, and a retryable error state. Make preview requests
latest-selection-wins so an earlier delayed preview cannot play afterward.

**Acceptance:** no duplicate starts or stale previews during delayed requests;
count-ins start with the correct voice; tier changes never substitute unintended
clicks; pending playback can be cancelled. Verify with a cold cache and an
explicitly throttled connection on a target phone.

### 3. Send only newly needed PCM to the worklet

**Medium priority; medium effort. Redundant transfer path confirmed; stall impact unmeasured.**

[BrowserAudioEngine](../src/audio/BrowserAudioEngine.js#L87) serializes the entire
loaded bank at every new start. Its live sound setter also posts the entire bank,
including when switching to an already-loaded synth. Each voice contains about
4.83 MB of decoded Float32 PCM at 48 kHz, calculated from the actual WAV durations.
Once both voices are loaded, a bank message includes roughly 9.66 MB of voice
PCM alone. This is copied across threads; it is not a fresh download.

Track per-renderer loaded sound IDs and send bank deltas for live selection.
Initialize new renderers with only the active voices and count-in dependencies.
Preserve the main-thread AudioBuffers used by previews and fallback playback;
blindly transferring their underlying arrays is not a safe shortcut. Ensure the
new sound's bank arrives before switching the renderer to it.

**Acceptance:** a warmed synth switch sends no voice PCM; cold selection sends
only missing sounds; restarting after context replacement rebuilds the required
bank correctly. Measure message/copy duration on phones before claiming a speedup.

### 4. Remove per-quantum session serialization from the audio thread

**Medium priority; small-to-medium effort. Confirmed by an accelerated call-count probe.**

Every render block invokes the shared scheduler, which calls
[_publishSession](../src/audio/AudioEngine.js#L250). That constructs an object
and JSON-stringifies it just to discover that nothing changed. At 48 kHz with
128-frame blocks, the retained probe counted **3,755 snapshots/stringifications
in ten simulated seconds**, with the timer off, producing only five changed
session notifications.

Publish on session/bar/count-in transitions and visible countdown-second changes.
Keep exact cutoff checks on every audio block; those checks are necessary.
Replace JSON change detection with explicit scalar comparisons where appropriate.
This reduces avoidable audio-thread allocation; it has not been shown here to
cause audible glitches. Avoiding allocation in the render path also follows
[Chrome's AudioWorklet guidance](https://developer.chrome.com/blog/audio-worklet-design-pattern).

**Acceptance:** the probe's snapshot work drops to meaningful status changes,
while minute/bar cutoffs, count-ins, and recovery retain existing timing results.

### 5. Shorten rhythm-sheet dismissal

**High value for perceived responsiveness; small effort. Source-confirmed delay.**

[MetronomeScreen](../src/components/metronome/MetronomeScreen.jsx#L117) waits
**440 ms** after Done before unmounting the sheet and restoring access/focus to
the main controls. The CSS also uses 440 ms for entry/exit, versus 180 ms for
trainer-card reveals. This is an intentional interaction delay, not slow rendering.

Try a 200–240 ms dismissal, preserving the stationary focus treatment that fixes
Safari scrolling. Keep opening slightly softer if it benefits orientation.
Use animation completion with a fallback timer for cleanup and preserve reduced
motion. Recheck drag dismissal and focus restoration on iPhone Safari.

**Acceptance:** the main controls become usable within the chosen dismissal
duration, without a viewport jump, premature focus movement, or stuck backdrop.

### 6. Optimize delivery after the interaction work

**Lower priority; small-to-medium effort. Build/source findings, not network benchmarks.**

The main JavaScript is reasonably compact compared with the voice library.
Prioritize the audio assets before a broad code-splitting project. Both voice
directories together contain approximately 4.84 MB of WAV files and dominate
offline-cache installation. Preserve the app's promised offline library if
changing the caching strategy: alternatives include packing files to reduce
request overhead or explicitly completing optional sound downloads after the
core is ready. Compression requires audio-quality and decoder-cost validation.

[index.html](../index.html#L11) loads an external Google Fonts stylesheet.
Self-host the small set of required WOFF2 weights and include them in the offline
cache to remove that external dependency. Optimize the 152 KB brand logo while
preserving its appearance. Consider prewarming lazy Training/Settings code only
if a production load trace shows parsing as material; avoid adding a delay to
the first tab switch just to improve a bundle-size number.

## What to preserve and what remains unmeasured

The worklet architecture, bounded visual catch-up, late-pulse suppression,
debounced settings persistence, and idle-free wheel animation controller are
already useful foundations. Cylinder faces are already memoized, and ordinary
beat highlights already avoid SVG glow filters. Those are not fresh problems
to solve again.

This audit did not measure physical audio, real-phone touch latency, battery,
thermals, CPU-throttled behavior, or production cold-cache LCP/INP. The isolated
harness omits PWA installation and the external font stylesheet. Its rAF
observations are not display-scanout measurements. Existing Safari/Chrome timing
reports are prior evidence, not fresh tests performed here.

Implement render isolation first, then voice readiness and transfer changes.
The shorter dismissal can be a separate small change. Compare before/after on
iPhone Safari and Android Chrome during wheel drags, tab changes, an open rhythm
sheet, Kit View, combined trainers, and cold voice startup. Set performance
budgets from those device measurements rather than promising a percentage gain
from desktop render counts.
