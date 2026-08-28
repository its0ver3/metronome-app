# Drums Only Metronome

A mobile-first metronome app designed to help drummers practise. The current product has three screens: Metronome, Training, and Settings.

## Product vision

The business goal is to sell branded versions of this app to local drum shops. Each shop can offer its customers the same metronome under its own name, logo, colors, icons, and web address.

This is intentionally a metronome app, not a general practice platform. The metronome is the product; training modes and polyrhythms make it more useful to drummers without changing that focus.

The production app uses the selected **Pulse Core** direction across Metronome, Training, Settings, transport, and navigation. The Metronome combines a distance-readable tempo orbit, compact transport, an icon-led rhythm readout, and an accessible mobile rhythm sheet; Training and Settings use the same premium card and control language. Everything is powered by the existing audio engine rather than the standalone mockup timer.

## Current feature set

- Precision Web Audio metronome with one 20–300 BPM range
- 1–16 beats per bar, 1–13 subdivisions per beat, and three per-click states: Off, On, and Accent
- Tap tempo, keyboard shortcuts, eight synthesized click sounds, and master volume
- Gap, tempo, and subdivision trainers that can run together in standard metronome mode
- Two-voice polyrhythm mode with independent counts, accents, and sounds
- A persistent metronome transport on Training and Settings
- Mobile safe-area handling, visible keyboard focus, semantic control states, and touch-friendly primary controls
- Config-driven identity for future local-drum-shop versions

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

Third-party icon attribution is recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

`drum-tuner-prd.md` describes a separate future native iOS concept; it is not part of this web app.
