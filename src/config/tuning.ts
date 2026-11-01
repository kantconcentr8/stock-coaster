/**
 * Gameplay constants. Units: world units (wu), seconds of active simulation.
 * Values are starting guesses; P1.12 tunes them.
 */
export const SCORING_VERSION = 1;

export const TUNING = Object.freeze({
  /** Active run length in seconds. */
  RUN_SECONDS: 60,
  /** Fixed simulation step (s). */
  SIM_DT: 1 / 120,
  /** Max render-frame time accepted per tick (s); larger frames are clamped. */
  MAX_FRAME: 0.25,
  /** Start countdown length (s). */
  COUNTDOWN_SECONDS: 3,
  /** Countdown after resuming from pause (s). */
  RESUME_COUNTDOWN_SECONDS: 3,

  /** Minimum kart speed (wu/s). */
  vMin: 120,
  /** Cruise speed with no input (wu/s). */
  vCruise: 220,
  /** Max speed without boost (wu/s). */
  vMax: 320,
  /** Max speed while boosting (wu/s). */
  vMaxBoost: 420,

  /** Slope acceleration coefficient. */
  gravityK: 180,
  /** Speed drag coefficient (1/s). */
  drag: 0.4,
  /** Extra acceleration while boosting (wu/s^2). */
  boostAccel: 160,
  /** Deceleration while braking (wu/s^2). */
  brakeDecel: 220,
  /** Boost meter capacity (units). */
  boostCapacity: 100,
  /** Boost meter drain while boosting (units/s). */
  boostDrainPerSec: 35,
  /** Boost meter gained per pickup (units). */
  pickupBoost: 25,
  /** Points per pickup. */
  pickupPoints: 100,
  /** Speed multiplier applied on hazard hit. */
  hazardSpeedFactor: 0.6,
  /** Invulnerability after a hazard hit (s). */
  invulnSeconds: 1.5,
  /** Time to switch rails (s). */
  laneChangeSeconds: 0.25,
  /** Points per world unit travelled. */
  distancePointsPerWu: 0.05,
});
