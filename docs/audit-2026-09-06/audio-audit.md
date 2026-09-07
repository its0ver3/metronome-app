# Audio and trainer audit

Scope: AudioEngine, SoundBank, meter/grouping/accent timing, gap/tempo/subdivision trainers, count-in and session stops, polyrhythm scheduling, engine/UI call sites. Production source unchanged.

## Verified findings

### P1 — Changing tempo during polyrhythm playback rewinds scheduled time
- Source: `src/audio/AudioEngine.js:765`, `:775`, `:785`; live BPM setter `:387`.
- Reproduce: play 3:4 at 120 BPM and raise tempo to 300 about 0.60 seconds into a cycle. BPM controls remain enabled in polyrhythm (`AppShell.jsx:289`).
- Deterministic result: at current audio time 0.60 the scheduler asks to play three new notes at 0.40, 0.30, and 0.45 seconds, then schedules both new-cycle downbeats at 0.60. Existing `_polyCycleStart` is reused with an entirely new cycle duration. Decreasing tempo stretches the partially completed cycle instead.
- Impact: irregular rhythm precisely while users adjust tempo; queued notes in the past will not retain their intended spacing. This also compromises cycle-based session timing around tempo changes.
- Fix: commit poly tempo changes at the next cycle boundary, or preserve current cycle phase and explicitly re-anchor future beat times without moving any beat into the past. Add live increase/decrease tests at each beat position and with session bar limits.

### P1 — A delayed scheduler replays every missed click in one batch
- Source: `src/audio/AudioEngine.js:753`–`:757`; same missing lower time bound in count-in `:725` and poly `:775`/`:785`.
- Reproduce: at 120 BPM with subdivision 4, schedule initially, advance the clock by 2 seconds without scheduler callbacks, then run one scheduler callback.
- Deterministic result: 15 notes are scheduled with past times 0.125 through 1.875 in one synchronous callback. There is no late-note or catch-up policy.
- Impact: a stall or delayed background timer can produce a burst rather than steady playback; dense/high-BPM combinations also create many stale sources and visual callbacks. The exact probability and audible behavior on specific devices was not measured here.
- Fix: detect a missed scheduling window, advance logical beat/bar/trainer state without sounding expired notes, resume on a future grid point, and bound catch-up work. Exercise 100ms/2s/long background delays and all session modes. A worker clock or larger configurable scheduling horizon can reduce stalls but does not replace recovery.

### P2 — An already interrupted audio context cannot be resumed by Start
- Source: `src/audio/AudioEngine.js:204`–`:213`, early exit `:300`, later interruption handling `:309`.
- Reproduce: provide an existing audio context whose state is `interrupted` and whose `resume()` succeeds, then call `_unlockAudio()` or Start.
- Deterministic result: `_unlockAudio()` returns false without calling resume. Start exits at line 300 before reaching its interrupted-state recovery block.
- Impact: if a device/browser leaves the context interrupted, a subsequent Start gesture does not recover playback. Hardware call/lock/audio-route interruptions remain to be tested; this audit proves the code path, not the frequency on any platform.
- Fix: handle interrupted and suspended states together on user activation, surface resume failures, and listen for context-state changes so transport reflects actual playback. Regression-test suspended/interrupted/running/closed cases.

### P2 — One unavailable, unused voice file silently prevents ordinary playback with count-in
- Source: `src/audio/SoundBank.js:209`–`:224`, `AudioEngine.js:307`, `AudioEngine.js:382`–`:384`; preview also propagates failures through `AppShell.jsx:160` to `SoundSelector.jsx:21`–`:24` without a catch.
- Reproduce: default 4/4 at 120 BPM with one count-in bar; fail only `voice-female/max-16.wav` while other requests succeed, then toggle playback.
- Deterministic result: 86 voice requests are started, the failure of a sample irrelevant to this count-in rejects preparation, playback stays stopped, and no transport notification/error is emitted. `toggle()` discards the rejection. This is fault injection; production assets are present and the PWA is configured to cache them.
- Impact: on failed/interrupted loading, the Start button appears inert; selection/preview can also cause unhandled promise rejection. Eagerly decoding all voice variants expands the failure surface and first-use latency.
- Fix: publish explicit loading/error state and retry affordance, make pending starts cancellable, and load/recover required voice tiers/counts incrementally or fall back for unavailable samples. Test first launch, slow/failed fetch, and a loaded offline PWA separately.

### P3 — Polyrhythm mode changes do not cancel a pending asynchronous start
- Source: `src/audio/AudioEngine.js:631`–`:634`; compare meter setter, which always calls stop and increments generation.
- Reproduce: start standard playback while sample loading is unresolved, switch to polyrhythm, resolve the old preparation promise.
- Result: playback starts in the new mode despite the mode change; the original standard sound list was prepared rather than the new poly sound list. The new mode may initially use fallback clicks when its sound is not yet loaded.
- Fix: give loading a transport state; cancel pending starts on every disruptive mode/rhythm/session edit, or snapshot and consistently commit the full requested configuration. Consider as part of the loading-state fix above.

## What works well

- 65 existing targeted tests passed: core behavior, meter, gap patterns, session playback, spoken subdivisions, tempo preview, Pump the Jam, and voice samples.
- Additional independent interaction matrix passed: 384 combinations across numerators 1–16, both denominators, all six gap patterns, starts at 20/300 BPM, simultaneous tempo/subdivision/gap training, three subdivision stages (1/3/13), and group-only eighth-note meters. Verified 3,072 complete bars with exact duration, expected trainer progression, and bounded tick counts.
- Additional 256 polyrhythm ratios (all 1–16 against 1–16) passed static-tempo spacing/count checks at 800 BPM for two full cycles each.
- Existing count-in/session tests establish that count-in excludes trainer advancement and elapsed-session time; silent bars count toward limits; standard and poly bar limits end at the intended boundary; minute limits clip sources and survive tempo changes.
- Static meter and subdivision math is robust, including unequal grouped meters. Gap patterns preserve saved click patterns and stage/tempo advancement. Sources and visual notifications are explicitly canceled on Stop. Meter edits cancel pending starts. Voice assets have sample-level presence/duration checks, and synthesized sounds require no fetch.

## Evidence and limitations

Run `node tmp/audit/audio-edge-probes.mjs` to reproduce the five observed defects. Its assertions check the **current faulty behavior**, so an exit code of zero means reproduction succeeded, not that the defects are fixed.

Run `node tmp/audit/audio-interaction-matrix.mjs` for the additional positive timing matrix.

The probes inspect deterministic engine scheduling and fault-injected audio/network states. They do not listen through physical speakers, measure real audio-device latency/jitter, reproduce actual OS interruption behavior, or establish background/lock-screen guarantees. Browser/device testing should cover iPhone Safari + installed PWA and Android Chrome + installed PWA, phone calls/audio-route changes, screen locking, rapid Start/Stop on slow loading, and high-density playback while manipulating controls.
