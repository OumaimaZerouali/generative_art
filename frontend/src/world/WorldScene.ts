import * as THREE from 'three';
import { WorldDefinition, AmbientSettings } from './types';

/**
 * World Scene
 *
 * Sets up the Three.js scene with fog, lighting, and rendering.
 * Creates a calm, ambient environment that feels safe and continuous.
 */
export class WorldScene {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;

  private animationFrameId: number | null = null;
  private clock: THREE.Clock;
  private updateCallbacks: Array<(delta: number) => void> = [];

  constructor(container: HTMLElement) {
    // Scene setup
    this.scene = new THREE.Scene();

    // Camera with gentle field of view
    this.camera = new THREE.PerspectiveCamera(
      60, // FOV - not too wide, not too narrow
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 1.6, 0); // Eye level height

    // Renderer with soft antialiasing
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // Clock for consistent timing
    this.clock = new THREE.Clock();

    // Handle window resize
    const handleResize = () => {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);
  }

  /**
   * Configures the scene based on world definition.
   */
  configure(world: WorldDefinition): void {
    this.configureAmbient(world.ambient, world.palette);
  }

  /**
   * Sets up lighting and fog based on ambient settings.
   *
   * Fog is mandatory - it defines emotional distance.
   * Fog must hide far geometry.
   * Lighting must be soft and ambient - no harsh shadows.
   */
  private configureAmbient(ambient: AmbientSettings, palette: readonly string[]): void {
    // Background color from palette (darkened for depth)
    const bgColor = palette.length > 0
      ? new THREE.Color(palette[0]).multiplyScalar(0.12)
      : new THREE.Color(0x080810);

    this.scene.background = bgColor;

    // Fog - ALWAYS present. Fog defines emotional distance.
    // Density tuned so far geometry fades naturally
    const fogDensity = Math.max(0.008, Math.min(0.025, ambient.fogDensity * 0.15));
    this.scene.fog = new THREE.FogExp2(bgColor, fogDensity);

    // Clear existing lights
    this.scene.children
      .filter(child => child instanceof THREE.Light)
      .forEach(light => this.scene.remove(light));

    // Ambient light - soft, always present
    const ambientLight = new THREE.AmbientLight(
      0xffffff,
      ambient.lightIntensity * 0.4
    );
    this.scene.add(ambientLight);

    // Hemisphere light - creates natural sky/ground color variation
    const skyColor = palette.length > 1
      ? new THREE.Color(palette[1]).multiplyScalar(0.3)
      : new THREE.Color(0x2a2a3f);
    const groundColor = palette.length > 2
      ? new THREE.Color(palette[2]).multiplyScalar(0.1)
      : new THREE.Color(0x0a0a0f);

    const hemiLight = new THREE.HemisphereLight(
      skyColor,
      groundColor,
      ambient.lightIntensity * 0.3
    );
    this.scene.add(hemiLight);

    // Soft directional light - no harsh shadows
    const dirLight = new THREE.DirectionalLight(
      0xffffff,
      ambient.lightIntensity * 0.2
    );
    dirLight.position.set(50, 100, 50);
    this.scene.add(dirLight);
  }

  /**
   * Register a callback to be called on each frame.
   */
  onUpdate(callback: (delta: number) => void): void {
    this.updateCallbacks.push(callback);
  }

  /**
   * Starts the render loop.
   */
  start(): void {
    if (this.animationFrameId !== null) return;

    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      const delta = this.clock.getDelta();

      // Call all update callbacks
      for (const callback of this.updateCallbacks) {
        callback(delta);
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  /**
   * Pauses the render loop.
   */
  pause(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Cleans up resources.
   */
  dispose(): void {
    this.pause();
    this.renderer.dispose();
    this.scene.clear();
  }
}

