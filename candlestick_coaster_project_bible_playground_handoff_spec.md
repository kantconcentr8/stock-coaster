# Candlestick Coaster: Project Bible & Prompt Handoff Specification

## 1. Executive Summary & Vision
* **Concept:** Stock market candlestick chart dynamics merged with arcade rollercoaster gravity physics and kart racing.
* **Target Platform:** Google Playground (`playground.google`) via HTML5/JavaScript Canvas (Phaser.js / custom 2D engine).
* **Target Session Length:** 60–90 seconds ("Trading Day" session: 9:30 AM to 4:00 PM).
* **Core Loop:** Ride procedural financial trends across 3 rails, maximize momentum on red plunges, climb green uptrends with boost or pickups, dodge financial hazards, and end with the highest Net Portfolio Value.

---

## 2. Platform Realities & IP Legal Context (Google Playground)
* **Ownership:** Per the Google Playground Additional Terms of Service, Google does not claim ownership of user game concepts, code assemblies, or titles. Google retains underlying platform/engine IP (Gemini, Lyria, foundational assets).
* **Copyright Status:** Pure AI-generated code resides in the public domain under standard US copyright guidelines until meaningfully refactored, extended, or authored by human hand after exporting the `.zip`.
* **Monetization:** No platform-hosted ad-revenue or payout mechanism currently exists inside the hosted preview sandbox. Monetization requires exporting project files for independent web hosting (AdSense, web game networks, itch.io) or porting through **Unity Spark**.

---

## 3. Game Mechanics & Systems Architecture

### 3.1. Track Generation
* **Procedural Financial Curves:** The track is a continuous financial candlestick chart scrolling horizontally.
  * **Green Sections (Uptrends):** Steep inclines that decelerate the kart unless holding boost or hitting Buy Order boosters.
  * **Red Sections (Downtrends / Plunges):** High-speed gravity drops, loops, and dips that build extreme kinetic speed.
* **3-Rail Discrete Lane Layout:**
  * Top Rail: *Upper Bollinger Band*
  * Middle Rail: *VWAP (Volume-Weighted Average Price)*
  * Bottom Rail: *Lower Bollinger Band*

### 3.2. Pickups & Hazards
* **Bull Orbs (Pickups):** Spawns on random rails. Grants +$500 Portfolio Value and an instant nitro burst.
* **Margin Call Barriers (Hazards):** Flashing red walls on specific rails. Striking them cuts speed by 50% and induces invulnerability flashing.
* **VIX Volatility Multiplier:** Near-miss lane changes or sustaining peak speed raises the multiplier up to 4x.

### 3.3. Multiplayer Architectures Supported
1. **Asynchronous Ghost Racing:** Deterministic seed sync with recorded telemetry (`time`, `x`, `y`, `lane`, `isBoosting`) sampled every 100ms.
2. **Local Shared Screen (Co-op/Versus):** Both karts on one screen; dynamic midpoint camera with auto-respawn rubber banding if a player falls off the left screen edge.
3. **Local Split-Screen:** Independent top/bottom viewports rendering the same seed.

### 3.4. Input & Haptics Stack
* **Keyboard Fallback:**
  * P1: `W` (Accelerate), `S` (Brake), `A`/`D` (Shift Rails).
  * P2: `Up Arrow` (Accelerate), `Down Arrow` (Brake), `Left`/`Right Arrow` (Shift Rails).
* **Gamepad API:** Full `navigator.getGamepads()` integration mapped to Standard Gamepad specs with an analog stick deadzone threshold of `0.25` and debounced lane-switch latches.
* **Vibration Actuator:** Native browser haptics via `gamepad.vibrationActuator.playEffect('dual-rumble', ...)`.

---

## 4. Sequential Prompt Handoff Runbook

Use the following prompts sequentially inside the Google Playground chat interface. Wait for each build to compile and verify functionality before issuing the next prompt.

### Phase 1: Core Engine & Physics
```text
Build a fast-paced 2D side-scrolling arcade rollercoaster racing game called 'Candlestick Coaster'.
1. Visuals & Track: The track continuously procedurally generates to resemble a stock price chart with green (upward slopes) and red (downward plunges) sections across a dark grid background.
2. Controls: The player controls a retro coaster kart. Use Arrow Up or Spacebar to accelerate/boost, and Left/Right arrows (or A/D) to shift between 3 vertical coaster rails (Top, Middle, Bottom). Prevent default browser scrolling on arrow keys.
3. Physics: Going down red plunge tracks naturally accelerates the kart due to gravity. Going up steep green tracks slows the kart down unless holding boost.
4. Game Loop: A 60-second market timer counts down from 9:30 AM to 4:00 PM. Keep track of a 'Portfolio Score' that increases with speed and track progress. If speed drops to zero on a steep hill, roll backwards slightly until momentum is regained. Provide a clean UI showing Speed, Time, and Score, with an instant Restart button on Game Over.
```

### Phase 2: Pickups, Hazards & Audio Cues
```text
Now add interactive objects and visual polish across the 3 rails:
1. Bull Orbs: Add floating green neon 'Bull Orbs' across rails that give +$500 score and a brief speed burst upon contact.
2. Margin Call Hazards: Add red flashing 'Margin Call' barrier hazards on random rails. If hit, the kart loses half its current speed and flashes invulnerable for 1.5 seconds.
3. Audio/Visual Juice: When plunging down a red drop, add wind trail particles and an accelerating coaster rattle sound effect. When crossing the finish timer, sound an arcade closing bell and display a 'Final Portfolio Summary' with a Play Again button.
4. Volatility Multiplier (VIX): Every time the player shifts lanes right before hitting an obstacle (near-miss) or maintains top speed, increase a multiplier meter up to 4x.
```

### Phase 3: Ghost Racing & Deterministic Seeding
```text
Convert Candlestick Coaster into an asynchronous ghost-racing arcade runner:
1. Deterministic Seeding: Base all procedural track generation and obstacle/pickup spawns on a daily or URL-based random number seed (e.g., read from '?seed=' or default to a numeric constant). Ensure identical track geometry on every replay.
2. Ghost Telemetry Recorder: While racing, record the player's telemetry every 100ms into an array: [{ time, x, y, lane, isBoosting }].
3. Ghost Racer: If a previous ghost run exists in localStorage for the active track seed, spawn a semi-transparent 'Ghost Kart' (cyan neon silhouette with 40% opacity) that replays those coordinates simultaneously alongside the player without physical collision.
4. HUD Delta: Add a live delta timer under the speedometer showing whether the player is ahead or behind the ghost (e.g., '+0.42s' in green or '-0.18s' in red).
```

### Phase 4: Local Shared-Screen 2-Player Mode
```text
Add a local 2-player couch versus mode on a shared screen:
1. Controls:
   - Player 1 (The Bull - Green Kart): W (Boost), S (Brake), A/D (Shift Rails).
   - Player 2 (The Bear - Red Kart): Up Arrow (Boost), Down Arrow (Brake), Left/Right Arrows (Shift Rails).
2. Dynamic Camera: Both players race on the same track simultaneously. Keep the camera centered on the midpoint between both karts.
3. Rubber-Banding: If a trailing player gets pushed completely off the left screen edge, auto-respawn them 100px behind the leader with a -$1,000 Portfolio penalty.
4. Dual HUD: Top Left shows P1 Net Worth, Speed, and Boost Meter; Top Right shows P2 Net Worth, Speed, and Boost Meter.
```

### Phase 5: HTML5 Gamepad API Controller Mapping
```text
Add HTML5 Gamepad API controller support for local multiplayer:
1. Polling Loop: Query navigator.getGamepads() in requestAnimationFrame.
2. Device Mapping:
   - Gamepad Index 0 maps to Player 1; Gamepad Index 1 maps to Player 2.
   - Fall back to keyboard controls for any player without an active controller.
3. Standard Mapping:
   - Shift Rails: D-Pad Left/Right (Buttons 14 & 15) or Left Stick X-axis (axes[0]) with a 0.25 deadzone threshold.
   - Boost: South face button (Button 0) or Right Trigger (Button 7).
   - Brake: East face button (Button 1) or Left Trigger (Button 6).
4. Edge Triggering: Add a debounced latch on rail shifts so one physical stick flick moves only one rail until returned to neutral.
5. HUD Indicators: Display glowing controller badges in the HUD when a gamepad is connected.
```

### Phase 6: Gamepad Haptic Actuator (Rumble)
```text
Add controller rumble and tactile feedback using the HTML5 Gamepad Vibration Actuator API:
1. Safe Execution: Create a reusable function triggerRumble(playerIndex, { duration, strongMagnitude, weakMagnitude }). Wrap calls in a try...catch block to fail gracefully if vibrationActuator is missing.
2. Vibration Profiles:
   - Margin Call Impact: { duration: 250, strongMagnitude: 1.0, weakMagnitude: 0.8 }
   - Bull Orb Pickup: { duration: 120, strongMagnitude: 0.1, weakMagnitude: 0.7 }
   - Plunging Drops (>80% top speed): { duration: 100, strongMagnitude: 0.25, weakMagnitude: 0.1 }, throttled to fire once every 90ms.
   - Rail Shift: { duration: 50, strongMagnitude: 0.0, weakMagnitude: 0.3 }
3. Cleanup: Automatically cancel active vibration calls on Pause or Game Over.
```

---

## 5. Technical Troubleshooting & Edge Cases

| Symptom | Probable Cause | Fix / Corrective Action |
| :--- | :--- | :--- |
| **Gamepad not registering** | Browser requires user gesture focus | Tap the game canvas and press any physical controller button (e.g., A/Cross). |
| **Kart skips 2 rails on 1 stick flick** | Continuous axis polling without latch | Implement a debounced release flag requiring axis return to `< 0.1` before registering another shift. |
| **Console errors on rumble trigger** | Actuator promise collision or unsupported browser | Ensure `vibrationActuator.playEffect()` is called with `try...catch` and throttled to prevent overlapping promises. |
| **Browser window scrolls down mid-game** | Arrow keys/Space trigger default scroll | Ensure `event.preventDefault()` is invoked on `keydown` listeners for game keys. |
| **Track desyncs during ghost replays** | Non-deterministic random functions | Ensure all procedural offsets derive from a single seeded pseudo-random number generator (PRNG). |