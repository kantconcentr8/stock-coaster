# Coaster passenger study 02

Open `/?prototype=coaster`. The normal URL retains the existing briefing game.
This separate Canvas 2D motion study uses original procedural artwork and illustrative track geometry, not historical market data or finished cinematic 3D art.

## Passenger experience

Start begins an automatic 28-second active-time ride: seven-second climb, three-second crest hesitation, five-second accelerating plunge, two-second trough, and eleven-second slower recovery to the next crest.
Four independently oriented cars, couplings, wheels, rails and trestles keep the train physical. Passengers raise their arms with speed; restrained air streaks accompany the plunge. Camera follow conveys the change in pace.

Brake, boost, momentum, predictions and scoring are absent. Start/Pause/Resume and Replay use native buttons (keyboard and touch); Escape pauses. Replay immediately restarts the ride. Completion offers Ride again.
Captions explain each illustrative section. They are motion-study copy, not a sourced or approved market briefing.
Sound defaults off. Optional original synthesized rail pulses and a speed-responsive rumble start only after a user gesture. Pause, completion, tab hiding, blur and page exit stop sound. Audio failure does not block the ride.
Reduced motion removes streaks, passenger arm motion and camera easing. Nothing moves before Start. Pausing freezes ride time, scenery and camera; resuming continues the same sequence. The frame delta is capped at 100ms to accommodate slower rendering without large jumps.

## Modules

- `geometry.ts`: illustrative sampled track and arc-length interpolation.
- `track.ts`: paired rails, ties, trestles and footings.
- `train.ts`: independent cars, passengers and speed-driven effects.
- `scenery.ts`: layered candlestick landscape, grid and haze.
- `prototype.ts` / `.css`: timed choreography, responsive camera/UI, captions and optional audio.

Verification uses Chromium desktop and iPhone 13 WebKit emulation: complete ride, caption order, pause stability, replay, native Space activation, Escape, reduced motion, blocked audio, blur and landscape control visibility. Crest, drop and landscape screenshots are saved under `test-results/`.
Physical-phone performance, audio quality and visual preference still require review. Editorial approval and Phase 5 release gates remain open; Phase 6 has not started. Analytics remains disabled.
