/**
 * World Time
 *
 * Centralized time management for the world.
 * Time is deterministic, continuous, and seed-based.
 *
 * Phase 3: Time must feel like weather, not animation.
 * - Changes occur over minutes, not seconds
 * - No visible start or end
 * - No recognizable loops
 * - No synchronization between elements
 */

/**
 * Time constants - all values are intentionally very slow.
 *
 * DRIFT_CYCLE_DURATION: How long (in seconds) for a complete drift cycle.
 * Set to 10 minutes (600 seconds) so changes are imperceptible.
 *
 * The world must never feel like it "resets".
 */
const DRIFT_CYCLE_DURATION = 600; // 10 minutes for one cycle

/**
 * WorldTime manages the passage of time in the world.
 *
 * Time is expressed as slowly increasing scalars and phase values.
 * All time-based calculations are deterministic given the same inputs.
 */
export class WorldTime {
  private readonly seed: number;
  private elapsedTime: number = 0;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Advances time by the given delta (in seconds).
   * This should be called once per frame.
   */
  tick(deltaSeconds: number): void {
    this.elapsedTime += deltaSeconds;
  }

  /**
   * Gets the current drift phase (0 to 1).
   *
   * This value changes very slowly over DRIFT_CYCLE_DURATION.
   * Used to bias the flow field direction over time.
   *
   * The phase is continuous and never "resets" visibly.
   */
  getDriftPhase(): number {
    // Use a very slow sine wave that never quite repeats the same way
    // by incorporating the seed into the calculation
    const basePhase = this.elapsedTime / DRIFT_CYCLE_DURATION;

    // Create a non-repeating feel by combining multiple slow frequencies
    const seedOffset = (this.seed % 1000) / 1000;
    const phase1 = Math.sin(basePhase * Math.PI * 2 + seedOffset * Math.PI);
    const phase2 = Math.sin(basePhase * Math.PI * 0.7 + seedOffset * Math.PI * 1.3);

    // Combine and normalize to 0-1 range
    return (phase1 * 0.6 + phase2 * 0.4 + 1) / 2;
  }

  /**
   * Gets a drift vector that slowly rotates over time.
   *
   * This is used to bias the flow field direction.
   * The rotation is extremely slow - imperceptible moment to moment.
   *
   * Returns {x, z} components for horizontal drift.
   * Y is intentionally not included to keep motion grounded.
   */
  getDriftBias(): { x: number; z: number } {
    const phase = this.getDriftPhase();

    // Very slow rotation in the horizontal plane
    // Amplitude is small (0.1) so the effect is subtle
    const angle = phase * Math.PI * 2;
    const amplitude = 0.08; // Very subtle - 8% influence

    return {
      x: Math.cos(angle) * amplitude,
      z: Math.sin(angle) * amplitude,
    };
  }

  /**
   * Gets a breath factor for subtle opacity variations.
   *
   * This value oscillates very slowly between 0.95 and 1.05.
   * Used for sub-perceptual breathing of line opacity.
   */
  getBreathFactor(): number {
    // Even slower than drift - 15 minute cycle
    const breathPhase = this.elapsedTime / 900;
    const seedOffset = (this.seed % 500) / 500;

    // Oscillate between 0.95 and 1.05 (5% variation)
    return 1 + Math.sin(breathPhase * Math.PI * 2 + seedOffset) * 0.03;
  }

  /**
   * Gets the total elapsed time in seconds.
   */
  getElapsedTime(): number {
    return this.elapsedTime;
  }

  /**
   * Gets a deterministic time value that can be used in noise functions.
   * This creates smooth, non-repeating temporal variation.
   */
  getNoiseTime(): number {
    // Scale time so it moves very slowly through noise space
    // 0.001 means it takes 1000 seconds to move 1 unit in noise space
    return this.elapsedTime * 0.001;
  }
}

