# Brand and Reskin Guide

The app currently ships as **Drums Only Metronome**, while its visible identity is separated from metronome behavior so the same product can later be offered to independent drum shops.

## Current boundary

`src/brand/drumsOnly.js` is the active runtime identity. Its validated contract contains:

- Brand ID, shop name, and product name
- Logo source and accessible alternative text
- The branded range-thumb asset
- Semantic canvas, surface, text, accent, muted, border, and focus colors
- Heading and body font stacks

`src/components/layout/PhoneFrame.jsx` applies that definition at the app-shell boundary. It resolves public assets against Vite's deployment base and exposes semantic `--brand-*` CSS properties. Existing Tailwind color aliases are also set at this boundary so older Training and Settings components follow the active brand without importing it.

Feature code must not import `drumsOnlyBrand`. Metronome, Training, Settings, storage, and audio modules consume handlers, state, and semantic styles only.

## Creating a shop skin

1. Add a new definition beside `drumsOnly.js` using `defineBrand()` and the same contract.
2. Export that definition as `activeBrand` from `src/brand/index.js`, or pass it to `PhoneFrame` for a controlled preview.
3. Add its logo and range-thumb asset under `public/` and use paths relative to the Vite base.
4. Test the Pulse orbit, Rhythm sheet, Training, Settings, keyboard focus, contrast, 200% zoom, and 320 px/390 px portrait layouts.
5. For a distributable reseller build, also replace the static build metadata listed below.

No AudioEngine, metronome, trainer, polyrhythm, or persistence fork should be needed.

## Build-time identity still to parameterize

The current runtime layer does not yet generate every installable-app asset. A future reseller build pipeline should source these from the selected brand:

- `index.html` title, theme color, and Apple touch icon
- Vite PWA manifest name, short name, description, theme/background colors, and icons
- Public 192 px and 512 px app icons
- Hosting base path and deployment target

The `drums-only-metronome-settings` storage namespace is intentionally stable for existing users. It must only change with an explicit data migration, even when visual branding changes.

## Brand asset notes

The current Drums Only logo is a transparent raster image and the range thumb uses the Blue Olive badge. Both are identity assets, not feature assets. Other shops may replace them, but should keep descriptive logo alt text and a range thumb that remains clearly visible and operable at a 44 px interaction height.

Google Fonts are currently loaded by `index.html`. A reseller that requires branded typography while fully offline should self-host its approved font files and include them in the PWA cache.
