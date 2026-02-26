# DrumTune — iOS Drum Tuner App PRD

## Overview

A native iOS app that enables drummers to tune their drums using their iPhone as both a microphone and a center-mute. The phone sits on the drumhead during lug-by-lug tuning, doubling as the mute that isolates localized pitch at each tension rod. MVP scope: full tuning workflow for a snare drum (batter and resonant heads).

---

## Core Concept — Phone as Mute

The phone is placed in the center of the drumhead during lug tuning. This:

- Suppresses the fundamental mode (like a finger mute), isolating localized pitch near each lug
- Provides consistent mic proximity to all lug positions
- Keeps the drummer's hands free to tap and adjust
- Simplifies the DSP problem by dampening complex overtone wash

The tuning process has two phases:

1. **Lug Evening** — Phone on head. Tap near each lug, app reads localized pitch, guides user to even all lugs.
2. **Pitch Check** — Phone off head, nearby or in hand. Tap center of open head, app reads overall fundamental and compares to target.

---

## User Workflow

### First Launch

- No skill-level selection. App defaults into the **Recommended** flow.
- A "Custom" option is visible but unobtrusive for users who want direct control.
- User creates their first drum: selects drum type (snare for MVP), enters number of lugs (typically 8 or 10).

### Recommended Flow

1. **Select or create drum** (e.g., "14-inch Snare — Batter Head")
2. **Choose tuning approach** (one of):
   - "Even the lugs" — no target needed, app shows relative differences
   - "Tune to a note" — app shows note names with cents sharp/flat
   - "Tune to a frequency" — direct Hz input for experienced users
3. **Phase 1 — Lug Evening**
   - App displays a top-down drum diagram with lug positions
   - Prompt: "Place your phone in the center of the drumhead"
   - App guides user through a **star pattern** (opposite lugs), highlighting which lug to tap next
   - User taps near highlighted lug → app captures audio, detects pitch, displays reading on diagram
   - Each lug position on the diagram updates with its reading, color-coded:
     - Green: within ±2 Hz of average/target
     - Yellow: 2–5 Hz off
     - Red: >5 Hz off
   - User adjusts tension rod, re-taps to verify
   - Repeat until all lugs converge
4. **Phase 2 — Pitch Check**
   - App prompts: "Pick up your phone. Tap the center of the open head."
   - App reads overall fundamental pitch
   - Displays pitch vs target (if target was set), or simply shows the current note/Hz
   - If pitch is off target: "Adjust all lugs equally by approximately X, then re-even"
   - User can loop back to Phase 1
5. **Switch heads** — Repeat for resonant head

### Custom Flow

- Skip guided star pattern — tap lugs in any order
- Lug diagram still updates with readings
- No step-by-step prompts, just the diagram and readings
- Phase 1/Phase 2 toggle is manual

---

## Technical Architecture

### Platform & UI

- **Language:** Swift
- **UI Framework:** SwiftUI
- **Target:** iOS 16+ (iPhone only for MVP)
- **Orientation:** Portrait locked

### Audio Capture

- **Framework:** AVAudioEngine
- Install a tap on the engine's `inputNode` to receive real-time `AVAudioPCMBuffer` data
- Sample rate: 44,100 Hz
- Buffer size: 4096 samples (~93ms per buffer)
- Audio session category: `.record`, mode: `.measurement`

### DSP Pipeline

All signal processing uses **Apple's Accelerate framework (vDSP)** for hardware-optimized performance. No heavy third-party audio libraries.

#### Step 1 — Onset Detection

- Monitor incoming audio energy (RMS of buffer)
- Trigger detection when energy exceeds a configurable threshold above the noise floor
- Quiet-room assumption simplifies this — threshold can be relatively low
- Debounce: ignore triggers within 300ms of a previous trigger to avoid double-reads

#### Step 2 — Window Extraction

- On trigger, capture ~200ms of audio starting from the onset
- Skip the first 10–20ms (attack transient is broadband noise, will confuse pitch detection)
- Apply a Hann window to the remaining samples to reduce spectral leakage

#### Step 3 — Frequency Analysis (FFT)

- Use `vDSP_fft_zrip` for single-precision real FFT on the windowed samples
- Compute magnitude spectrum from real and imaginary components
- Apply a low-pass filter (cutoff ~500 Hz) to suppress higher overtones before peak detection
- Frequency resolution at 4096 samples / 44.1kHz ≈ 10.8 Hz per bin — use parabolic interpolation on magnitude peaks for sub-bin accuracy

#### Step 4 — Pitch Candidate Selection (Drum-Aware)

This is the critical differentiator. A circular membrane's overtones follow Bessel function zero ratios, not harmonic integer multiples:

| Mode | Ratio to Fundamental |
|------|---------------------|
| (0,1) | 1.000 (fundamental) |
| (1,1) | 1.593 |
| (2,1) | 2.136 |
| (0,2) | 2.296 |
| (3,1) | 2.653 |

**Algorithm:**

1. Find the top 3–5 spectral peaks above a magnitude threshold
2. For each pair of peaks, compute their frequency ratio
3. If a ratio matches a known Bessel ratio (within tolerance, e.g., ±5%), classify the lower frequency as a fundamental candidate
4. If only one strong peak exists, accept it as the fundamental
5. Weight candidates by magnitude — stronger peaks are more likely to be the fundamental
6. When the phone is on the head (Phase 1), the (0,1) fundamental mode is suppressed by the phone's weight, so the dominant pitch will be the (1,1) mode. The app should account for this — during lug evening, the (1,1) pitch is what we're comparing across lugs, and consistency is what matters, not absolute pitch.

#### Step 5 — Confidence Scoring

- Assign a confidence score (0–1) based on:
  - How strongly periodic the detected signal is
  - Whether multiple detection methods agree
  - Signal-to-noise ratio of the peak vs surrounding spectrum
- Only display a reading if confidence exceeds threshold (e.g., 0.6)
- If below threshold, prompt user to re-tap

---

## Data Model

### Drum

```
- id: UUID
- name: String (e.g., "Main Snare")
- type: DrumType (snare for MVP)
- diameter: Float (inches)
- lugCount: Int (8 or 10 typical for snare)
- heads: [Head] (batter and resonant)
```

### Head

```
- id: UUID
- position: HeadPosition (batter / resonant)
- targetFrequency: Float? (nil if "just even" mode)
- targetNote: String? (e.g., "A3")
- lugReadings: [LugReading]
- overallPitch: Float? (Phase 2 reading)
```

### LugReading

```
- lugIndex: Int
- frequency: Float (Hz)
- confidence: Float (0–1)
- timestamp: Date
```

---

## UI Screens

### 1. Home / Drum List

- List of saved drums
- "Add Drum" button
- Tap drum to enter tuning workflow

### 2. Drum Setup (Add/Edit)

- Drum name, type (snare), diameter, number of lugs
- Two head entries: batter and resonant
- For each head: tuning approach selector (even / note / Hz)

### 3. Tuning Screen (Primary Screen)

- **Top-down drum diagram** — circle with lug positions evenly distributed around the edge
- Each lug shows its most recent reading (Hz) and color indicator
- Currently active lug is highlighted with a ring or pulse animation
- Center of diagram shows:
  - Phase 1: "Phone on head" indicator, average frequency of all readings
  - Phase 2: overall pitch reading
- **Bottom bar:** phase toggle, current head indicator (batter/reso), settings access
- Star pattern guide: subtle connecting lines or numbered sequence showing optimal tuning order

### 4. Results / Summary

- After all lugs are within tolerance: success state
- Show final readings, overall pitch, deviations
- Option to save tuning to the drum profile

---

## MVP Scope — What to Build

**In scope:**

- Single drum type: snare drum
- Batter and resonant head tuning
- Recommended flow with star pattern guidance
- Custom flow (unguided, same diagram)
- Lug evening (Phase 1) and pitch check (Phase 2)
- Three tuning approaches: even / note / Hz
- Visual lug diagram with color-coded readings
- Save drum profiles and tuning history
- Onset detection, FFT-based pitch detection with Bessel-aware candidate selection
- Confidence scoring with re-tap prompts

**Out of scope for MVP:**

- Tom and kick drum support (similar pipeline, different frequency ranges — easy to add later)
- Tuning presets library (suggested frequencies by drum size)
- Audio playback of reference tones
- Multi-drum kit management with interval relationships
- Cloud sync
- Android version

---

## Key Technical Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Phone weight on head alters frequencies unpredictably | During lug evening, only relative consistency matters. Validate early by recording taps at different lugs with known tension differences and verifying the app can distinguish them. |
| FFT resolution too coarse for sub-Hz accuracy | Parabolic interpolation on magnitude peaks. If needed, increase buffer size to 8192 samples for ~5.4 Hz bin resolution. |
| Overtones dominate the fundamental in the spectrum | Low-pass filtering + Bessel ratio analysis to identify the true fundamental from candidate peaks. |
| Inconsistent readings from tap-to-tap variation | Require consistent tap force (guide user), average multiple rapid taps, use confidence scoring to reject poor readings. |

---

## Validation Plan

Before building the full UI, validate the DSP pipeline:

1. Record drum taps on an iPhone (various lugs, intentionally different tensions)
2. Analyze spectrograms — confirm visible pitch differences between lug positions when phone is on head
3. Implement the onset detection + FFT + pitch selection pipeline on recorded audio
4. Verify readings are stable (±2 Hz across repeated taps at the same lug) and differentiated (measurably different readings at lugs with different tensions)

If step 2 fails (no visible pitch differences with phone on head), fall back to phone-near-rim placement and redesign the UX accordingly.
