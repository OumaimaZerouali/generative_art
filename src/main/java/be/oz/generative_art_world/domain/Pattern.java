package be.oz.generative_art_world.domain;

import java.util.List;

/**
 * A generated pattern consisting of points and lines.
 * This is the output of pattern generation algorithms.
 */
public record Pattern(
    PatternType type,
    List<Point3D> points,
    List<Line3D> lines,
    PatternParameters parameters
) {
    /**
     * A 3D point in the pattern.
     */
    public record Point3D(float x, float y, float z, String color, float size) {}

    /**
     * A 3D line segment in the pattern.
     */
    public record Line3D(
        List<Point3D> vertices,
        String color,
        float width
    ) {}

    /**
     * Parameters used to generate this pattern.
     */
    public record PatternParameters(
        int iterations,
        float scale,
        float complexity,
        String rule // For L-systems
    ) {}
}
