/**
 * Presence Breath
 *
 * Phase 5: Ownership, Permanence & Breath
 *
 * Breathing is not animation.
 * Breathing is evidence of being.
 *
 * This module provides:
 * - Subtle camera vertical movement
 * - Natural breathing rhythm (3-5 seconds per cycle)
 * - Dampening when moving
 *
 * The breath should feel natural - not immediately obvious,
 * but noticeable when you pay attention.
 */

/**
 * Breath parameters tuned for realistic human breathing.
 *
 * Average human breathing rate: 12-20 breaths per minute
 * = 3-5 seconds per breath cycle
 */

// Period: 3-4.5 seconds per breath (realistic human range)
const BREATH_PERIOD_MIN = 3000;  // 3 seconds
const BREATH_PERIOD_MAX = 4500;  // 4.5 seconds

// Amplitude: 5cm vertical movement - clearly visible
// This ensures the breathing effect is definitely noticeable
const BREATH_AMPLITUDE_BASE = 0.05;

// How quickly breath dampens when moving
const BREATH_DAMPEN_SPEED = 4.0;

// Minimum breath when moving
const BREATH_DAMPEN_MIN = 0.3;

/**
 * PresenceBreath creates natural, organic vertical camera motion.
 */
export class PresenceBreath {
  private readonly seed: number;
  private elapsedTime: number = 0;
  private currentBreathOffset: number = 0;
  private currentDampen: number = 1;
  private targetDampen: number = 1;
  private phaseDrift: number = 0;

  constructor(seed: number) {
    this.seed = seed;
    this.phaseDrift = (seed % 1000) / 1000 * Math.PI * 2;
  }

  /**
   * Update breath state and return vertical offset.
   */
  update(deltaSeconds: number, isMoving: boolean): number {
    // Accumulate time in seconds (not milliseconds)
    this.elapsedTime += deltaSeconds;

    // Update movement dampening
    this.targetDampen = isMoving ? BREATH_DAMPEN_MIN : 1;
    const dampenDiff = this.targetDampen - this.currentDampen;
    this.currentDampen += dampenDiff * Math.min(1, deltaSeconds * BREATH_DAMPEN_SPEED);

    // Calculate breath offset
    this.currentBreathOffset = this.calculateBreathOffset();

    return this.currentBreathOffset * this.currentDampen;
  }

  /**
   * Calculate breath offset using overlapping sine waves.
   */
  private calculateBreathOffset(): number {
    // Convert period from ms to seconds for calculation
    const periodMinSec = BREATH_PERIOD_MIN / 1000;
    const periodMaxSec = BREATH_PERIOD_MAX / 1000;

    // Slowly vary the period for organic feel
    const periodVariation = this.slowNoise(this.elapsedTime * 0.1);
    const currentPeriod = periodMinSec + (periodMaxSec - periodMinSec) * periodVariation;

    // Primary breath wave
    const primaryPhase = (this.elapsedTime / currentPeriod) * Math.PI * 2;
    const primaryWave = Math.sin(primaryPhase + this.phaseDrift);

    // Secondary wave for slight irregularity (slower, smaller)
    const secondaryPeriod = currentPeriod * 1.618; // Golden ratio
    const secondaryPhase = (this.elapsedTime / secondaryPeriod) * Math.PI * 2;
    const secondaryWave = Math.sin(secondaryPhase + this.phaseDrift * 1.3) * 0.2;

    // Combine waves (primary dominates)
    const combinedWave = primaryWave + secondaryWave;

    // Normalize to roughly -1 to 1
    const normalizedWave = combinedWave / 1.2;

    // Apply amplitude
    return normalizedWave * BREATH_AMPLITUDE_BASE;
  }

  /**
   * Simple deterministic noise for slow variation.
   */
  private slowNoise(t: number): number {
    const a = Math.sin(t * 1.0 + this.seed * 0.1) * 0.5 + 0.5;
    const b = Math.sin(t * 1.618 + this.seed * 0.2) * 0.5 + 0.5;
    return (a + b) / 2;
  }

  getCurrentOffset(): number {
    return this.currentBreathOffset * this.currentDampen;
  }

  getDampenFactor(): number {
    return this.currentDampen;
  }
}
