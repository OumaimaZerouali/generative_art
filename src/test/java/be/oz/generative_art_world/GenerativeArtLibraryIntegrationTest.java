package be.oz.generative_art_world;

import be.oz.genart.field.Fields;
import be.oz.genart.math.Vec2;
import be.oz.genart.random.SeededRandom;
import be.oz.genart.random.GaussianDistribution;
import be.oz.genart.random.UniformDistribution;
import be.oz.genart.structure.Path;
import be.oz.genart.structure.Polyline;
import be.oz.genart.structure.SvgSerializer;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

/**
 * Integration test verifying the generative-art-library works correctly
 * as a dependency in this project.
 *
 * Tests cover the full pipeline: seeded randomness → field sampling → path tracing → SVG output.
 */
class GenerativeArtLibraryIntegrationTest {

    @Nested
    class SeededRandomness {

        @Test
        void shouldProduceDeterministicSequenceGivenSameSeed() {
            // Given
            var rng1 = new SeededRandom(42L);
            var rng2 = new SeededRandom(42L);

            // When
            var value1 = rng1.nextDouble();
            var value2 = rng2.nextDouble();

            // Then
            assertThat(value1).isEqualTo(value2);
        }

        @Test
        void shouldProduceDifferentSequencesForDifferentSeeds() {
            // Given
            var rng1 = new SeededRandom(1L);
            var rng2 = new SeededRandom(2L);

            // When
            var value1 = rng1.nextDouble();
            var value2 = rng2.nextDouble();

            // Then
            assertThat(value1).isNotEqualTo(value2);
        }

        @Test
        void gaussianDistributionShouldConvergeToExpectedMean() {
            // Given
            var rng = new SeededRandom(99L);
            var dist = new GaussianDistribution(0.0, 1.0);

            // When
            var sum = 0.0;
            for (int i = 0; i < 10_000; i++) {
                sum += dist.sample(rng);
            }
            var mean = sum / 10_000;

            // Then
            assertThat(mean).isCloseTo(0.0, within(0.05));
        }

        @Test
        void uniformDistributionShouldStayWithinBounds() {
            // Given
            var rng = new SeededRandom(7L);
            var dist = new UniformDistribution(-50.0, 50.0);

            // When / Then
            for (int i = 0; i < 1_000; i++) {
                var sample = dist.sample(rng);
                assertThat(sample).isBetween(-50.0, 50.0);
            }
        }
    }

    @Nested
    class FieldSampling {

        @Test
        void perlinFieldShouldBeDeterministicAtSamePoint() {
            // Given
            var field1 = Fields.perlin(42L, 0.1);
            var field2 = Fields.perlin(42L, 0.1);
            var point = new Vec2(3.5, 7.2);

            // When
            var value1 = field1.sample(point);
            var value2 = field2.sample(point);

            // Then
            assertThat(value1).isEqualTo(value2);
        }

        @Test
        void fbmFieldShouldProduceValuesInReasonableRange() {
            // Given
            var field = Fields.fbm(42L, 4, 2.0, 0.5);
            var rng = new SeededRandom(42L);

            // When - sample at 100 random points and collect values
            var values = new ArrayList<Double>();
            for (int i = 0; i < 100; i++) {
                var point = new Vec2(rng.nextDouble(-10, 10), rng.nextDouble(-10, 10));
                values.add(field.sample(point));
            }

            // Then - fBm output should stay within a reasonable range
            assertThat(values).allMatch(v -> v >= -2.0 && v <= 2.0);
        }

        @Test
        void curlFieldShouldProducePerpendicularVectors() {
            // Given
            var field = Fields.curl();
            var point = new Vec2(1.0, 0.0);

            // When - curl of a radial field at (1,0) should point in the y direction
            var result = field.sample(point);

            // Then - curl rotates the radial vector 90°: (1,0) becomes (0,1) rotated
            // at point (1,0), radial = (1,0), curl = (-0, 1) = (0, 1)
            assertThat(result.x()).isCloseTo(0.0, within(1e-10));
            assertThat(result.y()).isCloseTo(1.0, within(1e-10));
        }

        @Test
        void composedFieldShouldAddValues() {
            // Given
            var field1 = Fields.constant(2.0);
            var field2 = Fields.constant(3.0);
            var point = new Vec2(0.0, 0.0);

            // When
            var composed = Fields.add(field1, field2);
            var result = composed.sample(point);

            // Then
            assertThat(result).isCloseTo(5.0, within(1e-10));
        }
    }

    @Nested
    class PathTracing {

        @Test
        void shouldTraceFlowLineThroughVectorField() {
            // Given
            var noiseField = Fields.perlin(42L, 0.05);
            // Use the noise field to generate angles, creating a smooth flow field
            var flowField = (be.oz.genart.field.VectorField) point ->
                Vec2.polar(noiseField.sample(point) * Math.PI * 2, 0.5);

            var start = new Vec2(0.0, 0.0);
            int steps = 50;

            // When - trace a path by stepping along the flow field
            var points = new ArrayList<Vec2>();
            points.add(start);
            var current = start;
            for (int i = 0; i < steps; i++) {
                var direction = flowField.sample(current);
                current = current.plus(direction);
                points.add(current);
            }
            var path = Path.of(points);

            // Then
            assertThat(path.size()).isEqualTo(51);
            assertThat(path.totalLength()).isGreaterThan(0.0);
            assertThat(path.start()).isEqualTo(start);
        }

        @Test
        void flowLineShouldBeDeterministicGivenSameSeed() {
            // Given - same seed → same field → same path
            var traceWithSeed = (java.util.function.LongFunction<String>) seed -> {
                var field = Fields.perlin(seed, 0.05);
                var flowField = (be.oz.genart.field.VectorField) point ->
                    Vec2.polar(field.sample(point) * Math.PI * 2, 0.5);

                var points = new ArrayList<Vec2>();
                var current = new Vec2(0.0, 0.0);
                points.add(current);
                for (int i = 0; i < 20; i++) {
                    current = current.plus(flowField.sample(current));
                    points.add(current);
                }
                return SvgSerializer.toPathString(Path.of(points));
            };

            // When
            var svg1 = traceWithSeed.apply(77L);
            var svg2 = traceWithSeed.apply(77L);

            // Then
            assertThat(svg1).isEqualTo(svg2);
        }
    }

    @Nested
    class SvgOutput {

        @Test
        void shouldSerializePathToValidSvgString() {
            // Given
            var path = Path.of(new Vec2(0, 0), new Vec2(10, 5), new Vec2(20, 0));

            // When
            var svg = SvgSerializer.toPathString(path);

            // Then
            assertThat(svg).startsWith("M ");
            assertThat(svg).contains("L ");
        }

        @Test
        void shouldSerializePolylineAsClosedPath() {
            // Given
            var polyline = Polyline.regularPolygon(new Vec2(0, 0), 5.0, 6);

            // When
            var svg = SvgSerializer.toPathString(polyline);

            // Then
            assertThat(svg).startsWith("M ");
            assertThat(svg).endsWith("Z");
            assertThat(svg).contains("L ");
        }

        @Test
        void shouldWrapPathInSvgElement() {
            // Given
            var path = Path.of(new Vec2(0, 0), new Vec2(5, 5));

            // When
            var element = SvgSerializer.toSvgElement(path, "stroke=\"red\" fill=\"none\"");

            // Then
            assertThat(element).startsWith("<path");
            assertThat(element).contains("d=\"");
            assertThat(element).contains("stroke=\"red\"");
            assertThat(element).endsWith("/>");
        }

        @Test
        void svgOutputShouldBeDeterministicForSamePath() {
            // Given
            var field = Fields.perlin(123L, 0.1);
            var points = new ArrayList<Vec2>();
            var current = new Vec2(1.0, 1.0);
            points.add(current);
            for (int i = 0; i < 10; i++) {
                current = current.plus(new Vec2(field.sample(current), field.sample(current.plus(new Vec2(100, 0)))));
                points.add(current);
            }
            var path = Path.of(points);

            // When
            var svg1 = SvgSerializer.toPathString(path);
            var svg2 = SvgSerializer.toPathString(path);

            // Then - same path always produces same SVG
            assertThat(svg1).isEqualTo(svg2);
        }
    }
}
