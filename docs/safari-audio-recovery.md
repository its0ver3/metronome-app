# iPhone Safari audio-stop investigation — 2026-09-07

The report was audio becoming silent around a meter change on the GitHub Pages app. Stop/Start and other settings did not recover sound; the beat indicator apparently stopped too. Closing and reopening Safari recovered playback. The exact iOS version, audio route, meters, and browser/OS events were not captured.

The public build at `https://its0ver3.github.io/metronome-app/` served `assets/index-BRiB_kNt.js` during this investigation. Its audio lifecycle matches the affected local source: it already resumes an `interrupted` context on Start, but has no audio-clock health check or context replacement, and unconditionally stops playback on any renderer error. A stale service-worker build is therefore not required to explain the missing recovery.

## Findings and changes

| Finding | Evidence | Change |
| --- | --- | --- |
| A context reporting `running` with a frozen `currentTime` leaves playback stuck. Repeated Start reuses that same context. | Fault injection reproduces a permanently playing transport with no audio-clock progress in both backends. | While playing in the foreground, check the audio clock every 500 ms. After two seconds of observed non-progress, stop playback and mark the context for replacement. The next Play gesture rebuilds the context, gain, sound bank, and worklet registration while preserving settings. |
| Browser suspension/interruption/closure does not update the transport. A closed context is reused forever. | State-change injection leaves the original engine marked playing; a closed context cannot resume. | Listen for context state changes, clear playback when audio stops, and replace closed contexts on the next Play. Ordinary suspended/interrupted contexts still use the existing resume path. |
| Suspension while asynchronously preparing playback can publish a successful but silent start. | Inject `suspended` during renderer preparation and reject resume. The original code starts anyway because its final check covers only `interrupted`. | Recheck every non-running state after preparation, cancel startup if resume fails, and release its prepared renderer. Guard asynchronous stages against cancelled starts. |
| A delayed error from a retired worklet can stop its replacement after a meter edit. | Start, change meter, start again, then deliver the old renderer's error callback. The original code stops the new run. | Guard errors by node identity, detach retired callbacks, and prevent obsolete module-load failures from clearing a newer renderer. |

Meter changes intentionally stop playback and reset to bar 1; that behavior remains. Repeated changes through the meter presets and cancellation during sample loading pass. No meter arithmetic defect was found in these checks.

The health check measures audio-clock progress, independently of audible notes, to preserve slow tempos, muted beats, and silent training bars. Hidden-page time and delayed main-thread callbacks reset the observation window. Recovery does not restart sound automatically: the transport returns to stopped, and the next Play tap supplies user activation. A recovered start follows normal count-in/session/trainer reset behavior.

## Validation

- The first regression run reproduced seven failing recovery cases, with four ordinary/control cases passing before production edits.
- Thirteen new recovery tests cover both scheduling backends, replacement-context worklet registration, interrupted/suspended/closed states, startup cancellation, resume success/failure, late errors, obsolete module loads, healthy meter switching, slow tempos/silent bars, and background/delayed callbacks.
- `npm test`: 197 passing tests after the fix, including the existing timing, meter, trainer, session and visual-timeline checks.
- `npm run build`: GitHub Pages production build succeeds, including the worklet bundle and service-worker precache.
- `npm run build:sites`: alternate hosting build also succeeds.

These are deterministic engine tests with mocked browser resources, plus production builds and inspection of the deployed JavaScript. They do not reproduce the original incident on a physical iPhone or establish which event caused Safari to become stuck. No deployment was performed as part of this investigation.

## Device follow-up

After publishing the fix, use the HTTPS GitHub Pages app on the affected iPhone. Repeat meter changes followed by Play; confirm every restart sounds and advances the beat indicator. If audio freezes, leave the app visible for at least two seconds and tap Play once the transport stops. Confirm recovery without reopening Safari, including the selected sound and any count-in/trainer settings. Capture iOS version, audio route, active settings, and whether a call, tab switch, lock, or output-route change preceded any recurrence. Successful desktop or deterministic tests cannot substitute for this check.

## Browser evidence

- [WebKit bug 263627](https://bugs.webkit.org/show_bug.cgi?id=263627) includes reports of iOS audio contexts remaining `running` while `currentTime` stops increasing. This supports the frozen-clock hypothesis; it does not establish the cause of this user's incident.
- [WebKit bug 276687](https://bugs.webkit.org/show_bug.cgi?id=276687) describes silent Web Audio after audio activity in another tab, including a non-advancing clock. The original report here did not identify that trigger.
- [MDN: BaseAudioContext state](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state) documents Safari interruptions, state-change handling, and explicit resume.
