package be.oz.generative_art_world.adapter.repository;

import be.oz.generative_art_world.domain.AmbientSettings;
import be.oz.generative_art_world.domain.FlowField;
import be.oz.generative_art_world.domain.GeometryField;
import be.oz.generative_art_world.domain.Palette;
import be.oz.generative_art_world.domain.Pattern;
import be.oz.generative_art_world.domain.WorldBounds;
import be.oz.generative_art_world.domain.WorldDefinition;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "worlds")
public class WorldEntity {

    @Getter
    @Id
    private UUID id;

    private long seed;

    @Column(columnDefinition = "TEXT")
    private String paletteJson;

    @Column(columnDefinition = "TEXT")
    private String flowFieldsJson;

    @Column(columnDefinition = "TEXT")
    private String geometryFieldsJson;

    @Column(columnDefinition = "TEXT")
    private String ambientJson;

    @Column(columnDefinition = "TEXT")
    private String boundsJson;

    @Column(columnDefinition = "TEXT")
    private String patternJson;

    protected WorldEntity() {}

    private WorldEntity(UUID id, long seed, String paletteJson, String flowFieldsJson,
                        String geometryFieldsJson, String ambientJson, String boundsJson,
                        String patternJson) {
        this.id = id;
        this.seed = seed;
        this.paletteJson = paletteJson;
        this.flowFieldsJson = flowFieldsJson;
        this.geometryFieldsJson = geometryFieldsJson;
        this.ambientJson = ambientJson;
        this.boundsJson = boundsJson;
        this.patternJson = patternJson;
    }

    public static WorldEntity fromDomain(WorldDefinition world, ObjectMapper mapper) {
        try {
            var palette = world.getPalette() != null ? world.getPalette().colors() : List.<String>of();
            return new WorldEntity(
                    world.getId(),
                    world.getSeed(),
                    mapper.writeValueAsString(palette),
                    mapper.writeValueAsString(world.getFlowFields()),
                    mapper.writeValueAsString(world.getGeometryFields()),
                    mapper.writeValueAsString(world.getAmbientSettings()),
                    mapper.writeValueAsString(world.getBounds()),
                    world.getPattern() != null ? mapper.writeValueAsString(world.getPattern()) : null
            );
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize world " + world.getId(), e);
        }
    }

    public WorldDefinition toDomain(ObjectMapper mapper) {
        try {
            List<String> colors = mapper.readValue(paletteJson, new TypeReference<>() {});
            List<FlowField> flowFields = mapper.readValue(flowFieldsJson, new TypeReference<>() {});
            List<GeometryField> geometryFields = mapper.readValue(geometryFieldsJson, new TypeReference<>() {});
            AmbientSettings ambient = mapper.readValue(ambientJson, AmbientSettings.class);
            WorldBounds bounds = mapper.readValue(boundsJson, WorldBounds.class);
            Pattern pattern = patternJson != null ? mapper.readValue(patternJson, Pattern.class) : null;
            return new WorldDefinition(
                    id,
                    seed,
                    new Palette(colors),
                    flowFields,
                    geometryFields,
                    ambient,
                    bounds,
                    pattern
            );
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize world " + id, e);
        }
    }
}
