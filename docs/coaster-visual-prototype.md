# Coaster visual study 01

Open `/?prototype=coaster` on the deployed site or local dev server.
The normal URL keeps the existing briefing game. This is a separate presentation/motion prototype, not a replacement production game.

## What to evaluate

- Does the opening crest and large visible drop immediately read as a rollercoaster?
- Do four individually sampled cars, visible wheels/couplings, rails/ties and steel trestles make the ride feel physical?
- Does accelerating downhill and losing momentum on the recovery feel compelling?
- Is the restrained candlestick skyline recognizably financial without overpowering the train?

Ride the drop starts the short sequence. Pause, Replay, held Boost/Brake, Space/Shift and touch controls are available.
The scene stops on tab hiding or blur. Reduced motion suppresses effect streaks and camera easing. No animation starts before pressing Ride.
All art is original procedural Canvas 2D geometry; the supplied concept images are art direction references, not pasted backgrounds.
This first study uses illustrated shapes and gradients. It does not claim the final cinematic 3D materials/passenger detail of those references.
The next decision is whether the silhouette, movement and camera are worth carrying into the main game.

No editorial content, scoring, 60-second game rules, or release approval has changed. No analytics, autoplay audio or external assets were added.

## Modules

`src/prototype/geometry.ts`: illustrative sampled track and arc-length interpolation.
`track.ts`: paired rails, cross ties, trestles and footings.
`train.ts`: independently oriented cars, couplings, passengers, wheels and held-input effect streaks.
`scenery.ts`: restrained layered candlestick landscape, grid and haze.
`prototype.ts` / `.css`: camera, momentum, responsive scene, pause/replay and safe input release.

Validation: Chromium and mobile WebKit prototype smoke tests capture crest/drop screenshots, complete the sequence, pause/replay and release held input.
Physical-phone performance and visual preference still need user review.

Reviewed screenshots: [desktop crest](qa/coaster-study/desktop-crest.png), [desktop drop](qa/coaster-study/desktop-drop.png), [mobile crest](qa/coaster-study/mobile-crest.png).
