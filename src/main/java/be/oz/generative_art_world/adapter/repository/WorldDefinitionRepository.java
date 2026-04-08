package be.oz.generative_art_world.adapter.repository;

import be.oz.generative_art_world.domain.WorldDefinition;
import be.oz.generative_art_world.usecase.WorldRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class WorldDefinitionRepository implements WorldRepository {

    private final WorldJpaRepository jpaRepository;
    private final ObjectMapper objectMapper;

    @Override
    public WorldDefinition save(WorldDefinition world) {
        var entity = WorldEntity.fromDomain(world, objectMapper);
        jpaRepository.save(entity);
        return world;
    }

    @Override
    public Optional<WorldDefinition> findById(UUID id) {
        return jpaRepository.findById(id).map(e -> e.toDomain(objectMapper));
    }

    @Override
    public List<WorldDefinition> findAll() {
        return jpaRepository.findAll().stream()
                .map(e -> e.toDomain(objectMapper))
                .toList();
    }
}
