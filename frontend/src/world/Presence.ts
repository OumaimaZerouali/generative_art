import * as THREE from 'three';

/**
 * Presence
 *
 * A minimal, abstract representation of the user's existence in the world.
 * This is not a character - it is a reference point for spatial grounding.
 *
 * Phase 4: Embodiment & Silent Presence
 *
 * The presence exists to answer: "Where am I in this world?"
 * Nothing more.
 *
 * Properties:
 * - Abstract, minimal form (capsule shape)
 * - No face, no features, no identity
 * - Visible only in third-person
 * - Fades when camera is too close
 * - Same material language as the world
 * - Never occludes vision or blocks movement
 */

/**
 * Scale constants - explicit, no magic numbers.
 * These establish the human scale reference for the world.
 */
const PRESENCE_HEIGHT = 1.6;        // Eye level height in meters
const PRESENCE_RADIUS = 0.25;       // Capsule radius
const PRESENCE_BODY_HEIGHT = 1.2;   // Body portion (below eye level)

/**
 * Visibility constants for smooth transitions.
 */
const FADE_START_DISTANCE = 1.5;    // Start fading when camera this close
const FADE_END_DISTANCE = 0.5;      // Fully invisible at this distance
const OPACITY_MAX = 0.6;            // Never fully opaque - belongs to world

/**
 * Presence represents the user's embodiment in the world.
 *
 * It is:
 * - A witness, not a protagonist
 * - A reference point, not an avatar
 * - Abstract, not human
 *
 * It does not:
 * - Animate
 * - Express
 * - Act
 */
export class Presence {
  private readonly group: THREE.Group;
  private readonly mesh: THREE.Mesh;
  private readonly material: THREE.MeshBasicMaterial;

  private readonly position: THREE.Vector3 = new THREE.Vector3();

  private currentOpacity: number = 0;
  private targetOpacity: number = 0;

  constructor(scene: THREE.Scene, palette: readonly string[]) {
    this.group = new THREE.Group();

    // Create abstract capsule form
    // CapsuleGeometry: radius, length (of middle section), capSegments, radialSegments
    const geometry = new THREE.CapsuleGeometry(
      PRESENCE_RADIUS,
      PRESENCE_BODY_HEIGHT,
      4,  // Low poly for abstract feel
      8
    );

    // Color derived from world palette, muted
    const baseColor = this.calculateColor(palette);

    this.material = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0,
      depthWrite: false, // Prevent z-fighting with world
    });

    this.mesh = new THREE.Mesh(geometry, this.material);

    // Position mesh so bottom is at y=0
    // Capsule is centered, so offset by half total height
    this.mesh.position.y = PRESENCE_BODY_HEIGHT / 2 + PRESENCE_RADIUS;

    this.group.add(this.mesh);
    scene.add(this.group);
  }

  /**
   * Calculate presence color from world palette.
   *
   * Color is muted and has slight contrast from environment.
   * The presence belongs to the world, not the user.
   */
  private calculateColor(palette: readonly string[]): THREE.Color {
    // Default muted color if no palette
    if (palette.length === 0) {
      return new THREE.Color(0x3a3a4a);
    }

    // Use a middle palette color, desaturated
    const paletteIndex = Math.floor(palette.length / 2);
    const baseColor = new THREE.Color(palette[paletteIndex]);

    // Mute the color significantly
    const hsl = { h: 0, s: 0, l: 0 };
    baseColor.getHSL(hsl);
    hsl.s *= 0.3;  // Very desaturated
    hsl.l = 0.25 + hsl.l * 0.2; // Dark but not black
    baseColor.setHSL(hsl.h, hsl.s, hsl.l);

    return baseColor;
  }

  /**
   * Update presence position and visibility.
   *
   * Called every frame with:
   * - focusPosition: Where the user is (ground level)
   * - cameraPosition: Where the camera is
   * - yaw: The direction the user is facing
   * - breathOffset: Phase 5 subtle height variation (optional)
   */
  update(
    focusPosition: THREE.Vector3,
    cameraPosition: THREE.Vector3,
    yaw: number,
    breathOffset: number = 0
  ): void {
    // Update position (presence is at focus point, on ground)
    this.position.copy(focusPosition);
    this.position.y = 0; // Ground level
    this.group.position.copy(this.position);

    // Phase 5: Apply subtle breath offset to mesh height
    // This creates barely perceptible "breathing" in third-person
    // The offset is very small (millimeters), felt not seen
    this.mesh.position.y = PRESENCE_BODY_HEIGHT / 2 + PRESENCE_RADIUS + breathOffset;

    // Update rotation to face movement direction
    this.group.rotation.y = yaw;

    // Calculate distance from camera to presence
    const distance = cameraPosition.distanceTo(
      new THREE.Vector3(focusPosition.x, PRESENCE_HEIGHT, focusPosition.z)
    );

    // Determine target opacity based on distance
    // In first-person (very close), presence is invisible
    // In third-person (further), presence fades in
    if (distance < FADE_END_DISTANCE) {
      this.targetOpacity = 0;
    } else if (distance < FADE_START_DISTANCE) {
      // Smooth fade zone
      const t = (distance - FADE_END_DISTANCE) / (FADE_START_DISTANCE - FADE_END_DISTANCE);
      this.targetOpacity = t * OPACITY_MAX;
    } else {
      this.targetOpacity = OPACITY_MAX;
    }

    // Smoothly interpolate opacity (no sudden changes)
    const opacitySpeed = 3; // Transition speed
    const opacityDelta = this.targetOpacity - this.currentOpacity;
    this.currentOpacity += opacityDelta * Math.min(1, opacitySpeed * 0.016);

    this.material.opacity = this.currentOpacity;

    // Hide mesh entirely when fully transparent (optimization)
    this.mesh.visible = this.currentOpacity > 0.01;
  }

  /**
   * Get the height of the presence (eye level).
   * Used for camera positioning.
   */
  getEyeHeight(): number {
    return PRESENCE_HEIGHT;
  }

  /**
   * Get the current world position of the presence.
   */
  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  /**
   * Check if presence is currently visible.
   */
  isVisible(): boolean {
    return this.currentOpacity > 0.01;
  }

  /**
   * Clean up resources.
   */
  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}

