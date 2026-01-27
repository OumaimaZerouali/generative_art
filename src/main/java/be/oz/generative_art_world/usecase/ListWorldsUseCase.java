package be.oz.generative_art_world.usecase;

import be.oz.generative_art_world.domain.WorldDefinition;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ListWorldsUseCase {

    private final WorldRepository worldRepository;

    public List<WorldDefinition> execute() {
        return worldRepository.findAll();
    }
}
