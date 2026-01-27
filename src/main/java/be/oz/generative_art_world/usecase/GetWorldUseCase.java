package be.oz.generative_art_world.usecase;

import be.oz.generative_art_world.domain.WorldDefinition;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetWorldUseCase {

    private final WorldRepository worldRepository;

    public Optional<WorldDefinition> execute(UUID id) {
        return worldRepository.findById(id);
    }
}
