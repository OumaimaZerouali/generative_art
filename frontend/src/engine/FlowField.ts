import * as THREE from 'three';
import { SimplexNoise } from './Noise';
import { FlowField as FlowFieldDefinition, FlowFieldType } from '../world/types';

/**
 * Flow Field
 *
 * A continuous vector field that provides direction and magnitude
 * at any point in 3D space. Used for particle movement and
 * geometry orientation.
 *
 * Phase 3: The flow field can drift slowly over time.
 * This drift is sub-perceptual - changes happen over minutes.
 */
export class FlowField {
  private readonly noise: SimplexNoise;
  private readonly scale: number;
  private readonly strength: number;
  private readonly type: FlowFieldType;

  constructor(definition: FlowFieldDefinition, seed: number) {
    this.noise = new SimplexNoise(seed);
    this.scale = definition.scale;
    this.strength = definition.strength;
    this.type = definition.type;
  }

  /**
   * Get the flow vector at a given position, with optional time-based drift.
   * The returned vector is normalized and scaled by strength.
   *
   * The flow field must feel like a slow current, not turbulence.
   * - Smooth
   * - Continuous
   * - Deterministic
   * - Calm
   *
   * @param position The 3D position to sample
   * @param driftBias Optional drift bias from WorldTime (Phase 3)
   */
  getVector(
    position: THREE.Vector3,
    driftBias?: { x: number; z: number }
  ): THREE.Vector3 {
    // Use lower frequency for smoother, calmer flow
    const smoothScale = this.scale * 0.3;
    const x = position.x * smoothScale;
    const y = position.y * smoothScale;
    const z = position.z * smoothScale;

    let vx: number, vy: number, vz: number;

    switch (this.type) {
      case 'CURL_NOISE':
        // Curl noise creates divergence-free fields (gentle swirling patterns)
        // Using smaller offsets for smoother gradients
        vx = this.noise.noise3D(x, y + 31.7, z) - this.noise.noise3D(x, y - 31.7, z);
        vy = this.noise.noise3D(x + 47.3, y, z) - this.noise.noise3D(x - 47.3, y, z);
        vz = this.noise.noise3D(x, y, z + 67.1) - this.noise.noise3D(x, y, z - 67.1);
        break;

      case 'PERLIN_NOISE':
      case 'SIMPLEX_NOISE':
        // Direct noise sampling - low frequency for smoothness
        vx = this.noise.noise3D(x, y, z);
        vy = this.noise.noise3D(x + 17.3, y + 31.1, z + 47.7) * 0.5; // Less vertical variation
        vz = this.noise.noise3D(x + 89.2, y + 67.4, z + 23.9);
        break;

      case 'VECTOR_NOISE':
        // Layered fbm with low octaves for smooth variation
        vx = this.noise.fbm3D(x, y, z, 2, 2, 0.4);
        vy = this.noise.fbm3D(x + 13.7, y + 29.3, z + 41.1, 2, 2, 0.4) * 0.5;
        vz = this.noise.fbm3D(x + 73.9, y + 53.7, z + 17.3, 2, 2, 0.4);
        break;

      case 'RANDOM':
      default:
        // Even "random" should be smooth - just use different noise offset
        vx = this.noise.noise3D(x * 0.7, y * 0.7, z * 0.7);
        vy = this.noise.noise3D(x * 0.7 + 100, y * 0.7 + 100, z * 0.7 + 100) * 0.4;
        vz = this.noise.noise3D(x * 0.7 + 200, y * 0.7 + 200, z * 0.7 + 200);
        break;
    }

    const vector = new THREE.Vector3(vx, vy, vz);

    // Apply time-based drift bias (Phase 3)
    // This subtly shifts the flow direction over time
    if (driftBias) {
      vector.x += driftBias.x;
      vector.z += driftBias.z;
    }

    if (vector.length() > 0) {
      vector.normalize();
    }
    return vector.multiplyScalar(this.strength);
  }

  /**
   * Get a single scalar value at a position.
   * Useful for density fields or height maps.
   */
  getScalar(position: THREE.Vector3): number {
    const x = position.x * this.scale;
    const y = position.y * this.scale;
    const z = position.z * this.scale;

    return this.noise.fbm3D(x, y, z, 4) * this.strength;
  }
}

/**
 * Manages multiple flow fields and provides combined sampling.
 *
 * Phase 3: Supports time-based drift for subtle world breathing.
 */
export class FlowFieldManager {
  private readonly fields: FlowField[] = [];

  constructor(definitions: readonly FlowFieldDefinition[], baseSeed: number) {
    definitions.forEach((def, index) => {
      this.fields.push(new FlowField(def, baseSeed + index * 1000));
    });
  }

  /**
   * Get combined flow vector from all fields.
   *
   * @param position The 3D position to sample
   * @param driftBias Optional drift bias from WorldTime (Phase 3)
   */
  getCombinedVector(
    position: THREE.Vector3,
    driftBias?: { x: number; z: number }
  ): THREE.Vector3 {
    if (this.fields.length === 0) {
      return new THREE.Vector3(0, 0, 0);
    }

    const combined = new THREE.Vector3(0, 0, 0);
    for (const field of this.fields) {
      combined.add(field.getVector(position, driftBias));
    }

    return combined.divideScalar(this.fields.length);
  }

  /**
   * Get the primary field (first defined).
   */
  getPrimary(): FlowField | undefined {
    return this.fields[0];
  }
}

