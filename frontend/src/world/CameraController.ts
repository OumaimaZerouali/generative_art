import * as THREE from 'three';
import { PresenceBreath } from './PresenceBreath';
import { CameraState } from './SessionPersistence';

/**
 * Camera Controller
 *
 * Handles first-person and third-person camera movement.
 *
 * Movement is intentionally slow and smooth:
 * - Slow acceleration
 * - Smooth deceleration
 * - No sudden changes
 * - No head-bobbing
 * - No game-like controls
 *
 * Phase 5: Breathing as presence
 * - Extremely subtle vertical movement when still
 * - Dampens when moving
 * - Never syncs with other motion
 *
 * The user is always in control.
 */

const MOVE_ACCELERATION = 8;
const MOVE_MAX_SPEED = 4;
const MOVE_FRICTION = 6;
const LOOK_SENSITIVITY = 0.002;
const PERSPECTIVE_TRANSITION_SPEED = 2;

// Eye level height in world units (meters)
const EYE_HEIGHT = 1.6;

interface MovementState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
}

export class CameraController {
  private readonly camera: THREE.PerspectiveCamera;
  private readonly domElement: HTMLElement;

  private readonly velocity: THREE.Vector3 = new THREE.Vector3();
  private readonly movement: MovementState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
  };

  private pitch = 0;
  private yaw = 0;

  private cameraDistance = 0;
  private targetDistance = 0;
  private readonly maxThirdPersonDistance = 8;

  private isLocked = false;

  private readonly focusPoint: THREE.Vector3 = new THREE.Vector3();

  // Phase 5: Breathing
  private readonly breath: PresenceBreath;
  private breathOffset: number = 0;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement, seed: number) {
    this.camera = camera;
    this.domElement = domElement;
    this.focusPoint.copy(camera.position);

    // Phase 5: Initialize breath with world seed for determinism
    this.breath = new PresenceBreath(seed);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.domElement.addEventListener('click', () => {
      if (!this.isLocked) {
        this.domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
    });

    document.addEventListener('mousemove', (event) => {
      if (!this.isLocked) return;

      this.yaw -= event.movementX * LOOK_SENSITIVITY;
      this.pitch -= event.movementY * LOOK_SENSITIVITY;

      const maxPitch = Math.PI / 2 - 0.1;
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
    });

    document.addEventListener('keydown', (event) => this.onKeyDown(event));
    document.addEventListener('keyup', (event) => this.onKeyUp(event));

    this.domElement.addEventListener('wheel', (event) => {
      event.preventDefault();
      const delta = event.deltaY * 0.01;
      this.targetDistance = Math.max(
        0,
        Math.min(this.maxThirdPersonDistance, this.targetDistance + delta)
      );
    }, { passive: false });
  }

  private onKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.movement.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.movement.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.movement.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.movement.right = true;
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.movement.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.movement.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.movement.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.movement.right = false;
        break;
    }
  }

  update(delta: number): void {
    const direction = new THREE.Vector3();

    if (this.movement.forward) direction.z -= 1;
    if (this.movement.backward) direction.z += 1;
    if (this.movement.left) direction.x -= 1;
    if (this.movement.right) direction.x += 1;

    direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    if (direction.length() > 0) {
      direction.normalize();
      this.velocity.x += direction.x * MOVE_ACCELERATION * delta;
      this.velocity.z += direction.z * MOVE_ACCELERATION * delta;
    }

    const friction = Math.exp(-MOVE_FRICTION * delta);
    this.velocity.x *= friction;
    this.velocity.z *= friction;

    const speed = Math.hypot(this.velocity.x, this.velocity.z);
    if (speed > MOVE_MAX_SPEED) {
      const scale = MOVE_MAX_SPEED / speed;
      this.velocity.x *= scale;
      this.velocity.z *= scale;
    }

    this.focusPoint.x += this.velocity.x * delta;
    this.focusPoint.z += this.velocity.z * delta;

    const distanceDiff = this.targetDistance - this.cameraDistance;
    this.cameraDistance += distanceDiff * Math.min(1, delta * PERSPECTIVE_TRANSITION_SPEED);

    // Phase 5: Update breathing
    // Breath dampens when moving, returns when still
    const isMoving = speed > 0.1;
    this.breathOffset = this.breath.update(delta, isMoving);

    // Debug: Log breath offset every second or so
    if (Math.random() < 0.02) {
      console.log('Breath offset:', this.breathOffset.toFixed(4), 'isMoving:', isMoving);
    }

    this.updateCameraTransform();
  }

  /**
   * Update camera position and rotation.
   *
   * Phase 5: Breathing applies as subtle vertical offset.
   * Breath is personal, not environmental.
   */
  private updateCameraTransform(): void {
    const quaternion = new THREE.Quaternion();
    quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));

    // Base eye height plus breath offset
    // breathOffset is ~2.5cm max, creating subtle but perceptible presence
    const eyeHeight = EYE_HEIGHT + this.breathOffset;

    if (this.cameraDistance < 0.1) {
      // First-person: camera at focus point with breath
      this.camera.position.copy(this.focusPoint);
      this.camera.position.y = eyeHeight;
    } else {
      // Third-person: camera behind and above focus point
      const offset = new THREE.Vector3(0, 0, this.cameraDistance);
      offset.applyQuaternion(quaternion);
      offset.y += this.cameraDistance * 0.3;

      this.camera.position.copy(this.focusPoint);
      this.camera.position.y = eyeHeight;
      this.camera.position.add(offset);
    }

    this.camera.quaternion.copy(quaternion);
  }

  /**
   * Set camera focus position.
   */
  setPosition(x: number, y: number, z: number): void {
    this.focusPoint.set(x, y, z);
    this.updateCameraTransform();
  }

  /**
   * Get the focus point position (where user is).
   */
  getPosition(): THREE.Vector3 {
    return this.focusPoint.clone();
  }

  /**
   * Phase 4: Get the camera's world position.
   * Used by Presence to calculate visibility.
   */
  getCameraPosition(): THREE.Vector3 {
    return this.camera.position.clone();
  }

  /**
   * Phase 4: Get the current yaw (horizontal rotation).
   * Used by Presence to orient the character.
   */
  getYaw(): number {
    return this.yaw;
  }

  /**
   * Get the current pitch (vertical rotation).
   */
  getPitch(): number {
    return this.pitch;
  }

  /**
   * Phase 4: Get the current camera distance from focus point.
   * Used to determine if in first-person or third-person.
   */
  getCameraDistance(): number {
    return this.cameraDistance;
  }

  /**
   * Get forward direction vector.
   */
  getForward(): THREE.Vector3 {
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.camera.quaternion);
    return forward;
  }

  /**
   * Phase 5: Get current breath offset.
   * Used by Presence for subtle character height variation.
   */
  getBreathOffset(): number {
    return this.breathOffset;
  }

  /**
   * Phase 5: Get full camera state for persistence.
   * Allows returning to exact position/orientation.
   */
  getCameraState(): CameraState {
    return {
      positionX: this.focusPoint.x,
      positionY: this.focusPoint.y,
      positionZ: this.focusPoint.z,
      pitch: this.pitch,
      yaw: this.yaw,
      cameraDistance: this.cameraDistance,
    };
  }

  /**
   * Phase 5: Restore camera state from persistence.
   * Makes returning feel like arriving, not loading.
   */
  restoreCameraState(state: CameraState): void {
    this.focusPoint.set(state.positionX, state.positionY, state.positionZ);
    this.pitch = state.pitch;
    this.yaw = state.yaw;
    this.cameraDistance = state.cameraDistance;
    this.targetDistance = state.cameraDistance;
    this.updateCameraTransform();
  }
}
