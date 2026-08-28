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
| Rhythm 2 base | `#3B82F6` | Brand input for the contrasting cool-violet R2 identity |

In the performance view, Rhythm 1 follows the active tempo gradient while Rhythm 2 uses a contrasting cool-violet color derived from the brand's secondary rhythm color (`#3B82F6` for Drums Only). The same R2 identity carries into the rhythm/accent editor. At fire tempos, R1 uses warm flame colors and R2 uses a distinct cool blue-flame treatment. Both voices also remain identified by their R1/R2 labels, separate semicircles, pulse counts, and sounds—not color alone.

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
--brand-color-rhythm-two
--brand-font-heading
--brand-font-body
--brand-range-thumb-image
```

The older Tailwind aliases (`primary`, `secondary`, `dark`, `light`, and `muted`) remain mapped at the shell boundary for legacy utility styles. Their inherited names are misleading—`dark` is the light foreground and `light` is the dark canvas—so the Pulse Metronome, Training, Settings, transport, and navigation styling use semantic `--brand-*` properties directly.

## Typography

| Role | Current font | Use |
|---|---|---|
| Brand/display | Black Ops One | Drums Only identity and existing brand marks |
| Interface and Pulse numerals | Inter | BPM, screen headings, cards, status, controls, rhythm sheet, and supporting text |

Both fonts are requested from Google Fonts by `index.html` with system fallbacks. They are not currently self-hosted.

## Pulse Core presentation

- The BPM is the dominant distance-readable element inside a circular segmented beat orbit.
- Start/Stop and one-BPM nudges form one compact transport row; the transport is intentionally not treated as a giant hero button.
- The existing 20–300 slider stays visible and keeps the branded Blue Olive range thumb.
- Orbit segments and compact beat indicators move through one continuous tempo gradient instead of switching between color bands: blue at 20 BPM, green at 110, yellow at 200, red at 290, then a smoothly warming base color plus animated fire treatment for 291–300 BPM.
- The slider track reveals that same continuous gradient from its left edge to the branded thumb; the remaining range stays muted.
- Standard mode divides the full orbit into equal beats with equal gaps; the sounding beat uses the same bright active segment used by Polyrhythm.
- In Polyrhythm mode, R1 owns the upper semicircle and tempo-gradient color, while R2 owns the lower semicircle and contrasting cool-violet color. Each half is divided by its actual pulse count, and its independently sounding pulse lights from the audio-timed callbacks.
- Every orbit segment is also a 44 px-class accent control built from an annular wedge on a recessed track. Off is hollow, On fills only the inner half of the ring thickness, and Accent is a clean full-depth solid shape without edge outlines. This creates a literal empty → half-depth → full-depth progression. Each division uses a straight slot-style gap with parallel opposing cut faces, and the previous cycle-origin dot has been removed. Playback changes brightness and glow without shifting the ring. In standard mode, On and Accent change the beat's main click while preserving quieter subdivision dynamics and detailed Rhythm-sheet edits; Off silences the complete beat, including its subdivisions. Re-enabling a muted beat restores all its clicks to On. Polyrhythm segments edit their corresponding R1 or R2 pulse.
- Compact indicators below the slider use the same fixed-position active-circle treatment in both modes, so playback never shifts or overlaps adjacent markers. Polyrhythm shows independent labeled R1 and R2 rows.
- Beat 1 uses a brighter companion voice derived from the selected sound, making each return to the start of a standard measure or polyrhythm cycle audible without adding another control.
- Both modes use two evenly divided quick actions. Tap Tempo retains its short text label. The rhythm action uses the selected Phosphor count treatment: standard mode pairs the beats-per-bar count with a metronome icon and the clicks-per-beat count with a notes icon; Polyrhythm shows distinct A and B pulse counts. Its accessible name announces the full meaning in either mode, and activating it opens the complete rhythm sheet.
- The Rhythm sheet inverts to a warm light surface and contains the full standard accent grid or the complete polyrhythm setup.
- The Metronome has no idle title/status row; the tempo and rhythm state begin immediately below the shared brand mark. Active trainer ownership remains visible through compact status chips only when needed.
- Training and Settings use the same raised dark surfaces, rounded geometry, interface type, compact labels, switches, and 44 px controls as the main Pulse view.
- Training uses three focused cards and keeps disabled configuration readable while Polyrhythm mode is active. Settings groups master output and a compact two-column sound preview grid.
- Trainer ownership is visible through status chips and native disabled states.
- The compact Drums Only logo remains part of this build's clean, solid-color shell; the previous brick texture has been removed.

The orbit is driven by the audio engine's audible-time React callbacks. It does not use a CSS or JavaScript timer to approximate playback.

## Interaction and accessibility

- Primary controls and range inputs retain at least a 44 px interaction area.
- Tap tempo changes BPM only after four inputs, refines while tapping continues, resets to four fresh taps after five seconds without input, and shows no progress counter.
- Accent controls cycle through exactly three states—Off, On, and Accent. Compact controls in the Rhythm sheet use empty, half-filled, and fully filled two-part markers; the large orbit uses hollow, hatched, and solid segments. Accent is the loudest playback level, and saved Loud states migrate to Accent.
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
