package be.oz.generative_art_world.usecase;

import be.oz.generative_art_world.domain.WorldDefinition;
import be.oz.generative_art_world.domain.WorldGenerator;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CreateWorldUseCaseTest {

    @Mock
    private WorldGenerator worldGenerator;

    @Mock
    private WorldRepository worldRepository;

    @InjectMocks
    private CreateWorldUseCase useCase;

    @Nested
    class Execute {

        @Test
        void givenSeed_worldIsSavedAndReturned() {
            // Given
            long seed = 42L;
            var generated = stubWorld(seed);
            when(worldGenerator.generate(eq(seed), any(), any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(generated);
            when(worldRepository.save(generated)).thenReturn(generated);

            // When
            WorldDefinition result = useCase.execute(seed, null, null, null, null, null);

            // Then
            assertThat(result.getSeed()).isEqualTo(seed);
            verify(worldRepository).save(generated);
        }

        @Test
        void givenNullSeed_worldIsStillSaved() {
            // Given
            var generated = stubWorld(0L);
            when(worldGenerator.generate(eq(null), any(), any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(generated);
            when(worldRepository.save(generated)).thenReturn(generated);

            // When
            WorldDefinition result = useCase.execute(null, null, null, null, null, null);

            // Then
            assertThat(result).isNotNull();
            verify(worldRepository).save(generated);
        }

        @Test
        void returnedWorldIsExactlyWhatRepositorySaves() {
            // Given
            long seed = 99L;
            var generated = stubWorld(seed);
            var saved = stubWorld(seed);
            when(worldGenerator.generate(eq(seed), any(), any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(generated);
            when(worldRepository.save(generated)).thenReturn(saved);

            // When
            WorldDefinition result = useCase.execute(seed, null, null, null, null, null);

            // Then
            assertThat(result).isSameAs(saved);
        }
    }

    private WorldDefinition stubWorld(long seed) {
        return new WorldDefinition(UUID.randomUUID(), seed, null, null, null, null, null, null);
    }
}
