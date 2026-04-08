package be.oz.generative_art_world.adapter.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface WorldJpaRepository extends JpaRepository<WorldEntity, UUID> {
}
