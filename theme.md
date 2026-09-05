# Drums Only Metronome — Implemented Theme Guide

This guide records the Pulse Core presentation and the semantic brand layer currently implemented in `src/index.css` and `src/brand/`.

## Active Drums Only identity

`src/brand/drumsOnly.js` is the single runtime definition for the visible shop identity.

| Semantic role | Current value | Use |
|---|---:|---|
| Canvas | `#0A0A0A` | App background and Pulse interior |
| Surface | `#1A1A1A` | Controls, quick actions, cards, and the rhythm sheet |
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

The older Tailwind aliases (`primary`, `secondary`, `dark`, `light`, and `muted`) remain mapped at the shell boundary for legacy utility styles. Their inherited names are misleading—`dark` is the light foreground and `light` is the dark canvas—so the Pulse Metronome, Practice tools, Settings, transport, and navigation styling use semantic `--brand-*` properties directly.

## Typography

| Role | Current font | Use |
|---|---|---|
| Brand/display | Black Ops One | Drums Only identity and existing brand marks |
| Interface and Pulse numerals | Inter | BPM, screen headings, cards, status, controls, rhythm sheet, and supporting text |

Both fonts are requested from Google Fonts by `index.html` with system fallbacks. They are not currently self-hosted.

## Pulse Core presentation

- The BPM is the dominant distance-readable element inside a circular segmented beat orbit.
- Shape the click can be dismissed by dragging down its fixed handle/title area, or with Done, Escape, or the backdrop. The sheet follows the drag, settles back after a short or cancelled gesture, and exits from its current position after a deliberate downward swipe. Rhythm controls retain native scrolling; reduced motion removes the settle animation.
- Start/Stop and one-BPM nudges form one generously sized transport row with clear breathing room below the BPM wheel and above the slider; the transport is intentionally not treated as a giant hero button.
- Main metronome proportions follow the app frame's inline width, not the browser height: the logo, orbit, BPM numerals, quick actions, and transport sizes use container-relative dimensions with upper limits. Tempo buttons never shrink below 44 px. Short windows (760 px or less) tighten spacing without resizing the logo or orbit; very short views scroll instead of compressing the performance controls. Beat highlighting is independent of these layout rules.
- Practice tools and Settings use a compact version: a 76 px segmented orbit with the BPM centered inside, then 44 px minus/plus targets around a 56 px start/stop button. Shared orbit geometry, accent states, Blue Olive tempo colour, and distinct polyrhythm colours mirror the main screen. The small orbit is a single shortcut to Metronome, not tiny accent-editing targets. Status text and trainer chips are omitted from this widget.
- The mini transport floats above scrollable content with a translucent surface (28% brand surface and 10 px backdrop blur, no opacity applied to its controls). A 44 × 44 px chevron target straddles the top edge without adding a header row; the open card is 98 px tall. Scroll-end padding keeps the last settings reachable above the overlay. It folds over 220 ms while preserving playback; hidden controls are inert and the collapsed dock passes pointer events through except on the handle. Collapse state survives tab changes during the session, defaults open on reload, and reduced motion removes the transition.
- The existing 20–300 slider stays visible and keeps an enlarged, distance-readable branded Blue Olive range thumb.
- Every tempo-linked surface uses one continuous badge-native Blue Olive progression: deep teal at 20 BPM, enamel blue at 110, warm paper around 213, and olive gold at 300. This includes the orbit, slider, Tap Tempo charge, rhythm-sheet accents, focus treatments, and other live tempo-color consumers. The top-ten fire state retains a gentle brightness flicker without replacing the selected Blue Olive hue. Polyrhythm's R2 remains cool violet so its rhythm stays visually distinct.
- The slider adds a light brushed hatch over the filled rail and no colored glow. The enlarged badge leans gently toward each tempo change before settling upright. Its visible rail is inset by half the badge width, matching the badge's actual travel path so the fill endpoint stays centered beneath it from 20–300 BPM and the rail never protrudes beyond either end state.
- Standard mode divides the full orbit into equal beats with equal gaps; the sounding beat uses the same bright active segment used by Polyrhythm.
- In Polyrhythm mode, R1 owns the upper semicircle and tempo-gradient color, while R2 owns the lower semicircle and contrasting cool-violet color. Each half is divided by its actual pulse count, and its independently sounding pulse lights from the audio-timed callbacks.
- Every orbit segment is also a 44 px-class accent control built from an annular wedge on a recessed track. Off is hollow, On fills only the inner half of the ring thickness, and Accent is a clean full-depth solid shape without edge outlines. This creates a literal empty → half-depth → full-depth progression. Each division uses a straight slot-style gap with parallel opposing cut faces, and the previous cycle-origin dot has been removed. Playback changes brightness and glow without shifting the ring. In standard mode, On and Accent change the beat's main click while preserving quieter subdivision dynamics and detailed Rhythm-sheet edits; Off silences the complete beat, including its subdivisions. Re-enabling a muted beat restores all its clicks to On. Polyrhythm segments edit their corresponding R1 or R2 pulse.
- Beat 1 uses a brighter companion voice derived from the selected sound, making each return to the start of a standard measure or polyrhythm cycle audible without adding another control.
- Both modes use two evenly divided quick actions. Tap Tempo is an icon-only Phosphor Hand Tap control with a four-stage radial charge: each input expands the tempo-colored fill farther across the button, the fourth fills it completely, and continued refinement taps pulse the completed state. A light synthesized C-major “boop” rises through four pitches with the visual charge and routes through master volume. The rhythm action uses the selected Phosphor count treatment: standard mode pairs the beats-per-bar count with a metronome icon and the clicks-per-beat count with a notes icon; Polyrhythm shows distinct A and B pulse counts. Its accessible name announces the full meaning in either mode, and activating it opens the complete rhythm sheet.
- The Rhythm sheet stays within the dark Pulse surface system and picks up the live tempo color in its handle, header action, focus treatment, primary accent pattern, and active mode switch. Polyrhythm keeps its contrasting cool-violet R2 identity.
- The Rhythm sheet keeps one responsive outer height in standard and polyrhythm modes—78% of the app frame, capped at 660 px—so changing modes never moves its top edge and the normal polyrhythm controls fit without scrolling. Its content area fills the remaining space and retains independent scrolling only as a fallback for unusually short screens or dense accent patterns.
- Opening and closing the Rhythm sheet use the selected Soft Lift motion: a calm 440 ms compositor-driven rise or return with a 300 ms opacity-only backdrop fade and no bounce. The backdrop intentionally does not blur the live app, avoiding whole-screen repaints during the transition. The sheet remains mounted and modal until its exit completes, avoiding the previous abrupt disappearance. Reduced-motion preferences collapse the animations to an effectively instant transition.
- The Metronome has no idle title/status row; the tempo and rhythm state begin immediately below the shared brand mark. Active trainer ownership remains visible through compact status chips only when needed.
- Practice tools and Settings use the same raised dark surfaces, rounded geometry, interface type, compact labels, switches, and 44 px controls as the main Pulse view.
- Practice tools uses three focused cards and keeps disabled configuration readable while Polyrhythm mode is active. Settings groups master output and a compact two-column sound preview grid.
- Trainer cards use the selected Hoop Dial treatment: a slim steel hoop, original pictograms, the same raised card surface and shadow as Settings, and inline cylindrical number wheels. Active cards retain a subtle tempo-coloured border; no separate blue face gradient is applied. Gap uses the interrupted pulse loop (study C); Tempo uses a note/up arrow (A); Subdivision uses one-to-two-to-four bars (A). No mounting bulge is present. Gap bars and Tempo start/target BPM live in the header; only additional controls unfold. Narrow cards use a 38 px hoop/23 px pictogram with full-width metrics beneath; wider cards use the 60 px hoop/32 px pictogram. The metal band uses a 1.25 px head inset with half-pixel rims and smaller lug ears, keeping the pictogram visually dominant with breathing room inside the hoop. Subdivision headers preview the saved clicks-per-beat sequence with arrows and highlight the current stage only during enabled, non-polyrhythm playback. Optional trainer accent/surface tokens retain the olive/charcoal branding boundary.
- Wheels are 52 px tall (44 px compact), with thin numbers, visible neighbours on a perspective cylinder, rotating grip ridges, and a fixed square drum-key selection marker. Disabled wheels use the shared Settings gray surface with neutral grip highlights, subtle cylindrical edge shading, and a gray read-only value. Activation updates the resting appearance once; it does not launch per-ridge, number, colour, or marker-filter fades. Actual rotation retains the 170 ms transform settle. Angular shading belongs to individual ridges, never their preserve-3d parent, to avoid perspective shifts. Use `--trainer-accent` for selection/number colour. Tempo increase/interval wheels span 88–112 px; three-digit BPM typography scales to avoid touching neighbouring values. Numeric subdivisions remain 1–13. Reduced motion removes settling transitions.
- Each trainer has a shared satin-nickel side-view throw-off mounted flush against the card's right edge, using two small 3x transparent sprites compiled from the retained original atlas. Silhouettes and the housing shadow are baked into the assets rather than clipped/filtered live; the pivot and visual scale are unchanged. A 45 px external gutter and 27 px internal clearance separate its stationary 64 × 114 px native switch target from the fields. Only the hardware moves: 3 px down and a 26-degree outward lever swing when off, returning upward and closed when on. Engagement takes 210 ms, release 270 ms, and a subtle 2-degree press preload takes 65 ms. Disabled switches do not preload; reduced motion removes transitions and preload. Controls retain at least 44 px touch height. There are no visible On/Off labels, extra sounds, or delayed switch-state changes.
- Trainer ownership is visible through status chips and disabled control states.
- Turning a trainer wheel slowly has a shallow detent within 14% of each integer step. Full capture applies up to two number steps/second, blends away through eight steps/second, and is bypassed above that speed. Capture returns gradually as movement slows. Numbers and grip share the position; raw movement keeps accumulating. Settings still commit only when the gesture ends.
- Practice tools uses the same live `getTempoColor(bpm)` Blue Olive colour as the metronome slider, through `--tempo-heat-color` / `--trainer-accent`. Wheels, selection markers, hoop highlights and active stages share it; number text mixes in light ink for legibility. Disabled wheels remain neutral charcoal.
- The compact Drums Only logo remains part of this build's clean, solid-color shell; the previous brick texture has been removed.

The orbit is driven by the audio engine's audible-time React callbacks. It does not use a CSS or JavaScript timer to approximate playback.

## Interaction and accessibility

- Primary controls and range inputs retain at least a 44 px interaction area.
- Tap tempo changes BPM only after four inputs, refines while tapping continues, and resets to four fresh taps after two seconds without input. After every input, its radial charge fades continuously across that same two-second window and reaches zero exactly when the session expires; the rising boops communicate progress without a visible numeric counter.
- Accent controls cycle through exactly three states—Off, On, and Accent. Compact controls in the Rhythm sheet use empty, half-filled, and fully filled two-part markers; the large orbit uses hollow, hatched, and solid segments. Accent is the loudest playback level, and saved Loud states migrate to Accent.
- The Rhythm sheet is a labeled modal dialog with scroll-safe focus entry, focus containment, Escape/backdrop/Done dismissal, scroll-safe opener focus restoration, and inert surrounding controls. Focus stays on the stationary dialog container during motion so mobile browsers do not chase a moving control and shift the viewport.
- Dense `16 × 13` accent patterns use the existing four-beat paging and independent sheet scrolling.
- Global keyboard focus uses a 2 px brand focus outline with a 3 px offset.
- Motion honors `prefers-reduced-motion`.
- Disabled trainer-owned buttons use native disabled behavior; number wheels use `aria-disabled`, leave the tab order, and reject input. All controls have programmatic labels.

These are implementation requirements, not a claim of formal WCAG certification.

## Responsive shell

- At viewport widths up to 640 px, the app is edge-to-edge and respects iPhone safe areas.
- On larger screens, it is centered in a frame no larger than 430 × 932 px.
- The compact brand mark and Pulse layout reduce vertically for short devices.
- The root minimum supported width is 320 px.
- The Rhythm sheet scrolls independently above the persistent three-item bottom navigation.

## Reskin boundary

Changing the runtime brand definition updates the visible logo, palette, fonts, focus color, and range-thumb asset without changing feature modules. Installable-app metadata and public icons are still build-time Drums Only assets; their required reseller workflow is documented in `BRANDING.md`.
