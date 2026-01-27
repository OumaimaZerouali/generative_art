package be.oz.generative_art_world.domain;

public record AmbientSettings(
    float lightIntensity,
    float fogDensity,
    float motionNoise
) {}
