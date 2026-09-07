# Metronome pre-release audit — 6 September 2026

**Recommendation: fix the timing and audio-recovery issues before inviting the selected users.** The app has a sound foundation and broad deterministic test coverage, but this audit reproduced failures that affect its central promise: dependable clicks and predictable controls. Passing the existing suite is not sufficient release approval.

Three audit agents reviewed audio/timing, UI/state/persistence, and release/build readiness. The coordinating agent independently reran their probes and exercised the app in the Codex in-app browser. This report covers the current working copy based on commit `65e2c1076e26282aa769a089d8116f9402fe909b`, including the pre-existing uncommitted audio, voice-sample, settings, and style changes. It does not certify the currently hosted revision. No application source or dependencies were changed, and nothing was deployed or shared. Builds regenerated `dist`; the final output is the Sites build.

**Verified results**

| Check | Result and scope |
| --- | --- |
| Existing test suite | 154 passed, no failures or skipped tests. |
| Additional trainer matrix | 384 configurations, 3,072 complete bars: passed deterministic duration, progression, and tick-count checks. Includes all three trainers together, numerators 1–16, both supported denominators, all six gap patterns, and subdivisions 1/3/13. |
| Additional polyrhythm matrix | All 256 ratios from 1:1 through 16:16 passed static-tempo checks at 800 BPM, two cycles each. Live tempo changes expose a separate defect below. |
| Production builds | GitHub Pages and Sites builds both passed. |
| Offline asset packaging | All 209 precached files exist, including all 195 production WAV files; approximately 6 MiB total. Actual offline installation/update was not tested. |
| Dependency audit | Zero production-dependency advisories. Full tree has 11 affected development/build packages: 8 high, 2 moderate, 1 low. |
| Browser walkthrough | Start/stop, navigation during playback, all-trainer activation, tempo ownership, Kit View, polyrhythm trainer pause, count-in plus one-bar automatic stop, extended tempo clamp, settings reload, and detailed accent editing exercised. |
| Production browser smoke | Compiled Sites build loaded at its root base path; playback, Settings navigation, recorded sound selection, and stopping worked. No captured warnings/errors in this smoke check. |

Build output is approximately 330 kB JavaScript / 100 kB gzipped and 100 kB CSS / 17 kB gzipped. These are bundle measurements, not mobile speed or audio-jitter measurements. Tests ran locally with Node 25; the deployment workflow's Node 20 environment was not independently reproduced.

**Confirmed defects, ordered for release work**

P1 means fix before this pilot because core playback can fail. P2 means a meaningful defect to resolve before the pilot where practical, or explicitly accept with a workaround. P3 is lower priority. These are audit priorities, not a claim about how frequently users encounter each condition.

| ID | Priority | Finding | Evidence and recommended correction |
| --- | --- | --- | --- |
| A1 | P1 | Changing polyrhythm tempo can schedule clicks in the past. | At 3:4, change 120→300 BPM at audio time 0.60 s. New notes are scheduled at 0.40, 0.30, and 0.45 s, followed by coincident new-cycle downbeats. The engine reuses the old cycle anchor with the new duration. Commit BPM at a cycle boundary or preserve phase while re-anchoring future events. Verify increases/decreases and timer boundaries. [AudioEngine.js:765](../src/audio/AudioEngine.js#L765). |
| A2 | P1 | A delayed scheduler queues missed clicks together. | At 120 BPM with four subdivisions, a simulated two-second stall makes the next callback schedule 15 overdue notes. There is no lower time bound or bounded catch-up policy. Skip expired audio while advancing logical trainer/bar state and resume on a future grid point. Cover standard, count-in, polyrhythm, and session deadlines. [AudioEngine.js:753](../src/audio/AudioEngine.js#L753). |
| A3 | P2 — pilot gate for mobile | Start cannot recover an already interrupted audio context. | With a context in `interrupted` state and a working `resume()`, `_unlockAudio()` returns false without resuming; Start exits before its later recovery block. Handle interrupted and suspended states together and reflect failed recovery in the UI. This was fault-injected, not reproduced with a physical phone call or screen lock. [AudioEngine.js:204](../src/audio/AudioEngine.js#L204). |
| A4 | P2 — pilot gate | A single failed, unused voice sample silently prevents count-in playback. | At default 4/4 and 120 BPM with one count-in bar, fail only `voice-female/max-16.wav`. All 86 voice/woodblock requests begin, playback stays stopped, and the user receives no error. Preview failures can also reject without a UI handler. Add loading/error/retry state and tolerate or avoid loading irrelevant samples. Assets are present; this is a network-failure test. [SoundBank.js:209](../src/audio/SoundBank.js#L209), [AudioEngine.js:384](../src/audio/AudioEngine.js#L384). |
| U1 | P2 | Reselecting the current subdivision erases detailed accents. | Browser and engine probe both confirm this: choose sixteenths, set click 2 Off and click 3 Accent, then select sixteenths again. Both customized inner clicks become On. The handler also stops playback despite no meaningful configuration change. Treat identical selection as a no-op, accounting for group-only transitions. [AppShell.jsx:143](../src/components/layout/AppShell.jsx#L143), [AudioEngine.js:471](../src/audio/AudioEngine.js#L471). |
| U2 | P2 | Tap tempo cannot set 20–30 BPM. | Four taps at 20, 25, or 30 BPM never produce a tempo, because each interval of at least 2,000 ms resets the sequence. The advertised minimum is 20 BPM, requiring 3,000 ms. Derive both logic and UI timeout from the minimum BPM plus tolerance. Direct tempo controls remain available. [tapTempo.js:3](../src/components/metronome/tapTempo.js#L3). |
| U3 | P2 | Malformed saved values can prevent startup or corrupt trainer behavior. | Valid version-5 JSON containing `polyRhythm1: 3.5` or `"bad"` passes loading and throws `RangeError` during initial engine construction. `volume: "bad"` becomes NaN; a string tempo increment `"2"` jumps from 100 directly to target 140. Normal UI does not generate these values. Validate all saved types/ranges and recover to usable defaults on restoration failure. [engineSettings.js:35](../src/audio/engineSettings.js#L35), [settingsStorage.js:36](../src/storage/settingsStorage.js#L36). |
| A5 | P3 | Mode changes during pending audio loading do not cancel Start. | Start standard playback with unresolved preparation, switch to polyrhythm, then resolve loading. Playback begins in the new mode using preparation for the old mode. Cancel pending starts on disruptive edits or consistently snapshot the requested configuration. Address alongside A4. [AudioEngine.js:631](../src/audio/AudioEngine.js#L631). |

The timing probes prove incorrect scheduling timestamps. They do not measure the exact audible burst or timing jitter through physical speakers on every browser.

**What is working well**

- The single audio engine persists across tabs and Kit View. Browser navigation retained playback, Kit View accent editing did not stop it, and Escape returned to Training with focus restored to the Kit View button.
- Trainer composition is well designed. The deterministic matrix passed; in the browser all three trainers could run together, Tempo Trainer disabled direct tempo controls, and polyrhythm paused trainer editing while preserving the saved setup. Returning to standard mode restored ownership.
- Meter, grouping, and static subdivision timing have substantial meaningful test coverage, including unequal groups. Existing session tests cover count-in exclusion, silent bars, minute limits, complete-bar stops, and trainer progression.
- The browser showed one count-in bar followed by a one-bar polyrhythm session ending at “Complete / 0 bars,” with the transport stopped. An enabled 800 BPM range accepted its endpoint, and disabling it clamped tempo to 300. Reload restored the edited tempo, polyrhythm, trainer, and session configuration without automatically starting.
- Mobile layout checks at 390×844 and 375×667 retained usable controls. The smaller viewport needs vertical scrolling with trainer/session status visible; scrolling successfully recovered the lower controls. This is not a blocked-control defect. Desktop layout was also inspected at 1280×720.
- Native control semantics, inert modal backgrounds, Escape handling, focus restoration, and number-wheel keyboard support are present. Volume endpoint keyboard input worked. A full screen-reader or physical touch audit is still outstanding.
- Production asset packaging and both hosting base-path builds are sound. The app stores preferences locally; targeted source review found no backend or telemetry integration.

**Release process work**

1. **Make tests a deployment gate.** [deploy-pages.yml](../.github/workflows/deploy-pages.yml) currently installs and builds without running `npm test`. A behavior regression can therefore publish successfully. Run tests before building and on pull requests; make publication depend on success.
2. **Maintain build dependencies.** Refresh compatible affected packages and review remaining advisories, then rerun tests and both builds. The 11 affected package entries are development/build dependencies; the audit did not establish an exploit against the deployed static app. Preserve this distinction. Full registry evidence is in the evidence folder.
3. **Add real browser regressions.** Retain the useful Node suite, but add interaction tests for the findings above, modal/dropdown keyboard behavior, persistence/reload, simultaneous trainers, and audio loading/cancellation. The reported 94.65% line coverage applies only to instrumented imported JavaScript; it excludes JSX/hooks browser behavior and is not whole-app coverage.
4. **Verify the intended invitation route.** Check the exact deployed revision and access settings before sharing. An unlisted URL is not proof of selected-user access. Hosted permissions, the current deployed version, and rollout/rollback were outside this local audit; no access was changed.

Lower priority: Google Fonts is external and not precached, so offline fallback typography is possible. Legacy/custom saved meters with more than four groups also expose source-level accent-pagination focus/reset concerns; current selectable presets do not reach that path. These were not treated as ordinary-workflow release blockers.

**Pilot acceptance checklist**

- [ ] Fix A1 and A2; add assertions that no newly scheduled click lies in the past after tempo changes or timer stalls.
- [ ] Fix A3 and A4, including visible failed-loading recovery and cancellable pending starts.
- [ ] Fix U1 and U2. Normalize persisted data and recover from U3; verify ordinary saved preferences still migrate correctly.
- [ ] Require automated tests before deployment and review/update build dependency advisories.
- [ ] On physical iPhone Safari and Android Chrome, test browser and installed-PWA modes: fresh Start, all nine sounds, count-in, combined trainers, polyrhythm, bar/minute stops, Kit View, and control changes at high click density.
- [ ] Test screen lock, app backgrounding, phone/audio interruptions, audio-route changes, and return to playback. Decide and communicate the supported background behavior based on those results.
- [ ] Test a cold/slow first load, failed sample request with retry, installation followed by offline reload, and a service-worker update while playback is active.
- [ ] Check touch gestures, VoiceOver/TalkBack, reduced motion, 200% text enlargement, and small/landscape screens.
- [ ] Publish the fixed, validated revision to the intended access policy; smoke-test the actual invite URL and retain a rollback version.

**Evidence and reproducibility**

The retained [evidence folder](audit-2026-09-06/) contains the three agent reports, build/test/dependency logs, and executable probes. From the project root:

```sh
node docs/audit-2026-09-06/audio-interaction-matrix.mjs
node docs/audit-2026-09-06/audio-edge-probes.mjs
node docs/audit-2026-09-06/ui-state-probes.mjs
```

The interaction matrix checks desired behavior and passed. **The edge and UI probes assert the currently observed defects: their successful exit means the bug was reproduced, not fixed.** Convert them to assertions of the desired behavior when implementing corrections.

This audit substantially improves confidence in the covered paths, but it cannot guarantee the absence of all edge cases. Physical-device audio quality/jitter, long practice-session soak behavior, actual offline/update behavior, full assistive-technology behavior, and hosted access remain explicit validation gaps.
