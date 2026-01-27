package be.oz.generative_art_world.domain;

import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Generates various generative art patterns using different algorithms.
 */
@Component
public class PatternGenerator {

    /**
     * Generates a pattern based on the specified type.
     */
    public Pattern generate(PatternType type, Random random, Palette palette, WorldBounds bounds, float complexity) {
        return switch (type) {
            case FLOW_LINES -> generateFlowLines(random, palette, bounds, complexity);
            case L_SYSTEM -> generateLSystem(random, palette, bounds, complexity);
            case VORONOI -> generateVoronoi(random, palette, bounds, complexity);
            case SPIROGRAPH -> generateSpirograph(random, palette, bounds, complexity);
            case WAVE_INTERFERENCE -> generateWaveInterference(random, palette, bounds, complexity);
            case CELLULAR_AUTOMATA -> generateCellularAutomata(random, palette, bounds, complexity);
            case FRACTAL -> generateFractal(random, palette, bounds, complexity);
            case PARTICLE_SYSTEM -> generateParticleSystem(random, palette, bounds, complexity);
            case REACTION_DIFFUSION -> generateReactionDiffusion(random, palette, bounds, complexity);
            case CONCENTRIC -> generateConcentric(random, palette, bounds, complexity);
            case GEOMETRIC_GRID -> generateGeometricGrid(random, palette, bounds, complexity);
        };
    }

    /**
     * Flow lines following noise-based vector fields
     */
    private Pattern generateFlowLines(Random random, Palette palette, WorldBounds bounds, float complexity) {
        List<Pattern.Line3D> lines = new ArrayList<>();
        int lineCount = (int) (50 + complexity * 150);

        for (int i = 0; i < lineCount; i++) {
            List<Pattern.Point3D> vertices = new ArrayList<>();
            float x = (random.nextFloat() - 0.5f) * bounds.x() * 1.8f;
            float y = random.nextFloat() * bounds.y() * 0.3f;
            float z = (random.nextFloat() - 0.5f) * bounds.z() * 1.8f;

            int steps = 30 + (int) (complexity * 50);
            String color = palette.colors().get(random.nextInt(palette.colors().size()));

            for (int step = 0; step < steps; step++) {
                vertices.add(new Pattern.Point3D(x, y, z, color, 1.0f));

                // Perlin-like flow (simplified)
                float angle = noise(x * 0.1f, z * 0.1f, random.nextFloat()) * (float) Math.PI * 2;
                x += Math.cos(angle) * 0.5f;
                z += Math.sin(angle) * 0.5f;
                y += (noise(x * 0.05f, z * 0.05f, 0) - 0.5f) * 0.2f;
            }

            lines.add(new Pattern.Line3D(vertices, color, 1.0f + random.nextFloat()));
        }

        return new Pattern(PatternType.FLOW_LINES, List.of(), lines,
            new Pattern.PatternParameters((int) (complexity * 100), 1.0f, complexity, null));
    }

    /**
     * L-System: recursive grammar-based structures (trees, plants)
     */
    private Pattern generateLSystem(Random random, Palette palette, WorldBounds bounds, float complexity) {
        List<Pattern.Line3D> lines = new ArrayList<>();

        // L-System rules for tree-like structure
        String axiom = "F";
        Map<Character, String> rules = new HashMap<>();
        rules.put('F', "FF+[+F-F-F]-[-F+F+F]");

        int iterations = 2 + (int) (complexity * 2);
        String result = axiom;

        for (int i = 0; i < iterations; i++) {
            StringBuilder next = new StringBuilder();
            for (char c : result.toCharArray()) {
                next.append(rules.getOrDefault(c, String.valueOf(c)));
            }
            result = next.toString();
        }

        // Generate multiple L-system instances
        int instanceCount = 3 + (int) (complexity * 5);
        for (int instance = 0; instance < instanceCount; instance++) {
            float startX = (random.nextFloat() - 0.5f) * bounds.x() * 1.5f;
            float startZ = (random.nextFloat() - 0.5f) * bounds.z() * 1.5f;
            float scale = 0.3f + random.nextFloat() * 0.4f;

            List<Pattern.Point3D> vertices = new ArrayList<>();
            float x = startX, y = 0, z = startZ;
            float angle = -90; // Start pointing up
            float angleIncrement = 20 + random.nextFloat() * 15;

            Deque<float[]> stack = new ArrayDeque<>();
            String color = palette.colors().get(random.nextInt(palette.colors().size()));

            vertices.add(new Pattern.Point3D(x, y, z, color, 1.0f));

            for (char c : result.toCharArray()) {
                switch (c) {
                    case 'F' -> {
                        float rad = (float) Math.toRadians(angle);
                        x += Math.cos(rad) * scale;
                        y += Math.sin(rad) * scale * 0.5f;
                        z += (random.nextFloat() - 0.5f) * scale * 0.3f;
                        vertices.add(new Pattern.Point3D(x, y, z, color, 1.0f));
                    }
                    case '+' -> angle += angleIncrement;
                    case '-' -> angle -= angleIncrement;
                    case '[' -> stack.push(new float[]{x, y, z, angle});
                    case ']' -> {
                        if (!stack.isEmpty()) {
                            // Save current branch as a line
                            if (vertices.size() > 1) {
                                lines.add(new Pattern.Line3D(new ArrayList<>(vertices), color, 1.0f));
                            }
                            float[] state = stack.pop();
                            x = state[0]; y = state[1]; z = state[2]; angle = state[3];
                            vertices.clear();
                            vertices.add(new Pattern.Point3D(x, y, z, color, 1.0f));
                        }
                    }
                }
            }

            if (vertices.size() > 1) {
                lines.add(new Pattern.Line3D(vertices, color, 1.0f));
            }
        }

        return new Pattern(PatternType.L_SYSTEM, List.of(), lines,
            new Pattern.PatternParameters(iterations, 1.0f, complexity, "FF+[+F-F-F]-[-F+F+F]"));
    }

    /**
     * Voronoi diagram tessellation
     */
    private Pattern generateVoronoi(Random random, Palette palette, WorldBounds bounds, float complexity) {
        List<Pattern.Line3D> lines = new ArrayList<>();
        List<Pattern.Point3D> points = new ArrayList<>();

        int pointCount = 10 + (int) (complexity * 40);
        float[][] seeds = new float[pointCount][3];

        // Generate seed points
        for (int i = 0; i < pointCount; i++) {
            seeds[i][0] = (random.nextFloat() - 0.5f) * bounds.x() * 1.8f;
            seeds[i][1] = random.nextFloat() * 2; // Low height
            seeds[i][2] = (random.nextFloat() - 0.5f) * bounds.z() * 1.8f;

            String color = palette.colors().get(i % palette.colors().size());
            points.add(new Pattern.Point3D(seeds[i][0], seeds[i][1], seeds[i][2], color, 3.0f));
        }

        // Generate Voronoi edges (simplified using nearest neighbor)
        int gridResolution = 20 + (int) (complexity * 30);
        float stepX = bounds.x() * 2 / gridResolution;
        float stepZ = bounds.z() * 2 / gridResolution;

        for (int gx = 0; gx < gridResolution; gx++) {
            for (int gz = 0; gz < gridResolution; gz++) {
                float x = -bounds.x() + gx * stepX;
                float z = -bounds.z() + gz * stepZ;

                int nearest = findNearest(x, z, seeds);
                int nearestRight = (gx < gridResolution - 1) ? findNearest(x + stepX, z, seeds) : nearest;
                int nearestDown = (gz < gridResolution - 1) ? findNearest(x, z + stepZ, seeds) : nearest;

                String color = palette.colors().get(nearest % palette.colors().size());

                // Draw edge if crossing Voronoi boundary
                if (nearest != nearestRight) {
                    float y = seeds[nearest][1] * 0.5f + 0.1f;
                    List<Pattern.Point3D> edge = List.of(
                        new Pattern.Point3D(x + stepX * 0.5f, y, z, color, 1.0f),
                        new Pattern.Point3D(x + stepX * 0.5f, y, z + stepZ, color, 1.0f)
                    );
                    lines.add(new Pattern.Line3D(edge, color, 1.5f));
                }
                if (nearest != nearestDown) {
                    float y = seeds[nearest][1] * 0.5f + 0.1f;
                    List<Pattern.Point3D> edge = List.of(
                        new Pattern.Point3D(x, y, z + stepZ * 0.5f, color, 1.0f),
                        new Pattern.Point3D(x + stepX, y, z + stepZ * 0.5f, color, 1.0f)
                    );
                    lines.add(new Pattern.Line3D(edge, color, 1.5f));
                }
            }
        }

        return new Pattern(PatternType.VORONOI, points, lines,
            new Pattern.PatternParameters(pointCount, 1.0f, complexity, null));
    }

    /**
     * Spirograph patterns
     */
    private Pattern generateSpirograph(Random random, Palette palette, WorldBounds bounds, float complexity) {
        List<Pattern.Line3D> lines = new ArrayList<>();
        int patternCount = 3 + (int) (complexity * 5);

        for (int p = 0; p < patternCount; p++) {
            List<Pattern.Point3D> vertices = new ArrayList<>();
            String color = palette.colors().get(p % palette.colors().size());

            float R = 3 + random.nextFloat() * 5; // Outer radius
            float r = 1 + random.nextFloat() * 3; // Inner radius
            float d = 0.5f + random.nextFloat() * 2; // Pen distance

            float centerX = (random.nextFloat() - 0.5f) * bounds.x();
            float centerZ = (random.nextFloat() - 0.5f) * bounds.z();
            float y = 0.5f + random.nextFloat() * 2;

            int steps = 200 + (int) (complexity * 300);
            for (int i = 0; i < steps; i++) {
                float t = (float) (i * Math.PI * 2 / 100);
                float x = centerX + (R - r) * (float) Math.cos(t) + d * (float) Math.cos((R - r) / r * t);
                float z = centerZ + (R - r) * (float) Math.sin(t) - d * (float) Math.sin((R - r) / r * t);

                vertices.add(new Pattern.Point3D(x, y, z, color, 1.0f));
            }

            lines.add(new Pattern.Line3D(vertices, color, 1.0f + random.nextFloat()));
        }

        return new Pattern(PatternType.SPIROGRAPH, List.of(), lines,
            new Pattern.PatternParameters(patternCount, 1.0f, complexity, null));
    }

    /**
     * Wave interference patterns (moiré)
     */
    private Pattern generateWaveInterference(Random random, Palette palette, WorldBounds bounds, float complexity) {
        List<Pattern.Line3D> lines = new ArrayList<>();
        int waveCount = 2 + (int) (complexity * 3);

        // Generate concentric waves from multiple sources
        float[][] sources = new float[waveCount][2];
        for (int i = 0; i < waveCount; i++) {
            sources[i][0] = (random.nextFloat() - 0.5f) * bounds.x();
            sources[i][1] = (random.nextFloat() - 0.5f) * bounds.z();
        }

        int ringCount = 10 + (int) (complexity * 20);
        for (int source = 0; source < waveCount; source++) {
            String color = palette.colors().get(source % palette.colors().size());

            for (int ring = 1; ring <= ringCount; ring++) {
                float radius = ring * 1.5f;
                List<Pattern.Point3D> vertices = new ArrayList<>();

                int segments = 32 + (int) (complexity * 32);
                for (int i = 0; i <= segments; i++) {
                    float angle = (float) (i * Math.PI * 2 / segments);
                    float x = sources[source][0] + radius * (float) Math.cos(angle);
                    float z = sources[source][1] + radius * (float) Math.sin(angle);

                    // Calculate interference height
                    float y = 0.1f;
                    for (int s = 0; s < waveCount; s++) {
                        float dist = (float) Math.sqrt(
                            Math.pow(x - sources[s][0], 2) + Math.pow(z - sources[s][1], 2)
                        );
                        y += (float) Math.sin(dist * 0.5f) * 0.3f;
                    }

                    vertices.add(new Pattern.Point3D(x, Math.max(0.1f, y), z, color, 1.0f));
                }

                lines.add(new Pattern.Line3D(vertices, color, 0.8f));
            }
        }

        return new Pattern(PatternType.WAVE_INTERFERENCE, List.of(), lines,
            new Pattern.PatternParameters(waveCount, 1.0f, complexity, null));
    }

    /**
     * Cellular automata (1D projected to 2D)
     */
    private Pattern generateCellularAutomata(Random random, Palette palette, WorldBounds bounds, float complexity) {
        List<Pattern.Point3D> points = new ArrayList<>();

        int width = 50 + (int) (complexity * 100);
        int generations = 30 + (int) (complexity * 50);
        int rule = random.nextInt(256); // Rule number (0-255)

        boolean[] cells = new boolean[width];
        cells[width / 2] = true; // Start with single cell

        float cellSize = bounds.x() * 2 / width;

        for (int gen = 0; gen < generations; gen++) {
            String color = palette.colors().get(gen % palette.colors().size());

            for (int i = 0; i < width; i++) {
                if (cells[i]) {
                    float x = -bounds.x() + i * cellSize;
                    float z = -bounds.z() * 0.5f + gen * cellSize * 0.5f;
                    points.add(new Pattern.Point3D(x, 0.2f, z, color, cellSize * 0.8f));
                }
            }

            // Apply rule
            boolean[] next = new boolean[width];
            for (int i = 1; i < width - 1; i++) {
                int pattern = (cells[i - 1] ? 4 : 0) + (cells[i] ? 2 : 0) + (cells[i + 1] ? 1 : 0);
                next[i] = ((rule >> pattern) & 1) == 1;
            }
            cells = next;
        }

        return new Pattern(PatternType.CELLULAR_AUTOMATA, points, List.of(),
            new Pattern.PatternParameters(generations, 1.0f, complexity, "Rule " + rule));
    }

    /**
     * Fractal patterns (recursive subdivision)
     */
    private Pattern generateFractal(Random random, Palette palette, WorldBounds bounds, float complexity) {
        List<Pattern.Line3D> lines = new ArrayList<>();
        int depth = 3 + (int) (complexity * 3);

        // Generate multiple fractal trees
        int treeCount = 2 + (int) (complexity * 3);
        for (int t = 0; t < treeCount; t++) {
            String color = palette.colors().get(t % palette.colors().size());
            float startX = (random.nextFloat() - 0.5f) * bounds.x() * 1.5f;
            float startZ = (random.nextFloat() - 0.5f) * bounds.z() * 1.5f;

            generateFractalBranch(lines, startX, 0, startZ, 3.0f, -90, depth, color, random);
        }

        return new Pattern(PatternType.FRACTAL, List.of(), lines,
            new Pattern.PatternParameters(depth, 1.0f, complexity, null));
    }

    private void generateFractalBranch(List<Pattern.Line3D> lines, float x, float y, float z,
                                       float length, float angle, int depth, String color, Random random) {
        if (depth <= 0 || length < 0.1f) return;

        float rad = (float) Math.toRadians(angle);
        float endX = x + length * (float) Math.cos(rad);
        float endY = y + length * (float) Math.sin(rad) * 0.7f;
        float endZ = z + (random.nextFloat() - 0.5f) * length * 0.3f;

        List<Pattern.Point3D> vertices = List.of(
            new Pattern.Point3D(x, y, z, color, 1.0f),
            new Pattern.Point3D(endX, endY, endZ, color, 1.0f)
        );
        lines.add(new Pattern.Line3D(vertices, color, depth * 0.5f));

        float branchAngle = 25 + random.nextFloat() * 20;
        float lengthRatio = 0.6f + random.nextFloat() * 0.2f;

        generateFractalBranch(lines, endX, endY, endZ, length * lengthRatio, angle + branchAngle, depth - 1, color, random);
        generateFractalBranch(lines, endX, endY, endZ, length * lengthRatio, angle - branchAngle, depth - 1, color, random);
    }

    /**
     * Particle system with trails
     */
    private Pattern generateParticleSystem(Random random, Palette palette, WorldBounds bounds, float complexity) {
        List<Pattern.Line3D> lines = new ArrayList<>();
        int particleCount = 20 + (int) (complexity * 80);

        for (int i = 0; i < particleCount; i++) {
            List<Pattern.Point3D> trail = new ArrayList<>();
            String color = palette.colors().get(i % palette.colors().size());

            float x = (random.nextFloat() - 0.5f) * bounds.x();
            float y = random.nextFloat() * 3;
            float z = (random.nextFloat() - 0.5f) * bounds.z();

            float vx = (random.nextFloat() - 0.5f) * 0.3f;
            float vy = (random.nextFloat() - 0.5f) * 0.1f;
            float vz = (random.nextFloat() - 0.5f) * 0.3f;

            int steps = 20 + (int) (complexity * 40);
            for (int step = 0; step < steps; step++) {
                trail.add(new Pattern.Point3D(x, y, z, color, 1.0f));

                // Simple physics with attraction to center
                float dx = -x * 0.01f;
                float dz = -z * 0.01f;

                vx += dx;
                vz += dz;

                x += vx;
                y += vy;
                z += vz;

                y = Math.max(0.1f, y);
            }

            lines.add(new Pattern.Line3D(trail, color, 1.0f));
        }

        return new Pattern(PatternType.PARTICLE_SYSTEM, List.of(), lines,
            new Pattern.PatternParameters(particleCount, 1.0f, complexity, null));
    }

    /**
     * Reaction-diffusion (simplified Turing patterns)
     */
    private Pattern generateReactionDiffusion(Random random, Palette palette, WorldBounds bounds, float complexity) {
        List<Pattern.Point3D> points = new ArrayList<>();

        int size = 30 + (int) (complexity * 40);
        float[][] grid = new float[size][size];

        // Initialize with noise
        for (int x = 0; x < size; x++) {
            for (int z = 0; z < size; z++) {
                grid[x][z] = random.nextFloat();
            }
        }

        // Simple reaction-diffusion iterations
        int iterations = 10 + (int) (complexity * 20);
        for (int iter = 0; iter < iterations; iter++) {
            float[][] next = new float[size][size];
            for (int x = 1; x < size - 1; x++) {
                for (int z = 1; z < size - 1; z++) {
                    float laplacian = grid[x-1][z] + grid[x+1][z] + grid[x][z-1] + grid[x][z+1] - 4 * grid[x][z];
                    next[x][z] = grid[x][z] + laplacian * 0.2f;
                    next[x][z] = Math.max(0, Math.min(1, next[x][z]));
                }
            }
            grid = next;
        }

        // Convert to points
        float cellSize = bounds.x() * 2 / size;
        for (int x = 0; x < size; x++) {
            for (int z = 0; z < size; z++) {
                if (grid[x][z] > 0.5f) {
                    float px = -bounds.x() + x * cellSize;
                    float pz = -bounds.z() + z * cellSize;
                    float py = grid[x][z] * 0.5f;
                    int colorIdx = (int) (grid[x][z] * palette.colors().size()) % palette.colors().size();
                    String color = palette.colors().get(colorIdx);
                    points.add(new Pattern.Point3D(px, py, pz, color, cellSize * 0.6f));
                }
            }
        }

        return new Pattern(PatternType.REACTION_DIFFUSION, points, List.of(),
            new Pattern.PatternParameters(iterations, 1.0f, complexity, null));
    }

    /**
     * Concentric circles/rings
     */
    private Pattern generateConcentric(Random random, Palette palette, WorldBounds bounds, float complexity) {
        List<Pattern.Line3D> lines = new ArrayList<>();
        int centerCount = 2 + (int) (complexity * 4);

        for (int c = 0; c < centerCount; c++) {
            float cx = (random.nextFloat() - 0.5f) * bounds.x();
            float cz = (random.nextFloat() - 0.5f) * bounds.z();

            int ringCount = 5 + (int) (complexity * 15);
            for (int ring = 1; ring <= ringCount; ring++) {
                List<Pattern.Point3D> vertices = new ArrayList<>();
                String color = palette.colors().get((c + ring) % palette.colors().size());
                float radius = ring * 1.2f;
                float y = 0.1f + ring * 0.1f;

                int segments = 32 + (int) (complexity * 32);
                for (int i = 0; i <= segments; i++) {
                    float angle = (float) (i * Math.PI * 2 / segments);
                    float x = cx + radius * (float) Math.cos(angle);
                    float z = cz + radius * (float) Math.sin(angle);
                    vertices.add(new Pattern.Point3D(x, y, z, color, 1.0f));
                }

                lines.add(new Pattern.Line3D(vertices, color, 1.5f));
            }
        }

        return new Pattern(PatternType.CONCENTRIC, List.of(), lines,
            new Pattern.PatternParameters(centerCount, 1.0f, complexity, null));
    }

    /**
     * Geometric grid patterns
     */
    private Pattern generateGeometricGrid(Random random, Palette palette, WorldBounds bounds, float complexity) {
        List<Pattern.Line3D> lines = new ArrayList<>();

        int gridSize = 5 + (int) (complexity * 10);
        float cellSize = bounds.x() * 2 / gridSize;

        for (int gx = 0; gx < gridSize; gx++) {
            for (int gz = 0; gz < gridSize; gz++) {
                float x = -bounds.x() + gx * cellSize + cellSize / 2;
                float z = -bounds.z() + gz * cellSize + cellSize / 2;
                String color = palette.colors().get((gx + gz) % palette.colors().size());

                // Random geometric shape in each cell
                int shapeType = random.nextInt(4);
                float y = 0.2f + random.nextFloat() * 0.5f;
                float size = cellSize * 0.4f;

                List<Pattern.Point3D> vertices = switch (shapeType) {
                    case 0 -> createSquare(x, y, z, size, color);
                    case 1 -> createTriangle(x, y, z, size, color);
                    case 2 -> createDiamond(x, y, z, size, color);
                    default -> createCross(x, y, z, size, color);
                };

                lines.add(new Pattern.Line3D(vertices, color, 1.5f));
            }
        }

        return new Pattern(PatternType.GEOMETRIC_GRID, List.of(), lines,
            new Pattern.PatternParameters(gridSize * gridSize, 1.0f, complexity, null));
    }

    // Helper methods for geometric shapes
    private List<Pattern.Point3D> createSquare(float x, float y, float z, float size, String color) {
        return List.of(
            new Pattern.Point3D(x - size, y, z - size, color, 1.0f),
            new Pattern.Point3D(x + size, y, z - size, color, 1.0f),
            new Pattern.Point3D(x + size, y, z + size, color, 1.0f),
            new Pattern.Point3D(x - size, y, z + size, color, 1.0f),
            new Pattern.Point3D(x - size, y, z - size, color, 1.0f)
        );
    }

    private List<Pattern.Point3D> createTriangle(float x, float y, float z, float size, String color) {
        return List.of(
            new Pattern.Point3D(x, y, z - size, color, 1.0f),
            new Pattern.Point3D(x + size, y, z + size, color, 1.0f),
            new Pattern.Point3D(x - size, y, z + size, color, 1.0f),
            new Pattern.Point3D(x, y, z - size, color, 1.0f)
        );
    }

    private List<Pattern.Point3D> createDiamond(float x, float y, float z, float size, String color) {
        return List.of(
            new Pattern.Point3D(x, y, z - size, color, 1.0f),
            new Pattern.Point3D(x + size, y, z, color, 1.0f),
            new Pattern.Point3D(x, y, z + size, color, 1.0f),
            new Pattern.Point3D(x - size, y, z, color, 1.0f),
            new Pattern.Point3D(x, y, z - size, color, 1.0f)
        );
    }

    private List<Pattern.Point3D> createCross(float x, float y, float z, float size, String color) {
        List<Pattern.Point3D> points = new ArrayList<>();
        points.add(new Pattern.Point3D(x - size, y, z, color, 1.0f));
        points.add(new Pattern.Point3D(x + size, y, z, color, 1.0f));
        points.add(new Pattern.Point3D(x, y, z, color, 1.0f));
        points.add(new Pattern.Point3D(x, y, z - size, color, 1.0f));
        points.add(new Pattern.Point3D(x, y, z + size, color, 1.0f));
        return points;
    }

    // Simple noise function
    private float noise(float x, float y, float z) {
        return (float) (Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453 % 1.0);
    }

    private int findNearest(float x, float z, float[][] points) {
        int nearest = 0;
        float minDist = Float.MAX_VALUE;
        for (int i = 0; i < points.length; i++) {
            float dist = (float) (Math.pow(x - points[i][0], 2) + Math.pow(z - points[i][2], 2));
            if (dist < minDist) {
                minDist = dist;
                nearest = i;
            }
        }
        return nearest;
    }
}
