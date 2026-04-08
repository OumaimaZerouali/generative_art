package be.oz.generative_art_world.domain;

import be.oz.genart.random.SeededRandom;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.assertj.core.api.Assertions.assertThat;

class PaletteGeneratorTest {

    private final PaletteGenerator generator = new PaletteGenerator();

    @Nested
    class ColorCount {

        @ParameterizedTest
        @EnumSource(ColorHarmony.class)
        void eachHarmony_producesExactlyRequestedColorCount(ColorHarmony harmony) {
            // Given
            int requested = 6;
            var rng = new SeededRandom(42L);

            // When
            Palette palette = generator.generate(harmony, rng, requested);

            // Then
            assertThat(palette.colors())
                    .as("harmony %s should produce exactly %d colors", harmony, requested)
                    .hasSize(requested);
        }

        @ParameterizedTest
        @EnumSource(ColorHarmony.class)
        void eachHarmony_colorsAreValidHexStrings(ColorHarmony harmony) {
            // Given
            var rng = new SeededRandom(7L);

            // When
            Palette palette = generator.generate(harmony, rng, 5);

            // Then
            assertThat(palette.colors()).allSatisfy(color ->
                    assertThat(color).matches("#[0-9a-f]{6}"));
        }
    }

    @Nested
    class Determinism {

        @ParameterizedTest
        @EnumSource(ColorHarmony.class)
        void sameSeedAndHarmony_producesIdenticalPalette(ColorHarmony harmony) {
            // Given
            long seed = 12345L;
            int count = 5;

            // When
            Palette paletteA = generator.generate(harmony, new SeededRandom(seed), count);
            Palette paletteB = generator.generate(harmony, new SeededRandom(seed), count);

            // Then
            assertThat(paletteA.colors())
                    .as("harmony %s with seed %d must be deterministic", harmony, seed)
                    .isEqualTo(paletteB.colors());
        }

        @ParameterizedTest
        @EnumSource(ColorHarmony.class)
        void differentSeeds_producesDifferentPalettes(ColorHarmony harmony) {
            // Given
            int count = 6;

            // When
            Palette paletteA = generator.generate(harmony, new SeededRandom(1L), count);
            Palette paletteB = generator.generate(harmony, new SeededRandom(999L), count);

            // Then
            assertThat(paletteA.colors())
                    .as("harmony %s should differ across seeds", harmony)
                    .isNotEqualTo(paletteB.colors());
        }
    }
}
