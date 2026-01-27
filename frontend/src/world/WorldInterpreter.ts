import * as THREE from 'three';
import { WorldDefinition, WorldBounds as Bounds } from './types';
import { FlowFieldManager } from '../engine/FlowField';
import { WorldTime } from '../engine/WorldTime';
import { LineFieldGenerator } from './LineFieldGenerator';

/**
 * World Interpreter
 *
 * Converts a WorldDefinition into Three.js geometry.
 * The backend defines what exists; this module defines how it feels.
 *
 * Phase 2: Only 3D lines are used as geometry.
 * No meshes. No textures. No particles. No sprites.
 *
 * Phase 3: The world breathes slowly over time.
 * Lines subtly shift with the drifting flow field.
 *
 * The world is governed by an invisible flow field.
 * Lines reveal the spatial law without depicting it.
 */
export class WorldInterpreter {
  private readonly scene: THREE.Scene;
  private readonly flowFields: FlowFieldManager;
  private readonly palette: readonly string[];
  private readonly seed: number;

  // Phase 3: Line generator stored for breathing updates
  private lineGenerator: LineFieldGenerator | null = null;

  constructor(scene: THREE.Scene, world: WorldDefinition) {
    this.scene = scene;
    this.flowFields = new FlowFieldManager(world.flowFields, world.seed);
    this.palette = world.palette;
    this.seed = world.seed;
  }

  /**
   * Interprets the world definition and generates geometry.
   *
   * Phase 2: Uses only lines governed by the flow field.
   */
  interpret(world: WorldDefinition): void {
    const bounds = world.bounds;

    // Create subtle ground reference (minimal, not distracting)
    this.createGroundReference(bounds);

    // Generate line field - the only visible geometry
    this.generateLineField(world, bounds);
  }

  /**
   * Phase 3: Update the world based on time.
   *
   * This allows the world to breathe - subtle, sub-perceptual changes
   * that make the world feel alive without being noticeable.
   */
  update(worldTime: WorldTime): void {
    if (this.lineGenerator) {
      this.lineGenerator.update(worldTime);
    }
  }

  /**
   * Creates a very subtle ground reference.
   * Phase 6: Even more minimal - just enough for spatial orientation.
   * Empty space must be deliberate, not accidental.
   */
  private createGroundReference(bounds: Bounds): void {
    const gridSize = Math.max(bounds.x, bounds.z) * 2;

    // Phase 6: Extremely subtle grid - barely visible
    const baseColor =
      this.palette.length > 0
        ? new THREE.Color(this.palette[0])
        : new THREE.Color(0x4a4a6a);

    const grid = new THREE.GridHelper(
      gridSize,
      30, // Fewer divisions for more space
      baseColor.clone().multiplyScalar(0.05), // Even more subtle
      baseColor.clone().multiplyScalar(0.02)
    );
    grid.position.y = 0;
    this.scene.add(grid);
  }

  /**
   * Generates the line field using the LineFieldGenerator.
   *
   * Lines follow the flow field - they are evidence of
   * the spatial law, not decoration.
   */
  private generateLineField(world: WorldDefinition, bounds: Bounds): void {
    // Calculate density from geometry fields if available
    let density = 0.5; // Default moderate density

    if (world.geometryFields && world.geometryFields.length > 0) {
      // Average density from all geometry fields
      density =
        world.geometryFields.reduce(
          (sum, field) => sum + field.density,
          0
        ) / world.geometryFields.length;
    }

    // Create the line field generator and store reference for Phase 3
    this.lineGenerator = new LineFieldGenerator(
      this.scene,
      this.flowFields,
      bounds,
      this.seed,
      this.palette
    );

    // Generate lines that follow the flow field
    this.lineGenerator.generate(density);
  }
}
