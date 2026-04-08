package be.oz.generative_art_world.domain;

import be.oz.genart.random.SeededRandom;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.util.ArrayList;
import java.util.List;

/**
 * Generates color palettes based on color theory principles.
 * Uses HSB (Hue, Saturation, Brightness) color model for harmony calculations.
 */
@Component
public class PaletteGenerator {

    /**
     * Generates a palette based on the specified color harmony.
     *
     * @param harmony The color harmony type
     * @param rng Seeded random generator for variations
     * @param colorCount Number of colors to generate
     * @return A Palette with harmonious colors
     */
    public Palette generate(ColorHarmony harmony, SeededRandom rng, int colorCount) {
        float baseHue = (float) rng.nextDouble(); // 0-1 range

        List<String> colors = switch (harmony) {
            case COMPLEMENTARY -> generateComplementary(baseHue, rng, colorCount);
            case ANALOGOUS -> generateAnalogous(baseHue, rng, colorCount);
            case TRIADIC -> generateTriadic(baseHue, rng, colorCount);
            case TETRADIC -> generateTetradic(baseHue, rng, colorCount);
            case SPLIT_COMPLEMENTARY -> generateSplitComplementary(baseHue, rng, colorCount);
            case MONOCHROMATIC -> generateMonochromatic(baseHue, rng, colorCount);
            case WARM -> generateWarm(rng, colorCount);
            case COOL -> generateCool(rng, colorCount);
            case EARTH -> generateEarth(rng, colorCount);
            case PASTEL -> generatePastel(baseHue, rng, colorCount);
            case NEON -> generateNeon(baseHue, rng, colorCount);
            case RANDOM -> generateRandom(rng, colorCount);
        };

        return new Palette(colors);
    }

    /**
     * Complementary: base color + opposite on color wheel
     */
    private List<String> generateComplementary(float baseHue, SeededRandom rng, int count) {
        List<String> colors = new ArrayList<>();
        float complementHue = (baseHue + 0.5f) % 1.0f;

        for (int i = 0; i < count; i++) {
            float hue = (i % 2 == 0) ? baseHue : complementHue;
            hue = addVariation(hue, rng, 0.05f);
            float saturation = 0.5f + (float) rng.nextDouble() * 0.4f;
            float brightness = 0.5f + (float) rng.nextDouble() * 0.4f;
            colors.add(hsbToHex(hue, saturation, brightness));
        }
        return colors;
    }

    /**
     * Analogous: colors adjacent on the color wheel (30 degrees apart)
     */
    private List<String> generateAnalogous(float baseHue, SeededRandom rng, int count) {
        List<String> colors = new ArrayList<>();
        float step = 1.0f / 12.0f; // 30 degrees

        for (int i = 0; i < count; i++) {
            float hue = (baseHue + (i - count / 2) * step) % 1.0f;
            if (hue < 0) hue += 1.0f;
            hue = addVariation(hue, rng, 0.02f);
            float saturation = 0.5f + (float) rng.nextDouble() * 0.4f;
            float brightness = 0.5f + (float) rng.nextDouble() * 0.4f;
            colors.add(hsbToHex(hue, saturation, brightness));
        }
        return colors;
    }

    /**
     * Triadic: three colors equally spaced (120 degrees apart)
     */
    private List<String> generateTriadic(float baseHue, SeededRandom rng, int count) {
        List<String> colors = new ArrayList<>();
        float[] hues = {baseHue, (baseHue + 1.0f / 3.0f) % 1.0f, (baseHue + 2.0f / 3.0f) % 1.0f};

        for (int i = 0; i < count; i++) {
            float hue = addVariation(hues[i % 3], rng, 0.05f);
            float saturation = 0.5f + (float) rng.nextDouble() * 0.4f;
            float brightness = 0.5f + (float) rng.nextDouble() * 0.4f;
            colors.add(hsbToHex(hue, saturation, brightness));
        }
        return colors;
    }

    /**
     * Tetradic: four colors forming a rectangle (90 degrees apart)
     */
    private List<String> generateTetradic(float baseHue, SeededRandom rng, int count) {
        List<String> colors = new ArrayList<>();
        float[] hues = {
            baseHue,
            (baseHue + 0.25f) % 1.0f,
            (baseHue + 0.5f) % 1.0f,
            (baseHue + 0.75f) % 1.0f
        };

        for (int i = 0; i < count; i++) {
            float hue = addVariation(hues[i % 4], rng, 0.05f);
            float saturation = 0.5f + (float) rng.nextDouble() * 0.4f;
            float brightness = 0.5f + (float) rng.nextDouble() * 0.4f;
            colors.add(hsbToHex(hue, saturation, brightness));
        }
        return colors;
    }

    /**
     * Split-complementary: base + two colors adjacent to complement
     */
    private List<String> generateSplitComplementary(float baseHue, SeededRandom rng, int count) {
        List<String> colors = new ArrayList<>();
        float complement = (baseHue + 0.5f) % 1.0f;
        float[] hues = {
            baseHue,
            (complement - 1.0f / 12.0f + 1.0f) % 1.0f,
            (complement + 1.0f / 12.0f) % 1.0f
        };

        for (int i = 0; i < count; i++) {
            float hue = addVariation(hues[i % 3], rng, 0.03f);
            float saturation = 0.5f + (float) rng.nextDouble() * 0.4f;
            float brightness = 0.5f + (float) rng.nextDouble() * 0.4f;
            colors.add(hsbToHex(hue, saturation, brightness));
        }
        return colors;
    }

    /**
     * Monochromatic: variations of a single hue
     */
    private List<String> generateMonochromatic(float baseHue, SeededRandom rng, int count) {
        List<String> colors = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            float hue = addVariation(baseHue, rng, 0.02f);
            float saturation = 0.2f + (i / (float) count) * 0.6f;
            float brightness = 0.3f + (float) rng.nextDouble() * 0.6f;
            colors.add(hsbToHex(hue, saturation, brightness));
        }
        return colors;
    }

    /**
     * Warm colors: reds, oranges, yellows (hue 0-60 degrees)
     */
    private List<String> generateWarm(SeededRandom rng, int count) {
        List<String> colors = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            float hue = (float) rng.nextDouble() * (1.0f / 6.0f); // 0-60 degrees
            float saturation = 0.6f + (float) rng.nextDouble() * 0.35f;
            float brightness = 0.5f + (float) rng.nextDouble() * 0.4f;
            colors.add(hsbToHex(hue, saturation, brightness));
        }
        return colors;
    }

    /**
     * Cool colors: blues, greens, purples (hue 180-300 degrees)
     */
    private List<String> generateCool(SeededRandom rng, int count) {
        List<String> colors = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            float hue = 0.5f + (float) rng.nextDouble() * (1.0f / 3.0f); // 180-300 degrees
            float saturation = 0.5f + (float) rng.nextDouble() * 0.4f;
            float brightness = 0.4f + (float) rng.nextDouble() * 0.5f;
            colors.add(hsbToHex(hue, saturation, brightness));
        }
        return colors;
    }

    /**
     * Earth tones: browns, greens, muted oranges
     */
    private List<String> generateEarth(SeededRandom rng, int count) {
        List<String> colors = new ArrayList<>();
        // Earth hues: oranges (30), browns (20-40), greens (80-140)
        float[] earthHues = {0.08f, 0.1f, 0.12f, 0.25f, 0.3f, 0.35f};

        for (int i = 0; i < count; i++) {
            float hue = earthHues[rng.nextInt(earthHues.length)];
            hue = addVariation(hue, rng, 0.03f);
            float saturation = 0.3f + (float) rng.nextDouble() * 0.4f;
            float brightness = 0.3f + (float) rng.nextDouble() * 0.4f;
            colors.add(hsbToHex(hue, saturation, brightness));
        }
        return colors;
    }

    /**
     * Pastel: soft, low saturation colors
     */
    private List<String> generatePastel(float baseHue, SeededRandom rng, int count) {
        List<String> colors = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            float hue = (baseHue + i * 0.1f) % 1.0f;
            hue = addVariation(hue, rng, 0.05f);
            float saturation = 0.2f + (float) rng.nextDouble() * 0.25f; // Low saturation
            float brightness = 0.8f + (float) rng.nextDouble() * 0.15f; // High brightness
            colors.add(hsbToHex(hue, saturation, brightness));
        }
        return colors;
    }

    /**
     * Neon: high saturation, vibrant colors
     */
    private List<String> generateNeon(float baseHue, SeededRandom rng, int count) {
        List<String> colors = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            float hue = (baseHue + i * 0.15f) % 1.0f;
            hue = addVariation(hue, rng, 0.05f);
            float saturation = 0.9f + (float) rng.nextDouble() * 0.1f; // Very high saturation
            float brightness = 0.9f + (float) rng.nextDouble() * 0.1f; // Very high brightness
            colors.add(hsbToHex(hue, saturation, brightness));
        }
        return colors;
    }

    /**
     * Random colors
     */
    private List<String> generateRandom(SeededRandom rng, int count) {
        List<String> colors = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            colors.add(String.format("#%06x", rng.nextInt(0xFFFFFF + 1)));
        }
        return colors;
    }

    /**
     * Add small random variation to a value
     */
    private float addVariation(float value, SeededRandom rng, float maxVariation) {
        float variation = ((float) rng.nextDouble() - 0.5f) * 2 * maxVariation;
        return (value + variation + 1.0f) % 1.0f;
    }

    /**
     * Convert HSB to hex color string
     */
    private String hsbToHex(float hue, float saturation, float brightness) {
        int rgb = Color.HSBtoRGB(hue, saturation, brightness);
        return String.format("#%06x", rgb & 0xFFFFFF);
    }
}
