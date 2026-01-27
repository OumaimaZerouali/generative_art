import * as THREE from 'three';

/**
 * Genesis
 *
 * Phase 8: Creation Without Control
 *
 * Observes the user's first moments in the world and derives
 * a WorldDefinition from their natural behavior.
 *
 * The user does not design the world.
 * The world emerges from how the user approaches it.
 *
 * This is witnessing, not profiling.
 */

/**
 * Observations gathered during the genesis moment.
 * These are coarse signals, not precise metrics.
 */
export interface GenesisObservations {
  // Time spent still before first movement (seconds)
  readonly stillnessBeforeMovement: number;

  // Direction of first movement (normalized)
  readonly firstMovementDirection: THREE.Vector3;

  // Initial camera orientation (pitch)
  readonly initialVerticalLook: number;

  // Average speed during genesis window
  readonly averageSpeed: number;

  // Number of direction changes
  readonly directionChanges: number;
}

/**
 * Genesis configuration derived from observations.
 * Maps natural behavior to world parameters.
 */
export interface GenesisConfig {
  // Flow field parameters
  readonly flowScale: number; // calm vs directional
  readonly flowComplexity: number; // simple vs layered

  // Geometry parameters
  readonly density: number; // sparse vs dense
  readonly verticalBias: number; // horizontal vs vertical

  // Ambient parameters
  readonly fogDensity: number; // open vs intimate
}

/**
 * The genesis window duration (seconds).
 * Short and calm - user should not notice they are being observed.
 */
const GENESIS_WINDOW = 8.0;

/**
 * Observes initial user behavior and derives world parameters.
 *
 * This happens once at the very beginning.
 * After the genesis window, the world commits and becomes permanent.
 */
export class Genesis {
  private startTime: number = 0;
  private isActive: boolean = true;
  private isComplete: boolean = false;

  // Observation data
  private hasMovedYet: boolean = false;
  private firstMovementTime: number = 0;
  private lastPosition: THREE.Vector3 = new THREE.Vector3();
  private lastDirection: THREE.Vector3 = new THREE.Vector3();
  private initialPitch: number = 0;
  private totalDistance: number = 0;
  private directionChangeCount: number = 0;

  constructor() {
    this.startTime = performance.now() / 1000;
  }

  /**
   * Updates the genesis observer with current state.
   *
   * @param position Current camera position
   * @param direction Current movement direction (normalized)
   * @param pitch Camera pitch in radians
   * @param deltaTime Time since last update
   * @returns true if genesis is still active, false if complete
   */
  update(
    position: THREE.Vector3,
    direction: THREE.Vector3,
    pitch: number,
    deltaTime: number
  ): boolean {
    if (!this.isActive) {
      return false;
    }

    const currentTime = performance.now() / 1000;
    const elapsed = currentTime - this.startTime;

    // Record initial pitch once
    if (elapsed < 0.1 && this.initialPitch === 0) {
      this.initialPitch = pitch;
    }

    // Detect first movement
    if (!this.hasMovedYet) {
      const moved = !position.equals(this.lastPosition);
      if (moved) {
        this.hasMovedYet = true;
        this.firstMovementTime = currentTime;
      }
    }

    // Track movement if user has moved
    if (this.hasMovedYet) {
      const distance = position.distanceTo(this.lastPosition);
      this.totalDistance += distance;

      // Detect direction changes (coarse)
      if (direction.length() > 0.1) {
        const angle = direction.angleTo(this.lastDirection);
        if (angle > Math.PI / 4) {
          // More than 45 degrees is a significant change
          this.directionChangeCount++;
        }
        this.lastDirection.copy(direction);
      }
    }

    this.lastPosition.copy(position);

    // Check if genesis window is complete
    if (elapsed >= GENESIS_WINDOW) {
      this.isActive = false;
      this.isComplete = true;
    }

    return this.isActive;
  }

  /**
   * Returns the observations gathered during genesis.
   * Only call this after genesis is complete.
   */
  getObservations(): GenesisObservations {
    if (!this.isComplete) {
      throw new Error('Genesis: Cannot get observations before genesis is complete');
    }

    const stillnessBeforeMovement = this.hasMovedYet
      ? this.firstMovementTime - this.startTime
      : GENESIS_WINDOW; // Never moved = full stillness

    const averageSpeed = this.totalDistance / GENESIS_WINDOW;

    // Default direction if never moved
    const firstMovementDirection = this.lastDirection.length() > 0
      ? this.lastDirection.clone().normalize()
      : new THREE.Vector3(0, 0, -1);

    return {
      stillnessBeforeMovement,
      firstMovementDirection,
      initialVerticalLook: this.initialPitch,
      averageSpeed,
      directionChanges: this.directionChangeCount,
    };
  }

  /**
   * Derives world configuration from observations.
   *
   * Phase 8 mappings (coarse, forgiving):
   * - Long stillness → calmer flow field
   * - Immediate movement → stronger directionality
   * - Vertical looking → more vertical structures
   * - Slow exploration → lower density
   * - Confident forward motion → longer lines
   *
   * These mappings are emotional, not precise.
   * Small differences must not matter.
   */
  static deriveConfig(observations: GenesisObservations): GenesisConfig {
    // Long stillness = calm flow (0.5-1.5 range, lower is calmer)
    const stillnessFactor = Math.min(1.0, observations.stillnessBeforeMovement / 5.0);
    const flowScale = 0.8 + (1.0 - stillnessFactor) * 0.7;

    // Direction changes = complexity (0-3 range maps to complexity)
    const changesFactor = Math.min(1.0, observations.directionChanges / 3.0);
    const flowComplexity = 0.3 + changesFactor * 0.5;

    // Speed influences density
    // Slow exploration (< 0.5 units/sec) = lower density
    const speedFactor = Math.min(1.0, observations.averageSpeed / 0.5);
    const density = 0.4 + speedFactor * 0.4;

    // Vertical look influences vertical bias
    // Abs pitch > 0.3 rad (~17 deg) = more vertical
    const verticalFactor = Math.min(1.0, Math.abs(observations.initialVerticalLook) / 0.5);
    const verticalBias = 0.3 + verticalFactor * 0.4;

    // Stillness influences fog density
    // More stillness = denser fog (more intimate)
    const fogDensity = 0.015 + stillnessFactor * 0.02;

    return {
      flowScale,
      flowComplexity,
      density,
      verticalBias,
      fogDensity,
    };
  }


  isGenesisComplete(): boolean {
    return this.isComplete;
  }
}

