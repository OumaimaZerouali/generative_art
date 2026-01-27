package be.oz.generative_art_world.usecase;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class ExportWorldUseCase {

    private final ObjectMapper objectMapper;
    private final WorldRepository worldRepository;

    public ExportWorldUseCase(WorldRepository worldRepository) {
        this.worldRepository = worldRepository;
        this.objectMapper = new ObjectMapper();
    }

    public Optional<String> execute(UUID id) {
        return worldRepository.findById(id)
                .map(world -> {
                    try {
                        return objectMapper.writeValueAsString(world);
                    } catch (JsonProcessingException e) {
                        throw new RuntimeException("Failed to export world", e); //TODO proper exception handling
                    }
                });
    }
}
