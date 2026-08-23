# Drums Only Metronome

A mobile-first React metronome and drum-practice PWA. The current product has three screens: Metronome, Training, and Settings.

The production Metronome screen uses the selected **Pulse Core** direction: a distance-readable tempo orbit, compact transport, rhythm summary, and an accessible mobile rhythm sheet. It is powered by the existing audio engine rather than the standalone mockup timer.

## Current feature set

- Precision Web Audio metronome with one 20–300 BPM range
- 1–16 beats per bar, 1–13 subdivisions per beat, and four per-click accent levels
- Tap tempo, keyboard shortcuts, eight synthesized click sounds, and master volume
- Gap, tempo, and subdivision trainers that can run together in standard metronome mode
- Two-voice polyrhythm mode with independent counts, accents, and sounds
- A persistent metronome transport on Training and Settings
- Mobile safe-area handling, visible keyboard focus, semantic control states, and touch-friendly primary controls
- Config-driven Drums Only identity with semantic brand variables for future independent-drum-shop skins

Setlists, Journal, and Groove are intentionally absent from the current app. They were removed so any of these features can be reconsidered from a clean product design later.

## Run locally

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

Run the focused behavior checks with:

```bash
npm test
```

The Vite base path is `/metronome-app/` for GitHub Pages-style project hosting.

## Architecture and persistence

- React 19, Vite 6, Tailwind CSS 4
- Web Audio API with a short lookahead scheduler; visual beat events are delivered at the matching audible timestamp
- Metronome, trainer, polyrhythm, sound, and volume settings persist in `localStorage`
- Persisted settings hydrate the audio engine before the first interactive render, so playback cannot start on stale defaults
- The PWA plugin supplies the manifest and offline asset cache at build time
- `src/brand/` owns the visible shop identity; feature components remain independent of shop logos and palettes

See [metronome-app-prd.md](metronome-app-prd.md) for the current product specification and [theme.md](theme.md) for the implemented design tokens.

See [BRANDING.md](BRANDING.md) for the current Drums Only brand contract and the safe reskin workflow. The original comparison environment remains in `mockups/metronome-ui-lab/`; it is still standalone and does not power production playback.

`drum-tuner-prd.md` describes a separate future native iOS concept; it is not part of this web app.
