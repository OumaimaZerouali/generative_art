package be.oz.generative_art_world.usecase;

import be.oz.generative_art_world.domain.WorldDefinition;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorldRepository {
    WorldDefinition save(WorldDefinition world);
    Optional<WorldDefinition> findById(UUID id);
    List<WorldDefinition> findAll();
}
