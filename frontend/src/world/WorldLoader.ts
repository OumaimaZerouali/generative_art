import { WorldDefinition } from './types';

/**
 * World Loader
 *
 * Fetches a WorldDefinition from the backend.
 * Each world is loaded exactly once and treated as immutable.
 */

const API_BASE = '/api';

export class WorldLoader {
  /**
   * Fetches a world by its ID.
   * Returns null if the world is not found.
   */
  async load(worldId: string): Promise<WorldDefinition | null> {
    try {
      const response = await fetch(`${API_BASE}/world/${worldId}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to load world: ${response.status}`);
      }

      const data = await response.json();
      return this.freeze(data);
    } catch (error) {
      console.error('WorldLoader: Failed to fetch world', error);
      throw error;
    }
  }

  /**
   * Lists all available worlds.
   */
  async listWorlds(): Promise<WorldDefinition[]> {
    try {
      const response = await fetch(`${API_BASE}/world`);

      if (!response.ok) {
        throw new Error(`Failed to list worlds: ${response.status}`);
      }

      const data = await response.json();
      return data.map((world: WorldDefinition) => this.freeze(world));
    } catch (error) {
      console.error('WorldLoader: Failed to list worlds', error);
      throw error;
    }
  }

  /**
   * Creates a new world with user configuration.
   * Accepts parameters that influence world generation.
   */
  async createWorld(config?: {
    seed?: number;
    flowFieldType?: string;
    flowScale?: number;
    flowComplexity?: number;
    density?: number;
    verticalBias?: number;
    fogDensity?: number;
    palette?: string[];
  }): Promise<WorldDefinition> {
    try {
      const body = config || {};

      const response = await fetch(`${API_BASE}/world`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Failed to create world: ${response.status}`);
      }

      const data = await response.json();
      return this.freeze(data);
    } catch (error) {
      console.error('WorldLoader: Failed to create world', error);
      throw error;
    }
  }

  /**
   * Deep freezes a world definition to ensure immutability.
   */
  private freeze(world: WorldDefinition): WorldDefinition {
    return Object.freeze({
      ...world,
      palette: Object.freeze([...world.palette]),
      flowFields: Object.freeze(world.flowFields.map(f => Object.freeze({ ...f }))),
      geometryFields: Object.freeze(world.geometryFields.map(g => Object.freeze({ ...g }))),
      ambient: Object.freeze({ ...world.ambient }),
      bounds: Object.freeze({ ...world.bounds }),
    }) as WorldDefinition;
  }
}
