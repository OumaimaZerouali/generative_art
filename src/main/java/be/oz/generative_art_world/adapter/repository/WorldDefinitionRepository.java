package be.oz.generative_art_world.adapter.repository;

import be.oz.generative_art_world.domain.WorldDefinition;
import be.oz.generative_art_world.usecase.WorldRepository;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class WorldDefinitionRepository implements WorldRepository {

    private final Map<UUID, WorldDefinition> storage = new ConcurrentHashMap<>();

    @Override
    public WorldDefinition save(WorldDefinition world) {
        storage.put(world.getId(), world);
        return world;
    }

    @Override
    public Optional<WorldDefinition> findById(UUID id) {
        return Optional.ofNullable(storage.get(id));
    }

    @Override
    public List<WorldDefinition> findAll() {
        return new ArrayList<>(storage.values());
    }
}
