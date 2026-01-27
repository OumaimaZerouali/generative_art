package be.oz.generative_art_world.domain;

/**
 * Types of generative art patterns/algorithms.
 */
public enum PatternType {
    /**
     * Lines following flow fields (current default behavior)
     */
    FLOW_LINES,

    /**
     * L-System based recursive structures (trees, plants, fractals)
     */
    L_SYSTEM,

    /**
     * Voronoi diagram tessellation
     */
    VORONOI,

    /**
     * Spirograph-like patterns from overlapping circles
     */
    SPIROGRAPH,

    /**
     * Wave interference patterns (moiré)
     */
    WAVE_INTERFERENCE,

    /**
     * Cellular automata patterns
     */
    CELLULAR_AUTOMATA,

    /**
     * Fractal patterns (recursive subdivision)
     */
    FRACTAL,

    /**
     * Particle system with attraction/repulsion
     */
    PARTICLE_SYSTEM,

    /**
     * Reaction-diffusion patterns (Turing patterns)
     */
    REACTION_DIFFUSION,

    /**
     * Concentric circles/rings
     */
    CONCENTRIC,

    /**
     * Grid-based geometric patterns
     */
    GEOMETRIC_GRID
}
