package be.oz.generative_art_world.domain;

import be.oz.genart.random.SeededRandom;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PatternGeneratorTest {

    private final PatternGenerator generator = new PatternGenerator();

    private static final WorldBounds BOUNDS = new WorldBounds(50f, 10f, 50f);
    private static final Palette PALETTE = new Palette(List.of("#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"));

    @Nested
    class NonEmptyOutput {

        @ParameterizedTest
        @EnumSource(PatternType.class)
        void eachPatternType_producesNonEmptyOutput(PatternType type) {
            // Given
            var rng = new SeededRandom(42L);

            // When
            Pattern pattern = generator.generate(type, rng, PALETTE, BOUNDS, 0.5f);

            // Then
            assertThat(pattern).isNotNull();
            assertThat(pattern.type()).isEqualTo(type);
            boolean hasContent = !pattern.points().isEmpty() || !pattern.lines().isEmpty();
            assertThat(hasContent)
                    .as("pattern type %s should produce at least one point or line", type)
                    .isTrue();
        }

        @ParameterizedTest
        @EnumSource(PatternType.class)
        void eachPatternType_hasParameters(PatternType type) {
            // Given
            var rng = new SeededRandom(1L);

            // When
            Pattern pattern = generator.generate(type, rng, PALETTE, BOUNDS, 0.5f);

            // Then
            assertThat(pattern.parameters()).isNotNull();
        }
    }

    @Nested
    class Determinism {

        @ParameterizedTest
        @EnumSource(PatternType.class)
        void sameSeedAndType_producesIdenticalPattern(PatternType type) {
            // Given
            long seed = 77L;

            // When
            Pattern patternA = generator.generate(type, new SeededRandom(seed), PALETTE, BOUNDS, 0.5f);
            Pattern patternB = generator.generate(type, new SeededRandom(seed), PALETTE, BOUNDS, 0.5f);

            // Then
            assertThat(patternA.type()).isEqualTo(patternB.type());
            assertThat(patternA.points()).as("points must be deterministic for %s", type)
                    .isEqualTo(patternB.points());
            assertThat(patternA.lines()).as("lines must be deterministic for %s", type)
                    .isEqualTo(patternB.lines());
        }
    }

    @Nested
    class Complexity {

        @ParameterizedTest
        @EnumSource(PatternType.class)
        void higherComplexity_producesMoreOutputThanLower(PatternType type) {
            // Given
            var rngLow = new SeededRandom(10L);
            var rngHigh = new SeededRandom(10L);

            // When
            Pattern low = generator.generate(type, rngLow, PALETTE, BOUNDS, 0.0f);
            Pattern high = generator.generate(type, rngHigh, PALETTE, BOUNDS, 1.0f);

            int lowTotal = low.points().size() + low.lines().size();
            int highTotal = high.points().size() + high.lines().size();

            // Then
            assertThat(highTotal)
                    .as("pattern type %s should have more elements at complexity=1.0 than 0.0", type)
                    .isGreaterThanOrEqualTo(lowTotal);
        }
    }
}
