# Trainer throw-off artwork

`trainer-throwoff.png` is original unbranded artwork generated once with the built-in image-generation tool and selected in the standalone trainer-toggle lab. The unchanged master is retained for reproducibility but is no longer imported into the app or its offline cache. The lab was removed after approval of the production version.

The 1254 × 1254 RGB master has no alpha channel and contains a baked checkerboard. `scripts/bake-throwoff.mjs` now compiles the previously approved CSS silhouettes into two transparent RGBA PNGs, with the housing shadow baked in. This is a deterministic rendering of the existing artwork and masks, not regenerated artwork. No external product photography, footage, or manufacturer branding is bundled.

`TrainerToggle.jsx` imports `trainer-throwoff-body.png` (91 × 255) and `trainer-throwoff-lever.png` (29 × 186) directly into decorative, non-draggable images. Vite resolves both URLs against the app base path. Together they are 34,243 bytes and 28,599 decoded pixels, replacing the 1,399,060-byte master in the production bundle. Runtime masking, shadow filtering, and the 1254 px scaled layers are gone; only small-image transforms animate. The artwork stays at full opacity in both the on and off states.

The sprites are sampled at at least 3x their CSS display size. To rebuild them, run `node scripts/bake-throwoff.mjs` with Sharp available in the development runtime (or via `NODE_PATH`). Sharp is an offline asset-compilation tool, not a new app dependency. The body crop is `(200, 0, 430, 1210)` at scale 0.07; the lever crop is `(800, 125, 160, 1050)` at scale 0.0588. The CSS dimensions and pivot account for those crops, preserving the original geometry through the entire swing. Keep the checked-in PNGs; normal app builds do not regenerate them.

This is a side-angle/three-quarter UI interpretation, not a precise 90-degree rendering, branded replica, or mechanical simulation. The detached lever pivot (903, 1083) registers to the housing hinge (516, 893), with lever scale 0.84 and a 26-degree release. The full assembly uses scale 0.07. Its rear housing edge sits within 0.1 px of the card's outer border, using a 45 px external gutter and 27 px internal clearance.

The artwork slides down 3 px when off and returns up when on. Release/engagement take 270/210 ms. A 2-degree press preload takes 65 ms. The card, native 64 × 114 px button, and focus outline remain stationary; switch state changes immediately. Reduced motion applies committed positions without transitions or preload. Polyrhythm uses native disabling without changing saved trainer configuration.

## Exact generation prompt

One built-in generation request. The earlier front-view atlas was a style reference only.

```text
Use case: product-mockup
Asset type: one transparent PNG sprite atlas for a premium understated metronome UI, with exactly two separate matching satin-nickel snare drum throw-off components.
Input image: the provided existing hardware atlas is a STYLE REFERENCE ONLY, for restrained satin-nickel finish and family resemblance. Completely change its front-facing viewing angle. Do not reproduce its broad front plate view.
Scene/backdrop: genuinely transparent background with actual alpha transparency. Square atlas, preferably 1024 by 1024 pixels. No ground, no card, no environment, no cast shadow background, and no baked checkerboard.
Camera and geometry: rotate the camera approximately 80–90 degrees around the vertical axis from the reference FRONT view. Render near-true SIDE ELEVATION, with only a slight 5–10-degree revealing angle so thin edges remain visible. Both components must share precisely the same side-view camera and scale. The housing has a visibly flat, vertical rear mounting side on its LEFT edge and the mechanism/hinge protrudes to its RIGHT, intended to attach to the right edge of a dark trainer card. Do not show a broad symmetrical front plate facing the viewer.
Subject and finish: premium, unbranded, slender snare-strainer hardware, with recognizable top adjustment knob, long housing, clamp and bottom hinge. Soft controlled highlights, fine subtle brushed satin nickel, clean machined contours. Restrained and crisp/simple enough to remain legible at approximately 80 pixels tall. No chrome glare or decorative embellishment.
Atlas layout:
LEFT HALF: stationary housing ONLY, upright, approximately x160..370 y130..900 on the 1024-square canvas. Flat vertical rear mounting edge on LEFT, mechanism protruding RIGHT. Visible circular hinge center near x350 y820. Absolutely NO lever attached to the housing. Keep the entire housing and knob in frame.
RIGHT HALF: detached lever ONLY, upright, approximately x700..790 y180..850. Long slim stem, readable paddle near the top, round pivot at the bottom with pivot center near x745 y820. The lever is one complete separate continuous piece, not segmented, at the same scale and side-view camera as the housing, suitable for rotating as a rigid sprite outward from its bottom pivot.
Constraints: exactly TWO separate pieces, no overlap, generous transparent padding around and between pieces. No other loose screws, parts, duplicates or variants. No labels, no lettering, no numbers, no logos, no watermark. Do not draw layout guides. Request actual transparent PNG alpha, never a painted checkerboard or white background.
```
