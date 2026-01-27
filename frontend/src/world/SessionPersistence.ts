/**
 * Session Persistence
 *
 * Phase 5: Ownership, Permanence & Breath
 *
 * The world must behave as if it remembers the user.
 * Returning to a world must feel like returning to a place.
 * Loading must feel like arrival, not creation.
 *
 * Allowed forms of memory:
 * - Camera position persistence
 * - Orientation persistence
 * - Time phase persistence
 *
 * Disallowed:
 * - State changes
 * - World evolution due to actions
 * - Marks, trails, or edits
 *
 * The world does not change because of the user.
 * The user resumes where they were.
 */

const STORAGE_KEY_PREFIX = 'gaw_session_';

/**
 * Camera state that persists between sessions.
 */
export interface CameraState {
  readonly positionX: number;
  readonly positionY: number;
  readonly positionZ: number;
  readonly pitch: number;
  readonly yaw: number;
  readonly cameraDistance: number;
}

/**
 * Session state for a specific world.
 */
export interface SessionState {
  readonly worldId: string;
  readonly camera: CameraState;
  readonly timePhase: number; // Elapsed time for continuity
  readonly lastVisit: number; // Timestamp
}

/**
 * SessionPersistence handles saving and restoring user state.
 *
 * This creates a sense of ownership through permanence:
 * - The same world always looks the same
 * - Returning puts you where you were
 * - No visible "loading" or "saving" - it just is
 */
export class SessionPersistence {
  private readonly worldId: string;
  private readonly storageKey: string;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.storageKey = `${STORAGE_KEY_PREFIX}${worldId}`;
  }

  /**
   * Save current session state.
   * Called periodically, not on every frame.
   */
  save(camera: CameraState, timePhase: number): void {
    const state: SessionState = {
      worldId: this.worldId,
      camera,
      timePhase,
      lastVisit: Date.now(),
    };

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch {
      // Storage might be full or disabled - fail silently
      // The world persists without asking
    }
  }

  /**
   * Restore previous session state if it exists.
   * Returns null if no previous session or if data is invalid.
   */
  restore(): SessionState | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;

      const state = JSON.parse(stored) as SessionState;

      // Validate the state belongs to this world
      if (state.worldId !== this.worldId) return null;

      // Validate camera state has required fields
      if (!this.isValidCameraState(state.camera)) return null;

      return state;
    } catch {
      // Invalid JSON or other error - fail silently
      return null;
    }
  }

  /**
   * Check if a previous session exists for this world.
   */
  hasSession(): boolean {
    return this.restore() !== null;
  }

  /**
   * Clear session data for this world.
   * (Rarely needed, but available for completeness)
   */
  clear(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // Fail silently
    }
  }

  /**
   * Validate camera state structure.
   */
  private isValidCameraState(camera: unknown): camera is CameraState {
    if (!camera || typeof camera !== 'object') return false;

    const c = camera as Record<string, unknown>;
    return (
      typeof c.positionX === 'number' &&
      typeof c.positionY === 'number' &&
      typeof c.positionZ === 'number' &&
      typeof c.pitch === 'number' &&
      typeof c.yaw === 'number' &&
      typeof c.cameraDistance === 'number' &&
      Number.isFinite(c.positionX) &&
      Number.isFinite(c.positionY) &&
      Number.isFinite(c.positionZ) &&
      Number.isFinite(c.pitch) &&
      Number.isFinite(c.yaw) &&
      Number.isFinite(c.cameraDistance)
    );
  }
}

