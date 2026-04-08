package be.oz.generative_art_world.usecase;

import be.oz.generative_art_world.domain.WorldDefinition;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetWorldUseCaseTest {

    @Mock
    private WorldRepository worldRepository;

    @InjectMocks
    private GetWorldUseCase useCase;

    @Nested
    class Execute {

        @Test
        void unknownId_returnsEmpty() {
            // Given
            UUID id = UUID.randomUUID();
            when(worldRepository.findById(id)).thenReturn(Optional.empty());

            // When
            Optional<WorldDefinition> result = useCase.execute(id);

            // Then
            assertThat(result).isEmpty();
        }

        @Test
        void knownId_returnsWorld() {
            // Given
            UUID id = UUID.randomUUID();
            var world = new WorldDefinition(id, 1L, null, null, null, null, null, null);
            when(worldRepository.findById(id)).thenReturn(Optional.of(world));

            // When
            Optional<WorldDefinition> result = useCase.execute(id);

            // Then
            assertThat(result).isPresent();
            assertThat(result.get().getId()).isEqualTo(id);
        }
    }
}
