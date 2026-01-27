package be.oz.generative_art_world.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

@Getter
@RequiredArgsConstructor
public class WorldDefinition {

    private final UUID id;
    private final long seed;
    private final Palette palette;
    private final List<FlowField> flowFields;
    private final List<GeometryField> geometryFields;
    private final AmbientSettings ambientSettings;
    private final WorldBounds bounds;
    private final Pattern pattern; // New: generated pattern data
}
