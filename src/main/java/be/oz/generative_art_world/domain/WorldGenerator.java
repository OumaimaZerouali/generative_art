package be.oz.generative_art_world.domain;

import be.oz.genart.random.SeededRandom;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
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
        var rng = new SeededRandom(actualSeed);

        // Generate or use provided palette
        Palette palette;
        if (paletteColors != null && !paletteColors.isEmpty()) {
            palette = new Palette(paletteColors);
        } else {
            var harmony = colorHarmony != null ? colorHarmony : ColorHarmony.ANALOGOUS;
            palette = paletteGenerator.generate(harmony, rng, 5 + rng.nextInt(3));
        }

        // Generate bounds first (needed for pattern generation)
        var bounds = generateBounds(rng);

        // Generate pattern if specified
        Pattern pattern = null;
        if (patternType != null) {
            float complexity = density != null ? density.floatValue() : 0.5f;
            pattern = patternGenerator.generate(patternType, rng, palette, bounds, complexity);
        }

        return new WorldDefinition(
                UUID.randomUUID(),
                actualSeed,
                palette,
                generateFlowFields(rng, flowScale, flowComplexity),
                generateGeometryFields(rng, density, verticalBias),
                generateAmbientSettings(rng, fogDensity),
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
    private List<FlowField> generateFlowFields(SeededRandom rng, Double flowScale, Double flowComplexity) {
        List<FlowField> fields = new ArrayList<>();

        Double scale = flowScale != null ? flowScale : 1.0;
        Double complexity = flowComplexity != null ? flowComplexity : 0.5;

        // Complexity determines number of layers (1-3)
        var fieldCount = 1 + (int)(complexity * 2);
        FlowFieldType[] types = FlowFieldType.values();

        for (int i = 0; i < fieldCount; i++) {
            FlowFieldType type = types[rng.nextInt(types.length)];
            long fieldSeed = rng.nextLong();
            fields.add(new FlowField(
                    type,
                    scale.floatValue(),
                    0.3f + (float) rng.nextDouble() * 0.5f,
                    fieldSeed
            ));
        }
        return fields;
    }

    /**
     * Geometry influenced by parameters.
     */
    private List<GeometryField> generateGeometryFields(SeededRandom rng, Double density, Double verticalBias) {
        List<GeometryField> fields = new ArrayList<>();
        String[] geometryTypes = {"sphere", "cube", "cylinder", "torus", "cone"};

        Double actualDensity = density != null ? density : 0.5;
        Double actualVerticalBias = verticalBias != null ? verticalBias : 0.5;

        // Density determines number of fields (1-4)
        var fieldCount = 1 + (int)(actualDensity * 3);

        for (int i = 0; i < fieldCount; i++) {
            fields.add(new GeometryField(
                    geometryTypes[rng.nextInt(geometryTypes.length)],
                    actualDensity.floatValue(),
                    0.5f + actualVerticalBias.floatValue() * 2.0f
            ));
        }

        return fields;
    }

    /**
     * Ambient settings influenced by parameters.
     */
    private AmbientSettings generateAmbientSettings(SeededRandom rng, Double fogDensity) {
        Double actualFogDensity = fogDensity != null ? fogDensity : 0.025;
        return new AmbientSettings(
                0.3f + (float) rng.nextDouble() * 0.7f,
                (float) rng.nextDouble() * 0.5f,
                actualFogDensity.floatValue()
        );
    }

    private WorldBounds generateBounds(SeededRandom rng) {
        return new WorldBounds(
                50f + (float) rng.nextDouble() * 100f,
                20f + (float) rng.nextDouble() * 30f, // Lower height
                50f + (float) rng.nextDouble() * 100f
        );
    }
}
