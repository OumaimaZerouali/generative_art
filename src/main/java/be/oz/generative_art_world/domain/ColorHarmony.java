package be.oz.generative_art_world.domain;

/**
 * Color harmony types based on color theory.
 * These define relationships between colors on the color wheel.
 */
public enum ColorHarmony {
    /**
     * Colors opposite each other on the color wheel.
     * High contrast, vibrant look.
     */
    COMPLEMENTARY,

    /**
     * Colors next to each other on the color wheel.
     * Harmonious, serene look.
     */
    ANALOGOUS,

    /**
     * Three colors equally spaced on the color wheel.
     * Vibrant, balanced look.
     */
    TRIADIC,

    /**
     * Four colors forming a rectangle on the color wheel.
     * Rich, varied palette.
     */
    TETRADIC,

    /**
     * One base color with two colors adjacent to its complement.
     * High contrast with less tension than complementary.
     */
    SPLIT_COMPLEMENTARY,

    /**
     * Variations of a single hue.
     * Cohesive, elegant look.
     */
    MONOCHROMATIC,

    /**
     * Warm colors (reds, oranges, yellows).
     */
    WARM,

    /**
     * Cool colors (blues, greens, purples).
     */
    COOL,

    /**
     * Earth tones (browns, greens, muted oranges).
     */
    EARTH,

    /**
     * Pastel, soft colors.
     */
    PASTEL,

    /**
     * High saturation, vibrant neon colors.
     */
    NEON,

    /**
     * Random colors.
     */
    RANDOM
}
