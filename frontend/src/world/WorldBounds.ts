import * as THREE from 'three';
import { WorldBounds as BoundsDefinition } from './types';

/**
 * World Bounds
 *
 * Enforces invisible world limits.
 * The user should never feel trapped or constrained,
 * but the world has gentle boundaries that keep them safe.
 *
 * Boundaries are soft - they gently push back rather than
 * creating hard walls.
 */
export class WorldBounds {
  private bounds: BoundsDefinition;
  private softMargin: number;

  constructor(bounds: BoundsDefinition) {
    this.bounds = bounds;
    // Soft margin where pushback begins (10% of smallest dimension)
    this.softMargin = Math.min(bounds.x, bounds.y, bounds.z) * 0.1;
  }

  /**
   * Constrains a position to be within world bounds.
   * Uses soft boundaries that gently push back.
   */
  constrain(position: THREE.Vector3): THREE.Vector3 {
    const result = position.clone();

    // Apply soft constraints on each axis
    result.x = this.softConstrain(result.x, this.bounds.x);
    result.z = this.softConstrain(result.z, this.bounds.z);

    // Y axis has floor at 0 and ceiling at bounds.y
    result.y = Math.max(0, Math.min(this.bounds.y, result.y));

    return result;
  }

  /**
   * Applies soft constraint on a single axis.
   * Returns a pushback force that increases as you approach the edge.
   */
  private softConstrain(value: number, limit: number): number {
    const edge = limit - this.softMargin;

    if (Math.abs(value) <= edge) {
      return value;
    }

    // Calculate how far into the soft zone we are
    const overflow = Math.abs(value) - edge;
    const maxOverflow = this.softMargin;

    // Asymptotic pushback - gets stronger near the edge but never harsh
    const pushback = this.softMargin * (1 - Math.exp(-overflow / maxOverflow * 2));

    if (value > 0) {
      return edge + (this.softMargin - pushback);
    } else {
      return -(edge + (this.softMargin - pushback));
    }
  }

  /**
   * Checks if a position is within bounds.
   */
  isInBounds(position: THREE.Vector3): boolean {
    return (
      Math.abs(position.x) <= this.bounds.x &&
      position.y >= 0 &&
      position.y <= this.bounds.y &&
      Math.abs(position.z) <= this.bounds.z
    );
  }

  /**
   * Gets the center of the world.
   */
  getCenter(): THREE.Vector3 {
    return new THREE.Vector3(0, this.bounds.y / 2, 0);
  }

  /**
   * Gets a safe spawn position near the center.
   */
  getSafeSpawnPosition(): THREE.Vector3 {
    return new THREE.Vector3(0, 0, 0);
  }

  /**
   * Gets the raw bounds dimensions.
   */
  getDimensions(): BoundsDefinition {
    return { ...this.bounds };
  }
}

