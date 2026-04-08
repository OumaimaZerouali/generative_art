package be.oz.generative_art_world.adapter.repository;

import be.oz.generative_art_world.domain.AmbientSettings;
import be.oz.generative_art_world.domain.FlowField;
import be.oz.generative_art_world.domain.FlowFieldType;
import be.oz.generative_art_world.domain.GeometryField;
import be.oz.generative_art_world.domain.Palette;
import be.oz.generative_art_world.domain.WorldBounds;
import be.oz.generative_art_world.domain.WorldDefinition;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class WorldDefinitionRepositoryTest {

    @Autowired
    private WorldDefinitionRepository repository;

    @Autowired
    private WorldJpaRepository jpaRepository;

    @BeforeEach
    void clean() {
        jpaRepository.deleteAll();
    }

    @Test
    void save_thenFindById_returnsWorldWithSameSeedAndPalette() {
        // Given
        var world = sampleWorld(123L, List.of("#ff0000", "#00ff00", "#0000ff"));

        // When
        repository.save(world);
        Optional<WorldDefinition> loaded = repository.findById(world.getId());

        // Then
        assertThat(loaded).isPresent();
        assertThat(loaded.get().getId()).isEqualTo(world.getId());
        assertThat(loaded.get().getSeed()).isEqualTo(123L);
        assertThat(loaded.get().getPalette().colors())
                .containsExactly("#ff0000", "#00ff00", "#0000ff");
    }

    @Test
    void findAll_returnsAllSavedWorlds() {
        // Given
        var worldA = sampleWorld(1L, List.of("#111111"));
        var worldB = sampleWorld(2L, List.of("#222222"));

        // When
        repository.save(worldA);
        repository.save(worldB);
        List<WorldDefinition> all = repository.findAll();

        // Then
        assertThat(all).hasSize(2);
        assertThat(all).extracting(WorldDefinition::getSeed).containsExactlyInAnyOrder(1L, 2L);
    }

    @Test
    void findById_withUnknownId_returnsEmpty() {
        // Given
        var unknown = UUID.randomUUID();

        // When
        Optional<WorldDefinition> result = repository.findById(unknown);

        // Then
        assertThat(result).isEmpty();
    }

    private WorldDefinition sampleWorld(long seed, List<String> colors) {
        return new WorldDefinition(
                UUID.randomUUID(),
                seed,
                new Palette(colors),
                List.of(new FlowField(FlowFieldType.PERLIN_NOISE, 1.0f, 0.5f, 12345L)),
                List.of(new GeometryField("sphere", 0.5f, 1.2f)),
                new AmbientSettings(0.7f, 0.3f, 0.025f),
                new WorldBounds(100f, 40f, 100f),
                null
        );
    }
}
