package be.oz.generative_art_world.usecase;

import be.oz.generative_art_world.domain.WorldDefinition;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExportWorldUseCaseTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final WorldRepository worldRepository = mock(WorldRepository.class);
    private final ExportWorldUseCase useCase = new ExportWorldUseCase(worldRepository, objectMapper);

    @Nested
    class Execute {

        @Test
        void unknownId_returnsEmpty() {
            // Given
            UUID id = UUID.randomUUID();
            when(worldRepository.findById(id)).thenReturn(Optional.empty());

            // When
            Optional<String> result = useCase.execute(id);

            // Then
            assertThat(result).isEmpty();
        }

        @Test
        void knownId_returnsJsonWithExpectedFields() {
            // Given
            UUID id = UUID.randomUUID();
            var world = new WorldDefinition(id, 42L, null, List.of(), List.of(), null, null, null);
            when(worldRepository.findById(id)).thenReturn(Optional.of(world));

            // When
            Optional<String> result = useCase.execute(id);

            // Then
            assertThat(result).isPresent();
            String json = result.get();
            assertThat(json).contains("\"seed\"");
            assertThat(json).contains("42");
        }

        @Test
        void exportedJson_containsWorldId() {
            // Given
            UUID id = UUID.randomUUID();
            var world = new WorldDefinition(id, 7L, null, List.of(), List.of(), null, null, null);
            when(worldRepository.findById(id)).thenReturn(Optional.of(world));

            // When
            String json = useCase.execute(id).orElseThrow();

            // Then
            assertThat(json).contains(id.toString());
        }
    }
}
