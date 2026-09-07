# Browser compatibility verification

The current build passed direct checks in native desktop Safari and Chrome. No browser-specific production code change was needed from these checks. Firefox, Edge, Samsung Internet, and physical phones have not been directly tested here, so this is not an all-browser certification.

## Directly tested

| Browser | Audio timing stress test | Production app checks |
| --- | --- | --- |
| Safari 26.4 on macOS | AudioWorklet active; 69/69 clicks; maximum phase error 0.010341 ms | Passed the smoke checks below |
| Google Chrome 152.0.7977.76 on macOS | AudioWorklet active; 69/69 clicks; maximum phase error 0.010341 ms | Passed the smoke checks below |

Each timing run lasted thirty real seconds at 137 BPM and 48 kHz, using the existing test harness with deliberate 200 ms main-thread stalls every two seconds. Measurements are digital click positions relative to the nominal audio sample clock. They do not measure physical output latency or hardware clock accuracy. The separate before/after ten-minute results remain in the [timing report](audio-timing-verification.md); this follow-up did not repeat ten-minute runs in every browser.

Both browsers passed user-initiated start/stop, navigation to Settings and Training while playing, selection of Female Count, all three trainers enabled together, observed subdivision stage and tempo progression, Kit View rendering, and Escape dismissal with focus restoration. Native screenshots showed the Kit View layout rendering correctly. These are focused integration smoke checks, not exhaustive testing of every configuration, every sound, or every screen size.

The Node suite now has **172 passing tests**, including four new compatibility cases: absent AudioWorklet support, rejected worklet-module loading, legacy prefixed AudioContext construction, and rejected audio resume. Those cases verify fallback/error behavior; they do not simulate the full behavior of another browser engine.

## Browser support expectations

AudioWorklet is established across modern browser engines. Safari added it in Safari 14.1. The renderer uses standard Web Audio, typed arrays, and message ports; it does not depend on Chrome-only APIs or SharedArrayBuffer. Sources: [MDN AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet), [Safari 14.1 release notes](https://developer.apple.com/documentation/safari-release-notes/safari-14_1-release-notes).

The app uses Tailwind CSS 4, whose documented core browser requirements are Safari 16.4, Chrome 111, and Firefox 128. Treat those as a dependency baseline, not as app versions verified by this test. For the beta, ask testers to use an up-to-date browser. [Tailwind compatibility](https://tailwindcss.com/docs/compatibility).

| Browser family | Current assessment |
| --- | --- |
| Safari desktop | Direct smoke and timing checks passed in the installed version |
| Chrome desktop | Direct smoke and timing checks passed in the installed version |
| Edge desktop | Expected to work based on shared Chromium engine and standard APIs; not directly tested |
| Firefox desktop | Required audio APIs are available; independent Gecko engine still needs an actual test |
| iPhone Safari and Chrome | Actual device checks still required; desktop Safari does not validate iOS audio-session behavior or touch interactions |
| Android Chrome, Firefox, Samsung Internet | Actual device checks still required; desktop results do not validate mobile performance or output routes |
| Older browsers and embedded social/email browsers | Outside the verified beta scope; opening the link in an up-to-date standalone browser is the appropriate test path |

## Requirement for phone testing: HTTPS

Share a valid **HTTPS** address. AudioWorklet requires a secure context. Loopback addresses such as `http://127.0.0.1` qualify for local development on the same computer, but a phone opening `http://192.168.x.x` on another computer does not get that exception. The app may therefore use its BufferSource fallback on that LAN address instead of the audio-thread renderer. Sources: [MDN AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet), [MDN secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts).

The fallback provides 150 ms of scheduling headroom, but cannot promise the same resistance to main-thread stalls as AudioWorklet. Both paths start audio from user interaction. Optional Safari audio-session configuration is guarded so its absence in another browser does not break playback.

## Remaining release checks

On a real iPhone and Android phone, open the HTTPS build in Safari/Chrome first, keep it visible, and repeat start/stop, sound changes, tempo changes, rhythm controls, trainer combinations, timer completion, and the ten-minute click test. Include touch dragging, small-screen scrolling, and a reload to verify saved preferences. Test the intended speaker/headphone route. Then run the same smoke checks in Firefox and Edge if those browsers are included in the tester group.

Screen-off and background playback remain outside scope, as requested. This check did not deploy the changes or claim that earlier unrelated audit findings are resolved.

Evidence: [captured native-browser results](audio-timing-evidence/browser-compatibility.json), [172-test output](audio-timing-evidence/browser-compatibility-tests.log), [reusable timing harness](../scripts/timing-lab/README.md).
