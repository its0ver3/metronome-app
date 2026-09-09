# Performance improvements

Implemented the rendering, voice-readiness, PCM-transfer, session-status, and
sheet-dismissal fixes from the [audit](performance-audit-2026-09-08.md).

## Behavior

- Subdivision and flash state now have narrowly subscribed visual consumers.
  Unchanged Training and Settings screens skip playback renders; tempo controls
  are memoized, and orbit geometry is independent of the active beat. The main
  orbit follows beats, while the open detail sheet still follows subdivisions.
  Collapsed mini-orbits receive a stationary state. Frame-aligned flushing and
  stale-pulse suppression remain intact.
- Voices prepare only the counts used by the current meter or polyrhythm, with
  all speed variants for those counts. Ordinary 4/4 needs **26 WAV dependencies
  instead of 86**; a four-beat count-in without a playing voice needs 21. All
  speed variants are intentional: immediate BPM changes, irregular group
  lengths, subdivision speech and trainer transitions remain ready without
  waiting for another network request. Larger meters prepare additional counts
  before their next start. Downloads and decoding are deduplicated per bank;
  retrying a failed clip retains successful clips.
- Startup shows a loading state and a second transport tap cancels it. Failures
  expose retry instructions. Slow or obsolete previews cannot play after a more
  recent selection. During live sound changes, the existing click continues
  until the new sound is ready.
- New worklets receive active sounds and count-in dependencies. Live updates
  transfer only missing sound entries or voice clips; warmed sound selections
  transfer no PCM. Deltas merge with the existing renderer bank without detaching
  the main-thread buffers used by previews and the fallback scheduler.
- Session status is evaluated on meaningful state changes and countdown-second
  deadlines. Exact audio cutoffs are still checked each render block. Ten
  simulated seconds with the timer off now produce **five status snapshots
  instead of 3,755**, and JSON serialization has been removed from this path.
- Rhythm-sheet dismissal and its backdrop take **220 ms instead of 440 ms** for
  the sheet. Entry retains its existing 440 ms movement. Focus restoration and
  reduced-motion behavior remain intact.

## Measured render comparison

Ten-second captures used the same 300 BPM / 13-subdivision scenario as the audit,
with trainers and flash disabled and controls untouched, in Chromium 152/macOS at
1280 × 720. Initial mounts and user edits were outside the measured windows.

| Screen | Component renders before → after | Total React render duration before → after |
| --- | ---: | ---: |
| Metronome | 601 → 64 | 274.5 → 33.1 ms |
| Training | 613 → 0 | 221.3 → 15.8 ms |
| Settings | 612 → 0 | 148.8 → 14.2 ms |

Training's eight mounted wheels went from **4,904 renders to zero** in the capture.
Orbit renders track roughly five beats per second rather than subdivisions, and
unchanged tempo controls skip rendering. The app shell still handles beat/bar
status; zero screen renders does not mean zero app work. All three final captures
recorded no long tasks or animation-frame intervals over 25 ms. React render time
excludes commit, paint and audio work; these are individual instrumented runs,
not a percentage improvement to overall app speed.

Raw before/after records are retained in [performance evidence](performance-audit-evidence/).

Browser voice verification requested exactly **26 WAVs**, representing **642,932 bytes** of encoded audio dependencies, versus 2,441,262 bytes before. This run used HTTP cache validation, so this describes the asset size, not fresh network transfer. [Voice evidence](performance-audit-evidence/after-voice-metronome.json).

## Validation

All **212 tests** pass, including 11 new behavioral checks for selective loading,
partial-load retries, shared poly/count-in dependencies, cancelled/failed startup,
latest-wins sound selection, bank deltas, stale previews, visual subscriptions,
and minute cutoffs. Both the default production build and Sites build pass.

Two completed Chromium 152/macOS synchronization runs rendered **69/69 clicks**
at 137 BPM, with maximum sample-clock phase error of **0.010341 ms**. The normal
run showed all 18 downbeat flashes with no missed orbit frames. Kit View under
15 deliberate 200 ms main-thread stalls rendered all audio clicks and suppressed
six late orbit cues, including two downbeat flashes. In both runs displayed
highlights reached full opacity in the first observed frame, preserving the
existing immediate attack. No page errors or visibility changes were recorded.

Evidence: [normal synchronization](visual-sync-evidence/chromium-perf-after-normal.json),
[Kit View stress](visual-sync-evidence/chromium-perf-after-kit-stress.json), and
[worklet status probe](performance-audit-evidence/after-worklet-session-count.json).
The existing visual analyzer passes these new records along with prior records.

Browser interaction checks covered live Female Count selection, navigation during
playback, opening the detail sheet, dismissing it with Done, focus restoration,
Kit View, and stopping playback. Automated checks cover cancellation and failed
requests; slow-network behavior was not separately measured on a phone.

## Scope and measurement limits

The offline cache still contains the full library, preserving the existing
all-sounds-offline behavior. Selective startup reduces playback dependencies and
decoding, rather than changing the PWA's offline-download promise. Font hosting,
image compression, and broader delivery changes remain lower-priority follow-ups.

These are instrumented desktop measurements, not mobile latency, battery,
physical audio, or production cold-network benchmarks. The harness excludes PWA
installation and remote font loading. Render counts mean component executions,
not pixel repaints. Raw captures and reproduction instructions are in the
[performance harness](../scripts/performance-lab/README.md). No deployment was
performed.
