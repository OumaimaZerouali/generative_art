import * as THREE from 'three';
import { SimplexNoise } from '../engine/Noise';
import { ThresholdState } from './ThresholdState';

/**
 * Threshold Preview
 *
 * Renders ~30 sparse preview lines that update reactively as the user
 * moves through the threshold space. The lines give a sense of what
 * the generated world will feel like without fully revealing it.
 *
 * Lines respond to:
 * - flowScale: affects the curvature and scale of flow
 * - flowComplexity: affects the turbulence of the flow
 * - density: affects how many lines are visible
 * - verticalBias: affects the vertical component of flow
 * - palette: affects line colors
 */

const PREVIEW_LINE_COUNT = 30;
const STEPS_PER_LINE = 40;
const STEP_SIZE = 0.6;

interface PreviewLine {
  line: THREE.Line;
  geometry: THREE.BufferGeometry;
  material: THREE.LineBasicMaterial;
  startSeed: number;
}

export class ThresholdPreview {
  private readonly scene: THREE.Scene;
  private readonly noise: SimplexNoise;
  private readonly lines: PreviewLine[] = [];
  private readonly baseSeed: number;

  // Current palette for coloring
  private currentPalette: string[] = ['#4a4a6a', '#6a4a5a', '#4a6a5a'];

  constructor(scene: THREE.Scene, seed: number = Date.now()) {
    this.scene = scene;
    this.baseSeed = seed;
    this.noise = new SimplexNoise(seed);

    this.createLines();
  }

  /**
   * Creates the initial line geometries.
   */
  private createLines(): void {
    for (let i = 0; i < PREVIEW_LINE_COUNT; i++) {
      // Create empty geometry
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(STEPS_PER_LINE * 3);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      // Material with low opacity
      const material = new THREE.LineBasicMaterial({
        color: 0x4a4a6a,
        transparent: true,
        opacity: 0.3,
      });

      const line = new THREE.Line(geometry, material);
      this.scene.add(line);

      this.lines.push({
        line,
        geometry,
        material,
        startSeed: this.baseSeed + i * 1000,
      });
    }
  }

  /**
   * Updates the preview lines based on current threshold state.
   */
  update(state: ThresholdState): void {
    const values = state.getCurrentValues();
    const config = state.getConfig();

    // Update palette
    this.currentPalette = config.palette;

    // Determine how many lines to show based on density
    const visibleCount = Math.floor(PREVIEW_LINE_COUNT * values.density);

    for (let i = 0; i < this.lines.length; i++) {
      const lineData = this.lines[i];

      if (i >= visibleCount) {
        // Hide lines beyond the visible count
        lineData.line.visible = false;
        continue;
      }

      lineData.line.visible = true;
      this.updateLine(lineData, i, values);
    }
  }

  /**
   * Updates a single preview line based on current parameters.
   */
  private updateLine(
    lineData: PreviewLine,
    index: number,
    values: {
      flowScale: number;
      flowComplexity: number;
      density: number;
      verticalBias: number;
      fogDensity: number;
    }
  ): void {
    const positions = lineData.geometry.attributes.position.array as Float32Array;
    const random = new SeededRandom(lineData.startSeed);

    // Start position: distributed in a preview area in front of the user
    const startX = random.range(-15, 15);
    const startY = random.range(0.5, 8);
    const startZ = random.range(5, 25);

    let currentPos = new THREE.Vector3(startX, startY, startZ);

    for (let step = 0; step < STEPS_PER_LINE; step++) {
      const idx = step * 3;
      positions[idx] = currentPos.x;
      positions[idx + 1] = currentPos.y;
      positions[idx + 2] = currentPos.z;

      // Sample flow field at current position
      const flowVector = this.sampleFlow(currentPos, values);

      // Move along flow direction
      currentPos = currentPos.clone().add(
        flowVector.normalize().multiplyScalar(STEP_SIZE)
      );
    }

    lineData.geometry.attributes.position.needsUpdate = true;
    lineData.geometry.computeBoundingSphere();

    // Update color based on palette and position
    const colorIndex = index % this.currentPalette.length;
    const color = new THREE.Color(this.currentPalette[colorIndex]);

    // Mute the color
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    hsl.s *= 0.5;
    hsl.l = 0.3 + hsl.l * 0.3;
    color.setHSL(hsl.h, hsl.s, hsl.l);

    lineData.material.color = color;

    // Adjust opacity based on fog density (more fog = lower opacity)
    lineData.material.opacity = 0.2 + (1 - values.fogDensity * 20) * 0.3;
  }

  /**
   * Samples the flow field at a position based on current parameters.
   */
  private sampleFlow(
    position: THREE.Vector3,
    values: {
      flowScale: number;
      flowComplexity: number;
      verticalBias: number;
    }
  ): THREE.Vector3 {
    const scale = values.flowScale * 0.1;
    const x = position.x * scale;
    const y = position.y * scale;
    const z = position.z * scale;

    // Base flow using noise
    let vx = this.noise.noise3D(x, y, z);
    let vy = this.noise.noise3D(x + 17.3, y + 31.1, z + 47.7);
    let vz = this.noise.noise3D(x + 89.2, y + 67.4, z + 23.9);

    // Add complexity (turbulence)
    if (values.flowComplexity > 0.3) {
      const complexityScale = scale * 2;
      vx += this.noise.noise3D(x * complexityScale, y * complexityScale, z * complexityScale) * values.flowComplexity * 0.5;
      vz += this.noise.noise3D(x * complexityScale + 50, y * complexityScale + 50, z * complexityScale + 50) * values.flowComplexity * 0.5;
    }

    // Apply vertical bias
    // Low bias = more horizontal, high bias = more vertical
    const horizontalStrength = 1.0 - values.verticalBias * 0.7;
    const verticalStrength = values.verticalBias * 0.8;

    vx *= horizontalStrength;
    vz *= horizontalStrength;
    vy = vy * 0.3 + (values.verticalBias - 0.5) * verticalStrength;

    return new THREE.Vector3(vx, vy, vz);
  }

  /**
   * Sets the palette for preview lines.
   */
  setPalette(colors: string[]): void {
    this.currentPalette = colors.length > 0 ? colors : ['#4a4a6a', '#6a4a5a', '#4a6a5a'];
  }

  /**
   * Cleans up resources.
   */
  dispose(): void {
    for (const lineData of this.lines) {
      this.scene.remove(lineData.line);
      lineData.geometry.dispose();
      lineData.material.dispose();
    }
    this.lines.length = 0;
  }
}

/**
 * Simple seeded random for deterministic positioning.
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}
