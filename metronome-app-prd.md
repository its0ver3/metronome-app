# Drum-Only Metronome — Build Specification

## 1. Project Overview

A web-based metronome built specifically for drummers at an independent drum shop. Focuses on timing precision, training tools (gap clicks, tempo ramping), and dead-simple usability. Web-only — no native apps, no backend, no accounts.

## 2. Technical Stack

| Layer | Choice |
|---|---|
| **Framework** | React |
| **Build tool** | Vite |
| **Audio** | Web Audio API with lookahead scheduler |
| **Styling** | Tailwind CSS |
| **Storage** | localStorage for settings, IndexedDB for presets |
| **Hosting** | Static deploy (Netlify / Vercel / GitHub Pages) |
| **PWA** | Service worker for offline, manifest for installability |

**No backend. No server. No database. No auth.**

## 3. Architecture Notes

- Audio engine runs independently of UI — Web Audio API scheduler loop, not tied to React renders.
- UI subscribes to audio engine state via events/callbacks.
- `AudioContext.currentTime` is the single source of truth for timing.
- All click sounds pre-decoded into `AudioBuffer`s at init.
- iOS Safari: `AudioContext` must be created/resumed on a user gesture (tap/click).
- Timing uses a lookahead scheduler (schedule events ~25ms ahead, check every ~25ms) — never relies on `setTimeout` precision for actual audio playback.

## 4. Feature Specs

### 4.1 Core Metronome

- **BPM range:** 10–400 (integer only for v1)
- **Controls:** numeric input, +/- buttons (1 BPM steps), slider or dial
- **Start/stop:** < 50ms response time
- **Timing:** jitter < 1ms via Web Audio API lookahead scheduling
- **Background stability:** runs correctly when tab is backgrounded (Web Audio events, not `setTimeout`)
- **Keyboard shortcuts:** spacebar = start/stop, up/down arrows = +/- 1 BPM

### 4.2 Tap Tempo

- Dedicated button, always visible in main UI
- **Keyboard:** "T" key
- Rolling average of last 4 taps
- Auto-reset after 3 seconds of no taps
- **Visual feedback:** button pulses/flashes on each tap

### 4.3 Time Signatures & Subdivisions

**Built-in time signatures:** 2/4, 3/4, 4/4, 5/4, 6/4, 7/4, 6/8, 7/8, 9/8, 12/8

**Custom:** user-defined numerator (1–16) and denominator (4, 8, 16)

**Subdivisions:** quarter, eighth, eighth triplet, sixteenth

Subdivision sound is distinct from main beat (different pitch/volume).

### 4.4 Custom Accents

- Each beat in the bar has an accent level: **Strong**, **Medium**, **Normal**, **Ghost**, **Silent**
- **Visual:** beat indicators show accent via size/color/brightness
- **Interaction:** click/tap a beat indicator to cycle through levels
- Accent affects volume of that beat's click

### 4.5 Click Sounds

- **8–10 sounds at launch:** classic click, woodblock, rimshot, cowbell, hi-hat, electronic beep, soft tone, stick click
- Sound preview before selecting
- Master volume control
- All sounds pre-loaded into Web Audio buffers

### 4.6 Gap/Mute Training

- **Config:** click bars (1–16) and gap bars (1–16)
- **Pattern:** click → gap → click → gap (repeating)
- During gap: audio is silent, visual beat indicator continues with distinct "gap" styling
- Visual clearly distinguishes "click phase" from "gap phase"

### 4.7 Tempo Trainer

- **Config:** start BPM, target BPM, increment (+/- 1 to 20), step interval (every N bars)
- Supports acceleration and deceleration
- BPM display updates in real-time as tempo changes
- Stops when target BPM is reached
- Tempo changes on bar boundaries (no mid-bar jumps)

### 4.8 Visual Feedback

- **Beat indicator:** element that pulses/flashes on each beat
- Beat 1 visually distinct (different color)
- **Bar counter:** "Beat X of Y" and current bar number
- **Dark mode / light mode toggle** (respect system preference as default)

### 4.9 Presets

- Save current state as a named preset (BPM, time sig, accents, sound, gap settings, tempo trainer settings)
- Load preset in one click
- Delete presets
- Stored in localStorage/IndexedDB — no account needed

## 5. Non-Functional Requirements

- **Responsive:** works on phone, tablet, desktop
- **First meaningful paint:** < 2 seconds
- **Keyboard accessible**
- **PWA installable** with offline support
- **Browser support:** Chrome, Firefox, Safari, Edge (current versions)
- **iOS Safari:** AudioContext quirks handled (user gesture unlock)

## 6. Out of Scope

Explicit list to prevent scope creep:

- User accounts, login, cloud sync
- Setlists
- Polyrhythms
- Sequencer / drum machine
- Video/audio recording
- MIDI / Ableton Link
- Haptic feedback
- Practice logging / statistics
- Audio prompts / section announcements
- Custom sound uploads
- Native mobile apps (iOS/Android)

## 7. Acceptance Tests

| # | Test | Pass criteria |
|---|---|---|
| 1 | Metronome runs for 10+ minutes | No audible drift |
| 2 | Gap training: 2 click + 2 gap bars at 120 BPM | Silence is exactly 2 bars |
| 3 | Tempo trainer: 80→120 BPM, +5 every 4 bars | Hits 120 after 32 bars, then stops |
| 4 | Tap tempo: 4 taps at ~120 BPM | Displays 118–122 |
| 5 | All sounds at 40, 120, and 300 BPM | No distortion |
| 6 | App works offline after first load | PWA serves cached assets |
| 7 | Dark/light mode toggle | Switches correctly, respects system default |
| 8 | Presets save and load | Correct after browser restart |
