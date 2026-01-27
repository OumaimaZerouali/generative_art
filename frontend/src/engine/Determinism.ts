/**
 * Determinism Utilities
 *
 * Provides seed-based randomness for reproducible world generation.
 * Every value generated from the same seed will always be identical.
 */

export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Returns a deterministic pseudo-random number between 0 and 1.
   * Uses a simple but effective mulberry32 algorithm.
   */
  next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a deterministic number within a range.
   */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Returns a deterministic integer within a range (inclusive).
   */
  rangeInt(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /**
   * Picks a random element from an array deterministically.
   */
  pick<T>(array: readonly T[]): T {
    const index = this.rangeInt(0, array.length - 1);
    return array[index];
  }

  /**
   * Returns a deterministic gaussian-distributed number.
   * Useful for organic-feeling distributions.
   */
  gaussian(mean = 0, stdDev = 1): number {
    const u1 = this.next();
    const u2 = this.next();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }
}

/**
 * Creates a hash from a string, useful for deriving sub-seeds.
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Creates a deterministic sub-seed from a parent seed and a namespace.
 * This allows different world aspects to have independent but reproducible randomness.
 */
export function deriveSeed(parentSeed: number, namespace: string): number {
  return parentSeed ^ hashString(namespace);
}
