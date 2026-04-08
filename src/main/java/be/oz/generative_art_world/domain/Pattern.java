package be.oz.generative_art_world.domain;

import java.util.List;

public record Pattern(
    PatternType type,
    List<Point3D> points,
    List<Line3D> lines,
    PatternParameters parameters
) {
    public record Point3D(float x, float y, float z, String color, float size) {}

    public record Line3D(
        List<Point3D> vertices,
        String color,
        float width
    ) {}

    public record PatternParameters(
        int iterations,
        float scale,
        float complexity,
        String rule
    ) {}
}
