package be.oz.generative_art_world.domain;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class WorldGenerator {

    private final PaletteGenerator paletteGenerator;
    private final PatternGenerator patternGenerator;

    /**
     * Generate world with full customization options.
     *
     * @param seed Base seed for randomness
     * @param flowScale Flow field intensity (0.5-2.0)
     * @param flowComplexity Number of flow layers (0.0-1.0)
     * @param density Geometry density (0.0-1.0)
     * @param verticalBias Vertical vs horizontal emphasis (0.0-1.0)
     * @param fogDensity Fog intensity (0.01-0.05)
     * @param colorHarmony Color harmony type (optional)
     * @param patternType Pattern algorithm type (optional)
     * @param paletteColors Custom palette colors (optional)
     */
    public WorldDefinition generate(Long seed, Double flowScale, Double flowComplexity,
                                   Double density, Double verticalBias, Double fogDensity,
                                   ColorHarmony colorHarmony, PatternType patternType,
                                   List<String> paletteColors) {
        var actualSeed = seed != null ? seed : System.currentTimeMillis();
        var random = new Random(actualSeed);

        // Generate or use provided palette
        Palette palette;
        if (paletteColors != null && !paletteColors.isEmpty()) {
            palette = new Palette(paletteColors);
        } else {
            var harmony = colorHarmony != null ? colorHarmony : ColorHarmony.ANALOGOUS;
            palette = paletteGenerator.generate(harmony, random, 5 + random.nextInt(3));
        }

        // Generate bounds first (needed for pattern generation)
        var bounds = generateBounds(random);

        // Generate pattern if specified
        Pattern pattern = null;
        if (patternType != null) {
            float complexity = density != null ? density.floatValue() : 0.5f;
            pattern = patternGenerator.generate(patternType, random, palette, bounds, complexity);
        }

        return new WorldDefinition(
                UUID.randomUUID(),
                actualSeed,
                palette,
                generateFlowFields(random, flowScale, flowComplexity),
                generateGeometryFields(random, density, verticalBias),
                generateAmbientSettings(random, fogDensity),
                bounds,
                pattern
        );
    }

    /**
     * Generate world from basic parameters.
     */
    public WorldDefinition generate(Long seed, Double flowScale, Double flowComplexity,
                                   Double density, Double verticalBias, Double fogDensity) {
        return generate(seed, flowScale, flowComplexity, density, verticalBias, fogDensity,
                       null, null, null);
    }

    /**
     * Legacy method for backward compatibility.
     */
    public WorldDefinition generate(Long seed) {
        return generate(seed, 1.0, 0.5, 0.5, 0.5, 0.025);
    }

    /**
     * Flow fields influenced by parameters.
     */
    private List<FlowField> generateFlowFields(Random random, Double flowScale, Double flowComplexity) {
        List<FlowField> fields = new ArrayList<>();

        var scale = flowScale != null ? flowScale : 1.0;
        var complexity = flowComplexity != null ? flowComplexity : 0.5;

        // Complexity determines number of layers (1-3)
        var fieldCount = 1 + (int)(complexity * 2);
        FlowFieldType[] types = FlowFieldType.values();

        for (int i = 0; i < fieldCount; i++) {
            fields.add(new FlowField(
                    types[random.nextInt(types.length)],
                    scale.floatValue(),
                    0.3f + random.nextFloat() * 0.5f
            ));
        }
        return fields;
    }

    /**
     * Geometry influenced by parameters.
     */
    private List<GeometryField> generateGeometryFields(Random random, Double density, Double verticalBias) {
        List<GeometryField> fields = new ArrayList<>();
        String[] geometryTypes = {"sphere", "cube", "cylinder", "torus", "cone"};

        var actualDensity = density != null ? density : 0.5;
        var actualVerticalBias = verticalBias != null ? verticalBias : 0.5;

        // Density determines number of fields (1-4)
        var fieldCount = 1 + (int)(actualDensity * 3);

        for (int i = 0; i < fieldCount; i++) {
            fields.add(new GeometryField(
                    geometryTypes[random.nextInt(geometryTypes.length)],
                    actualDensity.floatValue(),
                    0.5f + actualVerticalBias.floatValue() * 2.0f
            ));
        }

        return fields;
    }

    /**
     * Ambient settings influenced by parameters.
     */
    private AmbientSettings generateAmbientSettings(Random random, Double fogDensity) {
        var actualFogDensity = fogDensity != null ? fogDensity : 0.025;
        return new AmbientSettings(
                0.3f + random.nextFloat() * 0.7f,
                random.nextFloat() * 0.5f,
                actualFogDensity.floatValue()
        );
    }

    private WorldBounds generateBounds(Random random) {
        return new WorldBounds(
                50f + random.nextFloat() * 100f,
                20f + random.nextFloat() * 30f, // Lower height
                50f + random.nextFloat() * 100f
        );
    }
}
