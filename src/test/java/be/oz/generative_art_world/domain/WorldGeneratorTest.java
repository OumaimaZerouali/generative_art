package be.oz.generative_art_world.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class WorldGeneratorTest {

    private final WorldGenerator generator = new WorldGenerator(new PaletteGenerator(), new PatternGenerator());

    @Test
    void sameSeed_producesIdenticalPaletteFlowFieldsAndBounds() {
        // Given
        long seed = 42L;

        // When
        var worldA = generator.generate(seed);
        var worldB = generator.generate(seed);

        // Then
        assertThat(worldA.getSeed()).isEqualTo(worldB.getSeed());
        assertThat(worldA.getPalette().colors()).isEqualTo(worldB.getPalette().colors());
        assertThat(worldA.getFlowFields()).isEqualTo(worldB.getFlowFields());
        assertThat(worldA.getBounds()).isEqualTo(worldB.getBounds());
        assertThat(worldA.getGeometryFields()).isEqualTo(worldB.getGeometryFields());
        assertThat(worldA.getAmbientSettings()).isEqualTo(worldB.getAmbientSettings());
    }

    @Test
    void differentSeeds_produceDifferentPalettes() {
        // Given
        long seedA = 1L;
        long seedB = 999L;

        // When
        var worldA = generator.generate(seedA);
        var worldB = generator.generate(seedB);

        // Then
        assertThat(worldA.getPalette().colors())
                .isNotEqualTo(worldB.getPalette().colors());
    }

    @Test
    void nullSeed_stillProducesAWorld() {
        // Given
        Long seed = null;

        // When
        var world = generator.generate(seed);

        // Then
        assertThat(world).isNotNull();
        assertThat(world.getId()).isNotNull();
        assertThat(world.getPalette()).isNotNull();
        assertThat(world.getPalette().colors()).isNotEmpty();
        assertThat(world.getFlowFields()).isNotEmpty();
        assertThat(world.getBounds()).isNotNull();
    }
}
