# Drums Only Metronome — Implemented Theme Guide

This guide records the Pulse Core presentation and the semantic brand layer currently implemented in `src/index.css` and `src/brand/`.

## Active Drums Only identity

`src/brand/drumsOnly.js` is the single runtime definition for the visible shop identity.

| Semantic role | Current value | Use |
|---|---:|---|
| Canvas | `#0A0A0A` | App background and Pulse interior |
| Surface | `#1A1A1A` | Controls, quick actions, cards, and rhythm-sheet inversions |
| Ink | `#F5F0E8` | Primary text, marks, and the light rhythm sheet |
| Accent | `#F5F0E8` | Orbit progress, active transport, focus, and Rhythm 1 |
| Muted surface | `#2A2A2A` | Range tracks and subdued controls |
| Border | `#3A3A3A` | Desktop phone frame |
| Focus | `#F5F0E8` | Global visible focus outline |

Polyrhythm Rhythm 2 remains blue (`#3B82F6`) and is also identified by the R2 label, separate row, pulse count, and sound—not color alone.

## Semantic CSS contract

`PhoneFrame` exposes these stable runtime properties:

```css
--brand-color-canvas
--brand-color-surface
--brand-color-ink
--brand-color-accent
--brand-color-muted
--brand-color-border
--brand-color-focus
--brand-font-heading
--brand-font-body
--brand-range-thumb-image
```

The older Tailwind aliases (`primary`, `secondary`, `dark`, `light`, and `muted`) are still mapped at the shell boundary so Training and Settings follow a selected brand. Their inherited names are misleading—`dark` is the light foreground and `light` is the dark canvas—so new Pulse styling uses semantic `--brand-*` properties directly.

## Typography

| Role | Current font | Use |
|---|---|---|
| Brand/display | Black Ops One | Existing product headings outside Pulse where already used |
| Interface and Pulse numerals | Inter | BPM, status, controls, rhythm sheet, and supporting text |

Both fonts are requested from Google Fonts by `index.html` with system fallbacks. They are not currently self-hosted.

## Pulse Core presentation

- The BPM is the dominant distance-readable element inside a circular bar-progress orbit.
- Start/Stop and one-BPM nudges form one compact transport row; the transport is intentionally not treated as a giant hero button.
- The existing 20–300 slider stays visible and keeps the branded Blue Olive range thumb.
- Standard beat progress or the labeled R1/R2 summary sits below the slider.
- Tap, Beats, and Division are compact quick actions at the bottom of the screen.
- The Rhythm sheet inverts to a warm light surface and contains the full standard accent grid or the complete polyrhythm setup.
- Trainer ownership is visible through status chips and native disabled states.
- The original subtle brick texture and compact Drums Only logo remain part of this build's shell.

The orbit is driven by the audio engine's audible-time React callbacks. It does not use a CSS or JavaScript timer to approximate playback.

## Interaction and accessibility

- Primary controls and range inputs retain at least a 44 px interaction area.
- Tap tempo changes BPM only after four inputs and shows no progress counter.
- The Rhythm sheet is a labeled modal dialog with focus entry, focus containment, Escape/backdrop/Done dismissal, opener focus restoration, and inert surrounding controls.
- Dense `16 × 13` accent patterns use the existing four-beat paging and independent sheet scrolling.
- Global keyboard focus uses a 2 px brand focus outline with a 3 px offset.
- Motion honors `prefers-reduced-motion`.
- Disabled trainer-owned controls use native disabled behavior and an explanatory visible or programmatic label.

These are implementation requirements, not a claim of formal WCAG certification.

## Responsive shell

- At viewport widths up to 640 px, the app is edge-to-edge and respects iPhone safe areas.
- On larger screens, it is centered in a frame no larger than 430 × 932 px.
- The compact brand mark and Pulse layout reduce vertically for short devices.
- The root minimum supported width is 320 px.
- The Rhythm sheet scrolls independently above the persistent three-item bottom navigation.

## Reskin boundary

Changing the runtime brand definition updates the visible logo, palette, fonts, focus color, and range-thumb asset without changing feature modules. Installable-app metadata and public icons are still build-time Drums Only assets; their required reseller workflow is documented in `BRANDING.md`.
