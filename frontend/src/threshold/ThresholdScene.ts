import * as THREE from 'three';
import { ThresholdState, ThresholdConfig } from './ThresholdState';
import { calculateZoneParameters } from './ThresholdZones';
import { ThresholdPreview } from './ThresholdPreview';
import { ColorOrbs } from './ColorOrbs';
import { FocalPoint } from './FocalPoint';

/**
 * User choices from the start menu.
 */
export interface UserChoices {
  mood: 'calm' | 'energetic' | 'mysterious' | 'melancholic';
  style: 'organic' | 'geometric' | 'chaotic' | 'minimal';
  theme: 'nature' | 'abstract' | 'cosmic' | 'industrial';
}

/**
 * Threshold Scene
 *
 * The ambient, meditative home screen where users shape their world
 * through spatial interactions. No buttons, no forms - just movement
 * and dwelling.
 *
 * The threshold is a fog-filled antechamber where:
 * - X-axis movement affects atmosphere (calm ↔ energetic)
 * - Z-axis movement affects density (sparse ↔ dense)
 * - Pitch affects structure (horizontal ↔ vertical)
 * - Dwelling near color orbs selects palette
 * - Dwelling near the focal point commits the world
 *
 * User's initial choices (mood, style, theme) influence the starting
 * parameters and visual presentation.
 */
export class ThresholdScene {
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly container: HTMLElement;
  private readonly choices: UserChoices;

  private animationId: number | null = null;
  private lastTime: number = 0;

  // Threshold components
  private state: ThresholdState;
  private preview: ThresholdPreview | null = null;
  private colorOrbs: ColorOrbs | null = null;
  private focalPoint: FocalPoint | null = null;

  // Commit callback
  private onCommitCallback: ((config: ThresholdConfig) => void) | null = null;

  // First-person controls
  private moveSpeed: number = 3.0;
  private lookSpeed: number = 0.002;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private yaw: number = 0;
  private pitch: number = 0;

  private keys: Set<string> = new Set();
  private isPointerLocked: boolean = false;

  // Event handlers (stored for cleanup)
  private keydownHandler: (e: KeyboardEvent) => void;
  private keyupHandler: (e: KeyboardEvent) => void;
  private clickHandler: () => void;
  private pointerLockHandler: () => void;
  private mouseMoveHandler: (e: MouseEvent) => void;
  private resizeHandler: () => void;

  constructor(container: HTMLElement, choices: UserChoices) {
    this.container = container;
    this.choices = choices;
    this.state = new ThresholdState();

    // Apply initial parameters based on user's choices
    this.applyChoicesToState();

    // Create scene with dark, foggy atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x080810);

    // Initial fog - will be updated based on position
    this.scene.fog = new THREE.Fog(0x080810, 5, 40);

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

    // Lighting
    this.setupLighting();

    // Ground reference
    this.setupGround();

    // Initialize components
    this.preview = new ThresholdPreview(this.scene, Date.now());

    this.colorOrbs = new ColorOrbs(this.scene, (color: string) => {
      this.state.addColor(color);
      this.preview?.setPalette(this.state.getConfig().palette);
    });

    this.focalPoint = new FocalPoint(this.scene, () => {
      this.handleCommit();
    });

    // Setup controls
    this.keydownHandler = (e) => this.keys.add(e.code);
    this.keyupHandler = (e) => this.keys.delete(e.code);
    this.clickHandler = () => this.renderer.domElement.requestPointerLock();
    this.pointerLockHandler = () => {
      this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
    };
    this.mouseMoveHandler = (e) => {
      if (!this.isPointerLocked) return;
      this.yaw -= e.movementX * this.lookSpeed;
      this.pitch -= e.movementY * this.lookSpeed;
      this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
    };
    this.resizeHandler = () => {
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    };

    this.setupControls();
    this.setupResize();
  }

  /**
   * Sets up ambient and directional lighting.
   */
  private setupLighting(): void {
    // Dim ambient light
    const ambientLight = new THREE.AmbientLight(0x2a2a4a, 0.3);
    this.scene.add(ambientLight);

    // Subtle directional light from above
    const directionalLight = new THREE.DirectionalLight(0x4a4a6a, 0.2);
    directionalLight.position.set(0, 10, 5);
    this.scene.add(directionalLight);
  }

  /**
   * Sets up a subtle ground reference.
   */
  private setupGround(): void {
    // Very subtle grid
    const gridHelper = new THREE.GridHelper(60, 30, 0x1a1a2a, 0x0a0a15);
    this.scene.add(gridHelper);

    // Ground plane for ambient occlusion feel
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0x050508,
      transparent: true,
      opacity: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    this.scene.add(ground);
  }

  /**
   * Sets up first-person controls.
   */
  private setupControls(): void {
    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
    this.renderer.domElement.addEventListener('click', this.clickHandler);
    document.addEventListener('pointerlockchange', this.pointerLockHandler);
    document.addEventListener('mousemove', this.mouseMoveHandler);
  }

  /**
   * Sets up window resize handling.
   */
  private setupResize(): void {
    window.addEventListener('resize', this.resizeHandler);
  }

  /**
   * Applies the user's menu choices to the initial threshold state.
   * This creates a starting point that reflects their selections.
   */
  private applyChoicesToState(): void {
    // Mood affects fog density and flow scale
    const moodSettings = {
      calm: { fogDensity: 0.04, flowScale: 0.6 },
      energetic: { fogDensity: 0.02, flowScale: 1.8 },
      mysterious: { fogDensity: 0.05, flowScale: 1.0 },
      melancholic: { fogDensity: 0.045, flowScale: 0.5 },
    };

    // Style affects flow complexity and vertical bias
    const styleSettings = {
      organic: { flowComplexity: 0.4, verticalBias: 0.4 },
      geometric: { flowComplexity: 0.2, verticalBias: 0.6 },
      chaotic: { flowComplexity: 0.9, verticalBias: 0.5 },
      minimal: { flowComplexity: 0.15, verticalBias: 0.3 },
    };

    // Theme affects density and initial palette
    const themeSettings = {
      nature: { density: 0.6, palette: ['#4a6a4a', '#6a8a5a', '#3a5a3a', '#8a9a6a'] },
      abstract: { density: 0.5, palette: ['#6a4a8a', '#8a5a6a', '#5a6a8a', '#7a6a5a'] },
      cosmic: { density: 0.4, palette: ['#2a2a5a', '#4a3a7a', '#3a5a8a', '#5a4a9a'] },
      industrial: { density: 0.7, palette: ['#5a5a5a', '#6a6a6a', '#4a4a4a', '#7a7a7a'] },
    };

    const mood = moodSettings[this.choices.mood];
    const style = styleSettings[this.choices.style];
    const theme = themeSettings[this.choices.theme];

    // Set initial targets
    this.state.setTargets(
      mood.fogDensity,
      mood.flowScale,
      style.flowComplexity,
      theme.density,
      style.verticalBias
    );

    // Set initial palette from theme
    this.state.setPalette(theme.palette);
  }

  /**
   * Updates camera movement and position-based parameters.
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
    this.camera.position.add(this.velocity.clone().multiplyScalar(delta));

    // Keep within bounds (soft limits)
    this.camera.position.x = Math.max(-25, Math.min(25, this.camera.position.x));
    this.camera.position.z = Math.max(-5, Math.min(35, this.camera.position.z));
    this.camera.position.y = 1.6; // Fixed height

    // Update camera rotation
    this.camera.quaternion.setFromEuler(
      new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ')
    );
  }

  /**
   * Updates threshold state based on current position.
   */
  private updateThresholdState(delta: number): void {
    // Calculate parameters from position
    const params = calculateZoneParameters(
      this.camera.position.x,
      this.camera.position.z,
      this.pitch
    );

    // Update targets
    this.state.setTargets(
      params.fogDensity,
      params.flowScale,
      params.flowComplexity,
      params.density,
      params.verticalBias
    );

    // Smooth interpolation
    this.state.update(delta);

    // Update fog based on current state
    const currentValues = this.state.getCurrentValues();
    if (this.scene.fog instanceof THREE.Fog) {
      const fogNear = 5 + (1 - currentValues.fogDensity * 20) * 10;
      const fogFar = 25 + (1 - currentValues.fogDensity * 20) * 30;
      this.scene.fog.near = fogNear;
      this.scene.fog.far = fogFar;
    }
  }

  /**
   * Main animation loop.
   */
  private animate = (time: number): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const deltaTime = this.lastTime === 0 ? 0 : (time - this.lastTime) / 1000;
    this.lastTime = time;

    // Cap delta to prevent large jumps
    const cappedDelta = Math.min(deltaTime, 0.1);

    // Update movement
    this.updateMovement(cappedDelta);

    // Update threshold state from position
    this.updateThresholdState(cappedDelta);

    // Update components
    this.preview?.update(this.state);
    this.colorOrbs?.update(this.camera.position, cappedDelta);
    this.focalPoint?.update(this.camera.position, cappedDelta);

    // Render
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Handles the commit action when user dwells at focal point.
   */
  private handleCommit(): void {
    if (!this.onCommitCallback) return;

    const config = this.state.getConfig();

    // Add any selected orb colors to palette
    const orbColors = this.colorOrbs?.getSelectedColors() || [];
    if (orbColors.length > 0) {
      config.palette.length = 0;
      config.palette.push(...orbColors);
    }

    this.onCommitCallback(config);
  }

  /**
   * Starts the threshold scene.
   */
  start(): void {
    this.lastTime = 0;
    this.animate(0);
  }

  /**
   * Registers callback for when user commits to enter the world.
   */
  onCommit(callback: (config: ThresholdConfig) => void): void {
    this.onCommitCallback = callback;
  }

  /**
   * Cleans up all resources.
   */
  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    // Clean up components
    this.preview?.dispose();
    this.colorOrbs?.dispose();
    this.focalPoint?.dispose();

    // Clean up renderer
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);

    // Remove event listeners
    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);
    this.renderer.domElement.removeEventListener('click', this.clickHandler);
    document.removeEventListener('pointerlockchange', this.pointerLockHandler);
    document.removeEventListener('mousemove', this.mouseMoveHandler);
    window.removeEventListener('resize', this.resizeHandler);
  }
}
