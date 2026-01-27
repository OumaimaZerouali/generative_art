/**
 * Threshold Zones
 *
 * Maps user position and camera orientation to world parameters.
 *
 * The threshold space is ~40 units wide (X: -20 to +20) and ~30 units deep (Z: 0 to +30).
 * Movement along these axes influences the world that will be created.
 *
 * | User Action          | What Changes                 | Parameters Affected        |
 * |---------------------|------------------------------|----------------------------|
 * | Move left/right (X) | Atmosphere: calm ↔ energetic | fogDensity, flowScale      |
 * | Move forward/back   | Density: sparse ↔ dense      | density, flowComplexity    |
 * | Look up/down        | Structure: horiz ↔ vertical  | verticalBias               |
 */

/**
 * Clamps a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Zone bounds for the threshold space.
 */
export const ZONE_BOUNDS = {
  X_MIN: -20,
  X_MAX: 20,
  Z_MIN: 0,
  Z_MAX: 30,
} as const;

/**
 * Calculates fog density from X position.
 * Left (-20) = dense fog (calm), Right (+20) = sparse fog (energetic)
 */
export function calculateFogDensity(positionX: number): number {
  const normX = clamp((positionX - ZONE_BOUNDS.X_MIN) / (ZONE_BOUNDS.X_MAX - ZONE_BOUNDS.X_MIN), 0, 1);
  // Dense fog (0.05) on left, sparse fog (0.01) on right
  return lerp(0.05, 0.01, normX);
}

/**
 * Calculates flow scale from X position.
 * Left (-20) = slow, gentle flow (0.5), Right (+20) = fast, energetic flow (2.0)
 */
export function calculateFlowScale(positionX: number): number {
  const normX = clamp((positionX - ZONE_BOUNDS.X_MIN) / (ZONE_BOUNDS.X_MAX - ZONE_BOUNDS.X_MIN), 0, 1);
  return lerp(0.5, 2.0, normX);
}

/**
 * Calculates density from Z position.
 * Near (0) = sparse (0.1), Far (+30) = dense (1.0)
 */
export function calculateDensity(positionZ: number): number {
  const normZ = clamp(positionZ / ZONE_BOUNDS.Z_MAX, 0, 1);
  return lerp(0.1, 1.0, normZ);
}

/**
 * Calculates flow complexity from Z position.
 * Near (0) = simple (0.2), Far (+30) = complex (1.0)
 */
export function calculateFlowComplexity(positionZ: number): number {
  const normZ = clamp(positionZ / ZONE_BOUNDS.Z_MAX, 0, 1);
  return lerp(0.2, 1.0, normZ);
}

/**
 * Calculates vertical bias from camera pitch.
 * Looking down (-PI/2) = horizontal (0), Looking up (+PI/2) = vertical (1)
 */
export function calculateVerticalBias(pitch: number): number {
  // Pitch typically ranges from -PI/2 (looking down) to +PI/2 (looking up)
  const normPitch = clamp((pitch + Math.PI / 2) / Math.PI, 0, 1);
  return normPitch;
}

/**
 * Parameters derived from position and orientation.
 */
export interface ZoneParameters {
  fogDensity: number;
  flowScale: number;
  flowComplexity: number;
  density: number;
  verticalBias: number;
}

/**
 * Calculates all parameters from position and pitch.
 */
export function calculateZoneParameters(
  positionX: number,
  positionZ: number,
  pitch: number
): ZoneParameters {
  return {
    fogDensity: calculateFogDensity(positionX),
    flowScale: calculateFlowScale(positionX),
    flowComplexity: calculateFlowComplexity(positionZ),
    density: calculateDensity(positionZ),
    verticalBias: calculateVerticalBias(pitch),
  };
}
