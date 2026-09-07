# Release/build/security audit

Audit of the current working tree on 2026-09-06. No production source, dependency, lockfile, deployment, or sharing changes were made. Builds regenerated ignored dist output; the final dist output is the Sites build (root base path).

## Verified checks

- `npm test`: 154/154 passing; zero skips, failures, cancellations, or todos. Local runtime Node v25.9.0. Deployment workflow uses Node 20; that exact environment was not independently run.
- `npm run build`: success; GitHub Pages base `/metronome-app/`; Vite 6.4.2; JS 329.82 kB / 100.13 kB gzip, CSS 99.64 kB / 17.26 kB gzip.
- `npm run build:sites`: success, including prepare-sites-build's validation of root HTML asset links and hosting metadata.
- Generated service worker: 209 precache entries, approximately 6.0 MiB. All 209 listed files exist; all 195 production WAV files are included. No over-size exclusion warnings.
- Production dependencies: `npm audit --omit=dev --json` reports zero vulnerabilities.
- Full dependency tree: `npm audit --json` reports 11 vulnerable package entries: 8 high, 2 moderate, 1 low, zero critical. Every affected installation has `dev:true` in package-lock. This establishes build-tool maintenance issues, not exploitability of the deployed static application.
- No application backend, third-party telemetry calls, use of eval, or raw HTML injection was found in src by targeted inspection. App settings persist locally. Google Fonts is the observed external runtime resource.

## Findings and recommended work

### P2: Deployment does not require passing tests

**Evidence:** `.github/workflows/deploy-pages.yml:30-34` installs dependencies then builds; lines 39-53 upload and publish. No test step or separate test workflow exists.

**Consequence:** A main-branch push with failing behavioral tests can still deploy successfully if Vite builds.

**Recommendation:** Require `npm test` before build/deploy and run that check on pull requests. Keep build and publication dependent on the test result. A small browser smoke suite should cover the verified failure cases found in the wider audit.

### P2: Known advisories in build dependencies need maintenance

**Evidence:** `package-lock.json:6224` locks Vite 6.4.2; lines 971, 5172, and 5536 include affected Babel/SystemJS, PostCSS, and serialize-javascript. Full machine-readable registry result is `metronome-audit-npm-online.json` in this folder. Registry reports fixes available for every affected package entry.

Affected entries: @babel/core (low), @babel/plugin-transform-modules-systemjs (high), @rollup/plugin-terser (moderate), brace-expansion (high), browserslist (high), fast-uri (high), nanoid (high), postcss (high), serialize-javascript (high), vite (high), workbox-build (moderate).

**Consequence:** Development and build tools retain reported vulnerabilities, some triggered by attacker-controlled inputs or exposed development-server behavior. No production-dependency advisory was reported; no exploitability assessment or exploit was performed.

**Recommendation:** Refresh compatible affected dependencies and lockfile, rerun tests and both build variants, and inspect remaining advisories for applicability. Share a static production build rather than a development-server endpoint.

### P2 release assurance gap: Existing tests do not exercise browser lifecycle or user event integration

**Evidence:** `package.json:11` runs only Node tests. UI tests render server-side markup (`tests/kit-view.test.js:10-28`; `tests/trainer-toggle.test.js:11-45`) and some assert source/CSS strings. Audio integration tests simulate AudioContext, time, sources, and sound loading (`tests/session-playback.test.js:12-46`). No browser automation dependency/suite was found.

**Strength:** Tests meaningfully cover meter math, trainer composition, session deadlines, persistence migration, gesture-motion helpers, and audio asset invariants. They are much more than build-only validation.

**Limitation:** `node --experimental-test-coverage --test tests/*.test.js` reports 94.65% line coverage, 87.83% branch coverage, and 88.94% function coverage for the imported JS files it instruments. This is not a whole-app percentage: App.jsx, hooks, and JSX DOM event/effect behavior are absent from that file coverage table. AudioEngine has 92.01% lines / 85.45% branches; SoundBank 98.02% / 72.84%; storage 93.85% / 64.29%. High helper coverage cannot establish correct event ordering, actual audio unlock/interruption, focus movement, resize/scroll, or PWA lifecycle behavior.

**Recommendation:** Retain existing tests and add a small real-browser regression set for playback, cross-tab/Kit View transitions, all-trainer/polyrhythm ownership, delayed/failed audio loading, refresh persistence, and installation/offline/update. Require real iPhone Safari and Android Chrome checks for mobile audio and interruptions before relying on the app during practice.

### P3: Offline typography depends on a third-party browser cache

**Evidence:** `index.html:11` links Google Fonts; `vite.config.js:46-51` precaches local build assets and defines no font runtime cache. The generated SW precache contains no Google font stylesheet/font URLs.

**Consequence:** The core app and audio are precached, but a clean offline run has no guaranteed access to the branded fonts and uses fallback fonts. Existing HTTP cache may mask this during casual testing.

**Recommendation:** Bundle appropriately licensed font files if consistent offline appearance is part of the PWA promise, or explicitly accept fallback typography. Verify layout with blocked fonts.

## Performance and remaining validation limits

- Main JS/CSS transfer is approximately 117 kB combined when gzipped, before images/audio. Production sound files total most of the 6 MiB cache. This is measured build size, not a measured mobile load time or smoothness guarantee.
- SoundBank._loadVoice (`src/audio/SoundBank.js:209-224`) issues 85 variant fetch/decode operations plus one woodblock request on the first preparation of each counting voice. Thus first-time count-in/voice playback waits on 86 assets. Slow or partial connectivity deserves explicit testing; audio agent owns the associated error/pending-start audit.
- All WAV files are structurally present and precached. A live production service-worker install, offline reload, cache update during playback, and iOS/Android installed mode were not tested by this agent. Browser auditing is owned by the root agent.
- Actual hosted sharing permissions, deployed revision, privacy of the shared URL, HTTP security headers, and rollout/rollback behavior were not modified or verified. Sharing with selected users should use the intended access policy and the audited revision.

## Evidence files

- metronome-audit-test.log
- metronome-audit-build.log
- metronome-audit-sites-build.log
- metronome-audit-coverage.log
- metronome-audit-npm-online.json
- metronome-audit-npm-prod.json
