# UI, state, persistence audit

Read-only production audit. Evidence: `node tmp/audit/ui-state-probes.mjs` completed successfully with four assertions explicitly reproducing current defects. These are audit probes, not passing regression tests of desired behavior.

## Confirmed findings

### P2: Reselecting the current subdivision discards detailed accents

- Locations: `src/components/metronome/SubdivisionDropdown.jsx:85`, `src/components/layout/AppShell.jsx:143`, `src/audio/AudioEngine.js:471`.
- Reproduce: choose four subdivisions, mute click 2, accent click 3; reopen the dropdown and select the already-selected subdivision.
- Probe: first four accent values change from `[ACCENT, OFF, ACCENT, ON]` to `[ACCENT, ON, ON, ON]`.
- Cause: every selection calls the setter, which rebuilds the accent array even for an unchanged subdivision. The handler also stops playback despite unchanged configuration.
- Fix: treat unchanged selection as a no-op while respecting group-only transitions; add a regression test preserving detailed accents and transport state.

### P2: Tap tempo cannot register the supported 20–30 BPM range

- Locations: `src/components/metronome/tapTempo.js:3`, `src/components/metronome/tapTempo.js:8`.
- Reproduce: tap four steady quarter notes at 20, 25, or 30 BPM.
- Probe: all three return `bpm: null` with just the final tap retained; 31, 60, 120, 300, and 800 BPM succeed.
- Cause: every interval of at least 2000 ms resets the tap sequence, while supported tempo starts at 20 BPM (3000 ms intervals).
- Fix: derive the timeout from minimum supported BPM with timing tolerance; update UI reset behavior and tests together.

### P2: Malformed persisted values can prevent startup

- Locations: `src/audio/engineSettings.js:35`, `src/audio/AudioEngine.js:655`, `src/storage/settingsStorage.js:36`.
- Reproduce: restore valid JSON with `version: 5` and `polyRhythm1: 3.5` or `polyRhythm1: "bad"`.
- Probe: `loadSettings()` returns the data, but restoration throws `RangeError: Invalid array length` while constructing initial React state. No error boundary or restoration fallback exists.
- Scope: requires malformed saved data; normal UI does not produce these values.
- Additional confirmed normalization gaps: `volume: "bad"` becomes NaN; saved tempo increment `"2"` causes the first 100-to-140 trainer step to jump directly to 140.
- Fix: normalize all saved primitives, integer ranges, booleans and array lengths, and recover to usable defaults if restoration fails.

## Strengths observed in source

- One engine instance survives ordinary screen navigation and Kit View changes.
- Engine snapshots clone mutable settings and accent arrays for React.
- Trainer ownership disables direct tempo/subdivision controls; polyrhythm disables trainer controls while preserving saved configurations.
- Number wheels support keyboard, focus-aware scroll, pointer cancellation and commit-on-release.
- Rhythm sheet implements inert background, Escape, focus trapping and restored focus.
- Sound-ID migrations exist; unavailable storage and malformed JSON fall back safely.
- Small-height overflow intentionally scrolls (`src/index.css:289`); root verified scrolling recovers controls, so clipping alone is not a blocker.

## Coverage limits / lower-priority notes

- No independent physical touch-device, screen-reader or audible browser verification here; root owns browser evidence.
- Many UI tests assert source/CSS strings rather than rendered behavior. Add browser regressions for the confirmed defects, persistence/reload, modal/dropdown keyboard behavior, trainer combinations and small-screen scrolling.
- Pagination renders inactive accent pages focusable; cloned meter snapshots also reset page selection after edits. Current selectable presets have at most four groups, so this requires legacy/custom saved meters and is not an ordinary current-preset workflow.
