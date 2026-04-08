package be.oz.generative_art_world.adapter.controller;

import be.oz.generative_art_world.adapter.model.CreateWorldRequest;
import be.oz.generative_art_world.adapter.model.WorldDefinition;
import be.oz.generative_art_world.domain.PatternType;
import be.oz.generative_art_world.usecase.CreateWorldUseCase;
import be.oz.generative_art_world.usecase.ExportWorldUseCase;
import be.oz.generative_art_world.usecase.GetWorldUseCase;
import be.oz.generative_art_world.usecase.ListWorldsUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class WorldController implements WorldApi {

    private final GetWorldUseCase getWorldUseCase;
    private final ListWorldsUseCase listWorldsUseCase;
    private final CreateWorldUseCase createWorldUseCase;
    private final ExportWorldUseCase exportWorldUseCase;
    private final WorldMapper worldMapper;

    @Override
    public ResponseEntity<List<WorldDefinition>> worldGet() {
        List<WorldDefinition> worlds = listWorldsUseCase.execute().stream()
                .map(worldMapper::toApi)
                .toList();
        return ResponseEntity.ok(worlds);
    }

    @Override
    public ResponseEntity<Resource> worldIdExportGet(UUID id) {
        return exportWorldUseCase.execute(id)
                .map(json -> {
                    ByteArrayResource resource = new ByteArrayResource(json.getBytes(StandardCharsets.UTF_8));
                    return ResponseEntity.ok((Resource) resource);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @Override
    public ResponseEntity<WorldDefinition> worldIdGet(UUID id) {
        return getWorldUseCase.execute(id)
                .map(worldMapper::toApi)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Override
    public ResponseEntity<WorldDefinition> worldPost(CreateWorldRequest createWorldRequest) {
        var seed = createWorldRequest.getSeed();
        var flowScale = createWorldRequest.getFlowScale();
        var flowComplexity = createWorldRequest.getFlowComplexity();
        var density = createWorldRequest.getDensity();
        var verticalBias = createWorldRequest.getVerticalBias();
        var fogDensity = createWorldRequest.getFogDensity();
        var apiPatternType = createWorldRequest.getPatternType();
        PatternType patternType = apiPatternType != null ? PatternType.valueOf(apiPatternType.name()) : null;

        var created = createWorldUseCase.execute(seed, flowScale, flowComplexity, density, verticalBias, fogDensity, patternType);

        return ResponseEntity.status(201).body(worldMapper.toApi(created));
    }
}
