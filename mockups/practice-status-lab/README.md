# Practice status study — round 2

Open `/metronome-app/mockups/practice-status-lab/` on the existing local Vite server.

The user's selected design stays first as the reference. The other four concepts
from round 1 have been replaced:

- **05 Practice rack (refined)** — steady rows, aligned current values, explicit
  bar counts and subdued targets. Left-side icons and colored markers are removed.
- **06 Count rings** — one circular bar-progress indicator per active trainer.
- **07 Change ledger** — columns for the current state, next state, and bars until
  the change; a completed tempo trainer displays its target state.
- **08 Tool tiles** — a separate vertical tile per trainer, with large values or
  notation and a bar-progress line along the bottom.
- **09 Signal lines** — frameless rows with compact values and progress rules.

Controls toggle each trainer, select a gap pattern, jump to click/gap/paused
states, advance one bar, or animate a silent visual preview. All designs use the
same demo state. Status buttons reveal a read-only detail panel. The view selector
isolates a design for closer comparison. Progress indicators include the current
bar; “in 1 bar” means the change happens after the current bar finishes.

This entry point imports only existing read-only music notation, trainer icons,
and orbit drawing components. It does not import the app entry point, audio
engine, local settings, or service-worker registration. Production does not
import this mockup. Remove this folder to remove the study.
