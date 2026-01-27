import * as THREE from 'three';

/**
 * Color Orbs
 *
 * Floating color spheres that influence palette selection.
 * When the user dwells near an orb, it "warms up" (glows brighter)
 * and its color is added to the selected palette.
 *
 * Orbs float at varying heights and drift slowly.
 * Each orb represents a color that could be part of the world.
 */

const ORB_COUNT = 6;
const DWELL_THRESHOLD = 1.5; // Seconds to activate
const PROXIMITY_DISTANCE = 5.0; // Units to trigger dwell detection
const FLOAT_SPEED = 0.3;
const FLOAT_AMPLITUDE = 0.8;

// Muted, meditative color palette for orbs
const ORB_COLORS = [
  '#6a5a8a', // Muted purple
  '#5a7a8a', // Muted teal
  '#8a6a5a', // Muted terracotta
  '#5a8a6a', // Muted sage
  '#8a5a6a', // Muted rose
  '#7a7a5a', // Muted olive
];

interface Orb {
  mesh: THREE.Mesh;
  glow: THREE.PointLight;
  color: string;
  basePosition: THREE.Vector3;
  dwellTime: number;
  isSelected: boolean;
  floatOffset: number;
}

export class ColorOrbs {
  private readonly scene: THREE.Scene;
  private readonly orbs: Orb[] = [];
  private readonly onColorSelected: (color: string) => void;

  private elapsedTime: number = 0;

  constructor(scene: THREE.Scene, onColorSelected: (color: string) => void) {
    this.scene = scene;
    this.onColorSelected = onColorSelected;

    this.createOrbs();
  }

  /**
   * Creates the floating color orbs.
   */
  private createOrbs(): void {
    for (let i = 0; i < ORB_COUNT; i++) {
      const color = ORB_COLORS[i];
      const threeColor = new THREE.Color(color);

      // Position orbs in a semicircle arrangement
      const angle = (i / ORB_COUNT) * Math.PI - Math.PI / 2;
      const radius = 12 + Math.random() * 5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius + 15;
      const y = 2 + Math.random() * 4;

      const basePosition = new THREE.Vector3(x, y, z);

      // Create orb geometry - slightly transparent sphere
      const geometry = new THREE.SphereGeometry(0.4, 16, 16);
      const material = new THREE.MeshBasicMaterial({
        color: threeColor,
        transparent: true,
        opacity: 0.6,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(basePosition);

      // Create subtle glow light
      const glow = new THREE.PointLight(threeColor, 0.3, 8);
      glow.position.copy(basePosition);

      this.scene.add(mesh);
      this.scene.add(glow);

      this.orbs.push({
        mesh,
        glow,
        color,
        basePosition,
        dwellTime: 0,
        isSelected: false,
        floatOffset: Math.random() * Math.PI * 2,
      });
    }
  }

  /**
   * Updates orb positions, dwell detection, and visual feedback.
   */
  update(cameraPosition: THREE.Vector3, deltaTime: number): void {
    this.elapsedTime += deltaTime;

    for (const orb of this.orbs) {
      // Floating animation
      const floatY = Math.sin(this.elapsedTime * FLOAT_SPEED + orb.floatOffset) * FLOAT_AMPLITUDE;
      const floatX = Math.cos(this.elapsedTime * FLOAT_SPEED * 0.7 + orb.floatOffset) * FLOAT_AMPLITUDE * 0.5;

      orb.mesh.position.set(
        orb.basePosition.x + floatX,
        orb.basePosition.y + floatY,
        orb.basePosition.z
      );
      orb.glow.position.copy(orb.mesh.position);

      // Check proximity for dwell detection
      const distance = cameraPosition.distanceTo(orb.mesh.position);

      if (distance < PROXIMITY_DISTANCE) {
        orb.dwellTime += deltaTime;

        // Visual feedback: orb glows brighter as dwell time increases
        const warmup = Math.min(1, orb.dwellTime / DWELL_THRESHOLD);
        const material = orb.mesh.material as THREE.MeshBasicMaterial;
        material.opacity = 0.6 + warmup * 0.4;
        orb.glow.intensity = 0.3 + warmup * 0.7;

        // Scale up slightly when warming
        const scale = 1 + warmup * 0.3;
        orb.mesh.scale.setScalar(scale);

        // Trigger selection when threshold reached
        if (orb.dwellTime >= DWELL_THRESHOLD && !orb.isSelected) {
          orb.isSelected = true;
          this.onColorSelected(orb.color);

          // Visual confirmation: pulse effect
          this.pulseOrb(orb);
        }
      } else {
        // Slowly cool down when user moves away
        orb.dwellTime = Math.max(0, orb.dwellTime - deltaTime * 0.5);

        const warmup = Math.min(1, orb.dwellTime / DWELL_THRESHOLD);
        const material = orb.mesh.material as THREE.MeshBasicMaterial;

        // Selected orbs stay brighter
        if (orb.isSelected) {
          material.opacity = 0.8;
          orb.glow.intensity = 0.6;
          orb.mesh.scale.setScalar(1.2);
        } else {
          material.opacity = 0.6 + warmup * 0.2;
          orb.glow.intensity = 0.3 + warmup * 0.3;
          orb.mesh.scale.setScalar(1 + warmup * 0.15);
        }
      }
    }
  }

  /**
   * Creates a pulse effect when an orb is selected.
   */
  private pulseOrb(orb: Orb): void {
    const startScale = orb.mesh.scale.x;
    const pulseScale = startScale * 1.5;
    const duration = 0.3;
    let elapsed = 0;

    const pulse = () => {
      elapsed += 0.016;
      const t = elapsed / duration;

      if (t >= 1) {
        orb.mesh.scale.setScalar(1.2);
        return;
      }

      // Quick expand, slow contract
      const scale = t < 0.5
        ? startScale + (pulseScale - startScale) * (t * 2)
        : pulseScale - (pulseScale - 1.2) * ((t - 0.5) * 2);

      orb.mesh.scale.setScalar(scale);
      requestAnimationFrame(pulse);
    };

    pulse();
  }

  /**
   * Returns the currently selected colors.
   */
  getSelectedColors(): string[] {
    return this.orbs
      .filter(orb => orb.isSelected)
      .map(orb => orb.color);
  }

  /**
   * Resets all orb selections.
   */
  reset(): void {
    for (const orb of this.orbs) {
      orb.isSelected = false;
      orb.dwellTime = 0;
      const material = orb.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = 0.6;
      orb.glow.intensity = 0.3;
      orb.mesh.scale.setScalar(1);
    }
  }

  /**
   * Cleans up resources.
   */
  dispose(): void {
    for (const orb of this.orbs) {
      this.scene.remove(orb.mesh);
      this.scene.remove(orb.glow);
      orb.mesh.geometry.dispose();
      (orb.mesh.material as THREE.Material).dispose();
    }
    this.orbs.length = 0;
  }
}
