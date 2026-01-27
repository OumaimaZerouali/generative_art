import * as THREE from 'three';
import { Genesis } from './Genesis';

/**
 * Genesis Scene
 *
 * Phase 8: The space before the world exists.
 *
 * Neutral, minimal, almost empty.
 * The user can move freely.
 * The system waits and observes.
 *
 * After a short window, the world commits.
 * This moment is not announced.
 */
export class GenesisScene {
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly container: HTMLElement;

  private animationId: number | null = null;
  private lastTime: number = 0;

  // Genesis observer
  private genesis: Genesis | null = null;
  private onCompleteCallback: ((genesis: Genesis) => void) | null = null;

  // Minimal camera control
  private moveSpeed: number = 2.0;
  private lookSpeed: number = 0.002;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private yaw: number = 0;
  private pitch: number = 0;

  private keys: Set<string> = new Set();
  private isPointerLocked: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;

    // Create minimal scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);

    // Very subtle fog - barely visible
    this.scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 1.6, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Minimal ambient light
    const ambientLight = new THREE.AmbientLight(0x4a4a6a, 0.5);
    this.scene.add(ambientLight);

    // Subtle ground reference - barely visible
    const gridHelper = new THREE.GridHelper(40, 20, 0x1a1a2a, 0x0a0a0a);
    this.scene.add(gridHelper);

    // Setup controls
    this.setupControls();
    this.setupResize();
  }

  /**
   * Sets up minimal first-person controls.
   */
  private setupControls(): void {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    // Mouse look
    this.renderer.domElement.addEventListener('click', () => {
      this.renderer.domElement.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked) return;

      this.yaw -= e.movementX * this.lookSpeed;
      this.pitch -= e.movementY * this.lookSpeed;
      this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
    });
  }

  private setupResize(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    });
  }

  /**
   * Updates camera movement.
   */
  private updateMovement(delta: number): void {
    // Calculate movement direction
    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);

    forward.applyQuaternion(
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw)
    );
    right.applyQuaternion(
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw)
    );

    // Apply keyboard input
    const moveVector = new THREE.Vector3();

    if (this.keys.has('KeyW')) moveVector.add(forward);
    if (this.keys.has('KeyS')) moveVector.sub(forward);
    if (this.keys.has('KeyA')) moveVector.sub(right);
    if (this.keys.has('KeyD')) moveVector.add(right);

    if (moveVector.length() > 0) {
      moveVector.normalize();
      this.velocity.lerp(moveVector.multiplyScalar(this.moveSpeed), delta * 8);
    } else {
      this.velocity.lerp(new THREE.Vector3(), delta * 8);
    }

    // Update position
    const previousPosition = this.camera.position.clone();
    this.camera.position.add(this.velocity.clone().multiplyScalar(delta));

    // Update camera rotation
    this.camera.quaternion.setFromEuler(
      new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ')
    );

    // Update genesis observer if active
    if (this.genesis) {
      const direction = new THREE.Vector3()
        .subVectors(this.camera.position, previousPosition)
        .normalize();

      const stillActive = this.genesis.update(
        this.camera.position,
        direction,
        this.pitch,
        delta
      );

      // If genesis just completed, trigger callback
      if (!stillActive && this.genesis.isGenesisComplete() && this.onCompleteCallback) {
        this.onCompleteCallback(this.genesis);
        this.genesis = null; // No longer observe
      }
    }
  }

  /**
   * Animation loop.
   */
  private animate = (time: number): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const deltaTime = this.lastTime === 0 ? 0 : (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.updateMovement(deltaTime);
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Starts the genesis scene with an observer.
   */
  start(genesis: Genesis): void {
    this.genesis = genesis;
    this.lastTime = 0;
    this.animate(0);
  }

  /**
   * Register callback for when genesis completes.
   */
  onGenesisComplete(callback: (genesis: Genesis) => void): void {
    this.onCompleteCallback = callback;
  }

  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);

    window.removeEventListener('keydown', () => {});
    window.removeEventListener('keyup', () => {});
    document.removeEventListener('pointerlockchange', () => {});
    document.removeEventListener('mousemove', () => {});
    window.removeEventListener('resize', () => {});
  }
}

