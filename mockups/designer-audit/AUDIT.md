# Drums Only — designer audit

Reviewed 4 September 2026. Scope: the current local app, its Metronome, rhythm sheet, Polyrhythm, Training and Settings interfaces, responsive behavior, and the brand contract. This is a design and product-positioning review, not a timing benchmark, formal accessibility certification, or proof of demand. No production files were changed.

## Overall judgment

The app has a credible core. A large BPM display, a consistent dark foundation, useful training modes, per-click accents, and persistent playback controls are all worth keeping. The existing modal focus handling, touch-sized primary controls, and reduced-motion support are also good foundations.

The visual language currently feels assembled from several ideas: a stamped shop logo, a modern orbit, a branded badge slider, and realistic metal throw-offs. Each can be attractive individually. Together they make the identity less coherent and harder to adapt to a different drummer. The improvement is more disciplined hierarchy and consistency, not more decoration.

For an influencer, the strongest offer is **their own daily practice instrument, with their approach to practice built in**. A logo swap is a weaker reason for followers to choose a paid app when established alternatives are available. Creator presets and concise guidance can provide a more specific reason to buy without expanding into a course platform.

## 1. Main metronome and shared design language — P0

**Observed:** The BPM is prominent, but the thick orbit and badge thumb attract attention too. Tap tempo and rhythm editing rely on icons; the rhythm shortcut's numbers need interpretation. Navigation is only 10 px, with inactive labels rendered at 36% of the foreground color. Against the near-black canvas this is approximately **3.01:1 contrast**, calculated from the declared colors. That is too weak for these small essential labels. This is a targeted finding, not a full accessibility audit.

**Proposal:** Keep the orbit, reduce its visual weight, and increase the numeral's share of the composition. Use a stable brand accent for interaction and playback; make continuous tempo-color changes an optional expressive treatment if users value them. Use a familiar slider thumb, one clear primary Start/Stop action, and visible Tap tempo and Rhythm labels. Keep the brand compact and use the same button geometry everywhere.

**Design specification:** Warm charcoal canvas `#111515`; raised surface `#1B2020`; primary ink `#F4F1E9`; secondary ink `#A7B1AD`; interaction accent `#B1D5CB`; second rhythm `#B7B5F3`. Use a single interface family, tabular numerals for changing values, 15–16 px body text, 12–13 px supporting labels, 44 px minimum action targets, 14 px control corners, and 16 px panel corners. Brand display type can vary; controls and metrics should remain consistent. Validate every palette against its actual backgrounds. These are proposed tokens, not changes already applied to production.

**Preserve:** The compact logo as a real identity asset, the existing direct BPM editing and tap behavior, the engine's audio-timed visual callbacks, and the accessible rhythm sheet. The DO monogram in the concept is a layout placeholder, not a commissioned replacement logo.

**Mockup:** [01-instrument.html](01-instrument.html). Change tempo, tap, and start the silent visual pulse.

## 2. Rhythm editor — P0

**Observed:** The rhythm sheet gives a Polyrhythm toggle top billing, uses numeric subdivision menus, and asks users to learn the meaning of unlabeled accent dots. The current full control range is valuable; the first layer could communicate it more clearly.

**Proposal:** Make Standard and Polyrhythm explicit modes. Offer Quarter, Eighths, Triplets, and Sixteenths as common choices, retaining a custom 1–13 selector. Place click states in beat-numbered columns and show the Off / On / Accent key. Keep both polyrhythm voices labeled independently of color. Explain that trainers pause in Polyrhythm where that mode is chosen.

Keep the language **beats per bar**, not an invented time signature: the current app does not expose a time-signature denominator. The concept renders a complete editor for review; its content can remain in the current bottom sheet, including the current focus and dismissal behavior. Retain paging for very dense patterns in production.

**Mockup:** [02-rhythm.html](02-rhythm.html). Edit subdivisions, cycle click states, and compare both modes.

## 3. Training — P0

**Observed:** Trainer names and settings are clear to an experienced user, but they do less to explain the desired improvement. Metal throw-offs are distinctive and drum-specific; the separate gutter and material realism compete with the flat interface. Expanded settings push other trainers into scrolling, especially on short screens.

**Proposal:** Pair the result with the familiar tool name: “Hold your time / Gap Trainer,” “Build your speed / Tempo Trainer,” and “Feel every subdivision / Subdivision Trainer.” Add a compact click/silence strip and a one-sentence instruction. Use conventional switches as the broadly reusable default, reveal enabled configuration, and retain the shared transport.

This does not require abandoning the previously developed throw-off artwork. Treat it as an optional edition treatment and compare it with the conventional switch in a brief first-use test: can drummers tell whether it is enabled, switch it reliably, and understand what changes? Do not decide based only on novelty. Preserve the ability to combine trainers.

**Mockup:** [03-training.html](03-training.html). Toggle trainers and change the gap cycle.

## 4. Sound and settings — P1

**Observed:** Nested cards give volume and sound selection more visual bulk than they need. Nine equally styled sound tiles provide little structure. Selecting and previewing a sound are coupled, although a drummer may want to audition without committing.

**Proposal:** One clear volume section followed by grouped Click, Percussion, and Spoken count rows. A persistent selected state sits apart from a labeled preview action. Use the same spacing, type, and navigation language as the main screen. Keep the existing nine sounds; this review is not a request for a larger library.

A creator-recorded voice could become an edition option later, but it adds recording and production work and is not necessary for the first sale. The present concept uses the existing samples and does not imply any creator has recorded a voice pack.

**Mockup:** [04-sound.html](04-sound.html). Selection and audible preview are independent. Embedded percussion and voice samples come from the current app. Synth previews approximate its synthesis.

## 5. Kit view — P1, new focused feature

**Observed:** The app uses a phone-width frame on larger displays and portrait orientation in the PWA manifest. This audit did not establish that small controls can be read comfortably from a seated playing position.

**Proposal:** Add a focused view with very large BPM numerals, a numbered beat strip, Start/Stop, and a tempo lock. Use available landscape width. Keep Stop accessible while locked. Return to the main screen for advanced editing. This is a new mode, not an existing capability disguised by the mockup.

Validate on real phones/tablets from a drummer's normal position, including short glances, sticks in hand, bright rooms, and dim rehearsal spaces. Screen wake lock, lock-screen playback, and background behavior must be designed around the supported platform and tested separately; the concept does not claim to implement them.

**Mockup:** [05-kit-view.html](05-kit-view.html). Start the pulse, lock tempo, and confirm Stop remains available. Open it at landscape width to see the wider composition.

## 6. Creator identity and first run — P1, greatest commercial value

**Observed:** The repository describes a drum-shop reseller model. Runtime logo, palette, fonts, and range artwork are configurable, but installable metadata still contains Drums Only defaults. There is no creator-authored welcome or collection of named practice presets.

**Proposal:** A consistent edition identity across the app name, header, app icon, install name, and first-run welcome. Give the drummer's audience a small collection of real exercises chosen and written by that creator. Each should open the current metronome/trainers with its configuration ready and a short note about what to listen for. Keep this within Training. Provide an immediate route to the plain metronome and avoid repeating the welcome on every launch.

The mockup shows a welcome, a three-exercise pack, and exercise detail, with three identity variants. Maya Reed and Eli Park are fictional examples; their names, product names, exercises, and guidance are illustrative. No endorsement, collaboration, or proven educational result is implied.

**Mockup:** [06-creator-edition.html](06-creator-edition.html). Change editions, open the collection, and select an exercise. Production preset persistence and application to the real audio engine remain proposed work.

## Commercial fit and market context

This market already has sophisticated metronomes. [Pro Metronome](https://eumlab.com/pro-metronome/) advertises subdivisions, polyrhythms, rhythm training, tempo automation, and stage-oriented features. [Soundbrenner](https://www.soundbrenner.com/pages/the-metronome-app) presents a broader product with saved songs/setlists and practice tracking. [Benny Greb's Gap Click](https://www.gapclick.app/) is a particularly relevant creator example: its official positioning connects the artist, a defined timing exercise, and a one-time purchase. These are vendor descriptions reviewed on 4 September 2026, not independent product benchmarks or evidence of their sales.

My inference: a focused creator edition can compete on identity, teaching relevance, and ease of daily use. Adding every competitor feature would weaken that focus. The current app's absence of a journal, setlists, or a general learning platform is not by itself a design defect.

At a hypothetical $2,000 setup price, $2 sales require 1,000 purchases just to equal that upfront amount in gross revenue; $3 sales require 667. Fees, refunds, taxes, support, and marketing increase the actual break-even volume. Audience size is not paid demand. The product should help an influencer make a credible offer, not promise that distribution guarantees profit.

Package the offer as a maintained metronome, a complete branded release, a small creator-authored preset collection, and usable launch materials, with an explicit support scope. Show the exact branded product before asking for a multi-thousand-dollar commitment. A short demonstration of a signature exercise is likely a more useful selling asset than a long feature list; test that hypothesis with prospective buyers.

## Release priorities and limits

1. **First design pass:** hierarchy, labels, readable secondary text, rhythm editor, trainer presentation. Preserve established engine and accessibility behavior.
2. **Before the first creator launch:** finish edition-wide metadata/icons, deliver real creator exercises, and verify the purchase/access/install path. The mockups cover the product direction, not a storefront or payment integration.
3. **Next focused enhancement:** kit view and tempo lock, validated on actual playing setups.

Do not market “best metronome” on this audit alone. Test timing stability, visual/audio alignment, long sessions, output changes, phone interruptions, locked-screen/background behavior, offline relaunch, small screens, and supported device/browser combinations. Test usability with drummers of different experience levels: set a tempo, create an accent pattern, start gap training, audition without changing sound, and stop from a distance. Define the supported platform clearly before selling the release.

Prototype verification and known limits are recorded in [README.md](README.md). No production implementation or deployment is included in this review.
