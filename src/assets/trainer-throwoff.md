# Trainer throw-off artwork

`trainer-throwoff.png` is original unbranded artwork generated once with the built-in image-generation tool, selected in the standalone trainer-toggle lab, and copied unchanged into production. The lab was removed after approval of the production version; this asset and its provenance remain part of the app.

The 1254 × 1254 RGB PNG has no alpha channel. Although transparency was requested, the output contains a baked checkerboard. `src/components/training/trainerThrowoff.css` clips the two silhouettes at display time; no background-removal script or image edit was used. No external product photography, footage, or manufacturer branding is bundled.

`TrainerToggle.jsx` imports the atlas and supplies its resolved URL through `--throwoff-atlas`. Both clipped layers inherit that value. This keeps the image base-path-aware in local development and the production build, without a relative CSS image path resolving against the app page.

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
