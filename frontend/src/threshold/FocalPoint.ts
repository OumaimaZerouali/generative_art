import * as THREE from 'three';

/**
 * Focal Point
 *
 * A subtle vertical light pillar in the center-distance that acts as
 * the "door" to enter the world. When the user approaches and dwells
 * for 3-5 seconds, it triggers world creation.
 *
 * The focal point should feel like a gentle invitation, not a button.
 * It pulses slowly and responds to the user's proximity.
 */

const FOCAL_POSITION = new THREE.Vector3(0, 0, 20); // Center, slightly forward
const ACTIVATION_DISTANCE = 4.0;
const DWELL_DURATION = 4.0; // Seconds to trigger
const PILLAR_HEIGHT = 12;
const PILLAR_RADIUS = 0.15;

export class FocalPoint {
  private readonly scene: THREE.Scene;
  private readonly onCommit: () => void;

  private pillar: THREE.Mesh | null = null;
  private glowLight: THREE.PointLight | null = null;
  private baseLight: THREE.PointLight | null = null;

  private dwellTime: number = 0;
  private isCommitting: boolean = false;
  private elapsedTime: number = 0;

  constructor(scene: THREE.Scene, onCommit: () => void) {
    this.scene = scene;
    this.onCommit = onCommit;

    this.createPillar();
  }

  /**
   * Creates the light pillar visual.
   */
  private createPillar(): void {
    // Create a vertical cylinder of soft light
    const geometry = new THREE.CylinderGeometry(
      PILLAR_RADIUS,
      PILLAR_RADIUS * 1.5, // Slightly wider at base
      PILLAR_HEIGHT,
      16,
      8,
      true // Open ended for ethereal look
    );

    // Gradient material - more opaque at base, fading at top
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });

    this.pillar = new THREE.Mesh(geometry, material);
    this.pillar.position.copy(FOCAL_POSITION);
    this.pillar.position.y = PILLAR_HEIGHT / 2;
    this.scene.add(this.pillar);

    // Base glow on ground
    this.baseLight = new THREE.PointLight(0xffffff, 0.3, 10);
    this.baseLight.position.copy(FOCAL_POSITION);
    this.baseLight.position.y = 0.5;
    this.scene.add(this.baseLight);

    // Upper glow
    this.glowLight = new THREE.PointLight(0xffffff, 0.2, 15);
    this.glowLight.position.copy(FOCAL_POSITION);
    this.glowLight.position.y = PILLAR_HEIGHT * 0.6;
    this.scene.add(this.glowLight);

    // Ground ring indicator
    const ringGeometry = new THREE.RingGeometry(
      ACTIVATION_DISTANCE - 0.5,
      ACTIVATION_DISTANCE,
      32
    );
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(FOCAL_POSITION);
    ring.position.y = 0.01;
    this.scene.add(ring);
  }

  /**
   * Updates the focal point based on camera position.
   */
  update(cameraPosition: THREE.Vector3, deltaTime: number): void {
    if (this.isCommitting) return;

    this.elapsedTime += deltaTime;

    // Subtle pulse animation
    this.updatePulse();

    // Check distance to focal point (only XZ plane)
    const dx = cameraPosition.x - FOCAL_POSITION.x;
    const dz = cameraPosition.z - FOCAL_POSITION.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < ACTIVATION_DISTANCE) {
      this.dwellTime += deltaTime;

      // Visual feedback: intensify as dwell progresses
      const progress = Math.min(1, this.dwellTime / DWELL_DURATION);
      this.updateActivation(progress);

      // Trigger commit when threshold reached
      if (this.dwellTime >= DWELL_DURATION) {
        this.triggerCommit();
      }
    } else {
      // Slowly reset when user moves away
      this.dwellTime = Math.max(0, this.dwellTime - deltaTime * 0.5);
      const progress = Math.min(1, this.dwellTime / DWELL_DURATION);
      this.updateActivation(progress);
    }
  }

  /**
   * Updates the subtle pulse animation.
   */
  private updatePulse(): void {
    if (!this.pillar || !this.glowLight || !this.baseLight) return;

    // Slow, meditative pulse
    const pulse = Math.sin(this.elapsedTime * 0.5) * 0.5 + 0.5;
    const material = this.pillar.material as THREE.MeshBasicMaterial;

    // Base opacity with subtle variation
    material.opacity = 0.12 + pulse * 0.06;
    this.glowLight.intensity = 0.15 + pulse * 0.1;
    this.baseLight.intensity = 0.2 + pulse * 0.15;
  }

  /**
   * Updates visuals based on activation progress.
   */
  private updateActivation(progress: number): void {
    if (!this.pillar || !this.glowLight || !this.baseLight) return;

    const material = this.pillar.material as THREE.MeshBasicMaterial;

    // Increase brightness and scale with progress
    const baseOpacity = 0.15;
    const activatedOpacity = 0.4;
    material.opacity = baseOpacity + progress * (activatedOpacity - baseOpacity);

    // Light intensifies
    this.glowLight.intensity = 0.2 + progress * 0.8;
    this.baseLight.intensity = 0.3 + progress * 0.7;

    // Color shifts slightly warmer as activation approaches
    const warmth = new THREE.Color().lerpColors(
      new THREE.Color(0xffffff),
      new THREE.Color(0xffeedd),
      progress
    );
    material.color = warmth;
    this.glowLight.color = warmth;
    this.baseLight.color = warmth;

    // Subtle scale increase
    const scale = 1 + progress * 0.3;
    this.pillar.scale.set(scale, 1, scale);
  }

  /**
   * Triggers the commit sequence.
   */
  private triggerCommit(): void {
    if (this.isCommitting) return;
    this.isCommitting = true;

    // Flash effect before transition
    this.commitFlash(() => {
      this.onCommit();
    });
  }

  /**
   * Creates a brief flash effect during commit.
   */
  private commitFlash(callback: () => void): void {
    if (!this.pillar || !this.glowLight || !this.baseLight) {
      callback();
      return;
    }

    const material = this.pillar.material as THREE.MeshBasicMaterial;
    const duration = 0.5;
    let elapsed = 0;

    const flash = () => {
      elapsed += 0.016;
      const t = elapsed / duration;

      if (t >= 1) {
        callback();
        return;
      }

      // Quick flash up, then fade
      const flashIntensity = t < 0.3
        ? t / 0.3
        : 1 - ((t - 0.3) / 0.7);

      material.opacity = 0.4 + flashIntensity * 0.6;
      this.glowLight!.intensity = 1.0 + flashIntensity * 2.0;
      this.baseLight!.intensity = 1.0 + flashIntensity * 1.5;

      requestAnimationFrame(flash);
    };

    flash();
  }

  /**
   * Returns the current dwell progress (0-1).
   */
  getDwellProgress(): number {
    return Math.min(1, this.dwellTime / DWELL_DURATION);
  }

  /**
   * Checks if commit is in progress.
   */
  isCommitInProgress(): boolean {
    return this.isCommitting;
  }

  /**
   * Resets the focal point state.
   */
  reset(): void {
    this.dwellTime = 0;
    this.isCommitting = false;
    this.updateActivation(0);
  }

  /**
   * Cleans up resources.
   */
  dispose(): void {
    if (this.pillar) {
      this.scene.remove(this.pillar);
      this.pillar.geometry.dispose();
      (this.pillar.material as THREE.Material).dispose();
    }
    if (this.glowLight) {
      this.scene.remove(this.glowLight);
    }
    if (this.baseLight) {
      this.scene.remove(this.baseLight);
    }
  }
}
