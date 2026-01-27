import * as THREE from 'three';
import { WorldBounds } from './types';
import { FlowFieldManager } from '../engine/FlowField';
import { SeededRandom } from '../engine/Determinism';
import { WorldTime } from '../engine/WorldTime';

/**
 * Line Field Generator
 *
 * Generates 3D lines that follow the invisible flow field.
 * Lines are the only visible geometry - they reveal the spatial law
 * without depicting it directly.
 *
 * The flow field is a law, not a visual.
 * Lines are evidence of that law.
 *
 * Phase 3: Lines breathe slowly with the world.
 * - No per-frame regeneration
 * - Subtle vertex interpolation
 * - Changes occur over minutes
 */

/**
 * Configuration for line generation.
 * All values are derived from the world definition.
 */
interface LineFieldConfig {
  readonly lineCount: number;
  readonly stepsPerLine: number;
  readonly stepSize: number;
  readonly baseOpacity: number;
}

/**
 * Stored line data for Phase 3 breathing updates.
 */
interface LineData {
  readonly line: THREE.Line;
  readonly geometry: THREE.BufferGeometry;
  readonly originalPositions: Float32Array;
  readonly startPosition: THREE.Vector3;
  readonly material: THREE.LineBasicMaterial;
}

/**
 * Generates line geometry from flow field sampling.
 *
 * For each line:
 * 1. Choose a start position inside WorldBounds
 * 2. Sample the flow field
 * 3. Move a small step in that direction
 * 4. Record the point
 * 5. Repeat for a fixed number of steps
 * 6. Stop if bounds are exceeded
 *
 * Phase 3: Lines can be updated subtly over time.
 */
export class LineFieldGenerator {
  private readonly scene: THREE.Scene;
  private readonly flowFields: FlowFieldManager;
  private readonly bounds: WorldBounds;
  private readonly seed: number;
  private readonly palette: readonly string[];

  // Phase 3: Store line references for breathing updates
  private readonly lines: LineData[] = [];

  constructor(
    scene: THREE.Scene,
    flowFields: FlowFieldManager,
    bounds: WorldBounds,
    seed: number,
    palette: readonly string[]
  ) {
    this.scene = scene;
    this.flowFields = flowFields;
    this.bounds = bounds;
    this.seed = seed;
    this.palette = palette;
  }

  /**
   * Generates all lines for the world.
   *
   * Line count is kept to hundreds, not thousands.
   * Line length > line count.
   */
  generate(density: number): void {
    const config = this.calculateConfig(density);
    const random = new SeededRandom(this.seed);

    for (let i = 0; i < config.lineCount; i++) {
      this.generateSingleLine(random, config, i);
    }
  }

  /**
   * Phase 3: Update lines based on world time.
   *
   * This creates sub-perceptual breathing:
   * - Very slow vertex displacement based on flow field drift
   * - Subtle opacity variation
   *
   * Changes must be imperceptible moment to moment.
   * Only noticeable after standing still for 30-60 seconds.
   */
  update(worldTime: WorldTime): void {
    const driftBias = worldTime.getDriftBias();
    const breathFactor = worldTime.getBreathFactor();

    // Update each line with very subtle changes
    for (const lineData of this.lines) {
      this.updateLine(lineData, driftBias, breathFactor);
    }
  }

  /**
   * Updates a single line with subtle breathing.
   *
   * Phase 6: Even more restrained displacement.
   * The displacement is extremely small.
   * Motion must fade into imperceptibility.
   */
  private updateLine(
    lineData: LineData,
    driftBias: { x: number; z: number },
    breathFactor: number
  ): void {
    const positions = lineData.geometry.attributes.position.array as Float32Array;
    const original = lineData.originalPositions;

    // Phase 6: Reduced displacement - more stillness
    const displacementScale = 0.008;

    for (let i = 0; i < positions.length; i += 3) {
      // Apply drift bias as tiny displacement
      // Scale by vertex index to create gentle wave effect along line
      const vertexIndex = i / 3;
      const wavePhase = vertexIndex * 0.1;
      const waveInfluence = Math.sin(wavePhase) * 0.5 + 0.5;

      positions[i] = original[i] + driftBias.x * displacementScale * waveInfluence;
      positions[i + 1] = original[i + 1]; // Y unchanged - keep grounded
      positions[i + 2] = original[i + 2] + driftBias.z * displacementScale * waveInfluence;
    }

    lineData.geometry.attributes.position.needsUpdate = true;

    // Subtle opacity breathing
    const baseOpacity = lineData.material.userData.baseOpacity || lineData.material.opacity;
    lineData.material.opacity = baseOpacity * breathFactor;
  }

  /**
   * Calculates generation configuration based on world parameters.
   *
   * More visible art - increased density and opacity.
   */
  private calculateConfig(density: number): LineFieldConfig {
    // More lines for richer visual experience
    const lineCount = Math.floor(200 + density * 300);

    // Long lines reveal the flow better than many short ones
    const stepsPerLine = 60;

    // Step size affects smoothness - smaller = smoother curves
    const stepSize = 0.6;

    // Higher opacity for more visible art
    const baseOpacity = 0.5;

    return {
      lineCount,
      stepsPerLine,
      stepSize,
      baseOpacity,
    };
  }

  /**
   * Phase 6: Calculates spatial density factor for negative space.
   *
   * Large areas must exist where nothing happens.
   * Density varies gently - some regions sparse, some denser.
   * No visible borders - transitions are slow.
   *
   * Returns 0-1, where lower values mean fewer lines spawn here.
   */
  private calculateDensityFactor(position: THREE.Vector3): number {
    const centerDistance = Math.sqrt(
      position.x * position.x + position.z * position.z
    );
    const maxDistance = Math.sqrt(
      this.bounds.x * this.bounds.x + this.bounds.z * this.bounds.z
    );
    const distanceRatio = centerDistance / maxDistance;

    // More density toward center, sparse at edges
    // But not uniform - add variation
    const random = new SeededRandom(this.seed + position.x * 100 + position.z * 10);
    const variation = random.range(0.3, 1.0);

    // Gentle falloff with variation
    const baseDensity = Math.pow(1.0 - distanceRatio * 0.8, 2.0);

    return baseDensity * variation;
  }

  /**
   * Generates a single line following the flow field.
   *
   * Phase 6: Respects density variation for intentional absence.
   */
  private generateSingleLine(
    random: SeededRandom,
    config: LineFieldConfig,
    index: number
  ): void {
    const points: THREE.Vector3[] = [];

    // Start position: distributed throughout the world bounds
    // Keep art lower (0.2 to 6 units high) so it's more at eye level
    const startPos = new THREE.Vector3(
      random.range(-this.bounds.x * 0.9, this.bounds.x * 0.9),
      random.range(0.2, Math.min(6, this.bounds.y * 0.3)),
      random.range(-this.bounds.z * 0.9, this.bounds.z * 0.9)
    );

    // Phase 6: Check density factor - skip if in sparse region
    const densityFactor = this.calculateDensityFactor(startPos);
    if (random.next() > densityFactor) {
      // Intentional absence - this line doesn't exist
      return;
    }

    let currentPos = startPos.clone();
    points.push(currentPos.clone());

    // Trace the line through the flow field
    for (let step = 0; step < config.stepsPerLine; step++) {
      // Sample flow field at current position
      const flowVector = this.flowFields.getCombinedVector(currentPos);

      // If no flow, stop the line
      if (flowVector.length() < 0.001) {
        break;
      }

      // Move along flow direction
      const nextPos = currentPos.clone().add(
        flowVector.normalize().multiplyScalar(config.stepSize)
      );

      // Stop if we leave bounds
      if (!this.isInBounds(nextPos)) {
        break;
      }

      currentPos = nextPos;
      points.push(currentPos.clone());
    }

    // Only create geometry if we have enough points
    if (points.length < 3) {
      return;
    }

    // Create the line and store reference for Phase 3 updates
    this.createLine(points, config, startPos);
  }

  /**
   * Creates Three.js line geometry from points.
   */
  private createLine(
    points: THREE.Vector3[],
    config: LineFieldConfig,
    startPosition: THREE.Vector3
  ): void {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Store original positions for Phase 3 breathing
    const positions = geometry.attributes.position.array as Float32Array;
    const originalPositions = new Float32Array(positions.length);
    originalPositions.set(positions);

    // Color based on structure, not decoration
    const color = this.calculateColor(points);
    const opacity = config.baseOpacity * (0.6 + Math.random() * 0.4);

    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      linewidth: 1,
    });

    // Store base opacity for breathing calculations
    material.userData.baseOpacity = opacity;

    const line = new THREE.Line(geometry, material);
    this.scene.add(line);

    // Phase 3: Store line data for breathing updates
    this.lines.push({
      line,
      geometry,
      originalPositions,
      startPosition,
      material,
    });
  }

  /**
   * Calculates color based on structural properties.
   *
   * Color sources (as per instructions):
   * - Direction of flow
   * - Height
   * - Distance from center
   *
   * Colors must be muted and coherent.
   */
  private calculateColor(points: THREE.Vector3[]): THREE.Color {
    if (this.palette.length === 0) {
      return new THREE.Color(0x4a4a6a);
    }

    // Use start point for structural color calculation
    const startPoint = points[0];
    const endPoint = points[points.length - 1];

    // Calculate flow direction influence
    const direction = new THREE.Vector3()
      .subVectors(endPoint, startPoint)
      .normalize();

    // Height influence (0-1 based on y position)
    const heightFactor = Math.min(1, Math.max(0, startPoint.y / this.bounds.y));

    // Distance from center influence
    const distanceFromCenter = Math.sqrt(
      startPoint.x * startPoint.x + startPoint.z * startPoint.z
    );
    const maxDistance = Math.sqrt(
      this.bounds.x * this.bounds.x + this.bounds.z * this.bounds.z
    );
    const distanceFactor = distanceFromCenter / maxDistance;

    // Combine factors to select palette color
    const combinedFactor = (heightFactor + distanceFactor + Math.abs(direction.y)) / 3;
    const paletteIndex = Math.floor(combinedFactor * (this.palette.length - 1));

    const baseColor = new THREE.Color(this.palette[paletteIndex]);

    // Keep colors more vibrant - less muting
    const hsl = { h: 0, s: 0, l: 0 };
    baseColor.getHSL(hsl);
    hsl.s *= 0.8; // Keep more saturation
    hsl.l = 0.4 + hsl.l * 0.4; // Brighter range
    baseColor.setHSL(hsl.h, hsl.s, hsl.l);

    return baseColor;
  }

  /**
   * Checks if a position is within world bounds.
   */
  private isInBounds(position: THREE.Vector3): boolean {
    return (
      Math.abs(position.x) < this.bounds.x &&
      position.y > 0 &&
      position.y < this.bounds.y &&
      Math.abs(position.z) < this.bounds.z
    );
  }
}
