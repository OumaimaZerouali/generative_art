package be.oz.generative_art_world.usecase;

import be.oz.generative_art_world.domain.PatternType;
import be.oz.generative_art_world.domain.WorldDefinition;
import be.oz.generative_art_world.domain.WorldGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CreateWorldUseCase {

    private final WorldGenerator worldGenerator;
    private final WorldRepository worldRepository;

    public WorldDefinition execute(Long seed, Double flowScale, Double flowComplexity, Double density, Double verticalBias, Double fogDensity) {
        return execute(seed, flowScale, flowComplexity, density, verticalBias, fogDensity, null);
    }

    public WorldDefinition execute(Long seed, Double flowScale, Double flowComplexity, Double density, Double verticalBias, Double fogDensity, PatternType patternType) {
        var world = worldGenerator.generate(seed, flowScale, flowComplexity, density, verticalBias, fogDensity, null, patternType, null);

        return worldRepository.save(world);
    }
}
