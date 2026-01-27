import { WorldDefinition } from './types';
import { WorldScene } from './WorldScene';
import { WorldInterpreter } from './WorldInterpreter';
import { CameraController } from './CameraController';
import { WorldBounds } from './WorldBounds';
import { Presence } from './Presence';
import { SessionPersistence } from './SessionPersistence';
import { WorldTime } from '../engine/WorldTime';

/**
 * World
 *
 * The main orchestrator that brings together all world systems.
 * A world loads once, configures itself, and exists as a place
 * to inhabit.
 *
 * Phase 3: The world breathes through time.
 * Phase 4: The user exists inside the world through Presence.
 * Phase 5: The world remembers - ownership through permanence.
 *
 * Time is centralized here and passed to subsystems.
 */

// How often to save session state (in seconds)
// Not every frame - just enough to feel persistent
const SESSION_SAVE_INTERVAL = 5;

export class World {
  private readonly scene: WorldScene;
  private readonly interpreter: WorldInterpreter;
  private readonly camera: CameraController;
  private readonly bounds: WorldBounds;
  private readonly definition: WorldDefinition;
  private readonly worldTime: WorldTime;
  private readonly presence: Presence;

  // Phase 5: Session persistence
  private readonly session: SessionPersistence;
  private timeSinceLastSave: number = 0;

  private constructor(
    definition: WorldDefinition,
    scene: WorldScene,
    interpreter: WorldInterpreter,
    camera: CameraController,
    bounds: WorldBounds,
    worldTime: WorldTime,
    presence: Presence,
    session: SessionPersistence
  ) {
    this.definition = definition;
    this.scene = scene;
    this.interpreter = interpreter;
    this.camera = camera;
    this.bounds = bounds;
    this.worldTime = worldTime;
    this.presence = presence;
    this.session = session;
  }

  /**
   * Creates and initializes a world from a definition.
   *
   * Phase 5: Restores previous session if available.
   * Loading feels like arrival, not creation.
   */
  static create(definition: WorldDefinition, container: HTMLElement): World {
    const scene = new WorldScene(container);
    scene.configure(definition);

    const bounds = new WorldBounds(definition.bounds);

    // Phase 5: Pass seed to camera for deterministic breathing
    const camera = new CameraController(
      scene.camera,
      scene.renderer.domElement,
      definition.seed
    );

    // Phase 5: Create session persistence and try to restore
    const session = new SessionPersistence(definition.id);
    const previousSession = session.restore();

    if (previousSession) {
      // Returning to a world - restore where user was
      camera.restoreCameraState(previousSession.camera);
    } else {
      // First visit - spawn at safe position
      const spawnPosition = bounds.getSafeSpawnPosition();
      camera.setPosition(spawnPosition.x, spawnPosition.y, spawnPosition.z);
    }

    const interpreter = new WorldInterpreter(scene.scene, definition);
    interpreter.interpret(definition);

    // Phase 3: Create world time with the world's seed for determinism
    // Phase 5: Restore time phase for continuity if available
    const worldTime = new WorldTime(definition.seed);

    // Phase 4: Create presence (user's embodiment)
    const presence = new Presence(scene.scene, definition.palette);

    const world = new World(
      definition,
      scene,
      interpreter,
      camera,
      bounds,
      worldTime,
      presence,
      session
    );

    scene.onUpdate((delta) => {
      world.update(delta);
    });

    return world;
  }

  /**
   * Called every frame.
   *
   * Phase 3: Time advances and the world breathes.
   * Phase 4: Presence is updated to follow camera focus.
   * Phase 5: Session state saved periodically.
   *
   * All time-based updates flow from here.
   */
  private update(delta: number): void {
    // Phase 3: Advance world time
    this.worldTime.tick(delta);

    // Update camera/movement (includes Phase 5 breathing)
    this.camera.update(delta);

    // Constrain camera to bounds
    const position = this.camera.getPosition();
    const constrained = this.bounds.constrain(position);

    if (!position.equals(constrained)) {
      this.camera.setPosition(constrained.x, constrained.y, constrained.z);
    }

    // Phase 3: Update world geometry (breathing)
    this.interpreter.update(this.worldTime);

    // Phase 4: Update presence position and visibility
    // Phase 5: Include breath offset for subtle character height variation
    this.presence.update(
      this.camera.getPosition(),
      this.camera.getCameraPosition(),
      this.camera.getYaw(),
      this.camera.getBreathOffset()
    );

    // Phase 5: Periodically save session state
    // The world persists without asking
    this.timeSinceLastSave += delta;
    if (this.timeSinceLastSave >= SESSION_SAVE_INTERVAL) {
      this.saveSession();
      this.timeSinceLastSave = 0;
    }
  }

  /**
   * Phase 5: Save current session state.
   * No UI, no feedback - it just persists.
   */
  private saveSession(): void {
    this.session.save(
      this.camera.getCameraState(),
      this.worldTime.getElapsedTime()
    );
  }

  start(): void {
    this.scene.start();
  }

  pause(): void {
    this.scene.pause();
  }

  dispose(): void {
    // Save final state before leaving
    this.saveSession();
    this.presence.dispose();
    this.scene.dispose();
  }

  getId(): string {
    return this.definition.id;
  }
}
